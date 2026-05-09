// pages/admin/tournaments.js
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/firebase';
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  query, where, orderBy, addDoc, serverTimestamp, increment
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminTournaments() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTourny, setSelectedTourny] = useState(null);
  const [modal, setModal] = useState(null); // 'room' | 'results' | 'delete'
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  // For per-kill results
  const [killEntries, setKillEntries] = useState([{ ffUid: '', kills: '' }]);
  // For position results
  const [posEntries, setPosEntries] = useState([{ ffUid: '', position: '1' }]);
  const [players, setPlayers] = useState([]); // joined players for selected tournament
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !userData?.isAdmin)) router.push('/');
  }, [user, userData, loading]);

  useEffect(() => {
    if (!userData?.isAdmin) return;
    fetchTournaments();
  }, [userData]);

  async function fetchTournaments() {
    const snap = await getDocs(query(collection(db, 'tournaments'), orderBy('createdAt', 'desc')));
    setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function openResultsModal(t) {
    setSelectedTourny(t);
    // Fetch joined players
    const q = query(collection(db, 'joinedPlayers'), where('tournamentId', '==', t.id));
    const snap = await getDocs(q);
    setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setKillEntries([{ ffUid: '', kills: '' }]);
    setPosEntries([{ ffUid: '', position: '1' }]);
    setModal('results');
  }

  async function handleRoomUpdate() {
    try {
      await updateDoc(doc(db, 'tournaments', selectedTourny.id), { roomId, roomPassword });
      toast.success('Room details saved!');
      setModal(null);
      fetchTournaments();
    } catch { toast.error('Error saving room'); }
  }

  async function handleDeleteTournament() {
    try {
      await deleteDoc(doc(db, 'tournaments', selectedTourny.id));
      toast.success('Tournament deleted');
      setModal(null);
      fetchTournaments();
    } catch { toast.error('Error deleting'); }
  }

  async function handlePerKillResults() {
    setSubmitting(true);
    try {
      for (const entry of killEntries) {
        if (!entry.ffUid || !entry.kills) continue;
        const kills = parseInt(entry.kills);
        const reward = kills * (selectedTourny.perKillReward || 0);
        if (reward <= 0) continue;

        // Find user by ffUid
        const usersSnap = await getDocs(query(collection(db, 'users'), where('ffUid', '==', entry.ffUid)));
        if (usersSnap.empty) { toast.error(`No user found with UID: ${entry.ffUid}`); continue; }
        const userDoc = usersSnap.docs[0];

        // Find ingame name from joined players
        const jpSnap = await getDocs(query(collection(db, 'joinedPlayers'),
          where('tournamentId', '==', selectedTourny.id),
          where('ffUid', '==', entry.ffUid)));
        const ingameName = jpSnap.empty ? entry.ffUid : jpSnap.docs[0].data().ingameName;

        // Add reward to wallet
        await updateDoc(doc(db, 'users', userDoc.id), { balance: increment(reward) });
        await addDoc(collection(db, 'transactions'), {
          userId: userDoc.id,
          type: 'credit',
          amount: reward,
          description: `${kills} kills × ₹${selectedTourny.perKillReward} = ₹${reward} (${selectedTourny.name})`,
          createdAt: serverTimestamp(),
        });

        // Save to results so players can see
        await addDoc(collection(db, 'results'), {
          tournamentId: selectedTourny.id,
          tournamentName: selectedTourny.name,
          ffUid: entry.ffUid,
          ingameName,
          kills,
          reward,
          createdAt: serverTimestamp(),
        });
      }
      await updateDoc(doc(db, 'tournaments', selectedTourny.id), { status: 'Completed' });
      toast.success('Results added and rewards distributed!');
      setModal(null);
      fetchTournaments();
    } catch (err) { toast.error('Error: ' + err.message); }
    setSubmitting(false);
  }

  async function handlePositionResults() {
    setSubmitting(true);
    try {
      for (const entry of posEntries) {
        if (!entry.ffUid) continue;
        const reward = selectedTourny.positionRewards?.[entry.position] || 0;
        if (reward <= 0) continue;

        const usersSnap = await getDocs(query(collection(db, 'users'), where('ffUid', '==', entry.ffUid)));
        if (usersSnap.empty) { toast.error(`No user found with UID: ${entry.ffUid}`); continue; }
        const userDoc = usersSnap.docs[0];

        // Find ingame name
        const jpSnap = await getDocs(query(collection(db, 'joinedPlayers'),
          where('tournamentId', '==', selectedTourny.id),
          where('ffUid', '==', entry.ffUid)));
        const ingameName = jpSnap.empty ? entry.ffUid : jpSnap.docs[0].data().ingameName;

        await updateDoc(doc(db, 'users', userDoc.id), { balance: increment(reward) });
        await addDoc(collection(db, 'transactions'), {
          userId: userDoc.id,
          type: 'credit',
          amount: reward,
          description: `Position #${entry.position} reward ₹${reward} (${selectedTourny.name})`,
          createdAt: serverTimestamp(),
        });

        // Save to results so players can see
        await addDoc(collection(db, 'results'), {
          tournamentId: selectedTourny.id,
          tournamentName: selectedTourny.name,
          ffUid: entry.ffUid,
          ingameName,
          position: entry.position,
          reward,
          createdAt: serverTimestamp(),
        });
      }
      await updateDoc(doc(db, 'tournaments', selectedTourny.id), { status: 'Completed' });
      toast.success('Results added and rewards distributed!');
      setModal(null);
      fetchTournaments();
    } catch (err) { toast.error('Error: ' + err.message); }
    setSubmitting(false);
  }

  if (!userData?.isAdmin) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-ff-orange text-sm">← Admin</Link>
          <h1 className="section-title">Tournaments</h1>
        </div>
        <Link href="/admin/create-tournament" className="btn-primary">+ Create</Link>
      </div>

      {tournaments.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No tournaments. Create one!</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tournaments.map(t => (
            <div key={t.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-game font-bold text-white">{t.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-game
                    ${t.status === 'Open' ? 'bg-green-900 text-green-400' :
                      t.status === 'Ongoing' ? 'bg-yellow-900 text-yellow-400' :
                      'bg-gray-800 text-gray-400'}`}>{t.status}</span>
                </div>
                <p className="text-gray-500 text-xs">{t.type} · ₹{t.entryFee} entry · {t.joinedCount || 0}/{t.maxPlayers} players</p>
                {t.roomId && <p className="text-green-400 text-xs mt-0.5">Room: {t.roomId}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/admin/edit-tournament/${t.id}`}
                  className="btn-secondary text-xs py-1.5">✏️ Edit</Link>
                <button onClick={() => { setSelectedTourny(t); setRoomId(t.roomId || ''); setRoomPassword(t.roomPassword || ''); setModal('room'); }}
                  className="btn-secondary text-xs py-1.5">🏠 Room</button>
                <button onClick={() => openResultsModal(t)}
                  className="btn-secondary text-xs py-1.5">🏆 Results</button>
                <button onClick={() => { setSelectedTourny(t); setModal('delete'); }}
                  className="btn-danger text-xs py-1.5">🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Modal */}
      {modal === 'room' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-sm">
            <h2 className="font-game font-bold text-xl mb-4">Add Room Details</h2>
            <p className="text-gray-400 text-sm mb-3">{selectedTourny?.name}</p>
            <div className="flex flex-col gap-3 mb-4">
              <input value={roomId} onChange={e => setRoomId(e.target.value)}
                className="input-field" placeholder="Room ID" />
              <input value={roomPassword} onChange={e => setRoomPassword(e.target.value)}
                className="input-field" placeholder="Room Password (optional)" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleRoomUpdate} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {modal === 'results' && selectedTourny && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 overflow-y-auto py-6">
          <div className="card w-full max-w-lg">
            <h2 className="font-game font-bold text-xl mb-1">Add Results</h2>
            <p className="text-gray-400 text-sm mb-4">{selectedTourny.name} · {selectedTourny.rewardType === 'perKill' ? '🎯 Per Kill' : '🏆 Position'}</p>

            {/* Joined Players Reference */}
            {players.length > 0 && (
              <div className="bg-ff-dark rounded p-3 mb-4">
                <p className="text-gray-400 text-xs font-game uppercase mb-2">
                  Joined {selectedTourny?.type !== 'Solo' ? 'Teams' : 'Players'}
                </p>
                <div className="max-h-40 overflow-y-auto flex flex-col gap-2">
                  {players.map(p => (
                    <div key={p.id} className="border-b border-ff-border pb-2 last:border-0">
                      {p.teamName ? (
                        <>
                          <p className="text-ff-orange text-xs font-bold">Team: {p.teamName}</p>
                          {p.members?.map((m, i) => (
                            <p key={i} className="text-gray-300 text-xs">
                              P{i + 1}: {m.ingameName} — <span className="text-ff-yellow">{m.ffUid}</span>
                            </p>
                          ))}
                        </>
                      ) : (
                        <p className="text-gray-300 text-xs">
                          {p.ingameName} — UID: <span className="text-ff-yellow">{p.ffUid}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTourny.rewardType === 'perKill' ? (
              <>
                <p className="text-gray-400 text-xs mb-2">₹{selectedTourny.perKillReward} per kill. Enter each player's UID and kills.</p>
                {killEntries.map((entry, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={entry.ffUid} onChange={e => {
                      const arr = [...killEntries]; arr[i].ffUid = e.target.value; setKillEntries(arr);
                    }} className="input-field flex-1" placeholder="FF UID" />
                    <input type="number" value={entry.kills} onChange={e => {
                      const arr = [...killEntries]; arr[i].kills = e.target.value; setKillEntries(arr);
                    }} className="input-field w-24" placeholder="Kills" />
                    <span className="text-ff-orange font-bold text-sm flex items-center min-w-[50px]">
                      = ₹{(parseInt(entry.kills) || 0) * (selectedTourny.perKillReward || 0)}
                    </span>
                  </div>
                ))}
                <button onClick={() => setKillEntries([...killEntries, { ffUid: '', kills: '' }])}
                  className="text-ff-orange text-xs hover:underline mb-4">+ Add player</button>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handlePerKillResults} disabled={submitting} className="btn-primary flex-1">
                    {submitting ? 'Processing...' : 'Distribute Rewards'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-400 text-xs mb-2">Enter FF UID for each position.</p>
                {posEntries.map((entry, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select value={entry.position} onChange={e => {
                      const arr = [...posEntries]; arr[i].position = e.target.value; setPosEntries(arr);
                    }} className="input-field w-28">
                      <option value="1">🥇 1st — ₹{selectedTourny.positionRewards?.['1'] || 0}</option>
                      <option value="2">🥈 2nd — ₹{selectedTourny.positionRewards?.['2'] || 0}</option>
                      <option value="3">🥉 3rd — ₹{selectedTourny.positionRewards?.['3'] || 0}</option>
                    </select>
                    <input value={entry.ffUid} onChange={e => {
                      const arr = [...posEntries]; arr[i].ffUid = e.target.value; setPosEntries(arr);
                    }} className="input-field flex-1" placeholder="FF UID" />
                  </div>
                ))}
                <button onClick={() => setPosEntries([...posEntries, { ffUid: '', position: '1' }])}
                  className="text-ff-orange text-xs hover:underline mb-4">+ Add position</button>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handlePositionResults} disabled={submitting} className="btn-primary flex-1">
                    {submitting ? 'Processing...' : 'Distribute Rewards'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-sm text-center">
            <p className="text-2xl mb-3">⚠️</p>
            <h2 className="font-game font-bold text-xl mb-2">Delete Tournament?</h2>
            <p className="text-gray-400 text-sm mb-5">"{selectedTourny?.name}" will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeleteTournament} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
