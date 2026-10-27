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
    <div className="min-h-screen flex flex-col font-sans">
      <div className="bg-lgu-blue-900 text-white py-2 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> (038) 417-5000</span>
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
                  <Link
                    key={item.name}
                    to={item.path}
                    className={clsx(
                      "relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-out transform hover:scale-110 hover:-translate-y-0.5",
                      isActive
                        ? "bg-lgu-blue-900 text-white shadow-lg scale-105 font-bold"
                        : "text-slate-600 hover:bg-lgu-blue-900/50 hover:text-white hover:shadow-md"
                    )}
                  >
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
                  <Link
                    key={item.name}
                    to={item.path}
                    className={clsx(
                      "block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                      isActive ? "bg-lgu-blue-900 text-white font-bold shadow" : "text-slate-700 hover:bg-lgu-blue-900/50 hover:text-lgu-blue-900"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow bg-slate-50">{children}</main>
      <AIChatbot />
      <footer className="bg-lgu-blue-900 text-white pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif text-xl font-bold mb-4 text-lgu-gold-500">Sangguniang Bayan</h3>
            <p className="text-slate-300 text-sm">The legislative body of UBAY, committed to transparency.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/ordinances" className="hover:text-white">Ordinances</Link></li>
              <li><Link to="/sessions" className="hover:text-white">Live Sessions</Link></li>
              <li><Link to="/members" className="hover:text-white">Council Members</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase text-sm">Stay Connected</h4>
            <div className="flex">
              <input type="email" placeholder="Enter email" className="px-3 py-2 rounded-l-md text-slate-900 w-full" />
              <button className="bg-lgu-gold-500 text-lgu-blue-900 font-bold px-4 py-2 rounded-r-md">Join</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-lgu-blue-800 text-center text-xs text-slate-400">
          <p>&copy; 2024 Sangguniang Bayan of UBAY. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}