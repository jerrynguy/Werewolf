import { ROLES } from './roles';
import { makeAIDecision } from './aiDecision';
import { checkWinner, getGameStats } from './winConditions';

export const initializePlayers = (selectedRoles) => {
  const players = [];
  let id = 1;
  
  selectedRoles.forEach(roleConfig => {
    const roleDef = ROLES[roleConfig.type];
    for (let i = 0; i < roleConfig.count; i++) {
      players.push({
        id: id++,
        role: roleConfig.type,
        faction: roleDef.faction,
        alive: true
      });
    }
  });
  
  return players;
};

export const nightPhase = async (players, addLog) => {
  const alive = players.filter(p => p.alive);
  
  // Wolves kill
  const wolves = alive.filter(p => p.role === 'WOLF');
  if (wolves.length > 0) {
    const targets = alive.filter(p => p.role !== 'WOLF');
    if (targets.length > 0) {
      const decision = await makeAIDecision(wolves[0], alive, 'night_kill', ROLES);
      const victim = targets.find(p => p.id === decision.targetId) || targets[0];
      
      victim.alive = false;
      addLog(`🐺 Người Sói giết Player #${victim.id} (${ROLES[victim.role].icon} ${ROLES[victim.role].name})`);
      addLog(`   💭 Lý do: "${decision.reasoning}"`);
    }
  }
};

export const dayPhase = async (players, addLog) => {
  const alive = players.filter(p => p.alive);
  
  if (alive.length === 0) return;
  
  addLog(`👥 Còn ${alive.length} người sống`);
  
  // Voting
  const votes = {};
  for (const voter of alive) {
    const decision = await makeAIDecision(voter, alive, 'day_vote', ROLES);
    const target = decision.targetId;
    
    if (target) {
      votes[target] = (votes[target] || 0) + 1;
      const targetPlayer = alive.find(p => p.id === target);
      addLog(`   Player #${voter.id} vote #${target} (${ROLES[targetPlayer.role].icon}): "${decision.reasoning}"`);
    }
  }
  
  // Lynch player with most votes
  if (Object.keys(votes).length > 0) {
    const lynchId = parseInt(Object.keys(votes).reduce((a, b) => 
      votes[a] > votes[b] ? a : b
    ));
    
    const lynched = players.find(p => p.id === lynchId);
    lynched.alive = false;
    
    addLog(`⚖️ Player #${lynchId} (${ROLES[lynched.role].icon} ${ROLES[lynched.role].name}) bị TREO CỔ với ${votes[lynchId]} phiếu!`);
  } else {
    addLog(`⚖️ Không ai bị treo cổ`);
  }
};

export const runGame = async (selectedRoles, setLog, setGameState, setIsRunning) => {
  setIsRunning(true);
  setLog([]);
  
  const players = initializePlayers(selectedRoles);
  const addLog = (message) => setLog(prev => [...prev, message]);
  
  addLog('🎮 GAME BẮT ĐẦU!');
  addLog(`👥 Tổng số: ${players.length} người`);
  const villagers = players.filter(p => p.role === 'VILLAGER').length;
  const wolves = players.filter(p => p.role === 'WOLF').length;
  addLog(`   - ${villagers} Dân Làng 👨‍🌾`);
  addLog(`   - ${wolves} Người Sói 🐺`);
  addLog('');
  
  let night = 0;
  let winner = null;
  
  while (!winner && night < 20) {
    night++;
    
    // NIGHT
    addLog(`🌙 === ĐÊM ${night} ===`);
    await nightPhase(players, addLog);
    
    winner = checkWinner(players);
    if (winner) break;
    
    // DAY
    addLog(`☀️ === NGÀY ${night} ===`);
    await dayPhase(players, addLog);
    
    winner = checkWinner(players);
    if (winner) break;
    
    addLog('');
  }
  
  if (winner) {
    addLog(`🏆 === KẾT THÚC ===`);
    addLog(`${winner.message}`);
    addLog(`Còn ${winner.survivors} người sống sót`);
  }
  
  const stats = getGameStats(players, night);
  setGameState({ players, winner, nights: night, stats });
  setIsRunning(false);
};