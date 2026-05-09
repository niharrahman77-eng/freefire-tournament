// pages/tournament/results/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

export default function TournamentResults() {
  const router = useRouter();
  const { id } = router.query;
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      const tSnap = await getDoc(doc(db, 'tournaments', id));
      if (tSnap.exists()) setTournament({ id: tSnap.id, ...tSnap.data() });

      try {
        const rSnap = await getDocs(query(collection(db, 'results'), where('tournamentId', '==', id)));
        setResults(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {}

      try {
        const pSnap = await getDocs(query(collection(db, 'joinedPlayers'), where('tournamentId', '==', id)));
        setPlayers(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {}

      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-500 font-game">Loading results...</div>;
  if (!tournament) return <div className="text-center py-20 text-gray-400 font-game">Tournament not found</div>;

  const isPerKill = tournament.rewardType === 'perKill';

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/tournament/${id}`} className="text-gray-500 hover:text-ff-orange text-sm mb-4 inline-block">
        ← Back to Tournament
      </Link>

      {/* Header */}
      <div className="card mb-4 text-center">
        <span className="text-4xl mb-2 block">🏆</span>
        <h1 className="font-game font-bold text-2xl text-white">{tournament.name}</h1>
        <p className="text-gray-400 text-sm mt-1">Final Results</p>
        <div className="flex justify-center gap-3 mt-3 flex-wrap">
          <span className={`text-xs font-game px-2 py-1 rounded border
            ${tournament.type === 'Solo' ? 'border-blue-500 text-blue-400' :
              tournament.type === 'Duo' ? 'border-purple-500 text-purple-400' :
              'border-green-500 text-green-400'}`}>
            {tournament.type}
          </span>
          <span className="text-xs font-game px-2 py-1 rounded border border-gray-600 text-gray-400">
            {tournament.date || 'Date TBD'}
          </span>
          <span className={`text-xs font-game px-2 py-1 rounded border
            ${tournament.status === 'Completed' ? 'border-gray-600 text-gray-400' :
              tournament.status === 'Ongoing' ? 'border-yellow-500 text-yellow-400' :
              'border-green-500 text-green-400'}`}>
            {tournament.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center">
          <p className="text-ff-yellow font-game font-bold text-2xl">₹{tournament.prizePool}</p>
          <p className="text-gray-500 text-xs mt-1">Total Prize Pool</p>
        </div>
        <div className="card text-center">
          <p className="text-white font-game font-bold text-2xl">{players.length}</p>
          <p className="text-gray-500 text-xs mt-1">Total Players</p>
        </div>
      </div>

      {/* Not completed yet */}
      {tournament.status !== 'Completed' ? (
        <div className="card text-center py-10 mb-4">
          <p className="text-4xl mb-3">⏳</p>
          <p className="text-gray-300 font-game text-lg">Results Not Declared Yet</p>
          <p className="text-gray-500 text-sm mt-2">Results will appear here after the tournament ends</p>
        </div>
      ) : (
        <>
          {/* Per Kill Results */}
          {isPerKill && results.length > 0 && (
            <div className="card mb-4">
              <h2 className="font-game font-bold text-lg mb-1">🎯 Kill Leaderboard</h2>
              <p className="text-gray-500 text-xs mb-4">₹{tournament.perKillReward} per kill</p>
              <div className="flex flex-col gap-2">
                {results
                  .sort((a, b) => (b.kills || 0) - (a.kills || 0))
                  .map((r, index) => (
                    <div key={r.id}
                      className={`flex items-center justify-between p-3 rounded-lg border
                        ${index === 0 ? 'bg-yellow-900/20 border-yellow-600' :
                          index === 1 ? 'bg-gray-700/20 border-gray-500' :
                          index === 2 ? 'bg-orange-900/20 border-orange-700' :
                          'bg-ff-dark border-ff-border'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <div>
                          <p className="text-white font-bold">{r.ingameName || r.ffUid}</p>
                          <p className="text-gray-500 text-xs">FF UID: {r.ffUid}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-ff-orange font-game font-bold text-lg">{r.kills} kills</p>
                        <p className="text-green-400 font-game font-bold">
                          +₹{(r.kills || 0) * (tournament.perKillReward || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Position Results */}
          {!isPerKill && (
            <div className="card mb-4">
              <h2 className="font-game font-bold text-lg mb-4">🏆 Final Standings</h2>
              <div className="flex flex-col gap-3">
                {['1', '2', '3'].map(pos => {
                  const result = results.find(r => String(r.position) === pos);
                  const reward = tournament.positionRewards?.[pos] || 0;
                  const medals = { '1': '🥇', '2': '🥈', '3': '🥉' };
                  const colors = {
                    '1': 'bg-yellow-900/20 border-yellow-600',
                    '2': 'bg-gray-700/20 border-gray-500',
                    '3': 'bg-orange-900/20 border-orange-700',
                  };
                  const labels = { '1': '1st Place', '2': '2nd Place', '3': '3rd Place' };

                  return (
                    <div key={pos} className={`flex items-center justify-between p-4 rounded-lg border ${colors[pos]}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{medals[pos]}</span>
                        <div>
                          {result ? (
                            <>
                              <p className="text-white font-bold text-lg">{result.ingameName || result.ffUid}</p>
                              <p className="text-gray-500 text-xs">FF UID: {result.ffUid}</p>
                            </>
                          ) : (
                            <p className="text-gray-500 font-game italic">Not declared</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">{labels[pos]}</p>
                        <p className="text-green-400 font-game font-bold text-xl">₹{reward}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results saved */}
          {results.length === 0 && (
            <div className="card text-center py-10 mb-4">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-300 font-game text-lg">Results Coming Soon</p>
              <p className="text-gray-500 text-sm mt-2">Admin is updating the results</p>
            </div>
          )}
        </>
      )}

      {/* All Players */}
      <div className="card">
        <h2 className="font-game font-bold text-lg mb-4">👥 All Participants ({players.length})</h2>
        {players.length === 0 ? (
          <p className="text-gray-500 text-sm">No players joined</p>
        ) : (
          <div className="flex flex-col gap-2">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between bg-ff-dark rounded p-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-game text-sm w-6">#{i + 1}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{p.ingameName}</p>
                    <p className="text-gray-500 text-xs">FF UID: {p.ffUid}</p>
                  </div>
                </div>
                <span className="text-gray-600 font-game text-xs">{p.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
