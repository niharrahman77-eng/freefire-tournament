// pages/admin/withdrawals.js
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/firebase';
import {
  collection, getDocs, doc, updateDoc, orderBy, query,
  addDoc, serverTimestamp, increment
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminWithdrawals() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState([]);
  const [filter, setFilter] = useState('Pending');

  useEffect(() => {
    if (!loading && (!user || !userData?.isAdmin)) router.push('/');
  }, [user, userData, loading]);

  useEffect(() => {
    if (!userData?.isAdmin) return;
    fetchWithdrawals();
  }, [userData]);

  async function fetchWithdrawals() {
    const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function handleAction(withdrawal, action) {
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), { status: action });

      if (action === 'Approved') {
        // Deduct balance from user
        await updateDoc(doc(db, 'users', withdrawal.userId), {
          balance: increment(-withdrawal.amount)
        });
        await addDoc(collection(db, 'transactions'), {
          userId: withdrawal.userId,
          type: 'debit',
          amount: withdrawal.amount,
          description: `Withdrawal approved — ₹${withdrawal.amount} to ${withdrawal.upiId}`,
          createdAt: serverTimestamp(),
        });
        toast.success(`Approved ₹${withdrawal.amount} withdrawal for ${withdrawal.username}`);
      } else {
        toast.success(`Rejected withdrawal request`);
      }
      fetchWithdrawals();
    } catch (err) { toast.error('Error: ' + err.message); }
  }

  const filtered = filter === 'All' ? withdrawals : withdrawals.filter(w => w.status === filter);

  if (!userData?.isAdmin) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-ff-orange text-sm">← Admin</Link>
        <h1 className="section-title">Withdrawals</h1>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded font-game text-xs uppercase transition-all
              ${filter === f ? 'bg-ff-orange text-white' : 'bg-ff-card border border-ff-border text-gray-400'}`}>
            {f}
            {f === 'Pending' && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded-full">
                {withdrawals.filter(w => w.status === 'Pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No {filter.toLowerCase()} withdrawals</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(w => (
            <div key={w.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-game font-bold text-white text-lg">₹{w.amount}</span>
                  <span className={`text-xs font-game px-2 py-0.5 rounded
                    ${w.status === 'Approved' ? 'bg-green-900 text-green-400' :
                      w.status === 'Rejected' ? 'bg-red-900 text-red-400' :
                      'bg-yellow-900 text-yellow-400'}`}>{w.status}</span>
                </div>
                <p className="text-gray-400 text-sm">{w.username}</p>
                <p className="text-gray-500 text-xs">UPI: {w.upiId}</p>
                <p className="text-gray-600 text-xs">{w.createdAt?.toDate?.()?.toLocaleString() || 'Recent'}</p>
              </div>

              {w.status === 'Pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleAction(w, 'Rejected')}
                    className="btn-danger text-xs py-1.5">✕ Reject</button>
                  <button onClick={() => handleAction(w, 'Approved')}
                    className="bg-green-700 hover:bg-green-600 text-white font-game font-bold px-4 py-1.5 rounded text-xs uppercase">
                    ✓ Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
