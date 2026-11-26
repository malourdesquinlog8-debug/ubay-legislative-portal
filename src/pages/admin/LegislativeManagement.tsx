import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadToR2 } from '../../utils/r2Upload';
import { Plus, Search, Eye, Edit, Trash2, X, Loader2, FileUp, Inbox, CheckCircle, Clock, Trash2 as TrashIcon } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PaddleOcrService } from 'ppu-paddle-ocr/web';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface Legislation {
  id: string; ordinance_no: string; title: string; description: string; author: string; status: string; type: string; date_approved: string; pdf_url: string; pdf_filename: string; file_size: number; created_at: string; legislation_type: string; file_url: string; document_url: string; year_series: string; full_text: string; txt_url: string; classification: string;
}

const OFFICIAL_CLASSIFICATIONS = ["Sports Development", "Education and Culture", "Business Establishments", "Peace and Order", "Public Officials", "Social Services", "Public Properties", "Market and Slaughterhouses", "Traffic and Transportation", "Agriculture/Fisheries", "Health and Sanitation", "Tourism", "Barangay Affairs", "Appropriation/Budget", "Environment", "Building Regulations", "Amusements/Games/Recreation", "Public Utilities", "Revenue / Taxation / Fees", "Parks and Playgrounds", "Public Morals", "Governance / Administrative", "Trade", "Sports", "Labor / Personnel"];

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
  // Fix Paddle mixed-case garbage: suBiECT -> SUBJECT, cOMPLiANCE -> COMPLIANCE
  out = out.split(' ').map(w => {
    const clean = w.replace(/[^A-Za-z]/g, '');
    if (clean.length > 3 && /[a-z][A-Z]/.test(clean) && /[A-Z]/.test(clean)) return w.toUpperCase();
    return w;
  }).join(' ');
  return out;
};

// ===== CLOSEST AUTHOR MATCH — ADDITIVE ONLY =====
// If AI cannot read the author (OCR typo), match to the closest of the 11 fixed names
const FIXED_AUTHORS = [
  'HON. ATTY. KIM GERONIMO B. FUENTES',
  'HON. DANIEL R. DELIMA, II',
  'HON. VINCENT MAXIMILIAN T. ENTERO',
  'HON. FACUNDO D. GAVAS, JR.',
  'HON. EFREN S. TANJAY',
  'HON. ISIDORE G. BESAS',
  'HON. GLAIZA MAE S. ATUEL',
  'HON. GALICANO E. ATUP',
  'HON. MANSUETO I. DIANGCO',
  'HON. RENILDO M. VALLESER',
  'HON. JOHN PHILLIP S. NEBRIA',
];
const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
  }
  return dp[m][n];
};
const matchClosestAuthor = (raw: string): string => {
  if (!raw) return raw;
  const cleanRaw = fixOcrText(raw).toUpperCase().replace(/HON\.?/g, '').replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleanRaw) return raw;
  // Exact match na — return fixed dayon
  for (const f of FIXED_AUTHORS) {
    const cleanF = f.toUpperCase().replace(/HON\.?/g, '').replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanRaw === cleanF) return f;
  }
  let best = ''; let bestScore = 0;
  const rawWords = cleanRaw.split(' ').filter(w => w.length > 2);
  for (const f of FIXED_AUTHORS) {
    const cleanF = f.toUpperCase().replace(/HON\.?/g, '').replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
    const fWords = cleanF.split(' ').filter(w => w.length > 2);
    // Last name is strongest signal — GAVAS, TANJAY, FUENTES, etc.
    const rawLast = rawWords[rawWords.length - 1] || '';
    const fLast = fWords[fWords.length - 1] || '';
    const lastDist = levenshtein(rawLast, fLast);
    let score = 0;
    if (rawLast === fLast) score += 50;
    else if (lastDist <= 2 && rawLast.length >= 4) score += 40 - lastDist * 5;
    // First name / middle words match
    for (const w of rawWords) {
      if (fWords.includes(w)) score += 15;
      else {
        // Fuzzy word match — FAGUNDO ~ FACUNDO
        for (const fw of fWords) {
          if (w.length >= 4 && fw.length >= 4 && levenshtein(w, fw) <= 2) { score += 10; break; }
        }
      }
    }
    if (score > bestScore) { bestScore = score; best = f; }
  }
  // Threshold: kinahanglan last name match + at least 1 other word, or taas kaayo nga score
  if (bestScore >= 55) return best;
  return raw; // Layo ra — previous term author, bilin lang original autofill
};

// DIRECT R2 ONLY - no Supabase fallback, so Supabase will not fill up
// uploadToR2 from ../../utils/r2Upload.ts

