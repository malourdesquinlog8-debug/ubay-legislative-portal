import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit, Trash2, Upload, X, Calendar, User, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LegislativeManagement() {
  const [legislations, setLegislations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    ordinance_no: '', title: '', type: 'Ordinance', legislation_type: 'Ordinance', status: 'Approved',
    date_approved: new Date().toISOString().split('T')[0], author: '', description: '', pdf_url: '', file_url: '', document_url: '',
  });

  useEffect(() => { fetchLegislations(); }, []);
  const fetchLegislations = async () => {
    setLoading(true);
    const { data } = await supabase.from('legislations').select('*').order('created_at', { ascending: false });
    if (data) setLegislations(data);
    setLoading(false);
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ordinance_no: item.ordinance_no || '', title: item.title || '', type: item.type || 'Ordinance',
        legislation_type: item.legislation_type || item.type || 'Ordinance', status: item.status || 'Approved',
        date_approved: item.date_approved ? item.date_approved.split('T')[0] : new Date().toISOString().split('T')[0],
        author: item.author || '', description: item.description || '', pdf_url: item.pdf_url || '', file_url: item.file_url || '', document_url: item.document_url || '',
      });
    } else {
      setEditingItem(null);
      setFormData({ ordinance_no: '', title: '', type: 'Ordinance', legislation_type: 'Ordinance', status: 'Approved', date_approved: new Date().toISOString().split('T')[0], author: '', description: '', pdf_url: '', file_url: '', document_url: '', });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setEditingItem(null); setUploading(false); };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('legislations').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('legislations').getPublicUrl(data.path);
      setFormData(prev => ({ ...prev, pdf_url: urlData.publicUrl, file_url: urlData.publicUrl, document_url: urlData.publicUrl }));
    } catch (err: any) { alert('Upload failed: ' + err.message); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!formData.ordinance_no || !formData.title) { alert('Number and Title required!'); return; }
    const payload = {
      ordinance_no: formData.ordinance_no, title: formData.title, type: formData.type, legislation_type: formData.legislation_type,
      status: formData.status, date_approved: formData.date_approved, description: formData.description, author: formData.author,
      pdf_url: formData.pdf_url, file_url: formData.file_url || formData.pdf_url, document_url: formData.document_url || formData.pdf_url,
    };
    const { error } = editingItem ? await supabase.from('legislations').update(payload).eq('id', editingItem.id) : await supabase.from('legislations').insert(payload);
    if (!error) { handleCloseModal(); fetchLegislations(); }
    else alert('Error: ' + error.message);
  };

  const handleDelete = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('legislations').delete().eq('id', id); fetchLegislations(); };
  const filtered = legislations.filter(item => (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.ordinance_no || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Legislative Management</h1>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Legislation</button>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400" />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="flex-1 outline-none text-sm" />
      </div>

      {/* COMPACT TABLE - FIXED LAYOUT - DILI NA TAAS! */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr className="text- font-bold text-slate-600">
                <th className="text-left p-3 w-">Number</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3 w-">Type</th>
                <th className="text-left p-3 w-">Status</th>
                <th className="text-left p-3 w-">Date</th>
                <th className="text-right p-3 w-">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center p-8">Loading...</td></tr> :
                filtered.map(item => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-">{item.ordinance_no}</td>
                    <td className="p-3">
                      <p className="text-xs line-clamp-1 max-w- font-medium" title={item.title}>{item.title}</p>
                    </td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text- font-bold">{item.type}</span></td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text- font-bold">{item.status}</span></td>
                    <td className="p-3 text- text-slate-500">{item.date_approved ? new Date(item.date_approved).toLocaleDateString() : '-'}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        {item.pdf_url && <a href={item.pdf_url} target="_blank" className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center"><Eye className="w-3 h-3" /></a>}
                        <button onClick={() => handleOpenModal(item)} className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Edit className="w-3 h-3" /></button>
                        <button onClick={() => handleDelete(item.id)} className="w-6 h-6 bg-red-50 text-red-600 rounded-full flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h- overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center rounded-t-2xl">
              <h3 className="font-bold text-xl">{editingItem ? 'Edit' : 'Add'} Legislation</h3>
              <button onClick={handleCloseModal} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div><label className="text-sm font-bold mb-1.5 block">Legislation Number *</label><input value={formData.ordinance_no} onChange={e => setFormData({...formData, ordinance_no: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Ex: 2026-08" /></div>
              <div><label className="text-sm font-bold mb-1.5 block">Title *</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-bold mb-1.5 block">Type</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value, legislation_type: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm bg-white"><option>Ordinance</option><option>Resolution</option></select></div>
                <div><label className="text-sm font-bold mb-1.5 block">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm bg-white"><option>Approved</option><option>Pending</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-bold mb-1.5 flex items-center gap-1"><Calendar className="w-4 h-4" /> Date Approved</label><input type="date" value={formData.date_approved} onChange={e => setFormData({...formData, date_approved: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm" /></div>
                <div><label className="text-sm font-bold mb-1.5 flex items-center gap-1"><User className="w-4 h-4" /> Author</label><input value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm" /></div>
              </div>
              <div><label className="text-sm font-bold mb-1.5 block">Short Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full border rounded-xl px-4 py-3 text-sm resize-none" /></div>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                <label className="text-sm font-bold mb-3 block flex items-center gap-2"><Upload className="w-4 h-4" /> Select PDF File</label>
                {formData.pdf_url ? (
                  <div className="bg-white border rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center"><FileText className="w-5 h-5 text-red-600" /></div><p className="text-sm font-bold">PDF Uploaded</p></div>
                    <div className="flex gap-2"><a href={formData.pdf_url} target="_blank" className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Eye className="w-5 h-5" /></a><button onClick={() => setFormData({...formData, pdf_url: '', file_url: '', document_url: ''})} className="w-9 h-9 bg-red-50 text-red-600 rounded-full flex items-center justify-center"><X className="w-5 h-5" /></button></div>
                  </div>
                ) : (
                  <label className="w-full bg-white border rounded-xl px-6 py-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-sm font-bold">{uploading ? 'Uploading...' : 'Click to select PDF'}</span>
                    <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white p-5 border-t flex justify-end gap-3 rounded-b-2xl">
              <button onClick={handleCloseModal} className="px-6 py-2.5 border rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold">{editingItem ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}