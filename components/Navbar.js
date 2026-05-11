// components/Navbar.js
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  // Helper: active link style
  function navBtn(href) {
    const isActive = router.pathname === href;
    return `flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-game text-xs uppercase tracking-wider transition-all duration-200
      ${isActive
        ? 'bg-ff-orange border-orange-400 text-white shadow-[0_0_10px_rgba(255,107,0,0.5)]'
        : 'bg-ff-dark border-gray-600 text-gray-300 hover:border-ff-orange hover:text-ff-orange'}`;
  }

  return (
    <nav className="bg-ff-card border-b border-ff-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-ff-orange text-2xl">🔥</span>
          <span className="font-game font-bold text-xl text-white tracking-wider">
            FF <span className="text-ff-orange">ARENA</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/download" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-game text-xs uppercase tracking-wider transition-all duration-200 bg-ff-dark border-green-600 text-green-400 hover:bg-green-900/30 hover:border-green-400">
            📱 Download App
          </Link>

          <Link href="/" className={navBtn('/')}>
            🏆 Tournaments
          </Link>

          {user && (
            <>
              <Link href="/wallet" className={navBtn('/wallet')}>
                💰 ₹{userData?.balance || 0}
              </Link>

              <Link href="/deposit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-game text-xs uppercase tracking-wider transition-all duration-200 bg-ff-orange border-orange-400 text-white shadow-[0_0_10px_rgba(255,107,0,0.4)] hover:bg-orange-500 hover:shadow-[0_0_16px_rgba(255,107,0,0.7)]">
                ➕ Add Money
              </Link>

              <Link href="/dashboard" className={navBtn('/dashboard')}>
                👤 My Profile
              </Link>

              {userData?.isAdmin && (
                <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-game text-xs uppercase tracking-wider transition-all duration-200 bg-yellow-900/40 border-yellow-500 text-yellow-400 hover:bg-yellow-800/60 hover:shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                  ⚡ Admin
                </Link>
              )}

              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-game text-xs uppercase tracking-wider transition-all duration-200 bg-ff-dark border-red-700 text-red-400 hover:bg-red-900/30 hover:border-red-500">
                🚪 Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <Link href="/login" className={navBtn('/login')}>
                🔑 Login
              </Link>
              <Link href="/register" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-game text-xs uppercase tracking-wider transition-all duration-200 bg-ff-orange border-orange-400 text-white shadow-[0_0_10px_rgba(255,107,0,0.4)] hover:bg-orange-500">
                ✨ Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border-2 border-gray-600 text-white hover:border-ff-orange transition-all"
          onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-ff-card border-t border-ff-border px-4 py-4 flex flex-col gap-2">

          <a href="/ClashSphere.apk" download="ClashSphere.apk"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-green-600 text-green-400 font-game text-sm uppercase hover:bg-green-900/20 transition-all">
            ⬇️ Download App (APK)
          </a>

          <Link href="/" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-600 text-gray-300 font-game text-sm uppercase hover:border-ff-orange hover:text-ff-orange transition-all">
            🏆 Tournaments
          </Link>

          {user && (
            <>
              <Link href="/wallet" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-600 text-gray-300 font-game text-sm uppercase hover:border-ff-orange hover:text-ff-orange transition-all">
                💰 Wallet — ₹{userData?.balance || 0}
              </Link>

              <Link href="/deposit" onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-orange-400 bg-ff-orange text-white font-game text-sm uppercase shadow-[0_0_10px_rgba(255,107,0,0.4)] hover:bg-orange-500 transition-all">
                ➕ Add Money
              </Link>

              <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-600 text-gray-300 font-game text-sm uppercase hover:border-ff-orange hover:text-ff-orange transition-all">
                👤 My Profile
              </Link>

              {userData?.isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-yellow-500 text-yellow-400 font-game text-sm uppercase bg-yellow-900/20 hover:bg-yellow-800/40 transition-all">
                  ⚡ Admin Panel
                </Link>
              )}

              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-700 text-red-400 font-game text-sm uppercase bg-ff-dark hover:bg-red-900/20 transition-all">
                🚪 Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-600 text-gray-300 font-game text-sm uppercase hover:border-ff-orange hover:text-ff-orange transition-all">
                🔑 Login
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-orange-400 bg-ff-orange text-white font-game text-sm uppercase hover:bg-orange-500 transition-all">
                ✨ Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
