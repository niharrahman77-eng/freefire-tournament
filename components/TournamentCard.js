// components/TournamentCard.js
import Link from 'next/link';

const MODE_ICONS = {
  'Battle Royale': '🏝️',
  'Lone Wolf': '💀',
  'Clash Squad': '👥',
  'Sniper War': '🎯',
  'Knife Party': '🔪',
  'Rush War': '💣',
};

export default function TournamentCard({ tournament }) {
  const { id, name, type, entryFee, prizePool, rewardType, perKillReward,
    positionRewards, maxPlayers, joinedCount, status, date, mode } = tournament;

  const typeClass = type === 'Solo' ? 'badge-solo' : type === 'Duo' ? 'badge-duo' : 'badge-squad';

  const statusColor = status === 'Open' ? 'text-green-400' :
    status === 'Ongoing' ? 'text-yellow-400' : 'text-red-400';

  const spotsLeft = maxPlayers - (joinedCount || 0);

  return (
    <div className="card hover:border-ff-orange transition-all duration-300 hover:-translate-y-0.5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Mode Badge */}
          {mode && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-sm">{MODE_ICONS[mode] || '🎮'}</span>
              <span className="text-ff-orange font-game text-xs uppercase font-bold">{mode}</span>
            </div>
          )}
          <h3 className="font-game font-bold text-lg text-white">{name}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Date TBD'}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={typeClass}>{type}</span>
          <span className={`text-xs font-game font-semibold ${statusColor}`}>{status}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 border-t border-ff-border pt-3">
        <div className="text-center">
          <p className="text-ff-orange font-game font-bold text-lg">₹{entryFee}</p>
          <p className="text-gray-500 text-xs">Entry</p>
        </div>
        <div className="text-center">
          <p className="text-ff-yellow font-game font-bold text-lg">₹{prizePool}</p>
          <p className="text-gray-500 text-xs">Prize Pool</p>
        </div>
        <div className="text-center">
          <p className={`font-game font-bold text-lg ${spotsLeft < 5 ? 'text-red-400' : 'text-white'}`}>
            {spotsLeft}
          </p>
          <p className="text-gray-500 text-xs">Spots Left</p>
        </div>
      </div>

      {/* Reward Info */}
      <div className="bg-ff-dark rounded p-2 text-xs text-gray-400">
        {rewardType === 'perKill' ? (
          <span>🎯 Per Kill: <span className="text-ff-orange font-semibold">₹{perKillReward}/kill</span></span>
        ) : (
          <span>🏆 Position: <span className="text-ff-orange font-semibold">
            1st ₹{positionRewards?.['1'] || 0} · 2nd ₹{positionRewards?.['2'] || 0} · 3rd ₹{positionRewards?.['3'] || 0}
          </span></span>
        )}
      </div>

      {/* CTA */}
      <Link href={`/tournament/${id}`} className="btn-primary text-center text-sm mt-1">
        {status === 'Open' ? 'Join Now' : 'View Details'}
      </Link>
    </div>
  );
}
