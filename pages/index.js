// pages/index.js
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import TournamentCard from '../components/TournamentCard';

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort: Open first → Ongoing → Completed
      // Within same status → closest date first
      const statusOrder = { 'Open': 0, 'Ongoing': 1, 'Completed': 2 };
      const sorted = list.sort((a, b) => {
        // Sort by status first
        const statusDiff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        if (statusDiff !== 0) return statusDiff;

        // Then sort by closest date
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

  const filtered = filter === 'All' ? tournaments : tournaments.filter(t => t.type === filter);

  // Helper to show time remaining
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

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', 'Open', 'Solo', 'Duo', 'Squad'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg border-2 font-game text-xs uppercase tracking-wider transition-all
              ${filter === f
                ? 'bg-ff-orange border-orange-400 text-white shadow-[0_0_10px_rgba(255,107,0,0.4)]'
                : 'bg-ff-card border-ff-border text-gray-400 hover:border-ff-orange hover:text-ff-orange'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Tournaments */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-game">Loading tournaments...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 font-game text-lg">No tournaments yet</p>
          <p className="text-gray-600 text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Upcoming label */}
          {filtered.some(t => t.status === 'Open') && (
            <p className="font-game text-xs text-gray-500 uppercase tracking-wider">
              🔥 Upcoming Tournaments — Sorted by Closest Date
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => {
              const timeLabel = getTimeLabel(t.date, t.status);
              return (
                <div key={t.id} className="relative">
                  {/* Time remaining badge */}
                  {timeLabel && (
                    <div className="absolute -top-2 left-3 z-10 bg-ff-dark border border-ff-orange rounded-full px-3 py-0.5">
                      <p className="text-ff-orange font-game text-xs font-bold">{timeLabel}</p>
                    </div>
                  )}
                  {/* Highlight next upcoming tournament */}
                  {filtered.indexOf(t) === 0 && t.status === 'Open' && (
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
