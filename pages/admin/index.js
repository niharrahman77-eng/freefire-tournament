// pages/admin/index.js
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, tournaments: 0, pendingWithdrawals: 0 });

  useEffect(() => {
    if (!loading && (!user || !userData?.isAdmin)) {
      router.push('/');
    }
  }, [user, userData, loading]);

  useEffect(() => {
    if (!userData?.isAdmin) return;
    async function fetchStats() {
      const [usersSnap, tournySnap, wdSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'tournaments')),
        getDocs(collection(db, 'withdrawals')),
      ]);
      const pendingWd = wdSnap.docs.filter(d => d.data().status === 'Pending').length;
      setStats({ users: usersSnap.size, tournaments: tournySnap.size, pendingWithdrawals: pendingWd });
    }
    fetchStats();
  }, [userData]);

  if (loading) return <div className="text-center py-20 text-gray-500 font-game">Loading...</div>;
  if (!userData?.isAdmin) return null;

  const adminLinks = [
    { href: '/admin/create-tournament', icon: '🏆', label: 'Create Tournament', desc: 'Add new tournament' },
    { href: '/admin/tournaments', icon: '📋', label: 'Manage Tournaments', desc: 'Edit, add room ID, results' },
    { href: '/admin/users', icon: '👥', label: 'Manage Users', desc: 'View and add coins to users' },
    { href: '/admin/withdrawals', icon: '💸', label: 'Withdrawals', desc: 'Approve or reject requests', badge: stats.pendingWithdrawals },
    { href: '/admin/banners', icon: '🖼️', label: 'Manage Banners', desc: 'Add banners to homepage' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-ff-yellow text-2xl">⚡</span>
        <h1 className="section-title">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats.users, color: 'text-blue-400' },
          { label: 'Tournaments', value: stats.tournaments, color: 'text-ff-orange' },
          { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, color: 'text-ff-yellow' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`font-game font-bold text-3xl ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Admin Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminLinks.map(link => (
          <Link key={link.href} href={link.href}
            className="card hover:border-ff-orange transition-all flex items-center gap-4">
            <span className="text-3xl">{link.icon}</span>
            <div className="flex-1">
              <p className="font-game font-bold text-white flex items-center gap-2">
                {link.label}
                {link.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{link.badge}</span>
                )}
              </p>
              <p className="text-gray-500 text-xs">{link.desc}</p>
            </div>
            <span className="text-gray-600">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
