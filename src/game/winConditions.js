export const checkWinner = (players) => {
  const alive = players.filter(p => p.alive);
  
  if (alive.length === 0) return null;
  
  // Tính phe Dân = Dân Làng + Tiên Tri (cả 2 đều thuộc villager team)
  const villagerTeamCount = alive.filter(p => 
    p.role === 'VILLAGER' || p.role === 'SEER'
  ).length;
  
  const wolfCount = alive.filter(p => p.role === 'WOLF').length;
  
  // Wolves win: số sói >= số dân (bao gồm cả Tiên Tri)
  if (wolfCount > 0 && wolfCount >= villagerTeamCount) {
    return { 
      faction: 'wolf', 
      survivors: wolfCount, 
      icon: '🐺',
      message: 'Người Sói chiến thắng!'
    };
  }
  
  // Villagers win: không còn sói
  if (wolfCount === 0 && villagerTeamCount > 0) {
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
  
  // Phe Dân bao gồm cả VILLAGER và SEER
  const villagerTeamAlive = alive.filter(p => 
    p.role === 'VILLAGER' || p.role === 'SEER'
  );
  const villagerTeamDead = dead.filter(p => 
    p.role === 'VILLAGER' || p.role === 'SEER'
  );
  
  return {
    total: players.length,
    alive: alive.length,
    dead: dead.length,
    night: night,
    villagers: villagerTeamAlive.length,
    wolves: alive.filter(p => p.role === 'WOLF').length,
    deadVillagers: villagerTeamDead.length,
    deadWolves: dead.filter(p => p.role === 'WOLF').length
  };
};