// === PHASE CONSTANTS ===
export const PHASES = {
  NIGHT_KILL: 'night_kill',
  DAY_VOTE: 'day_vote',
  SEER_CHECK: 'seer_check',
  SHAMAN_CHECK: 'shaman_check',
  ELDER_PROTECT: 'elder_protect',
  WITCH_DECIDE: 'witch_decide',
  HUNTER_REVENGE: 'hunter_revenge',
  AURA_SEER_CHECK: 'aura_seer_check',
  CUPID_LINK: 'cupid_link'
};

// === HELPER FUNCTIONS ===
const getGameStateInfo = (alivePlayers) => {
  return {
    villagerCount: alivePlayers.filter(p => p.role === 'VILLAGER').length,
    seerCount: alivePlayers.filter(p => p.role === 'SEER').length,
    auraSeerCount: alivePlayers.filter(p => p.role === 'AURA_SEER').length,
    cupidCount: alivePlayers.filter(p => p.role === 'CUPID').length,
    elderCount: alivePlayers.filter(p => p.role === 'ELDER').length,
    lycanCount: alivePlayers.filter(p => p.role === 'LYCAN').length,
    hunterCount: alivePlayers.filter(p => p.role === 'HUNTER').length,
    witchCount: alivePlayers.filter(p => p.role === 'WITCH').length,
    triadCount: alivePlayers.filter(p => p.role === 'TRIAD_MEMBER').length,
    wolfCount: alivePlayers.filter(p => p.role === 'WOLF').length,
    loneWolfCount: alivePlayers.filter(p => p.role === 'LONE_WOLF').length,
    shamanCount: alivePlayers.filter(p => p.role === 'WOLF_SHAMAN').length
  };
};

const formatGameStateText = (state) => {
  return `TÌNH HÌNH HIỆN TẠI:
- Dân Làng còn sống: ${state.villagerCount}
- Tiên Tri còn sống: ${state.seerCount}
- Tiên Tri Hào Quang còn sống: ${state.auraSeerCount}
- Thần Tình Yêu còn sống: ${state.cupidCount}
- Phù Thủy Già còn sống: ${state.elderCount}
- Người Hóa Sói còn sống: ${state.lycanCount}
- Thợ Săn còn sống: ${state.hunterCount}
- Phù Thủy còn sống: ${state.witchCount}
- Hội Viên Tam Điểm còn sống: ${state.triadCount} 
- Sói Cô Đơn còn sống: ${state.loneWolfCount}
- Người Sói còn sống: ${state.wolfCount}
- Pháp Sư Sói còn sống: ${state.shamanCount}`;
};

