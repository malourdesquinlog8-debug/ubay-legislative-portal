import { useState, useEffect } from 'react';
import { FileText, Calendar, ArrowRight, Video, Users, Facebook, Youtube } from 'lucide-react';
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
    <div className="space-y-12 pb-12 overflow-visible">
      <section className="bg-lgu-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/SESSION.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight !text-white">
              Legislative Transparency <br />
              <span className="text-lgu-gold-500">at Your Fingertips</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8">Access ordinances, watch live sessions, and participate in the legislative process of UBAY.</p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link to="/ordinances" className="bg-lgu-gold-500 text-lgu-blue-900 font-bold px-6 py-3 rounded-lg hover:bg-lgu-gold-600 transform hover:scale-105 transition-all duration-200">Search Ordinances</Link>
              <Link to="/sessions" className="bg-white/10 border border-white/20 text-white font-bold px-6 py-3 rounded-lg hover:bg-white/20 transform hover:scale-105 transition-all duration-200 flex items-center justify-center"><Video className="w-5 h-5 mr-2" /> Watch Live Session</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3 CARDS WITH OVERLAP + LINKS BACK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 overflow-visible">
          
          <div className="group relative bg-white p-6 rounded-xl shadow-lg border-t-4 border-yellow-400 
                          transition-all duration-300 ease-out
                          hover:scale-110 hover:-translate-y-3 hover:translate-x-3 hover:z-50 hover:shadow-2xl hover:rotate-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">Latest Ordinances</h3>
              <FileText className="text-yellow-500 w-6 h-6 group-hover:scale-150 group-hover:rotate-12 transition-all duration-300" />
            </div>
            <p className="text-slate-600 text-sm mb-4">Browse recently approved municipal laws and regulations.</p>
            <Link to="/ordinances" className="inline-flex items-center text-sm font-medium text-slate-900 gap-1 group-hover:gap-2 group-hover:font-bold group-hover:text-lgu-blue-900 transition-all hover:scale-110 origin-left">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:scale-125 transition-all" />
            </Link>
          </div>

          <div className="group relative bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500 
                          transition-all duration-300 ease-out
                          hover:scale-110 hover:-translate-y-3 hover:z-50 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">Session Calendar</h3>
              <Calendar className="text-blue-500 w-6 h-6 group-hover:scale-150 group-hover:rotate-12 transition-all duration-300" />
            </div>
            <p className="text-slate-600 text-sm mb-4">No upcoming sessions scheduled.</p>
            <Link to="/sessions" className="inline-flex items-center text-sm font-medium text-slate-900 gap-1 group-hover:gap-2 group-hover:font-bold group-hover:text-blue-600 transition-all hover:scale-110 origin-left">
              View Full Schedule <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:scale-125 transition-all" />
            </Link>
          </div>

          <div className="group relative bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-500 
                          transition-all duration-300 ease-out
                          hover:scale-110 hover:-translate-y-3 hover:-translate-x-3 hover:z-50 hover:shadow-2xl hover:-rotate-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">Public Participation</h3>
              <Users className="text-green-500 w-6 h-6 group-hover:scale-150 group-hover:rotate-12 transition-all duration-300" />
            </div>
            <p className="text-slate-600 text-sm mb-4">Submit comments, suggestions, and feedback on proposed measures.</p>
            <Link to="/contact" className="inline-flex items-center text-sm font-medium text-slate-900 gap-1 group-hover:gap-2 group-hover:font-bold group-hover:text-green-600 transition-all hover:scale-110 origin-left">
              Get Involved <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:scale-125 transition-all" />
            </Link>
          </div>

        </div>
      </section>

      <section className="bg-slate-100 py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wide mb-4">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>Live Streaming
              </div>
              <h2 className="text-3xl font-serif font-bold text-lgu-blue-900 mb-4">Watch Sessions Live</h2>
              <p className="text-slate-600 mb-6">Transparency is key to good governance. Watch our regular sessions live.</p>
              <Link to="/sessions" className="bg-lgu-blue-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-lgu-blue-800 inline-block transform hover:scale-105 transition-all">Go to Live Portal</Link>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xl rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-white"><Video className="w-12 h-12 opacity-50" /></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}