import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Member = {
  id: string
  name: string
  position: string
  committee: string
  photo_url: string
  term: string
  display_order: number
}

const EMPTY: Omit<Member, 'id'> = { name: '', position: 'Sangguniang Bayan Member', committee: '', photo_url: '', term: '2025 - 2028', display_order: 99 }

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState<Omit<Member, 'id'>>(EMPTY)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchMembers() {
    setLoading(true)
    const { data } = await supabase.from('sb_members').select('*').order('display_order', { ascending: true })
    if (data) setMembers(data)
    setLoading(false)
  }
  useEffect(() => { fetchMembers() }, [])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY, display_order: members.length + 1 })
    setPhotoFile(null); setPhotoPreview('')
    setShowModal(true)
  }
  function openEdit(m: Member) {
    setEditing(m)
    setForm({ name: m.name, position: m.position, committee: m.committee || '', photo_url: m.photo_url || '', term: m.term || '2025 - 2028', display_order: m.display_order })
    setPhotoFile(null); setPhotoPreview(m.photo_url || '')
    setShowModal(true)
  }

  // Photo: pili og file -> preview dayon. Kung naay R2 link, i-paste lang sa Photo URL.
  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setPhotoFile(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  async function uploadPhotoIfNeeded(): Promise<string> {
    if (!photoFile) return form.photo_url
    // Try Supabase Storage bucket "members-photos" - kung wala pa, i-create sa Supabase > Storage > New Bucket "members-photos" (Public)
    // Kung gusto R2, i-upload sa R2 then i-paste ang R2 link sa Photo URL - mas safe kay dili mapuno ang Supabase.
    const fileName = `${Date.now()}-${photoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const { error } = await supabase.storage.from('members-photos').upload(fileName, photoFile, { upsert: true })
    if (error) {
      alert('Photo upload failed: ' + error.message + '\n\nTip: Kung wala pa ang bucket, i-create ang "members-photos" (Public) sa Supabase > Storage, o i-paste lang ang R2 link sa Photo URL.')
      throw error
    }
    const { data } = supabase.storage.from('members-photos').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.name.trim()) return alert('Name is required')
    setSaving(true)
    try {
      const photo_url = await uploadPhotoIfNeeded()
      const payload = { ...form, photo_url }
      if (editing) {
        const { error } = await supabase.from('sb_members').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('sb_members').insert(payload)
        if (error) throw error
      }
      setShowModal(false)
      fetchMembers()
    } catch (e: any) {
      alert('Save failed: ' + (e.message || e))
    } finally { setSaving(false) }
  }

  async function handleDelete(m: Member) {
    if (!confirm(`Delete ${m.name}?`)) return
    const { error } = await supabase.from('sb_members').delete().eq('id', m.id)
    if (error) return alert('Delete failed: ' + error.message)
    fetchMembers()
  }

  if (loading) return <div className="p-8">Loading SB Members...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900">SB Members Management</h1>
        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add Member</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {members.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border p-4 flex gap-4 items-start">
            <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center">
              {m.photo_url ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover object-top" /> : <span className="text-xs text-slate-400">No Photo</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 leading-tight">{m.name}</p>
              <p className="text-sm text-blue-700">{m.position}</p>
              {m.committee && <p className="text-xs text-slate-600 mt-0.5">Committee: {m.committee}</p>}
              <p className="text-xs text-slate-400">{m.term} • Order: {m.display_order}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => openEdit(m)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded">Edit</button>
                <button onClick={() => handleDelete(m)} className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT / ADD MODAL - gamay, limpyo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing ? 'Edit SB Member' : 'Add SB Member'}</h2>

            <label className="block text-xs font-medium mt-4">Full Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="HON. ..." />

            <label className="block text-xs font-medium mt-3">Position</label>
            <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
              <option>Vice Mayor / Presiding Officer</option>
              <option>Sangguniang Bayan Member</option>
              <option>ABC President (Ex-Officio)</option>
              <option>SK Federation President (Ex-Officio)</option>
            </select>

            <label className="block text-xs font-medium mt-3">Committee / Chairmanship</label>
            <input value={form.committee} onChange={(e) => setForm({ ...form, committee: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. Chairperson - Committee on Education and Culture" />
            <p className="text-[11px] text-slate-400 mt-1">Mao ni ang mo-gawas sa ubos sa name sa Public page.</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mt-3">Term</label>
                <input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="block text-xs font-medium mt-3">Display Order</label>
                <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                <p className="text-[11px] text-slate-400">1 = Presiding, una sa center</p>
              </div>
            </div>

            <label className="block text-xs font-medium mt-3">Photo</label>
            <div className="flex gap-3 mt-1 items-start">
              <div className="w-20 h-20 shrink-0 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center">
                {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover object-top" /> : <span className="text-[11px] text-slate-400">No Photo</span>}
              </div>
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={onPhotoChange} className="w-full text-xs" />
                <input value={form.photo_url} onChange={(e) => { setForm({ ...form, photo_url: e.target.value }); setPhotoPreview(e.target.value) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-2" placeholder="Or paste R2 / image link here" />
                <p className="text-[11px] text-slate-400 mt-1">Pili og file (ma-upload sa members-photos) o i-paste ang R2 link.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
