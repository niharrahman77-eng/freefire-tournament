// pages/deposit.js
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
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

  // Load Cashfree SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  async function handlePayment() {
    const amt = parseInt(amount);
    if (!amt || amt < 10) return toast.error('Minimum deposit is ₹10');

    setPaying(true);
    try {
      // Step 1: Create order
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          userId: user.uid,
          username: userData?.username,
          email: userData?.email,
        }),
      });

      const order = await res.json();
      if (!order.sessionId) throw new Error(order.error || 'Failed to create order');

      // Step 2: Open Cashfree payment popup
      const cashfree = window.Cashfree({ mode: 'sandbox' });

      cashfree.checkout({
        paymentSessionId: order.sessionId,
        redirectTarget: '_modal',
      }).then(async (result) => {
        if (result.error) {
          toast.error('Payment failed: ' + result.error.message);
          setPaying(false);
          return;
        }

        if (result.paymentDetails) {
          // Step 3: Verify payment and add coins
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.orderId,
              userId: user.uid,
              amount: amt,
              username: userData?.username,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            await refreshUserData();
            toast.success(`₹${amt} added to your wallet!`);
            router.push('/wallet');
          } else {
            toast.error('Verification failed. Contact support.');
          }
        }
        setPaying(false);
      });

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

      {/* Balance */}
      <div className="card text-center mb-6">
        <p className="text-gray-400 text-xs font-game uppercase mb-1">Current Balance</p>
        <p className="font-game font-bold text-4xl text-ff-yellow">₹{userData?.balance || 0}</p>
      </div>

      {/* Quick Amounts */}
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

      {/* Payment Methods */}
      <div className="card mb-4">
        <h2 className="font-game font-semibold text-sm text-gray-400 uppercase mb-3">Accepted Payments</h2>
        <div className="grid grid-cols-2 gap-2">
          {['📱 UPI (GPay, PhonePe)', '💳 Credit / Debit Card', '🏦 Net Banking', '💰 Wallets'].map(m => (
            <div key={m} className="bg-ff-dark rounded p-2 text-gray-300 text-xs">{m}</div>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3">Powered by Cashfree · 100% Secure</p>
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
