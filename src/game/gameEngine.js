import { ROLES } from './roles';
import { makeAIDecision, PHASES } from './aiDecision';
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
        knownWolves: [],
        knownSeers: [],
        lastProtected: null,
        hasHealPotion: roleConfig.type === 'WITCH',
        hasPoisonPotion: roleConfig.type === 'WITCH'
      });
    }
  });
  
  return players;
};

export const elderPhase = async (players, gameState, addLog) => {
  const alive = players.filter(p => p.alive);
  const elders = alive.filter(p => p.role === 'ELDER');
  
  if (elders.length === 0) {
    gameState.protectedPlayerId = null;
    return;
  }
  
  for (const elder of elders) {
    const targets = alive.filter(p => 
      p.id !== elder.id && 
      p.id !== elder.lastProtected
    );
    
    if (targets.length === 0) {
      gameState.protectedPlayerId = null;
      continue;
    }
    
    const decision = await makeAIDecision(elder, alive, PHASES.ELDER_PROTECT, ROLES, elder.lastProtected);
    const target = targets.find(p => p.id === decision.targetId) || targets[0];
    
    gameState.protectedPlayerId = target.id;
    elder.lastProtected = target.id;
    
    addLog(`🧙‍♀️ Phù Thủy Già bảo vệ Player #${target.id} - họ sẽ rời làng an toàn vào ngày mai`);
    addLog(`   💭 "${decision.reasoning}"`);
  }
};

export const witchPhase = async (players, gameState, addLog) => {
  const alive = players.filter(p => p.alive);
  const witches = alive.filter(p => p.role === 'WITCH');
  
  if (witches.length === 0) {
    if (gameState.wolfVictimId) {
      const victim = players.find(p => p.id === gameState.wolfVictimId);
      victim.alive = false;
      addLog(`💀 Player #${victim.id} (${ROLES[victim.role].icon} ${ROLES[victim.role].name}) đã chết vì bị Người Sói giết!`);
      
      if (victim.role === 'HUNTER') {
        await hunterPhase(victim, players, addLog);
      }
    }
    return;
  }
  
  for (const witch of witches) {
    const victimId = gameState.wolfVictimId;
    const victim = victimId ? players.find(p => p.id === victimId) : null;

    // ✅ FIX: Use correct PHASES.WITCH_DECIDE
    const decision = await makeAIDecision(
      witch, 
      alive, 
      PHASES.WITCH_DECIDE,
      ROLES, 
      null,
      victimId,
      witch.hasHealPotion,
      witch.hasPoisonPotion
    );

    if (decision.action === 'heal' && witch.hasHealPotion && victim) {
      witch.hasHealPotion = false;
      addLog(`🧪 Phù Thủy dùng Bình Cứu 💚 để cứu Player #${victimId}!`);
      addLog(`   💭 "${decision.reasoning}"`);
      gameState.wolfVictimId = null;
    } else if (decision.action === 'poison' && witch.hasPoisonPotion) {
      witch.hasPoisonPotion = false;
      const poisonTarget = alive.find(p => p.id === decision.targetId);
      if (poisonTarget) {
        poisonTarget.alive = false;
        addLog(`🧪 Phù Thủy dùng Bình Độc 💀 để giết Player #${poisonTarget.id} (${ROLES[poisonTarget.role].icon} ${ROLES[poisonTarget.role].name})!`);
        addLog(`   💭 "${decision.reasoning}"`);

        if (poisonTarget.role === 'HUNTER') {
          await hunterPhase(poisonTarget, players, addLog); 
        }
      }

      if (victimId && gameState.wolfVictimId) {
        victim.alive = false;
        addLog(`💀 Player #${victim.id} (${ROLES[victim.role].icon} ${ROLES[victim.role].name}) đã chết vì bị Người Sói giết!`);

        if (victim.role === 'HUNTER') {
          await hunterPhase(victim, players, addLog);
        }
      }
    } else {
      addLog(`🧪 Phù Thủy không sử dụng thuốc đêm nay`);
      if (decision.reasoning) {
        addLog(`   💭 "${decision.reasoning}"`);
      }

      if (victimId && gameState.wolfVictimId) {
        victim.alive = false;
        addLog(`💀 Player #${victim.id} (${ROLES[victim.role].icon} ${ROLES[victim.role].name}) đã chết vì bị Người Sói giết!`);

        if (victim.role === 'HUNTER') {
          await hunterPhase(victim, players, addLog);
        }
      }
    }
  }

  gameState.wolfVictimId = null;
};

