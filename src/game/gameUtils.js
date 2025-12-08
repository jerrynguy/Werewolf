/**
 * Filter players by role(s)
 * @param {Array} players - Array of players
 * @param {string|string[]} roles - Single role or array of roles
 * @returns {Array} Filtered players
 */
export const filterByRole = (players, roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return players.filter(p => roleArray.includes(p.role));
};

/**
 * Filter players by faction(s)
 * @param {Array} players - Array of players
 * @param {string|string[]} factions - Single faction or array of factions
 * @returns {Array} Filtered players
 */
export const filterByFaction = (players, factions) => {
  const factionArray = Array.isArray(factions) ? factions : [factions];
  return players.filter(p => factionArray.includes(p.faction));
};

/**
 * Get alive players
 * @param {Array} players - Array of players
 * @returns {Array} Alive players
 */
export const getAlivePlayers = (players) => {
  return players.filter(p => p.alive);
};

/**
 * Get dead players
 * @param {Array} players - Array of players
 * @returns {Array} Dead players
 */
export const getDeadPlayers = (players) => {
  return players.filter(p => !p.alive);
};

/**
 * Find player by ID
 * @param {Array} players - Array of players
 * @param {number} id - Player ID
 * @returns {Object|undefined} Player object or undefined
 */
export const findPlayerById = (players, id) => {
  return players.find(p => p.id === id);
};

/**
 * Count players by role
 * @param {Array} players - Array of players
 * @param {string} role - Role to count
 * @returns {number} Count
 */
export const countByRole = (players, role) => {
  return players.filter(p => p.role === role).length;
};

/**
 * Count players by faction
 * @param {Array} players - Array of players
 * @param {string} faction - Faction to count
 * @returns {number} Count
 */
export const countByFaction = (players, faction) => {
  return players.filter(p => p.faction === faction).length;
};

/**
 * Get random element from array
 * @param {Array} array - Input array
 * @returns {*} Random element
 */
export const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Check if player has role
 * @param {Object} player - Player object
 * @param {string|string[]} roles - Role(s) to check
 * @returns {boolean}
 */
export const hasRole = (player, roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(player.role);
};

/**
 * Check if player has faction
 * @param {Object} player - Player object
 * @param {string|string[]} factions - Faction(s) to check
 * @returns {boolean}
 */
export const hasFaction = (player, factions) => {
  const factionArray = Array.isArray(factions) ? factions : [factions];
  return factionArray.includes(player.faction);
};

/**
 * Kill player and trigger death effects
 * @param {Object} player - Player to kill
 * @param {Array} allPlayers - All players in game
 * @param {Function} addLog - Logging function
 * @param {Object} ROLES - Roles constant
 * @returns {Promise<void>}
 */
export const killPlayer = async (player, allPlayers, addLog, ROLES) => {
  player.alive = false;
  addLog(`💀 Player #${player.id} (${ROLES[player.role].icon} ${ROLES[player.role].name}) đã chết!`);
  
  // Trigger Hunter revenge if applicable
  if (player.role === 'HUNTER') {
    const { hunterPhase } = await import('./gameEngine.js');
    await hunterPhase(player, allPlayers, addLog);
  }
};

/**
 * Validate target is in valid target list
 * @param {number} targetId - Target player ID
 * @param {Array} validTargets - Array of valid target players
 * @returns {boolean}
 */
export const isValidTarget = (targetId, validTargets) => {
  return validTargets.some(p => p.id === targetId);
};