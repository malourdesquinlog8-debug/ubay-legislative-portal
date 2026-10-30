import { useState, useEffect } from 'react';
import { Search, FileText, User, Filter, Eye, X, ZoomIn, ZoomOut, RotateCw, Shield } from 'lucide-react';
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

  const filtered = legislations.filter(item => {
    const m = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.ordinance_no || '').toLowerCase().includes(searchTerm.toLowerCase());
    return m && (filterType === 'All' || item.legislation_type === filterType || item.type === filterType);
  });

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

  const cleanTitle = (title: string) => { if (!title) return ''; return title.replace(/^[\s\-–—•\u00A0]+/, '').replace(/\s+/g, ' ').trim(); };

  return (
    <div className="min-h-screen bg-transparent py-6">
      <div className="max-w-[95%] mx-auto px-2 md:px-4">
        <div className="mb-6 max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 flex items-center gap-2"><FileText className="w-6 h-6" /> Legislative Documents</h1>
          <p className="text-slate-500 mt-1 text-sm">Official Ordinances and Resolutions of the Municipality of Ubay</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border p-3 mb-5 max-w-5xl mx-auto flex flex-col md:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border rounded-lg px-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search ordinance, resolution..." className="flex-1 bg-transparent py-2 outline-none text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-lg px-3 py-2 text-xs bg-white">
              <option value="All">All Types</option>
              <option value="Ordinance">Ordinance</option>
              <option value="Resolution">Resolution</option>
            </select>
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-3">
          {loading ? <div className="text-center py-12"><div className="animate-spin w-6 h-6 border-4 border-slate-900 border-t-transparent rounded-full mx-auto"></div></div> :
            filtered.map((item) => (
              <div key={item.id} className="group bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-slate-900/20 cursor-pointer">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {item.ordinance_no && <div className="mb-1.5"><span className="font-mono text- font-bold text-blue-900 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{item.ordinance_no}</span></div>}
                    <h3 className="font-bold text-slate-800 leading-[1.6] text- line-clamp-2" style={{ textAlign: 'justify', textIndent: '0px', hyphens: 'auto' as any }}>{cleanTitle(item.title)}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="flex items-center gap-1 text- text-slate-500"><User className="w-3 h-3" />{item.author || 'SB Ubay'}</span>
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text- font-bold">{item.status || 'APPROVED'}</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-">{item.legislation_type || item.type || 'Ordinance'}</span>
                    </div>
                  </div>
                  <button onClick={() => handleViewPdf(item)} className="text- font-bold text-slate-700 hover:text-white border border-slate-300 hover:border-slate-900 hover:bg-slate-900 px-3 py-1.5 rounded-full flex items-center gap-1 flex-shrink-0 transition-all"><Eye className="w-3 h-3" /> View PDF</button>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-6 flex flex-col items-center gap-1.5 max-w-5xl mx-auto">
          <div className="text-center text- text-slate-500 bg-white/80 backdrop-blur-sm border rounded-full px-3 py-1 shadow-sm">
            Showing <span className="font-bold text-slate-900">{filtered.length}</span> of <span className="font-bold">{legislations.length}</span> legislations
          </div>
          <div className="text- text-slate-400">© Sangguniang Bayan of Ubay - Legislative Portal</div>
        </div>
      </div>

      {showPdfViewer && selectedPdf && (
        <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col select-none" onContextMenu={(e) => e.preventDefault()}>
          <div className="w-full bg-white flex justify-between items-center px-3 py-2 border-b flex-shrink-0" style={{ height: '50px' }}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0"><FileText className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-xs font-bold truncate flex items-center gap-2"><Shield className="w-3 h-3 text-green-600" />{selectedOrdinance?.ordinance_no} - Protected View</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1 border">
                <button onClick={handleZoomOut} disabled={zoomLevel <= 50} className="w-6 h-6 bg-white rounded-full flex items-center justify-center border disabled:opacity-30"><ZoomOut className="w-3.5 h-3.5" /></button>
                <span className="text-xs font-bold w-10 text-center">{zoomLevel}%</span>
                <button onClick={handleZoomIn} disabled={zoomLevel >= 200} className="w-6 h-6 bg-white rounded-full flex items-center justify-center border disabled:opacity-30"><ZoomIn className="w-3.5 h-3.5" /></button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button onClick={handleResetZoom} className="w-6 h-6 bg-white rounded-full flex items-center justify-center border"><RotateCw className="w-3 h-3" /></button>
              </div>
              <button onClick={closePdfViewer} className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-red-600"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-[#0f172a] flex justify-center items-start p-4" onContextMenu={(e) => e.preventDefault()}>
            <div className="bg-white shadow-2xl rounded-sm flex-shrink-0 origin-top transition-transform duration-200 relative" style={{ width: '850px', transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', minHeight: '1100px' }} onContextMenu={e => e.preventDefault()}>
              <iframe src={`${selectedPdf}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`} className="w-full border-0 block rounded-sm" style={{ height: '1200px' }} title="Protected PDF Viewer" />
              <div className="absolute inset-0 z-10 bg-transparent" onContextMenu={e => { e.preventDefault(); return false; }} style={{ pointerEvents: 'auto' }} />
            </div>
          </div>

          <div className="w-full bg-white flex justify-between items-center px-3 py-2 border-t flex-shrink-0" style={{ height: '44px' }}>
            <p className="text- text-slate-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Protected - Scroll enabled - © SB Ubay - {zoomLevel}%</p>
            <button onClick={() => setShowRequestForm(true)} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-4 py-1.5 rounded-full text-xs flex items-center gap-1"><FileText className="w-3 h-3" /> Request a Copy</button>
          </div>
        </div>
      )}

      {showRequestForm && (
        <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4" onContextMenu={(e) => e.preventDefault()}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Request a Copy</h3><button onClick={() => setShowRequestForm(false)} className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button></div>
            <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs"><p className="font-mono font-bold">{selectedOrdinance?.ordinance_no}</p><p className="mt-1 text-justify" style={{ textAlign: 'justify', textIndent: '0' }}>{cleanTitle(selectedOrdinance?.title || '')}</p></div>
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