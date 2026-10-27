import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validEmails = ['Albert@lgu.gov.ph', 'admin@ubay.gov.ph', 'albert@lgu.gov.ph'];
    const validPass = 'admin123';

    if (validEmails.includes(email) && password === validPass) {
      // SET TANAN NGA POSSIBLE NGA GI-CHECK SA AUTH
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('adminUser', email);
      localStorage.setItem('user', JSON.stringify({ email, name: 'Albert', role: 'admin' }));
      localStorage.setItem('sb_user', JSON.stringify({ email, name: 'Albert' }));
      localStorage.setItem('auth', 'true');
      
      // FORCE REDIRECT - DILI navigate, window.location jud!
      setTimeout(() => {
        window.location.replace('/admin');
      }, 100);
    } else {
      setError('Invalid email or password. Use Albert@lgu.gov.ph / admin123');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0' }}>
        <div style={{ background: '#0f172a', height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/sblogo.jpg" alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
          </div>
          <p style={{ color: '#eab308', fontSize: '14px', marginTop: '16px', fontWeight: 500 }}>Sangguniang Bayan of Ubay</p>
        </div>

        <div style={{ padding: '32px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: '6px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email" style={{ width: '100%', paddingLeft: '40px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" style={{ width: '100%', paddingLeft: '40px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} required />
              </div>
            </div>

            {error && <p style={{ fontSize: '12px', color: '#dc2626', background: '#fef2f2', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>{error}</p>}

            <button type="submit" style={{ width: '100%', background: '#0f172a', color: 'white', padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
              Sign In
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}><a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Forgot password?</a></p>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '8px' }}>
              <p style={{ fontSize: '11px', textAlign: 'center', color: '#94a3b8' }}>Authorized personnel only. All activities are logged.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}