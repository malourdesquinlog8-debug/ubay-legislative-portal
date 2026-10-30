import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Member = {
  id: string
  name: string
  position: string
  committee: string
  photo_url: string
  term: string
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase.from('sb_members').select('*').order('created_at', { ascending: true })
      console.log('PUBLIC Members:', data, error)
      if (data) setMembers(data)
      setLoading(false)
    }
    fetchMembers()
  }, [])

  if (loading) return <div className="min-h-screen bg-transparent flex items-center justify-center"><p>Loading SB Members...</p></div>

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900">Sangguniang Bayan Members</h1>
        <p className="text-gray-600 mt-2">{members.length} Members</p>
        {members.length === 0 ? (
          <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-xl p-12 text-center border shadow-sm"><p>No members available.</p></div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {members.map((m) => (
              <div key={m.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border p-6 text-center hover:scale-[1.03] hover:shadow-xl transition-all duration-300">
                <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full overflow-hidden mb-4 border-2 border-white shadow-sm">
                  {m.photo_url ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">{(m.name || '?').charAt(0).toUpperCase()}</div>}
                </div>
                <h3 className="font-bold text-slate-900">{m.name}</h3>
                <p className="text-sm text-blue-700 font-medium">{m.position}</p>
                <p className="text-xs text-gray-600 mt-1">{m.committee}</p>
                <p className="text-xs text-gray-400 mt-2">{m.term}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}