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
        knownFunctional: [],
        isLover: false,
        loverId: null,
        loverFaction: null, // 'lovers' hoặc null
        lastProtected: null,
        lastProtected: null,
        hasHealPotion: roleConfig.type === 'WITCH',
        hasPoisonPotion: roleConfig.type === 'WITCH',
        knownTriadMembers: [],
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
      const deadLover = triggerLoverDeath(victim, players, addLog, ROLES);

      if (victim.role === 'HUNTER') {
        await hunterPhase(victim, players, addLog);
      }
      if (deadLover && deadLover.role === 'HUNTER') {
        await hunterPhase(deadLover, players, addLog);
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
        const deadLover = triggerLoverDeath(victim, players, addLog, ROLES);
        addLog(`   💭 "${decision.reasoning}"`);

        if (poisonTarget.role === 'HUNTER') {
          await hunterPhase(poisonTarget, players, addLog); 
        }
        if (deadLover && deadLover.role === 'HUNTER') {
          await hunterPhase(deadLover, players, addLog);
        }
      }

      if (victimId && gameState.wolfVictimId) {
        victim.alive = false;
        addLog(`💀 Player #${victim.id} (${ROLES[victim.role].icon} ${ROLES[victim.role].name}) đã chết vì bị Người Sói giết!`);
        const deadLover = triggerLoverDeath(victim, players, addLog, ROLES);

        if (victim.role === 'HUNTER') {
          await hunterPhase(victim, players, addLog);
        }

        if (deadLover && deadLover.role === 'HUNTER') {
          await hunterPhase(deadLover, players, addLog);
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
        const deadLover = triggerLoverDeath(victim, players, addLog, ROLES);

        if (victim.role === 'HUNTER') {
          await hunterPhase(victim, players, addLog);
        }

        if (deadLover && deadLover.role === 'HUNTER') {
          await hunterPhase(deadLover, players, addLog);
        }
      }
    }
  }

  gameState.wolfVictimId = null;
};

const triggerLoverDeath = (deadPlayer, players, addLog, ROLES) => {
  if (!deadPlayer.isLover || !deadPlayer.loverId) return null;
  
  const lover = players.find(p => p.id === deadPlayer.loverId);
  
  if (lover && lover.alive) {
    lover.alive = false;
    addLog(`💔 Player #${lover.id} (${ROLES[lover.role].icon} ${ROLES[lover.role].name}) chết theo tình nhân!`);
    return lover;
  }
  
  return null;
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
  triggerLoverDeath(target, players, addLog, ROLES);
};