const getKnowledgeText = (player, phase) => {
  let knowledge = '';
  
  // Triad knowledge - CRITICAL: Must not reveal in reasoning!
  if (player.role === 'TRIAD_MEMBER' && player.knownTriadMembers?.length > 0) {
    knowledge += `\n\n⚠️ THÔNG TIN BÍ MẬT (KHÔNG ĐƯỢC NHỚ TRONG REASONING):
- Bạn biết các thành viên Hội: ${player.knownTriadMembers.map(id => `#${id}`).join(', ')}
- Họ cũng biết bạn
- NHƯNG: Tuyệt đối KHÔNG nhắc đến điều này trong reasoning!
- Hành động như Dân Làng độc lập!

⛔ CẤM TUYỆT ĐỐI trong reasoning:
- "thành viên hội"
- "đồng đội của tôi" 
- "người tôi tin tưởng"
- "chúng ta"
- Bất kỳ ám chỉ nào về liên kết

✅ CHỈ ĐƯỢC NÓI:
- "Tôi nghĩ người này đáng tin"
- "Dựa trên logic cá nhân"
- "Theo phân tích của tôi"`;
  }
  
  // Seer knowledge
  if (player.role === 'SEER' && player.knownWolves?.length > 0) {
    knowledge += `\n\nTHÔNG TIN QUAN TRỌNG (chỉ bạn biết):
- Bạn ĐÃ KIỂM TRA và biết những người này là SÓI: ${player.knownWolves.map(id => `#${id}`).join(', ')}`;
    if (phase === PHASES.DAY_VOTE) {
      knowledge += `\n- Hãy vote lynch một trong những người này!
- KHÔNG nói bạn là Tiên Tri (sẽ bị Sói giết)`;
    }
  }
  
  // Shaman knowledge
  if (player.role === 'WOLF_SHAMAN' && player.knownSeers?.length > 0) {
    knowledge += `\n\nTHÔNG TIN QUAN TRỌNG (chỉ bạn biết):
- Bạn ĐÃ TÌM THẤY Tiên Tri: ${player.knownSeers.map(id => `#${id}`).join(', ')}`;
    if (phase === PHASES.DAY_VOTE) {
      knowledge += `\n- Hãy vote lynch Tiên Tri này để giúp phe Sói!
- KHÔNG tiết lộ bạn là Pháp Sư Sói`;
    }
  }

  // Aura Seer knowledge
  if (player.role === 'AURA_SEER' && player.knownFunctional?.length > 0) {
    knowledge += `\n\nTHÔNG TIN QUAN TRỌNG (chỉ bạn biết):
- Bạn ĐÃ KIỂM TRA và biết những người này CÓ CHỨC NĂNG: ${player.knownFunctional.map(id => `#${id}`).join(', ')}`;
    if (phase === PHASES.DAY_VOTE) {
      knowledge += `\n- Họ có thể là: Tiên Tri, Thợ Săn, Phù Thủy, Pháp Sư Sói, Sói Cô Đơn...
- Quan sát hành vi để xác định họ thuộc phe nào`;
    }
  }
  
  // Lone Wolf knowledge
  if (player.role === 'LONE_WOLF' && phase === PHASES.DAY_VOTE) {
    knowledge += `\n\nCHIẾN THUẬT SÓI CÔ ĐƠN:
- Bạn cần còn lại 1-2 người để THẮNG!
- Ưu tiên vote lynch SÓI THƯỜNG trước (bán đứng họ!)
- Sau đó mới giết Dân
- Giả vờ là Dân để không bị nghi ngờ`;
  }
  
  return knowledge;
};

// === BUILD PROMPT BY PHASE ===
const buildPromptForPhase = (phase, player, context, ROLES) => {
  const { alivePlayers, lastProtected, wolfVictimId, hasHealPotion, hasPoisonPotion } = context;
  const roleInfo = ROLES[player.role];
  const gameState = getGameStateInfo(alivePlayers);
  const stateText = formatGameStateText(gameState);
  const knowledgeText = getKnowledgeText(player, phase);
  
  let targets = [];
  let specificInstructions = '';
  
  switch (phase) {
    case PHASES.WITCH_DECIDE: {
      const victim = wolfVictimId ? alivePlayers.find(p => p.id === wolfVictimId) : null;
      const victimInfo = victim 
        ? `Player #${victim.id} đang bị Sói tấn công và sắp CHẾT!`
        : `KHÔNG có ai bị Sói tấn công đêm nay (có thể họ tấn công người được Elder bảo vệ)`;
      
      const potionStatus = `
TÌNH TRẠNG THUỐC CỦA BẠN:
- Bình Cứu 💚: ${hasHealPotion ? 'CÒN (có thể dùng)' : 'ĐÃ HẾT'}
- Bình Độc ☠️: ${hasPoisonPotion ? 'CÒN (có thể dùng)' : 'ĐÃ HẾT'}`;
      
      const poisonTargets = alivePlayers.filter(p => p.id !== player.id);
      
      specificInstructions = `
${potionStatus}

THÔNG TIN ĐÊM NAY:
${victimInfo}

BẠN CÓ 3 LỰA CHỌN:
1. Dùng Bình Cứu 💚 để cứu Player #${wolfVictimId || 'N/A'} (nếu còn bình)
2. Dùng Bình Độc ☠️ để giết 1 người (nếu còn bình)
3. Không làm gì cả

${hasPoisonPotion ? `CÁC MỤC TIÊU CÓ THỂ ĐẦU ĐỘC:\n${poisonTargets.map(p => `- Player #${p.id}`).join('\n')}` : ''}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: 
  + Cứu người: {"action": "heal", "reasoning": "<string>"}
  + Giết người: {"action": "poison", "targetId": <number>, "reasoning": "<string>"}
  + Không làm gì: {"action": "nothing", "reasoning": "<string>"}`;
      break;
    }
    
    case PHASES.HUNTER_REVENGE: {
      targets = alivePlayers.filter(p => p.id !== player.id);
      specificInstructions = `
BẠN VỪA BỊ GIẾT! NHƯNG LÀ MỘT THỢ SĂN, BẠN CÓ THỂ TRẢ THÙ BẰNG CÁCH BẮN MỘT NGƯỜI KHÁC TRƯỚC KHI CHẾT.

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
      break;
    }
    
    case PHASES.ELDER_PROTECT: {
      targets = alivePlayers.filter(p => p.id !== player.id && p.id !== lastProtected);
      const lastProtectedInfo = lastProtected 
        ? `\n- Đêm trước bạn đã bảo vệ Player #${lastProtected} (KHÔNG thể chọn lại)`
        : '\n- Đây là lần đầu tiên bạn bảo vệ';
      
      specificInstructions = `
BAN ĐÊM - Chọn 1 người để BẢO VỆ vào ngày hôm sau.

NGƯỜI ĐƯỢC BẢO VỆ SẼ:
- Rời làng an toàn (không bị Sói giết)
- Không thể vote lynch
- Không bị vote lynch
${lastProtectedInfo}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
      break;
    }
    
    case PHASES.SHAMAN_CHECK: {
      targets = alivePlayers.filter(p => p.id !== player.id);
      const alreadyFound = player.knownSeers || [];
      const knownSeersInfo = alreadyFound.length > 0 
        ? `\n- Bạn ĐÃ TÌM THẤY Tiên Tri: ${alreadyFound.map(id => `#${id}`).join(', ')}`
        : '\n- Bạn chưa tìm thấy Tiên Tri nào';
      
      specificInstructions = `
BAN ĐÊM - Chọn 1 người để KIỂM TRA xem họ có phải TIÊN TRI không.
${knownSeersInfo}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
      break;
    }
    
    case PHASES.SEER_CHECK: {
      targets = alivePlayers.filter(p => p.id !== player.id);
      const alreadyChecked = player.knownWolves || [];
      const knownWolvesInfo = alreadyChecked.length > 0 
        ? `\n- Bạn ĐÃ BIẾT những người này là SÓI: ${alreadyChecked.map(id => `#${id}`).join(', ')}`
        : '\n- Bạn chưa tìm thấy Sói nào';
      
      specificInstructions = `
BAN ĐÊM - Chọn 1 người để KIỂM TRA xem họ có phải SÓI không.
${knownWolvesInfo}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
      break;
    }
    
    case PHASES.AURA_SEER_CHECK: {
      targets = alivePlayers.filter(p => p.id !== player.id);
      const alreadyChecked = player.knownFunctional || [];
      const knownInfo = alreadyChecked.length > 0 
        ? `\n- Bạn ĐÃ BIẾT những người có chức năng: ${alreadyChecked.map(id => `#${id}`).join(', ')}`
        : '\n- Bạn chưa tìm thấy ai có chức năng';
      
      specificInstructions = `
BAN ĐÊM - Chọn 1 người để KIỂM TRA xem họ có CHỨC NĂNG ĐẶC BIỆT hay không.
${knownInfo}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
      break;
    }

    case PHASES.CUPID_LINK: {
      targets = alivePlayers.filter(p => p.id !== player.id);
      
      specificInstructions = `
ĐÊM ĐẦU TIÊN - Chọn 2 người để trở thành CẶP ĐÔI TÌNH NHÂN.

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

LƯU Ý:
- Bạn CÓ THỂ chọn chính mình (Player #${player.id})
- Nếu 1 người chết → người kia chết theo
- Ưu tiên chọn người có vẻ quan trọng/mạnh

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"lover1": <number>, "lover2": <number>, "reasoning": "<string>"}
- lover1 và lover2 PHẢI KHÁC NHAU`;
      break;
    }
    
    case PHASES.NIGHT_KILL: {
      if (player.role === 'LONE_WOLF') {
        targets = alivePlayers.filter(p => p.role !== 'WOLF' && p.role !== 'LONE_WOLF');
      } else {
        targets = alivePlayers.filter(p => p.faction !== player.faction && p.role !== 'LONE_WOLF');
      }
      
      specificInstructions = `
BAN ĐÊM - Bạn phải chọn 1 người để giết.

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
      break;
    }
    
    case PHASES.DAY_VOTE: {
      targets = alivePlayers.filter(p => p.id !== player.id);
      specificInstructions = `
BAN NGÀY - Bạn phải bỏ phiếu lynch 1 người.

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
      break;
    }
  }
  
  return {
    prompt: `${roleInfo.aiPrompt}

${stateText}${knowledgeText}

${specificInstructions}`,
    targets
  };
};

