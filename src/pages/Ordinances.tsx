import { useState, useEffect } from 'react';
import { Search, FileText, Calendar, User, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Ordinances() {
  const [legislations, setLegislations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetchLegislations();
  }, []);

  const fetchLegislations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('legislations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLegislations(data);
    }
    setLoading(false);
  };

  const filtered = legislations.filter(item => {
    const matchesSearch = 
      (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'All' || item.legislation_type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-lgu-blue-900 flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Legislative Documents
          </h1>
          <p className="text-slate-500 mt-2">Official Ordinances and Resolutions of the Municipality of Ubay</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border rounded-lg px-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ordinance, resolution, franchise..."
              className="flex-1 bg-transparent py-2.5 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded-lg px-3 py-2.5 text-sm bg-white"
            >
              <option value="All">All Types</option>
              <option value="Ordinance">Ordinance</option>
              <option value="Resolution">Resolution</option>
            </select>
          </div>
        </div>

        {/* Cards List - OVERFLOW VISIBLE PARA MO-BULGE */}
        <div className="space-y-4 overflow-visible p-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-lgu-blue-900 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-slate-500 text-sm">Loading legislations...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No legislations found</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="
                  group bg-white border border-slate-300 rounded-xl p-5 shadow-sm
                  transition-all duration-300 ease-out
                  hover:scale-[1.03] hover:shadow-2xl hover:z-30 hover:border-lgu-blue-900 
                  hover:-translate-y-2 hover:bg-slate-50
                  cursor-pointer relative
                  overflow-visible
                "
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lgu-blue-900 text- md:text- leading-snug uppercase tracking-wide
                                   group-hover:text-blue-700 transition-colors">
                      {item.number} - {item.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3 text- text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.author || item.sponsor || 'Sangguniang Bayan'} 
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text- font-bold">
                        {item.status || 'APPROVED'}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-">
                        {item.legislation_type || 'Ordinance'}
                      </span>
                      {item.date_enacted && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date_enacted).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text- text-slate-600 mt-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <a
                    href={item.pdf_url || item.file_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!item.pdf_url && !item.file_url) {
                        e.preventDefault();
                        alert('PDF not available for this legislation');
                      }
                    }}
                    className="
                      text-xs font-bold text-lgu-blue-900 underline whitespace-nowrap
                      px-3 py-1.5 rounded-full border border-lgu-blue-900/20
                      group-hover:bg-lgu-blue-900 group-hover:text-white group-hover:no-underline
                      group-hover:scale-110 group-hover:shadow-lg
                      transition-all duration-300
                    "
                  >
                    View PDF
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Count */}
        <div className="mt-8 text-center text-xs text-slate-400">
          Showing {filtered.length} of {legislations.length} legislations
        </div>
      </div>
    </div>
  );
}