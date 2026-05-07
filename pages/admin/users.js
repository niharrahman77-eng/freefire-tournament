// pages/admin/users.js
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [coinAmount, setCoinAmount] = useState('');
  const [coinAction, setCoinAction] = useState('add'); // 'add' or 'remove'
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !userData?.isAdmin)) router.push('/');
  }, [user, userData, loading]);

  useEffect(() => {
    if (!userData?.isAdmin) return;
    fetchUsers();
  }, [userData]);

  async function fetchUsers() {
    const snap = await getDocs(collection(db, 'users'));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function handleCoinUpdate() {
    if (!coinAmount || parseInt(coinAmount) <= 0) return toast.error('Enter valid amount');
    setSubmitting(true);
    try {
      const amount = parseInt(coinAmount);
      const change = coinAction === 'add' ? amount : -amount;
      await updateDoc(doc(db, 'users', selectedUser.id), { balance: increment(change) });
      await addDoc(collection(db, 'transactions'), {
        userId: selectedUser.id,
        type: coinAction === 'add' ? 'credit' : 'debit',
        amount,
        description: `Admin ${coinAction === 'add' ? 'added' : 'removed'} ₹${amount} coins`,
        createdAt: serverTimestamp(),
      });
      toast.success(`₹${amount} ${coinAction === 'add' ? 'added to' : 'removed from'} ${selectedUser.username}'s wallet`);
      setCoinAmount('');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) { toast.error('Error: ' + err.message); }
    setSubmitting(false);
  }

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.ffUid?.includes(search)
  );

  if (!userData?.isAdmin) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-ff-orange text-sm">← Admin</Link>
        <h1 className="section-title">Users ({users.length})</h1>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        className="input-field mb-4" placeholder="Search by username, email or FF UID..." />

      <div className="flex flex-col gap-2">
        {filtered.map(u => (
          <div key={u.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-game font-bold text-white">{u.username}</span>
                {u.isAdmin && <span className="bg-yellow-900 text-yellow-400 text-xs px-1.5 py-0.5 rounded font-game">ADMIN</span>}
              </div>
              <p className="text-gray-500 text-xs">{u.email} · FF UID: {u.ffUid}</p>
              <p className="text-gray-500 text-xs">IGN: {u.ingameName} · Joined: {u.joinedTournaments?.length || 0} tournaments</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-ff-yellow font-game font-bold text-lg">₹{u.balance || 0}</span>
              <button onClick={() => setSelectedUser(u)} className="btn-secondary text-xs py-1.5">
                Manage Coins
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coin Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-sm">
            <h2 className="font-game font-bold text-xl mb-1">Manage Coins</h2>
            <p className="text-gray-400 text-sm mb-1">{selectedUser.username}</p>
            <p className="text-ff-yellow font-bold mb-4">Current Balance: ₹{selectedUser.balance || 0}</p>

            <div className="flex gap-2 mb-3">
              {['add', 'remove'].map(a => (
                <button key={a} onClick={() => setCoinAction(a)}
                  className={`flex-1 py-2 rounded font-game text-sm uppercase transition-all
                    ${coinAction === a ? (a === 'add' ? 'bg-green-700 text-white' : 'bg-red-700 text-white') : 'bg-ff-dark text-gray-400'}`}>
                  {a === 'add' ? '+ Add' : '− Remove'}
                </button>
              ))}
            </div>

            <input type="number" value={coinAmount} onChange={e => setCoinAmount(e.target.value)}
              className="input-field mb-4" placeholder="Amount in ₹" />

            <div className="flex gap-3">
              <button onClick={() => { setSelectedUser(null); setCoinAmount(''); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCoinUpdate} disabled={submitting}
                className={`flex-1 font-game font-bold px-6 py-2.5 rounded uppercase text-sm transition-all
                  ${coinAction === 'add' ? 'bg-green-700 hover:bg-green-600' : 'bg-red-700 hover:bg-red-600'} text-white`}>
                {submitting ? 'Updating...' : `${coinAction === 'add' ? 'Add' : 'Remove'} ₹${coinAmount || 0}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
