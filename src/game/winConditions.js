export const checkWinner = (players) => {
  const alive = players.filter(p => p.alive);
  
  if (alive.length === 0) return null;

  // CHECK LONE WOLF WIN FIRST (highest priority)
  const loneWolf = alive.find(p => p.role === 'LONE_WOLF');
  if (loneWolf) {
    // Lone Wolf thắng nếu:
    // - Chỉ còn mình (alive.length === 1)
    // - Hoặc còn mình + 1 người khác (alive.length === 2)
    if (alive.length <= 2) {
      return {
        faction: 'neutral',
        survivors: 1,
        icon: '🐺💔',
        message: 'Sói Cô Đơn chiến thắng!'
      };
    }
  }
  
  // Phe Dân = Dân Làng + Tiên Tri + Phù Thủy Già
  const villagerTeamCount = alive.filter(p => 
    p.role === 'VILLAGER' || p.role === 'SEER' || p.role === 'ELDER' || p.role === 'LYCAN' || p.role === 'HUNTER' || p.role === 'WITCH'
  ).length;
  
  // Phe Sói = Người Sói + Pháp Sư Sói
  const wolfTeamCount = alive.filter(p => 
    p.role === 'WOLF' || p.role === 'WOLF_SHAMAN'
  ).length;
  
  // Wolves win: số phe sói >= số phe dân
  if (wolfTeamCount > 0 && wolfTeamCount >= villagerTeamCount) {
    return { 
      faction: 'wolf', 
      survivors: wolfTeamCount, 
      icon: '🐺',
      message: 'Phe Sói chiến thắng!'
    };
  }
  
  // Villagers win: không còn ai phe sói
  if (wolfTeamCount === 0 && villagerTeamCount > 0) {
    return { 
      faction: 'villager', 
      survivors: villagerTeamCount, 
      icon: '👨‍🌾',
      message: 'Phe Dân Làng chiến thắng!'
    };
  }
  
  return null;
};

export const getGameStats = (players, night) => {
  const alive = players.filter(p => p.alive);
  const dead = players.filter(p => !p.alive);
  
  // Phe Dân bao gồm VILLAGER, SEER và ELDER
  const villagerTeamAlive = alive.filter(p => 
    p.role === 'VILLAGER' || p.role === 'SEER' || p.role === 'ELDER' || p.role === 'LYCAN' || p.role === 'HUNTER' || p.role === 'WITCH'
  );
  const villagerTeamDead = dead.filter(p => 
    p.role === 'VILLAGER' || p.role === 'SEER' || p.role === 'ELDER' || p.role === 'LYCAN' || p.role === 'HUNTER' || p.role === 'WITCH'
  );
  
  // Phe Sói bao gồm WOLF và WOLF_SHAMAN
  const wolfTeamAlive = alive.filter(p => 
    p.role === 'WOLF' || p.role === 'WOLF_SHAMAN'
  );
  const wolfTeamDead = dead.filter(p => 
    p.role === 'WOLF' || p.role === 'WOLF_SHAMAN'
  );

  // Lone Wolf tính riêng
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