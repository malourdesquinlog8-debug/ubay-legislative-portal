import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setNews(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchNews();
  }, []);

  const filtered = news.filter((n: any) => {
    const matchSearch = n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || n.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">News & Events</h1>
      <p className="text-gray-600 mt-2">Stay updated with latest happenings in UBAY.</p>
      <div className="bg-white border rounded-xl p-4 mt-8 flex gap-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search news and events..." className="flex-1 px-4 py-2 border rounded-lg" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2 border rounded-lg"><option value="All">All Categories</option><option value="News">News</option><option value="Event">Event</option></select>
      </div>
      <div className="mt-8">
        {loading ? <p>Loading...</p> : filtered.length === 0 ? <div className="bg-white border border-dashed rounded-xl p-16 text-center"><p className="font-bold">No news found</p></div> : (
          <div className="grid md:grid-cols-3 gap-6">
            {filtered.map((item: any) => (
              <div key={item.id} className="bg-white border rounded-xl overflow-hidden">
                {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />}
                <div className="p-5"><span className="text-xs px-2 py-1 bg-blue-100 rounded-full">{item.category}</span><h3 className="font-bold mt-3">{item.title}</h3><p className="text-sm text-gray-600 mt-2 line-clamp-3">{item.content}</p><p className="text-xs text-gray-500 mt-3">{item.author}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}