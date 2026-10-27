import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Legislation = {
  id: string
  title: string
  ordinance_no: string
  author: string
  status: string
  pdf_url: string
  created_at: string
}

export default function Ordinances() {
  const [docs, setDocs] = useState<Legislation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocs() {
      const { data, error } = await supabase.from('legislations').select('*').order('created_at', { ascending: false })
      console.log('PUBLIC Ordinances:', data, error)
      if (data) setDocs(data)
      setLoading(false)
    }
    fetchDocs()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading ordinances...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Ordinances & Resolutions</h1>
        <p className="text-gray-600 mt-2">Showing {docs.length} documents</p>
        {docs.length === 0 ? (
          <div className="mt-8 bg-white rounded-xl p-12 text-center"><p>No documents found.</p></div>
        ) : (
          <div className="mt-8 space-y-4">
            {docs.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-blue-900">{d.ordinance_no} - {d.title}</p>
                  <p className="text-sm text-gray-600">{d.author} - {d.status}</p>
                </div>
                {d.pdf_url && <a href={d.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">View PDF</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}