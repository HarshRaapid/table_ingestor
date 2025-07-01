'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { PlusCircleIcon }     from '@heroicons/react/24/outline'
import axios                   from 'axios'

export default function NewTableModal({
  open,
  onClose,
  server,
  database,
  onCreate,
  onTableCreated
}) {
  const [tableName, setTableName] = useState('')
  const [cols, setCols]           = useState([{ name: '', type: 'VARCHAR(100)' }])

  async function submit() {
    const body = {
      table_name: tableName,
      columns: Object.fromEntries(cols.map(c => [c.name, c.type]))
    }
    await axios.post(
      `http://localhost:8000/api/servers/${server}/databases/${database}/tables`,
      body
    )
    onTableCreated()         // trigger parent to re-fetch table list
    onCreate(tableName)      // close modal & set selected table
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="relative min-h-screen px-4 text-center">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
          </Transition.Child>

          {/* Center trick */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          {/* Modal panel */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Create New Table
              </Dialog.Title>

              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  placeholder="Table name"
                  value={tableName}
                  onChange={e => setTableName(e.target.value)}
                  className="w-full p-2 border rounded"
                />

                {cols.map((c, i) => (
                  <div key={i} className="flex space-x-2">
                    <input
                      placeholder="Column name"
                      value={c.name}
                      onChange={e => {
                        const upd = [...cols]
                        upd[i].name = e.target.value
                        setCols(upd)
                      }}
                      className="flex-1 p-2 border rounded"
                    />
                    <input
                      placeholder="SQL type"
                      value={c.type}
                      onChange={e => {
                        const upd = [...cols]
                        upd[i].type = e.target.value
                        setCols(upd)
                      }}
                      className="flex-1 p-2 border rounded"
                    />
                  </div>
                ))}

                <button
                  onClick={() => setCols([...cols, { name: '', type: 'VARCHAR(100)' }])}
                  className="flex items-center space-x-1 text-blue-600"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                  <span>Add Column</span>
                </button>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button onClick={onClose} className="px-4 py-2">
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!tableName || cols.some(c => !c.name)}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Create
                </button>
              </div>
              
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
