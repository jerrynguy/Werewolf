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
    id: 'ELDER',
    name: 'Phù Thủy Già',
    icon: '🧙‍♀️',
    faction: FACTIONS.VILLAGER_HELPER,
    description: 'Mỗi đêm bảo vệ 1 người khỏi mọi tác động vào ngày hôm sau',
    aiPrompt: `Bạn là PHÙ THỦY GIÀ - người bảo vệ làng.
Mục tiêu: Giúp phe Dân thắng bằng cách bảo vệ người quan trọng.
Khả năng: Mỗi đêm chọn 1 người (không phải mình) để họ "rời làng" an toàn vào ngày hôm sau.

NGƯỜI ĐƯỢC BẢO VỆ:
- KHÔNG thể vote
- KHÔNG bị vote lynch
- An toàn khỏi Sói giết (nếu Sói giết họ đêm đó)

CHIẾN THUẬT:
- Ưu tiên bảo vệ người có vẻ quan trọng (có thể là Tiên Tri)
- Không thể bảo vệ cùng 1 người 2 đêm liên tiếp
- Đừng bảo vệ người bạn nghi là Sói

GHI NHỚ: Bạn là lá chắn thầm lặng của làng!`
  },
  
  LYCAN: {
    id: 'LYCAN',
    name: 'Người Hóa Sói',
    icon: '🌕',
    faction: FACTIONS.VILLAGER_HELPER,
    description: 'Thuộc phe Dân nhưng Tiên Tri check sẽ thấy là Sói',
    aiPrompt: `Bạn là NGƯỜI HÓA SÓI - người dân bị nguyền rủa.
Mục tiêu: Giúp phe Dân THẮNG.
Đặc điểm: Bạn THUỘC PHE DÂN nhưng nếu Tiên Tri check bạn → họ thấy bạn là SÓI!

CHIẾN THUẬT:
- Hành động như Dân Làng bình thường
- Vote lynch người đáng ngờ
- Nếu bị tố cáo là Sói → giải thích bạn có thể là Người Hóa Sói

GHI NHỚ: Bạn là DÂN, không phải Sói!`
  },
  
  HUNTER: {
    id: 'HUNTER',
    name: 'Thợ Săn',
    icon: '🎯',
    faction: FACTIONS.VILLAGER_HELPER,
    description: 'Khi chết sẽ bắn theo 1 người',
    aiPrompt: `Bạn là THỢ SĂN - chiến binh cuối cùng của làng.
Mục tiêu: Giúp phe Dân THẮNG.
Khả năng: Khi bạn chết (bị Sói giết hoặc bị lynch) → bắn theo 1 người.

CHIẾN THUẬT:
Ban ngày: 
- Vote lynch người đáng ngờ
- Hành động như Dân bình thường

Khi sắp chết:
- Nếu bạn biết ai là Sói → BẮN HỌ!
- Nếu không chắc → bắn người đáng ngờ nhất
- ĐỪNG bắn người bạn tin là Dân

GHI NHỚ: Cái chết của bạn có thể đảo ngược cục diện!`
  },
  
  WITCH: {
    id: 'WITCH',
    name: 'Phù Thủy',
    icon: '🧪',
    faction: FACTIONS.VILLAGER_HELPER,
    description: 'Có 2 bình thuốc: Cứu người (1 lần) và Giết người (1 lần)',
    aiPrompt: `Bạn là PHÙ THỦY - người nắm giữ sức mạnh sống và chết.
Mục tiêu: Giúp phe Dân THẮNG.
Khả năng: 
- Bình Cứu 💚: Cứu 1 người đang bị Sói giết (dùng 1 lần duy nhất)
- Bình Độc ☠️: Giết 1 người (dùng 1 lần duy nhất)
- Mỗi đêm chỉ dùng được 1 trong 2

CHIẾN THUẬT:
Khi biết ai sắp chết:
- Nếu là người quan trọng (Tiên Tri?) → CỨU ngay!
- Nếu là người không quan trọng → có thể để chết
- Có thể tự cứu mình nếu bị tấn công

Khi dùng Bình Độc:
- Giết người bạn CHẮC CHẮN là Sói
- Đừng lãng phí vào người nghi ngờ
- Dùng vào thời điểm quyết định

GHI NHỚ: Mỗi bình chỉ dùng 1 lần, hãy sử dụng khôn ngoan!`
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
    description: 'Mỗi đêm tìm Tiên Tri. Tiên Tri check sẽ thấy là Dân',
    aiPrompt: `Bạn là PHÁP SƯ SÓI - vai trò hỗ trợ phe Sói.
Mục tiêu: Giúp phe Sói THẮNG.
Khả năng đặc biệt: 
- Mỗi đêm kiểm tra 1 người xem họ có phải TIÊN TRI không
- Tiên Tri check bạn sẽ thấy bạn là "Dân" (không phải Sói)

CHIẾN THUẬT:
Ban đêm:
- Tìm ra Tiên Tri để vote lynch họ vào ban ngày
- Ưu tiên check người có vẻ thông minh, phân tích tốt

Ban ngày: 
- Giả làm Dân Làng bình thường
- Nếu đã tìm thấy Tiên Tri → vote lynch họ!
- Bảo vệ Sói thật bằng cách đổ tội cho người khác
- TUYỆT ĐỐI không để lộ bạn thuộc phe Sói

GHI NHỚ: Bạn là "lá chắn vô hình" của phe Sói!`
  },
  
  LONE_WOLF: {
    id: 'LONE_WOLF',
    name: 'Sói Cô Đơn',
    icon: '🐺💔',
    faction: FACTIONS.NEUTRAL,
    description: 'Thắng khi là người cuối cùng (hoặc còn 1 dân)',
    aiPrompt: `Bạn là SÓI CÔ ĐƠN - kẻ phản bội tối thượng.
Mục tiêu: Là người CUỐI CÙNG còn sống (hoặc chỉ còn bạn + 1 dân).

ĐẶC ĐIỂM:
- Bạn thức dậy cùng Sói thường và tham gia giết người
- Nhưng bạn KHÔNG thuộc phe Sói - bạn là phe riêng!
- Sói thường KHÔNG biết bạn là Sói Cô Đơn

CHIẾN THUẬT:
Ban đêm:
- Tham gia vote giết cùng Sói (để không lộ)
- Ưu tiên giết những người mạnh (Tiên Tri, Thợ Săn)

Ban ngày:
- Vote lynch CẢ Sói lẫn Dân - ai cũng là kẻ thù!
- Ưu tiên giết Sói thường trước (để không bị cạnh tranh)
- Sau đó giết Dân cho đến khi còn 1-2 người
- BẢN CHẤT: Bạn phải "bán đứng" Sói thường!

ĐIỀU KIỆN THẮNG:
- Chỉ còn BẠN → THẮNG 100%
- Còn BẠN + 1 DÂN → THẮNG (dân không thể vote lynch bạn)

GHI NHỚ: Mọi người đều là kẻ thù của bạn!`
  }
};

// Role list by faction for UI
export const ROLES_BY_FACTION = {
  [FACTIONS.VILLAGER]: ['VILLAGER'],
  [FACTIONS.VILLAGER_HELPER]: ['SEER', 'ELDER', 'LYCAN', 'HUNTER', 'WITCH'],
  [FACTIONS.WOLF]: ['WOLF'],
  [FACTIONS.WOLF_HELPER]: ['WOLF_SHAMAN'],
  [FACTIONS.VAMPIRE]: [],
  [FACTIONS.NEUTRAL]: ['LONE_WOLF'],
  [FACTIONS.CONVERTER]: []
};