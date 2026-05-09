// pages/dashboard.js
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Dashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [joinedTournaments, setJoinedTournaments] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  const [totalWon, setTotalWon] = useState(0);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      // Fetch transactions
      try {
        const txQ = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const txSnap = await getDocs(txQ);
        const txList = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTransactions(txList);

        // Total won = only tournament reward credits (not deposits)
        const won = txList
          .filter(t =>
            t.type === 'credit' &&
            t.description &&
            !t.description.toLowerCase().includes('razorpay') &&
            !t.description.toLowerCase().includes('cashfree') &&
            !t.description.toLowerCase().includes('added ₹') &&
            !t.description.toLowerCase().includes('admin added')
          )
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        setTotalWon(won);
      } catch {}

      // Fetch joined tournaments with tournament details
      try {
        const jpQ = query(collection(db, 'joinedPlayers'), where('userId', '==', user.uid));
        const jpSnap = await getDocs(jpQ);
        const joined = jpSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const withDetails = await Promise.all(joined.map(async (jp) => {
          try {
            const tSnap = await getDoc(doc(db, 'tournaments', jp.tournamentId));
            if (tSnap.exists()) return { ...jp, tournament: tSnap.data() };
          } catch {}
          return jp;
        }));

        setJoinedTournaments(withDetails);
      } catch {}
    }
    fetchData();
  }, [user]);

  if (loading) return <div className="text-center py-20 text-gray-500 font-game">Loading...</div>;
  if (!user || !userData) return null;

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'matches', label: '🎮 My Matches' },
    { id: 'transactions', label: '💰 Transactions' },
  ];

  return (
    <div>
      <h1 className="section-title mb-6">My Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <p className="font-game font-bold text-2xl text-ff-yellow">₹{userData.balance || 0}</p>
          <p className="text-gray-500 text-xs mt-1">Wallet</p>
        </div>
        <div className="card text-center">
          <p className="font-game font-bold text-2xl text-ff-orange">{joinedTournaments.length}</p>
          <p className="text-gray-500 text-xs mt-1">Matches</p>
        </div>
        <div className="card text-center">
          <p className="font-game font-bold text-2xl text-green-400">₹{totalWon}</p>
          <p className="text-gray-500 text-xs mt-1">Total Won</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-ff-border pb-0">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 font-game text-sm uppercase tracking-wider transition-all border-b-2 -mb-px
              ${activeTab === tab.id
                ? 'border-ff-orange text-ff-orange'
                : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="flex flex-col gap-4">
          {/* Account Info */}
          <div className="card">
            <h2 className="font-game font-semibold text-gray-400 uppercase text-xs mb-4">Account Info</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['👤 Username', userData.username],
                ['📧 Email', userData.email],
                ['🎮 FF UID', userData.ffUid],
                ['🏷️ In-Game Name', userData.ingameName],
              ].map(([label, val]) => (
                <div key={label} className="bg-ff-dark rounded p-3">
                  <p className="text-gray-500 text-xs mb-1">{label}</p>
                  <p className="text-white font-semibold text-sm">{val || '—'}</p>
                </div>
              ))}
            </div>
            <Link href="/edit-profile" className="btn-secondary w-full text-center mt-4 block">
              ✏️ Edit Profile
            </Link>
          </div>

          {/* Wallet Card */}
          <div className="card flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 font-game text-xs uppercase mb-1">Wallet Balance</p>
              <p className="font-game font-bold text-4xl text-ff-yellow">₹{userData.balance || 0}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/deposit" className="btn-primary text-sm">+ Add Money</Link>
              <Link href="/wallet" className="btn-secondary text-sm">Withdraw</Link>
            </div>
          </div>
        </div>
      )}

      {/* MY MATCHES TAB */}
      {activeTab === 'matches' && (
        <div className="flex flex-col gap-3">
          {joinedTournaments.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-3">🎮</p>
              <p className="text-gray-400 font-game text-lg">No matches yet</p>
              <p className="text-gray-500 text-sm mt-1 mb-4">Join a tournament to get started</p>
              <Link href="/" className="btn-primary">Browse Tournaments</Link>
            </div>
          ) : (
            joinedTournaments.map(jp => {
              const t = jp.tournament;
              const status = t?.status || 'Unknown';
              const statusColor = status === 'Open' ? 'text-green-400 bg-green-900/30 border-green-800' :
                status === 'Ongoing' ? 'text-yellow-400 bg-yellow-900/30 border-yellow-800' :
                'text-gray-400 bg-gray-800/30 border-gray-700';

              return (
                <div key={jp.id} className="card hover:border-ff-orange transition-all">
                  {/* Match Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-game font-bold text-white text-lg">{jp.tournamentName}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {t?.type || 'Tournament'} · {t?.date || 'Date TBD'}
                      </p>
                    </div>
                    <span className={`text-xs font-game font-bold px-2 py-1 rounded border ${statusColor}`}>
                      {status}
                    </span>
                  </div>

                  {/* Match Details */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-ff-dark rounded p-2 text-center">
                      <p className="text-ff-orange font-game font-bold">₹{t?.entryFee || 0}</p>
                      <p className="text-gray-500 text-xs">Entry</p>
                    </div>
                    <div className="bg-ff-dark rounded p-2 text-center">
                      <p className="text-ff-yellow font-game font-bold">₹{t?.prizePool || 0}</p>
                      <p className="text-gray-500 text-xs">Prize</p>
                    </div>
                    <div className="bg-ff-dark rounded p-2 text-center">
                      <p className="text-white font-game font-bold">
                        {t?.rewardType === 'perKill' ? `₹${t?.perKillReward}/kill` : 'Position'}
                      </p>
                      <p className="text-gray-500 text-xs">Reward</p>
                    </div>
                  </div>

                  {/* Player Details */}
                  <div className="bg-ff-dark rounded p-3 mb-3">
                    {jp.type === 'Solo' || !jp.type ? (
                      <>
                        <p className="text-gray-500 text-xs mb-1">Your Details</p>
                        <p className="text-white text-sm">IGN: <span className="font-bold text-ff-orange">{jp.ingameName}</span></p>
                        <p className="text-white text-sm">FF UID: <span className="font-bold">{jp.ffUid}</span></p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500 text-xs mb-2">
                          Team: <span className="text-ff-orange font-bold">{jp.teamName}</span>
                        </p>
                        {jp.members?.map((m, i) => (
                          <div key={i} className="flex justify-between items-center py-1 border-b border-ff-border last:border-0">
                            <div>
                              <p className="text-white text-xs font-bold">{m.ingameName} {i === 0 && <span className="text-ff-yellow text-xs">👑</span>}</p>
                              <p className="text-gray-500 text-xs">UID: {m.ffUid}</p>
                            </div>
                            <span className="text-gray-600 text-xs">P{i + 1}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Room Details if available */}
                  {t?.roomId && (
                    <div className="bg-green-900/20 border border-green-800 rounded p-3 mb-3">
                      <p className="text-green-400 font-game font-bold text-xs mb-1">🏠 ROOM DETAILS</p>
                      <p className="text-white text-sm">Room ID: <span className="font-bold text-ff-yellow">{t.roomId}</span></p>
                      {t?.roomPassword && (
                        <p className="text-white text-sm mt-0.5">Password: <span className="font-bold text-ff-yellow">{t.roomPassword}</span></p>
                      )}
                    </div>
                  )}

                  {/* No room yet */}
                  {!t?.roomId && status !== 'Completed' && (
                    <div className="bg-gray-800/40 border border-gray-700 rounded p-2 mb-3 text-center">
                      <p className="text-gray-500 text-xs">⏳ Room details will appear here before the match</p>
                    </div>
                  )}

                  {/* View Button */}
                  <Link href={`/tournament/${jp.tournamentId}`}
                    className="btn-secondary w-full text-center text-sm block">
                    View Tournament →
                  </Link>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <div className="card">
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">💳</p>
              <p className="text-gray-400 font-game">No transactions yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center py-3 border-b border-ff-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                      ${tx.type === 'credit' ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                      {tx.type === 'credit' ? '↓' : '↑'}
                    </div>
                    <div>
                      <p className="text-white text-sm">{tx.description}</p>
                      <p className="text-gray-500 text-xs">
                        {tx.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                      </p>
                    </div>
                  </div>
                  <span className={`font-game font-bold text-lg
                    ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
