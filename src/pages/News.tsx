import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [currentSlide, setCurrentSlide] = useState(0);

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

  // Auto slide every 5 seconds
  useEffect(() => {
    if (news.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(news.length, 5));
    }, 5000);
    return () => clearInterval(interval);
  }, [news]);

  const filtered = news.filter((n: any) => {
    const matchSearch = n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || n.category === category;
    return matchSearch && matchCategory;
  });

  const featured = news.slice(0, 5);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % featured.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + featured.length) % featured.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">News & Events</h1>
          <p className="text-gray-600 mt-2">Stay updated with latest happenings in UBAY.</p>
        </div>

        {/* FEATURED SLIDER WITH ARROWS */}
        {!loading && featured.length > 0 && (
          <div className="relative mb-10 group">
            <div className="relative overflow-hidden rounded-2xl bg-black h-">
              {featured.map((item, idx) => (
                <div
                  key={item.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    idx === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                  }`}
                >
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <span className="px-3 py-1 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">{item.category}</span>
                    <h2 className="text-3xl font-bold mt-3 line-clamp-2 drop-shadow-lg">{item.title}</h2>
                    <p className="text-gray-200 mt-2 line-clamp-2 max-w-2xl">{item.content}</p>
                    <p className="text-xs text-gray-300 mt-3">{item.author} • {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}

              {/* LEFT ARROW */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-black w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                <span className="text-2xl">‹</span>
              </button>

              {/* RIGHT ARROW */}
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-black w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                <span className="text-2xl">›</span>
              </button>

              {/* DOTS */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {featured.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="bg-white border rounded-xl p-4 mb-8 flex gap-4 shadow-sm sticky top-0 z-10">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search news and events..."
            className="flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 border rounded-lg bg-white font-medium"
          >
            <option value="All">All Categories</option>
            <option value="News">News</option>
            <option value="Event">Event</option>
          </select>
        </div>

        {/* GRID WITH HOVER EFFECTS */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed rounded-xl p-16 text-center">
            <p className="font-bold">No news found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item: any) => (
              <div
                key={item.id}
                className="group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                <div className="relative overflow-hidden h-52">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-blue-900">
                    {item.category}
                  </span>
                  {/* Arrow that appears on hover */}
                  <div className="absolute bottom-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <span className="text-lg">→</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-blue-900 transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.content}</p>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-gray-500 font-medium">{item.author}</p>
                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}