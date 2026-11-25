import { useState, useEffect, useMemo } from 'react';
import { Search, FileText, User, Filter, Eye, X, ZoomIn, ZoomOut, RotateCw, Shield, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Ordinances() {
  const [legislations, setLegislations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedOrdinance, setSelectedOrdinance] = useState<any>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: '', email: '', phone: '', purpose: '' });
  const [submitting, setSubmitting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  // PAGINATION - BY 10 LANG PER PAGE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // NARROW FILTER - AUTHOR + YEAR SERIES
  const [showNarrowFilter, setShowNarrowFilter] = useState(false);
  const [filterAuthor, setFilterAuthor] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  useEffect(() => { fetchLegislations(); }, []);
  
  useEffect(() => {
    if (!showPdfViewer) return;
    const blockContextMenu = (e: MouseEvent) => { e.preventDefault(); return false; };
    const blockKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey && ['s', 'p', 'c', 'u', 'a'].includes(e.key.toLowerCase())) || (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) || e.key === 'F12') {
        e.preventDefault(); return false;
      }
    };
    const blockDrag = (e: DragEvent) => { e.preventDefault(); return false; };
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockKeys as any);
    document.addEventListener('dragstart', blockDrag as any);
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockKeys as any);
      document.removeEventListener('dragstart', blockDrag as any);
      document.body.style.userSelect = '';
    };
  }, [showPdfViewer]);

  const fetchLegislations = async () => {
    setLoading(true);
    const { data } = await supabase.from('legislations').select('*').order('created_at', { ascending: false });
    if (data) setLegislations(data);
    setLoading(false);
  };

  const cleanTitle = (title: string) => { if (!title) return ''; return title.replace(/^[\s\-–—•\u00A0]+/, '').replace(/\s+/g, ' ').trim(); };
  const getYear = (item: any) => item?.year_series || (item?.date_approved ? new Date(item.date_approved).getFullYear().toString() : '');

  // FIX: NORMALIZE AUTHOR - PARA DILI MAG-BALIK-BALIK
  // "Hon. Daniel R. Delima" ug "Hon. Daniel R. Delima, II" -> usa ra!
  // "Hon. Galicano E. Alup" ug "Hon. Galicano E. Atup" -> usa ra!
  // "Hon. Glaiza Mae Atuel- Revilla" ug "Hon. Glaiza Mae S. Atuel" -> usa ra!
  const normalizeAuthor = (name: string) => {
    if (!name) return '';
    let n = name.toLowerCase().trim();
    n = n.replace(/^hon\.?\s+/i, ''); // tangtangon ang "Hon."
    n = n.replace(/,/g, ' '); // "," -> space
    n = n.replace(/\b(ii|iii|iv|jr\.?|sr\.?|ii\.?|iii\.?)\b/g, ''); // tangtangon ang II, Jr, III
    n = n.replace(/-/g, ' '); // "Atuel- Revilla" -> "Atuel Revilla"
    n = n.replace(/\./g, ' '); // tangtangon ang "."
    n = n.replace(/\b[a-z]\b/g, ''); // tangtangon ang middle initial nga "R", "S", "E"
    n = n.replace(/\s+/g, ' ').trim();
    // FIX TYPO: Alup = Atup (same nga tao)
    n = n.replace(/\balup\b/g, 'atup');
    return n;
  };

  // LIST SA AUTHORS - GI-GROUP NA, WALAY DUPLICATE
  const authorList = useMemo(() => {
    const map = new Map<string, { display: string; count: number }>();
    legislations.forEach(l => {
      const raw = (l.author || '').trim();
      if (!raw) return;
      const key = normalizeAuthor(raw);
      if (!key) return;
      // Ang display kay ang pinaka-kompleto / pinaka-taas nga version
      // Pananglitan: "Hon. Daniel R. Delima, II" ang ipakita, dili ang "Hon. Daniel R. Delima" lang
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { display: raw, count: 1 });
      } else {
        existing.count += 1;
        if (raw.length > existing.display.length) existing.display = raw;
      }
    });
    return Array.from(map.values())
      .sort((a, b) => a.display.localeCompare(b.display))
      .map(v => v.display);
  }, [legislations]);

  const yearList = useMemo(() => {
    const set = new Set<string>();
    legislations.forEach(l => { const y = getYear(l); if (y) set.add(y); });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [legislations]);

  const filtered = legislations.filter(item => {
    const m = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.ordinance_no || '').toLowerCase().includes(searchTerm.toLowerCase());
    const typeOk = filterType === 'All' || item.legislation_type === filterType || item.type === filterType;
    // FIX: Compare gamit ang normalized author, para maapil tanan variation
    const authorOk = filterAuthor === 'All' || normalizeAuthor(item.author || '') === normalizeAuthor(filterAuthor);
    const yearOk = filterYear === 'All' || getYear(item) === filterYear;
    return m && typeOk && authorOk && yearOk;
  });

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLegislations = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Para dili ma-stuck sa Page 3 kung mag-search ka - balik sa Page 1
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };
  const handleAuthorChange = (value: string) => {
    setFilterAuthor(value);
    setCurrentPage(1);
  };
  const handleYearChange = (value: string) => {
    setFilterYear(value);
    setCurrentPage(1);
  };
  const handleClearNarrowFilter = () => {
    setFilterAuthor('All');
    setFilterYear('All');
    setCurrentPage(1);
  };
  const hasNarrowFilter = filterAuthor !== 'All' || filterYear !== 'All';

  const handleViewPdf = (item: any) => {
    const pdfUrl = item.pdf_url || item.file_url || item.document_url;
    if (!pdfUrl) { alert('PDF not available'); return; }
    setSelectedPdf(pdfUrl); setSelectedOrdinance(item); setZoomLevel(100); setShowPdfViewer(true);
  };

  const closePdfViewer = () => { setSelectedPdf(null); setSelectedOrdinance(null); setShowPdfViewer(false); setShowRequestForm(false); setZoomLevel(100); };
  const handleZoomIn = () => { if (zoomLevel < 200) setZoomLevel(z => z + 25); };
  const handleZoomOut = () => { if (zoomLevel > 50) setZoomLevel(z => z - 25); };
  const handleResetZoom = () => setZoomLevel(100);

  const handleSubmitRequest = async () => {
    if (!requestForm.name || !requestForm.email || !requestForm.purpose) { alert('Fill Name, Email, Purpose!'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('copy_requests').insert({
      legislation_id: selectedOrdinance?.id, 
      legislation_number: selectedOrdinance?.ordinance_no,
      legislation_title: selectedOrdinance?.title,
      requester_name: requestForm.name, requester_email: requestForm.email, requester_phone: requestForm.phone, purpose: requestForm.purpose, status: 'Pending'
    });
    setSubmitting(false);
    if (!error) { alert('Request submitted!'); setShowRequestForm(false); setRequestForm({ name: '', email: '', phone: '', purpose: '' }); }
    else alert('Error: ' + error.message);
  };

  return (
    <div className="min-h-screen bg-transparent py-6 overflow-visible">
            {/* MOBILE: DISABLE HOVER - PARA DILI MAG-LAG ANG SCROLL */}
      <style>{`
        @media (hover: none) {
          .group:hover { transform: none !important; box-shadow: none !important; translate: none !important; }
          button:hover { transform: none !important; box-shadow: none !important; }
          * { -webkit-tap-highlight-color: transparent; }
        }
      `}</style>
      <div className="max-w-[95%] mx-auto px-2 md:px-4">
        <div className="mb-6 max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">Ordinances & Resolutions</h1>
  <p className="text-slate-600 mt-2">Search and download municipal legislative documents.</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border p-3 mb-5 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border rounded-lg px-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input value={searchTerm} onChange={e => handleSearchChange(e.target.value)} placeholder="Search ordinance, resolution..." className="flex-1 bg-transparent py-2 outline-none text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select value={filterType} onChange={e => handleFilterChange(e.target.value)} className="border rounded-lg px-3 py-2 text-xs bg-white">
                <option value="All">All Types</option>
                <option value="Ordinance">Ordinance</option>
                <option value="Resolution">Resolution</option>
              </select>
              {/* NARROW FILTER BUTTON */}
              <button
                onClick={() => setShowNarrowFilter(v => !v)}
                className={`flex items-center gap-1.5 border rounded-lg px-3 py-2 text-xs font-bold transition-colors ${showNarrowFilter || hasNarrowFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Narrow Filter
                {hasNarrowFilter && <span className="w-2 h-2 rounded-full bg-yellow-400" />}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showNarrowFilter ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* NARROW FILTER PANEL */}
          {showNarrowFilter && (
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Filter by Author</label>
                <select value={filterAuthor} onChange={e => handleAuthorChange(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-slate-900">
                  <option value="All">All Authors</option>
                  {authorList.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Filter by Year Series</label>
                <select value={filterYear} onChange={e => handleYearChange(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-slate-900">
                  <option value="All">All Years</option>
                  {yearList.map(y => (
                    <option key={y} value={y}>Series of {y}</option>
                  ))}
                </select>
              </div>
              {hasNarrowFilter && (
                <div className="md:col-span-2 flex items-center justify-between bg-slate-50 border rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-600">
                    Active filter: {filterAuthor !== 'All' ? <span className="font-bold text-slate-900">{filterAuthor}</span> : ''}
                    {filterAuthor !== 'All' && filterYear !== 'All' ? ' • ' : ''}
                    {filterYear !== 'All' ? <span className="font-bold text-slate-900">Series of {filterYear}</span> : ''}
                  </p>
                  <button onClick={handleClearNarrowFilter} className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700">
                    <X className="w-3.5 h-3.5" /> Clear Filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto space-y-4 overflow-visible">
          {loading ? <div className="text-center py-12"><div className="animate-spin w-6 h-6 border-4 border-slate-900 border-t-transparent rounded-full mx-auto"></div></div> :
            paginatedLegislations.length === 0 ? (
              <div className="text-center py-12 bg-white/90 border rounded-xl">
                <p className="text-sm font-bold text-slate-900">No legislations found.</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search or clearing the filter.</p>
                {hasNarrowFilter && (
                  <button onClick={handleClearNarrowFilter} className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full">Clear Narrow Filter</button>
                )}
              </div>
            ) :
            paginatedLegislations.map((item) => (
              <div key={item.id} className="group !transform-gpu bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm transition-all duration-300 ease-out will-change-transform hover:!scale-[1.02] hover:!-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:border-slate-900/20 cursor-pointer overflow-visible">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                  <div className="flex-1 min-w-0 order-2 md:order-1">
                    {item.ordinance_no && (
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">{item.ordinance_no}</span>
                        {getYear(item) && <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">Series of {getYear(item)}</span>}
                      </div>
                    )}
                    <h3 className="font-bold text-slate-900 text-sm md:text-base leading-[1.6] break-words" style={{ textAlign: 'justify', textIndent: '0' }}>
                      {cleanTitle(item.title)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <span className="flex items-center gap-1 text-xs text-slate-500"><User className="w-3 h-3" />{item.author || 'SB Ubay'}</span>
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">{item.status || 'APPROVED'}</span>
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs">{item.legislation_type || item.type || 'Ordinance'}</span>
                    </div>
                  </div>
                  <button onClick={() => handleViewPdf(item)} className="order-1 md:order-2 w-full md:w-auto text-xs font-bold text-slate-700 hover:text-white bg-slate-50 md:bg-transparent border border-slate-300 hover:border-slate-900 hover:bg-slate-900 px-4 py-2 md:py-1.5 rounded-full flex items-center justify-center md:justify-start gap-1.5 flex-shrink-0 transition-all hover:!scale-110 hover:shadow-lg">
                    <Eye className="w-4 h-4 md:w-3 md:h-3" /> View PDF
                  </button>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 max-w-5xl mx-auto">
          <div className="text-center text-xs text-slate-500 bg-white/80 backdrop-blur-sm border rounded-full px-3 py-1 shadow-sm">
            Showing <span className="font-bold text-slate-900">{filtered.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, filtered.length)}</span> of <span className="font-bold">{legislations.length}</span> legislations
          </div>

          {/* PAGINATION - BY 10 PER PAGE */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg bg-white text-sm font-bold disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-9 h-9 rounded-lg text-sm font-bold ${currentPage === page ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg bg-white text-sm font-bold disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}

          <div className="text-xs text-slate-400 text-center">© Sangguniang Bayan of Ubay - Legislative Portal</div>
        </div>
      </div>

      {showPdfViewer && selectedPdf && (
        <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col select-none" onContextMenu={(e) => e.preventDefault()}>
          <div className="w-full bg-white flex justify-between items-center px-2 md:px-3 py-2 border-b flex-shrink-0" style={{ height: '50px' }}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0"><FileText className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-xs md:text-xs font-bold truncate flex items-center gap-1"><Shield className="w-3 h-3 text-green-600" />{selectedOrdinance?.ordinance_no}{getYear(selectedOrdinance) ? ` • Series of ${getYear(selectedOrdinance)}` : ''} - Protected</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-2">
              <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1 border">
                <button onClick={handleZoomOut} disabled={zoomLevel <= 50} className="w-6 h-6 bg-white rounded-full flex items-center justify-center border disabled:opacity-30"><ZoomOut className="w-3.5 h-3.5" /></button>
                <span className="text-xs md:text-xs font-bold w-8 md:w-10 text-center">{zoomLevel}%</span>
                <button onClick={handleZoomIn} disabled={zoomLevel >= 200} className="w-6 h-6 bg-white rounded-full flex items-center justify-center border disabled:opacity-30"><ZoomIn className="w-3.5 h-3.5" /></button>
                <div className="w-px h-4 bg-slate-300 mx-1 hidden md:block"></div>
                <button onClick={handleResetZoom} className="w-6 h-6 bg-white rounded-full hidden md:flex items-center justify-center border"><RotateCw className="w-3 h-3" /></button>
              </div>
              <button onClick={closePdfViewer} className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-red-600"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-[#0f172a] flex justify-center items-start p-0 md:p-4" onContextMenu={(e) => e.preventDefault()}>
            <div className="bg-white shadow-2xl w-full md:w- md:rounded-sm flex-shrink-0 origin-top transition-transform duration-200 relative" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', minHeight: '85vh' }} onContextMenu={e => e.preventDefault()}>
              <iframe 
                src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedPdf)}&embedded=true`}
                className="w-full border-0 block md:rounded-sm" 
                style={{ height: '85vh', minHeight: '600px' }} 
                title="Protected PDF Viewer"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] rotate-[-30deg]">
                <span className="text-4xl md:text-6xl font-bold whitespace-nowrap">SB UBAY - PROTECTED</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-white flex justify-between items-center px-3 py-2 border-t flex-shrink-0" style={{ height: '50px' }}>
            <p className="text-xs md:text-xs text-slate-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Protected - © SB Ubay - {zoomLevel}%</p>
            <button onClick={() => setShowRequestForm(true)} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-4 py-1.5 rounded-full text-xs md:text-xs flex items-center gap-1"><FileText className="w-3 h-3" /> Request a Copy</button>
          </div>
        </div>
      )}

      {showRequestForm && (
        <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4" onContextMenu={(e) => e.preventDefault()}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Request a Copy</h3><button onClick={() => setShowRequestForm(false)} className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button></div>
            <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs"><p className="font-mono font-bold">{selectedOrdinance?.ordinance_no}{getYear(selectedOrdinance) ? ` • Series of ${getYear(selectedOrdinance)}` : ''}</p><p className="mt-1" style={{ textAlign: 'justify', textIndent: '0' }}>{cleanTitle(selectedOrdinance?.title || '')}</p></div>
            <div className="space-y-3">
              <input value={requestForm.name} onChange={e => setRequestForm({...requestForm, name: e.target.value})} placeholder="Full Name *" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <input value={requestForm.email} onChange={e => setRequestForm({...requestForm, email: e.target.value})} placeholder="Email *" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <input value={requestForm.phone} onChange={e => setRequestForm({...requestForm, phone: e.target.value})} placeholder="Phone" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              <textarea value={requestForm.purpose} onChange={e => setRequestForm({...requestForm, purpose: e.target.value})} placeholder="Purpose *" rows={3} className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none" />
              <button onClick={handleSubmitRequest} disabled={submitting} className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold">{submitting ? 'Submitting...' : 'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}