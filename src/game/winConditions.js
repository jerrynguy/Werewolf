export const checkWinner = (players) => {
  const alive = players.filter(p => p.alive);
  
  if (alive.length === 0) return null;
  
  // Phe Dân = Dân Làng + Tiên Tri + Phù Thủy Già
  const villagerTeamCount = alive.filter(p => 
    p.role === 'VILLAGER' || p.role === 'SEER' || p.role === 'OLD WITCH'
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
  
  // Phe Dân bao gồm VILLAGER, SEER và OLD WITCH
  const villagerTeamAlive = alive.filter(p => 
    p.role === 'VILLAGER' || p.role === 'SEER' || p.role === 'OLD WITCH'
  );
  const villagerTeamDead = dead.filter(p => 
    p.role === 'VILLAGER' || p.role === 'SEER' || p.role === 'OLD WITCH'
  );
  
  // Phe Sói bao gồm WOLF và WOLF_SHAMAN
  const wolfTeamAlive = alive.filter(p => 
    p.role === 'WOLF' || p.role === 'WOLF_SHAMAN'
  );
  const wolfTeamDead = dead.filter(p => 
    p.role === 'WOLF' || p.role === 'WOLF_SHAMAN'
  );
  
  return {
    total: players.length,
    alive: alive.length,
    dead: dead.length,
    night: night,
    villagers: villagerTeamAlive.length,
    wolves: wolfTeamAlive.length,
    deadVillagers: villagerTeamDead.length,
    deadWolves: wolfTeamDead.length
  };
};