import { supabase } from '../../lib/supabase';
import { useState, useEffect, useCallback } from 'react';

export default function AdminDashboard() {
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || 'dummy';
  
  const [stats, setStats] = useState<any>({
    legislations: 0,
    sessions: 0,
    totalLegislation: 0,
    totalSessions: 0,
    pendingComments: 0,
    unreadMessages: 0,
    views: 0,
    totalPageViews: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const fetchStats = useCallback(async () => {
    try {
     // const res = await fetch('http://localhost:3001/api/legislations');
     // const legislations = await res.json();
     // Use Supabase instead
  const { data: legislations } = await supabase.from('legislations').select('*', { count: 'exact' })
  const { data: members } = await supabase.from('sb_members').select('*', { count: 'exact' }) 

      setStats({
        legislations: legislations.length,
        sessions: 0,
        totalLegislation: legislations.length,
        totalSessions: 0,
        pendingComments: 0,
        unreadMessages: 0,
        views: 0, // ZERO SA KARON - pag online na kay real views na!
        totalPageViews: 0, // ZERO SA KARON
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [token]);

  const fetchRecentLogs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRecentLogs(data.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
      fetchRecentLogs();
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchStats, fetchRecentLogs]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Legislation</h3>
          <p className="text-3xl font-bold">{stats.legislations}</p>
          <p className="text-xs text-gray-400">Active records</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Sessions</h3>
          <p className="text-3xl font-bold">{stats.sessions}</p>
          <p className="text-xs text-gray-400">Active sessions</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Pending Comments</h3>
          <p className="text-3xl font-bold">{stats.pendingComments}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Page Views</h3>
          <p className="text-3xl font-bold">{stats.views}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold mb-2">Recent Logs</h3>
        {recentLogs.length === 0 ? (
          <p className="text-gray-400 text-sm">No logs yet</p>
        ) : (
          recentLogs.map((log: any, i: number) => (
            <div key={i} className="text-sm border-b py-2">{log.action || log.message}</div>
          ))
        )}
      </div>
    </div>
  );
}