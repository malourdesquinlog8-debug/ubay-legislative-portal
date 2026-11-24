import { useState, useEffect, useRef } from 'react';
import { supabase } from "../../lib/supabase";
import { uploadToR2, deleteFromR2 } from "../../utils/r2Upload";

type Legislation = {
  id?: string;
  ordinance_no: string;
  year_series: string;
  title: string;
  description?: string;
  type: string;
  legislation_type?: string;
  date_approved: string;
  author: string;
  status?: string;
  pdf_url: string;
  file_url?: string;
  document_url?: string;
  pdf_filename?: string;
  file_size?: number;
  txt_url?: string;
  full_text?: string;
  created_at?: string;
};

export default function LegislativeManagement() {
  const [items, setItems] = useState<Legislation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Legislation | null>(null);
  const [saving, setSaving] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Legislation>({
    ordinance_no: '',
    year_series: new Date().getFullYear().toString(),
    title: '',
    type: 'Ordinance',
    date_approved: '',
    author: '',
    pdf_url: '',
    txt_url: '',
    full_text: '',
  });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('legislations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('FETCH ERROR:', error);
      alert('Fetch error: ' + error.message);
    }
    if (!error && data) setItems(data as Legislation[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      ordinance_no: '',
      year_series: new Date().getFullYear().toString(),
      title: '',
      type: 'Ordinance',
      date_approved: '',
      author: '',
      pdf_url: '',
      txt_url: '',
      full_text: '',
    });
  };

  // ============ GROQ ONLY AUTOFILL ============
  const handleGroqAutofill = async (file: File) => {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!groqKey) {
      alert('Wala pa ang VITE_GROQ_API_KEY sa .env / Vercel bro!');
      return;
    }
    setAutofilling(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let raw = '';
      for (let i = 0; i < uint8.length; i++) raw += String.fromCharCode(uint8[i]);
      const pdfText = raw.replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').slice(0, 15000);
      if (pdfText.length < 100) {
        alert('Dili mabasa ni Groq ang scanned PDF bro! Text PDF lang. Kung scanned, manual type lang sa title.');
        setAutofilling(false);
        return;
      }
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          temperature: 0.1,
          messages: [
            { role: 'system', content: `Ikaw ay taga-extract ng Ordinance / Resolution details. RULES: Title kuhaa lang hangtod sa WHEREAS o ENACTING. AYAW I-APIL ANG WHEREAS. Ibalik lang ug JSON.` },
            { role: 'user', content: `I-extract ni:\n\n${pdfText}\n\nIbalik nga JSON: {"ordinance_no":"","year_series":"","title":"","type":"","date_approved":"","author":"","full_text":""}` }
          ]
        }),
      });
      if (!res.ok) throw new Error('Groq Error: ' + (await res.text()).slice(0, 300));
      const data = await res.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start !== -1 && end !== -1) content = content.slice(start, end + 1);
      const parsed = JSON.parse(content);
      let cleanTitle = (parsed.title || '').trim();
      for (const w of ['WHEREAS', 'ENACTING', 'BE IT ENACTED', 'BE IT RESOLVED']) {
        const idx = cleanTitle.toUpperCase().indexOf(w);
        if (idx > 0) cleanTitle = cleanTitle.slice(0, idx).trim();
      }
      cleanTitle = cleanTitle.replace(/[.,;\s]+$/, '');
      setForm(prev => ({
        ...prev,
        ordinance_no: parsed.ordinance_no ? String(parsed.ordinance_no).trim() : prev.ordinance_no,
        year_series: parsed.year_series ? String(parsed.year_series).trim() : prev.year_series,
        title: cleanTitle || prev.title,
        type: parsed.type === 'Resolution' ? 'Resolution' : 'Ordinance',
        date_approved: parsed.date_approved || prev.date_approved,
        author: parsed.author || prev.author,
        full_text: parsed.full_text || prev.full_text,
      }));
      alert('Goods na bro! Groq na nag-autofill!');
    } catch (e: any) {
      alert('Groq Autofill failed: ' + e.message);
    } finally { setAutofilling(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const pdfUrl = await uploadToR2(file, 'legislations');
      setForm(prev => ({ ...prev, pdf_url: pdfUrl, pdf_filename: file.name, file_size: file.size }));
      await handleGroqAutofill(file);
    } catch (err: any) { alert('Upload failed: ' + err.message); }
  };

  const handleSave = async () => {
    if (!form.ordinance_no || !form.title || !form.pdf_url) {
      alert('Kulang bro! Number, Title, ug PDF kinahanglan!');
      return;
    }
    setSaving(true);
    try {
      let txtUrl = form.txt_url || '';
      if (form.full_text && !txtUrl) {
        const blob = new Blob([form.full_text], { type: 'text/plain' });
        const txtFile = new File([blob], `${form.ordinance_no}-${form.year_series}.txt`, { type: 'text/plain' });
        txtUrl = await uploadToR2(txtFile, 'legislations-txt');
      }
      const payload = {
        ordinance_no: form.ordinance_no.trim(),
        year_series: form.year_series.trim(),
        title: form.title.trim(),
        type: form.type,
        legislation_type: form.type,
        date_approved: form.date_approved || null,
        author: form.author.trim(),
        pdf_url: form.pdf_url,
        file_url: form.pdf_url,
        document_url: form.pdf_url,
        pdf_filename: form.pdf_filename || null,
        file_size: form.file_size || null,
        txt_url: txtUrl,
        full_text: form.full_text || null,
        status: 'Approved',
      };
      if (editing?.id) {
        const { error } = await supabase.from('legislations').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('legislations').insert([payload]);
        if (error) throw error;
      }
      setShowModal(false); resetForm(); fetchItems(); alert('Saved na bro!');
    } catch (err: any) { alert('Save failed: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: Legislation) => {
    if (!confirm(`Delete ${item.type} No. ${item.ordinance_no}? Mawala sad ang PDF sa R2!`)) return;
    try {
      const { error } = await supabase.from('legislations').delete().eq('id', item.id);
      if (error) throw error;
      if (item.pdf_url) await deleteFromR2(item.pdf_url);
      if (item.txt_url) await deleteFromR2(item.txt_url);
      fetchItems(); alert('Deleted na bro, apil R2!');
    } catch (err: any) { alert('Delete failed: ' + err.message); }
  };

  const handleEdit = (item: Legislation) => {
    setEditing(item);
    setForm({ ...item, year_series: item.year_series || (item.date_approved ? String(item.date_approved).slice(0, 4) : new Date().getFullYear().toString()) });
    setShowModal(true);
  };

  const filtered = items.filter(it => {
    const matchSearch = (it.title + ' ' + it.ordinance_no + ' ' + (it.author || '')).toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || it.type === filterType || it.legislation_type === filterType;
    const matchYear = filterYear === 'All' || it.year_series === filterYear || (it.date_approved && String(it.date_approved).slice(0, 4) === filterYear);
    return matchSearch && matchType && matchYear;
  });

  const years = Array.from(new Set(items.map(i => i.year_series || (i.date_approved ? String(i.date_approved).slice(0, 4) : '')))).filter(Boolean).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Legislative Management</h1>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ Add Legislation</button>
      </div>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, number, author..." className="flex-1 border p-2 rounded-lg" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border p-2 rounded-lg">
          <option value="All">All Types</option><option value="Ordinance">Ordinance</option><option value="Resolution">Resolution</option>
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border p-2 rounded-lg">
          <option value="All">All Years</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-100"><tr><th className="p-3 text-left">No. / Year</th><th className="p-3 text-left">Title</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Author</th><th className="p-3 text-left">Actions</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 font-semibold whitespace-nowrap">{item.ordinance_no} • {item.year_series || (item.date_approved ? String(item.date_approved).slice(0, 4) : '-')}</td>
                  <td className="p-3">{item.title}</td>
                  <td className="p-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{item.type}</span></td>
                  <td className="p-3 whitespace-nowrap">{item.date_approved || '-'}</td>
                  <td className="p-3">{item.author || '-'}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-1">Edit</button>
                    <button onClick={() => handleDelete(item)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">Walay nakit-an bro.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h- flex flex-col overflow-hidden">
            <div className="p-4 border-b shrink-0 flex justify-between items-center">
              <h2 className="text-lg font-bold">{editing ? 'Edit Legislation' : 'Add Legislation'}</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div><label className="font-semibold text-sm">PDF File</label><input type="file" accept=".pdf" ref={fileRef} onChange={handleFileChange} className="w-full border p-2 rounded-lg mt-1" />{autofilling && <p className="text-blue-600 text-sm mt-1">⏳ Groq nag-basa sa PDF... Hulata bro...</p>}{form.pdf_url && <a href={form.pdf_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline">View Uploaded PDF</a>}</div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="font-semibold text-sm">Number *</label><input value={form.ordinance_no} onChange={e => setForm({ ...form, ordinance_no: e.target.value })} className="w-full border p-2 rounded-lg mt-1" placeholder="e.g. 734" /></div>
                <div><label className="font-semibold text-sm">Year Series</label><input value={form.year_series} onChange={e => setForm({ ...form, year_series: e.target.value })} className="w-full border p-2 rounded-lg mt-1" placeholder="2026" /></div>
              </div>
              <div><label className="font-semibold text-sm">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border p-2 rounded-lg mt-1"><option value="Ordinance">Ordinance</option><option value="Resolution">Resolution</option></select></div>
              <div><label className="font-semibold text-sm">Title * (mohunong sa WHEREAS)</label><textarea value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} rows={3} className="w-full border p-2 rounded-lg mt-1" placeholder="AN ORDINANCE..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="font-semibold text-sm">Date Approved</label><input type="date" value={form.date_approved} onChange={e => setForm({ ...form, date_approved: e.target.value })} className="w-full border p-2 rounded-lg mt-1" /></div>
                <div><label className="font-semibold text-sm">Author / Sponsor</label><input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="w-full border p-2 rounded-lg mt-1" placeholder="Hon. ..." /></div>
              </div>
              <div><label className="font-semibold text-sm">Full Text (WHEREAS apil, para sa chatbot)</label><textarea value={form.full_text} onChange={e => setForm({ ...form, full_text: e.target.value })} rows={4} className="w-full border p-2 rounded-lg mt-1" placeholder="Auto-fill ni Groq..." /></div>
            </div>
            <div className="p-4 border-t shrink-0 flex justify-end gap-2 bg-white">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}