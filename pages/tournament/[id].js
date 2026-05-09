// pages/tournament/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import {
  doc, getDoc, updateDoc, addDoc, collection,
  serverTimestamp, increment, arrayUnion
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function TournamentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, userData, refreshUserData } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [ffUid, setFfUid] = useState('');
  const [ingameName, setIngameName] = useState('');

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      const snap = await getDoc(doc(db, 'tournaments', id));
      if (snap.exists()) {
        setTournament({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }
    fetch();
  }, [id]);

  useEffect(() => {
    if (userData && id) {
      setHasJoined(userData.joinedTournaments?.includes(id));
      setFfUid(userData.ffUid || '');
      setIngameName(userData.ingameName || '');
    }
  }, [userData, id]);

  async function handleJoin() {
    if (!user) return router.push('/login');
    if (!ffUid || !ingameName) return toast.error('Enter your FF UID and in-game name');
    if ((userData?.balance || 0) < tournament.entryFee) {
      return toast.error(`Not enough balance! You need ₹${tournament.entryFee}. Go to wallet to add coins.`);
    }

    setJoining(true);
    try {
      const tRef = doc(db, 'tournaments', id);
      const uRef = doc(db, 'users', user.uid);

      // Add player to joinedPlayers collection
      await addDoc(collection(db, 'joinedPlayers'), {
        tournamentId: id,
        tournamentName: tournament.name,
        userId: user.uid,
        username: userData.username,
        ffUid,
        ingameName,
        joinedAt: serverTimestamp(),
      });

      // Deduct entry fee from user wallet
      await updateDoc(uRef, {
        balance: increment(-tournament.entryFee),
        joinedTournaments: arrayUnion(id),
      });

      // Increment joined count on tournament
      await updateDoc(tRef, { joinedCount: increment(1) });

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'debit',
        amount: tournament.entryFee,
        description: `Entry fee for ${tournament.name}`,
        createdAt: serverTimestamp(),
      });

      await refreshUserData();
      setHasJoined(true);
      setShowJoinModal(false);
      toast.success('Joined! Good luck!');
      setTournament(prev => ({ ...prev, joinedCount: (prev.joinedCount || 0) + 1 }));
    } catch (err) {
      toast.error('Failed to join: ' + err.message);
    }
    setJoining(false);
  }

  if (loading) return <div className="text-center py-20 text-gray-500 font-game">Loading...</div>;
  if (!tournament) return <div className="text-center py-20 text-gray-400 font-game">Tournament not found</div>;

  const spotsLeft = tournament.maxPlayers - (tournament.joinedCount || 0);
  const typeClass = tournament.type === 'Solo' ? 'badge-solo' : tournament.type === 'Duo' ? 'badge-duo' : 'badge-squad';

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-ff-orange text-sm mb-4 inline-block">← Back</Link>

      <div className="card mb-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="font-game font-bold text-2xl text-white">{tournament.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{tournament.date || 'Date TBD'}</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className={typeClass}>{tournament.type}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Entry Fee', value: `₹${tournament.entryFee}`, color: 'text-ff-orange' },
            { label: 'Prize Pool', value: `₹${tournament.prizePool}`, color: 'text-ff-yellow' },
            { label: 'Max Players', value: tournament.maxPlayers, color: 'text-white' },
            { label: 'Spots Left', value: spotsLeft, color: spotsLeft < 5 ? 'text-red-400' : 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-ff-dark rounded p-3 text-center">
              <p className={`font-game font-bold text-xl ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Rewards */}
        <div className="bg-ff-dark rounded p-4 mb-4">
          <h3 className="font-game font-semibold text-sm text-gray-400 uppercase mb-2">Reward System</h3>
          {tournament.rewardType === 'perKill' ? (
            <p className="text-white">🎯 <span className="text-ff-orange font-bold">₹{tournament.perKillReward}</span> per kill</p>
          ) : (
            <div className="flex flex-col gap-1">
              <p>🥇 1st Place: <span className="text-ff-yellow font-bold">₹{tournament.positionRewards?.['1'] || 0}</span></p>
              <p>🥈 2nd Place: <span className="text-gray-300 font-bold">₹{tournament.positionRewards?.['2'] || 0}</span></p>
              <p>🥉 3rd Place: <span className="text-orange-400 font-bold">₹{tournament.positionRewards?.['3'] || 0}</span></p>
            </div>
          )}
        </div>

        {/* Room Info (shown after joining) */}
        {hasJoined && tournament.roomId && (
          <div className="bg-green-900/30 border border-green-700 rounded p-4 mb-4">
            <h3 className="font-game font-semibold text-green-400 mb-2">🏠 Room Details</h3>
            <p className="text-white">Room ID: <span className="font-bold text-ff-yellow">{tournament.roomId}</span></p>
            {tournament.roomPassword && (
              <p className="text-white mt-1">Password: <span className="font-bold text-ff-yellow">{tournament.roomPassword}</span></p>
            )}
          </div>
        )}

        {/* Description */}
        {tournament.description && (
          <div className="text-gray-400 text-sm mb-4 leading-relaxed">{tournament.description}</div>
        )}

        {/* CTA */}
        {tournament.status === 'Completed' && (
          <Link href={`/tournament/results/${id}`}
            className="btn-primary w-full text-center block mb-3">
            🏆 View Results
          </Link>
        )}
        {tournament.status === 'Open' && !hasJoined && (
          <button onClick={() => setShowJoinModal(true)} className="btn-primary w-full">
            Join Tournament — ₹{tournament.entryFee} Entry
          </button>
        )}
        {hasJoined && (
          <div className="bg-green-900/20 border border-green-700 rounded p-3 text-center">
            <p className="text-green-400 font-game font-semibold">✅ You have joined this tournament!</p>
            {!tournament.roomId && <p className="text-gray-500 text-xs mt-1">Room details will appear here when admin adds them</p>}
          </div>
        )}
        {!user && (
          <Link href="/login" className="btn-primary w-full block text-center">Login to Join</Link>
        )}
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-sm">
            <h2 className="font-game font-bold text-xl mb-4">Confirm Join</h2>
            <p className="text-gray-400 text-sm mb-4">
              Entry fee of <span className="text-ff-orange font-bold">₹{tournament.entryFee}</span> will be deducted.
              Your balance: <span className="text-white font-bold">₹{userData?.balance || 0}</span>
            </p>
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Free Fire UID</label>
                <input value={ffUid} onChange={e => setFfUid(e.target.value)}
                  className="input-field" placeholder="Your FF Player UID" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-game uppercase mb-1 block">In-Game Name</label>
                <input value={ingameName} onChange={e => setIngameName(e.target.value)}
                  className="input-field" placeholder="Your character name" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowJoinModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleJoin} disabled={joining} className="btn-primary flex-1">
                {joining ? 'Joining...' : 'Confirm Join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
