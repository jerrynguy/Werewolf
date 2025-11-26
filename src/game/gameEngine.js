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
        alive: true,
        knownWolves: [], // For Seer to track wolves
        knownSeers: [], // For Wolf Shaman to track seers
        lastProtected: null // For old_witch to track last protected player
      });
    }
  });
  
  return players;
};

export const old_witchPhase = async (players, gameState, addLog) => {
  const alive = players.filter(p => p.alive);
  const old_witchs = alive.filter(p => p.role === 'OLD WITCH');
  
  if (old_witchs.length === 0) {
    gameState.protectedPlayerId = null;
    return;
  }
  
  for (const old_witch of old_witchs) {
    // Không thể bảo vệ chính mình, người đã chết, hoặc người vừa được bảo vệ đêm trước
    const targets = alive.filter(p => 
      p.id !== old_witch.id && 
      p.id !== old_witch.lastProtected
    );
    
    if (targets.length === 0) {
      gameState.protectedPlayerId = null;
      continue;
    }
    
    const decision = await makeAIDecision(old_witch, alive, 'old_witch_protect', ROLES, old_witch.lastProtected);
    const target = targets.find(p => p.id === decision.targetId) || targets[0];
    
    // Lưu người được bảo vệ vào game state
    gameState.protectedPlayerId = target.id;
    old_witch.lastProtected = target.id;
    
    addLog(`🧙‍♀️ Phù Thủy Già bảo vệ Player #${target.id} - họ sẽ rời làng an toàn vào ngày mai`);
    addLog(`   💭 "${decision.reasoning}"`);
  }
};

export const shamanPhase = async (players, addLog) => {
  const alive = players.filter(p => p.alive);
  const shamans = alive.filter(p => p.role === 'WOLF_SHAMAN');
  
  if (shamans.length === 0) return;
  
  for (const shaman of shamans) {
    const targets = alive.filter(p => p.id !== shaman.id); // Không check chính mình
    
    if (targets.length === 0) continue;
    
    const decision = await makeAIDecision(shaman, alive, 'shaman_check', ROLES);
    const target = targets.find(p => p.id === decision.targetId) || targets[0];
    
    const isSeer = target.role === 'SEER';
    
    // Cập nhật tri thức của Shaman
    if (isSeer && !shaman.knownSeers.includes(target.id)) {
      shaman.knownSeers.push(target.id);
    }
    
    addLog(`🌙 Pháp Sư Sói check Player #${target.id} → ${isSeer ? '🔮 ĐÂY LÀ TIÊN TRI!' : '❌ Không phải Tiên Tri'}`);
    addLog(`   💭 "${decision.reasoning}"`);
  }
};

export const seerPhase = async (players, addLog) => {
  const alive = players.filter(p => p.alive);
  const seers = alive.filter(p => p.role === 'SEER');
  
  if (seers.length === 0) return;
  
  for (const seer of seers) {
    const targets = alive.filter(p => p.id !== seer.id); // Không check chính mình
    
    if (targets.length === 0) continue;
    
    const decision = await makeAIDecision(seer, alive, 'seer_check', ROLES);
    const target = targets.find(p => p.id === decision.targetId) || targets[0];
    
    // PASSIVE ABILITY: Wolf Shaman sẽ hiện là "Không phải sói"
    const isWolf = target.role === 'WOLF'; // Chỉ WOLF thật mới hiện là sói
    
    // Cập nhật tri thức của Seer
    if (isWolf && !seer.knownWolves.includes(target.id)) {
      seer.knownWolves.push(target.id);
    }
    
    addLog(`🔮 Tiên Tri check Player #${target.id} → ${isWolf ? '🐺 ĐÂY LÀ SÓI!' : '✅ Không phải sói'}`);
    addLog(`   💭 "${decision.reasoning}"`);
  }
};

