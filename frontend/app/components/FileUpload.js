import { useState } from 'react'
import axios from 'axios'

export default function FileUpload({ server, database, table, onUploaded }) {
  const [file, setFile] = useState(null)
  async function upload() {
    const fd = new FormData()
    fd.append('server_name', server)
    fd.append('database_name', database)
    fd.append('table_name', table)
    fd.append('file', file)
    const res = await axios.post('http://localhost:8000/api/files/upload', fd)
    onUploaded(res.data.file_id)
  }
  return (
    <div className="space-y-2">
      <input
        type="file"
        accept=".csv,.xls,.xlsx"
        onChange={e => setFile(e.target.files[0])}
        className="block"
      />
      <button
        onClick={upload}
        disabled={!file}
        className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
      >
        Upload File
      </button>
    </div>
  )
}
