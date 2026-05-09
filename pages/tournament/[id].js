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

  // Solo fields
  const [ffUid, setFfUid] = useState('');
  const [ingameName, setIngameName] = useState('');

  // Duo / Squad fields
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([
    { ffUid: '', ingameName: '' },
    { ffUid: '', ingameName: '' },
  ]);

  useEffect(() => {
    if (!id) return;
    async function fetchTournament() {
      const snap = await getDoc(doc(db, 'tournaments', id));
      if (snap.exists()) setTournament({ id: snap.id, ...snap.data() });
      setLoading(false);
    }
    fetchTournament();
  }, [id]);

  useEffect(() => {
    if (userData && id) {
      setHasJoined(userData.joinedTournaments?.includes(id));
      setFfUid(userData.ffUid || '');
      setIngameName(userData.ingameName || '');
      // Prefill first member for duo/squad
      setMembers(prev => {
        const arr = [...prev];
        arr[0] = { ffUid: userData.ffUid || '', ingameName: userData.ingameName || '' };
        return arr;
      });
    }
  }, [userData, id]);

  // Set correct number of members when tournament loads
  useEffect(() => {
    if (!tournament) return;
    if (tournament.type === 'Duo') {
      setMembers([
        { ffUid: userData?.ffUid || '', ingameName: userData?.ingameName || '' },
        { ffUid: '', ingameName: '' },
      ]);
    } else if (tournament.type === 'Squad') {
      setMembers([
        { ffUid: userData?.ffUid || '', ingameName: userData?.ingameName || '' },
        { ffUid: '', ingameName: '' },
        { ffUid: '', ingameName: '' },
        { ffUid: '', ingameName: '' },
      ]);
    }
  }, [tournament]);

  function updateMember(index, field, value) {
    setMembers(prev => {
      const arr = [...prev];
      arr[index] = { ...arr[index], [field]: value };
      return arr;
    });
  }

  async function handleJoin() {
    if (!user) return router.push('/login');

    const balance = userData?.balance || 0;
    const fee = tournament.entryFee;

    if (balance < fee) {
      return toast.error(`Not enough balance! You need ₹${fee}. Add money to wallet first.`);
    }

    // Validate fields
    if (tournament.type === 'Solo') {
      if (!ffUid || !ingameName) return toast.error('Enter your FF UID and In-Game Name');
    } else {
      if (!teamName) return toast.error('Enter your Team Name');
      for (let i = 0; i < members.length; i++) {
        if (!members[i].ffUid || !members[i].ingameName) {
          return toast.error(`Enter FF UID and In-Game Name for Player ${i + 1}`);
        }
      }
    }

    setJoining(true);
    try {
      const tRef = doc(db, 'tournaments', id);
      const uRef = doc(db, 'users', user.uid);

      if (tournament.type === 'Solo') {
        // Solo — save single player
        await addDoc(collection(db, 'joinedPlayers'), {
          tournamentId: id,
          tournamentName: tournament.name,
          type: 'Solo',
          userId: user.uid,
          username: userData.username,
          ffUid,
          ingameName,
          joinedAt: serverTimestamp(),
        });
      } else {
        // Duo / Squad — save whole team
        await addDoc(collection(db, 'joinedPlayers'), {
          tournamentId: id,
          tournamentName: tournament.name,
          type: tournament.type,
          userId: user.uid,
          username: userData.username,
          teamName,
          members,
          // Also store captain details for easy search
          ffUid: members[0].ffUid,
          ingameName: members[0].ingameName,
          joinedAt: serverTimestamp(),
        });
      }

      // Deduct entry fee (for whole team)
      await updateDoc(uRef, {
        balance: increment(-fee),
        joinedTournaments: arrayUnion(id),
      });

      // Increment team/player count
      await updateDoc(tRef, { joinedCount: increment(1) });

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'debit',
        amount: fee,
        description: `Entry fee for ${tournament.name} (${tournament.type}${tournament.type !== 'Solo' ? ` — Team: ${teamName}` : ''})`,
        createdAt: serverTimestamp(),
      });

      await refreshUserData();
      setHasJoined(true);
      setShowJoinModal(false);
      toast.success('Joined! Good luck! 🔥');
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
  const isSolo = tournament.type === 'Solo';
  const teamSize = tournament.type === 'Duo' ? 2 : 4;

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
          <span className={typeClass}>{tournament.type}</span>
        </div>

        {/* Entry fee note for team */}
        {!isSolo && (
          <div className="bg-blue-900/20 border border-blue-700 rounded p-3 mb-4 text-sm text-blue-300">
            💡 Entry fee of <span className="font-bold text-white">₹{tournament.entryFee}</span> is per <span className="font-bold">{tournament.type}</span> — one payment for the whole team
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: `Entry Fee${!isSolo ? ' (Team)' : ''}`, value: `₹${tournament.entryFee}`, color: 'text-ff-orange' },
            { label: 'Prize Pool', value: `₹${tournament.prizePool}`, color: 'text-ff-yellow' },
            { label: isSolo ? 'Max Players' : 'Max Teams', value: tournament.maxPlayers, color: 'text-white' },
            { label: isSolo ? 'Spots Left' : 'Teams Left', value: spotsLeft, color: spotsLeft < 5 ? 'text-red-400' : 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-ff-dark rounded p-3 text-center">
              <p className={`font-game font-bold text-xl ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Team size info */}
        {!isSolo && (
          <div className="bg-ff-dark rounded p-3 mb-4 flex items-center gap-3">
            <span className="text-2xl">{tournament.type === 'Duo' ? '👥' : '👨‍👩‍👧‍👦'}</span>
            <div>
              <p className="text-white font-game font-bold">{tournament.type} — {teamSize} Players per Team</p>
              <p className="text-gray-500 text-xs">All {teamSize} player details required to join</p>
            </div>
          </div>
        )}

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

        {/* Room Info */}
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
          <Link href={`/tournament/results/${id}`} className="btn-primary w-full text-center block mb-3">
            🏆 View Results
          </Link>
        )}
        {tournament.status === 'Open' && !hasJoined && user && (
          <button onClick={() => setShowJoinModal(true)} className="btn-primary w-full">
            Join {tournament.type} — ₹{tournament.entryFee} Entry
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

      {/* ===== JOIN MODAL ===== */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 overflow-y-auto py-6">
          <div className="card w-full max-w-md">
            <h2 className="font-game font-bold text-xl mb-1">
              {isSolo ? 'Join Tournament' : `Register ${tournament.type} Team`}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Entry fee: <span className="text-ff-orange font-bold">₹{tournament.entryFee}</span>
              {!isSolo && <span className="text-gray-500"> for whole team</span>}
              {' '}· Your balance: <span className="text-white font-bold">₹{userData?.balance || 0}</span>
            </p>

            {/* SOLO FORM */}
            {isSolo && (
              <div className="flex flex-col gap-3 mb-4">
                <div>
                  <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Free Fire UID</label>
                  <input value={ffUid} onChange={e => setFfUid(e.target.value)}
                    className="input-field" placeholder="Your FF Player UID" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-game uppercase mb-1 block">In-Game Name</label>
                  <input value={ingameName} onChange={e => setIngameName(e.target.value)}
                    className="input-field" placeholder="Your character name in FF" />
                </div>
              </div>
            )}

            {/* DUO / SQUAD FORM */}
            {!isSolo && (
              <div className="flex flex-col gap-4 mb-4">
                {/* Team Name */}
                <div>
                  <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Team Name</label>
                  <input value={teamName} onChange={e => setTeamName(e.target.value)}
                    className="input-field" placeholder="Your team name" />
                </div>

                {/* Members */}
                {members.map((member, i) => (
                  <div key={i} className="bg-ff-dark rounded-lg p-3 border border-ff-border">
                    <p className="text-ff-orange font-game text-xs uppercase font-bold mb-2">
                      {i === 0 ? '👑 Player 1 (Captain — You)' : `🎮 Player ${i + 1}`}
                    </p>
                    <div className="flex flex-col gap-2">
                      <input
                        value={member.ffUid}
                        onChange={e => updateMember(i, 'ffUid', e.target.value)}
                        className="input-field text-sm"
                        placeholder={`Player ${i + 1} FF UID`}
                        disabled={i === 0}
                      />
                      <input
                        value={member.ingameName}
                        onChange={e => updateMember(i, 'ingameName', e.target.value)}
                        className="input-field text-sm"
                        placeholder={`Player ${i + 1} In-Game Name`}
                        disabled={i === 0}
                      />
                    </div>
                    {i === 0 && (
                      <p className="text-gray-600 text-xs mt-1">Auto-filled from your profile</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowJoinModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleJoin} disabled={joining} className="btn-primary flex-1">
                {joining ? 'Joining...' : `Pay ₹${tournament.entryFee} & Join`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
