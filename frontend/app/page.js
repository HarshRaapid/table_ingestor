// app/page.jsx
'use client'

import { useState } from 'react'
import ServerSelector    from './components/ServerSelector'
import DatabaseSelector  from './components/DatabaseSelector'
import TableSelector     from './components/TableSelector'
import NewTableModal     from './components/NewTableModal'
import FileUpload        from './components/FileUpload'
import ColumnMapper      from './components/ColumnMapper'
import IngestControls    from './components/IngestControls'

export default function Home() {
  const [server, setServer]       = useState('')
  const [database, setDatabase]   = useState('')
  const [table, setTable]         = useState('')
  const [fileId, setFileId]       = useState(null)
  const [mappingId, setMappingId] = useState(null)
  const [showNewTable, setShowNewTable] = useState(false)

  return (
    <div className="space-y-6">
      {/* Steps 1–3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ServerSelector   value={server}   onChange={setServer} />
        <DatabaseSelector server={server}  value={database} onChange={setDatabase} />
        <TableSelector
          server={server}
          database={database}
          value={table}
          onChange={v => v === '__NEW__' ? setShowNewTable(true) : setTable(v)}
        />
      </div>

      <NewTableModal
        open={showNewTable}
        server={server}
        database={database}
        onCreate={newTab => { setTable(newTab); setShowNewTable(false) }}
        onClose={() => setShowNewTable(false)}
      />

      {/* Step 4 */}
      {table && !fileId && (
        <FileUpload
          server={server}
          database={database}
          table={table}
          onUploaded={setFileId}
        />
      )}

      {/* Step 5 */}
      {fileId && !mappingId && (
        <ColumnMapper
          fileId={fileId}
          server={server}
          database={database}
          table={table}
          onMapped={setMappingId}
        />
      )}

      {/* Step 6 */}
      {mappingId && (
        <IngestControls
          fileId={fileId}
          mappingId={mappingId}
          server={server}
          database={database}
          table={table}
        />
      )}
    </div>
  )
}
