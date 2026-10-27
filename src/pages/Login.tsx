import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('Albert@lgu.gov.ph');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // DIRECT SA BACKEND 3001 - DILI NA PROXY!
      // For now, simple check - or use Supabase later
if (email === 'admin@ubay.gov.ph' && password === 'admin123') {
  // success login
  navigate('/admin')
} else {
  alert('Invalid credentials')
}

      const data = await res.json();
      console.log('Login response:', data);

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/admin';
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Cannot connect to server. Make sure backend is running on port 3001');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 text-center p-8">
          <img src="/sblogo.jpg" alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-full" />
          <p className="text-yellow-400 text-sm">Sangguniang Bayan of UBAY</p>
        </div>
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 text-sm text-red-700 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4 cursor-pointer">Forgot password?</p>
          <p className="text-center text-xs text-gray-400 mt-8 border-t pt-4">Authorized personnel only. All activities are logged.</p>
        </div>
      </div>
    </div>
  );
}