// AdminSessions.tsx — Admin page para mo-set og Session Calendar
// Ibutang sa: src/pages/AdminSessions.tsx
// Route: /admin/sessions
// GOLDEN RULE: Kini nga Admin page lang ang bag-o, ayaw hilabti ang LiveSession nga public page.

import { useState, useEffect } from 'react';
import { Calendar, Plus, Pencil, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

const TYPES = ['Regular Session', 'Committee Hearing', 'Meeting', 'Special Session', 'Public Hearing'];
const COMMITTEES = [
  '', 'Budget / Appropriation', 'Health & Sanitation', 'Education & Culture',
  'Agriculture / Fisheries', 'Infrastructure', 'Peace & Order',
  'Tourism', 'Market & Slaughterhouse', 'Barangay Affairs',
  'ABC - Barangay Captains', 'SK Federation', 'Others'
];
const STATUSES = ['Scheduled', 'Live', 'Ended'];

const TYPE_COLORS: Record<string, string> = {
  'Regular Session': 'bg-blue-100 text-blue-800',
  'Committee Hearing': 'bg-amber-100 text-amber-800',
  'Meeting': 'bg-emerald-100 text-emerald-800',
  'Special Session': 'bg-purple-100 text-purple-800',
  'Public Hearing': 'bg-rose-100 text-rose-800',
};

export default function AdminSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    session_date: '', // yyyy-MM-dd
    session_time: '09:00', // HH:mm
    status: 'Scheduled',
    type: 'Regular Session',
    committee: '',
    description: '',
    video_url: '',
  });

  const load = () => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => setSessions(Array.isArray(d) ? d : []))
      .catch(() => setSessions([]));
  };
  useEffect(load, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', session_date: '', session_time: '09:00', status: 'Scheduled', type: 'Regular Session', committee: '', description: '', video_url: '' });
    setShowForm(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    const d = new Date(s.session_date);
    setForm({
      title: s.title || '',
      session_date: format(d, 'yyyy-MM-dd'),
      session_time: format(d, 'HH:mm'),
      status: s.status || 'Scheduled',
      type: s.type || 'Regular Session',
      committee: s.committee || '',
      description: s.description || '',
      video_url: s.video_url || '',
    });
    setShowForm(true);
  };

  // Auto-title: kung Regular Session ug walay title, auto-fill
  const handleTypeChange = (type: string) => {
    setForm(prev => ({
      ...prev,
      type,
      title: prev.title === '' || TYPES.includes(prev.title) ? type : prev.title,
      // Kung Committee Hearing, default committee = Budget para dali
      committee: type === 'Committee Hearing' && !prev.committee ? 'Budget / Appropriation' : prev.committee,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.session_date) return alert('Pilia ang petsa!');
    const payload = {
      title: form.title || form.type,
      session_date: `${form.session_date}T${form.session_time}:00`,
      status: form.status,
      type: form.type,
      committee: form.committee,
      description: form.description,
      video_url: form.video_url,
      streaming_platform: 'YouTube',
    };
    const url = editing ? `/api/sessions/${editing.id}` : '/api/sessions';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      setShowForm(false);
      load();
      alert(editing ? 'Na-update na bro!' : 'Na-add na bro!');
    } else {
      alert('Napakyas pag-save. Check ang /api/sessions sa server.js');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete gyud ni nga session?')) return;
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    load();
  };

  const handleSetLive = async (s: any) => {
    // Usa ra ka LIVE at a time — i-End ang uban, i-Live ni
    await fetch(`/api/sessions/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...s, status: 'Live' }) });
    load();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Calendar className="w-8 h-8 text-yellow-500" /> Session Calendar — Admin</h1>
          <p className="text-slate-500 mt-1">Ikaw ang mo-set kung unsa nga adlaw ang Regular Session, Hearing, Meeting, etc.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#0a1628] text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-slate-800">
          <Plus className="w-4 h-4" /> Add Session
        </button>
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap gap-2 mt-5">
        {TYPES.map(t => (
          <span key={t} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${TYPE_COLORS[t]}`}>{t}</span>
        ))}
      </div>

      {/* LIST */}
      <div className="bg-white border rounded-xl overflow-hidden mt-5 shadow-sm">
        <table className="w-full text-left">
          <thead><tr className="bg-slate-50 border-b text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Petsa / Oras</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Committee</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
          </tr></thead>
          <tbody className="divide-y">
            {sessions.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Walay session pa. Click <b>Add Session</b> sa ibabaw.</td></tr>}
            {sessions.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">{format(new Date(s.session_date), 'MMM d, yyyy • h:mm a')}</td>
                <td className="px-4 py-3 text-sm font-bold">{s.title}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[s.type] || 'bg-slate-100'}`}>{s.type}</span></td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.committee || '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.status === 'Live' ? 'bg-red-100 text-red-700 animate-pulse' : s.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span></td>
                <td className="px-4 py-3 text-right space-x-1">
                  {s.status !== 'Live' && <button onClick={() => handleSetLive(s)} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg">Go Live</button>}
                  <button onClick={() => openEdit(s)} className="p-2 hover:bg-slate-100 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSave} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{editing ? 'Edit Session' : 'Add Session'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>

            <div>
              <label className="text-sm font-semibold">Type — Pilia kung unsa ni *</label>
              <select value={form.type} onChange={e => handleTypeChange(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 mt-1">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">🔵 Regular • 🟡 Hearing • 🟢 Meeting • 🟣 Special • 🔴 Public Hearing</p>
            </div>

            <div>
              <label className="text-sm font-semibold">Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Regular Session / Committee Hearing - Budget" className="w-full border rounded-lg px-3 py-2.5 mt-1" />
              <p className="text-xs text-slate-400 mt-1">Kung blanko, automatic = Type (e.g. Regular Session)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">Petsa *</label>
                <input type="date" required value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 mt-1" />
              </div>
              <div>
                <label className="text-sm font-semibold">Oras *</label>
                <input type="time" required value={form.session_time} onChange={e => setForm({ ...form, session_time: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 mt-1" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Committee (kung Hearing / Meeting)</label>
              <select value={form.committee} onChange={e => setForm({ ...form, committee: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 mt-1">
                {COMMITTEES.map(c => <option key={c} value={c}>{c === '' ? '— Walay Committee / Regular Session —' : c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 mt-1">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Agenda / Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="e.g. Agenda: Ordinances, Budget Deliberation..." className="w-full border rounded-lg px-3 py-2.5 mt-1" />
            </div>

            <div>
              <label className="text-sm font-semibold">YouTube / Video URL (optional)</label>
              <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="w-full border rounded-lg px-3 py-2.5 mt-1" />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2.5 font-semibold">Cancel</button>
              <button type="submit" className="flex-1 bg-[#0a1628] text-white rounded-lg py-2.5 font-semibold">{editing ? 'Save Changes' : 'Add Session'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
