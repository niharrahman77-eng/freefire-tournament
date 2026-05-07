// pages/login.js
import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return toast.error('Fill all fields');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/');
    } catch {
      toast.error('Wrong email or password');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card">
        <div className="text-center mb-6">
          <span className="text-4xl">🔥</span>
          <h1 className="font-game font-bold text-2xl mt-2">Login</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, soldier</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="your@email.com" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-game uppercase mb-1 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" placeholder="Your password" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          Don't have an account?{' '}
          <Link href="/register" className="text-ff-orange hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
