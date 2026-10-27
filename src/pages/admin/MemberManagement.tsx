import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function MemberManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', position: '', committee: '' });
  const [msg, setMsg] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('sb_members').select('*').order('id', { ascending: false });
    console.log('LOAD:', data, error);
    if (data) setMembers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.position) { alert('Name & Position required!'); return; }
    setMsg('Saving...');

    try {
      let photoUrl = "";

      // Upload photo if naa
      if (photoFile) {
        const fileName = `${Date.now()}_${photoFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('members-photos')
          .upload(fileName, photoFile);
        
        if (uploadError) {
          setMsg(`Upload Error: ${uploadError.message}`);
          alert(`Upload Error: ${uploadError.message}`);
          return;
        }
        
        const { data: urlData } = supabase.storage
          .from('members-photos')
          .getPublicUrl(uploadData.path);
        photoUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase.from('sb_members').insert([{
        name: form.name,
        position: form.position,
        committee: form.committee || '',
        term: '2025-2028',
        photo_url: photoUrl
      }]).select();

      console.log('SAVE RESULT:', data, error);

      if (error) {
        setMsg(`❌ Error: ${error.message} - ${error.details || ''} - ${error.hint || ''}`);
        alert(`Error: ${error.message}\n${error.details}\nHint: ${error.hint}`);
        console.error(error);
        return;
      }

      setMsg('Saved!');
      setForm({ name: '', position: '', committee: '' });
      setPhotoFile(null);
      setShowModal(false);
      load();

    } catch (e) {
      console.error(e);
      setMsg('Unexpected error');
    }
  };

  const del = async (id: number) => {
    if (!confirm('Delete this member?')) return;
    const { error } = await supabase.from('sb_members').delete().eq('id', id);
    if (!error) load();
  };

  if (loading) return <div className="p-4">Loading members...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">SB Members Management</h1>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">
          + Add Member
        </button>
      </div>

      {msg && <p className="mb-2 text-sm text-blue-600">{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map(m => (
          <div key={m.id} className="bg-white p-4 rounded shadow border flex gap-3 items-start">
            {m.photo_url ? (
              <img src={m.photo_url} alt={m.name} className="w-16 h-16 rounded-full object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xs">No Photo</div>
            )}
            <div className="flex-1">
              <h3 className="font-bold">{m.name}</h3>
              <p className="text-sm text-gray-600">{m.position} {m.committee ? `- ${m.committee}` : ''}</p>
              <p className="text-xs text-gray-400">{m.term}</p>
              <button onClick={() => del(m.id)} className="bg-red-600 text-white px-2 py-1 rounded mt-2 text-xs">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Member</h2>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Name *" className="w-full border p-2 rounded mb-2" />
            <input value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="Position *" className="w-full border p-2 rounded mb-2" />
            <input value={form.committee} onChange={e => setForm({...form, committee: e.target.value})} placeholder="Committee" className="w-full border p-2 rounded mb-2" />
            
            <div className="mb-3">
              <label className="block text-sm font-bold mb-1">Member Photo</label>
              <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="w-full border p-2 rounded" />
              {photoFile && <p className="text-xs text-green-600 mt-1">Selected: {photoFile.name}</p>}
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setShowModal(false); setPhotoFile(null); }} className="flex-1 border p-2 rounded">Cancel</button>
              <button onClick={save} className="flex-1 bg-blue-600 text-white p-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}