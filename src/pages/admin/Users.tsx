import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Shield, Mail, Key } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        full_name: user.full_name,
        email: user.email,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'admin'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // EDIT: Name ug Role lang - EMAIL DILI NA MA-EDIT PARA MAG-SYNC SA AUTH
        const { error } = await supabase
          .from('users')
          .update({
            full_name: formData.full_name,
            role: formData.role
          })
          .eq('id', editingUser.id);
        if (error) throw error;

        // FIX: Kung IKAW mismo ang gi-edit, i-sync pud ang Auth + localStorage (Sidebar)
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && currentUser.id === editingUser.id) {
          await supabase.auth.updateUser({ data: { full_name: formData.full_name } });
          localStorage.setItem('saved_profile', JSON.stringify({ name: formData.full_name, full_name: formData.full_name, email: editingUser.email }));
          try {
            const old = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...old, name: formData.full_name, full_name: formData.full_name, email: editingUser.email }));
          } catch {}
          try {
            const oldAuth = JSON.parse(localStorage.getItem('auth_user') || '{}');
            localStorage.setItem('auth_user', JSON.stringify({ ...oldAuth, name: formData.full_name, full_name: formData.full_name, email: editingUser.email }));
          } catch {}
        }

        alert('User updated! Na-sync na sa Users table.');
      } else {
        // CREATE: Auth una, unya ang trigger na ang mo-sync sa users table
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: { data: { full_name: formData.full_name } }
        });
        if (authError) throw authError;

        // Kung wala pa na-trigger, manual insert as backup
        if (authData.user) {
          const { error: insertError } = await supabase
            .from('users')
            .upsert([{
              id: authData.user.id,
              full_name: formData.full_name,
              email: formData.email.trim(),
              role: formData.role
            }], { onConflict: 'id' });
          if (insertError) console.warn('Upsert users (trigger may have handled):', insertError.message);
        }
        alert('Admin created! Naka-sync na sa Supabase Auth ug Users table.');
      }
      setShowModal(false);
      await fetchUsers();

      // FIX: Kung ikaw mismo ang gi-edit, reload para ang Sidebar mo-sunod dayon
      const { data: { user: me } } = await supabase.auth.getUser();
      if (editingUser && me && me.id === editingUser.id) {
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (err: any) {
      console.error('Failed to save user:', err);
      alert(err.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Delete ${email}?\n\nPahimangno: I-delete pud siya sa Supabase > Authentication > Users para hingpit nga mawala.`)) return;
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage administrative access to the LGU Legislative Portal. Synced with Supabase Auth.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-lgu-blue-900 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-lgu-blue-800 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Admin User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-lgu-blue-50 flex items-center justify-center text-lgu-blue-900 font-bold mr-3">
                        {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{user.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Shield className="w-3 h-3 mr-1" /> {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="text-lgu-blue-900 hover:text-lgu-gold-600 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.email)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingUser ? 'Edit User' : 'Add New Admin'}
              </h2>
              {editingUser && <p className="text-xs text-slate-500 mt-1">Email cannot be changed - it is synced with Supabase Auth. To change email, delete and create a new user.</p>}
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-lgu-blue-900"
                  placeholder="Juan Dela Cruz"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address {editingUser ? '(Locked)' : ''}</label>
                <input
                  type="email"
                  disabled={!!editingUser}
                  className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-lgu-blue-900 ${editingUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                  placeholder="juan@lgu.gov.ph"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-lgu-blue-900"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-lgu-blue-900"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-lgu-blue-900 text-white rounded-lg font-bold hover:bg-lgu-blue-800 transition-colors"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}