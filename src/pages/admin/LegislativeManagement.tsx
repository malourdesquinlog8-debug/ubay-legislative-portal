import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadFile } from '../../lib/storage';

export default function LegislativeManagement() {
  const [laws, setLaws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    ordinance_no: '',
    description: '',
    author: '',
    status: 'APPROVED',
    type: 'Ordinance',
    date_approved: '',
    pdf_url: '',
    pdf_filename: ''
  });

  const fetchLaws = async () => {
    setLoading(true);
    console.log('🔍 Admin: Fetching from', import.meta.env.VITE_SUPABASE_URL);
    const { data, error } = await supabase.from('legislations').select('*').order('created_at', { ascending: false });
    console.log('📊 Legislations from Supabase:', data, error);
    if (data) setLaws(data);
    if (error) console.error('Supabase error:', error);
    setLoading(false);
  };

  useEffect(() => {
    fetchLaws();
  }, []);

  const handlePdfUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      console.log('📤 Uploading PDF to Supabase Storage...');
      const publicUrl = await uploadFile('legislations', file);
      console.log('✅ Uploaded URL:', publicUrl);
      setForm({ ...form, pdf_url: publicUrl, pdf_filename: file.name });
      alert('PDF uploaded successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!form.title || !form.ordinance_no) {
      alert('Title and Ordinance No are required!');
      return;
    }

    try {
      if (editingId) {
        // Update
        const { error } = await supabase.from('legislations').update(form).eq('id', editingId);
        if (error) throw error;
        alert('Ordinance updated!');
      } else {
        // Insert
        const { error } = await supabase.from('legislations').insert([form]);
        if (error) throw error;
        alert('Ordinance added!');
      }
      
      setShowModal(false);
      setEditingId(null);
      setForm({
        title: '', ordinance_no: '', description: '', author: '',
        status: 'APPROVED', type: 'Ordinance', date_approved: '',
        pdf_url: '', pdf_filename: ''
      });
      fetchLaws();
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Failed to save: ' + err.message);
    }
  };

  const handleEdit = (law: any) => {
    setForm(law);
    setEditingId(law.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ordinance?')) return;
    const { error } = await supabase.from('legislations').delete().eq('id', id);
    if (error) {
      alert('Delete failed: ' + error.message);
    } else {
      alert('Deleted!');
      fetchLaws();
    }
  };

  if (loading) return <div className="p-12 text-center">Loading legislations...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Legislative Management</h1>
          <p className="text-gray-600 mt-1">{laws.length} ordinances in Supabase (Project: ptorjlqoswxdvzfapdks)</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ title: '', ordinance_no: '', description: '', author: '', status: 'APPROVED', type: 'Ordinance', date_approved: '', pdf_url: '', pdf_filename: '' }); setShowModal(true); }} className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
          + Add Ordinances/Resolutions
        </button>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase">Number</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase">Title</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {laws.map(law => (
              <tr key={law.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-sm">{law.ordinance_no}</td>
                <td className="px-4 py-3 text-sm max-w-md">
                  <div className="font-medium truncate">{law.title}</div>
                  <div className="text-xs text-gray-500">{law.author} • {law.date_approved}</div>
                </td>
                <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{law.status}</span></td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <button onClick={() => handleEdit(law)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(law.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  {law.pdf_url && <a href={law.pdf_url} target="_blank" className="text-green-600 hover:underline text-xs">PDF</a>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h- overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add'} Ordinance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Ordinance/Resolution No *</label>
                  <input type="text" value={form.ordinance_no} onChange={e => setForm({...form, ordinance_no: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="08-2026" required />
                </div>
                <div>
                  <label className="text-sm font-semibold">Author</label>
                  <input type="text" value={form.author} onChange={e => setForm({...form, author: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white">
                    <option>APPROVED</option><option>Pending</option><option>Draft</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white">
                    <option>Ordinance</option><option>Resolution</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Date Approved</label>
                  <input type="date" value={form.date_approved} onChange={e => setForm({...form, date_approved: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">Upload PDF (Supabase Storage - legislations bucket)</label>
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                {uploading && <p className="text-xs text-blue-600 mt-1">Uploading to Supabase Storage...</p>}
                {form.pdf_url && <p className="text-xs text-green-600 mt-1">✅ Uploaded: {form.pdf_filename} - <a href={form.pdf_url} target="_blank" className="underline">View</a></p>}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50">
                  {editingId ? 'Update' : 'Save'} Ordinance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}