import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export default function NewsManagement() {
  const [news, setNews] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: '', content: '', category: 'News', author: '', event_date: '', image_url: '', is_published: true,
  });

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setNews(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Uploading:', filePath);

      const { error: uploadError } = await supabase.storage.from('news-images').upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('news-images').getPublicUrl(filePath);

      console.log('Uploaded URL:', data.publicUrl);
      setFormData({ ...formData, image_url: data.publicUrl });
      alert('Image uploaded! ' + data.publicUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + err.message + '\n\nMake sure bucket news-images exists and is public!');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title || '', content: item.content || '', category: item.category || 'News',
        author: item.author || '', event_date: item.event_date ? new Date(item.event_date).toISOString().slice(0,16) : '',
        image_url: item.image_url || '', is_published: item.is_published ? true : false,
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', content: '', category: 'News', author: '', event_date: '', image_url: '', is_published: true });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.title.trim() || !formData.content.trim()) { alert('Title and Content required!'); return; }
      const payload: any = {
        title: formData.title.trim(), content: formData.content.trim(), category: formData.category,
        author: formData.author.trim() || 'PIO OFFICE',
        event_date: formData.event_date ? new Date(formData.event_date).toISOString() : null,
        image_url: formData.image_url.trim(), is_published: formData.is_published ? true : false,
      };
      if (!editingItem) payload.created_at = new Date().toISOString();
      let result;
      if (editingItem) result = await supabase.from('news').update(payload).eq('id', editingItem.id).select();
      else result = await supabase.from('news').insert([payload]).select();
      if (result.error) { alert('Error: ' + result.error.message); return; }
      alert('News/Event saved!'); setShowModal(false); fetchNews();
    } catch (err: any) { alert('Failed: ' + err.message); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">News & Events Management</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-900 text-white px-4 py-2 rounded-lg">Add News/Event</button>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className="grid gap-4">
          {news.map((n: any) => (
            <div key={n.id} className="bg-white border rounded-xl p-4 flex gap-4">
              {n.image_url && <img src={n.image_url} className="w-20 h-20 object-cover rounded" />}
              <div className="flex-1"><p className="font-bold">{n.title}</p><p className="text-sm text-gray-600">{n.category} - {n.author}</p></div>
              <button onClick={() => handleOpenModal(n)} className="text-blue-600 text-sm">Edit</button>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h- overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit' : 'Add New'} News/Event</h2>
            <div className="space-y-4">
              <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Title" />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option>News</option><option>Event</option></select>
                <input value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="PIO OFFICE" />
              </div>
              <input type="datetime-local" value={formData.event_date} onChange={(e) => setFormData({...formData, event_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />

              {/* NEW - UPLOAD IMAGE */}
              <div>
                <label className="text-xs font-semibold">UPLOAD IMAGE (FROM PC/PHONE)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                {formData.image_url && (
                  <div className="mt-2">
                    <img src={formData.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
                    <p className="text-xs text-gray-500 mt-1 truncate">{formData.image_url}</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">Or paste Image URL below:</p>
                <input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
              </div>

              <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full px-3 py-2 border rounded-lg h-32" placeholder="Content" />
              <div className="flex items-center gap-2"><input type="checkbox" checked={formData.is_published} onChange={(e) => setFormData({...formData, is_published: e.target.checked})} /><label>Publish immediately</label></div>
            </div>
            <div className="flex justify-end gap-2 mt-6"><button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button><button onClick={handleSave} disabled={uploading} className="px-6 py-2 bg-blue-900 text-white rounded-lg disabled:opacity-50">{uploading ? 'Uploading...' : 'Save Changes'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}