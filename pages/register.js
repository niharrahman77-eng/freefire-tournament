// pages/register.js
import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '', username: '', ffUid: '', ingameName: ''
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password || !form.username || !form.ffUid || !form.ingameName) {
      return toast.error('Fill all fields');
    }
    if (form.password.length < 6) return toast.error('Password must be 6+ characters');
    setLoading(true);
    try {
      await register(form.email, form.password, form.username, form.ffUid, form.ingameName);
      toast.success('Account created! Welcome!');
      router.push('/');
    } catch (err) {
      toast.error(err.message.includes('email-already') ? 'Email already used' : 'Error: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card">
        <div className="text-center mb-6">
          <span className="text-4xl">🔥</span>
          <h1 className="font-game font-bold text-2xl mt-2">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join FF Arena and start winning</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Username</label>
            <input name="username" value={form.username} onChange={handleChange}
              className="input-field" placeholder="Your display name" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              className="input-field" placeholder="your@email.com" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              className="input-field" placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Free Fire UID</label>
            <input name="ffUid" value={form.ffUid} onChange={handleChange}
              className="input-field" placeholder="Your FF Player ID" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">In-Game Name</label>
            <input name="ingameName" value={form.ingameName} onChange={handleChange}
              className="input-field" placeholder="Your character name in FF" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-ff-orange hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