export const hunterPhase = async (deadHunter, players, addLog) => {
  const alive = players.filter(p => p.alive);

  if (alive.length === 0) return;

  addLog(`💥 Thợ Săn Player #${deadHunter.id} kích hoạt khả năng trước khi chết!`);

  const decision = await makeAIDecision(deadHunter, alive, PHASES.HUNTER_REVENGE, ROLES);
  const target = alive.find(p => p.id === decision.targetId) || alive[0];

  target.alive = false;
  addLog(`🎯 Thợ Săn bắn Player #${target.id} (${ROLES[target.role].icon} ${ROLES[target.role].name})`);
  addLog(`   💭 "${decision.reasoning}"`);
};

export const shamanPhase = async (players, addLog) => {
  const alive = players.filter(p => p.alive);
  const shamans = alive.filter(p => p.role === 'WOLF_SHAMAN');
  
  if (shamans.length === 0) return;
  
  for (const shaman of shamans) {
    const targets = alive.filter(p => p.id !== shaman.id);
    
    if (targets.length === 0) continue;
    
    const decision = await makeAIDecision(shaman, alive, PHASES.SHAMAN_CHECK, ROLES);
    const target = targets.find(p => p.id === decision.targetId) || targets[0];
    
    const isSeer = target.role === 'SEER';
    
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
    const targets = alive.filter(p => p.id !== seer.id);
    
    if (targets.length === 0) continue;
    
    const decision = await makeAIDecision(seer, alive, PHASES.SEER_CHECK, ROLES);
    const target = targets.find(p => p.id === decision.targetId) || targets[0];
    
    const isWolf = target.role === 'WOLF' || target.role === 'LYCAN';
    
    if (isWolf && !seer.knownWolves.includes(target.id)) {
      seer.knownWolves.push(target.id);
    }
    
    addLog(`🔮 Tiên Tri check Player #${target.id} → ${isWolf ? '🐺 ĐÂY LÀ SÓI!' : '✅ Không phải sói'}`);
    addLog(`   💭 "${decision.reasoning}"`);
  }
};

export const nightPhase = async (players, gameState, addLog) => {
  const alive = players.filter(p => p.alive);
  
  const wolves = alive.filter(p => p.role === 'WOLF' || p.role === 'LONE_WOLF');
  if (wolves.length > 0) {
    const targets = alive.filter(p => p.role !== 'WOLF' && p.role !== 'LONE_WOLF');
    if (targets.length > 0) {
      const mainWolf = wolves.find(w => w.role === 'WOLF') || wolves[0];
      const decision = await makeAIDecision(mainWolf, alive, PHASES.NIGHT_KILL, ROLES);
      const victim = targets.find(p => p.id === decision.targetId) || targets[0];
      
      if (gameState.protectedPlayerId === victim.id) {
        addLog(`🐺 Người Sói cố giết Player #${victim.id} nhưng họ đã rời làng an toàn!`);
        addLog(`   💭 Lý do: "${decision.reasoning}"`);
        gameState.wolfVictimId = null;
      } else {
        gameState.wolfVictimId = victim.id;
        addLog(`🐺 Người Sói tấn công Player #${victim.id}...`);
        addLog(`   💭 Lý do: "${decision.reasoning}"`);
      }
    }
  }
};

