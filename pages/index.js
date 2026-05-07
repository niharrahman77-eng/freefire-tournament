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
      setTournaments(list);
      setLoading(false);
    }
    fetchTournaments();
  }, []);

  const filtered = filter === 'All' ? tournaments : tournaments.filter(t => t.type === filter);

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10 py-6">
        <h1 className="font-game font-bold text-4xl md:text-5xl text-white mb-2">
          FREE FIRE <span className="text-ff-orange">ARENA</span>
        </h1>
        <p className="text-gray-400 font-body text-sm">Join tournaments · Win real money · Become a legend</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', 'Solo', 'Duo', 'Squad'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded font-game text-sm uppercase tracking-wider transition-all
              ${filter === f ? 'bg-ff-orange text-white' : 'bg-ff-card border border-ff-border text-gray-400 hover:border-ff-orange'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-game">Loading tournaments...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 font-game text-lg">No tournaments yet</p>
          <p className="text-gray-600 text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => <TournamentCard key={t.id} tournament={t} />)}
        </div>
      )}
    </div>
  );
}
