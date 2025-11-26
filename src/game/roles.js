export const FACTIONS = {
  VILLAGER: 'villager',
  VILLAGER_HELPER: 'villager_helper',
  WOLF: 'wolf',
  WOLF_HELPER: 'wolf_helper',
  VAMPIRE: 'vampire',
  NEUTRAL: 'neutral',
  CONVERTER: 'converter'
};

export const FACTION_INFO = {
  [FACTIONS.VILLAGER]: {
    name: 'Phe Dân',
    icon: '👥',
    color: 'green',
    description: 'Phe dân làng chính nghĩa'
  },
  [FACTIONS.VILLAGER_HELPER]: {
    name: 'Phe Giúp Dân',
    icon: '🛡️',
    color: 'blue',
    description: 'Những người hỗ trợ dân làng'
  },
  [FACTIONS.WOLF]: {
    name: 'Phe Sói',
    icon: '🐺',
    color: 'red',
    description: 'Phe sói đói máu'
  },
  [FACTIONS.WOLF_HELPER]: {
    name: 'Phe Giúp Sói',
    icon: '🌙',
    color: 'purple',
    description: 'Những kẻ hỗ trợ bầy sói'
  },
  [FACTIONS.VAMPIRE]: {
    name: 'Phe Ma Cà Rồng',
    icon: '🧛',
    color: 'purple',
    description: 'Phe ma cà rồng bất tử'
  },
  [FACTIONS.NEUTRAL]: {
    name: 'Phe Trung Lập',
    icon: '⚖️',
    color: 'gray',
    description: 'Không thuộc phe nào'
  },
  [FACTIONS.CONVERTER]: {
    name: 'Phe Chuyển Đổi',
    icon: '🔄',
    color: 'orange',
    description: 'Có thể chuyển đổi phe'
  }
};

export const ROLES = {
  VILLAGER: {
    id: 'VILLAGER',
    name: 'Dân Làng',
    icon: '👨‍🌾',
    faction: FACTIONS.VILLAGER,
    description: 'Người dân bình thường, thắng khi tiêu diệt hết sói',
    aiPrompt: `Bạn là DÂN LÀNG. 
Mục tiêu: Tiêu diệt HẾT Người Sói.
Chiến thuật: Phân tích hành vi, bỏ phiếu thông minh để loại bỏ sói.
Ban ngày: Tham gia thảo luận và vote lynch người đáng ngờ.`
  },
  
  SEER: {
    id: 'SEER',
    name: 'Tiên Tri',
    icon: '🔮',
    faction: FACTIONS.VILLAGER_HELPER,
    description: 'Mỗi đêm kiểm tra 1 người để biết họ có phải Sói hay không',
    aiPrompt: `Bạn là TIÊN TRI - vai trò quan trọng nhất phe Dân.
Mục tiêu: Tìm ra Người Sói và giúp Dân thắng.
Khả năng: Mỗi đêm kiểm tra 1 người để biết họ có phải SÓI hay không.

CHIẾN THUẬT THÔNG MINH:
1. Ban đêm: Ưu tiên check những người đáng ngờ nhất
2. Ban ngày: 
   - Nếu đã tìm thấy SÓI → vote lynch người đó
   - KHÔNG tiết lộ bạn là Tiên Tri (sẽ bị Sói giết)
   - Vote dựa trên "logic suy luận" thay vì nói thẳng bạn biết

GHI NHỚ: Bạn biết chính xác ai là Sói, hãy vote thông minh!`
  },
  
  ELDER: {
    id: 'OLD WITCH',
    name: 'Phù Thủy Già',
    icon: '🧙‍♀️',
    faction: FACTIONS.VILLAGER_HELPER,
    description: 'Mỗi đêm bảo vệ 1 người khỏi mọi tác động vào ngày hôm sau',
    aiPrompt: `Bạn là PHÙ THỦY GIÀ – người bảo hộ bí ẩn của làng.
Mục tiêu: Giúp phe Dân chiến thắng bằng cách bảo vệ những người quan trọng.

KHẢ NĂNG:
Mỗi đêm chọn 1 người (không phải bạn) để họ tạm thời “rời khỏi làng” vào ngày hôm sau.
Trong thời gian đó, họ:
- KHÔNG thể vote
- KHÔNG bị vote lynch
- KHÔNG bị giết bởi Sói (nếu bị nhắm đến đêm trước)

QUY TẮC:
- Không thể chọn cùng 1 người trong 2 đêm liên tiếp.
- Chỉ có thể chọn người khác, không thể tự bảo vệ mình.

CHIẾN THUẬT GỢI Ý:
- Ưu tiên bảo vệ người quan trọng như Tiên Tri hoặc người bạn nghi là dân.
- Hạn chế bảo vệ người bạn nghi ngờ có thể là Sói.
- Dùng khả năng để cứu mục tiêu khỏi nguy hiểm hoặc ngắt tương tác để họ an toàn.

GHI NHỚ: Bạn là lá chắn thầm lặng, dùng phép thuật để giữ an toàn cho những người quan trọng trong làng.`
  },
  
  WOLF: {
    id: 'WOLF',
    name: 'Người Sói',
    icon: '🐺',
    faction: FACTIONS.WOLF,
    description: 'Thắng khi số sói bằng số dân',
    aiPrompt: `Bạn là NGƯỜI SÓI.
Mục tiêu: Số Sói = Số Dân thì Sói THẮNG.
Chiến thuật ban đêm: Giết Dân Làng.
Chiến thuật ban ngày: Giả làm Dân, đổ tội cho người khác, tránh bị phát hiện.`
  },
  
  WOLF_SHAMAN: {
    id: 'WOLF_SHAMAN',
    name: 'Pháp Sư Sói',
    icon: '🌙',
    faction: FACTIONS.WOLF_HELPER,
    description: 'Khi Tiên Tri check sẽ hiện là Dân. Thắng cùng phe Sói',
    aiPrompt: `Bạn là PHÁP SƯ SÓI - vai trò hỗ trợ phe Sói.
Mục tiêu: Giúp phe Sói THẮNG.
Khả năng đặc biệt: Tiên Tri check bạn sẽ thấy bạn là "Dân" (không phải Sói).

CHIẾN THUẬT:
Ban ngày: 
- Giả làm Dân Làng bình thường
- Bảo vệ Sói thật bằng cách đổ tội cho người khác
- TUYỆT ĐỐI không để lộ bạn thuộc phe Sói
- Vote lynch người có lợi cho phe Sói

GHI NHỚ: Bạn là "lá chắn vô hình" của phe Sói!`
  }
};

// Role list by faction for UI
export const ROLES_BY_FACTION = {
  [FACTIONS.VILLAGER]: ['VILLAGER'],
  [FACTIONS.VILLAGER_HELPER]: ['SEER', 'OLD WITCH'],
  [FACTIONS.WOLF]: ['WOLF'],
  [FACTIONS.WOLF_HELPER]: ['WOLF_SHAMAN'],
  [FACTIONS.VAMPIRE]: [],
  [FACTIONS.NEUTRAL]: [],
  [FACTIONS.CONVERTER]: []
};