import { useState, useEffect, useCallback } from 'react';

export default function MemberManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', position: '', committee: '', photo: '', facebook: '', email: '' });
  const [uploading, setUploading] = useState(false);

  const fetchMembers = useCallback(() => {
    fetch('http://localhost:3001/api/members')
      .then(res => res.json())
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]));
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('http://localhost:3001/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      setForm({ ...form, photo: data.filePath });
      alert('✅ Photo uploaded!');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.position) return alert('Name & Position required');
    const res = await fetch('http://localhost:3001/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ Saved id: ' + data.id);
      setShowModal(false);
      setForm({ name: '', position: '', committee: '', photo: '', facebook: '', email: '' });
      fetchMembers();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    await fetch(`http://localhost:3001/api/members/${id}`, { method: 'DELETE' });
    fetchMembers();
  };

  // FIXED FILTER - DILI NA MO-CRASH BISAG NULL
  const filtered = members.filter(m => {
    const name = (m?.name || '').toLowerCase();
    const pos = (m?.position || '').toLowerCase();
    const com = (m?.committee || '').toLowerCase();
    const q = (search || '').toLowerCase();
    return name.includes(q) || pos.includes(q) || com.includes(q);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">SB Members</h1>
        <button onClick={() => setShowModal(true)} className="bg-yellow-500 px-4 py-2 rounded font-bold">+ Add</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full border p-3 rounded mb-4" />
      <div className="grid md:grid-cols-3 gap-4">
        {filtered.map(m => (
          <div key={m.id} className="bg-white p-4 rounded shadow">
            {m.photo && <img src={`http://localhost:3001${m.photo}`} alt="" className="w-full h-40 object-cover rounded mb-2" />}
            <h3 className="font-bold">{m.name || 'No Name'}</h3>
            <p className="text-sm text-gray-600">{m.position || ''}</p>
            <button onClick={() => handleDelete(m.id)} className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm">Delete</button>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-lg">
            <h2 className="font-bold text-xl mb-4">Add Member</h2>
            <div className="space-y-2">
              <input placeholder="Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" />
              <input placeholder="Position *" value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="w-full border p-2 rounded" />
              <input placeholder="Committee" value={form.committee} onChange={e => setForm({...form, committee: e.target.value})} className="w-full border p-2 rounded" />
              <div><input type="file" accept="image/*" onChange={handleUpload} className="w-full border p-2 rounded" />{form.photo && <p className="text-green-600 text-xs">✅ {form.photo}</p>}</div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 p-2 rounded">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-yellow-500 p-2 rounded font-bold" type="button">{uploading ? 'Uploading...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}