import { uploadToR2, deleteFromR2 } from "../../utils/r2Upload";
import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit, Trash2, Upload, X, Calendar, User, Eye, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export default function LegislativeManagement() {
  const [legislations, setLegislations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [formData, setFormData] = useState({
    ordinance_no: '', title: '', type: 'Ordinance', legislation_type: 'Ordinance', status: 'Approved',
    date_approved: new Date().toISOString().split('T')[0], author: '', pdf_url: '', file_url: '', document_url: '',
    year_series: new Date().getFullYear().toString(),
  });

  useEffect(() => { fetchLegislations(); }, []);
  const fetchLegislations = async () => {
    setLoading(true);
    const { data } = await supabase.from('legislations').select('*').order('created_at', { ascending: false });
    if (data) setLegislations(data);
    setLoading(false);
  };

  const formatDateLong = (d: string) => {
    if (!d) return '-';
    try {
      const date = new Date(d + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
    } catch { return d; }
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ordinance_no: item.ordinance_no || '', title: item.title || '', type: item.type || 'Ordinance',
        legislation_type: item.legislation_type || item.type || 'Ordinance', status: item.status || 'Approved',
        date_approved: item.date_approved ? item.date_approved.split('T')[0] : new Date().toISOString().split('T')[0],
        author: item.author || '', pdf_url: item.pdf_url || '', file_url: item.file_url || '', document_url: item.document_url || '',
        year_series: item.year_series || (item.date_approved ? new Date(item.date_approved).getFullYear().toString() : new Date().getFullYear().toString()),
      });
    } else {
      setEditingItem(null);
      setFormData({ ordinance_no: '', title: '', type: 'Ordinance', legislation_type: 'Ordinance', status: 'Approved', date_approved: new Date().toISOString().split('T')[0], author: '', pdf_url: '', file_url: '', document_url: '', year_series: new Date().getFullYear().toString(), });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setEditingItem(null); setUploading(false); setAutoFilling(false); };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return;
  setUploading(true);
  try {
    const publicUrl = await uploadToR2(file, "ordinances");
    setFormData((prev) => ({ ...prev, pdf_url: publicUrl, file_url: publicUrl, document_url: publicUrl }));
  } catch (err: any) { alert('Upload failed: ' + err.message); }
  setUploading(false);
};

  const cleanTitleText = (rawTitle: string) => {
    let t = rawTitle.replace(/\s+/g, ' ').trim();
    const stops = [
      /\(Sponsored by/i, /\(Authored by/i, /\(Author:/i,
      /\bWHEREAS\b/i, /\bENACTING CLAUSE\b/i, /\bBE IT ORDAINED\b/i,
      /\bBE IT RESOLVED\b/i, /\bNOW THEREFORE\b/i,
      /\bRESOLVED,?\s+AS IT IS HEREBY/i, /\bSECTION 1\b/i,
      /\bSubmitted by/i, /\bRespectfully/i, /\bCertified by/i, /\bAttested by/i, /\bApproved:/i,
    ];
    for (const re of stops) {
      const idx = t.search(re);
      if (idx !== -1) { t = t.substring(0, idx).trim(); break; }
    }
    t = t.replace(/[:;\-,.]+$/, '').trim();
    return t;
  };

  // --- AUTO-FILL - GEMINI VISION LANG, WALAY INSTANT PARA ACCURATE ---
  const handleAutoFill = async () => {
    if (!formData.pdf_url) { alert('Please upload a PDF first.'); return; }
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) { alert('Gemini API Key not found. Please check your environment variables.'); return; }
    setAutoFilling(true);
    try {
      const res = await fetch(formData.pdf_url);
      const buf = await res.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
      const page = await pdf.getPage(1);

      // Kuhaa ang text para reference lang, DILI para i-save diretso
      let page1Text = '';
      try {
        const content = await page.getTextContent();
        page1Text = content.items.map((it: any) => it.str).join(' ').slice(0, 8000);
      } catch {}

      const applyParsed = (parsed: any) => {
        let cleanTitle = cleanTitleText(parsed.title || '');
        cleanTitle = cleanTitle.replace(/^RESOLUTION\s+NO\.?\s*\d+.*?(?=A\s+RESOLUTION|AN\s+ORDINANCE)/i, '').trim();
        cleanTitle = cleanTitle.replace(/^ORDINANCE\s+NO\.?\s*\d+.*?(?=A\s+RESOLUTION|AN\s+ORDINANCE)/i, '').trim();
        cleanTitle = cleanTitleText(cleanTitle);
        setFormData((prev) => ({
          ...prev,
          ordinance_no: parsed.ordinance_no || prev.ordinance_no,
          title: cleanTitle || prev.title,
          type: parsed.type === 'Resolution' ? 'Resolution' : parsed.type === 'Ordinance' ? 'Ordinance' : prev.type,
          legislation_type: parsed.type === 'Resolution' ? 'Resolution' : parsed.type === 'Ordinance' ? 'Ordinance' : prev.legislation_type,
          date_approved: parsed.date_approved || prev.date_approved,
          year_series: parsed.year_series || (parsed.date_approved ? parsed.date_approved.slice(0,4) : prev.year_series),
          author: parsed.author || prev.author,
        }));
      };
      const parseJson = (raw: string) => {
        try {
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}');
          if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);
          raw = raw.replace(/```json|```/g, '').trim();
          return JSON.parse(raw);
        } catch {
          const no = raw.match(/"ordinance_no"\s*:\s*"([^"]*)/)?.[1] || '';
          const title = raw.match(/"title"\s*:\s*"([^"]*)/)?.[1] || '';
          const type = raw.match(/"type"\s*:\s*"([^"]*)/)?.[1] || '';
          const date = raw.match(/"date_approved"\s*:\s*"([^"]*)/)?.[1] || '';
          const year = raw.match(/"year_series"\s*:\s*"([^"]*)/)?.[1] || '';
          const author = raw.match(/"author"\s*:\s*"([^"]*)/)?.[1] || '';
          return { ordinance_no: no, title, type, date_approved: date, year_series: year, author };
        }
      };
      const models = ['gemini-3.8-flash', 'gemini-3-flash-preview'];

      // HIGH RES IMAGE - scale 2.0 para klaro mabasa ni Gemini ang mga letra
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const b64 = dataUrl.split(',')[1];

      const prompt = `You are reading a scanned Page 1 of a Philippine LGU Ordinance or Resolution (Ubay, Bohol). The scan may have OCR errors, so READ THE IMAGE VISUALLY - do NOT copy the garbled extracted text.

Extract and return ONLY this JSON: {"ordinance_no": "", "title": "", "type": "Ordinance", "date_approved": "YYYY-MM-DD", "year_series": "", "author": ""}

CRITICAL ACCURACY RULES:
- Read every word carefully from the IMAGE. Fix OCR errors: e.g. if image shows "CASH" write "CASH" not "CAsll", "WHO" not "Wllo", "REGIONAL" not "REGIoNAL", "COMPETITIONS" not "COMPETItIoNS", "OF" not "oF".
- Use correct English spelling and proper capitalization for normal words. Keep proper names, numbers, and amounts exactly as shown.
- Title: Start ONLY from "A RESOLUTION" or "AN ORDINANCE". STOP the title BEFORE WHEREAS, ENACTING CLAUSE, BE IT ORDAINED, BE IT RESOLVED, NOW THEREFORE, SECTION 1, or (Sponsored by / (Authored by. Do NOT include "RESOLUTION NO." or "Series of" in title. Do NOT include WHEREAS clauses.
- Type = Ordinance or Resolution. If not found, use "".
- Text reference (may contain OCR errors, use image as truth): ${page1Text}`;

      let gData: any = null;
      let lastError = '';
      for (const model of models) {
        try {
          const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: b64 } }] }], generationConfig: { temperature: 0, maxOutputTokens: 2000 } })
          });
          gData = await gRes.json();
          if (gData?.error) { lastError = gData.error.message; continue; }
          if (gData?.candidates?.[0]?.content?.parts?.[0]?.text) break;
        } catch (e: any) { lastError = e.message; continue; }
      }
      if (!gData || gData?.error) { throw new Error('Gemini error: ' + lastError); }
      let raw = gData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!raw.trim()) { throw new Error('No content returned. Please try again.'); }
      const parsed = parseJson(raw);
      applyParsed(parsed);
      alert('Auto-fill completed. Please verify the details before saving.');
    } catch (err: any) {
      console.error(err);
      alert('Auto-fill failed: ' + (err.message || 'Please check the PDF and API Key.'));
    }
    setAutoFilling(false);
  };

  const handleSave = async () => {
    if (!formData.ordinance_no || !formData.title) { alert('Legislation Number and Title are required.'); return; }
    const no = formData.ordinance_no.trim();
    const yr = formData.year_series.trim();
    const ttl = formData.title.trim();
    const { data: existing } = await supabase.from('legislations').select('id, ordinance_no, year_series, title').eq('ordinance_no', no).eq('year_series', yr);
    const duplicate = (existing || []).find((item: any) => item.title?.trim().toLowerCase() === ttl.toLowerCase() && (!editingItem || item.id !== editingItem.id));
    if (duplicate) {
      const proceed = confirm(`This legislation already exists:\n\nNo: ${no}\nYear: ${yr}\nTitle: ${ttl}\n\nDo you still want to save it as a duplicate?`);
      if (!proceed) return;
    }
    const payload = {
      ordinance_no: no, title: ttl, type: formData.type, legislation_type: formData.legislation_type,
      status: formData.status, date_approved: formData.date_approved, author: formData.author,
      pdf_url: formData.pdf_url, file_url: formData.file_url || formData.pdf_url, document_url: formData.document_url || formData.pdf_url,
      year_series: yr || formData.date_approved?.slice(0,4) || '',
    };
    const { error } = editingItem ? await supabase.from('legislations').update(payload).eq('id', editingItem.id) : await supabase.from('legislations').insert(payload);
    if (!error) { handleCloseModal(); fetchLegislations(); }
    else alert('Error: ' + error.message);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this legislation? This will also delete the PDF file.')) return;
    const item = legislations.find((l) => l.id === id);
    const fileUrl = item?.pdf_url || item?.file_url || item?.document_url;
    if (fileUrl) {
      await deleteFromR2(fileUrl);
    }
    await supabase.from('legislations').delete().eq('id', id);
    fetchLegislations();
  };
  const filtered = legislations.filter(item => (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.ordinance_no || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Legislative Management</h1>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Legislation</button>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400" />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="flex-1 outline-none text-sm" />
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr className="text-xs font-bold text-slate-600">
                <th className="text-left p-3">Number</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Year</th>
                <th className="text-left p-3">Date</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center p-8">Loading...</td></tr> :
                filtered.map(item => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">{item.ordinance_no}</td>
                    <td className="p-3"><p className="text-xs line-clamp-1 max-w- font-medium" title={item.title}>{item.title}</p></td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">{item.type}</span></td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-bold">{item.status}</span></td>
                    <td className="p-3 font-bold">{item.year_series || (item.date_approved ? new Date(item.date_approved).getFullYear() : '-')}</td>
                    <td className="p-3 text-xs text-slate-500">{item.date_approved ? formatDateLong(item.date_approved) : '-'}</td>
                    <td className="p-3"><div className="flex justify-end gap-1">
                        {item.pdf_url && <a href={item.pdf_url} target="_blank" className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center"><Eye className="w-3 h-3" /></a>}
                        <button onClick={() => handleOpenModal(item)} className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Edit className="w-3 h-3" /></button>
                        <button onClick={() => handleDelete(item.id)} className="w-6 h-6 bg-red-50 text-red-600 rounded-full flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
                      </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h- flex flex-col shadow-2xl my-auto">
            <div className="shrink-0 bg-white p-6 border-b flex justify-between items-center rounded-t-2xl">
              <h3 className="font-bold text-xl">{editingItem ? 'Edit' : 'Add'} Legislation</h3>
              <button onClick={handleCloseModal} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-bold mb-1.5 block">Legislation Number *</label><input value={formData.ordinance_no} onChange={e => setFormData({...formData, ordinance_no: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Ex: 2026-08" /></div>
                <div><label className="text-sm font-bold mb-1.5 block">Year Series *</label><input value={formData.year_series} onChange={e => setFormData({...formData, year_series: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Ex: 2026" /></div>
              </div>
              <div><label className="text-sm font-bold mb-1.5 block">Title *</label><textarea value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} rows={4} className="w-full border rounded-xl px-4 py-3 text-sm resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-bold mb-1.5 block">Type</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value, legislation_type: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm bg-white"><option>Ordinance</option><option>Resolution</option></select></div>
                <div><label className="text-sm font-bold mb-1.5 block">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm bg-white"><option>Approved</option><option>Pending</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-bold mb-1.5 flex items-center gap-1"><Calendar className="w-4 h-4" /> Date Approved</label><input type="date" value={formData.date_approved} onChange={e => setFormData({...formData, date_approved: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm" /><p className="text-xs text-slate-500 mt-1">Display: {formatDateLong(formData.date_approved)}</p></div>
                <div><label className="text-sm font-bold mb-1.5 flex items-center gap-1"><User className="w-4 h-4" /> Author</label><input value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm" /></div>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                <label className="text-sm font-bold mb-3 block flex items-center gap-2"><Upload className="w-4 h-4" /> Select PDF File</label>
                {formData.pdf_url ? (
                  <div className="space-y-3">
                    <div className="bg-white border rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center"><FileText className="w-5 h-5 text-red-600" /></div><p className="text-sm font-bold">PDF Uploaded</p></div>
                      <div className="flex gap-2"><a href={formData.pdf_url} target="_blank" className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Eye className="w-5 h-5" /></a><button onClick={() => setFormData({...formData, pdf_url: '', file_url: '', document_url: ''})} className="w-9 h-9 bg-red-50 text-red-600 rounded-full flex items-center justify-center"><X className="w-5 h-5" /></button></div>
                    </div>
                    <button onClick={handleAutoFill} disabled={autoFilling} className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                      {autoFilling ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading Page 1... Please wait</> : <><Sparkles className="w-4 h-4" /> Auto-fill from PDF Page 1</>}
                    </button>
                    <p className="text-xs text-slate-500 text-center">Only Page 1 will be read. Please verify before saving.</p>
                  </div>
                ) : (
                  <label className="w-full bg-white border rounded-xl px-6 py-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-sm font-bold">{uploading ? 'Uploading...' : 'Click to select PDF'}</span>
                    <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div className="shrink-0 bg-white p-5 border-t flex justify-end gap-3 rounded-b-2xl">
              <button onClick={handleCloseModal} className="px-6 py-2.5 border rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold">{editingItem ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}