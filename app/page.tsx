'use client'

import { useState } from 'react'

export default function TestPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [results, setResults] = useState(null)

  const testBackup = async () => {
    try {
      setStatus('loading')
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
      setStatus('success')
    } catch (error) {
      console.error('Backup failed:', error)
      setStatus('error')
    }
  } 

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Backup Test</h1>

      <button
        onClick={testBackup}
        disabled={status === 'loading'}
        className={`px-4 py-2 rounded ${status === 'loading' ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
      >
        {status === 'loading' ? 'Running Backup...' : 'Test Backup'}
      </button>

      {status === 'success' && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Backup Results:</h2>
          <pre className="bg-gray-100 text-black p-4 rounded">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 text-red-600">
          Backup failed. Check console for details.
        </div>
      )}
    </div>
  )
}