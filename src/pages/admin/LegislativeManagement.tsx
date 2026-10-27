import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LegislativeManagement() {
  const [legislations, setLegislations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    number: '',
    title: '',
    description: '',
    legislation_type: 'Ordinance',
    status: 'Approved',
    content: '',
    date_enacted: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('legislations').select('*').order('created_at', { ascending: false });
    if (!error && data) setLegislations(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.number || !form.title) return alert('Number and Title required');
    
    const payload = {
      ...form,
      date_enacted: form.date_enacted ? new Date(form.date_enacted).toISOString() : null
    };

    if (editing) {
      const { error } = await supabase.from('legislations').update(payload).eq('id', editing.id);
      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from('legislations').insert([payload]);
      if (error) return alert(error.message);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ number: '', title: '', description: '', legislation_type: 'Ordinance', status: 'Approved', content: '', date_enacted: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({
      number: item.number || '',
      title: item.title || '',
      description: item.description || '',
      legislation_type: item.legislation_type || 'Ordinance',
      status: item.status || 'Approved',
      content: item.content || '',
      date_enacted: item.date_enacted ? new Date(item.date_enacted).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this legislation?')) return;
    const { error } = await supabase.from('legislations').delete().eq('id', id);
    if (!error) fetchData();
  };

  const filtered = legislations.filter(l => 
    (l.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText /> Legislative Management</h1>
        <button onClick={() => { setEditing(null); setForm({ number: '', title: '', description: '', legislation_type: 'Ordinance', status: 'Approved', content: '', date_enacted: new Date().toISOString().split('T')[0] }); setShowModal(true); }} className="bg-lgu-blue-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-lgu-blue-800">
          <Plus className="w-4 h-4" /> Add Legislation
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400" />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by title or number..." className="flex-1 outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? <div className="p-8 text-center">Loading...</div> : (
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-sm text-slate-600">
              <tr><th className="p-3">Number</th><th className="p-3">Title</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-t hover:bg-slate-50 text-sm">
                  <td className="p-3 font-mono font-bold">{item.number}</td>
                  <td className="p-3 max-w-md truncate">{item.title}</td>
                  <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.legislation_type}</span></td>
                  <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{item.status}</span></td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleEdit(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h- overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit' : 'Add'} Legislation</h2>
            <div className="space-y-3">
              <input placeholder="Number (e.g. 05-2026)" value={form.number} onChange={e => setForm({...form, number: e.target.value})} className="w-full p-2.5 border rounded-lg" />
              <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-2.5 border rounded-lg" />
              <select value={form.legislation_type} onChange={e => setForm({...form, legislation_type: e.target.value})} className="w-full p-2.5 border rounded-lg">
                <option>Ordinance</option><option>Resolution</option>
              </select>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2.5 border rounded-lg">
                <option>Approved</option><option>Pending</option><option>Draft</option>
              </select>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><input type="date" value={form.date_enacted} onChange={e => setForm({...form, date_enacted: e.target.value})} className="p-2.5 border rounded-lg" /></div>
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2.5 border rounded-lg h-20" />
              <textarea placeholder="Full Content" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full p-2.5 border rounded-lg h-32" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-lgu-blue-900 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}