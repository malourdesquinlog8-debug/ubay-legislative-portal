import { useState, useEffect } from 'react';
import { FileText, Calendar, ArrowRight, Video, Users, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await supabase.from('sessions').select('*').order('session_date', { ascending: false }).limit(5);
        if (data) setSessions(data);
      } catch (err) { console.error(err); }
    };
    fetchSessions();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = sessions
    .filter((s) => (s.session_date || '').split('T')[0] >= today)
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  const nextSession = upcoming[0] || null;

  const formatSessionDate = (d: string) => {
    if (!d) return '-';
    try {
      const date = new Date(d + 'T00:00:00');
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
    } catch { return d; }
  };

  return (
    <div className="space-y-0 pb-20 overflow-visible bg-transparent">
      {/* HERO - TUPONG NA GYUD SA LOGO */}
      <section className="bg-[#0f172a] text-white relative pb-20 md:pb-24">
        <div className="relative z-10 max-w-[1680px] mx-auto px-4 md:px-6 pt-14 md:pt-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight text-white">
              Legislative Transparency
              <br />
              <span className="text-yellow-500">at Your Fingertips</span>
            </h1>
            <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-6 max-w-2xl">Access ordinances, watch live sessions, and participate in the legislative process of Ubay. Your voice matters in local governance.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/ordinances" className="inline-flex items-center justify-center w-[190px] bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-4 py-3 rounded-lg text-sm transform-gpu transition-transform duration-250 ease-out will-change-transform hover:scale-115 hover:-translate-y-1 hover:shadow-xl">Search Ordinances</Link>
              <Link to="/sessions" className="inline-flex items-center justify-center w-[190px] bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold px-4 py-3 rounded-lg text-sm transform-gpu transition-transform duration-250 ease-out will-change-transform hover:scale-115 hover:-translate-y-1 hover:shadow-xl">🎥 Watch Live Session</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CARDS - TUPONG NA SA HERO UG LOGO */}
      <section className="max-w-[1680px] mx-auto px-4 md:px-6 mt-8 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 overflow-visible !overflow-visible pt-6 pb-10">

          <div className="!transform-gpu group relative bg-white p-6 rounded-xl shadow-lg border-t-4 border-white transition-all duration-300 ease-out will-change-transform hover:!scale-[1.12] hover:!-translate-y-4 hover:!translate-x-2 hover:!z-[50] hover:!shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] hover:!rotate-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">Latest Legislations</h3>
              <FileText className="text-yellow-500 w-6 h-6 transition-all duration-300 group-hover:!scale-[1.8] group-hover:rotate-12" />
            </div>
            <p className="text-slate-600 text-sm mb-4">Browse recently approved municipal laws and regulations.</p>
            <Link to="/ordinances" className="inline-flex items-center text-sm font-medium text-slate-900 gap-1 group-hover:gap-3 group-hover:font-bold transition-all">View All <ArrowRight className="w-4 h-4 transition-all group-hover:!translate-x-2 group-hover:!scale-125" /></Link>
          </div>

          <div className="!transform-gpu group relative bg-white p-6 rounded-xl shadow-lg border-t-4 border-white transition-all duration-300 ease-out will-change-transform hover:!scale-[1.12] hover:!-translate-y-4 hover:!z-[50] hover:!shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">Session Calendar</h3>
              <Calendar className="text-blue-500 w-6 h-6 transition-all duration-300 group-hover:!scale-[1.8] group-hover:rotate-12" />
            </div>
            <p className="text-slate-600 text-sm mb-4">{nextSession ? formatSessionDate(nextSession.session_date) : 'No upcoming sessions scheduled.'}</p>
            <Link to="/sessions" className="inline-flex items-center text-sm font-medium text-slate-900 gap-1 group-hover:gap-3 group-hover:font-bold transition-all">View Full Schedule <ArrowRight className="w-4 h-4 transition-all group-hover:!translate-x-2 group-hover:!scale-125" /></Link>
          </div>

          <div className="!transform-gpu group relative bg-white p-6 rounded-xl shadow-lg border-t-4 border-white transition-all duration-300 ease-out will-change-transform hover:!scale-[1.12] hover:!-translate-y-4 hover:!-translate-x-2 hover:!z-[50] hover:!shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] hover:!-rotate-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">Public Participation</h3>
              <Users className="text-green-500 w-6 h-6 transition-all duration-300 group-hover:!scale-[1.8] group-hover:rotate-12" />
            </div>
            <p className="text-slate-600 text-sm mb-4">Submit comments, suggestions, and feedback on proposed measures.</p>
            <Link to="/contact" className="inline-flex items-center text-sm font-medium text-slate-900 gap-1 group-hover:gap-3 group-hover:font-bold transition-all">Get Involved <ArrowRight className="w-4 h-4 transition-all group-hover:!translate-x-2 group-hover:!scale-125" /></Link>
          </div>

        </div>
      </section>

      {/* NEXT SESSION CARD - TUPONG SAD */}
      <section className="bg-transparent py-8 mt-2 overflow-visible">
        <div className="max-w-[1680px] mx-auto px-4 md:px-6 overflow-visible">
          <div className="grid md:grid-cols-2 gap-12 items-center bg-white/90 p-6 rounded-xl shadow-sm overflow-visible">
            <div className="overflow-visible">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide mb-4">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>Next Session
              </div>
              <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">Upcoming Sangguniang Bayan Session</h2>
              {nextSession ? (
                <div className="space-y-3">
                  <p className="text-lg font-bold text-slate-800">{nextSession.title || 'Regular Session'}</p>
                  <p className="text-slate-600 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600" /> {formatSessionDate(nextSession.session_date)}</p>
                  {nextSession.session_time && <p className="text-slate-600 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> {nextSession.session_time}</p>}
                  {nextSession.location && <p className="text-slate-600 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> {nextSession.location}</p>}
                  {nextSession.description && <p className="text-slate-600 text-sm">{nextSession.description}</p>}
                </div>
              ) : (
                <p className="text-slate-600 mb-6">No upcoming sessions scheduled. Please check the full schedule for updates.</p>
              )}
              <Link to="/sessions" className="mt-6 inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-lg text-sm gap-2">
                View Full Schedule <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="!transform-gpu bg-slate-900 p-6 rounded-xl shadow-xl transition-all duration-300 will-change-transform hover:!scale-[1.03] hover:!shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] text-white">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-6 h-6 text-yellow-500" />
                <h3 className="font-bold text-lg">Watch Sessions Live</h3>
              </div>
              {nextSession ? (
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-yellow-400 font-bold text-sm uppercase tracking-wide mb-1">Next Session</p>
                  <p className="text-2xl font-serif font-bold">{formatSessionDate(nextSession.session_date)}</p>
                  <p className="text-slate-300 text-sm mt-1">{nextSession.title || 'Regular Session'}</p>
                </div>
              ) : (
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <p className="text-slate-300 text-sm">No live session at the moment.</p>
                  <p className="text-slate-400 text-xs mt-1">Session recordings and schedule are available on the Sessions page.</p>
                </div>
              )}
              <Link to="/sessions" className="mt-4 inline-flex items-center justify-center w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-4 py-3 rounded-lg text-sm gap-2">
                <Video className="w-4 h-4" /> Go to Sessions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}