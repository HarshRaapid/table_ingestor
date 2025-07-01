// app/layout.jsx
import './globals.css'
import Image from 'next/image'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export const metadata = {
  title: 'ETL Dashboard',
}

export default function RootLayout({ children }) {
  return ( 
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-white shadow flex items-center">
          <Image src="/RAAPID-Logo.png" width={240} height={120} alt="RAAPID Logo" />
          <div className="max-w-4xl mx-[25vw] py-4 px-6 text-2xl font-semibold">
            TABLE INGESTOR
          </div>
        </header>
        <main className="flex-grow max-w-4xl mx-auto p-6">
          {children}
        </main>
        <footer className="bg-white border-t text-sm text-center py-4">
          © 2022-2025 RAAPID INC | All Rights Reserved
        </footer>
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  )
}