export default function LegislativeManagement() {
  const [legislations, setLegislations] = useState<Legislation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  // ===== EXPORT INVENTORY - ADDITIVE ONLY, do not touch others =====
  const [exportType, setExportType] = useState('all');
  const [exportYear, setExportYear] = useState('all');
  const [exportAuthor, setExportAuthor] = useState('all');
  const [exportClassification, setExportClassification] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ ordinance_no: '', title: '', description: '', author: '', status: 'Approved', type: 'Ordinance', date_approved: '', legislation_type: 'Ordinance', year_series: new Date().getFullYear().toString(), full_text: '', classification: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // ===== COPY REQUESTS - ADDITIVE ONLY, do not touch legislations =====
  const [activeTab, setActiveTab] = useState<'legislations' | 'requests'>('legislations');
  const [copyRequests, setCopyRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  // ===== REPLY - ADDITIVE ONLY =====
  const [replyText, setReplyText] = useState('');
  const [includePdfLink, setIncludePdfLink] = useState(true);
  const [replySending, setReplySending] = useState(false);

  useEffect(() => { fetchLegislations(); fetchCopyRequests(); }, []);
  const fetchCopyRequests = async () => {
    setRequestsLoading(true);
    const { data, error } = await supabase.from('copy_requests').select('*').order('created_at', { ascending: false });
    if (!error && data) setCopyRequests(data);
    setRequestsLoading(false);
  };
  const updateRequestStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('copy_requests').update({ status }).eq('id', id);
    if (!error) { await fetchCopyRequests(); if (selectedRequest?.id === id) setSelectedRequest({ ...selectedRequest, status }); }
    else alert('Unable to update! Run the FIX-copy_requests-UPDATE-DELETE-policy.sql in Supabase — Error: ' + error.message);
  };
  const handleReplyViaEmail = async (r: any) => {
    // FIX: Gmail compose in a new window, not window.location.href = mailto (blocked / nothing happens without a default mail client, and breaks when body is too long)
    const msg = replyText.trim() || `Hello ${r.requester_name},\n\nYour requested copy for ${r.legislation_number || ''} - ${r.legislation_title || ''} is ready.\n\nPlease see the attached file / link from the SB Ubay Legislative Portal.\n\nThank you,\nSangguniang Bayan of Ubay`;
    const pdfPart = (includePdfLink && (r as any).pdf_url) ? `\n\nPDF Link: ${(r as any).pdf_url}` : `\n\nNote: The PDF file is attached to this email.`;
    const fullBody = msg + pdfPart + `\n\n---\nOriginal Request:\nPurpose: ${r.purpose || ''}\nLegislation: ${r.legislation_number || ''} - ${r.legislation_title || ''}`;
    const subject = `Re: Your Copy Request - ${r.legislation_number || ''} ${r.legislation_title || ''}`;
    // 1. Open Gmail immediately — do not wait for Supabase save
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(r.requester_email || '')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
    const w = 600, h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(gmailUrl, 'replyEmail', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`); // FIX: small popup, not full tab
    // 2. Fallback: copy to clipboard so if popup is blocked, paste in Gmail
    try { await navigator.clipboard?.writeText(fullBody); } catch (e) {}
    // 3. Save to Supabase — if it fails (column missing / RLS), it will not block the email since it is already open
    setReplySending(true);
    try {
      const { error } = await supabase.from('copy_requests').update({ admin_reply: msg, replied_at: new Date().toISOString(), status: 'Approved' }).eq('id', r.id);
      if (error) console.log('Reply save skipped:', error.message);
    } catch (e) { console.log('Reply save skipped'); }
    setReplySending(false);
    await fetchCopyRequests();
    if (selectedRequest?.id === r.id) setSelectedRequest({ ...selectedRequest, admin_reply: msg, status: 'Approved' });
    alert('Gmail opened in a small window and the message was copied. If the popup was blocked, Allow popups, then click Send Reply again.');
  };
  const deleteRequest = async (id: string) => {
    if (!confirm('Delete this copy request? This will be permanently deleted from Supabase.')) return;
    const { error } = await supabase.from('copy_requests').delete().eq('id', id);
    if (!error) { await fetchCopyRequests(); setSelectedRequest(null); }
    else alert('Unable to delete! Run the FIX-copy_requests-UPDATE-DELETE-policy.sql in Supabase — Error: ' + error.message);
  };
  const fetchLegislations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('legislations').select('*').order('created_at', { ascending: false });
    if (!error && data) setLegislations(data);
    setLoading(false);
  };

  // ===== EXPORT RESO / ORDINANCE - CSV, by Year / Author / Classification =====
  const handleExportCSV = () => {
    // FIX: Export what you see — use filtered (table) to match your filter
    let rows = [...filtered];
    // (already filtered via table — no need to re-filter here)
    if (rows.length === 0) { alert('No records found for the selected filter!'); return; }
    const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const header = ['No.', 'Title', 'Type', 'Classification', 'Author', 'Year', 'Date Approved', 'Status'];
    const lines = [header.map(esc).join(',')];
    rows.forEach(l => {
      lines.push([l.ordinance_no, l.title, l.type, (l as any).classification || '', l.author, l.year_series, l.date_approved, l.status].map(esc).join(','));
    });
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const label = `Ubay-Legislative-Inventory_${exportType}_${exportYear}_${exportAuthor !== 'all' ? exportAuthor.replace(/[^A-Za-z0-9]/g, '-') : 'AllAuthors'}_${exportClassification !== 'all' ? exportClassification.replace(/[^A-Za-z0-9]/g, '-') : 'AllClass'}.csv`;
    a.href = url; a.download = label; a.click(); URL.revokeObjectURL(url);
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
    // FIX: TOP HEADER ONLY — pinaka-top nga RESO/ORD NO. lang ang basehan, dili ang sulod sa title sama sa BARANGAY RESOLUTION NO. 05
    const headerText = fixOcrText(text).substring(0, 800);
    const headerMatch = headerText.match(/(?:RESOLUTION|ORDINANCE)\s*NO\.?\s*(\d+)/i);
    if (headerMatch) ordinanceNo = headerMatch[1];
    const fileMatch = filename.match(/(?:RESO|ORD|RESOLUTION|ORDINANCE)[\s\-_]*NO[\s\-_]*(\d+)/i);
    if (!ordinanceNo && fileMatch) ordinanceNo = fileMatch[1];
    const yearMatch = filename.match(/S(\d{4})/i);
    let yearSeries = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
    const cleanText = fixOcrText(text.replace(/\s+/g, ' ').trim());
    const titlePatterns = [
      /((?:A RESOLUTION|AN ORDINANCE)[\s\S]{0,5}?.*?)(?:\s*\(?\s*(?:Sponsored by|Authored by|Author:|Sponsored:|Submitted by|Introduced by|Presented by|Proposed by)|\\s+SPONSORED BY|\\s+AUTHORED BY|\\s+WHEREAS|\\s+Whereas|\\s+BE IT RESOLVED|\\s+BE IT ORDAINED|$)/i,
      /(?:RESOLUTION NO\.?\s*\d+[^\n]*\n)(.*?)(?:\s*\(?\s*Sponsored by|\s+WHEREAS|$)/i,
    ];
    for (const pat of titlePatterns) {
      const m = cleanText.match(pat);
      if (m && m[1] && m[1].trim().length > 10) { let t = m[1].trim().replace(/\s*\(?\s*(?:Sponsored by|Authored by|Author:|Sponsored:|Submitted by|Introduced by|Presented by|Proposed by).*$/i, '').replace(/\s*\(Author.*$/i, '').replace(/['"]\s*$/,'').trim(); if (!/^(A RESOLUTION|AN ORDINANCE)/i.test(t)) { const pref = /RESOLUTION/i.test(cleanText.slice(0,500)) ? 'A RESOLUTION ' : 'AN ORDINANCE '; t = pref + t; } title = fixOcrText(t.substring(0, 800)); break; }
    }
    if (!title) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20);
      title = fixOcrText(lines.find(l => !/RESOLUTION|ORDINANCE|REPUBLIC|PROVINCE|MUNICIPALITY|UBAY|BOHOL/i.test(l)) || '');
    }
    const authorMatch = text.match(/Sponsored by[:\s]*([A-Z][A-Za-z\s\.\-]+?)(?:\n|SB Member|Sangguniang|Author|$)/i);
    if (authorMatch) author = matchClosestAuthor(fixOcrText(authorMatch[1].trim()));
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
      const prompt = `You are an assistant for the Ubay Legislative Portal. Extract the information from the document text below and return ONLY JSON, no other text.\n\nText:\n${cleanedText.substring(0, 8000)}\n\nFilename: ${filename}\n\nReturn this JSON format:\n{\n  "ordinance_no": "395",\n  "title": "complete title, copy EXACTLY from document",\n  "description": "1-2 sentence summary in English",\n  "author": "name of the sponsor / author",\n  "date_approved": "YYYY-MM-DD",\n  "type": "Resolution or Ordinance",\n  "classification": "Pick ONE from: Sports Development / Education and Culture / Business Establishments / Peace and Order / Public Officials / Social Services / Public Properties / Market and Slaughterhouses / Traffic and Transportation / Agriculture/Fisheries / Health and Sanitation / Tourism / Barangay Affairs / Appropriation/Budget / Environment / Building Regulations / Amusements/Games/Recreation / Public Utilities / Revenue / Taxation / Fees / Parks and Playgrounds / Public Morals / Governance / Administrative / Trade / Sports / Labor / Personnel - empty if Resolution",\n  "year_series": "2026"\n}\n\nSTRICT RULES:\n- title: Copy EXACTLY as in document, keep EXACT word order! DO NOT summarize! DO NOT shorten! If document title is long, copy ALL of it! Fix ONLY spelling/caps (suBiECT -> SUBJECT). NEVER include author/sponsor in title! STOP title BEFORE any of: (Sponsored by, (Authored by, Authored by, Sponsored by, Author:, Sponsored: - cut them ALL off!\n- description: Summarize with correct grammar, spelling, verb tense, and punctuation.\n- author: Full name, including middle initial.\n- ordinance_no: MUST be the TOP HEADER number ONLY — the FIRST RESOLUTION NO. / ORDINANCE NO. that appears BEFORE the title (in the header, e.g. RESOLUTION NO. 377). NEVER use a number inside the title, e.g. if title says BARANGAY RESOLUTION NO. 05, ENDORSING BARANGAY RESOLUTION NO. 05, APPROVING BARANGAY ORDINANCE NO. 12 — IGNORE those, they are NOT the SB number. If header number exists, use it. Else use filename. Numbers only\n- classification: only if type is Ordinance, pick from the 25 official classifications based on content, else return \"\"\n- If not found, return ""\n- Do not invent numbers or names`;
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
      parsed.title = fixOcrText(parsed.title || ''); parsed.description = fixOcrText(parsed.description || ''); parsed.author = matchClosestAuthor(fixOcrText(parsed.author || ''));
      // SAFETY NET: TOP HEADER wins over Groq — kung naay header number, mao na ang final, dili ang sulod sa title
      const _headerNo = fixOcrText(extractedText).substring(0, 800).match(/(?:RESOLUTION|ORDINANCE)\s*NO\.?\s*(\d+)/i);
      if (_headerNo) parsed.ordinance_no = _headerNo[1];
      setFormData(prev => ({ ...prev, ordinance_no: parsed.ordinance_no || prev.ordinance_no, title: prev.title || (parsed.title ? parsed.title.replace(/\s*\(?\s*(?:Sponsored by|Authored by|Author:|Sponsored:|Submitted by|Introduced by|Presented by).*$/i, '').trim() : parsed.title), description: parsed.description || prev.description, author: parsed.author || prev.author, date_approved: parsed.date_approved || prev.date_approved, type: parsed.type || prev.type, legislation_type: parsed.type || prev.legislation_type, classification: (OFFICIAL_CLASSIFICATIONS.includes(parsed.classification) ? parsed.classification : prev.classification), year_series: parsed.year_series || prev.year_series, full_text: extractedText.substring(0, 50000) }));
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
      if (/AN ORDINANCE|ORDINANCE NO\.?|ORDINANCE NO\s*\d/.test(upperFirst)) detectedType = 'Ordinance';
      else if (/\bORDINANCE\b/.test(upperFirst) && !/\bRESOLUTION\b/.test(upperFirst)) detectedType = 'Ordinance';
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
          setAiStatus('OCR failed - Please fill in manually, you can still Save!');
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
        let autoClass = 'Governance / Administrative';
        if (/APPROPRIATION|BUDGET|FUND/.test(up)) autoClass = 'Appropriation/Budget';
        else if (/REVENUE|TAX|FEE|CHARGE|TAXATION/.test(up)) autoClass = 'Revenue / Taxation / Fees';
        else if (/SPORTS DEVELOPMENT|SPORTS COMPLEX|ATHLET/.test(up)) autoClass = 'Sports Development';
        else if (/SCHOOL|EDUCATION|CULTURE|LIBRARY|SCHOLARSHIP/.test(up)) autoClass = 'Education and Culture';
        else if (/BUSINESS|ESTABLISHMENT|PERMIT.*BUSINESS|COMMERCIAL/.test(up)) autoClass = 'Business Establishments';
        else if (/PEACE|ORDER|POLICE|TANOD|CRIME|DRUG/.test(up)) autoClass = 'Peace and Order';
        else if (/OFFICIAL|SALARY.*OFFICIAL|HONORARIUM/.test(up)) autoClass = 'Public Officials';
        else if (/SOCIAL|WELFARE|PWD|SENIOR|INDIGENT|AID/.test(up)) autoClass = 'Social Services';
        else if (/PUBLIC PROPERT|MUNICIPAL BUILDING|GOVERNMENT LOT/.test(up)) autoClass = 'Public Properties';
        else if (/MARKET|SLAUGHTERHOUSE|ABATTOIR/.test(up)) autoClass = 'Market and Slaughterhouses';
        else if (/TRAFFIC|TRANSPORT|TRICYCLE|PARKING|ROAD.*TRAFFIC/.test(up)) autoClass = 'Traffic and Transportation';
        else if (/AGRICULT|FISHER|FARM|IRRIGATION|FISH/.test(up)) autoClass = 'Agriculture/Fisheries';
        else if (/HEALTH|SANITATION|CLINIC|HOSPITAL|WASTE/.test(up)) autoClass = 'Health and Sanitation';
        else if (/TOURISM|TOURIST|BEACH|RESORT/.test(up)) autoClass = 'Tourism';
        else if (/BARANGAY/.test(up)) autoClass = 'Barangay Affairs';
        else if (/ENVIRONMENT|GARBAGE|SOLID WASTE|TREE|POLLUTION/.test(up)) autoClass = 'Environment';
        else if (/BUILDING|CONSTRUCTION|ZONING|PERMIT.*BUILD/.test(up)) autoClass = 'Building Regulations';
        else if (/AMUSEMENT|GAME|RECREATION|COCKPIT|LOTTERY|GAMBLING/.test(up)) autoClass = 'Amusements/Games/Recreation';
        else if (/WATER|ELECTRIC|UTILIT|POWER|TELECOM/.test(up)) autoClass = 'Public Utilities';
        else if (/PARK|PLAYGROUND/.test(up)) autoClass = 'Parks and Playgrounds';
        else if (/MORAL|OBSCEN|PROSTITUTION|VAGRANCY/.test(up)) autoClass = 'Public Morals';
        else if (/TRADE|COMMERCE|MARKET.*TRADE/.test(up)) autoClass = 'Trade';
        else if (/SPORTS/.test(up)) autoClass = 'Sports';
        else if (/LABOR|PERSONNEL|EMPLOYEE|CASUAL|JOB ORDER/.test(up)) autoClass = 'Labor / Personnel';
        setFormData(prev => ({ ...prev, classification: autoClass })); // FIX: force auto-select, not prev || auto
      }
      const manual = parseFromText(extractedText, file.name);
      if (manual.ordinanceNo || manual.title) setFormData(prev => ({ ...prev, ordinance_no: manual.ordinanceNo || prev.ordinance_no, year_series: manual.yearSeries || prev.year_series, title: manual.title ? manual.title.replace(/\s*\(?\s*(?:Sponsored by|Authored by|Author:|Sponsored:|Submitted by|Introduced by|Presented by).*$/i, '').trim() : prev.title, author: manual.author || prev.author, date_approved: manual.dateApproved || prev.date_approved }));
      if (extractedText.trim().length > 50) { await autofillWithGroq(extractedText, file.name); setFormData(prev => { if (prev.type === 'Ordinance' && (!prev.classification || !OFFICIAL_CLASSIFICATIONS.includes(prev.classification))) { const up2 = extractedText.toUpperCase(); let c = 'Governance / Administrative'; if (/REVENUE|TAX|FEE|CHARGE/.test(up2)) c = 'Revenue / Taxation / Fees'; else if (/APPROPRIATION|BUDGET|FUND/.test(up2)) c = 'Appropriation/Budget'; else if (/FRANCHISE/.test(up2)) c = 'Business Establishments'; else if (/REGULAT|PROHIBIT|PENALTY|CCTV|SURVEILLANCE|SYSTEM|INSTALLATION|PROCUREMENT/.test(up2)) c = 'Governance / Administrative'; return { ...prev, classification: c }; } return prev; }); }
      else { setAiStatus('No readable text found even after OCR - Please fill in manually, you can still Save!'); setAiLoading(false); }
    } catch (err) {
      setAiStatus('Extraction failed - Please fill in manually, you can still Save!');
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
    // FIX: Export filters ALSO filter the table — para kung mag-filter ka sa Export box, mausab gyud ang table
    const matchExportType = exportType === 'all' || l.type === exportType || l.legislation_type === exportType;
    const matchExportYear = exportYear === 'all' || String(l.year_series) === String(exportYear);
    const matchExportAuthor = exportAuthor === 'all' || (l.author || '') === exportAuthor;
    const matchExportClass = exportClassification === 'all' || ((l as any).classification || '') === exportClassification;
    return matchSearch && matchType && matchYear && matchExportType && matchExportYear && matchExportAuthor && matchExportClass;
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold leading-tight">Legislative Management</h1>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base shrink-0">
          <Plus size={18} /> Add Legislation
        </button>
      </div>
      {/* ===== TABS - ADDITIVE ONLY ===== */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('legislations')} className={`px-4 py-2.5 rounded-lg text-sm font-bold ${activeTab === 'legislations' ? 'bg-slate-900 text-white' : 'bg-white border'}`}>Legislations ({legislations.length})</button>
        <button onClick={() => { setActiveTab('requests'); fetchCopyRequests(); }} className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'requests' ? 'bg-slate-900 text-white' : 'bg-white border'}`}><Inbox size={16} /> Copy Requests {copyRequests.filter(r => r.status === 'Pending').length > 0 && <span className="bg-yellow-400 text-slate-900 text-xs px-2 py-0.5 rounded-full">{copyRequests.filter(r => r.status === 'Pending').length} Pending</span>}</button>
      </div>
      {activeTab === 'requests' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <select value={requestStatusFilter} onChange={e => setRequestStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2.5 text-sm bg-white"><option value="all">All Status</option><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Done">Done</option><option value="Rejected">Rejected</option></select>
            <button onClick={fetchCopyRequests} className="px-4 py-2.5 border rounded-lg text-sm bg-white">Refresh</button>
            <span className="text-sm text-gray-500 self-center">{copyRequests.filter(r => requestStatusFilter === 'all' || r.status === requestStatusFilter).length} request(s)</span>
          </div>
          {requestsLoading ? <p>Loading requests...</p> : copyRequests.filter(r => requestStatusFilter === 'all' || r.status === requestStatusFilter).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center"><Inbox className="mx-auto text-gray-300 mb-2" size={36} /><p className="font-bold">No copy requests yet.</p><p className="text-sm text-gray-500">Requests will appear here when someone submits a Request a Copy from the public page.</p></div>
          ) : (
            <div className="space-y-3">
              {copyRequests.filter(r => requestStatusFilter === 'all' || r.status === requestStatusFilter).map(r => (
                <div key={r.id} className="bg-white rounded-lg shadow p-4 cursor-pointer hover:border-blue-300 border border-transparent" onClick={() => { setSelectedRequest(r); setReplyText(''); }}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold bg-blue-50 text-blue-900 px-2.5 py-1 rounded-full">{r.legislation_number || '—'}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : r.status === 'Approved' ? 'bg-green-100 text-green-800' : r.status === 'Done' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{r.status || 'Pending'}</span>
                  </div>
                  <p className="text-sm font-bold leading-snug mb-1">{r.legislation_title || '—'}</p>
                  <p className="text-xs text-gray-600">👤 {r.requester_name} • ✉️ {r.requester_email} {r.requester_phone ? `• 📞 ${r.requester_phone}` : ''}</p>
                  <p className="text-xs text-gray-600 mt-1">📝 Purpose: {r.purpose}</p>
                  {(r as any).pdf_url && <p className="text-xs text-blue-600 mt-1 break-all">🔗 PDF: {(r as any).pdf_url}</p>}
                  <p className="text-xs text-gray-400 mt-1">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</p>
                  <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => updateRequestStatus(r.id, 'Approved')} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-full">Approve</button>
                    <button onClick={() => updateRequestStatus(r.id, 'Done')} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full">Mark Done</button>
                    <button onClick={() => updateRequestStatus(r.id, 'Rejected')} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">Reject</button>
                    <button onClick={() => { setSelectedRequest(r); setReplyText(''); }} className="px-3 py-1.5 bg-yellow-500 text-slate-900 text-xs font-bold rounded-full">Reply</button>
                    <button onClick={() => deleteRequest(r.id)} className="px-3 py-1.5 border text-xs font-bold rounded-full">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setSelectedRequest(null)}>
              <div className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-lg">Copy Request Detail</h3><button onClick={() => setSelectedRequest(null)}><X /></button></div>
                <p className="font-mono text-sm font-bold">{selectedRequest.legislation_number}</p>
                <p className="text-sm mt-1">{selectedRequest.legislation_title}</p>
                <div className="bg-slate-50 rounded-lg p-3 mt-3 text-sm space-y-1"><p><b>Name:</b> {selectedRequest.requester_name}</p><p><b>Email:</b> {selectedRequest.requester_email}</p><p><b>Phone:</b> {selectedRequest.requester_phone || '—'}</p><p><b>Purpose:</b> {selectedRequest.purpose}</p><p><b>Status:</b> {selectedRequest.status}</p><p><b>Date:</b> {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : ''}</p></div>
                {selectedRequest.admin_reply && (<div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3 text-sm"><p className="font-bold text-green-800 text-xs mb-1">Last Reply:</p><p className="whitespace-pre-wrap">{selectedRequest.admin_reply}</p></div>)}
                {(selectedRequest as any).pdf_url && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="font-bold text-xs text-blue-900 mb-1">Requested PDF:</p>
                    <p className="text-xs break-all text-blue-700 mb-2">{(selectedRequest as any).pdf_url}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { navigator.clipboard?.writeText((selectedRequest as any).pdf_url); alert('PDF Link copied! Paste it into the email.'); }} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full">Copy PDF Link</button>
                      <a href={(selectedRequest as any).pdf_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border text-xs font-bold rounded-full">Open PDF</a>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <label className="flex items-center gap-2 text-sm font-bold mb-2"><input type="checkbox" checked={includePdfLink} onChange={e => setIncludePdfLink(e.target.checked)} /> Include PDF Link in email</label>
                  <p className="text-xs text-gray-400 mb-2">If checked: the PDF link will be included in the email. If unchecked: attach the PDF manually in Gmail.</p>
                  <label className="block text-sm font-bold mb-1.5">Reply Message (will be emailed to requester)</label>
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} placeholder={`Hello ${selectedRequest.requester_name},\n\nYour requested copy for ${selectedRequest.legislation_number} is ready...`} className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none" />
                  <button onClick={() => handleReplyViaEmail(selectedRequest)} disabled={replySending} className="w-full mt-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-2.5 rounded-lg text-sm font-bold">📧 {replySending ? 'Sending...' : 'Send Reply via Email'}</button>
                  <p className="text-xs text-gray-400 mt-1">Opens Gmail with To, Subject, and Message ready. Attach the PDF there, then Send.</p>
                </div>
                <div className="flex gap-2 mt-4"><button onClick={() => updateRequestStatus(selectedRequest.id, 'Approved')} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold">Approve</button><button onClick={() => updateRequestStatus(selectedRequest.id, 'Done')} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold">Mark Done</button><button onClick={() => updateRequestStatus(selectedRequest.id, 'Rejected')} className="flex-1 bg-red-100 text-red-700 py-2.5 rounded-lg text-sm font-bold">Reject</button></div>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'legislations' && (<>
      {/* ===== EXPORT INVENTORY - ADDITIVE ONLY ===== */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h3 className="font-semibold text-sm sm:text-base text-blue-900">Export Reso / Ordinance — Inventory</h3>
          <span className="text-xs text-blue-700">Select — Year / Author / Classification — then Export</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <select value={exportType} onChange={e => setExportType(e.target.value)} className="border rounded-lg px-3 py-2.5 text-sm bg-white">
            <option value="all">All Type</option><option value="Ordinance">Ordinance</option><option value="Resolution">Resolution</option>
          </select>
          <select value={exportYear} onChange={e => setExportYear(e.target.value)} className="border rounded-lg px-3 py-2.5 text-sm bg-white">
            <option value="all">All Year</option>{Array.from(new Set(legislations.map(l => l.year_series).filter(Boolean))).sort((a,b)=>Number(b)-Number(a)).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={exportAuthor} onChange={e => setExportAuthor(e.target.value)} className="border rounded-lg px-3 py-2.5 text-sm bg-white">
            <option value="all">All Author</option>
            <option value="HON. ATTY. KIM GERONIMO B. FUENTES">HON. ATTY. KIM GERONIMO B. FUENTES</option>
            <option value="HON. DANIEL R. DELIMA, II">HON. DANIEL R. DELIMA, II</option>
            <option value="HON. VINCENT MAXIMILIAN T. ENTERO">HON. VINCENT MAXIMILIAN T. ENTERO</option>
            <option value="HON. FACUNDO D. GAVAS, JR.">HON. FACUNDO D. GAVAS, JR.</option>
            <option value="HON. EFREN S. TANJAY">HON. EFREN S. TANJAY</option>
            <option value="HON. ISIDORE G. BESAS">HON. ISIDORE G. BESAS</option>
            <option value="HON. GLAIZA MAE S. ATUEL">HON. GLAIZA MAE S. ATUEL</option>
            <option value="HON. GALICANO E. ATUP">HON. GALICANO E. ATUP</option>
            <option value="HON. MANSUETO I. DIANGCO">HON. MANSUETO I. DIANGCO</option>
            <option value="HON. RENILDO M. VALLESER">HON. RENILDO M. VALLESER</option>
            <option value="HON. JOHN PHILLIP S. NEBRIA">HON. JOHN PHILLIP S. NEBRIA</option>
            {Array.from(new Set(legislations.map(l => l.author).filter(Boolean))).sort().filter(a => !['HON. ATTY. KIM GERONIMO B. FUENTES','HON. DANIEL R. DELIMA, II','HON. VINCENT MAXIMILIAN T. ENTERO','HON. FACUNDO D. GAVAS, JR.','HON. EFREN S. TANJAY','HON. ISIDORE G. BESAS','HON. GLAIZA MAE S. ATUEL','HON. GALICANO E. ATUP','HON. MANSUETO I. DIANGCO','HON. RENILDO M. VALLESER','HON. JOHN PHILLIP S. NEBRIA'].includes(a)).map(a => <option key={a} value={a}>{a} (Previous Term)</option>)}
          </select>
          <select value={exportClassification} onChange={e => setExportClassification(e.target.value)} className="border rounded-lg px-3 py-2.5 text-sm bg-white">
            <option value="all">All Classification</option>
            <option value="Sports Development">Sports Development</option>
            <option value="Education and Culture">Education and Culture</option>
            <option value="Business Establishments">Business Establishments</option>
            <option value="Peace and Order">Peace and Order</option>
            <option value="Public Officials">Public Officials</option>
            <option value="Social Services">Social Services</option>
            <option value="Public Properties">Public Properties</option>
            <option value="Market and Slaughterhouses">Market and Slaughterhouses</option>
            <option value="Traffic and Transportation">Traffic and Transportation</option>
            <option value="Agriculture/Fisheries">Agriculture/Fisheries</option>
            <option value="Health and Sanitation">Health and Sanitation</option>
            <option value="Tourism">Tourism</option>
            <option value="Barangay Affairs">Barangay Affairs</option>
            <option value="Appropriation/Budget">Appropriation/Budget</option>
            <option value="Environment">Environment</option>
            <option value="Building Regulations">Building Regulations</option>
            <option value="Amusements/Games/Recreation">Amusements/Games/Recreation</option>
            <option value="Public Utilities">Public Utilities</option>
            <option value="Revenue / Taxation / Fees">Revenue / Taxation / Fees</option>
            <option value="Parks and Playgrounds">Parks and Playgrounds</option>
            <option value="Public Morals">Public Morals</option>
            <option value="Governance / Administrative">Governance / Administrative</option>
            <option value="Trade">Trade</option>
            <option value="Sports">Sports</option>
            <option value="Labor / Personnel">Labor / Personnel</option>
          </select>
        </div>
        <button onClick={handleExportCSV} className="mt-3 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">Export CSV — Inventory</button>
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
      </>)}
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
                  <input list="author-list" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="w-full border rounded-lg px-3 py-2.5" placeholder="Select from list or type / autofill" />
                  <datalist id="author-list">
                    <option value="HON. ATTY. KIM GERONIMO B. FUENTES" />
                    <option value="HON. DANIEL R. DELIMA, II" />
                    <option value="HON. VINCENT MAXIMILIAN T. ENTERO" />
                    <option value="HON. FACUNDO D. GAVAS, JR." />
                    <option value="HON. EFREN S. TANJAY" />
                    <option value="HON. ISIDORE G. BESAS" />
                    <option value="HON. GLAIZA MAE S. ATUEL" />
                    <option value="HON. GALICANO E. ATUP" />
                    <option value="HON. MANSUETO I. DIANGCO" />
                    <option value="HON. RENILDO M. VALLESER" />
                    <option value="HON. JOHN PHILLIP S. NEBRIA" />
                  </datalist>
                  <p className="text-xs text-gray-400 mt-1">Current term: select from list. Previous term: autofill / you can still type.</p></div>
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
                  <option>Sports Development</option>
                  <option>Education and Culture</option>
                  <option>Business Establishments</option>
                  <option>Peace and Order</option>
                  <option>Public Officials</option>
                  <option>Social Services</option>
                  <option>Public Properties</option>
                  <option>Market and Slaughterhouses</option>
                  <option>Traffic and Transportation</option>
                  <option>Agriculture/Fisheries</option>
                  <option>Health and Sanitation</option>
                  <option>Tourism</option>
                  <option>Barangay Affairs</option>
                  <option>Appropriation/Budget</option>
                  <option>Environment</option>
                  <option>Building Regulations</option>
                  <option>Amusements/Games/Recreation</option>
                  <option>Public Utilities</option>
                  <option>Revenue / Taxation / Fees</option>
                  <option>Parks and Playgrounds</option>
                  <option>Public Morals</option>
                  <option>Governance / Administrative</option>
                  <option>Trade</option>
                  <option>Sports</option>
                  <option>Labor / Personnel</option>
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
