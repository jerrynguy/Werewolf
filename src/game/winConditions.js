export const checkWinner = (players) => {
  const alive = players.filter(p => p.alive);
  
  if (alive.length === 0) return null;
  
  const villagerCount = alive.filter(p => p.role === 'VILLAGER').length;
  const wolfCount = alive.filter(p => p.role === 'WOLF').length;
  
  // Wolves win: số sói >= số dân
  if (wolfCount > 0 && wolfCount >= villagerCount) {
    return { 
      faction: 'wolf', 
      survivors: wolfCount, 
      icon: '🐺',
      message: 'Người Sói chiến thắng!'
    };
  }
  
  // Villagers win: không còn sói
  if (wolfCount === 0 && villagerCount > 0) {
    return { 
      faction: 'villager', 
      survivors: villagerCount, 
      icon: '👨‍🌾',
      message: 'Dân Làng chiến thắng!'
    };
  }
  
  return null;
};

export const getGameStats = (players, night) => {
  const alive = players.filter(p => p.alive);
  const dead = players.filter(p => !p.alive);
  
  return {
    total: players.length,
    alive: alive.length,
    dead: dead.length,
    night: night,
    villagers: alive.filter(p => p.role === 'VILLAGER').length,
    wolves: alive.filter(p => p.role === 'WOLF').length,
    deadVillagers: dead.filter(p => p.role === 'VILLAGER').length,
    deadWolves: dead.filter(p => p.role === 'WOLF').length
  };
};