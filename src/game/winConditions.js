// Helper function to categorize players by team
const getTeamCounts = (alivePlayers) => {
  const villagerTeam = alivePlayers.filter(p => 
    p.role === 'VILLAGER' || 
    p.role === 'SEER' || 
    p.role === 'ELDER' || 
    p.role === 'LYCAN' || 
    p.role === 'HUNTER' || 
    p.role === 'WITCH'
  );
  
  const wolfTeam = alivePlayers.filter(p => 
    p.role === 'WOLF' || 
    p.role === 'WOLF_SHAMAN'
  );
  
  const loneWolves = alivePlayers.filter(p => p.role === 'LONE_WOLF');
  
  return {
    villagerCount: villagerTeam.length,
    wolfCount: wolfTeam.length,
    loneWolfCount: loneWolves.length,
    total: alivePlayers.length
  };
};

export const checkWinner = (players) => {
  const alive = players.filter(p => p.alive);
  
  if (alive.length === 0) return null;

  const { villagerCount, wolfCount, loneWolfCount, total } = getTeamCounts(alive);

  // ✅ FIX: Lone Wolf win condition - must check who else is alive
  const loneWolf = alive.find(p => p.role === 'LONE_WOLF');
  if (loneWolf) {
    // Lone Wolf thắng nếu:
    // 1. Chỉ còn mình (total === 1)
    if (total === 1) {
      return {
        faction: 'neutral',
        survivors: 1,
        icon: '🐺💔',
        message: 'Sói Cô Đơn chiến thắng! (Chỉ còn lại 1 mình)'
      };
    }
    
    // 2. Còn mình + 1 Villager (wolfCount === 0 && villagerCount === 1)
    if (total === 2 && wolfCount === 0 && villagerCount === 1) {
      return {
        faction: 'neutral',
        survivors: 1,
        icon: '🐺💔',
        message: 'Sói Cô Đơn chiến thắng! (Còn 1v1 với Dân)'
      };
    }
  }
  
  // Wolves win: số phe sói >= số phe dân (không tính Lone Wolf)
  if (wolfCount > 0 && wolfCount >= villagerCount) {
    return { 
      faction: 'wolf', 
      survivors: wolfCount, 
      icon: '🐺',
      message: 'Phe Sói chiến thắng!'
    };
  }
  
  // Villagers win: không còn ai phe sói (bao gồm Lone Wolf)
  // ✅ FIX: Lone Wolf cũng phải chết thì Dân mới thắng
  if (wolfCount === 0 && loneWolfCount === 0 && villagerCount > 0) {
    return { 
      faction: 'villager', 
      survivors: villagerCount, 
      icon: '👨‍🌾',
      message: 'Phe Dân Làng chiến thắng!'
    };
  }
  
  return null;
};

export const getGameStats = (players, night) => {
  const alive = players.filter(p => p.alive);
  const dead = players.filter(p => !p.alive);
  
  const villagerTeamAlive = alive.filter(p => 
    p.role === 'VILLAGER' || 
    p.role === 'SEER' || 
    p.role === 'ELDER' || 
    p.role === 'LYCAN' || 
    p.role === 'HUNTER' || 
    p.role === 'WITCH'
  );
  
  const villagerTeamDead = dead.filter(p => 
    p.role === 'VILLAGER' || 
    p.role === 'SEER' || 
    p.role === 'ELDER' || 
    p.role === 'LYCAN' || 
    p.role === 'HUNTER' || 
    p.role === 'WITCH'
  );
  
  const wolfTeamAlive = alive.filter(p => 
    p.role === 'WOLF' || 
    p.role === 'WOLF_SHAMAN'
  );
  
  const wolfTeamDead = dead.filter(p => 
    p.role === 'WOLF' || 
    p.role === 'WOLF_SHAMAN'
  );

  const loneWolfAlive = alive.filter(p => p.role === 'LONE_WOLF').length;
  const loneWolfDead = dead.filter(p => p.role === 'LONE_WOLF').length;
  
  return {
    total: players.length,
    alive: alive.length,
    dead: dead.length,
    night: night,
    villagers: villagerTeamAlive.length,
    wolves: wolfTeamAlive.length,
    deadVillagers: villagerTeamDead.length,
    deadWolves: wolfTeamDead.length,
    loneWolves: loneWolfAlive,
    deadLoneWolves: loneWolfDead
  };
};