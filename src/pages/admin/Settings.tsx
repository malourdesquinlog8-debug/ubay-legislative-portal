import { useState } from 'react';
import { User, Lock, Globe, Save, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Settings() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [fullName, setFullName] = useState(user?.name || 'Albert');
  const [email, setEmail] = useState(user?.email || 'Albert@lgu.gov.ph');
  const [saved, setSaved] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !email.trim()) return alert('Required');
    try {
      const { error } = await supabase.from('users').update({ full_name: fullName, name: fullName, email: email }).eq('email', user?.email || 'Albert@lgu.gov.ph');
      if (error) throw error;
      const updatedUser = { id: user?.id || '1', name: fullName, full_name: fullName, email, role: 'admin' };
      const token = localStorage.getItem('token') || 'ubay-admin-token';
      login(token, updatedUser);
      localStorage.setItem('saved_profile', JSON.stringify({ name: fullName, email }));
      setSaved(true);
      setTimeout(()=>setSaved(false), 3000);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveSecurity = async () => {
    if (!currentPass || !newPass || !confirmPass) return alert('Fill all');
    if (newPass !== confirmPass) return alert('No match');
    try {
      const { data } = await supabase.from('users').select('*').eq('email', user?.email).eq('password', currentPass).single();
      if (!data) {
        const savedPass = localStorage.getItem('saved_password') || 'admin123';
        if (currentPass !== savedPass) return alert('Current incorrect');
      }
      const { error } = await supabase.from('users').update({ password: newPass }).eq('email', user?.email || 'Albert@lgu.gov.ph');
      if (error) throw error;
      localStorage.setItem('saved_password', newPass);
      alert('Password changed in Supabase!');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      setSaved(true); setTimeout(()=>setSaved(false), 3000);
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
            <button onClick={()=>setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${activeTab==='profile'?'bg-slate-900 text-white':'text-slate-600 hover:bg-white'}`}><User className="w-4 h-4" /> Profile Info</button>
            <button onClick={()=>setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${activeTab==='security'?'bg-slate-900 text-white':'text-slate-600 hover:bg-white'}`}><Lock className="w-4 h-4" /> Security</button>
            <button onClick={()=>setActiveTab('config')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${activeTab==='config'?'bg-slate-900 text-white':'text-slate-600 hover:bg-white'}`}><Globe className="w-4 h-4" /> System Config</button>
          </div>
          <div className="flex-1 bg-white rounded-xl border p-8">
            {activeTab === 'profile' && (
              <div><h2 className="font-bold flex gap-2 mb-6"><User className="w-5 h-5" /> Personal Information</h2><div className="space-y-4 max-w-md"><div><label className="text- font-bold uppercase text-slate-500">Full Name</label><input value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm" /></div><div><label className="text- font-bold uppercase text-slate-500">Email</label><input value={email} onChange={e=>setEmail(e.target.value)} className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm" /></div><button onClick={handleSaveProfile} className="flex gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm">{saved?<Check className="w-4 h-4"/>:<Save className="w-4 h-4"/>} {saved?'Saved!':'Save Changes'}</button></div></div>
            )}
            {activeTab === 'security' && (
              <div><h2 className="font-bold flex gap-2 mb-6"><Lock className="w-5 h-5" /> Security</h2><div className="space-y-4 max-w-md"><input type="password" value={currentPass} onChange={e=>setCurrentPass(e.target.value)} placeholder="Current Password" className="w-full px-3 py-2.5 border rounded-lg text-sm" /><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="New Password" className="w-full px-3 py-2.5 border rounded-lg text-sm" /><input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Confirm" className="w-full px-3 py-2.5 border rounded-lg text-sm" /><button onClick={handleSaveSecurity} className="flex gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm"><Save className="w-4 h-4" /> Update Password</button></div></div>
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