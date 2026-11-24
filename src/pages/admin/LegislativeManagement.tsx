import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, FileText, Download, Eye, Edit, Trash2, X, Upload, Loader2, Sparkles, FileUp } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface Legislation {
  id: string;
  ordinance_no: string;
  title: string;
  description: string;
  author: string;
  status: string;
  type: string;
  date_approved: string;
  pdf_url: string;
  pdf_filename: string;
  file_size: number;
  created_at: string;
  legislation_type: string;
  file_url: string;
  document_url: string;
  year_series: string;
  full_text: string;
  txt_url: string;
}

// ============ OCR / GRAMMAR AUTO-FIX DICTIONARY ============
const fixOcrText = (s: string): string => {
  if (!s) return s;
  let out = s;
  const fixes: [RegExp, string][] = [
    [/\bLIGIITS\b/gi, 'LIGHTS'],
    [/\bLIGIIT\b/gi, 'LIGHT'],
    [/\bLIGHITS\b/gi, 'LIGHTS'],
    [/\bRESOLUTON\b/gi, 'RESOLUTION'],
    [/\bRESOLUT1ON\b/gi, 'RESOLUTION'],
    [/\bORDINANCE\b/gi, 'ORDINANCE'],
    [/\bORDNANCE\b/gi, 'ORDINANCE'],
    [/\bORD1NANCE\b/gi, 'ORDINANCE'],
    [/\bFINANCIAL ASSISTANCE\b/gi, 'FINANCIAL ASSISTANCE'],
    [/\bBARANGAY\b/gi, 'BARANGAY'],
    [/\bSANGGUNIANG\b/gi, 'SANGGUNIANG'],
    [/\bMUNICIPALITY\b/gi, 'MUNICIPALITY'],
    [/\bPROVINCE OF BOHOL\b/gi, 'PROVINCE OF BOHOL'],
    [/\bAPPROVING\b/gi, 'APPROVING'],
    [/\bPURCHASE\b/gi, 'PURCHASE'],
    [/\bAMOUNT OF\b/gi, 'AMOUNT OF'],
    [/\bTWENTY THOUSAND\b/gi, 'TWENTY THOUSAND'],
    [/\bPESOS\b/gi, 'PESOS'],
    [/\bREQUEST\b/gi, 'REQUEST'],
    [/\bENDORSES\b/gi, 'ENDORSES'],
    [/\bHUMAYHUMAY\b/gi, 'HUMAYHUMAY'],
    [/\bGUINTABOAN\b/gi, 'GUINTABOAN'],
    [/\bACHILA\b/gi, 'ACHILA'],
    [/\bBOHOL\b/gi, 'BOHOL'],
    [/\bUBAY\b/gi, 'UBAY'],
    [/\bPUROKS\b/gi, 'PUROKS'],
    [/\bSTREET LIGHTS\b/gi, 'STREET LIGHTS'],
    [/\bPUBLIC SAFETY\b/gi, 'PUBLIC SAFETY'],
    [/\bREVENUE CODE\b/gi, 'REVENUE CODE'],
    [/\bWHEREAS\b/gi, 'WHEREAS'],
    [/\bBE IT RESOLVED\b/gi, 'BE IT RESOLVED'],
    [/\bBE IT ORDAINED\b/gi, 'BE IT ORDAINED'],
  ];
  for (const [pat, rep] of fixes) out = out.replace(pat, rep);
  out = out.replace(/[#@£€¥§¶~^`_{}\[\]\\|<>]{2,}/g, ' ').replace(/\s+/g, ' ').trim();
  return out;
};

export default function LegislativeManagement() {
  const [legislations, setLegislations] = useState<Legislation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    ordinance_no: '',
    title: '',
    description: '',
    author: '',
    status: 'Approved',
    type: 'Ordinance',
    date_approved: '',
    legislation_type: 'Ordinance',
    year_series: new Date().getFullYear().toString(),
    full_text: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => { fetchLegislations(); }, []);

  const fetchLegislations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('legislations').select('*').order('created_at', { ascending: false });
    if (!error && data) setLegislations(data);
    setLoading(false);
  };

  const extractTextWithPdfjs = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const extractTextWithOCR = async (file: File): Promise<string> => {
    setAiStatus('📷 Image PDF ni - gi-OCR nako (Libre, Offline)...');
    const libName = 'tess' + 'eract.js';
    const ocrMod: any = await import(/* @vite-ignore */ libName);
    const OCR = ocrMod.default || ocrMod;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let ocrText = '';
    const pagesToOcr = Math.min(pdf.numPages, 3);
    for (let i = 1; i <= pagesToOcr; i++) {
      setAiStatus(`📷 Gi-OCR ang page ${i}/${pagesToOcr}... (${Math.round((i / pagesToOcr) * 100)}%)`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      const { data: { text } } = await OCR.recognize(canvas, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
      ocrText += text + '\n';
    }
    setOcrProgress(0);
    return ocrText;
  };

  const parseFromText = (text: string, filename: string) => {
    let title = '';
    let author = '';
    let dateApproved = '';
    let ordinanceNo = '';
    const fileMatch = filename.match(/(?:RESO|ORD|RESOLUTION|ORDINANCE)[\s\-_]*NO[\s\-_]*(\d+)/i);
    if (fileMatch) ordinanceNo = fileMatch[1];
    const yearMatch = filename.match(/S(\d{4})/i);
    let yearSeries = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
    const cleanText = fixOcrText(text.replace(/\s+/g, ' ').trim());
    const titlePatterns = [
      /(?:A RESOLUTION|AN ORDINANCE)[\s\S]{0,5}?(.*?)(?:\s+Sponsored by|\s+SPONSORED BY|\s+WHEREAS|\s+Whereas|\s+BE IT RESOLVED|\s+BE IT ORDAINED|$)/i,
      /(?:RESOLUTION NO\.?\s*\d+[^\n]*\n)(.*?)(?:\s+Sponsored by|\s+WHEREAS|$)/i,
    ];
    for (const pat of titlePatterns) {
      const m = cleanText.match(pat);
      if (m && m[1] && m[1].trim().length > 10) {
        title = fixOcrText(m[1].trim().replace(/^\W+/, '').substring(0, 500));
        break;
      }
    }
    if (!title) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20);
      title = fixOcrText(lines.find(l => !/RESOLUTION|ORDINANCE|REPUBLIC|PROVINCE|MUNICIPALITY|UBAY|BOHOL/i.test(l)) || '');
    }
    const authorMatch = text.match(/Sponsored by[:\s]*([A-Z][A-Za-z\s\.\-]+?)(?:\n|SB Member|Sangguniang|Author|$)/i);
    if (authorMatch) author = fixOcrText(authorMatch[1].trim());
    const dateMatch = text.match(/(?:APPROVED|ADOPTED|ENACTED)[\s\S]{0,30}?(\w+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      const parsed = new Date(dateMatch[1]);
      if (!isNaN(parsed.getTime())) dateApproved = parsed.toISOString().split('T')[0];
    }
    return { title, author, dateApproved, ordinanceNo, yearSeries };
  };

  const autofillWithGroq = async (extractedText: string, filename: string) => {
    setAiLoading(true);
    setAiStatus('🤖 Gi-analyze ni Groq ang document...');
    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqKey) throw new Error('No Groq key');
      const cleanedText = fixOcrText(extractedText);
      const prompt = `Ikaw ay assistant para sa Ubay Legislative Portal. I-extract ang info gikan sa document text sa ubos ug ibalik LANG ug JSON, walay lain text.

Text:
${cleanedText.substring(0, 8000)}

Filename: ${filename}

Ibalik nga JSON format:
{
  "ordinance_no": "395",
  "title": "tibuok title sa resolution/ordinance",
  "description": "1-2 sentences summary sa Bisaya o English",
  "author": "ngalan sa sponsor / author",
  "date_approved": "YYYY-MM-DD",
  "type": "Resolution o Ordinance",
  "year_series": "2026"
}

STRICT RULES:
- title: KOPYAHA WORD-FOR-WORD gikan sa document! AYAW USBA, AYAW PARAPHRASE!
- description: I-SUMMARY sa sakto nga grammar!
- author: Tibuok ngalan, apil middle initial.
- ordinance_no gikan sa filename o text, numero lang
- Kung walay makit-an, ibutang ""
- Ayaw pag-inventa ug numero o ngalan`;

      const MODELS = [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'meta-llama/llama-4-maverick-17b-128e-instruct',
        'qwen/qwen3-32b',
      ];

      let parsed: any = null;
      let lastError = '';
      for (const model of MODELS) {
        try {
          console.log('Trying Groq model:', model);
          setAiStatus(`🤖 Gi-try ang model ${model}...`);
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.1,
              response_format: { type: 'json_object' },
            }),
          });
          if (!res.ok) {
            const errText = await res.text();
            console.log(`Model ${model} failed:`, res.status, errText);
            lastError = res.status + ' ' + model;
            continue;
          }
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (!content) continue;
          parsed = JSON.parse(content);
          console.log('SUCCESS with model:', model);
          break;
        } catch (e: any) {
          console.log(`Model ${model} error:`, e.message);
          continue;
        }
      }
      if (!parsed) throw new Error('Tanan Groq models napakyas: ' + lastError);
      parsed.title = fixOcrText(parsed.title || '');
      parsed.description = fixOcrText(parsed.description || '');
      parsed.author = fixOcrText(parsed.author || '');
      setFormData(prev => ({
        ...prev,
        ordinance_no: parsed.ordinance_no || prev.ordinance_no,
        title: parsed.title || prev.title,
        description: parsed.description || prev.description,
        author: parsed.author || prev.author,
        date_approved: parsed.date_approved || prev.date_approved,
        type: parsed.type || prev.type,
        legislation_type: parsed.type || prev.legislation_type,
        year_series: parsed.year_series || prev.year_series,
        full_text: extractedText.substring(0, 50000),
      }));
      setAiStatus('✅ Na-autofill na ni Groq!');
    } catch (err) {
      console.error(err);
      setAiStatus('⚠️ Groq napakyas - gi-parse lang nako manually');
      const manual = parseFromText(extractedText, filename);
      setFormData(prev => ({
        ...prev,
        ordinance_no: manual.ordinanceNo || prev.ordinance_no,
        title: fixOcrText(manual.title) || prev.title,
        author: fixOcrText(manual.author) || prev.author,
        date_approved: manual.dateApproved || prev.date_approved,
        year_series: manual.yearSeries || prev.year_series,
        full_text: extractedText.substring(0, 50000),
      }));
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setAiLoading(true);
    setAiStatus('📄 Gi-extract ang text sa PDF...');
    try {
      let extractedText = await extractTextWithPdfjs(file);
      const weirdChars = (extractedText.match(/[#@£€¥§¶~^`_{}\[\]\\|<>]/g) || []).length;
      const garbageRatio = weirdChars / (extractedText.length || 1);
      if (extractedText.trim().length < 50 || garbageRatio > 0.02) {
        setAiStatus('📷 Garbage ang pdfjs text - gi-OCR nako para klaro...');
        extractedText = await extractTextWithOCR(file);
      } else {
        setAiStatus('✅ Na-extract ang text via pdfjs!');
      }
      extractedText = fixOcrText(extractedText);
      const manual = parseFromText(extractedText, file.name);
      if (manual.ordinanceNo) {
        setFormData(prev => ({ ...prev, ordinance_no: manual.ordinanceNo, year_series: manual.yearSeries }));
      }
      if (extractedText.trim().length > 50) {
        await autofillWithGroq(extractedText, file.name);
      } else {
        setAiStatus('⚠️ Walay ma-extract nga text bisan sa OCR - manual fill lang bro');
        setAiLoading(false);
      }
    } catch (err) {
      console.error(err);
      setAiStatus('❌ Napakyas pag-extract - manual fill lang');
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let pdfUrl = '';
      let pdfFilename = '';
      let fileSize = 0;
      if (selectedFile) {
        const fileName = `${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage.from('legislations').upload(fileName, selectedFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('legislations').getPublicUrl(fileName);
        pdfUrl = urlData.publicUrl;
        pdfFilename = selectedFile.name;
        fileSize = selectedFile.size;
      }
      const payload = {
        ordinance_no: formData.ordinance_no,
        title: formData.title,
        description: formData.description,
        author: formData.author,
        status: formData.status,
        type: formData.type,
        date_approved: formData.date_approved || null,
        legislation_type: formData.legislation_type,
        year_series: formData.year_series,
        full_text: formData.full_text,
        pdf_url: pdfUrl,
        pdf_filename: pdfFilename,
        file_size: fileSize,
        file_url: pdfUrl,
        document_url: pdfUrl,
      };
      if (editingId) {
        const { error } = await supabase.from('legislations').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('legislations').insert([payload]);
        if (error) throw error;
      }
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchLegislations();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ordinance_no: '', title: '', description: '', author: '',
      status: 'Approved', type: 'Ordinance', date_approved: '',
      legislation_type: 'Ordinance', year_series: new Date().getFullYear().toString(), full_text: '',
    });
    setSelectedFile(null);
    setAiStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (leg: Legislation) => {
    setEditingId(leg.id);
    setFormData({
      ordinance_no: leg.ordinance_no || '', title: leg.title || '', description: leg.description || '',
      author: leg.author || '', status: leg.status || 'Approved', type: leg.type || 'Ordinance',
      date_approved: leg.date_approved || '', legislation_type: leg.legislation_type || 'Ordinance',
      year_series: leg.year_series || '', full_text: leg.full_text || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete gyud ni?')) return;
    await supabase.from('legislations').delete().eq('id', id);
    fetchLegislations();
  };

  const allYears = Array.from(new Set(legislations.map(l => l.year_series).filter(Boolean))).sort((a, b) => Number(b) - Number(a));

  const filtered = legislations.filter(l => {
    const matchSearch = (l.title + l.ordinance_no + l.author).toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || l.type === filterType || l.legislation_type === filterType;
    const matchYear = filterYear === 'all' || l.year_series === filterYear;
    return matchSearch && matchType && matchYear;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Legislative Management</h1>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Add Legislation
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search title, number, author..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-lg px-3">
          <option value="all">All Types</option>
          <option value="Ordinance">Ordinance</option>
          <option value="Resolution">Resolution</option>
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border rounded-lg px-3">
          <option value="all">All Years</option>
          {allYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '70px' }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '70px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '100px' }} />
            </colgroup>
            <thead className="bg-gray-50"><tr>
              <th className="p-3 text-left">No.</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Author</th>
              <th className="p-3 text-left">Year</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(leg => (
                <tr key={leg.id} className="border-t align-top">
                  <td className="p-3 font-medium whitespace-nowrap">{leg.ordinance_no}</td>
                  <td className="p-3 leading-snug" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{leg.title}</td>
                  <td className="p-3 leading-snug" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{leg.author}</td>
                  <td className="p-3 whitespace-nowrap">{leg.year_series}</td>
                  <td className="p-3 whitespace-nowrap">{leg.date_approved}</td>
                  <td className="p-3 flex gap-2">
                    {leg.pdf_url && <a href={leg.pdf_url} target="_blank" rel="noreferrer" className="text-blue-600"><Eye size={18} /></a>}
                    <button onClick={() => handleEdit(leg)} className="text-green-600"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(leg.id)} className="text-red-600"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h- overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editingId ? 'Edit' : 'Add'} Legislation</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Ordinance / Reso No.</label>
                  <input value={formData.ordinance_no} onChange={e => setFormData({ ...formData, ordinance_no: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. 395" /></div>
                <div><label className="block text-sm font-medium">Year Series</label>
                  <input value={formData.year_series} onChange={e => setFormData({ ...formData, year_series: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="2026" /></div>
              </div>
              <div><label className="block text-sm font-medium">Title</label>
                <textarea value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Author / Sponsor</label>
                  <input value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium">Date Approved</label>
                  <input type="date" value={formData.date_approved} onChange={e => setFormData({ ...formData, date_approved: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value, legislation_type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option>Ordinance</option><option>Resolution</option>
                  </select></div>
                <div><label className="block text-sm font-medium">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option>Approved</option><option>Pending</option><option>Repealed</option>
                  </select></div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-2">📄 Upload PDF (sa ubos)</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50">
                  <FileUp className="mx-auto mb-2 text-gray-400" size={32} />
                  {selectedFile ? <p className="font-medium">{selectedFile.name}</p> : <p className="text-gray-500">Click to upload PDF</p>}
                  <p className="text-xs text-gray-400 mt-1">PDF lang - auto-extract + OCR kung image PDF</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />

                {aiLoading && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-600" size={18} />
                    <span className="text-sm text-blue-800">{aiStatus || 'Gi-process...'}</span>
                  </div>
                )}
                {!aiLoading && aiStatus && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">{aiStatus}</div>
                )}
                {ocrProgress > 0 && (
                  <div className="mt-2"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${ocrProgress}%` }}></div></div>
                    <p className="text-xs mt-1">OCR: {ocrProgress}%</p></div>
                )}
                {formData.full_text && (
                  <p className="text-xs text-gray-500 mt-2">✅ Full text na-capture: {formData.full_text.length.toLocaleString()} characters - magamit na ni sa chatbot!</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                  {uploading && <Loader2 className="animate-spin" size={16} />} {uploading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}