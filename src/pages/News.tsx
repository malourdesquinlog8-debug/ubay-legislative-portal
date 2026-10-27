import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    if (direction === 'left') {
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w- mx-auto px-4 py-8 relative">

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">News & Events</h1>
          <p className="text-gray-600 mt-2">Stay updated with latest happenings in UBAY.</p>
        </div>

        {/* Search */}
        <div className="bg-white border rounded-xl p-4 mb-8 flex gap-4 shadow-sm">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search news and events..." className="flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2.5 border rounded-lg bg-white font-medium">
            <option value="All">All Categories</option><option value="News">News</option><option value="Event">Event</option>
          </select>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed rounded-xl p-16 text-center"><p className="font-bold">No news found</p></div>
        ) : (
          /* CONTAINER WITH SIDE ARROWS */
          <div className="relative group">

            {/* LEFT ARROW - KILID */}
            <button
              onClick={() => scroll('left')}
              className="absolute -left-6 lg:-left-12 top-1/2 -translate-y-1/2 z-20 bg-white shadow-xl border hover:bg-blue-900 hover:text-white text-gray-700 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* RIGHT ARROW - KILID */}
            <button
              onClick={() => scroll('right')}
              className="absolute -right-6 lg:-right-12 top-1/2 -translate-y-1/2 z-20 bg-white shadow-xl border hover:bg-blue-900 hover:text-white text-gray-700 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* SCROLLABLE CAROUSEL */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filtered.map((item: any) => (
                <div
                  key={item.id}
                  className="group/card flex-shrink-0 w- sm:w- bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative overflow-hidden h-52">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                      onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                    <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur rounded-full text-xs font-bold text-blue-900 shadow">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg line-clamp-2 group-hover/card:text-blue-900 transition-colors leading-tight">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.content}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold text-gray-700">{item.author}</p>
                      <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* GRADIENT FADES SA KILID PARA NINDOT */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-gray-50 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-gray-50 to-transparent" />
          </div>
        )}

        {/* PAGINATION DOTS FOR MOBILE */}
        <div className="flex justify-center mt-6 gap-2 lg:hidden">
          <p className="text-xs text-gray-400">← Swipe or use arrows →</p>
        </div>

      </div>

      {/* HIDE SCROLLBAR CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}