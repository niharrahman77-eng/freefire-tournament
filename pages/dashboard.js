// pages/dashboard.js
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Dashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [joinedTournaments, setJoinedTournaments] = useState([]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      // Fetch transactions
      const txQ = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const txSnap = await getDocs(txQ);
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch joined tournaments
      const jpQ = query(collection(db, 'joinedPlayers'), where('userId', '==', user.uid));
      const jpSnap = await getDocs(jpQ);
      setJoinedTournaments(jpSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchData();
  }, [user]);

  if (loading) return <div className="text-center py-20 text-gray-500 font-game">Loading...</div>;
  if (!user || !userData) return null;

  return (
    <div>
      <h1 className="section-title mb-6">My Profile</h1>

      {/* Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card md:col-span-2">
          <h2 className="font-game font-semibold text-gray-400 uppercase text-xs mb-3">Account Info</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Username', userData.username],
              ['Email', userData.email],
              ['FF UID', userData.ffUid],
              ['In-Game Name', userData.ingameName],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="text-white font-semibold text-sm mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card flex flex-col items-center justify-center text-center">
          <p className="text-gray-400 font-game text-xs uppercase mb-1">Wallet Balance</p>
          <p className="font-game font-bold text-4xl text-ff-yellow">₹{userData.balance || 0}</p>
          <Link href="/wallet" className="btn-primary mt-3 text-xs">Manage Wallet</Link>
        </div>
      </div>

      {/* Joined Tournaments */}
      <div className="card mb-6">
        <h2 className="font-game font-semibold text-gray-400 uppercase text-xs mb-3">Joined Tournaments ({joinedTournaments.length})</h2>
        {joinedTournaments.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven't joined any tournaments yet. <Link href="/" className="text-ff-orange hover:underline">Browse tournaments</Link></p>
        ) : (
          <div className="flex flex-col gap-2">
            {joinedTournaments.map(jp => (
              <div key={jp.id} className="bg-ff-dark rounded p-3 flex justify-between items-center">
                <div>
                  <p className="text-white font-semibold text-sm">{jp.tournamentName}</p>
                  <p className="text-gray-500 text-xs">IGN: {jp.ingameName} · UID: {jp.ffUid}</p>
                </div>
                <Link href={`/tournament/${jp.tournamentId}`} className="text-ff-orange text-xs hover:underline">View →</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 className="font-game font-semibold text-gray-400 uppercase text-xs mb-3">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex justify-between items-center py-2 border-b border-ff-border last:border-0">
                <div>
                  <p className="text-white text-sm">{tx.description}</p>
                  <p className="text-gray-500 text-xs">{tx.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}</p>
                </div>
                <span className={`font-game font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
