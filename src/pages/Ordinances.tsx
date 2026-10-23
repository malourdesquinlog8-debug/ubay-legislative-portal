import { useState, useEffect } from 'react';

interface Legislation {
  id: number;
  title: string;
  type: string;
  number: string;
  description: string;
  author: string;
  status: string;
  date_approved: string;
  file_path: string;
  created_at: string;
}

export default function Ordinances() {
  const [legislations, setLegislations] = useState<Legislation[]>([]);
  const [filtered, setFiltered] = useState<Legislation[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLegislations(); }, []);

  useEffect(() => {
    let result = [...legislations];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l => 
        (l.title || '').toLowerCase().includes(s) ||
        (l.number || '').toLowerCase().includes(s) ||
        (l.description || '').toLowerCase().includes(s) ||
        (l.type || '').toLowerCase().includes(s) ||
        (l.author || '').toLowerCase().includes(s)
      );
    }
    if (typeFilter !== 'All') {
      result = result.filter(l => l.type === typeFilter);
    }
    if (statusFilter !== 'All') {
      result = result.filter(l => l.status === statusFilter);
    }
    setFiltered(result);
  }, [search, typeFilter, statusFilter, legislations]);

  const fetchLegislations = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/legislations');
      const data = await res.json();
      setLegislations(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Ordinances and Resolutions</h1>
          <p className="text-slate-600 mt-2">Ordinances and Resolutions of Sangguniang Bayan ng Ubay</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Search</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, number, description..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 text-sm"
                />
                <span className="absolute left-3 top-3 text-slate-400">🔍</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm bg-white">
                <option value="All">All Types</option>
                <option value="Ordinance">Ordinance</option>
                <option value="Resolution">Resolution</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm bg-white">
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="On 1st Reading">On 1st Reading</option>
                <option value="On 2nd Reading">On 2nd Reading</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-slate-500">Showing {filtered.length} of {legislations.length} documents</p>
            {(search || typeFilter !== 'All' || statusFilter !== 'All') && (
              <button onClick={() => { setSearch(''); setTypeFilter('All'); setStatusFilter('All'); }} className="text-sm font-medium hover:underline">Clear filters</button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b text-left">
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">Number</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">No documents found for "{search}"</td></tr>
                ) : (
                  filtered.map((leg) => (
                    <tr key={leg.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-bold">{leg.number || '-'}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{leg.title || 'Untitled'}</p>
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">{leg.description || ''}</p>
                      </td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs bg-slate-100">{leg.type || '-'}</span></td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs bg-green-100 text-green-800">{leg.status || '-'}</span></td>
                      <td className="px-6 py-4">
                        {leg.file_path ? (
                          <a href={`http://localhost:3001${leg.file_path}`} target="_blank" className="text-sm text-blue-600 hover:underline">📄 View PDF</a>
                        ) : (
                          <span className="text-sm text-slate-400">No file</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}