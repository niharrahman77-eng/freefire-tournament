// pages/wallet.js
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function Wallet() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    async function fetchWithdrawals() {
      const q = query(collection(db, 'withdrawals'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchWithdrawals();
  }, [user]);

  async function handleWithdrawal(e) {
    e.preventDefault();
    const amt = parseInt(amount);
    if (!upiId) return toast.error('Enter your UPI ID');
    if (!amt || amt < 50) return toast.error('Minimum withdrawal is ₹50');
    if (amt > (userData?.balance || 0)) return toast.error('Not enough balance');

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        username: userData.username,
        upiId,
        amount: amt,
        status: 'Pending',
        createdAt: serverTimestamp(),
      });
      toast.success('Withdrawal request submitted! Admin will process it soon.');
      setUpiId('');
      setAmount('');
      // Re-fetch withdrawals
      const q = query(collection(db, 'withdrawals'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
    setSubmitting(false);
  }

  if (loading) return <div className="text-center py-20 text-gray-500 font-game">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="section-title mb-6">My Wallet</h1>

      {/* Balance Card */}
      <div className="card text-center mb-6 bg-gradient-to-br from-ff-card to-ff-dark">
        <p className="text-gray-400 font-game text-xs uppercase mb-1">Available Balance</p>
        <p className="font-game font-bold text-5xl text-ff-yellow">₹{userData?.balance || 0}</p>
        <p className="text-gray-500 text-xs mt-2">1 coin = ₹1 · Contact admin to add coins</p>
      </div>

      {/* Withdrawal Form */}
      <div className="card mb-6">
        <h2 className="font-game font-bold text-lg mb-4">Request Withdrawal</h2>
        <form onSubmit={handleWithdrawal} className="flex flex-col gap-3">
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">UPI ID</label>
            <input value={upiId} onChange={e => setUpiId(e.target.value)}
              className="input-field" placeholder="yourname@upi" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">
              Amount (Min ₹50, Max ₹{userData?.balance || 0})
            </label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="input-field" placeholder="Enter amount" min="50" />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting...' : 'Request Withdrawal'}
          </button>
        </form>
        <p className="text-gray-500 text-xs mt-3">⚠️ Withdrawals are processed within 24-48 hours by admin</p>
      </div>

      {/* Withdrawal History */}
      <div className="card">
        <h2 className="font-game font-bold text-lg mb-4">Withdrawal History</h2>
        {withdrawals.length === 0 ? (
          <p className="text-gray-500 text-sm">No withdrawal requests yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {withdrawals.map(w => (
              <div key={w.id} className="bg-ff-dark rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-semibold">₹{w.amount}</p>
                    <p className="text-gray-500 text-xs">{w.upiId}</p>
                  </div>
                  <span className={`text-xs font-game font-bold px-2 py-1 rounded
                    ${w.status === 'Approved' ? 'bg-green-900 text-green-400' :
                      w.status === 'Rejected' ? 'bg-red-900 text-red-400' :
                      'bg-yellow-900 text-yellow-400'}`}>
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
