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
  const roleInfo = ROLES[player.role];
  
  const villagerCount = alivePlayers.filter(p => p.role === 'VILLAGER').length;
  const seerCount = alivePlayers.filter(p => p.role === 'SEER').length;
  const elderCount = alivePlayers.filter(p => p.role === 'ELDER').length;
  const lycanCount = alivePlayers.filter(p => p.role === 'LYCAN').length;
  const hunterCount = alivePlayers.filter(p => p.role === 'HUNTER').length;
  const witchCount = alivePlayers.filter(p => p.role === 'WITCH').length;
  const wolfCount = alivePlayers.filter(p => p.role === 'WOLF').length;
  const loneWolfCount = alivePlayers.filter(p => p.role === 'LONE_WOLF').length;  
  const shamanCount = alivePlayers.filter(p => p.role === 'WOLF_SHAMAN').length;
  
  let targets;
  let prompt;
  
  // === WITCH ACTION PHASE ===
  if (phase === 'witch_action') {
    const victim = wolfVictimId ? alivePlayers.find(p => p.id === wolfVictimId) : null;
    const victimInfo = victim 
      ? `Player #${victim.id} đang bị Sói tấn công và sắp CHẾT!`
      : `KHÔNG có ai bị Sói tấn công đêm nay (có thể họ tấn công người được Elder bảo vệ)`;
    
    const potionStatus = `
  TÌNH TRẠNG THUỐC CỦA BẠN:
  - Bình Cứu 💚: ${hasHealPotion ? 'CÒN (có thể dùng)' : 'ĐÃ HẾT'}
  - Bình Độc ☠️: ${hasPoisonPotion ? 'CÒN (có thể dùng)' : 'ĐÃ HẾT'}`;
    
    // Targets cho poison (không bao gồm chính mình)
    const poisonTargets = alivePlayers.filter(p => p.id !== player.id);
    
    prompt = `${roleInfo.aiPrompt}
 
  TÌNH HÌNH HIỆN TẠI:
  - Dân Làng còn sống: ${villagerCount}
  - Tiên Tri còn sống: ${seerCount}
  - Phù Thủy Già còn sống: ${elderCount}
  - Người Hóa Sói còn sống: ${lycanCount}
  - Thợ Săn còn sống: ${hunterCount}
  - Phù Thủy còn sống: ${witchCount}
  - Sói Cô Đơn còn sống: ${loneWolfCount}
  - Người Sói còn sống: ${wolfCount}
  - Pháp Sư Sói còn sống: ${shamanCount}
 
  ${potionStatus}
 
  THÔNG TIN ĐÊM NAY:
  ${victimInfo}
 
  BẠN CÓ 3 LỰA CHỌN:
  1. Dùng Bình Cứu 💚 để cứu Player #${wolfVictimId || 'N/A'} (nếu còn bình)
  2. Dùng Bình Độc ☠️ để giết 1 người (nếu còn bình)
  3. Không làm gì cả
 
  ${hasPoisonPotion ? `CÁC MỤC TIÊU CÓ THỂ ĐẦU ĐỘC:\n${poisonTargets.map(p => `- Player #${p.id}`).join('\n')}` : ''}
 
  CHIẾN THUẬT:
  - Nếu nạn nhân quan trọng (Tiên Tri?) → cứu
  - Nếu bạn biết ai là Sói → đầu độc họ
  - Đừng lãng phí thuốc vào người không quan trọng
  - Mỗi bình chỉ dùng 1 lần!
 
  QUY TẮC TRẢ LỜI:
  - CHỈ trả lời bằng JSON
  - KHÔNG thêm text nào khác
  - Format: 
    + Cứu người: {"action": "heal", "reasoning": "<string>"}
    + Giết người: {"action": "poison", "targetId": <number>, "reasoning": "<string>"}
    + Không làm gì: {"action": "nothing", "reasoning": "<string>"}`;
    
      if (!hasHealPotion && !hasPoisonPotion) {
        // Witch hết thuốc, không làm gì
        return { action: 'nothing', reasoning: 'Đã hết cả 2 bình thuốc' };
      }
    }

  // === HUNTER REVENGE PHASE ===
  else if (phase === 'hunter_revenge') {
    targets = alivePlayers.filter(p => p.id !== player.id);

    // Thợ Săn có thể bắn bất kỳ ai còn sống
    let knownWolvesInfo = '';
    if (player.knownWolves?.length > 0) {
      knownWolvesInfo = `\n\nBẠN BIẾT NHỮNG NGƯỜI NÀY LÀ SÓI: ${player.knownWolves.map(id => `#${id}`).join(', ')}
+ → HÃY BẮN MỘT TRONG SỐ HỌ!`;
    }

    prompt = `${roleInfo.aiPrompt}

BẠN VỪA BỊ GIẾT! NHƯNG LÀ MỘT THỢ SĂN, BẠN CÓ THỂ TRẢ THÙ BẰNG CÁCH BẮN MỘT NGƯỜI KHÁC TRƯỚC KHI CHẾT.

 TÌNH HÌNH HIỆN TẠI:
 - Dân Làng còn sống: ${villagerCount}
 - Tiên Tri còn sống: ${seerCount}
 - Phù Thủy Già còn sống: ${elderCount}
 - Người Hóa Sói còn sống: ${lycanCount}
 - Thợ Săn còn sống: ${hunterCount}
 - Phù Thủy còn sống: ${witchCount}
 - Sói Cô Đơn còn sống: ${loneWolfCount}
 - Người Sói còn sống: ${wolfCount}
 - Pháp Sư Sói còn sống: ${shamanCount}
 ${knownWolvesInfo}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

CHIEN THUẬT:
- Nếu bạn biết ai là Sói → BẮN HỌ!
- Chọn người bạn nghi ngờ nhất nếu không biết ai là Sói

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
  }
  
  // === ELDER PROTECT PHASE ===
  else if (phase === 'elder_protect') {
    // Không thể bảo vệ chính mình hoặc người vừa được bảo vệ đêm trước
    targets = alivePlayers.filter(p => 
      p.id !== player.id && 
      p.id !== lastProtected
    );
    
    const lastProtectedInfo = lastProtected 
      ? `\n- Đêm trước bạn đã bảo vệ Player #${lastProtected} (KHÔNG thể chọn lại)`
      : '\n- Đây là lần đầu tiên bạn bảo vệ';
    
    prompt = `${roleInfo.aiPrompt}

BAN ĐÊM - Chọn 1 người để BẢO VỆ vào ngày hôm sau.

NGƯỜI ĐƯỢC BẢO VỆ SẼ:
- Rời làng an toàn (không bị Sói giết)
- Không thể vote lynch
- Không bị vote lynch

 TÌNH HÌNH HIỆN TẠI:
 - Dân Làng còn sống: ${villagerCount}
 - Tiên Tri còn sống: ${seerCount}
 - Phù Thủy Già còn sống: ${elderCount}
 - Người Hóa Sói còn sống: ${lycanCount}
 - Thợ Săn còn sống: ${hunterCount}
 - Phù Thủy còn sống: ${witchCount}
 - Sói Cô Đơn còn sống: ${loneWolfCount}
 - Người Sói còn sống: ${wolfCount}
 - Pháp Sư Sói còn sống: ${shamanCount}
 ${knownWolvesInfo}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

CHIẾN THUẬT:
- Bảo vệ người có vẻ quan trọng (có thể là Tiên Tri)
- Tránh bảo vệ người nghi là Sói
- Đừng lãng phí vào người không quan trọng

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
  }
  // === WOLF SHAMAN CHECK PHASE ===
  else if (phase === 'shaman_check') {
    targets = alivePlayers.filter(p => p.id !== player.id); // Không check chính mình
    
    const alreadyFound = player.knownSeers || [];
    const knownSeersInfo = alreadyFound.length > 0 
      ? `\n- Bạn ĐÃ TÌM THẤY Tiên Tri: ${alreadyFound.map(id => `#${id}`).join(', ')}`
      : '\n- Bạn chưa tìm thấy Tiên Tri nào';
    
    prompt = `${roleInfo.aiPrompt}

BAN ĐÊM - Chọn 1 người để KIỂM TRA xem họ có phải TIÊN TRI không.

 TÌNH HÌNH HIỆN TẠI:
 - Dân Làng còn sống: ${villagerCount}
 - Tiên Tri còn sống: ${seerCount}
 - Phù Thủy Già còn sống: ${elderCount}
 - Người Hóa Sói còn sống: ${lycanCount}
 - Thợ Săn còn sống: ${hunterCount}
 - Phù Thủy còn sống: ${witchCount}
 - Sói Cô Đơn còn sống: ${loneWolfCount}
 - Người Sói còn sống: ${wolfCount}
 - Pháp Sư Sói còn sống: ${shamanCount}
 ${knownWolvesInfo}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

CHIẾN THUẬT:
- Ưu tiên check những người có vẻ thông minh, phân tích tốt
- KHÔNG check lại người đã biết là Tiên Tri
- Tìm ra Tiên Tri để vote lynch họ vào ban ngày

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
  }
  // === SEER CHECK PHASE ===
  else if (phase === 'seer_check') {
    targets = alivePlayers.filter(p => p.id !== player.id); // Không check chính mình
    
    const alreadyChecked = player.knownWolves || [];
    const knownWolvesInfo = alreadyChecked.length > 0 
      ? `\n- Bạn ĐÃ BIẾT những người này là SÓI: ${alreadyChecked.map(id => `#${id}`).join(', ')}`
      : '\n- Bạn chưa tìm thấy Sói nào';
    
    prompt = `${roleInfo.aiPrompt}

BAN ĐÊM - Chọn 1 người để KIỂM TRA xem họ có phải SÓI không.

 TÌNH HÌNH HIỆN TẠI:
 - Dân Làng còn sống: ${villagerCount}
 - Tiên Tri còn sống: ${seerCount}
 - Phù Thủy Già còn sống: ${elderCount}
 - Người Hóa Sói còn sống: ${lycanCount}
 - Thợ Săn còn sống: ${hunterCount}
 - Phù Thủy còn sống: ${witchCount}
 - Sói Cô Đơn còn sống: ${loneWolfCount}
 - Người Sói còn sống: ${wolfCount}
 - Pháp Sư Sói còn sống: ${shamanCount}
 ${knownWolvesInfo}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

CHIẾN THUẬT:
- Ưu tiên check những người bạn nghi ngờ nhất
- KHÔNG check lại người đã biết là Sói
- Tìm ra tất cả Sói để vote lynch họ

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
  }
  // === NIGHT KILL PHASE ===
  else if (phase === 'night_kill') {
    // Nếu là Lone Wolf: target là tất cả trừ Sói (để không lộ)
    // Nếu là Wolf thường: target là tất cả trừ Wolf team
    if (player.role === 'LONE_WOLF') {
      targets = alivePlayers.filter(p => p.role !== 'WOLF' && p.role !== 'LONE_WOLF');
    } else {
      targets = alivePlayers.filter(p => p.faction !== player.faction && p.role !== 'LONE_WOLF');
    }
    
    
    prompt = `${roleInfo.aiPrompt}

BAN ĐÊM - Bạn phải chọn 1 người để giết.

 TÌNH HÌNH HIỆN TẠI:
 - Dân Làng còn sống: ${villagerCount}
 - Tiên Tri còn sống: ${seerCount}
 - Phù Thủy Già còn sống: ${elderCount}
 - Người Hóa Sói còn sống: ${lycanCount}
 - Thợ Săn còn sống: ${hunterCount}
 - Phù Thủy còn sống: ${witchCount}
 - Sói Cô Đơn còn sống: ${loneWolfCount}
 - Người Sói còn sống: ${wolfCount}
 - Pháp Sư Sói còn sống: ${shamanCount}
 ${seerKnowledge}${shamanKnowledge}${loneWolfKnowledge}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id}`).join('\n')}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
  }
  // === DAY VOTE PHASE ===
  else {
    targets = alivePlayers.filter(p => p.id !== player.id);
    
    // Nếu là Seer, thêm thông tin về Sói đã biết
    let seerKnowledge = '';
    if (player.role === 'SEER' && player.knownWolves?.length > 0) {
      seerKnowledge = `\n\nTHÔNG TIN QUAN TRỌNG (chỉ bạn biết):
- Bạn ĐÃ KIỂM TRA và biết những người này là SÓI: ${player.knownWolves.map(id => `#${id}`).join(', ')}
- Hãy vote lynch một trong những người này!
- KHÔNG nói bạn là Tiên Tri (sẽ bị Sói giết)`;
    }
    
    // Nếu là Wolf Shaman, thêm thông tin về Seer đã tìm thấy
    let shamanKnowledge = '';
    if (player.role === 'WOLF_SHAMAN' && player.knownSeers?.length > 0) {
      shamanKnowledge = `\n\nTHÔNG TIN QUAN TRỌNG (chỉ bạn biết):
- Bạn ĐÃ TÌM THẤY Tiên Tri: ${player.knownSeers.map(id => `#${id}`).join(', ')}
- Hãy vote lynch Tiên Tri này để giúp phe Sói!
- KHÔNG tiết lộ bạn là Pháp Sư Sói`;
    }

    // Nếu là Lone Wolf, chiến thuật đặc biệt
    let loneWolfKnowledge = '';
    if (player.role === 'LONE_WOLF'){
      const remainingWolves = alivePlayers.filter(p => p.role === 'WOLF')
      const remainingVillagers = alivePlayers.filter(
        p.role === 'VILLAGER' || p.role === 'SEER' || p.role === 'ELDER' ||
        p.role === 'LYCAN' || p.role === 'HUNTER' || p.role === 'WITCH'
      );

      loneWolfKnowledge = `\n\nCHIẾN THUẬT SÓI CÔ ĐƠN:
 - Còn ${remainingWolves.length} Sói thường
 - Còn ${remainingVillagers.length} phe Dân
 - Bạn cần còn lại 1-2 người để THẮNG!
 - Ưu tiên vote lynch SÓI THƯỜNG trước (bán đứng họ!)
 - Sau đó mới giết Dân
 - Giả vờ là Dân để không bị nghi ngờ`;
    
    }
    
    prompt = `${roleInfo.aiPrompt}

BAN NGÀY - Bạn phải bỏ phiếu lynch 1 người.

 TÌNH HÌNH HIỆN TẠI:
 - Dân Làng còn sống: ${villagerCount}
 - Tiên Tri còn sống: ${seerCount}
 - Phù Thủy Già còn sống: ${elderCount}
 - Người Hóa Sói còn sống: ${lycanCount}
 - Thợ Săn còn sống: ${hunterCount}
 - Phù Thủy còn sống: ${witchCount}
 - Sói Cô Đơn còn sống: ${loneWolfCount}
 - Người Sói còn sống: ${wolfCount}
 - Pháp Sư Sói còn sống: ${shamanCount}
 ${knownWolvesInfo}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id} ${p.role === player.role ? '(đồng đội của bạn)' : ''}`).join('\n')}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;
  }
  
  if (targets.length === 0) {
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

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Raw response:', data);
    
    const aiMessage = data.choices[0].message.content;
    console.log('💬 AI text:', aiMessage);
    
    const decision = JSON.parse(aiMessage);
    console.log('✅ Parsed decision:', decision);
    
    // Validate targetId
    if (targets.find(p => p.id === decision.targetId)) {
      return {
        targetId: decision.targetId,
        reasoning: decision.reasoning
      };
    } else {
      console.warn('⚠️ Invalid target ID:', decision.targetId);
    }
  } catch (err) {
    console.error('💥 AI error:', err);
  }
  
  // Fallback
  const randomTarget = targets[Math.floor(Math.random() * targets.length)];
  console.log('🎲 Fallback to random:', randomTarget.id);
  return {
    targetId: randomTarget.id,
    reasoning: "Chọn ngẫu nhiên (AI lỗi)"
  };
};