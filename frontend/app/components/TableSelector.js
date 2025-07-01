import { useState, useEffect } from 'react'
import axios from 'axios'

export default function TableSelector({ server, database, value, onChange }) {
  const [list, setList] = useState([])
  useEffect(() => {
    if (!server || !database) return setList([])
    axios.get(`http://localhost:8000/api/servers/${server}/databases/${database}/tables`)
      .then(r => setList(r.data))
  }, [server, database])
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={!database}
      className="w-full p-2 border rounded disabled:opacity-50"
    >
      <option value="">Select Table</option>
      {list.map(t => <option key={t} value={t}>{t}</option>)}
      <option value="__NEW__">+ Create New Table…</option>
    </select>
  )
}
