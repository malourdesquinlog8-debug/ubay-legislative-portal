import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Member = {
  id: string
  name: string
  position: string
  committee: string
  photo_url: string
  term: string
  display_order: number
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase.from('sb_members').select('*').order('display_order', { ascending: true })
      if (data) setMembers(data)
      setLoading(false)
    }
    fetchMembers()
  }, [])

  if (loading) return <div className="min-h-screen bg-transparent flex items-center justify-center"><p>Loading SB Members...</p></div>

  const presiding = members.find((m) => m.display_order === 1)
  const sbMembers = members.filter((m) => m.display_order !== 1)

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 text-center">Sangguniang Bayan Members</h1>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-center">Meet the dedicated public servants working to craft legislation for the betterment of Ubay.</p>
        </div>

        {members.length === 0 ? (
          <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-xl p-12 text-center border shadow-sm"><p>No members available.</p></div>
        ) : (
          <>
            {/* PRESIDING OFFICER - USA RA, CENTER SA IBABAW */}
            {presiding && (
              <div className="mt-6 flex justify-center">
                <div className="w-full max-w-[320px] bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border-2 border-blue-600 p-5 text-center hover:scale-[1.03] hover:shadow-xl transition-all duration-300">
                  <span className="inline-block text-[10px] font-bold tracking-[0.15em] text-white bg-blue-700 px-2.5 py-1 rounded-full mb-3">PRESIDING OFFICER</span>
                  <div className="w-24 h-24 mx-auto bg-gradient-to-b from-slate-100 to-slate-200 rounded-full overflow-hidden mb-3 border-2 border-white shadow-sm flex items-center justify-center">
                    {presiding.photo_url ? <img src={presiding.photo_url} alt={presiding.name} className="w-full h-full object-cover object-top" /> : <span className="font-bold text-2xl text-slate-300">{(presiding.name || '?').charAt(0).toUpperCase()}</span>}
                  </div>
                  <h3 className="font-bold text-slate-900 leading-tight text-[15px]">{presiding.name}</h3>
                  <p className="text-sm text-blue-700 font-medium mt-1">{presiding.position}</p>
                  {presiding.committee && <p className="text-xs text-gray-600 mt-1">{presiding.committee}</p>}
                  <p className="text-xs text-gray-400 mt-1">{presiding.term}</p>
                </div>
              </div>
            )}

            {/* SB MEMBERS - FLEX + JUSTIFY-CENTER, para ang last row nga 2 ka buok, CENTER gyud, dili left! */}
            <div className="mt-6 flex flex-wrap justify-center gap-5">
              {sbMembers.map((m) => (
                <div key={m.id} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] max-w-[320px] bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border p-5 text-center hover:scale-[1.03] hover:shadow-xl transition-all duration-300">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-b from-slate-100 to-slate-200 rounded-full overflow-hidden mb-3 border-2 border-white shadow-sm flex items-center justify-center">
                    {m.photo_url ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover object-top" /> : <span className="font-bold text-2xl text-slate-300">{(m.name || '?').charAt(0).toUpperCase()}</span>}
                  </div>
                  <h3 className="font-bold text-slate-900 leading-tight text-[15px]">{m.name}</h3>
                  <p className="text-sm text-blue-700 font-medium mt-1">{m.position}</p>
                  {m.committee && <p className="text-xs text-gray-600 mt-1">{m.committee}</p>}
                  <p className="text-xs text-gray-400 mt-1">{m.term}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
