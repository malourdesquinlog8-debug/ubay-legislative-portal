import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export default function NewsManagement() {
  const [news, setNews] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({
    title: '',
    content: '',
    category: 'News',
    author: '',
    event_date: '',
    image_url: '',
    is_published: 1
  });

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      // SUPABASE - dili /api/admin/news!
      const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      console.log('News fetched:', data, error);
      if (error) throw error;
      if (data) setNews(data);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title || '',
        content: item.content || '',
        category: item.category || 'News',
        author: item.author || '',
        event_date: item.event_date ? new Date(item.event_date).toISOString().slice(0, 16) : '',
        image_url: item.image_url || '',
        is_published: item.is_published ? 1 : 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        content: '',
        category: 'News',
        author: '',
        event_date: '',
        image_url: '',
        is_published: 1
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.title.trim() || !formData.content.trim()) {
        alert('Title and Content required!');
        return;
      }

      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        author: formData.author.trim() || 'PIO OFFICE',
        event_date: formData.event_date || null,
        image_url: formData.image_url.trim(),
        is_published: formData.is_published ? true : false,
        created_at: new Date().toISOString()
      };

      console.log('Saving:', payload);

      let result;
      if (editingItem) {
        // Update
        result = await supabase.from('news').update(payload).eq('id', editingItem.id).select();
      } else {
        // Insert
        result = await supabase.from('news').insert([payload]).select();
      }

      if (result.error) {
        console.error('Save error:', result.error);
        alert('Error: ' + result.error.message);
        return;
      }

      console.log('Saved!', result.data);
      alert('News/Event saved successfully!');
      setShowModal(false);
      fetchNews();

    } catch (err: any) {
      console.error('Save failed:', err);
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">News & Events Management</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-900 text-white px-4 py-2 rounded-lg">Add News/Event</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid gap-4">
          {news.length === 0 ? <p>No news yet</p> : news.map((n: any) => (
            <div key={n.id} className="bg-white border rounded-xl p-4 flex justify-between">
              <div>
                <p className="font-bold">{n.title}</p>
                <p className="text-sm text-gray-600">{n.category} - {n.author}</p>
              </div>
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
              <div>
                <label className="text-xs font-semibold">TITLE</label>
                <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold">CATEGORY</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg">
                    <option>News</option><option>Event</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold">AUTHOR / OFFICE</label>
                  <input value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="PIO OFFICE" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">EVENT DATE (OPTIONAL)</label>
                <input type="datetime-local" value={formData.event_date} onChange={(e) => setFormData({...formData, event_date: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-semibold">IMAGE URL</label>
                <input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="https://images.unsplash.com/..." />
              </div>
              <div>
                <label className="text-xs font-semibold">CONTENT</label>
                <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg h-32" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={!!formData.is_published} onChange={(e) => setFormData({...formData, is_published: e.target.checked ? 1 : 0})} />
                <label className="text-sm">Publish immediately</label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-blue-900 text-white rounded-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}