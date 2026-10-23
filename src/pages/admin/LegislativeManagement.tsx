import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function LegislativeManagement() {
  const [laws, setLaws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', ordinance_no: '', description: '', author: '', status: 'APPROVED', type: 'Ordinance', date_approved: '', pdf_url: '', pdf_filename: ''
  });

  const fetchLaws = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('legislations').select('*').order('created_at', { ascending: false });
    console.log('Legislations from Supabase:', data, error);
    if (data) setLaws(data);
    setLoading(false);
  };

  useEffect(() => { fetchLaws(); }, []);

  const handlePdfUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('legislations').upload(fileName, file);
      if (error) {
        // If bucket doesn't exist, try local upload fallback
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('http://localhost:3001/api/upload', { method: 'POST', body: fd });
        const result = await res.json();
        if (result.success) {
          setForm({ ...form, pdf_url: `http://localhost:3001${result.filePath}`, pdf_filename: file.name });
          alert('✅ PDF uploaded (local): ' + file.name);
        }
      } else {
        const { data: urlData } = supabase.storage.from('legislations').getPublicUrl(fileName);
        setForm({ ...form, pdf_url: urlData.publicUrl, pdf_filename: file.name });
        alert('✅ PDF uploaded to Supabase Storage!');
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.ordinance_no) { alert('Title & Ordinance No required!'); return; }
    
    const { data, error } = await supabase.from('legislations').insert([{
      title: form.title,
      ordinance_no: form.ordinance_no,
      description: form.description,
      author: form.author,
      status: form.status,
      type: form.type,
      date_approved: form.date_approved || null,
      pdf_url: form.pdf_url,
      pdf_filename: form.pdf_filename
    }]).select();

    if (error) {
      alert(`❌ Error: ${error.message}`);
      console.error(error);
    } else {
      alert(`✅ SAVED to Supabase!`);
      setShowModal(false);
      setForm({ title: '', ordinance_no: '', description: '', author: '', status: 'APPROVED', type: 'Ordinance', date_approved: '', pdf_url: '', pdf_filename: '' });
      fetchLaws();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    const { error } = await supabase.from('legislations').delete().eq('id', id);
    if (!error) fetchLaws();
  };

  if (loading) return <div className="p-10">Loading legislations from Supabase...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Legislations (Supabase)</h1>
          <p className="text-sm text-green-600">✅ {laws.length} ordinances in Supabase</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-yellow-500 px-6 py-2 rounded font-bold">+ Add Ordinance</button>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Ordinance No</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Author</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">PDF</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {laws.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-500">No ordinances yet.</td></tr>
            ) : (
              laws.map(l => (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold">{l.ordinance_no}</td>
                  <td className="p-3">{l.title}</td>
                  <td className="p-3">{l.author}</td>
                  <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{l.status}</span></td>
                  <td className="p-3">
                    {l.pdf_url ? <a href={l.pdf_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">View PDF</a> : <span className="text-gray-400 text-xs">No PDF</span>}
                  </td>
                  <td className="p-3"><button onClick={() => handleDelete(l.id)} className="bg-red-500 text-white px-3 py-1 rounded text-xs">Delete</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white p-6 rounded w-full max-w-2xl max-h- overflow-auto">
            <h2 className="font-bold text-xl mb-4">Add Ordinance to Supabase</h2>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Ordinance No * (e.g., 08 S2026)" value={form.ordinance_no} onChange={e => setForm({...form, ordinance_no: e.target.value})} className="border p-2 rounded" />
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="border p-2 rounded">
                <option>Ordinance</option>
                <option>Resolution</option>
              </select>
              <input placeholder="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="col-span-2 border p-2 rounded" />
              <input placeholder="Author (e.g., HON. GLAIZA MAE ATUEL)" value={form.author} onChange={e => setForm({...form, author: e.target.value})} className="border p-2 rounded" />
              <input type="date" value={form.date_approved} onChange={e => setForm({...form, date_approved: e.target.value})} className="border p-2 rounded" />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="col-span-2 border p-2 rounded h-20" />
              <div className="col-span-2">
                <label className="text-sm font-bold">Upload PDF</label>
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="w-full border p-2 rounded" />
                {uploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
                {form.pdf_filename && <p className="text-xs text-green-600 mt-1">✅ {form.pdf_filename}</p>}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 p-2 rounded">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-yellow-500 p-2 rounded font-bold">Save to Supabase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}