import { useState, useEffect } from 'react'
import axios from 'axios'

export default function DatabaseSelector({ server, value, onChange }) {
  const [list, setList] = useState([])
  useEffect(() => {
    if (!server) return setList([])
    axios.get(`http://localhost:8000/api/servers/${server}/databases`).then(r => setList(r.data))
  }, [server])
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={!server}
      className="w-full p-2 border rounded disabled:opacity-50"
    >
      <option value="">Select Database</option>
      {list.map(db => <option key={db} value={db}>{db}</option>)}
    </select>
  )
}
