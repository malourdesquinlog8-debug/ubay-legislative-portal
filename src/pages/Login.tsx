import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // BAG-O: Gamit na ug Supabase Auth, dili na table password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Invalid email or password');

      // Kuhaa ang profile sa users table para sa name ug role
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // Kung walay profile sa table, gamit ang Auth data lang
      const finalUser: any = {
        id: authData.user.id,
        name: profile?.full_name || authData.user.email?.split('@')[0] || 'Admin',
        full_name: profile?.full_name || authData.user.email?.split('@')[0] || 'Admin',
        email: authData.user.email || email,
        role: profile?.role || 'admin'
      };

      const token = 'ubay-admin-token-' + Date.now();
      login(token, finalUser);
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('saved_profile', JSON.stringify({ name: finalUser.name, email: finalUser.email }));
      navigate('/admin');
      setTimeout(() => window.location.href = '/admin', 100);
    } catch (err: any) {
      // FALLBACK PARA KANG ALBERT - daan nga dummy login
      const validEmails = ['Albert@lgu.gov.ph', 'admin@ubay.gov.ph', 'albert@lgu.gov.ph'];
      const savedPass = localStorage.getItem('saved_password') || 'admin123';
      if (validEmails.includes(email) && (password === savedPass || password === 'admin123')) {
        const finalUser: any = {
          id: '1',
          name: 'Albert',
          full_name: 'Albert',
          email: email,
          role: 'admin'
        };
        const token = 'ubay-admin-token-' + Date.now();
        login(token, finalUser);
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin');
        return;
      }
      setError('Invalid email or password');
    } finally {
      setLoading(false);
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
            <button type="submit" disabled={loading} style={{ width: '100%', background: '#0f172a', color: 'white', padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}