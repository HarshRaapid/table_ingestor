'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function ServerSelector({ value, onChange }) {
  const [list, setList] = useState([])
  useEffect(() => {
    axios.get('http://localhost:8000/api/servers').then(r => setList(r.data))
  }, [])
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full p-2 border rounded"
    >
      <option value="">Select Server</option>
      {list.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}
