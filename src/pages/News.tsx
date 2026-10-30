import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [search, setSearch] = useState('');
  const itemsPerPage = 3;

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

  const filteredNews = news.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const visibleNews = filteredNews.slice(currentIndex * itemsPerPage, (currentIndex + 1) * itemsPerPage);

  const next = () => setCurrentIndex((prev) => (prev + 1) % totalPages);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-transparent min-h-screen">
      <h1 className="text-3xl font-serif font-bold text-slate-900">News & Events</h1>
      <p className="text-sm text-slate-500 mt-1">Stay updated with latest happenings in UBAY.</p>

      {/* SEARCH BAR */}
      <div className="border border-black rounded-xl p-3 flex gap-2 mt-6 mb-8 bg-white">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentIndex(0); }}
          placeholder="Search news and events..."
          className="flex-1 border border-black rounded-lg px-4 py-2 text-sm outline-none"
        />
        <select className="border border-black rounded-lg px-3 py-2 text-sm">
          <option>All Categories</option>
          <option>News</option>
          <option>Event</option>
        </select>
      </div>

      {/* SLIDER WRAPPER - RELATIVE + PX-12 PARA ARROW DILI MA TABONAN */}
      <div className="relative px-12 overflow-visible">

        {/* LEFT ARROW - SENTRO NA - TOP 1/2 */}
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-[#1e3a8a] hover:bg-blue-900 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleNews.map((item: any) => (
            <Link to={`/news/${item.id}`} key={item.id} className="group bg-white border border-black rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                <span className="absolute top-3 left-3 bg-white text- font-bold px-3 py-1 rounded-full border shadow-sm">
                  {item.category || 'Event'}
                </span>
              </div>
              <div className="p-4">
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

        {/* RIGHT ARROW - SENTRO NA - TOP 1/2 */}
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-[#1e3a8a] hover:bg-blue-900 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

      </div>

      {/* PAGE INDICATOR */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <p className="text-sm text-gray-500 font-medium">
          Page {currentIndex + 1} of {totalPages} • Showing {visibleNews.length} of {filteredNews.length} news
        </p>
        <div className="flex gap-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-[#1e3a8a]' : 'w-2 bg-gray-300'}`}
            />
          ))}
        </div>
      </div>

    </div>
  );
}