export const nightPhase = async (players, gameState, addLog) => {
  const alive = players.filter(p => p.alive);
  
  // Wolves kill
  const wolves = alive.filter(p => p.role === 'WOLF');
  if (wolves.length > 0) {
    const targets = alive.filter(p => p.role !== 'WOLF');
    if (targets.length > 0) {
      const decision = await makeAIDecision(wolves[0], alive, 'night_kill', ROLES);
      const victim = targets.find(p => p.id === decision.targetId) || targets[0];
      
      // Kiểm tra nếu victim đang được old_witch bảo vệ
      if (gameState.protectedPlayerId === victim.id) {
        addLog(`🐺 Người Sói cố giết Player #${victim.id} nhưng họ đã rời làng an toàn!`);
        addLog(`   💭 Lý do: "${decision.reasoning}"`);
      } else {
        victim.alive = false;
        addLog(`🐺 Người Sói giết Player #${victim.id} (${ROLES[victim.role].icon} ${ROLES[victim.role].name})`);
        addLog(`   💭 Lý do: "${decision.reasoning}"`);
      }
    }
  }
};

export const dayPhase = async (players, gameState, addLog) => {
  const alive = players.filter(p => p.alive);
  
  if (alive.length === 0) return;
  
  // Lọc ra người được bảo vệ (không tham gia vote)
  const protectedId = gameState.protectedPlayerId;
  const canVote = alive.filter(p => p.id !== protectedId);
  
  if (protectedId) {
    const protectedPlayer = players.find(p => p.id === protectedId);
    if (protectedPlayer && protectedPlayer.alive) {
      addLog(`🏠 Player #${protectedId} (${ROLES[protectedPlayer.role].icon}) đã rời làng và an toàn hôm nay`);
    }
  }
  
  addLog(`👥 Còn ${alive.length} người sống (${canVote.length} người tham gia vote)`);
  
  // Voting - chỉ những người KHÔNG được bảo vệ mới vote
  const votes = {};
  for (const voter of canVote) {
    // Targets cũng phải loại trừ người được bảo vệ
    const decision = await makeAIDecision(voter, canVote, 'day_vote', ROLES);
    const target = decision.targetId;
    
    if (target) {
      votes[target] = (votes[target] || 0) + 1;
      const targetPlayer = alive.find(p => p.id === target);
      addLog(`   Player #${voter.id} (${ROLES[voter.role].icon}) vote #${target} (${ROLES[targetPlayer.role].icon}): "${decision.reasoning}"`);
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
  
  // Reset protected player sau khi ngày kết thúc
  gameState.protectedPlayerId = null;
};

export const runGame = async (selectedRoles, setLog, setGameState, setIsRunning) => {
  setIsRunning(true);
  setLog([]);
  
  const players = initializePlayers(selectedRoles);
  const addLog = (message) => setLog(prev => [...prev, message]);
  
  addLog('🎮 GAME BẮT ĐẦU!');
  addLog(`👥 Tổng số: ${players.length} người`);
  const villagers = players.filter(p => p.role === 'VILLAGER').length;
  const seers = players.filter(p => p.role === 'SEER').length;
  const old_witchs = players.filter(p => p.role === 'old_witch').length;
  const wolves = players.filter(p => p.role === 'WOLF').length;
  const shamans = players.filter(p => p.role === 'WOLF_SHAMAN').length;
  addLog(`   - ${villagers} Dân Làng 👨‍🌾`);
  if (seers > 0) addLog(`   - ${seers} Tiên Tri 🔮`);
  if (old_witchs > 0) addLog(`   - ${old_witchs} Phù Thủy Già 🧙‍♀️`);
  addLog(`   - ${wolves} Người Sói 🐺`);
  if (shamans > 0) addLog(`   - ${shamans} Pháp Sư Sói 🌙`);
  addLog('');
  
  let night = 0;
  let winner = null;
  const gameState = { protectedPlayerId: null }; // Track protected player
  
  while (!winner && night < 20) {
    night++;
    
    // NIGHT
    addLog(`🌙 === ĐÊM ${night} ===`);
    
    // 1. old_witch protect ĐẦU TIÊN (bảo vệ cho ngày hôm sau)
    await old_witchPhase(players, gameState, addLog);
    
    // 2. Wolf Shaman check
    await shamanPhase(players, addLog);
    
    // 3. Seer check
    await seerPhase(players, addLog);
    
    // 4. Wolves kill CUỐI CÙNG (có thể bị block bởi old_witch)
    await nightPhase(players, gameState, addLog);
    
    winner = checkWinner(players);
    if (winner) break;
    
    // DAY
    addLog(`☀️ === NGÀY ${night} ===`);
    await dayPhase(players, gameState, addLog);
    
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