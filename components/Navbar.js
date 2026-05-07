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

  return (
    <nav className="bg-ff-card border-b border-ff-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-ff-orange text-2xl">🔥</span>
          <span className="font-game font-bold text-xl text-white tracking-wider">
            FF <span className="text-ff-orange">ARENA</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-300 hover:text-ff-orange transition-colors font-game text-sm uppercase tracking-wider">
            Tournaments
          </Link>
          {user && (
            <>
              <Link href="/wallet" className="text-gray-300 hover:text-ff-orange transition-colors font-game text-sm uppercase tracking-wider">
                💰 ₹{userData?.balance || 0}
              </Link>
              <Link href="/deposit" className="btn-primary text-xs py-1.5 px-3">
                + Add Money
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-ff-orange transition-colors font-game text-sm uppercase tracking-wider">
                My Profile
              </Link>
              {userData?.isAdmin && (
                <Link href="/admin" className="text-ff-yellow hover:text-yellow-400 transition-colors font-game text-sm uppercase tracking-wider">
                  ⚡ Admin
                </Link>
              )}
              <button onClick={handleLogout} className="btn-secondary text-xs py-2 px-4">
                Logout
              </button>
            </>
          )}
          {!user && (
            <>
              <Link href="/login" className="btn-secondary text-xs py-2 px-4">Login</Link>
              <Link href="/register" className="btn-primary text-xs py-2 px-4">Register</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-ff-card border-t border-ff-border px-4 pb-4 flex flex-col gap-3">
          <Link href="/" className="text-gray-300 font-game text-sm uppercase pt-3" onClick={() => setMenuOpen(false)}>Tournaments</Link>
          {user && (
            <>
              <Link href="/wallet" className="text-gray-300 font-game text-sm uppercase" onClick={() => setMenuOpen(false)}>
                💰 Wallet: ₹{userData?.balance || 0}
              </Link>
              <Link href="/dashboard" className="text-gray-300 font-game text-sm uppercase" onClick={() => setMenuOpen(false)}>My Profile</Link>
              {userData?.isAdmin && (
                <Link href="/admin" className="text-ff-yellow font-game text-sm uppercase" onClick={() => setMenuOpen(false)}>⚡ Admin</Link>
              )}
              <button onClick={handleLogout} className="btn-secondary text-left text-xs">Logout</button>
            </>
          )}
          {!user && (
            <div className="flex gap-3">
              <Link href="/login" className="btn-secondary text-xs" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/register" className="btn-primary text-xs" onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
