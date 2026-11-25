import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Eye, Edit, Trash2, X, Loader2, FileUp } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PaddleOcrService } from 'ppu-paddle-ocr/web';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface Legislation {
  id: string; ordinance_no: string; title: string; description: string; author: string; status: string; type: string; date_approved: string; pdf_url: string; pdf_filename: string; file_size: number; created_at: string; legislation_type: string; file_url: string; document_url: string; year_series: string; full_text: string; txt_url: string; classification: string;
}

const fixOcrText = (s: string): string => {
  if (!s) return s;
  let out = s;
  const fixes: [RegExp, string][] = [
    [/\bLIGIITS\b/gi, 'LIGHTS'], [/\bLIGIIT\b/gi, 'LIGHT'], [/\bLIGHITS\b/gi, 'LIGHTS'],
    [/\bRESOLUTON\b/gi, 'RESOLUTION'], [/\bRESOLUT1ON\b/gi, 'RESOLUTION'],
    [/\bORDINANCE\b/gi, 'ORDINANCE'], [/\bORDNANCE\b/gi, 'ORDINANCE'], [/\bORD1NANCE\b/gi, 'ORDINANCE'],
    [/\bFINANCIAL ASSISTANCE\b/gi, 'FINANCIAL ASSISTANCE'], [/\bBARANGAY\b/gi, 'BARANGAY'],
    [/\bSANGGUNIANG\b/gi, 'SANGGUNIANG'], [/\bMUNICIPALITY\b/gi, 'MUNICIPALITY'],
    [/\bPROVINCE OF BOHOL\b/gi, 'PROVINCE OF BOHOL'], [/\bAPPROVING\b/gi, 'APPROVING'],
    [/\bPURCHASE\b/gi, 'PURCHASE'], [/\bAMOUNT OF\b/gi, 'AMOUNT OF'], [/\bTWENTY THOUSAND\b/gi, 'TWENTY THOUSAND'],
    [/\bPESOS\b/gi, 'PESOS'], [/\bREQUEST\b/gi, 'REQUEST'], [/\bENDORSES\b/gi, 'ENDORSES'],
    [/\bHUMAYHUMAY\b/gi, 'HUMAYHUMAY'], [/\bGUINTABOAN\b/gi, 'GUINTABOAN'], [/\bACHILA\b/gi, 'ACHILA'],
    [/\bBOHOL\b/gi, 'BOHOL'], [/\bUBAY\b/gi, 'UBAY'], [/\bPUROKS\b/gi, 'PUROKS'],
    [/\bSTREET LIGHTS\b/gi, 'STREET LIGHTS'], [/\bPUBLIC SAFETY\b/gi, 'PUBLIC SAFETY'],
    [/\bREVENUE CODE\b/gi, 'REVENUE CODE'], [/\bWHEREAS\b/gi, 'WHEREAS'],
    [/\bBE IT RESOLVED\b/gi, 'BE IT RESOLVED'], [/\bBE IT ORDAINED\b/gi, 'BE IT ORDAINED'],
  ];
  for (const [pat, rep] of fixes) out = out.replace(pat, rep);
  out = out.replace(/[#@£€¥§¶~^`_{}\[\]\\|<>]{2,}/g, ' ').replace(/\s+/g, ' ').trim();
  return out;
};

const R2_UPLOAD_URL = (import.meta as any).env?.VITE_R2_UPLOAD_URL || '';
async function uploadToR2(file: File | Blob, fileName: string): Promise<string> {
  if (R2_UPLOAD_URL) {
    const form = new FormData();
    form.append('file', file, fileName);
    form.append('fileName', fileName);
    const r = await fetch(R2_UPLOAD_URL, { method: 'POST', body: form });
    const j: any = await r.json().catch(() => ({}));
    if (j.url) return j.url;
    if (j.publicUrl) return j.publicUrl;
  }
  const { error } = await supabase.storage.from('legislations').upload(fileName, file as File, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('legislations').getPublicUrl(fileName);
  return data.publicUrl;
}

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
  const [formData, setFormData] = useState({ ordinance_no: '', title: '', description: '', author: '', status: 'Approved', type: 'Ordinance', date_approved: '', legislation_type: 'Ordinance', year_series: new Date().getFullYear().toString(), full_text: '', classification: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => { fetchLegislations(); }, []);
  const fetchLegislations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('legislations').select('*').order('created_at', { ascending: false });
    if (!error && data) setLegislations(data);
    setLoading(false);
  };

  const extractTextWithPdfjs = async (file: File, maxPages = 999): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const totalPages = Math.min(pdf.numPages, maxPages);
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return fullText;
  };

  // ===== PADDLE OCR - ADDITIVE ONLY, SAME FUNCTION NAME, SAME RETURN =====
  const paddleServiceRef = useRef<any>(null);
  const getPaddleService = async () => {
    if (!paddleServiceRef.current) {
      paddleServiceRef.current = new PaddleOcrService();
      await paddleServiceRef.current.initialize();
    }
    return paddleServiceRef.current;
  };

  const extractTextWithOCR = async (file: File, maxPages = 3): Promise<string> => {
    setAiStatus('Scanned PDF detected - Running Paddle OCR...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let ocrText = '';
    const pagesToOcr = Math.min(pdf.numPages, maxPages);
    const service = await getPaddleService();
    for (let i = 1; i <= pagesToOcr; i++) {
      setAiStatus(`Processing Paddle OCR - Page ${i} of ${pagesToOcr}... (${Math.round((i / pagesToOcr) * 100)}%)`);
      setOcrProgress(Math.round(((i - 1) / pagesToOcr) * 100));
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height; canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      const result: any = await service.recognize(canvas, { flatten: true });
      const pageText = typeof result?.text === 'string' ? result.text : (Array.isArray(result?.lines) ? result.lines.map((l: any) => l?.text || '').join(' ') : '');
      ocrText += pageText + '\n';
      setOcrProgress(Math.round((i / pagesToOcr) * 100));
    }
    setOcrProgress(0); return ocrText;
  };

  const parseFromText = (text: string, filename: string) => {
    let title = ''; let author = ''; let dateApproved = ''; let ordinanceNo = '';
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
      if (m && m[1] && m[1].trim().length > 10) { title = fixOcrText(m[1].trim().replace(/^\W+/, '').substring(0, 500)); break; }
    }
    if (!title) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20);
      title = fixOcrText(lines.find(l => !/RESOLUTION|ORDINANCE|REPUBLIC|PROVINCE|MUNICIPALITY|UBAY|BOHOL/i.test(l)) || '');
    }
    const authorMatch = text.match(/Sponsored by[:\s]*([A-Z][A-Za-z\s\.\-]+?)(?:\n|SB Member|Sangguniang|Author|$)/i);
    if (authorMatch) author = fixOcrText(authorMatch[1].trim());
    const dateMatch = text.match(/(?:APPROVED|ADOPTED|ENACTED)[\s\S]{0,30}?(\w+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) { const parsed = new Date(dateMatch[1]); if (!isNaN(parsed.getTime())) dateApproved = parsed.toISOString().split('T')[0]; }
    return { title, author, dateApproved, ordinanceNo, yearSeries };
  };

  const autofillWithGroq = async (extractedText: string, filename: string) => {
    setAiLoading(true); setAiStatus('Analyzing document...');
    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqKey) throw new Error('No Groq key');
      const cleanedText = fixOcrText(extractedText);
      const prompt = `You are an assistant for the Ubay Legislative Portal. Extract the information from the document text below and return ONLY JSON, no other text.\n\nText:\n${cleanedText.substring(0, 8000)}\n\nFilename: ${filename}\n\nReturn this JSON format:\n{\n  "ordinance_no": "395",\n  "title": "complete title of the resolution / ordinance",\n  "description": "1-2 sentence summary in English",\n  "author": "name of the sponsor / author",\n  "date_approved": "YYYY-MM-DD",\n  "type": "Resolution or Ordinance",\n  "classification": "General Ordinance / Revenue / Tax Ordinance / Appropriation Ordinance / Regulatory Ordinance / Franchise Ordinance - empty if Resolution",\n  "year_series": "2026"\n}\n\nSTRICT RULES:\n- title: Copy WORD-FOR-WORD from the document! DO NOT paraphrase!\n- description: Summarize with correct grammar, spelling, verb tense, and punctuation.\n- author: Full name, including middle initial.\n- ordinance_no from filename or text, numbers only\n- classification: only if type is Ordinance, pick from General / Revenue / Tax / Appropriation / Regulatory / Franchise based on content, else return \"\"\n- If not found, return ""\n- Do not invent numbers or names`;
      const MODELS = ['meta-llama/llama-4-maverick-17b-128e-instruct','meta-llama/llama-4-scout-17b-16e-instruct','openai/gpt-oss-120b','qwen/qwen3-32b'];
      let parsed: any = null; let lastError = '';
      for (const model of MODELS) {
        try {
          setAiStatus(`Analyzing document using ${model}...`);
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.1, response_format: { type: 'json_object' } }) });
          if (!res.ok) { lastError = res.status + ' ' + model; continue; }
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (!content) continue;
          parsed = JSON.parse(content); break;
        } catch (e: any) { continue; }
      }
      if (!parsed) throw new Error('All Groq models failed: ' + lastError);
      parsed.title = fixOcrText(parsed.title || ''); parsed.description = fixOcrText(parsed.description || ''); parsed.author = fixOcrText(parsed.author || '');
      setFormData(prev => ({ ...prev, ordinance_no: parsed.ordinance_no || prev.ordinance_no, title: parsed.title || prev.title, description: parsed.description || prev.description, author: parsed.author || prev.author, date_approved: parsed.date_approved || prev.date_approved, type: parsed.type || prev.type, legislation_type: parsed.type || prev.legislation_type, classification: parsed.classification || prev.classification, year_series: parsed.year_series || prev.year_series, full_text: extractedText.substring(0, 50000) }));
      setAiStatus('Autofill completed successfully!');
    } catch (err) {
      setAiStatus('Automatic extraction failed - Parsed manually');
      const manual = parseFromText(extractedText, filename);
      setFormData(prev => ({ ...prev, ordinance_no: manual.ordinanceNo || prev.ordinance_no, title: fixOcrText(manual.title) || prev.title, author: fixOcrText(manual.author) || prev.author, date_approved: manual.dateApproved || prev.date_approved, year_series: manual.yearSeries || prev.year_series, full_text: extractedText.substring(0, 50000) }));
    } finally { setAiLoading(false); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSelectedFile(file); setAiLoading(true); setAiStatus('Extracting text from PDF...');
    try {
      // ===== AUTO DETECT - NO MANUAL TYPE NEEDED =====
      let firstPageText = '';
      try { firstPageText = await extractTextWithPdfjs(file, 1); } catch (err) { firstPageText = ''; }
      const upperFirst = (firstPageText + ' ' + file.name).toUpperCase();
      let detectedType = 'Resolution';
      if (/\bORDINANCE\b/.test(upperFirst) && !/\bRESOLUTION\b/.test(upperFirst)) detectedType = 'Ordinance';
      else if (/\bORDINANCE\b/.test(upperFirst) && upperFirst.indexOf('ORDINANCE') < upperFirst.indexOf('RESOLUTION')) detectedType = 'Ordinance';
      else if (/\bORD\b[\s\-_]*(NO|NO\.)/.test(upperFirst)) detectedType = 'Ordinance';
      const isOrdinance = detectedType === 'Ordinance';
      const maxPages = isOrdinance ? 999 : 1;
      setFormData(prev => ({ ...prev, type: detectedType, legislation_type: detectedType }));
      let extractedText = firstPageText;
      if (isOrdinance) {
        try { extractedText = await extractTextWithPdfjs(file, maxPages); } catch (err) { extractedText = firstPageText; }
      }
      const weirdChars = (extractedText.match(/[#@£€¥§¶~^`_{}\[\]\\|<>]/g) || []).length;
      const garbageRatio = weirdChars / (extractedText.length || 1);
      if (extractedText.trim().length < 50 || (extractedText.trim().length < 500 && garbageRatio > 0.02)) {
        setAiStatus('Scanned PDF detected - Running Paddle OCR...');
        try { extractedText = await extractTextWithOCR(file, maxPages); } catch (ocrErr) {
          console.log('OCR failed', ocrErr);
          setAiStatus('OCR failed - Please fill in manually, pero pwede gihapon mo-Save!');
          setAiLoading(false); return;
        }
      } else { setAiStatus('Text extracted successfully!'); }
      if (!isOrdinance) {
        const whereasIdx = extractedText.search(/WHEREAS/i);
        if (whereasIdx > 50) extractedText = extractedText.substring(0, whereasIdx);
      }
      extractedText = fixOcrText(extractedText);
      if (isOrdinance) {
        const up = extractedText.toUpperCase();
        let autoClass = 'General Ordinance';
        if (/REVENUE|TAX|FEE|CHARGE/.test(up)) autoClass = 'Revenue / Tax Ordinance';
        else if (/APPROPRIATION|BUDGET|FUND/.test(up)) autoClass = 'Appropriation Ordinance';
        else if (/FRANCHISE/.test(up)) autoClass = 'Franchise Ordinance';
        else if (/REGULAT|PROHIBIT|PENALTY/.test(up)) autoClass = 'Regulatory Ordinance';
        setFormData(prev => ({ ...prev, classification: prev.classification || autoClass }));
      }
      const manual = parseFromText(extractedText, file.name);
      if (manual.ordinanceNo) setFormData(prev => ({ ...prev, ordinance_no: manual.ordinanceNo, year_series: manual.yearSeries }));
      if (extractedText.trim().length > 50) await autofillWithGroq(extractedText, file.name);
      else { setAiStatus('No readable text found even after OCR - Please fill in manually, pero pwede gihapon mo-Save!'); setAiLoading(false); }
    } catch (err) {
      setAiStatus('Extraction failed - Please fill in manually, pero pwede gihapon mo-Save!');
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setUploading(true);
    try {
      let pdfUrl = ''; let pdfFilename = ''; let fileSize = 0; let txtUrl: string | null = null;
      if (selectedFile) {
        const fileName = `${Date.now()}_${selectedFile.name}`;
        pdfUrl = await uploadToR2(selectedFile, `ordinances/${fileName}`);
        pdfFilename = selectedFile.name; fileSize = selectedFile.size;
        const textToSave = formData.full_text || '';
        if (textToSave && textToSave.length > 50) {
          const txtBlob = new Blob([textToSave], { type: 'text/plain' });
          const txtFile = new File([txtBlob], `${formData.ordinance_no || Date.now()}-${Date.now()}.txt`, { type: 'text/plain' });
          txtUrl = await uploadToR2(txtFile, `ordinances/${formData.ordinance_no || Date.now()}-${Date.now()}.txt`);
        }
      }
      const payload = { ordinance_no: formData.ordinance_no, title: formData.title, description: formData.description, author: formData.author, status: formData.status, type: formData.type, date_approved: formData.date_approved || null, legislation_type: formData.legislation_type, year_series: formData.year_series, classification: formData.type === 'Ordinance' ? formData.classification : '', full_text: null, txt_url: txtUrl, pdf_url: pdfUrl, pdf_filename: pdfFilename, file_size: fileSize, file_url: pdfUrl, document_url: pdfUrl };
      if (editingId) {
        const updatePayload: any = { ...payload };
        if (!selectedFile) { delete updatePayload.txt_url; delete updatePayload.pdf_url; delete updatePayload.file_url; delete updatePayload.document_url; }
        const { error } = await supabase.from('legislations').update(updatePayload).eq('id', editingId); if (error) throw error;
      }
      else { const { error } = await supabase.from('legislations').insert([payload]); if (error) throw error; }
      setShowModal(false); setEditingId(null); resetForm(); fetchLegislations();
    } catch (err: any) { alert('Error: ' + err.message); } finally { setUploading(false); }
  };

  const resetForm = () => {
    setFormData({ ordinance_no: '', title: '', description: '', author: '', status: 'Approved', type: 'Ordinance', date_approved: '', legislation_type: 'Ordinance', year_series: new Date().getFullYear().toString(), full_text: '', classification: '' });
    setSelectedFile(null); setAiStatus(''); if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (leg: Legislation) => {
    setEditingId(leg.id);
    setFormData({ ordinance_no: leg.ordinance_no || '', title: leg.title || '', description: leg.description || '', author: leg.author || '', status: leg.status || 'Approved', type: leg.type || 'Ordinance', date_approved: leg.date_approved || '', legislation_type: leg.legislation_type || 'Ordinance', year_series: leg.year_series || '', full_text: leg.full_text || '', classification: (leg as any).classification || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this legislation?')) return;
    await supabase.from('legislations').delete().eq('id', id); fetchLegislations();
  };

  const allYears = Array.from(new Set(legislations.map(l => l.year_series).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
  const filtered = legislations.filter(l => {
    const matchSearch = (l.title + l.ordinance_no + l.author).toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || l.type === filterType || l.legislation_type === filterType;
    const matchYear = filterYear === 'all' || l.year_series === filterYear;
    return matchSearch && matchType && matchYear;
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold leading-tight">Legislative Management</h1>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base shrink-0">
          <Plus size={18} /> Add Legislation
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search title, number, author..." className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm sm:text-base" />
        </div>
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="flex-1 sm:flex-none border rounded-lg px-3 py-2.5 text-sm sm:text-base">
            <option value="all">All Types</option><option value="Ordinance">Ordinance</option><option value="Resolution">Resolution</option>
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="flex-1 sm:flex-none border rounded-lg px-3 py-2.5 text-sm sm:text-base">
            <option value="all">All Years</option>{allYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      {loading ? <p>Loading...</p> : (
        <>
          <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-" style={{ tableLayout: 'auto' }}>
              <thead className="bg-gray-50"><tr>
                <th className="p-3 text-left w-">No.</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left w-">Author</th>
                <th className="p-3 text-left w-">Year</th>
                <th className="p-3 text-left w-">Classification</th>
                <th className="p-3 text-left w-">Date</th>
                <th className="p-3 text-left w-">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(leg => (
                  <tr key={leg.id} className="border-t align-top">
                    <td className="p-3 font-medium whitespace-nowrap">{leg.ordinance_no}</td>
                    <td className="p-3 leading-snug">{leg.title}</td>
                    <td className="p-3 leading-snug">{leg.author}</td>
                    <td className="p-3 whitespace-nowrap">{leg.year_series}</td>
                    <td className="p-3 leading-snug">{leg.classification || "-"}</td>
                    <td className="p-3 whitespace-nowrap">{leg.date_approved}</td>
                    <td className="p-3"><div className="flex gap-2">
                      {leg.pdf_url && <a href={leg.pdf_url} target="_blank" rel="noreferrer" className="text-blue-600"><Eye size={18} /></a>}
                      <button onClick={() => handleEdit(leg)} className="text-green-600"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(leg.id)} className="text-red-600"><Trash2 size={18} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {filtered.map(leg => (
              <div key={leg.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded shrink-0">No. {leg.ordinance_no}</span>
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded shrink-0">{leg.year_series} • {leg.date_approved}</span>
                </div>
                <p className="text-sm leading-snug font-medium text-gray-900 mb-2">{leg.title}</p>
                <p className="text-xs text-gray-600 mb-1">Author: {leg.author}</p>
                <p className="text-xs text-gray-600 mb-3">Classification: {leg.classification || "-"}</p>
                <div className="flex gap-4 pt-2 border-t">
                  {leg.pdf_url && <a href={leg.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 text-sm"><Eye size={16} /> View</a>}
                  <button onClick={() => handleEdit(leg)} className="flex items-center gap-1 text-green-600 text-sm"><Edit size={16} /> Edit</button>
                  <button onClick={() => handleDelete(leg.id)} className="flex items-center gap-1 text-red-600 text-sm"><Trash2 size={16} /> Delete</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No legislations found.</p>}
          </div>
        </>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/10 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white w-full max-w-lg sm:max-h-[82vh] rounded-t-2xl sm:rounded-xl overflow-y-auto flex flex-col shadow-2xl border">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b sticky top-0 bg-white z-10 shrink-0">
              <h2 className="text-lg sm:text-xl font-bold">{editingId ? 'Edit' : 'Add'} Legislation</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1"><X /></button>
            </div>
            {legislations.length > 0 && !editingId && (
              <div className="bg-blue-50 border-b px-4 py-2 text-xs text-blue-800">
                Last upload: No. {legislations[0].ordinance_no} • {legislations[0].year_series} — {legislations[0].title.substring(0, 80)}...
              </div>
            )}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Ordinance / Reso No.</label>
                  <input value={formData.ordinance_no} onChange={e => setFormData({ ...formData, ordinance_no: e.target.value })} className="w-full border rounded-lg px-3 py-2.5" placeholder="e.g. 395" /></div>
                <div><label className="block text-sm font-medium">Year Series</label>
                  <input value={formData.year_series} onChange={e => setFormData({ ...formData, year_series: e.target.value })} className="w-full border rounded-lg px-3 py-2.5" placeholder="2026" /></div>
              </div>
              <div><label className="block text-sm font-medium">Title</label>
                <textarea value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2.5 text-sm" /></div>
              <div><label className="block text-sm font-medium">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2.5 text-sm" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Author / Sponsor</label>
                  <input value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="w-full border rounded-lg px-3 py-2.5" /></div>
                <div><label className="block text-sm font-medium">Date Approved</label>
                  <input type="date" value={formData.date_approved} onChange={e => setFormData({ ...formData, date_approved: e.target.value })} className="w-full border rounded-lg px-3 py-2.5" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value, legislation_type: e.target.value })} className="w-full border rounded-lg px-3 py-2.5">
                    <option>Ordinance</option><option>Resolution</option>
                  </select></div>
                <div><label className="block text-sm font-medium">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border rounded-lg px-3 py-2.5">
                    <option>Approved</option><option>Pending</option><option>Repealed</option>
                  </select></div>
              </div>
              <div><label className="block text-sm font-medium">Classification (Ordinance Only)</label>
                <select value={formData.classification} disabled={formData.type !== 'Ordinance'} onChange={e => setFormData({ ...formData, classification: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-400">
                  <option value="">Select Classification</option>
                  <option>General Ordinance</option>
                  <option>Revenue / Tax Ordinance</option>
                  <option>Appropriation Ordinance</option>
                  <option>Regulatory Ordinance</option>
                  <option>Franchise Ordinance</option>
                </select>
                {formData.type !== 'Ordinance' && <p className="text-xs text-gray-400 mt-1">Disabled — for Ordinance only</p>}
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-2">Upload PDF Document</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:bg-gray-50">
                  <FileUp className="mx-auto mb-2 text-gray-400" size={28} />
                  {selectedFile ? <p className="font-medium break-all text-sm">{selectedFile.name}</p> : <p className="text-gray-500 text-sm">Click to upload PDF</p>}
                  <p className="text-xs text-gray-400 mt-1">PDF only - Automatic extraction with OCR for scanned documents</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                  onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                  onChange={handleFileSelect} />
                {aiLoading && (<div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2"><Loader2 className="animate-spin text-blue-600 shrink-0" size={18} /><span className="text-sm text-blue-800">{aiStatus || 'Processing...'}</span></div>)}
                {!aiLoading && aiStatus && (<div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">{aiStatus}</div>)}
                {ocrProgress > 0 && (<div className="mt-2"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${ocrProgress}%` }}></div></div><p className="text-xs mt-1">OCR Progress: {ocrProgress}%</p></div>)}
                {formData.full_text && (<p className="text-xs text-gray-500 mt-2">Full text captured: {formData.full_text.length.toLocaleString()} characters - Will be saved to R2 as TXT for chatbot</p>)}
              </div>
              <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-1 -mx-1 px-1">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 sm:flex-none px-4 py-2.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">{uploading && <Loader2 className="animate-spin" size={16} />} {uploading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
