import { useState, useEffect } from 'react'
import axios from 'axios'

export default function ColumnMapper({ fileId, server, database, table, onMapped }) {
  const [fileCols, setFileCols]     = useState([])
  const [tableCols, setTableCols]   = useState([])
  const [mapping, setMapping]       = useState({})

  useEffect(() => {
    axios.get(`http://localhost:8000/api/files/${fileId}/columns`).then(r => setFileCols(r.data))
    axios.get(`http://localhost:8000/api/servers/${server}/databases/${database}/tables/${table}/columns`)
      .then(r => setTableCols(r.data))
  }, [])

  function updateMap(src, tgt) {
    setMapping(m => ({ ...m, [src]: tgt }))
  }

  async function save() {
    const body = { file_id: fileId, server_name: server, database_name: database, table_name: table, mapping }
    const res = await axios.post('http://localhost:8000/api/mappings', body)
    onMapped(res.data.mapping_id)
  }

  return (
    <div className="space-y-4">
      {fileCols.map(src => (
        <div key={src} className="flex items-center space-x-4">
          <span className="w-40">{src}</span>
          <select
            onChange={e => updateMap(src, e.target.value)}
            defaultValue=""
            className="flex-1 p-2 border rounded"
          >
            <option value="">— map to —</option>
            {tableCols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      ))}
      <button
        onClick={save}
        disabled={Object.keys(mapping).length !== fileCols.length}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Save Mapping
      </button>
    </div>
  )
}
