import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const ITEMS_PER_PAGE = 3;

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

  // Reset index when filter changes
  useEffect(() => { setCurrentIndex(0); }, [search, category]);

  const filtered = news.filter((n: any) => {
    const matchSearch = n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || n.category === category;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = currentIndex * ITEMS_PER_PAGE;
  const visibleNews = filtered.slice(start, start + ITEMS_PER_PAGE);

  const next = () => {
    if (currentIndex < totalPages - 1) setCurrentIndex(currentIndex + 1);
    else setCurrentIndex(0); // loop back
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else setCurrentIndex(totalPages - 1); // loop to end
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-8">

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">News & Events</h1>
          <p className="text-gray-600 mt-2">Stay updated with latest happenings in UBAY.</p>
        </div>

        <div className="bg-white border rounded-xl p-4 mb-10 flex gap-4 shadow-sm">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search news and events..." className="flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2.5 border rounded-lg bg-white font-medium">
            <option value="All">All Categories</option><option value="News">News</option><option value="Event">Event</option>
          </select>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed rounded-xl p-16 text-center"><p className="font-bold">No news found</p></div>
        ) : (
          <div className="relative">

            {/* LEFT ARROW - PROPER */}
            <button
              onClick={prev}
              className="absolute -left-4 lg:-left-16 top-1/2 -translate-y-1/2 z-10 bg-blue-900 hover:bg-blue-800 text-white w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300"
              aria-label="Previous"
            >
              <span className="text-3xl font-bold leading-none">‹</span>
            </button>

            {/* RIGHT ARROW - PROPER */}
            <button
              onClick={next}
              className="absolute -right-4 lg:-right-16 top-1/2 -translate-y-1/2 z-10 bg-blue-900 hover:bg-blue-800 text-white w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300"
              aria-label="Next"
            >
              <span className="text-3xl font-bold leading-none">›</span>
            </button>

            {/* 3 CARDS ONLY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500">
              {visibleNews.map((item: any) => (
                <div key={item.id} className="group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                  <div className="relative overflow-hidden h-56">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'} />
                    <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 rounded-full text-xs font-bold text-blue-900 shadow">{item.category}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg line-clamp-2 group-hover:text-blue-900 transition-colors">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.content}</p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold">{item.author}</p>
                      <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGE INDICATOR */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <p className="text-sm text-gray-500 font-medium">
                Page {currentIndex + 1} of {totalPages} • Showing {visibleNews.length} of {filtered.length} news
              </p>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-blue-900 w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'}`} />
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}