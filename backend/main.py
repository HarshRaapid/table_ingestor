#%%
import os
import uuid
import shutil
import yaml
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Body, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.dialects.mysql import insert as mysql_insert

#%%
# Load config
with open("config.yaml") as f:
    config = yaml.safe_load(f)

# In-memory stores
uploads: Dict[str, str] = {}      # file_id -> filepath
mappings: Dict[str, dict] = {}     # mapping_id -> MappingRequest dict

app = FastAPI(title="Excel-to-MySQL ETL Service")

# Pydantic models
class CreateTableRequest(BaseModel):
    table_name: str
    columns: Dict[str, str]  # { column_name: sql_type }

class MappingRequest(BaseModel):
    file_id: str
    server_name: str
    database_name: str
    table_name: str
    mapping: Dict[str, str]  # { source_column: target_column }

class IngestRequest(BaseModel):
    file_id: str
    mapping_id: str
    server_name: str
    database_name: str
    table_name: str
    mode: str  # one of ["append", "upsert", "overwrite"]


#%%
# Helper to get server config by name
def get_server_cfg(name: str) -> dict:
    for srv in config.get("servers", []):
        if srv["name"] == name:
            return srv
    raise HTTPException(status_code=404, detail="Server not found")

# Helper to create SQLAlchemy engine
def make_engine(server_name: str, database: str = None) -> Engine:
    srv = get_server_cfg(server_name)
    user = srv["user"]
    pwd = srv["password"]
    host = srv["host"]
    port = srv.get("port", 3306)
    ssl_ca = config["db"].get("ssl_ca")
    db_part = f"/{database}" if database else ""
    uri = f"mysql+pymysql://{user}:{pwd}@{host}:{port}{db_part}?ssl_ca={ssl_ca}"
    return create_engine(uri)

# 1. List servers
@app.get("/api/servers", response_model=List[str])
def list_servers():
    return [srv["name"] for srv in config.get("servers", [])]

# 2. List databases
@app.get("/api/servers/{server_name}/databases", response_model=List[str])
def list_databases(server_name: str):
    engine = make_engine(server_name)
    try:
        with engine.connect() as conn:
            result = conn.execute("SHOW DATABASES;")
            return [row[0] for row in result]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. List tables
@app.get("/api/servers/{server_name}/databases/{database_name}/tables", response_model=List[str])
def list_tables(server_name: str, database_name: str):
    engine = make_engine(server_name, database_name)
    try:
        with engine.connect() as conn:
            result = conn.execute("SHOW TABLES;")
            return [row[0] for row in result]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. Create table
@app.post("/api/servers/{server_name}/databases/{database_name}/tables")
def create_table(server_name: str, database_name: str, payload: CreateTableRequest):
    engine = make_engine(server_name, database_name)
    cols = ", ".join(f"`{col}` {dtype}" for col, dtype in payload.columns.items())
    sql = f"CREATE TABLE IF NOT EXISTS `{payload.table_name}` ({cols});"
    try:
        with engine.connect() as conn:
            conn.execute(sql)
        return {"status": "created", "table": payload.table_name}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5. List table columns
@app.get(
    "/api/servers/{server_name}/databases/{database_name}/tables/{table_name}/columns",
    response_model=List[str]
)
def list_table_columns(server_name: str, database_name: str, table_name: str):
    engine = make_engine(server_name, database_name)
    try:
        with engine.connect() as conn:
            result = conn.execute(f"SHOW COLUMNS FROM `{table_name}`;")
            return [row[0] for row in result]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

# 6. Upload file
@app.post("/api/files/upload")
async def upload_file(
    server_name: str = Body(...),
    database_name: str = Body(...),
    table_name: str = Body(...),
    file: UploadFile = File(...)
):
    file_id = uuid.uuid4().hex
    tmp_path = f"/tmp/{file_id}_{file.filename}"
    with open(tmp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    uploads[file_id] = tmp_path
    return {"file_id": file_id}

# 7. List file columns
@app.get("/api/files/{file_id}/columns", response_model=List[str])
def list_file_columns(file_id: str):
    if file_id not in uploads:
        raise HTTPException(status_code=404, detail="File not found")
    path = uploads[file_id]
    ext = os.path.splitext(path)[1].lower()
    try:
        if ext == ".csv":
            df = pd.read_csv(path, nrows=0)
        elif ext in (".xls", ".xlsx"):
            df = pd.read_excel(path, nrows=0)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        return list(df.columns)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 8. Create mapping
@app.post("/api/mappings")
def create_mapping(req: MappingRequest):
    mapping_id = uuid.uuid4().hex
    mappings[mapping_id] = req.dict()
    return {"mapping_id": mapping_id}

# 9. Get mapping
@app.get("/api/mappings/{mapping_id}", response_model=MappingRequest)
def get_mapping(mapping_id: str):
    if mapping_id not in mappings:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return mappings[mapping_id]

# 10. Ingest data
@app.post("/api/ingest")
def ingest_data(req: IngestRequest):
    # Read file
    file_id, mapping_id = req.file_id, req.mapping_id
    if file_id not in uploads:
        raise HTTPException(status_code=404, detail="File not found")
    if mapping_id not in mappings:
        raise HTTPException(status_code=404, detail="Mapping not found")
    path = uploads[file_id]
    ext = os.path.splitext(path)[1].lower()
    try:
        if ext == ".csv":
            df = pd.read_csv(path)
        else:
            df = pd.read_excel(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Apply mapping
    mapping = mappings[mapping_id]["mapping"]
    df = df.rename(columns=mapping)

    # Write to DB
    engine = make_engine(req.server_name, req.database_name)
    table = req.table_name
    mode = req.mode.lower()
    try:
        if mode == "overwrite":
            with engine.connect() as conn:
                conn.execute(f"TRUNCATE TABLE `{table}`;")
            df.to_sql(table, con=engine, if_exists="append", index=False, method="multi")
        elif mode == "append":
            df.to_sql(table, con=engine, if_exists="append", index=False, method="multi")
        elif mode == "upsert":
            # Reflect table
            metadata = MetaData(bind=engine)
            tbl = Table(table, metadata, autoload_with=engine)
            with engine.begin() as conn:
                for record in df.to_dict(orient="records"):
                    stmt = mysql_insert(tbl).values(**record)
                    update_cols = {c.name: stmt.inserted[c.name] for c in tbl.columns}
                    on_dup = stmt.on_duplicate_key_update(**update_cols)
                    conn.execute(on_dup)
        else:
            raise HTTPException(status_code=400, detail="Unsupported mode")
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "success", "mode": mode, "rows": len(df)}

# %%





# %%
