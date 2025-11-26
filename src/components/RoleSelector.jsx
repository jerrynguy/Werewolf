import React, { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { ROLES, FACTION_INFO, ROLES_BY_FACTION, FACTIONS } from '../game/roles';

const RoleSelector = ({ selectedRoles, setSelectedRoles }) => {
  const [showFactionMenu, setShowFactionMenu] = useState(false);
  const [expandedFaction, setExpandedFaction] = useState(null);

  const addRole = (roleId) => {
    setSelectedRoles([...selectedRoles, { type: roleId, count: 1 }]);
    setShowFactionMenu(false);
    setExpandedFaction(null);
  };

  const updateCount = (index, count) => {
    const newRoles = [...selectedRoles];
    newRoles[index].count = Math.max(0, parseInt(count) || 0);
    setSelectedRoles(newRoles);
  };

  const removeRole = (index) => {
    setSelectedRoles(selectedRoles.filter((_, i) => i !== index));
  };

  const toggleFaction = (factionId) => {
    setExpandedFaction(expandedFaction === factionId ? null : factionId);
  };

  return (
    <div className="space-y-4">
      {/* Selected Roles */}
      <div className="flex flex-wrap gap-3">
        {selectedRoles.map((role, index) => {
          const roleDef = ROLES[role.type];
          const factionInfo = FACTION_INFO[roleDef.faction];
          
          return (
            <div 
              key={index}
              className={`bg-${factionInfo.color}-500/10 border border-${factionInfo.color}-300/30 rounded-lg p-3 flex items-center gap-3 min-w-[200px]`}
            >
              <span className="text-3xl">{roleDef.icon}</span>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{roleDef.name}</div>
                <div className={`text-${factionInfo.color}-300 text-xs`}>{factionInfo.name}</div>
              </div>
              <input 
                type="number"
                value={role.count}
                onChange={(e) => updateCount(index, e.target.value)}
                className={`w-16 px-2 py-1 bg-white/5 border border-${factionInfo.color}-300/30 rounded text-white text-center`}
                min="0"
              />
              <button
                onClick={() => removeRole(index)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          );
        })}

        {/* Add Button */}
        <div className="relative">
          <button
            onClick={() => setShowFactionMenu(!showFactionMenu)}
            className="bg-white/5 hover:bg-white/10 border-2 border-dashed border-purple-300/30 hover:border-purple-300/60 rounded-lg p-3 w-[200px] h-full min-h-[80px] flex flex-col items-center justify-center gap-2 transition-all"
          >
            <Plus size={32} className="text-purple-300" />
            <span className="text-purple-200 text-sm">Thêm vai trò</span>
          </button>

          {/* Faction Menu */}
          {showFactionMenu && (
            <div className="absolute top-full left-0 mt-2 w-[320px] bg-slate-800 border border-purple-300/30 rounded-lg shadow-2xl z-50 max-h-[500px] overflow-y-auto">
              {Object.entries(FACTION_INFO).map(([factionId, factionInfo]) => {
                const rolesInFaction = ROLES_BY_FACTION[factionId];
                const hasRoles = rolesInFaction.length > 0;
                const isExpanded = expandedFaction === factionId;

                return (
                  <div key={factionId} className="border-b border-purple-300/10 last:border-b-0">
                    {/* Faction Header */}
                    <button
                      onClick={() => hasRoles && toggleFaction(factionId)}
                      disabled={!hasRoles}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${!hasRoles ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{factionInfo.icon}</span>
                        <div className="text-left">
                          <div className={`text-${factionInfo.color}-200 font-medium`}>
                            {factionInfo.name}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {hasRoles ? `${rolesInFaction.length} vai trò` : 'Đang phát triển'}
                          </div>
                        </div>
                      </div>
                      {hasRoles && (
                        isExpanded ? <ChevronUp className="text-purple-300" size={20} /> : <ChevronDown className="text-purple-300" size={20} />
                      )}
                    </button>

                    {/* Roles in Faction */}
                    {isExpanded && hasRoles && (
                      <div className="bg-black/20 px-2 py-2 space-y-1">
                        {rolesInFaction.map(roleId => {
                          const roleDef = ROLES[roleId];
                          const alreadySelected = selectedRoles.some(r => r.type === roleId);
                          
                          return (
                            <button
                              key={roleId}
                              onClick={() => !alreadySelected && addRole(roleId)}
                              disabled={alreadySelected}
                              className={`w-full px-3 py-2 rounded flex items-center gap-3 text-left transition-colors ${
                                alreadySelected 
                                  ? 'bg-gray-700/50 cursor-not-allowed opacity-50' 
                                  : 'hover:bg-white/10'
                              }`}
                            >
                              <span className="text-2xl">{roleDef.icon}</span>
                              <div className="flex-1">
                                <div className="text-white text-sm font-medium">{roleDef.name}</div>
                                <div className="text-gray-400 text-xs">{roleDef.description}</div>
                              </div>
                              {alreadySelected && (
                                <span className="text-green-400 text-xs">✓ Đã chọn</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {showFactionMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowFactionMenu(false);
            setExpandedFaction(null);
          }}
        />
      )}
    </div>
  );
};

export default RoleSelector;