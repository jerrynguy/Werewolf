import React, { useState } from 'react';
import { Play, RefreshCw, Brain, Settings } from 'lucide-react';
import RoleSelector from './components/RoleSelector';
import GameLog from './components/GameLog';
import GameStats from './components/GameStats';
import WinnerDisplay from './components/WinnerDisplay';
import { runGame } from './game/gameEngine';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [selectedRoles, setSelectedRoles] = useState([
    { type: 'VILLAGER', count: 3 },
    { type: 'WOLF', count: 2 }
  ]);
  
  const [gameState, setGameState] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [isSelectingRole, setIsSelectingRole] = useState(false);

  const startGame = () => {
    if (selectedRoles.length === 0) {
      alert('Vui lòng chọn ít nhất 1 vai trò!');
      return;
    }
    
    const totalPlayers = selectedRoles.reduce((sum, role) => sum + role.count, 0);
    if (totalPlayers < 2) {
      alert('Cần ít nhất 2 người chơi!');
      return;
    }
    
    runGame(selectedRoles, setLog, setGameState, setIsRunning);
  };

  const resetGame = () => {
    setGameState(null);
    setLog([]);
    setShowStats(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <Brain className="text-purple-400" size={48} />
            Ma Sói AI
          </h1>
          <p className="text-purple-200 text-lg">Powered by Claude API - Multi-Agent System</p>
        </div>
        
        {/* Config Panel */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-purple-300/20">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="text-purple-300" />
            <h2 className="text-xl font-semibold text-white">Thiết lập Game</h2>
          </div>
          
          <RoleSelector 
            selectedRoles={selectedRoles}
            setSelectedRoles={setSelectedRoles}
            onMenuToggle={setIsSelectingRole}
          />

          <div className="mt-6 flex gap-3">
            <button
              onClick={startGame}
              disabled={isRunning}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all text-lg"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="animate-spin" size={24} />
                  Đang chạy AI...
                </>
              ) : (
                <>
                  <Play size={24} />
                  Bắt đầu game
                </>
              )}
            </button>

            {gameState && (
              <button
                onClick={resetGame}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-6 rounded-lg transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Winner Display */}
        {gameState?.winner && (
          <div className="mb-6">
            <WinnerDisplay winner={gameState.winner} nights={gameState.nights} />
          </div>
        )}

        {/* Stats Toggle */}
        {gameState?.stats && (
          <div className="mb-6">
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full bg-white/10 hover:bg-white/15 text-purple-200 font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Brain size={20} />
              {showStats ? 'Ẩn thống kê' : 'Hiện thống kê'}
            </button>
          </div>
        )}

        {/* Stats */}
        {showStats && gameState?.stats && (
          <div className="mb-6">
            <GameStats gameState={gameState} />
          </div>
        )}
        
        {/* Game Log */}
        {log.length > 0 && (
          <GameLog log={log} />
        )}
        
        {/* How it works - AI System Box */}
        <AnimatePresence>
          {!isSelectingRole && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="mt-8 bg-blue-500/10 backdrop-blur-md rounded-xl p-6 border border-blue-300/20"
            >
              <h3 className="text-white font-bold text-lg mb-3">🧠 AI System</h3>
              <div className="text-blue-100 text-sm space-y-2">
                <p>✅ Mỗi lượt, AI nhận <strong>game state</strong> (số người còn sống mỗi phe)</p>
                <p>✅ AI được cho <strong>role prompt</strong> (mục tiêu và chiến thuật)</p>
                <p>✅ AI quyết định <strong>target</strong> và giải thích <strong>reasoning</strong></p>
                <p>✅ Mỗi decision là <strong>context-aware</strong> - AI phân tích tình hình thực tế</p>
                <p className="text-yellow-300 mt-3">⚠️ Mỗi game tốn ~20-40 API calls đến Claude</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </div>
  );
}

export default App;