import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Facebook, Youtube, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import AIChatbot from '../components/AIChatbot';
import { useSettings } from '../context/SettingsContext';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { settings } = useSettings();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Legislation', path: '/ordinances' },
    { name: 'News & Events', path: '/news' },
    { name: 'Sessions & Live', path: '/sessions' },
    { name: 'SB Members', path: '/members' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col font-sans"
      style={{
        backgroundImage: `linear-gradient(rgba(235, 235, 180, 0.88), rgba(235, 235, 180, 0.88)), url('/SESSION.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="bg-lgu-blue-900 text-white py-2 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /></span>
            <span className="flex items-center"><Mail className="w-3 h-3 mr-1" /> sanggunianbayanubay@gmail.com</span>
          </div>
          <div className="flex items-center space-x-3">
            <a href="https://web.facebook.com/profile.php?id=100090571482008" target="_blank" rel="noopener noreferrer" className="hover:text-lgu-gold-500"><Facebook className="w-4 h-4" /></a>
            <a href="https://www.youtube.com/@13thSangguniangBayanUBAYBoh" target="_blank" className="hover:text-lgu-gold-500"><Youtube className="w-4 h-4" /></a>
            <Link to="/login" className="text-xs bg-lgu-blue-800 px-3 py-1 rounded-full hover:bg-lgu-gold-500 hover:text-lgu-blue-900">Admin Login</Link>
          </div>
        </div>
      </div>

      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center">
              <img src={settings.logo_url} alt="SB Logo" className="w-16 h-16 rounded-full mr-4 shadow-sm object-cover" />
              <div>
                <h1 className="text-2xl font-serif font-bold text-lgu-blue-900 leading-tight">Sangguniang Bayan</h1>
                <p className="text-sm text-slate-500 uppercase tracking-widest">Municipality of UBAY</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.name} to={item.path}
                    className={clsx("relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-out transform hover:scale-110 hover:-translate-y-0.5", isActive ? "bg-lgu-blue-900 text-white shadow-lg scale-105 font-bold" : "text-slate-600 hover:bg-lgu-blue-900/50 hover:text-white hover:shadow-md")}>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-lgu-blue-900">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.name} to={item.path} className={clsx("block px-4 py-3 rounded-xl text-base font-medium", isActive ? "bg-lgu-blue-900 text-white font-bold shadow" : "text-slate-700 hover:bg-lgu-blue-900/50 hover:text-lgu-blue-900")} onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow bg-transparent">{children}</main>
      <AIChatbot />
      
      <footer className="bg-[#0f172a] text-white mt-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex items-start gap-4 md:gap-6">
            <img src="/republika.png" alt="Republika" className="w-14 h-14 md:w-20 md:h-20 object-contain flex-shrink-0 mt-1" />
            <div className="text-left">
              <h2 className="font-bold text-left text- tracking-[0.2em] uppercase mb-6 block" style={{ color: '#ffffff' }}>
                Government Links
              </h2>
              <div className="grid grid-cols-2 gap-8 text- md:text-xs text-gray-300 max-w-2xl text-left">
                <div>
                  <ul className="space-y-2.5">
                    <li><a href="https://www.president.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Office of the President</a></li>
                    <li><a href="https://www.ovp.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Office of the Vice President</a></li>
                    <li><a href="https://www.senate.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Senate of the Philippines</a></li>
                    <li><a href="https://www.congress.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">House of Representatives</a></li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-2.5">
                    <li><a href="https://www.officialgazette.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Official Gazette</a></li>
                    <li><a href="https://www.dilg.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">DILG</a></li>
                    <li><a href="https://bohol.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Bohol Provincial Government</a></li>
                    <li><a href="https://www.ubay.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Municipality of Ubay</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3 text-center text- text-gray-400">
            © 2026 Sangguniang Bayan of Ubay. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}