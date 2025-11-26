export const makeAIDecision = async (player, alivePlayers, phase, ROLES) => {
  const roleInfo = ROLES[player.role];
  
  const villagerCount = alivePlayers.filter(p => p.role === 'VILLAGER').length;
  const wolfCount = alivePlayers.filter(p => p.role === 'WOLF').length;
  
  const targets = phase === 'night_kill'
    ? alivePlayers.filter(p => p.faction !== player.faction)
    : alivePlayers.filter(p => p.id !== player.id);
  
  if (targets.length === 0) {
    return { targetId: null, reasoning: "Không có mục tiêu" };
  }
  
  const prompt = `${roleInfo.aiPrompt}

TÌNH HÌNH HIỆN TẠI:
- Dân Làng còn sống: ${villagerCount}
- Người Sói còn sống: ${wolfCount}

${phase === 'night_kill' ? 'BAN ĐÊM - Bạn phải chọn 1 người để giết.' : 'BAN NGÀY - Bạn phải bỏ phiếu lynch 1 người.'}

CÁC MỤC TIÊU KHẢ DỤNG:
${targets.map(p => `- Player #${p.id} (${p.role === player.role ? 'đồng đội của bạn' : 'không rõ'})`).join('\n')}

QUY TẮC TRẢ LỜI:
- CHỈ trả lời bằng JSON
- KHÔNG thêm text nào khác
- Format: {"targetId": <number>, "reasoning": "<string>"}`;

  try {
    console.log('🤖 AI Request for Player #' + player.id + ' (' + player.role + ')');
    
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