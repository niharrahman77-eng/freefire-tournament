// pages/admin/edit-tournament/[id].js
import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditTournament() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    name: '', type: 'Solo', entryFee: '', prizePool: '',
    maxPlayers: '', date: '', description: '', status: 'Open',
    rewardType: 'perKill', perKillReward: '',
    pos1: '', pos2: '', pos3: '',
  });

  useEffect(() => {
    if (!loading && (!user || !userData?.isAdmin)) router.push('/');
  }, [user, userData, loading]);

  useEffect(() => {
    if (!id) return;
    async function fetchTournament() {
      const snap = await getDoc(doc(db, 'tournaments', id));
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          name: data.name || '',
          type: data.type || 'Solo',
          entryFee: data.entryFee || '',
          prizePool: data.prizePool || '',
          maxPlayers: data.maxPlayers || '',
          date: data.date || '',
          description: data.description || '',
          status: data.status || 'Open',
          rewardType: data.rewardType || 'perKill',
          perKillReward: data.perKillReward || '',
          pos1: data.positionRewards?.['1'] || '',
          pos2: data.positionRewards?.['2'] || '',
          pos3: data.positionRewards?.['3'] || '',
        });
      }
      setFetching(false);
    }
    fetchTournament();
  }, [id]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.entryFee || !form.prizePool || !form.maxPlayers) {
      return toast.error('Fill all required fields');
    }
    setSubmitting(true);
    try {
      const data = {
        name: form.name,
        type: form.type,
        entryFee: parseInt(form.entryFee),
        prizePool: parseInt(form.prizePool),
        maxPlayers: parseInt(form.maxPlayers),
        date: form.date,
        description: form.description,
        status: form.status,
        rewardType: form.rewardType,
        updatedAt: serverTimestamp(),
      };

      if (form.rewardType === 'perKill') {
        data.perKillReward = parseInt(form.perKillReward) || 0;
      } else {
        data.positionRewards = {
          '1': parseInt(form.pos1) || 0,
          '2': parseInt(form.pos2) || 0,
          '3': parseInt(form.pos3) || 0,
        };
      }

      await updateDoc(doc(db, 'tournaments', id), data);
      toast.success('Tournament updated!');
      router.push('/admin/tournaments');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
    setSubmitting(false);
  }

  if (loading || fetching) return <div className="text-center py-20 text-gray-500 font-game">Loading...</div>;
  if (!userData?.isAdmin) return null;

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/admin/tournaments" className="text-gray-500 hover:text-ff-orange text-sm mb-4 inline-block">
        ← Back to Tournaments
      </Link>
      <h1 className="section-title mb-6">Edit Tournament</h1>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4">

        {/* Status — shown first so admin can quickly change it */}
        <div className="bg-ff-dark rounded-lg p-4 border-2 border-ff-orange">
          <label className="text-ff-orange text-xs font-game uppercase mb-2 block font-bold">
            ⚡ Tournament Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Open', 'Ongoing', 'Completed'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, status: s }))}
                className={`py-2.5 rounded-lg border-2 font-game text-sm uppercase font-bold transition-all
                  ${form.status === s
                    ? s === 'Open' ? 'bg-green-700 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                      : s === 'Ongoing' ? 'bg-yellow-700 border-yellow-400 text-white shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                      : 'bg-gray-700 border-gray-400 text-white'
                    : 'bg-ff-card border-ff-border text-gray-400 hover:border-gray-400'}`}>
                {s === 'Open' ? '🟢 ' : s === 'Ongoing' ? '🟡 ' : '⚫ '}{s}
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Current: <span className={`font-bold ${form.status === 'Open' ? 'text-green-400' : form.status === 'Ongoing' ? 'text-yellow-400' : 'text-gray-400'}`}>{form.status}</span>
          </p>
        </div>

        {/* Basic Info */}
        <div>
          <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Tournament Name *</label>
          <input name="name" value={form.name} onChange={handleChange}
            className="input-field" placeholder="e.g. Weekend Clash #1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="input-field">
              <option>Solo</option>
              <option>Duo</option>
              <option>Squad</option>
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Date & Time</label>
            <input name="date" type="datetime-local" value={form.date} onChange={handleChange}
              className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Entry Fee (₹) *</label>
            <input name="entryFee" type="number" value={form.entryFee} onChange={handleChange}
              className="input-field" placeholder="20" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Prize Pool (₹) *</label>
            <input name="prizePool" type="number" value={form.prizePool} onChange={handleChange}
              className="input-field" placeholder="500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Max Players *</label>
            <input name="maxPlayers" type="number" value={form.maxPlayers} onChange={handleChange}
              className="input-field" placeholder="50" />
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            className="input-field resize-none" rows={3}
            placeholder="Tournament rules and info..." />
        </div>

        {/* Reward Type */}
        <div>
          <label className="text-gray-400 text-xs font-game uppercase mb-2 block">Reward System</label>
          <div className="flex gap-3">
            {['perKill', 'position'].map(rt => (
              <label key={rt}
                className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded border-2 transition-all flex-1 justify-center
                  ${form.rewardType === rt
                    ? 'border-ff-orange text-ff-orange bg-orange-900/20'
                    : 'border-ff-border text-gray-400 hover:border-gray-400'}`}>
                <input type="radio" name="rewardType" value={rt}
                  checked={form.rewardType === rt} onChange={handleChange} className="hidden" />
                {rt === 'perKill' ? '🎯 Per Kill' : '🏆 Position'}
              </label>
            ))}
          </div>
        </div>

        {form.rewardType === 'perKill' && (
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">₹ Per Kill</label>
            <input name="perKillReward" type="number" value={form.perKillReward}
              onChange={handleChange} className="input-field" placeholder="10" />
          </div>
        )}

        {form.rewardType === 'position' && (
          <div className="grid grid-cols-3 gap-3">
            {[['pos1', '🥇 1st'], ['pos2', '🥈 2nd'], ['pos3', '🥉 3rd']].map(([name, label]) => (
              <div key={name}>
                <label className="text-gray-400 text-xs font-game uppercase mb-1 block">{label}</label>
                <input name={name} type="number" value={form[name]}
                  onChange={handleChange} className="input-field" placeholder="₹" />
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <Link href="/admin/tournaments" className="btn-secondary flex-1 text-center">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