// === MAIN AI DECISION FUNCTION ===
export const makeAIDecision = async (
  player, 
  alivePlayers, 
  phase, 
  ROLES, 
  lastProtected = null,
  wolfVictimId = null,
  hasHealPotion = false,
  hasPoisonPotion = false
) => {
  // Build context
  const context = {
    alivePlayers,
    lastProtected,
    wolfVictimId,
    hasHealPotion,
    hasPoisonPotion
  };
  
  // Special case: Witch with no potions
  if (phase === PHASES.WITCH_DECIDE && !hasHealPotion && !hasPoisonPotion) {
    return { action: 'nothing', reasoning: 'Đã hết cả 2 bình thuốc' };
  }
  
  // Build prompt and get targets
  const { prompt, targets } = buildPromptForPhase(phase, player, context, ROLES);
  
  // No valid targets
  if (targets.length === 0 && phase !== PHASES.WITCH_DECIDE) {
    return { targetId: null, reasoning: "Không có mục tiêu" };
  }
  
  try {
    console.log(`🤖 AI Request for Player #${player.id} (${player.role}) - Phase: ${phase}`);
    
    const response = await fetch("http://localhost:3001/api/ai-decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 150,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an AI playing Werewolf game. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;
    const decision = JSON.parse(aiMessage);
    
    console.log('✅ Parsed decision:', decision);
    
    // Validate decision based on phase
    if (phase === PHASES.WITCH_DECIDE) {
      if (decision.action === 'heal' || decision.action === 'nothing') {
        return decision;
      }
      if (decision.action === 'poison' && targets.find(p => p.id === decision.targetId)) {
        return decision;
      }
    } 

    if (phase === PHASES.CUPID_LINK) {
      const { lover1, lover2 } = decision;
      if (lover1 && lover2 && lover1 !== lover2) {
        const p1 = alivePlayers.find(p => p.id === lover1);
        const p2 = alivePlayers.find(p => p.id === lover2);
        if (p1 && p2) {
          return {
            lover1,
            lover2,
            reasoning: decision.reasoning
          };
        }
      }
      console.warn('⚠️ Invalid Cupid decision:', decision);
    } else {
      // Regular phases with targetId
      if (targets.find(p => p.id === decision.targetId)) {
        return {
          targetId: decision.targetId,
          reasoning: decision.reasoning
        };
      }
    }

    
    console.warn('⚠️ Invalid decision:', decision);
  } catch (err) {
    console.error('💥 AI error:', err);
  }
  
  // Fallback
  if (phase === PHASES.WITCH_DECIDE) {
    return { action: 'nothing', reasoning: 'Chọn ngẫu nhiên (AI lỗi)' };
  }

  if (phase === PHASES.CUPID_LINK) {
    const validTargets = alivePlayers.filter(p => p.id !== player.id);
    if (validTargets.length >= 2) {
      const l1 = validTargets[0];
      const l2 = validTargets[1];
      return {
        lover1: l1.id,
        lover2: l2.id,
        reasoning: 'Chọn ngẫu nhiên (AI lỗi)'
      };
    }
  }
  
  const randomTarget = targets[Math.floor(Math.random() * targets.length)];
  return {
    targetId: randomTarget.id,
    reasoning: "Chọn ngẫu nhiên (AI lỗi)"
  };
};