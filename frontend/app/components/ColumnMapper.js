import { useState, useEffect } from 'react'
import axios from 'axios'

export default function ColumnMapper({ fileId, server, database, table, onMapped }) {
  const [fileCols, setFileCols]   = useState([])
  const [tableCols, setTableCols] = useState([])
  const [mapping, setMapping]     = useState({})  // { [tableCol]: fileCol }

  useEffect(() => {
    axios.get(`http://localhost:8000/api/files/${fileId}/columns`)
      .then(r => setFileCols(r.data))
      .catch(() => setFileCols([]))
    axios.get(`http://localhost:8000/api/servers/${server}/databases/${database}/tables/${table}/columns`)
      .then(r => setTableCols(r.data))
      .catch(() => setTableCols([]))
  }, [fileId, server, database, table])

  function updateMap(tableCol, fileCol) {
    setMapping(m => ({ ...m, [tableCol]: fileCol }))
  }

  async function save() {
    // invert mapping so payload is { fileCol: tableCol }
    const payloadMapping = {}
    Object.entries(mapping).forEach(([tbl, src]) => {
      payloadMapping[src] = tbl
    })

    const body = {
      file_id: fileId,
      server_name: server,
      database_name: database,
      table_name: table,
      mapping: payloadMapping
    }
    const res = await axios.post('http://localhost:8000/api/mappings', body)
    onMapped(res.data.mapping_id)
  }

  return (
    <div className="space-y-4">
      {tableCols.map(tbl => (
        <div key={tbl} className="flex items-center space-x-4">
          <span className="w-40">{tbl}</span>
          <select
            onChange={e => updateMap(tbl, e.target.value)}
            value={mapping[tbl] || ''}
            className="flex-1 p-2 border rounded"
          >
            <option value="">— map to —</option>
            {fileCols.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>
      ))}
      <button
        onClick={save}
        disabled={Object.keys(mapping).length !== tableCols.length || Object.values(mapping).includes('')}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Save Mapping
      </button>
    </div>
  )
}
