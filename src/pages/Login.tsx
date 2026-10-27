import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('Albert@lgu.gov.ph');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // NO localhost:3001! Direct check only!
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if ((cleanEmail === 'admin@ubay.gov.ph' || cleanEmail === 'albert@lgu.gov.ph') && cleanPassword === 'admin123') {
      localStorage.setItem('admin_token', 'dummy-token');
      localStorage.setItem('user', JSON.stringify({ email: cleanEmail, role: 'admin' }));
      navigate('/admin');
    } else {
      setError('Invalid credentials. Use admin@ubay.gov.ph / admin123 or Albert@lgu.gov.ph / admin123');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="text-sm font-semibold">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="admin123" required />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800">
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
          <p className="text-xs text-gray-500 text-center">Use admin@ubay.gov.ph / admin123</p>
        </form>
      </div>
    </div>
  );
}