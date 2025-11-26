export const makeAIDecision = async (player, alivePlayers, phase, ROLES, lastProtected = null) => {
  const roleInfo = ROLES[player.role];
  
  const villagerCount = alivePlayers.filter(p => p.role === 'VILLAGER').length;
  const seerCount = alivePlayers.filter(p => p.role === 'SEER').length;
  const old_witchCount = alivePlayers.filter(p => p.role === 'OLD WITCH').length;
  const wolfCount = alivePlayers.filter(p => p.role === 'WOLF').length;
  const shamanCount = alivePlayers.filter(p => p.role === 'WOLF_SHAMAN').length;
  
  let targets;
  let prompt;
  
  // === OLD WITCH PROTECT PHASE ===
  if (phase === 'old_witch_protect') {
    // Không thể bảo vệ chính mình hoặc người vừa được bảo vệ đêm trước
    targets = alivePlayers.filter(p => 
      p.id !== player.id && 
      p.id !== lastProtected
    );
    
    const lastProtectedInfo = lastProtected 
      ? `\n- Đêm trước bạn đã bảo vệ Player #${lastProtected} (KHÔNG thể chọn lại)`
      : '\n- Đây là lần đầu tiên bạn bảo vệ';
    
    prompt = `${roleInfo.aiPrompt}

TÌNH HÌNH HIỆN TẠI:
- Dân Làng còn sống: ${villagerCount}
- Tiên Tri còn sống: ${seerCount}
- Phù Thủy Già còn sống: ${old_witchCount}
- Người Sói còn sống: ${wolfCount}
- Pháp Sư Sói còn sống: ${shamanCount}
${lastProtectedInfo}

BAN ĐÊM - Chọn 1 người để BẢO VỆ vào ngày hôm sau.

NGƯỜI ĐƯỢC BẢO VỆ SẼ:
- Rời làng an toàn (không bị Sói giết)
- Không thể vote lynch
- Không bị vote lynch

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

TÌNH HÌNH HIỆN TẠI:
- Dân Làng còn sống: ${villagerCount}
- Tiên Tri còn sống: ${seerCount}
- Phù Thủy Già còn sống: ${old_witchCount}
- Người Sói còn sống: ${wolfCount}
- Pháp Sư Sói còn sống: ${shamanCount}
${knownSeersInfo}

BAN ĐÊM - Chọn 1 người để KIỂM TRA xem họ có phải TIÊN TRI không.

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

TÌNH HÌNH HIỆN TẠI:
- Dân Làng còn sống: ${villagerCount}
- Tiên Tri còn sống: ${seerCount}
- Phù Thủy Già còn sống: ${old_witchCount}
- Người Sói còn sống: ${wolfCount}
- Pháp Sư Sói còn sống: ${shamanCount}
${knownWolvesInfo}

BAN ĐÊM - Chọn 1 người để KIỂM TRA xem họ có phải SÓI không.

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
    targets = alivePlayers.filter(p => p.faction !== player.faction);
    
    prompt = `${roleInfo.aiPrompt}

TÌNH HÌNH HIỆN TẠI:
- Dân Làng còn sống: ${villagerCount}
- Tiên Tri còn sống: ${seerCount}
- Phù Thủy Già còn sống: ${old_witchCount}
- Người Sói còn sống: ${wolfCount}
- Pháp Sư Sói còn sống: ${shamanCount}

BAN ĐÊM - Bạn phải chọn 1 người để giết.

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
    
    prompt = `${roleInfo.aiPrompt}

TÌNH HÌNH HIỆN TẠI:
- Dân Làng còn sống: ${villagerCount}
- Tiên Tri còn sống: ${seerCount}
- Phù Thủy Già còn sống: ${old_witchCount}
- Người Sói còn sống: ${wolfCount}
- Pháp Sư Sói còn sống: ${shamanCount}
${seerKnowledge}${shamanKnowledge}

BAN NGÀY - Bạn phải bỏ phiếu lynch 1 người.

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