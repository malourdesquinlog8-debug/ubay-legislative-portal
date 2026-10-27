import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Legislation = {
  id: string
  title: string
  ordinance_no: string
  author: string
  status: string
  type: string
  pdf_url: string
  created_at: string
  date_approved: string
}

export default function Ordinances() {
  const [docs, setDocs] = useState<Legislation[]>([])
  const [filtered, setFiltered] = useState<Legislation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    async function fetchDocs() {
      const { data, error } = await supabase.from('legislations').select('*').order('created_at', { ascending: false })
      console.log('PUBLIC Ordinances:', data, error)
      if (data) {
        setDocs(data)
        setFiltered(data)
      }
      setLoading(false)
    }
    fetchDocs()
  }, [])

  useEffect(() => {
    let result = docs
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(d => 
        d.title.toLowerCase().includes(s) || 
        d.ordinance_no.toLowerCase().includes(s) || 
        d.author.toLowerCase().includes(s)
      )
    }
    if (statusFilter !== 'ALL') {
      result = result.filter(d => d.status === statusFilter)
    }
    if (typeFilter !== 'ALL') {
      result = result.filter(d => (d.type || '').toLowerCase() === typeFilter.toLowerCase())
    }
    setFiltered(result)
  }, [search, statusFilter, typeFilter, docs])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading ordinances...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Ordinances & Resolutions</h1>
        <p className="text-gray-600 mt-2">Showing {filtered.length} of {docs.length} documents</p>

        {/* SEARCH AND FILTERS - NABALIK NA! */}
        <div className="mt-6 bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Search by title, ordinance no, author..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="ALL">All Types</option>
              <option value="Ordinance">Ordinance</option>
              <option value="Resolution">Resolution</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 bg-white rounded-xl p-12 text-center border"><p>No documents found.</p></div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition">
                <div className="flex-1">
                  <p className="font-bold text-blue-900 text-sm md:text-base">{d.ordinance_no} - {d.title}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">{d.author} - {d.status} {d.type && `- ${d.type}`}</p>
                </div>
                {d.pdf_url && <a href={d.pdf_url} target="_blank" rel="noopener noreferrer" className="ml-4 text-sm text-blue-600 underline whitespace-nowrap">View PDF</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}