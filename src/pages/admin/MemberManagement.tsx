import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function MemberManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', position: '', committee: '' });
  const [msg, setMsg] = useState('');

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
      const { data, error } = await supabase.from('sb_members').insert([{
        name: form.name,
        position: form.position,
        committee: form.committee || '',
        term: '2022-2025'
      }]).select();
      
      console.log('SAVE RESULT:', data, error);
      
      if (error) {
        setMsg(`❌ Error: ${error.message} - ${error.details || ''} - ${error.hint || ''}`);
        alert(`Error: ${error.message}\n${error.details}\nHint: ${error.hint}`);
        console.error(error);
        return;
      }
      
      setMsg(`✅ SAVED! id: ${data?.[0]?.id}`);
      setForm({ name: '', position: '', committee: '' });
      setShowModal(false);
      load();
    } catch (e: any) {
      console.error('CATCH:', e);
      setMsg(`❌ Failed: ${e.message}`);
      alert(`Failed to fetch - Check .env ANON_KEY! Error: ${e.message}`);
    }
  };

  const del = async (id: number) => {
    if (!confirm('Delete?')) return;
    await supabase.from('sb_members').delete().eq('id', id);
    load();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">SB Members (Supabase) {loading ? 'Loading...' : `✅ Connected: ${members.length} members`}</h1>
      {msg && <div className="bg-yellow-100 p-2 mb-3 border rounded text-sm">{msg}</div>}
      <button onClick={() => setShowModal(true)} className="bg-yellow-500 px-4 py-2 rounded font-bold mb-4">+ Add Member</button>
      
      <div className="grid md:grid-cols-3 gap-4">
        {members.map(m => (
          <div key={m.id} className="bg-white p-4 rounded shadow border">
            <h3 className="font-bold">{m.name}</h3>
            <p className="text-sm">{m.position} - {m.committee}</p>
            <button onClick={() => del(m.id)} className="bg-red-600 text-white px-2 py-1 rounded mt-2 text-xs">Delete</button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="font-bold mb-3">Add Member</h2>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Name *" className="w-full border p-2 mb-2 rounded" />
            <input value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="Position *" className="w-full border p-2 mb-2 rounded" />
            <input value={form.committee} onChange={e => setForm({...form, committee: e.target.value})} placeholder="Committee" className="w-full border p-2 mb-3 rounded" />
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 p-2 rounded">Cancel</button>
              <button onClick={save} className="flex-1 bg-yellow-500 p-2 rounded font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}