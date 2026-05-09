// pages/deposit.js
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const UPI_ID = "9394643766@fam";
const UPI_NAME = "Nihar";
const WHATSAPP_NUMBER = "919394643766";
const AMOUNTS = [50, 100, 200, 500, 1000];

export default function Deposit() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  function copyUPI() {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 3000);
  }

  function openWhatsApp() {
    if (!amount || parseInt(amount) < 10) {
      return toast.error('Please select an amount first');
    }
    const message = `Hello Nihar! I have paid ₹${amount} to ${UPI_ID} for FF Arena wallet recharge.\n\nMy Details:\nUsername: ${userData?.username}\nFF UID: ${userData?.ffUid}\nAmount: ₹${amount}\n\n[Please attach your payment screenshot]`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${amount || ''}&cu=INR`)}`;

  if (loading) return <div className="text-center py-20 text-gray-500 font-game">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="section-title mb-2">Add Money</h1>
      <p className="text-gray-500 text-sm mb-6">Follow the steps below to add coins to your wallet</p>

      {/* Current Balance */}
      <div className="card text-center mb-6">
        <p className="text-gray-400 text-xs font-game uppercase mb-1">Current Balance</p>
        <p className="font-game font-bold text-4xl text-ff-yellow">₹{userData?.balance || 0}</p>
      </div>

      {/* STEP 1 - Choose Amount */}
      <div className={`card mb-4 border-2 ${step === 1 ? 'border-ff-orange' : 'border-ff-border'}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-game font-bold text-sm
            ${step >= 1 ? 'bg-ff-orange text-white' : 'bg-ff-border text-gray-400'}`}>1</span>
          <h2 className="font-game font-bold text-lg">Choose Amount</h2>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {AMOUNTS.map(a => (
            <button key={a} onClick={() => { setAmount(String(a)); setStep(2); }}
              className={`py-3 rounded font-game font-bold text-lg transition-all border
                ${amount === String(a)
                  ? 'bg-ff-orange border-ff-orange text-white'
                  : 'bg-ff-dark border-ff-border text-gray-300 hover:border-ff-orange'}`}>
              ₹{a}
            </button>
          ))}
        </div>

        <div>
          <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Custom Amount</label>
          <input
            type="number"
            value={amount}
            onChange={e => { setAmount(e.target.value); if (e.target.value >= 10) setStep(2); }}
            className="input-field"
            placeholder="Enter amount (min ₹10)"
            min="10"
          />
        </div>
      </div>

      {/* STEP 2 - Pay via UPI */}
      <div className={`card mb-4 border-2 ${step === 2 ? 'border-ff-orange' : 'border-ff-border'}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-game font-bold text-sm
            ${step >= 2 ? 'bg-ff-orange text-white' : 'bg-ff-border text-gray-400'}`}>2</span>
          <h2 className="font-game font-bold text-lg">Pay via UPI</h2>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-4">
          <div className="bg-white p-3 rounded-lg mb-2">
            <img
              src={qrUrl}
              alt="UPI QR Code"
              width={220}
              height={220}
            />
          </div>
          <p className="text-gray-400 text-xs">Scan with any UPI app</p>
          <p className="text-gray-500 text-xs mt-1">GPay · PhonePe · Paytm · BHIM</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-ff-border"></div>
          <span className="text-gray-500 text-xs">OR PAY USING UPI ID</span>
          <div className="flex-1 border-t border-ff-border"></div>
        </div>

        {/* UPI ID */}
        <div className="bg-ff-dark rounded-lg p-4 flex items-center justify-between mb-2">
          <div>
            <p className="text-gray-500 text-xs mb-1">UPI ID</p>
            <p className="text-white font-bold text-lg">{UPI_ID}</p>
          </div>
          <button onClick={copyUPI}
            className={`px-4 py-2 rounded font-game text-sm uppercase transition-all
              ${copied ? 'bg-green-700 text-white' : 'bg-ff-orange text-white hover:bg-orange-500'}`}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {amount && (
          <div className="bg-green-900/20 border border-green-800 rounded p-3 text-center">
            <p className="text-gray-400 text-xs">Amount to Pay</p>
            <p className="text-green-400 font-game font-bold text-2xl">₹{amount}</p>
          </div>
        )}
      </div>

      {/* STEP 3 - Send Screenshot */}
      <div className={`card mb-4 border-2 ${step === 3 ? 'border-ff-orange' : 'border-ff-border'}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-game font-bold text-sm
            ${step >= 3 ? 'bg-ff-orange text-white' : 'bg-ff-border text-gray-400'}`}>3</span>
          <h2 className="font-game font-bold text-lg">Send Screenshot</h2>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          After paying, take a screenshot of the payment and send it to us on WhatsApp. 
          We will add coins to your wallet within <span className="text-ff-orange font-bold">30 minutes</span>.
        </p>

        <button onClick={() => { setStep(3); openWhatsApp(); }}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-game font-bold py-3 rounded uppercase tracking-wider transition-all flex items-center justify-center gap-2">
          <span className="text-xl">💬</span>
          Send Screenshot on WhatsApp
        </button>

        <p className="text-gray-500 text-xs text-center mt-2">
          Opens WhatsApp with your details pre-filled
        </p>
      </div>

      {/* STEP 4 - Wait */}
      <div className="card border-2 border-ff-border">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-8 h-8 rounded-full bg-ff-border flex items-center justify-center font-game font-bold text-sm text-gray-400">4</span>
          <h2 className="font-game font-bold text-lg">Get Your Coins</h2>
        </div>
        <p className="text-gray-400 text-sm">
          After we verify your payment, coins will be added to your wallet automatically. 
          You will be able to see them in your <span className="text-ff-orange">wallet page</span>.
        </p>
        <div className="bg-ff-dark rounded p-3 mt-3">
          <p className="text-gray-500 text-xs">⏱ Processing time: Within 30 minutes</p>
          <p className="text-gray-500 text-xs mt-1">🕐 Working hours: 9 AM – 11 PM</p>
          <p className="text-gray-500 text-xs mt-1">💬 Support: WhatsApp {WHATSAPP_NUMBER}</p>
        </div>
      </div>

      {/* Important Notes */}
      <div className="card mt-4 border border-yellow-800 bg-yellow-900/10">
        <h3 className="font-game font-bold text-yellow-400 mb-3">⚠️ Important Notes</h3>
        <ul className="flex flex-col gap-2">
          {[
            'Always send the payment screenshot on WhatsApp',
            'Do not close WhatsApp after sending screenshot',
            'Minimum deposit amount is ₹10',
            'Coins are added within 30 minutes of verification',
            'For issues contact us on WhatsApp',
          ].map((note, i) => (
            <li key={i} className="text-gray-400 text-xs flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">•</span>
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
