// pages/admin/create-tournament.js
import { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function CreateTournament() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '', type: 'Solo', entryFee: '', prizePool: '',
    maxPlayers: '', date: '', description: '', status: 'Open',
    rewardType: 'perKill', perKillReward: '',
    pos1: '', pos2: '', pos3: '',
  });

  useEffect(() => {
    if (!loading && (!user || !userData?.isAdmin)) router.push('/');
  }, [user, userData, loading]);

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
        joinedCount: 0,
        createdAt: serverTimestamp(),
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

      await addDoc(collection(db, 'tournaments'), data);
      toast.success('Tournament created!');
      router.push('/admin/tournaments');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
    setSubmitting(false);
  }

  if (!userData?.isAdmin) return null;

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/admin" className="text-gray-500 hover:text-ff-orange text-sm mb-4 inline-block">← Admin Panel</Link>
      <h1 className="section-title mb-6">Create Tournament</h1>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
        {/* Basic Info */}
        <div>
          <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Tournament Name *</label>
          <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="e.g. Weekend Clash #1" />
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
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              <option>Open</option>
              <option>Ongoing</option>
              <option>Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Entry Fee (₹) *</label>
            <input name="entryFee" type="number" value={form.entryFee} onChange={handleChange} className="input-field" placeholder="20" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Prize Pool (₹) *</label>
            <input name="prizePool" type="number" value={form.prizePool} onChange={handleChange} className="input-field" placeholder="500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Max Players *</label>
            <input name="maxPlayers" type="number" value={form.maxPlayers} onChange={handleChange} className="input-field" placeholder="50" />
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Date & Time</label>
          <input name="date" type="datetime-local" value={form.date} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            className="input-field resize-none" rows={3} placeholder="Tournament rules and info..." />
        </div>

        {/* Reward Type */}
        <div>
          <label className="text-gray-400 text-xs font-game uppercase mb-2 block">Reward System</label>
          <div className="flex gap-3">
            {['perKill', 'position'].map(rt => (
              <label key={rt} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded border transition-all
                ${form.rewardType === rt ? 'border-ff-orange text-ff-orange' : 'border-ff-border text-gray-400'}`}>
                <input type="radio" name="rewardType" value={rt} checked={form.rewardType === rt}
                  onChange={handleChange} className="hidden" />
                {rt === 'perKill' ? '🎯 Per Kill' : '🏆 Position'}
              </label>
            ))}
          </div>
        </div>

        {form.rewardType === 'perKill' && (
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">₹ Per Kill</label>
            <input name="perKillReward" type="number" value={form.perKillReward} onChange={handleChange}
              className="input-field" placeholder="10" />
          </div>
        )}

        {form.rewardType === 'position' && (
          <div className="grid grid-cols-3 gap-3">
            {[['pos1', '🥇 1st Place'], ['pos2', '🥈 2nd Place'], ['pos3', '🥉 3rd Place']].map(([name, label]) => (
              <div key={name}>
                <label className="text-gray-400 text-xs font-game uppercase mb-1 block">{label}</label>
                <input name={name} type="number" value={form[name]} onChange={handleChange}
                  className="input-field" placeholder="₹" />
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary mt-2">
          {submitting ? 'Creating...' : 'Create Tournament'}
        </button>
      </form>
    </div>
  );
}
