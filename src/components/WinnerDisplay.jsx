import React from 'react';
import { Trophy } from 'lucide-react';

const WinnerDisplay = ({ winner, nights }) => {
  if (!winner) return null;

  const getGradient = () => {
    if (winner.faction === 'wolf') {
      return 'from-red-500/20 to-orange-500/20 border-red-300/30';
    }
    return 'from-green-500/20 to-emerald-500/20 border-green-300/30';
  };

  return (
    <div className={`bg-gradient-to-r ${getGradient()} backdrop-blur-md rounded-xl p-8 border text-center animate-pulse`}>
      <div className="flex justify-center mb-4">
        <Trophy className="text-yellow-400" size={64} />
      </div>
      <div className="text-7xl mb-4">{winner.icon}</div>
      <h2 className="text-white font-bold text-4xl mb-2">
        {winner.message}
      </h2>
      <p className="text-green-200 text-xl">
        {winner.survivors} người sống sót sau {nights} đêm
      </p>
    </div>
  );
};

export default WinnerDisplay;