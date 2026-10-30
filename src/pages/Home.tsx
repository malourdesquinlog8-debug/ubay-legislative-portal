import { useState, useEffect } from 'react';
import { FileText, Calendar, ArrowRight, Video, Users } from 'lucide-react';
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

  return (
    <div className="space-y-0 pb-20 overflow-visible bg-transparent">
      <section className="bg-slate-900/80 text-white relative">
        <div className="absolute inset-0 bg-[url('/SESSION.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight !text-white">
              Legislative Transparency <br />
              <span className="text-yellow-500">at Your Fingertips</span>
            </h1>
            <p className="text-sm text-slate-300 mb-5">Access ordinances, watch live sessions, and participate in the legislative process of UBAY.</p>
            <div className="flex flex-wrap gap-2 items-center">
              <Link to="/ordinances" className="!transform-gpu bg-yellow-500 text-slate-900 font-bold px-5 py-2.5 rounded-full text-xs hover:bg-yellow-400 transition-all duration-300 ease-out hover:!scale-110 hover:!-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">Search Ordinances</Link>
              <Link to="/sessions" className="!transform-gpu bg-white/10 border border-white/20 text-white font-bold px-5 py-2.5 rounded-full text-xs hover:bg-white/20 flex items-center transition-all duration-300 ease-out hover:!scale-110 hover:!-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"><Video className="w-4 h-4 mr-2" /> Watch Live Session</Link>
            </div>
          </div>
        </div>
      </section>

      {/* OVERFLOW VISIBLE PARA BULGING DILI MA CUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 overflow-visible !overflow-visible">
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
            <p className="text-slate-600 text-sm mb-4">No upcoming sessions scheduled.</p>
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

      <section className="bg-transparent py-8 mt-2 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
          <div className="grid md:grid-cols-2 gap-12 items-center bg-white/90 p-6 rounded-xl shadow-sm overflow-visible">
            <div className="overflow-visible">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wide mb-4">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>Live Streaming
              </div>
              <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">Watch Sessions Live</h2>
              <p className="text-slate-600 mb-6 text-">Transparency is key to good governance. Watch our regular sessions live.</p>
              {/* REMOVE THIS BOX - GI-X MAN NIMO */}
            </div>
            <div className="!transform-gpu bg-white p-4 rounded-xl shadow-xl transition-all duration-300 will-change-transform hover:!scale-[1.03] hover:!shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]">
              <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-white"><Video className="w-12 h-12 opacity-50" /></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}