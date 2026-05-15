// pages/index.js
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import TournamentCard from '../components/TournamentCard';

const MODES = [
  { id: 'All', label: 'All', icon: '🏆' },
  { id: 'Battle Royale', label: 'Battle Royale', icon: '🏝️' },
  { id: 'Lone Wolf', label: 'Lone Wolf', icon: '💀' },
  { id: 'Clash Squad', label: 'Clash Squad', icon: '👥' },
  { id: 'Sniper War', label: 'Sniper War', icon: '🎯' },
  { id: 'Knife Party', label: 'Knife Party', icon: '🔪' },
  { id: 'Rush War', label: 'Rush War', icon: '💣' },
];

const TYPES = ['All', 'Solo', 'Duo', 'Squad'];

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [modeFilter, setModeFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const statusOrder = { 'Open': 0, 'Ongoing': 1, 'Completed': 2 };
      const sorted = list.sort((a, b) => {
        const statusDiff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        if (statusDiff !== 0) return statusDiff;
        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
        if (a.date) return -1;
        if (b.date) return 1;
        return 0;
      });

      setTournaments(sorted);
      setLoading(false);
    }
    fetchTournaments();
  }, []);

  // Apply both filters
  const filtered = tournaments.filter(t => {
    const modeMatch = modeFilter === 'All' || t.mode === modeFilter;
    const typeMatch = typeFilter === 'All' || t.type === typeFilter;
    return modeMatch && typeMatch;
  });

  function getTimeLabel(dateStr, status) {
    if (status === 'Completed') return null;
    if (!dateStr) return null;
    const now = new Date();
    const date = new Date(dateStr);
    const diff = date - now;
    if (diff < 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `⏰ ${days}d ${hours}h left`;
    if (hours > 0) return `⏰ ${hours}h ${mins}m left`;
    if (mins > 0) return `⏰ ${mins}m left`;
    return `🔴 Starting now!`;
  }

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-8 py-4">
        <h1 className="font-game font-bold text-4xl md:text-5xl text-white mb-2">
          Clash<span className="text-ff-orange">Sphere</span>
        </h1>
        <p className="text-gray-400 font-body text-sm">Join tournaments · Win real money · Become a legend</p>
      </div>

      {/* Mode Cards */}
      <div className="mb-6">
        <p className="font-game text-xs text-gray-500 uppercase tracking-wider mb-3">🎮 Select Game Mode</p>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setModeFilter(m.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all
                ${modeFilter === m.id
                  ? 'bg-ff-orange border-orange-400 text-white shadow-[0_0_10px_rgba(255,107,0,0.4)]'
                  : 'bg-ff-card border-ff-border text-gray-400 hover:border-ff-orange hover:text-ff-orange'}`}>
              <span className="text-2xl">{m.icon}</span>
              <span className="font-game text-xs uppercase leading-tight text-center">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <p className="font-game text-xs text-gray-500 uppercase tracking-wider self-center mr-1">Type:</p>
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-1.5 rounded-lg border-2 font-game text-xs uppercase tracking-wider transition-all
              ${typeFilter === t
                ? 'bg-ff-orange border-orange-400 text-white'
                : 'bg-ff-card border-ff-border text-gray-400 hover:border-ff-orange'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Active filters */}
      {(modeFilter !== 'All' || typeFilter !== 'All') && (
        <div className="flex items-center gap-2 mb-4">
          <p className="text-gray-500 text-xs">Showing:</p>
          {modeFilter !== 'All' && (
            <span className="bg-ff-orange/20 border border-ff-orange text-ff-orange text-xs px-2 py-0.5 rounded-full font-game">
              {MODES.find(m => m.id === modeFilter)?.icon} {modeFilter}
            </span>
          )}
          {typeFilter !== 'All' && (
            <span className="bg-ff-orange/20 border border-ff-orange text-ff-orange text-xs px-2 py-0.5 rounded-full font-game">
              {typeFilter}
            </span>
          )}
          <button
            onClick={() => { setModeFilter('All'); setTypeFilter('All'); }}
            className="text-gray-500 text-xs hover:text-ff-orange underline">
            Clear filters
          </button>
        </div>
      )}

      {/* Tournaments */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-game">Loading tournaments...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">🎮</p>
          <p className="text-gray-500 font-game text-lg">No tournaments found</p>
          <p className="text-gray-600 text-sm mt-1">Try a different filter or check back soon!</p>
          <button
            onClick={() => { setModeFilter('All'); setTypeFilter('All'); }}
            className="btn-secondary mt-4 text-xs">
            Show All Tournaments
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="font-game text-xs text-gray-500 uppercase tracking-wider">
            🔥 {filtered.length} Tournament{filtered.length !== 1 ? 's' : ''} — Sorted by Closest Date
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t, index) => {
              const timeLabel = getTimeLabel(t.date, t.status);
              return (
                <div key={t.id} className="relative">
                  {timeLabel && (
                    <div className="absolute -top-2 left-3 z-10 bg-ff-dark border border-ff-orange rounded-full px-3 py-0.5">
                      <p className="text-ff-orange font-game text-xs font-bold">{timeLabel}</p>
                    </div>
                  )}
                  {index === 0 && t.status === 'Open' && (
                    <div className="absolute -top-2 right-3 z-10 bg-ff-orange rounded-full px-3 py-0.5">
                      <p className="text-white font-game text-xs font-bold">⚡ NEXT UP</p>
                    </div>
                  )}
                  <TournamentCard tournament={t} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
