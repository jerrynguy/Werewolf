/**
 * @typedef {Object} Player
 * @property {number} id - Player unique ID
 * @property {string} role - Role ID from ROLES constant
 * @property {string} faction - Faction ID from FACTIONS constant
 * @property {boolean} alive - Whether player is alive
 * @property {number[]} knownWolves - IDs of known wolves (for Seer)
 * @property {number[]} knownSeers - IDs of known seers (for Wolf Shaman)
 * @property {number|null} lastProtected - ID of last protected player (for Elder)
 * @property {boolean} hasHealPotion - Whether Witch has heal potion
 * @property {boolean} hasPoisonPotion - Whether Witch has poison potion
 */

/**
 * @typedef {Object} GameState
 * @property {number|null} protectedPlayerId - ID of player protected by Elder
 * @property {number|null} wolfVictimId - ID of player attacked by wolves
 */

/**
 * @typedef {Object} AIDecision
 * @property {number|null} targetId - Target player ID
 * @property {string} reasoning - AI's reasoning for the decision
 */

/**
 * @typedef {Object} WitchDecision
 * @property {'heal'|'poison'|'nothing'} action - Witch's chosen action
 * @property {number} [targetId] - Target ID (for poison action)
 * @property {string} reasoning - AI's reasoning
 */

/**
 * @typedef {Object} WinnerInfo
 * @property {string} faction - Winning faction
 * @property {number} survivors - Number of survivors
 * @property {string} icon - Emoji icon
 * @property {string} message - Victory message
 */

/**
 * @typedef {Object} RoleConfig
 * @property {string} type - Role type ID
 * @property {number} count - Number of players with this role
 */

export {}; // Make this a module