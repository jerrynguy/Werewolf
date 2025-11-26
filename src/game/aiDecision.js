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
- KHÔNG thêm bất kỳ text, giải thích hay markdown nào bên ngoài JSON
- Format chính xác như sau:

{
  "targetId": <số ID của người bạn chọn>,
  "reasoning": "<lý do ngắn gọn bằng tiếng Việt, tối đa 50 từ>"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const decision = JSON.parse(jsonMatch[0]);
      if (targets.find(p => p.id === decision.targetId)) {
        return decision;
      }
    }
  } catch (err) {
    console.error('AI error:', err);
  }
  
  const randomTarget = targets[Math.floor(Math.random() * targets.length)];
  return {
    targetId: randomTarget.id,
    reasoning: "Chọn ngẫu nhiên (AI lỗi)"
  };
};