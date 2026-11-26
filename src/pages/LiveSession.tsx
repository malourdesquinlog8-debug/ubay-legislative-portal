import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';

// English version - same layout as screenshot, same /api/sessions source as Admin
const TYPE_COLORS: Record<string, string> = {
  'Regular Session': 'bg-blue-100 text-blue-800',
  'Committee Hearing': 'bg-amber-100 text-amber-800',
  'Meeting': 'bg-emerald-100 text-emerald-800',
  'Special Session': 'bg-purple-100 text-purple-800',
  'Public Hearing': 'bg-rose-100 text-rose-800',
};
const DOT_COLORS: Record<string, string> = {
  'Regular Session': 'bg-blue-600',
  'Committee Hearing': 'bg-amber-600',
  'Meeting': 'bg-emerald-600',
  'Special Session': 'bg-purple-600',
  'Public Hearing': 'bg-rose-600',
};

function parseDate(d: any): Date | null {
  if (!d) return null;
  const s = String(d).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const tm = s.match(/T(\d{2}):(\d{2})/);
    if (tm) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(tm[1]), Number(tm[2]));
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 9, 0);
  }
  const date = new Date(s);
  return isNaN(date.getTime()) ? null : date;
}
function keyOf(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

export default function Sessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [current, setCurrent] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selected, setSelected] = useState<Date>(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); });

  useEffect(() => {
    fetch('/api/sessions').then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d); }).catch(() => {});
  }, []);

  const byDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    sessions.forEach((s) => { const d = parseDate(s.session_date); if (!d) return; const k = keyOf(d); (map[k] ||= []).push(s); });
    return map;
  }, [sessions]);

  const year = current.getFullYear(), month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const today = new Date(); const todayKey = keyOf(today);
  const selectedKey = keyOf(selected);
  const selectedSessions = byDay[selectedKey] || [];

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));

  return (
    <div className="bg-[#fefce8] min-h-screen pb-16">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-8">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-7 h-7 text-yellow-500" />
          <h1 className="text-3xl font-serif font-bold text-slate-900">Session Calendar</h1>
        </div>
        <p className="text-slate-500 mt-2">See when the Regular Session, Committee Hearing, Meeting, and Public Hearing of the Sangguniang Bayan are scheduled.</p>

        <div className="flex flex-wrap gap-2 mt-5">
          {Object.keys(TYPE_COLORS).map(t => (
            <span key={t} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[t]}`}>● {t}</span>
          ))}
        </div>

        <div className="grid md:grid-cols-[1fr_340px] gap-6 mt-6 items-start">
          {/* CALENDAR */}
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <button onClick={prev} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm font-bold hover:bg-slate-50">&lt; Prev</button>
              <h2 className="text-lg font-serif font-bold">{current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
              <button onClick={next} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm font-bold hover:bg-slate-50">Next &gt;</button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-slate-400 font-medium mb-2">
              {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const k = keyOf(d);
                const daySessions = byDay[k] || [];
                const isToday = k === todayKey;
                const isSelected = k === selectedKey;
                return (
                  <button key={i} onClick={() => setSelected(d)}
                    className={`min-h-[56px] text-left p-1.5 rounded-md border text-sm font-bold ${isSelected ? 'bg-slate-900 text-white border-slate-900' : isToday ? 'border-yellow-400 border-2' : 'border-slate-400 hover:bg-slate-50'}`}>
                    {d.getDate()}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {daySessions.slice(0, 3).map((s, idx) => (
                        <span key={idx} className={`w-2 h-2 rounded-full ${DOT_COLORS[s.type] || 'bg-slate-400'}`} title={s.title} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-4">Click a day to see the sessions for that day. The yellow border is today.</p>
          </div>

          {/* DETAIL */}
          <div className="bg-white border border-slate-300 rounded-lg p-5">
            <h3 className="font-serif font-bold text-lg">{selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} ({selected.toLocaleDateString('en-US', { weekday: 'long' })})</h3>
            {selectedSessions.length === 0 ? (
              <>
                <p className="text-slate-500 text-sm mt-3">No session on this day.</p>
                <p className="text-slate-400 text-xs mt-4 flex items-start gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Sangguniang Bayan Session Hall, Ubay, Bohol</p>
              </>
            ) : (
              <div className="space-y-4 mt-3">
                {selectedSessions.map((s: any) => {
                  const d = parseDate(s.session_date);
                  return (
                    <div key={s.id} className="border-b border-slate-100 pb-3 last:border-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${TYPE_COLORS[s.type] || 'bg-slate-100'}`}>{s.type}</span>
                      <p className="font-bold text-slate-900 mt-1.5">{s.title}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><Clock className="w-4 h-4" /> {d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}{s.location ? ` • ${s.location}` : ''}</p>
                      {s.description && <p className="text-sm text-slate-600 mt-1">{s.description}</p>}
                      {s.committee && <p className="text-xs text-slate-400 mt-1">Committee: {s.committee}</p>}
                    </div>
                  );
                })}
                <p className="text-slate-400 text-xs flex items-start gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Sangguniang Bayan Session Hall, Ubay, Bohol</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
