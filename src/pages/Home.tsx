import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [stats, setStats] = useState({ ordinances: 0, members: 0, news: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordRes, memberRes, newsRes] = await Promise.all([
          supabase.from('legislations').select('*', { count: 'exact', head: true }),
          supabase.from('sb_members').select('*', { count: 'exact', head: true }),
          supabase.from('news').select('*', { count: 'exact', head: true }),
        ]);
        setStats({
          ordinances: ordRes.count || 0,
          members: memberRes.count || 0,
          news: newsRes.count || 0,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-extrabold leading-tight">
              Transparent Governance,<br />
              <span className="text-yellow-400">Accessible Legislation</span>
            </h1>
            <p className="text-slate-300 mt-4 text-lg">
              Official Legislative Portal of the Sangguniang Bayan ng UBAY. Access ordinances, resolutions, session schedules, and public participation.
            </p>
            <div className="flex gap-4 mt-8">
              <Link to="/ordinances" className="bg-yellow-400 text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-300 transition">
                Browse Legislation
              </Link>
              <Link to="/sessions" className="border border-white/30 px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition">
                Watch Live
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3 CARDS - Latest Ordinances, Session Calendar, Public Participation */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Latest Ordinances */}
          <div className="bg-white border-t-4 border-yellow-400 rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-slate-900">Latest Ordinances</h3>
              <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">📄</div>
            </div>
            <p className="text-sm text-slate-600 mt-3">Browse recently approved municipal laws and regulations.</p>
            <Link to="/ordinances" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 mt-4 hover:gap-2 transition-all">
              View All <span>→</span>
            </Link>
          </div>

          {/* Session Calendar */}
          <div className="bg-white border-t-4 border-blue-500 rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-slate-900">Session Calendar</h3>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">📅</div>
            </div>
            <p className="text-sm text-slate-600 mt-3">No upcoming sessions scheduled.</p>
            <Link to="/sessions" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 mt-4 hover:gap-2 transition-all">
              View Full Schedule <span>→</span>
            </Link>
          </div>

          {/* Public Participation */}
          <div className="bg-white border-t-4 border-green-500 rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-slate-900">Public Participation</h3>
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">👥</div>
            </div>
            <p className="text-sm text-slate-600 mt-3">Submit comments, suggestions, and feedback on proposed measures.</p>
            <Link to="/contact" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 mt-4 hover:gap-2 transition-all">
              Get Involved <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* GI-DELETE NA ANG REDUNDANT - Recent Legislation & News & Events - WALA NA DITO! */}

      {/* WATCH SESSIONS LIVE - DIRECT NA */}
      <section className="bg-slate-50 mt-16 py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> LIVE STREAMING
            </span>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-4">Watch Sessions Live</h2>
            <p className="text-slate-600 mt-4 leading-relaxed">
              Transparency is key to good governance. Watch our regular sessions live, or browse our archive of past sessions. Stay informed about legislative decisions that shape our municipality.
            </p>
            <div className="flex gap-4 mt-6">
              <Link to="/sessions" className="bg-slate-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition">
                Watch Now
              </Link>
              <Link to="/sessions" className="border border-slate-300 px-6 py-3 rounded-lg font-medium hover:bg-white transition">
                View Archive
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-2">
            <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">▶</span>
                </div>
                <p className="font-medium">No live session at the moment</p>
                <p className="text-sm text-slate-400 mt-1">Check schedule for upcoming sessions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER STATS */}
      <section className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-center gap-12 text-center">
          <div><p className="text-3xl font-extrabold text-slate-900">{stats.ordinances}</p><p className="text-xs text-slate-500 uppercase tracking-wider">Ordinances</p></div>
          <div><p className="text-3xl font-extrabold text-slate-900">{stats.members}</p><p className="text-xs text-slate-500 uppercase tracking-wider">SB Members</p></div>
          <div><p className="text-3xl font-extrabold text-slate-900">{stats.news}</p><p className="text-xs text-slate-500 uppercase tracking-wider">News & Events</p></div>
        </div>
      </section>
    </div>
  );
}