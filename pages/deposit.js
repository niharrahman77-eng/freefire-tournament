// pages/deposit.js
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const AMOUNTS = [50, 100, 200, 500, 1000];

export default function Deposit() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  async function handlePayment() {
    const amt = parseInt(amount);
    if (!amt || amt < 10) return toast.error('Minimum deposit is ₹10');

    setPaying(true);
    try {
      // Step 1: Create order from our API
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });
      const order = await res.json();
      if (!order.id) throw new Error('Failed to create order');

      // Step 2: Open Razorpay payment popup
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'FF Arena',
        description: `Add ₹${amt} to wallet`,
        order_id: order.id,
        prefill: {
          name: userData?.username || '',
          email: userData?.email || '',
        },
        theme: { color: '#FF6B00' },
        handler: async function (response) {
          // Step 3: Verify payment on our server
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.uid,
              amount: amt,
              username: userData?.username,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            await refreshUserData();
            toast.success(`₹${amt} added to your wallet!`);
            router.push('/wallet');
          } else {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Error: ' + err.message);
      setPaying(false);
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500 font-game">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="section-title mb-6">Add Money</h1>

      {/* Current Balance */}
      <div className="card text-center mb-6">
        <p className="text-gray-400 text-xs font-game uppercase mb-1">Current Balance</p>
        <p className="font-game font-bold text-4xl text-ff-yellow">₹{userData?.balance || 0}</p>
      </div>

      {/* Quick Amount Buttons */}
      <div className="card mb-4">
        <h2 className="font-game font-bold text-lg mb-4">Choose Amount</h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {AMOUNTS.map(a => (
            <button key={a} onClick={() => setAmount(String(a))}
              className={`py-3 rounded font-game font-bold text-lg transition-all border
                ${amount === String(a)
                  ? 'bg-ff-orange border-ff-orange text-white'
                  : 'bg-ff-dark border-ff-border text-gray-300 hover:border-ff-orange'}`}>
              ₹{a}
            </button>
          ))}
        </div>

        <div>
          <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Or Enter Custom Amount</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="input-field"
            placeholder="Enter amount (min ₹10)"
            min="10"
          />
        </div>
      </div>

      {/* Payment Methods Info */}
      <div className="card mb-4">
        <h2 className="font-game font-semibold text-sm text-gray-400 uppercase mb-3">Accepted Payments</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {['📱 UPI (GPay, PhonePe, Paytm)', '💳 Credit / Debit Card', '🏦 Net Banking', '💰 Wallets'].map(m => (
            <div key={m} className="bg-ff-dark rounded p-2 text-gray-300 text-xs">{m}</div>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3">Powered by Razorpay · 100% Secure</p>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={paying || !amount || parseInt(amount) < 10}
        className="btn-primary w-full text-lg py-3">
        {paying ? 'Opening Payment...' : `Pay ₹${amount || '0'} Securely`}
      </button>

      <p className="text-gray-600 text-xs text-center mt-3">
        Money is added to your wallet instantly after payment
      </p>
    </div>
  );
}
