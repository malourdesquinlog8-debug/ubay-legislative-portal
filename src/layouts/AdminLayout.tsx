import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Newspaper,
  Users,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarName, setSidebarName] = useState('');
  const [sidebarRole, setSidebarRole] = useState('');
  // FIX: Pop-up para sa Sign Out
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadSidebarUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data } = await supabase.from('users').select('full_name, role').eq('id', authUser.id).single();
      if (data?.full_name) {
        setSidebarName(data.full_name);
        setSidebarRole(data.role || '');
      } else {
        setSidebarName(authUser.user_metadata?.full_name || user?.name || user?.full_name || authUser.email?.split('@')[0] || 'Admin');
        setSidebarRole(user?.role || '');
      }
    };
    loadSidebarUser();
  }, [location.pathname, user]);

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Legislative Management', path: '/admin/legislations', icon: FileText },
    { name: 'SB Members', path: '/admin/members', icon: Users },
    { name: 'News & Events', path: '/admin/news', icon: Newspaper },
    { name: 'Contact Messages', path: '/admin/messages', icon: MessageSquare },
    { name: 'Public Comments', path: '/admin/comments', icon: MessageSquare },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Activity Logs', path: '/admin/logs', icon: History },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const displayName = sidebarName || user?.name || user?.full_name || user?.email || 'Admin';
  const displayRole = sidebarRole || user?.role || 'Admin';

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <div className="h-screen bg-slate-100 flex font-sans overflow-hidden">
      {/* Sidebar - STEADY NA, DILI NA MOUBAN UG SCROLL */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-lgu-blue-900 text-white transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:shrink-0 md:sticky md:top-0 md:h-screen md:flex md:flex-col md:overflow-hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 shrink-0 flex items-center px-6 bg-lgu-blue-800 font-serif font-bold text-xl tracking-wider">
          <span className="text-lgu-gold-500 mr-2">SB</span> ADMIN
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center mb-8 px-2">
            <div className="w-10 h-10 rounded-full bg-lgu-gold-500 flex items-center justify-center text-lgu-blue-900 font-bold text-lg">
              {(displayName || '?').charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-slate-400 capitalize">{displayRole}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                  location.pathname === item.path
                    ? "bg-lgu-gold-500 text-lgu-blue-900"
                    : "text-slate-300 hover:bg-lgu-blue-800 hover:text-white"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="shrink-0 w-full p-4 bg-lgu-blue-800">
          {/* FIX: Dili na diretso logout - mo-abli sa pop-up */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content - KINI RA ANG MO-SCROLL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        <div className="md:hidden bg-white shadow-sm h-16 shrink-0 flex items-center justify-between px-4">
          <span className="font-serif font-bold text-lgu-blue-900">SB Admin Panel</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500">
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* SIGN OUT CONFIRM POP-UP */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Do you want to sign out?</h2>
              <p className="text-sm text-slate-500 mt-1">
                You will need to log in again to access the SB Admin panel.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}