export const triadRevealPhase = async (players, addLog) => {
  const alive = players.filter(p => p.alive);
  const triads = alive.filter(p => p.role === 'TRIAD_MEMBER');
  
  if (triads.length === 0) return;
  
  // Get all Triad member IDs
  const triadIds = triads.map(t => t.id);
  
  addLog(`🤝 Hội Tam Điểm thức dậy và nhận ra nhau...`);
  
  // Each Triad member knows all other members
  for (const triad of triads) {
    const otherMembers = triadIds.filter(id => id !== triad.id);
    triad.knownTriadMembers = otherMembers;
    
    if (otherMembers.length > 0) {
      addLog(`   Player #${triad.id} biết các thành viên khác: ${otherMembers.map(id => `#${id}`).join(', ')}`);
    } else {
      addLog(`   Player #${triad.id} là thành viên duy nhất`);
    }
  }
  
  addLog(`   💡 LƯU Ý: Tuyệt đối KHÔNG được tiết lộ trong game!`);
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

export const auraSeerPhase = async (players, addLog) => {
  const alive = players.filter(p => p.alive);
  const auraSeers = alive.filter(p => p.role === 'AURA_SEER');
  
  if (auraSeers.length === 0) return;
  
  // Danh sách role CÓ chức năng
  const FUNCTIONAL_ROLES = [
    'SEER', 'ELDER', 'LYCAN', 'HUNTER', 'WITCH', 
    'WOLF_SHAMAN', 'LONE_WOLF', 'AURA_SEER'
  ];
  
  for (const auraSeer of auraSeers) {
    const targets = alive.filter(p => p.id !== auraSeer.id);
    
    if (targets.length === 0) continue;
    
    const decision = await makeAIDecision(auraSeer, alive, PHASES.AURA_SEER_CHECK, ROLES);
    const target = targets.find(p => p.id === decision.targetId) || targets[0];
    
    const hasPower = FUNCTIONAL_ROLES.includes(target.role);
    
    if (hasPower && !auraSeer.knownFunctional.includes(target.id)) {
      auraSeer.knownFunctional.push(target.id);
    }
    
    addLog(`✨ Tiên Tri Hào Quang check Player #${target.id} → ${hasPower ? '✨ CÓ CHỨC NĂNG!' : '❌ Không có chức năng (Dân/Sói thuần)'}`);
    addLog(`   💭 "${decision.reasoning}"`);
  }
};

export const cupidPhase = async (players, gameState, addLog) => {
  const alive = players.filter(p => p.alive);
  const cupids = alive.filter(p => p.role === 'CUPID');
  
  if (cupids.length === 0) return;
  
  for (const cupid of cupids) {
    const targets = alive; // Cupid có thể chọn chính mình
    
    if (targets.length < 2) continue;
    
    const decision = await makeAIDecision(cupid, alive, PHASES.CUPID_LINK, ROLES);
    
    let lover1 = alive.find(p => p.id === decision.lover1);
    let lover2 = alive.find(p => p.id === decision.lover2);
    
    // Fallback nếu AI lỗi
    if (!lover1 || !lover2 || lover1.id === lover2.id) {
      lover1 = targets[0];
      lover2 = targets[1];
    }
    
    // Link lovers
    lover1.isLover = true;
    lover1.loverId = lover2.id;
    lover2.isLover = true;
    lover2.loverId = lover1.id;
    
    // Determine faction
    const newFaction = determineLoversFaction(lover1, lover2, ROLES);
    
    if (newFaction === 'lovers') {
      lover1.loverFaction = 'lovers';
      lover2.loverFaction = 'lovers';
      lover1.faction = 'neutral'; // Override faction
      lover2.faction = 'neutral';
      addLog(`💘 Cupid chọn Player #${lover1.id} (${ROLES[lover1.role].icon}) ❤️ Player #${lover2.id} (${ROLES[lover2.role].icon})`);
      addLog(`   💑 Họ trở thành PHE LOVERS (độc lập) - thắng khi chỉ còn 2 người họ sống sót!`);
    } else if (newFaction === 'villager') {
      lover1.loverFaction = 'villager';
      lover2.loverFaction = 'villager';
      lover1.faction = 'villager';
      lover2.faction = 'villager';
      addLog(`💘 Cupid chọn Player #${lover1.id} (${ROLES[lover1.role].icon}) ❤️ Player #${lover2.id} (${ROLES[lover2.role].icon})`);
      addLog(`   👨‍🌾 Cả 2 về PHE DÂN LÀNG`);
    } else {
      // Giữ nguyên faction
      addLog(`💘 Cupid chọn Player #${lover1.id} (${ROLES[lover1.role].icon}) ❤️ Player #${lover2.id} (${ROLES[lover2.role].icon})`);
      addLog(`   ❤️ Họ giữ nguyên phe nhưng là đồng minh tuyệt đối!`);
    }
    
    addLog(`   💭 "${decision.reasoning}"`);
    addLog(`   📋 Lover 1 biết: Player #${lover2.id} là ${ROLES[lover2.role].name}`);
    addLog(`   📋 Lover 2 biết: Player #${lover1.id} là ${ROLES[lover1.role].name}`);
    
    // Save to gameState
    gameState.lovers = [lover1.id, lover2.id];
  }
};

// Helper function
const determineLoversFaction = (player1, player2, ROLES) => {
  const role1 = ROLES[player1.role];
  const role2 = ROLES[player2.role];
  
  const f1 = role1.faction;
  const f2 = role2.faction;
  
  // Helper function to get faction category
  const getCategory = (faction) => {
    if (faction === 'villager' || faction === 'villager_helper') return 'villager';
    if (faction === 'wolf' || faction === 'wolf_helper') return 'wolf';
    return 'other'; // neutral, vampire, converter
  };
  
  const cat1 = getCategory(f1);
  const cat2 = getCategory(f2);
  
  // Case 1: Cùng category → giữ nguyên
  if (cat1 === cat2) {
    return cat1;
  }
  
  // Case 2: Có ít nhất 1 neutral/vampire/converter → Lovers
  if (cat1 === 'other' || cat2 === 'other') {
    return 'lovers';
  }
  
  // Case 3: Villager vs Wolf
  // Check nếu có helper
  const hasHelper = (f1 === 'villager_helper' || f1 === 'wolf_helper' || 
                     f2 === 'villager_helper' || f2 === 'wolf_helper');
  const hasCoreWolf = (player1.role === 'WOLF' || player2.role === 'WOLF');
  
  // Nếu có helper và KHÔNG có core WOLF → về Dân
  if (hasHelper && !hasCoreWolf) {
    return 'villager';
  }
  
  // Còn lại → Lovers
  return 'lovers';
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

    const deadLover = triggerLoverDeath(lynched, players, addLog, ROLES);
    
    addLog(`⚖️ Player #${lynchId} (${ROLES[lynched.role].icon} ${ROLES[lynched.role].name}) bị TREO CỔ với ${votes[lynchId]} phiếu!`);

    if (lynched.role === 'HUNTER') {
      await hunterPhase(lynched, players, addLog);
    }
    if (deadLover && deadLover.role === 'HUNTER') {
      await hunterPhase(deadLover, players, addLog);
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
  const auraSeers = players.filter(p => p.role === 'AURA_SEER').length;
  const cupids = players.filter(p => p.role === 'CUPID').length;
  const elders = players.filter(p => p.role === 'ELDER').length;
  const lycans = players.filter(p => p.role === 'LYCAN').length;
  const hunters = players.filter(p => p.role === 'HUNTER').length;
  const witches = players.filter(p => p.role === 'WITCH').length;
  const triads = players.filter(p => p.role === 'TRIAD_MEMBER').length;
  const loneWolves = players.filter(p => p.role === 'LONE_WOLF').length;
  const wolves = players.filter(p => p.role === 'WOLF').length;
  const shamans = players.filter(p => p.role === 'WOLF_SHAMAN').length;
  
  addLog(`   - ${villagers} Dân Làng 👨‍🌾`);
  if (seers > 0) addLog(`   - ${seers} Tiên Tri 🔮`);
  if (auraSeers > 0) addLog(`   - ${auraSeers} Tiên Tri Hào Quang ✨`);
  if (cupids > 0) addLog(`   - ${cupids} Thần Tình Yêu 💘`);
  if (elders > 0) addLog(`   - ${elders} Phù Thủy Già 🧙‍♀️`);
  if (lycans > 0) addLog(`   - ${lycans} Người Hóa Sói 🌕`);
  if (hunters > 0) addLog(`   - ${hunters} Thợ Săn 🎯`);
  if (witches > 0) addLog(`   - ${witches} Phù Thủy 🧪`);
  if (triads > 0) addLog(`   - ${triads} Hội Viên Tam Điểm 🤝`);
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

    if (night === 1) {
      await triadRevealPhase(players, addLog);
    }
    if (night === 1) {
      await cupidPhase(players, gameState, addLog);
    }
    
    await elderPhase(players, gameState, addLog);
    await shamanPhase(players, addLog);
    await seerPhase(players, addLog);
    await auraSeerPhase(players, addLog);
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