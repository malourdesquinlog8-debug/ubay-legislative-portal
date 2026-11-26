// HomeSessions.tsx - Ipuli sa daan nga "Watch Sessions Live" section sa Home
// I-save sa: src/components/HomeSessions.tsx
// Sa Home.tsx, pangitaa ang daan nga "Watch Sessions Live" / "Upcoming Session" section,
// ilisi og: <HomeSessions />
// Ug sa ibabaw sa Home.tsx, dugangi: import HomeSessions from '../components/HomeSessions';

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, MapPin } from 'lucide-react';
import { format, isValid } from 'date-fns';

const TYPE_BG: Record<string, string> = {
  'Regular Session': 'bg-blue-100 text-blue-800',
  'Committee Hearing': 'bg-amber-100 text-amber-800',
  'Meeting': 'bg-emerald-100 text-emerald-800',
  'Special Session': 'bg-purple-100 text-purple-800',
  'Public Hearing': 'bg-rose-100 text-rose-800',
};

// SAFE DATE - dili na mo-gawas og INVALID DATE bisan unsa nga format
function safeDate(raw: any): Date | null {
  if (!raw) return null;
  // Kung "2026-12-01 09:00:00" (SQLite) -> himoong "2026-12-01T09:00:00"
  let s = String(raw).trim().replace(' ', 'T');
  // Kung "2026-12-01" lang -> dugangi og oras
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s = s + 'T09:00:00';
  const d = new Date(s);
  return isValid(d) ? d : null;
}

export default function HomeSessions() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : [];
        // Sort by date, ang pinaka-duol una
        list.sort((a: any, b: any) => {
          const da = safeDate(a.session_date)?.getTime() || 0;
          const db = safeDate(b.session_date)?.getTime() || 0;
          return da - db;
        });
        setSessions(list);
      })
      .catch(() => setSessions([]));
  }, []);

  const now = new Date();
  // Next Session = pinaka-una nga Scheduled nga dili pa milabay
  const next = sessions.find(s => {
    const d = safeDate(s.session_date);
    return d && d >= now && s.status !== 'Ended';
  });
  // This month = tanan sessions karong bulana
  const thisMonth = sessions.filter(s => {
    const d = safeDate(s.session_date);
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-5">
        {/* LEFT - NEXT SESSION */}
        <div className="bg-[#0a1628] text-white rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-2 text-yellow-400 text-sm font-bold">
            <Calendar className="w-4 h-4" /> NEXT SESSION
          </div>
          {!next ? (
            <>
              <h3 className="text-2xl font-bold mt-3">No scheduled session yet</h3>
              <p className="text-slate-300 text-sm mt-2">Check the Session Calendar for upcoming Regular Sessions, Committee Hearings, and Public Hearings.</p>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold mt-3">{next.title}</h3>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_BG[next.type] || 'bg-white/20'}`}>{next.type}</span>
                {next.committee && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20">{next.committee}</span>}
              </div>
              <p className="flex items-center gap-1.5 mt-4 text-slate-200">
                <Clock className="w-4 h-4" />
                {safeDate(next.session_date) ? format(safeDate(next.session_date)!, 'MMMM d, yyyy • h:mm a') : 'Date to be announced'}
              </p>
              {next.description && <p className="text-sm text-slate-300 mt-2 line-clamp-2">{next.description}</p>}
              <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-3"><MapPin className="w-3.5 h-3.5" /> Sangguniang Bayan Session Hall, Ubay, Bohol</p>
            </>
          )}
          <Link to="/sessions" className="inline-flex items-center gap-2 mt-5 bg-yellow-500 text-[#0a1628] font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-yellow-400">
            View Full Calendar <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* RIGHT - THIS MONTH */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">This Month&apos;s Schedule</h3>
            <Link to="/sessions" className="text-sm font-bold text-blue-700 hover:underline">View All →</Link>
          </div>
          {thisMonth.length === 0 ? (
            <p className="text-slate-400 text-sm mt-4">No sessions scheduled this month. Check the full calendar for other months.</p>
          ) : (
            <div className="divide-y mt-2">
              {thisMonth.map((s: any) => {
                const d = safeDate(s.session_date);
                return (
                  <Link key={s.id} to="/sessions" className="flex items-start gap-3 py-3 hover:bg-slate-50 rounded-lg px-1">
                    <div className="shrink-0 w-12 text-center bg-slate-50 border rounded-lg py-1.5">
                      <div className="text-lg font-bold leading-none">{d ? format(d, 'd') : '--'}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{d ? format(d, 'MMM') : ''}</div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{s.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d ? format(d, 'EEEE • h:mm a') : ''} {s.committee ? `• ${s.committee}` : ''}
                      </p>
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${TYPE_BG[s.type] || 'bg-slate-100'}`}>{s.type}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
