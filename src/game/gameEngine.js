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
        lastProtected: null, // For Elder to track last protected player
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
    // Không thể bảo vệ chính mình, người đã chết, hoặc người vừa được bảo vệ đêm trước
    const targets = alive.filter(p => 
      p.id !== elder.id && 
      p.id !== elder.lastProtected
    );
    
    if (targets.length === 0) {
      gameState.protectedPlayerId = null;
      continue;
    }
    
    const decision = await makeAIDecision(elder, alive, 'elder_protect', ROLES, elder.lastProtected);
    const target = targets.find(p => p.id === decision.targetId) || targets[0];
    
    // Lưu người được bảo vệ vào game state
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
    // Không có Witch, victim chết luôn
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

    // Witch biết ai sắp chết
    const decision = await makeAIDecision(
      witch, 
      alive, 
      'witch_decide', 
      ROLES, 
      null,
      victimId,
      witch.hasHealPotion,
      witch.hasPoisonPotion
    );

    // Xử lý quyết định của Witch
    if (decision.action === 'heal' && witch.hasHealPotion && victim) {
      witch.hasHealPotion = false;
      addLog(`🧪 Phù Thủy dùng Bình Cứu 💚 để cứu Player #${victimId}!`);
      addLog(`   💭 "${decision.reasoning}"`);
      gameState.wolfVictimId = null; // Nạn nhân được cứu
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

      // Victim của Sói vẫn chết (nếu không được cứu)
      if (victimId && gameState.wolfVictimId) {
        victim.alive = false;
        addLog(`💀 Player #${victim.id} (${ROLES[victim.role].icon} ${ROLES[victim.role].name}) đã chết vì bị Người Sói giết!`);

        if (victim.role === 'HUNTER') {
          await hunterPhase(victim, players, addLog);
        }
      }

    } else {
      // Witch không làm gì
      addLog(`🧪 Phù Thủy không sử dụng thuốc đêm nay`);
      if (decision.reasoning) {
        addLog(`   💭 "${decision.reasoning}"`);
      }

      // Victim chết
      if (victimId && gameState.wolfVictimId) {
        victim.alive = false;
        addLog(`💀 Player #${victim.id} (${ROLES[victim.role].icon} ${ROLES[victim.role].name}) đã chết vì bị Người Sói giết!`);

        if (victim.role === 'HUNTER') {
          await hunterPhase(victim, players, addLog);
        }
      }
    }
  }

  gameState.wolfVictimId = null; // Reset nạn nhân sau khi xử lý
};

export const hunterPhase = async (deadHunter, players, addLog) => {
  const alive = players.filter(p => p.alive);

  if (alive.length === 0) return;

  addLog(`💥 Thợ Săn Player #${deadHunter.id} kích hoạt khả năng trước khi chết!`);

  const decision = await makeAIDecision(deadHunter, alive, 'hunter_revenge', ROLES);
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
    
    // PASSIVE ABILITIES:
    // - Wolf Shaman sẽ hiện là "Không phải sói"
    // - Lycan sẽ hiện là "Sói" (mặc dù thuộc phe Dân)
    const isWolf = target.role === 'WOLF' || target.role === 'LYCAN';
    
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
  const wolves = alive.filter(p => p.role === 'WOLF' || p.role === 'LONE_WOLF');
  if (wolves.length > 0) {
    // Targets: loại bỏ tất cả Sói (WOLF + LONE_WOLF)
    const targets = alive.filter(p => p.role !== 'WOLF' && p.role !== 'LONE_WOLF');
    if (targets.length > 0) {
      // Sói thường vote (hoặc Lone Wolf nếu không còn Sói thường)
      const mainWolf = wolves.find(w => w.role === 'WOLF') || wolves[0];
      const decision = await makeAIDecision(mainWolf, alive, 'night_kill', ROLES);
      const victim = targets.find(p => p.id === decision.targetId) || targets[0];
      
      // Kiểm tra nếu victim đang được Elder bảo vệ
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
  
  // Lọc ra người được bảo vệ (không tham gia vote)
  const protectedId = gameState.protectedPlayerId;
  const canVote = alive.filter(p => p.id !== protectedId);
  
  if (protectedId) {
    const protectedP = players.find(p => p.id === protectedId);
    if (protectedP && protectedP.alive) {
      addLog(`🏠 Player #${protectedId} (${ROLES[protectedP.role].icon}) đã rời làng và an toàn hôm nay`);
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

    // Nếu nạn nhân là Thợ Săn, kích hoạt khả năng trả thù
    if (lynched.role === 'HUNTER') {
      await hunterPhase(lynched, players, addLog);
    }
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
  const gameState = { protectedPlayerId: null }; // Track protected player
  
  while (!winner && night < 20) {
    night++;
    
    // NIGHT
    addLog(`🌙 === ĐÊM ${night} ===`);
    
    // 1. Elder protect ĐẦU TIÊN (bảo vệ cho ngày hôm sau)
    await elderPhase(players, gameState, addLog);
    
    // 2. Wolf Shaman check
    await shamanPhase(players, addLog);
    
    // 3. Seer check
    await seerPhase(players, addLog);
    
    // 4. Wolves attack
    await nightPhase(players, gameState, addLog);
    
    // 5. Witch quyết định (cứu hoặc giết)
    await witchPhase(players, gameState, addLog);
    
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