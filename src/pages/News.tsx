import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => setNews(data))
      .catch(() => {
        // FALLBACK DATA PARA TESTING
        setNews([
          { id: 1, title: 'TAPAL FIESTA CELEBRATION', author: 'SB SEC', category: 'Event', image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800', created_at: '2026-10-27', description: 'TAPAL FIESTA CELEBRATION' },
          { id: 2, title: 'TAPON FIESTA', author: 'MPIO OFFICE', category: 'News', image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800', created_at: '2026-10-27', description: 'TAPON FIESTA CELEBRATION' },
          { id: 3, title: 'UNION TOWN FIESTA', author: 'HRMO OFFICE', category: 'Event', image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800', created_at: '2026-10-27', description: 'UNION TOWN FIESTA' },
          { id: 4, title: 'UBAY FOUNDATION DAY', author: 'MPIO OFFICE', category: 'News', image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800', created_at: '2026-10-27', description: 'UBAY FOUNDATION CELEBRATION' },
          { id: 5, title: 'BARANGAY CLEAN UP', author: 'SB SEC', category: 'Event', image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800', created_at: '2026-10-27', description: 'CLEAN UP DRIVE' },
        ]);
      });
  }, []);

  const filteredNews = news.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All Categories' || n.category === category;
    return matchSearch && matchCategory;
  });

  const visibleNews = filteredNews.slice(0, visibleCount);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">News & Events</h1>
      <p className="text-slate-600 mt-2">Stay updated with latest happenings in Ubay.</p>

      {/* SEARCH BAR */}
      <div className="border border-black rounded-xl p-3 flex flex-col sm:flex-row gap-2 mt-6 mb-8 bg-white">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisibleCount(5); }}
          placeholder="Search news and events..."
          className="flex-1 border border-black rounded-lg px-4 py-2 text-sm outline-none"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setVisibleCount(5); }}
          className="border border-black rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
        >
          <option>All Categories</option>
          <option>News</option>
          <option>Event</option>
        </select>
      </div>

      {/* CARDS - PAUBOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleNews.map((item: any) => (
          <Link to={`/news/${item.id}`} key={item.id} className="group bg-white border border-black rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
              <span className="absolute top-3 left-3 bg-white text- font-bold px-3 py-1 rounded-full border shadow-sm">
                {item.category || 'Event'}
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-bold text- uppercase line-clamp-2 leading-tight">{item.title}</h3>
              <p className="text-xs text-gray-400 mt-1 uppercase">{item.description || item.title}</p>
              <div className="flex justify-between mt-4 pt-3 border-t border-black">
                <p className="text-xs font-semibold">{item.author}</p>
                <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* SEE MORE */}
      {visibleCount < filteredNews.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount(visibleCount + 5)}
            className="bg-[#0f172a] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-900"
          >
            See More News
          </button>
        </div>
      )}

      {filteredNews.length > 0 && visibleCount >= filteredNews.length && (
        <p className="text-center text-sm text-gray-500 mt-8">No more news to show</p>
      )}

      {filteredNews.length === 0 && (
        <p className="text-center text-sm text-gray-500 mt-8">No news found.</p>
      )}
    </div>
  );
}