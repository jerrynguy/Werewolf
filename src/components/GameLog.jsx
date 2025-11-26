import React, { useEffect, useRef } from 'react';

const GameLog = ({ log }) => {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="bg-black/60 backdrop-blur-md rounded-xl p-6 border border-green-300/20">
      <h2 className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
        📜 Nhật Ký Game
      </h2>
      <div className="bg-black/80 rounded-lg p-4 max-h-[600px] overflow-y-auto font-mono text-sm">
        {log.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Chưa có nhật ký. Bấm "Bắt đầu game" để chơi!
          </div>
        ) : (
          <>
            {log.map((line, i) => (
              <div key={i} className={`mb-1 ${
                line.includes('===') ? 'text-yellow-300 font-bold my-2' :
                line.includes('🏆') ? 'text-green-400 font-bold text-lg' :
                line.includes('chiến thắng') ? 'text-green-300 font-bold' :
                line.includes('💭') ? 'text-blue-300 italic pl-4' :
                line.includes('🐺') ? 'text-red-300' :
                line.includes('👨‍🌾') ? 'text-green-300' :
                line.includes('⚖️') ? 'text-orange-300' :
                line.includes('   ') ? 'text-gray-400 pl-6' :
                'text-gray-300'
              }`}>
                {line}
              </div>
            ))}
            <div ref={logEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default GameLog;