// pages/edit-profile.js
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditProfile() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    username: '',
    ffUid: '',
    ingameName: '',
  });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (userData) {
      setForm({
        username: userData.username || '',
        ffUid: userData.ffUid || '',
        ingameName: userData.ingameName || '',
      });
    }
  }, [userData]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.username) return toast.error('Username cannot be empty');
    if (!form.ffUid) return toast.error('FF UID cannot be empty');
    if (!form.ingameName) return toast.error('In-game name cannot be empty');

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username: form.username,
        ffUid: form.ffUid,
        ingameName: form.ingameName,
      });
      await refreshUserData();
      toast.success('Profile updated successfully!');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-20 text-gray-500 font-game">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-md mx-auto">
      <Link href="/dashboard" className="text-gray-500 hover:text-ff-orange text-sm mb-4 inline-block">
        ← Back to Profile
      </Link>

      <h1 className="section-title mb-6">Edit Profile</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-4">

        {/* Avatar placeholder */}
        <div className="card flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-ff-orange flex items-center justify-center text-4xl mb-3 border-4 border-orange-400 shadow-[0_0_15px_rgba(255,107,0,0.5)]">
            {form.username?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <p className="text-white font-game font-bold text-xl">{form.username || 'Your Name'}</p>
          <p className="text-gray-500 text-xs mt-1">{userData?.email}</p>
        </div>

        {/* Editable Fields */}
        <div className="card flex flex-col gap-4">
          <h2 className="font-game font-bold text-sm text-gray-400 uppercase">Game Details</h2>

          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">
              Username
            </label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="input-field"
              placeholder="Your display name"
            />
            <p className="text-gray-600 text-xs mt-1">This is shown to other players</p>
          </div>

          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">
              Free Fire UID
            </label>
            <input
              name="ffUid"
              value={form.ffUid}
              onChange={handleChange}
              className="input-field"
              placeholder="Your FF Player ID"
            />
            <p className="text-gray-600 text-xs mt-1">Found in your FF profile page</p>
          </div>

          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">
              In-Game Name
            </label>
            <input
              name="ingameName"
              value={form.ingameName}
              onChange={handleChange}
              className="input-field"
              placeholder="Your character name in FF"
            />
            <p className="text-gray-600 text-xs mt-1">Your name shown in Free Fire matches</p>
          </div>
        </div>

        {/* Cannot edit */}
        <div className="card flex flex-col gap-3 opacity-60">
          <h2 className="font-game font-bold text-sm text-gray-400 uppercase">Account Details</h2>
          <div>
            <label className="text-gray-500 text-xs font-game uppercase mb-1 block">
              Email — Cannot be changed
            </label>
            <input
              value={userData?.email || ''}
              disabled
              className="input-field cursor-not-allowed opacity-50"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Link href="/dashboard" className="btn-secondary flex-1 text-center">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1">
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}
