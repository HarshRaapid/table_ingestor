import { useState } from 'react'
import axios from 'axios'

export default function IngestControls({ fileId, mappingId, server, database, table }) {
  const [mode, setMode]     = useState('append')
  const [status, setStatus] = useState(null)

  async function runIngest() {
    setStatus('running')
    try {
      const res = await axios.post('http://localhost:8000/api/ingest', {
        file_id: fileId,
        mapping_id: mappingId,
        server_name: server,
        database_name: database,
        table_name: table,
        mode,
      })
      setStatus(`✅ ${res.data.rows} rows ingested (${mode})`)
    } catch (e) {
      setStatus(`❌ ${e.response?.data?.detail || e.message}`)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block">
        Mode:
        <select
          value={mode}
          onChange={e => setMode(e.target.value)}
          className="ml-2 p-1 border rounded"
        >
          <option value="append">Append</option>
          <option value="upsert">Upsert</option>
          <option value="overwrite">Overwrite</option>
        </select>
      </label>
      <button
        onClick={runIngest}
        className="px-4 py-2 bg-indigo-600 text-white rounded"
      >
        Start Ingest
      </button>
      {status && <p className="mt-2 font-mono">{status}</p>}
    </div>
  )
}
