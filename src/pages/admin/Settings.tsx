import { useState, useEffect } from 'react';
import { User, Lock, Globe, Save, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');
      const { data } = await supabase.from('users').select('full_name').eq('id', user.id).single();
      setFullName(data?.full_name || user.user_metadata?.full_name || '');
    };
    load();
  }, []);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) return alert('Full Name is required');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Not logged in');

      const { error } = await supabase.from('users').update({ full_name: fullName }).eq('id', user.id);
      if (error) throw error;

      await supabase.auth.updateUser({ data: { full_name: fullName } });

      // FIX 2: I-sync pud ang localStorage kay mao ni ang gi-basa sa Sidebar!
      // Ang Sidebar kay dili mo-basa sa Supabase, mo-basa siya aning mga key:
      localStorage.setItem('saved_profile', JSON.stringify({ name: fullName, full_name: fullName, email }));
      try {
        const oldUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...oldUser, name: fullName, full_name: fullName, email }));
      } catch {}
      try {
        const oldAuth = JSON.parse(localStorage.getItem('auth_user') || '{}');
        localStorage.setItem('auth_user', JSON.stringify({ ...oldAuth, name: fullName, full_name: fullName, email }));
      } catch {}

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveSecurity = async () => {
    if (!currentPass || !newPass || !confirmPass) return alert('Fill all');
    if (newPass !== confirmPass) return alert('No match - bag-o nga password dili parehas');
    if (newPass.length < 6) return alert('Password dapat 6+ ka letra');
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: currentPass });
      if (loginError) return alert('Current Password incorrect!');
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      alert('Password changed in Supabase Auth!');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage account - Synced with Supabase</p>
        <div className="flex gap-8 mt-8">
          <div className="w-56 space-y-2">
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${activeTab === 'profile' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'}`}><User className="w-4 h-4" /> Profile Info</button>
            <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${activeTab === 'security' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'}`}><Lock className="w-4 h-4" /> Security</button>
            <button onClick={() => setActiveTab('config')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${activeTab === 'config' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'}`}><Globe className="w-4 h-4" /> System Config</button>
          </div>
          <div className="flex-1 bg-white rounded-xl border p-8">
            {activeTab === 'profile' && (
              <div><h2 className="font-bold flex gap-2 mb-6"><User className="w-5 h-5" /> Personal Information</h2><div className="space-y-4 max-w-md"><div><label className="text- font-bold uppercase text-slate-500">Full Name</label><input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm" /></div><div><label className="text- font-bold uppercase text-slate-500">Email</label><input value={email} disabled className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm bg-slate-100 text-slate-500" /></div><button onClick={handleSaveProfile} className="flex gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm">{saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saved ? 'Saved!' : 'Save Changes'}</button></div></div>
            )}
            {activeTab === 'security' && (
              <div><h2 className="font-bold flex gap-2 mb-6"><Lock className="w-5 h-5" /> Security</h2><div className="space-y-4 max-w-md"><input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="Current Password" className="w-full px-3 py-2.5 border rounded-lg text-sm" /><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New Password" className="w-full px-3 py-2.5 border rounded-lg text-sm" /><input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirm" className="w-full px-3 py-2.5 border rounded-lg text-sm" /><button onClick={handleSaveSecurity} className="flex gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm"><Save className="w-4 h-4" /> Update Password</button></div></div>
            )}
            {activeTab === 'config' && (
              <div className="text-sm text-slate-600"><p>Portal: Ubay Legislative</p><p>DB: Supabase users table - synced across devices</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}