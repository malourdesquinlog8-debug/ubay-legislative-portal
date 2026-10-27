import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('Albert@lgu.gov.ph');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('LOGIN:', email, password);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if ((cleanEmail === 'admin@ubay.gov.ph' || cleanEmail === 'albert@lgu.gov.ph') && cleanPassword === 'admin123') {
      localStorage.setItem('token', 'dummy-token');
      localStorage.setItem('admin_token', 'dummy-token');
      localStorage.setItem('user', JSON.stringify({ email: cleanEmail }));
      window.location.href = '/admin';
    } else {
      setError(`Invalid: ${cleanEmail} / ${cleanPassword}. Use Albert@lgu.gov.ph / admin123`);
    }
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
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" required />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded border">{error}</p>}
          <button type="submit" className="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800">Sign In</button>
          <p className="text-xs text-gray-500 text-center">Use admin@ubay.gov.ph / admin123</p>
        </form>
      </div>
    </div>
  );
}