export const dayPhase = async (players, gameState, addLog) => {
  const alive = players.filter(p => p.alive);
  
  if (alive.length === 0) return;
  
  const protectedId = gameState.protectedPlayerId;
  const canVote = alive.filter(p => p.id !== protectedId);
  
  if (protectedId) {
    const protectedP = players.find(p => p.id === protectedId);
    if (protectedP && protectedP.alive) {
      addLog(`🏠 Player #${protectedId} (${ROLES[protectedP.role].icon}) đã rời làng và an toàn hôm nay`);
    }
  }
  
  addLog(`👥 Còn ${alive.length} người sống (${canVote.length} người tham gia vote)`);
  
  const votes = {};
  for (const voter of canVote) {
    const decision = await makeAIDecision(voter, canVote, PHASES.DAY_VOTE, ROLES);
    const target = decision.targetId;
    
    if (target) {
      votes[target] = (votes[target] || 0) + 1;
      const targetPlayer = alive.find(p => p.id === target);
      addLog(`   Player #${voter.id} (${ROLES[voter.role].icon}) vote #${target} (${ROLES[targetPlayer.role].icon}): "${decision.reasoning}"`);
    }
  }
  
  if (Object.keys(votes).length > 0) {
    const lynchId = parseInt(Object.keys(votes).reduce((a, b) => 
      votes[a] > votes[b] ? a : b
    ));
    
    const lynched = players.find(p => p.id === lynchId);
    lynched.alive = false;
    
    addLog(`⚖️ Player #${lynchId} (${ROLES[lynched.role].icon} ${ROLES[lynched.role].name}) bị TREO CỔ với ${votes[lynchId]} phiếu!`);

    if (lynched.role === 'HUNTER') {
      await hunterPhase(lynched, players, addLog);
    }
  } else {
    addLog(`⚖️ Không ai bị treo cổ`);
  }
  
  gameState.protectedPlayerId = null;
};

export const runGame = async (selectedRoles, setLog, setGameState, setIsRunning) => {
  setIsRunning(true);
  setLog([]);
  
  const players = initializePlayers(selectedRoles);
  const addLog = (message) => setLog(prev => [...prev, message]);
  
  addLog('🎮 GAME BẮT ĐẦU!');
  addLog(`👥 Tổng số: ${players.length} người`);
  
  // Log roles
  const villagers = players.filter(p => p.role === 'VILLAGER').length;
  const seers = players.filter(p => p.role === 'SEER').length;
  const elders = players.filter(p => p.role === 'ELDER').length;
  const lycans = players.filter(p => p.role === 'LYCAN').length;
  const hunters = players.filter(p => p.role === 'HUNTER').length;
  const witches = players.filter(p => p.role === 'WITCH').length;
  const loneWolves = players.filter(p => p.role === 'LONE_WOLF').length;
  const wolves = players.filter(p => p.role === 'WOLF').length;
  const shamans = players.filter(p => p.role === 'WOLF_SHAMAN').length;
  
  addLog(`   - ${villagers} Dân Làng 👨‍🌾`);
  if (seers > 0) addLog(`   - ${seers} Tiên Tri 🔮`);
  if (elders > 0) addLog(`   - ${elders} Phù Thủy Già 🧙‍♀️`);
  if (lycans > 0) addLog(`   - ${lycans} Người Hóa Sói 🌕`);
  if (hunters > 0) addLog(`   - ${hunters} Thợ Săn 🎯`);
  if (witches > 0) addLog(`   - ${witches} Phù Thủy 🧪`);
  if (loneWolves > 0) addLog(`   - ${loneWolves} Sói Cô Đơn 🐺💔`);
  addLog(`   - ${wolves} Người Sói 🐺`);
  if (shamans > 0) addLog(`   - ${shamans} Pháp Sư Sói 🌙`);
  addLog('');
  
  let night = 0;
  let winner = null;
  const gameState = { protectedPlayerId: null };
  
  while (!winner && night < 20) {
    night++;
    
    addLog(`🌙 === ĐÊM ${night} ===`);
    
    await elderPhase(players, gameState, addLog);
    await shamanPhase(players, addLog);
    await seerPhase(players, addLog);
    await nightPhase(players, gameState, addLog);
    await witchPhase(players, gameState, addLog);
    
    winner = checkWinner(players);
    if (winner) break;
    
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