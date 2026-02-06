// 证物图标映射表 - 模仿头像处理方式

export interface EvidenceIconOption {
  value: string;
  label: string;
  emoji: string;
  category: string;
}

// 预设证物图标库
export const EVIDENCE_ICON_MAPPING: Record<string, EvidenceIconOption> = {
  // 武器类 - 刀具
  'knife': { value: 'knife', label: '刀具', emoji: '🔪', category: 'weapon' },
  'dagger': { value: 'dagger', label: '匕首', emoji: '🗡️', category: 'weapon' },
  'kitchen_knife': { value: 'kitchen_knife', label: '菜刀', emoji: '🔪', category: 'weapon' },
  'fruit_knife': { value: 'fruit_knife', label: '水果刀', emoji: '🔪', category: 'weapon' },
  'scalpel': { value: 'scalpel', label: '手术刀', emoji: '🔪', category: 'weapon' },
  'box_cutter': { value: 'box_cutter', label: '美工刀', emoji: '🔪', category: 'weapon' },
  'razor': { value: 'razor', label: '剃刀', emoji: '🪒', category: 'weapon' },
  'sword': { value: 'sword', label: '剑', emoji: '⚔️', category: 'weapon' },
  'katana': { value: 'katana', label: '武士刀', emoji: '🗡️', category: 'weapon' },
  
  // 武器类 - 钝器
  'hammer': { value: 'hammer', label: '锤子', emoji: '🔨', category: 'weapon' },
  'sledgehammer': { value: 'sledgehammer', label: '大锤', emoji: '🔨', category: 'weapon' },
  'mallet': { value: 'mallet', label: '木槌', emoji: '🔨', category: 'weapon' },
  'baseball_bat': { value: 'baseball_bat', label: '棒球棒', emoji: '⚾', category: 'weapon' },
  'club': { value: 'club', label: '木棒', emoji: '🏑', category: 'weapon' },
  'crowbar': { value: 'crowbar', label: '撬棍', emoji: '🔧', category: 'weapon' },
  'iron_rod': { value: 'iron_rod', label: '铁棒', emoji: '🔧', category: 'weapon' },
  'wrench': { value: 'wrench', label: '扳手', emoji: '🔧', category: 'weapon' },
  'pipe': { value: 'pipe', label: '水管', emoji: '🔧', category: 'weapon' },
  
  // 武器类 - 枪械
  'gun': { value: 'gun', label: '枪械', emoji: '🔫', category: 'weapon' },
  'pistol': { value: 'pistol', label: '手枪', emoji: '🔫', category: 'weapon' },
  'rifle': { value: 'rifle', label: '步枪', emoji: '🔫', category: 'weapon' },
  'shotgun': { value: 'shotgun', label: '猎枪', emoji: '🔫', category: 'weapon' },
  'revolver': { value: 'revolver', label: '左轮手枪', emoji: '🔫', category: 'weapon' },
  
  // 武器类 - 其他
  'scissors': { value: 'scissors', label: '剪刀', emoji: '✂️', category: 'weapon' },
  'axe': { value: 'axe', label: '斧头', emoji: '🪓', category: 'weapon' },
  'hatchet': { value: 'hatchet', label: '小斧', emoji: '🪓', category: 'weapon' },
  'chainsaw': { value: 'chainsaw', label: '电锯', emoji: '🪚', category: 'weapon' },
  'bow': { value: 'bow', label: '弓箭', emoji: '🏹', category: 'weapon' },
  'crossbow': { value: 'crossbow', label: '弩', emoji: '🏹', category: 'weapon' },
  'spear': { value: 'spear', label: '长矛', emoji: '🥍', category: 'weapon' },
  'slingshot': { value: 'slingshot', label: '弹弓', emoji: '🎯', category: 'weapon' },
  
  // 个人物品类 - 电子设备
  'phone': { value: 'phone', label: '手机', emoji: '📱', category: 'personal' },
  'smartphone': { value: 'smartphone', label: '智能手机', emoji: '📱', category: 'personal' },
  'tablet': { value: 'tablet', label: '平板电脑', emoji: '📱', category: 'personal' },
  'laptop': { value: 'laptop', label: '笔记本电脑', emoji: '💻', category: 'personal' },
  'computer': { value: 'computer', label: '台式电脑', emoji: '🖥️', category: 'personal' },
  'earphones': { value: 'earphones', label: '耳机', emoji: '🎧', category: 'personal' },
  'smartwatch': { value: 'smartwatch', label: '智能手表', emoji: '⌚', category: 'personal' },
  'bluetooth_speaker': { value: 'bluetooth_speaker', label: '蓝牙音箱', emoji: '🔊', category: 'personal' },
  
  // 个人物品类 - 钱财证件
  'wallet': { value: 'wallet', label: '钱包', emoji: '💰', category: 'personal' },
  'purse': { value: 'purse', label: '女士钱包', emoji: '👛', category: 'personal' },
  'money': { value: 'money', label: '现金', emoji: '💵', category: 'personal' },
  'credit_card': { value: 'credit_card', label: '信用卡', emoji: '💳', category: 'personal' },
  'bank_card': { value: 'bank_card', label: '银行卡', emoji: '💳', category: 'personal' },
  'id_card': { value: 'id_card', label: '身份证', emoji: '🆔', category: 'personal' },
  'passport': { value: 'passport', label: '护照', emoji: '📘', category: 'personal' },
  'drivers_license': { value: 'drivers_license', label: '驾驶证', emoji: '🪪', category: 'personal' },
  'business_card': { value: 'business_card', label: '名片', emoji: '💼', category: 'personal' },
  
  // 个人物品类 - 首饰配饰
  'ring': { value: 'ring', label: '戒指', emoji: '💍', category: 'personal' },
  'wedding_ring': { value: 'wedding_ring', label: '结婚戒指', emoji: '💍', category: 'personal' },
  'engagement_ring': { value: 'engagement_ring', label: '订婚戒指', emoji: '💍', category: 'personal' },
  'necklace': { value: 'necklace', label: '项链', emoji: '📿', category: 'personal' },
  'pendant': { value: 'pendant', label: '吊坠', emoji: '📿', category: 'personal' },
  'bracelet': { value: 'bracelet', label: '手镯', emoji: '📿', category: 'personal' },
  'earrings': { value: 'earrings', label: '耳环', emoji: '💎', category: 'personal' },
  'brooch': { value: 'brooch', label: '胸针', emoji: '💎', category: 'personal' },
  'cufflinks': { value: 'cufflinks', label: '袖扣', emoji: '💎', category: 'personal' },
  'watch': { value: 'watch', label: '手表', emoji: '⌚', category: 'personal' },
  'pocket_watch': { value: 'pocket_watch', label: '怀表', emoji: '⌚', category: 'personal' },
  
  // 个人物品类 - 包袋用品
  'bag': { value: 'bag', label: '包包', emoji: '👜', category: 'personal' },
  'handbag': { value: 'handbag', label: '手提包', emoji: '👜', category: 'personal' },
  'backpack': { value: 'backpack', label: '背包', emoji: '🎒', category: 'personal' },
  'briefcase': { value: 'briefcase', label: '公文包', emoji: '💼', category: 'personal' },
  'suitcase': { value: 'suitcase', label: '行李箱', emoji: '🧳', category: 'personal' },
  'duffle_bag': { value: 'duffle_bag', label: '旅行袋', emoji: '👜', category: 'personal' },
  'tote_bag': { value: 'tote_bag', label: '托特包', emoji: '👜', category: 'personal' },
  
  // 个人物品类 - 日常用品
  'key': { value: 'key', label: '钥匙', emoji: '🔑', category: 'personal' },
  'car_key': { value: 'car_key', label: '车钥匙', emoji: '🗝️', category: 'personal' },
  'house_key': { value: 'house_key', label: '房门钥匙', emoji: '🗝️', category: 'personal' },
  'keychain': { value: 'keychain', label: '钥匙扣', emoji: '🔑', category: 'personal' },
  'glasses': { value: 'glasses', label: '眼镜', emoji: '👓', category: 'personal' },
  'sunglasses': { value: 'sunglasses', label: '太阳镜', emoji: '🕶️', category: 'personal' },
  'contact_lenses': { value: 'contact_lenses', label: '隐形眼镜', emoji: '👁️', category: 'personal' },
  'shoes': { value: 'shoes', label: '鞋子', emoji: '👟', category: 'personal' },
  'sneakers': { value: 'sneakers', label: '运动鞋', emoji: '👟', category: 'personal' },
  'dress_shoes': { value: 'dress_shoes', label: '皮鞋', emoji: '👞', category: 'personal' },
  'high_heels': { value: 'high_heels', label: '高跟鞋', emoji: '👠', category: 'personal' },
  'boots': { value: 'boots', label: '靴子', emoji: '👢', category: 'personal' },
  
  // 文档类 - 正式文件
  'document': { value: 'document', label: '文件', emoji: '📄', category: 'document' },
  'contract': { value: 'contract', label: '合同', emoji: '📋', category: 'document' },
  'agreement': { value: 'agreement', label: '协议', emoji: '📋', category: 'document' },
  'legal_document': { value: 'legal_document', label: '法律文件', emoji: '📋', category: 'document' },
  'will': { value: 'will', label: '遗嘱', emoji: '📜', category: 'document' },
  'certificate': { value: 'certificate', label: '证书', emoji: '🏆', category: 'document' },
  'diploma': { value: 'diploma', label: '文凭', emoji: '🎓', category: 'document' },
  'license': { value: 'license', label: '许可证', emoji: '📜', category: 'document' },
  'permit': { value: 'permit', label: '许可证明', emoji: '📜', category: 'document' },
  'receipt': { value: 'receipt', label: '收据', emoji: '🧾', category: 'document' },
  'invoice': { value: 'invoice', label: '发票', emoji: '🧾', category: 'document' },
  'report': { value: 'report', label: '报告', emoji: '📊', category: 'document' },
  'medical_record': { value: 'medical_record', label: '病历', emoji: '🏥', category: 'document' },
  'prescription': { value: 'prescription', label: '处方', emoji: '💊', category: 'document' },
  
  // 文档类 - 个人记录
  'letter': { value: 'letter', label: '信件', emoji: '💌', category: 'document' },
  'love_letter': { value: 'love_letter', label: '情书', emoji: '💌', category: 'document' },
  'postcard': { value: 'postcard', label: '明信片', emoji: '🖼️', category: 'document' },
  'diary': { value: 'diary', label: '日记', emoji: '📔', category: 'document' },
  'journal': { value: 'journal', label: '日志', emoji: '📓', category: 'document' },
  'notebook': { value: 'notebook', label: '笔记本', emoji: '📒', category: 'document' },
  'note': { value: 'note', label: '便条', emoji: '📝', category: 'document' },
  'sticky_note': { value: 'sticky_note', label: '便利贴', emoji: '📝', category: 'document' },
  'memo': { value: 'memo', label: '备忘录', emoji: '📝', category: 'document' },
  'shopping_list': { value: 'shopping_list', label: '购物清单', emoji: '🛒', category: 'document' },
  'to_do_list': { value: 'to_do_list', label: '待办清单', emoji: '✅', category: 'document' },
  
  // 文档类 - 媒体出版物
  'newspaper': { value: 'newspaper', label: '报纸', emoji: '📰', category: 'document' },
  'magazine': { value: 'magazine', label: '杂志', emoji: '📖', category: 'document' },
  'book': { value: 'book', label: '书籍', emoji: '📚', category: 'document' },
  'novel': { value: 'novel', label: '小说', emoji: '📚', category: 'document' },
  'textbook': { value: 'textbook', label: '教科书', emoji: '📖', category: 'document' },
  'comic': { value: 'comic', label: '漫画', emoji: '📚', category: 'document' },
  'brochure': { value: 'brochure', label: '宣传册', emoji: '📋', category: 'document' },
  'flyer': { value: 'flyer', label: '传单', emoji: '📄', category: 'document' },
  'poster': { value: 'poster', label: '海报', emoji: '🖼️', category: 'document' },
  'calendar': { value: 'calendar', label: '日历', emoji: '📅', category: 'document' },
  'map': { value: 'map', label: '地图', emoji: '🗺️', category: 'document' },
  
  // 文档类 - 影像资料
  'photo': { value: 'photo', label: '照片', emoji: '📷', category: 'document' },
  'photograph': { value: 'photograph', label: '相片', emoji: '📸', category: 'document' },
  'polaroid': { value: 'polaroid', label: '拍立得', emoji: '📷', category: 'document' },
  'negative': { value: 'negative', label: '底片', emoji: '🎞️', category: 'document' },
  'film_roll': { value: 'film_roll', label: '胶卷', emoji: '🎞️', category: 'document' },
  'video_tape': { value: 'video_tape', label: '录像带', emoji: '📼', category: 'document' },
  'dvd': { value: 'dvd', label: 'DVD', emoji: '📀', category: 'document' },
  'blueprint': { value: 'blueprint', label: '蓝图', emoji: '📐', category: 'document' },
  'sketch': { value: 'sketch', label: '草图', emoji: '🖊️', category: 'document' },
  'drawing': { value: 'drawing', label: '图画', emoji: '🎨', category: 'document' },
  
  // 数字证据类 - 存储设备
  'usb': { value: 'usb', label: 'U盘', emoji: '💾', category: 'digital' },
  'flash_drive': { value: 'flash_drive', label: '闪存盘', emoji: '💾', category: 'digital' },
  'sd_card': { value: 'sd_card', label: 'SD卡', emoji: '💾', category: 'digital' },
  'memory_card': { value: 'memory_card', label: '存储卡', emoji: '💾', category: 'digital' },
  'harddisk': { value: 'harddisk', label: '硬盘', emoji: '💽', category: 'digital' },
  'external_hdd': { value: 'external_hdd', label: '移动硬盘', emoji: '💽', category: 'digital' },
  'ssd': { value: 'ssd', label: '固态硬盘', emoji: '💽', category: 'digital' },
  'cd': { value: 'cd', label: '光盘', emoji: '💿', category: 'digital' },
  'dvd_digital': { value: 'dvd_digital', label: 'DVD数字', emoji: '📀', category: 'digital' },
  'blu_ray': { value: 'blu_ray', label: '蓝光盘', emoji: '📀', category: 'digital' },
  'floppy_disk': { value: 'floppy_disk', label: '软盘', emoji: '💾', category: 'digital' },
  
  // 数字证据类 - 电子设备
  'server': { value: 'server', label: '服务器', emoji: '🖥️', category: 'digital' },
  'router': { value: 'router', label: '路由器', emoji: '📡', category: 'digital' },
  'modem': { value: 'modem', label: '调制解调器', emoji: '📶', category: 'digital' },
  'printer': { value: 'printer', label: '打印机', emoji: '🖨️', category: 'digital' },
  'scanner': { value: 'scanner', label: '扫描仪', emoji: '🖨️', category: 'digital' },
  'projector': { value: 'projector', label: '投影仪', emoji: '📽️', category: 'digital' },
  'camera': { value: 'camera', label: '相机', emoji: '📸', category: 'digital' },
  'digital_camera': { value: 'digital_camera', label: '数码相机', emoji: '📷', category: 'digital' },
  'webcam': { value: 'webcam', label: '摄像头', emoji: '📹', category: 'digital' },
  'security_camera': { value: 'security_camera', label: '监控摄像头', emoji: '📹', category: 'digital' },
  'dash_cam': { value: 'dash_cam', label: '行车记录仪', emoji: '📹', category: 'digital' },
  'drone': { value: 'drone', label: '无人机', emoji: '🚁', category: 'digital' },
  'gps': { value: 'gps', label: 'GPS设备', emoji: '🗺️', category: 'digital' },
  
  // 数字证据类 - 软件数据
  'email': { value: 'email', label: '电子邮件', emoji: '📧', category: 'digital' },
  'text_message': { value: 'text_message', label: '短信', emoji: '💬', category: 'digital' },
  'chat_log': { value: 'chat_log', label: '聊天记录', emoji: '💬', category: 'digital' },
  'database': { value: 'database', label: '数据库', emoji: '🗄️', category: 'digital' },
  'log_file': { value: 'log_file', label: '日志文件', emoji: '📊', category: 'digital' },
  'source_code': { value: 'source_code', label: '源代码', emoji: '💻', category: 'digital' },
  'encrypted_file': { value: 'encrypted_file', label: '加密文件', emoji: '🔐', category: 'digital' },
  'backup_file': { value: 'backup_file', label: '备份文件', emoji: '💾', category: 'digital' },
  'deleted_file': { value: 'deleted_file', label: '已删除文件', emoji: '🗑️', category: 'digital' },
  'browser_history': { value: 'browser_history', label: '浏览历史', emoji: '🌐', category: 'digital' },
  'cookie': { value: 'cookie', label: 'Cookie文件', emoji: '🍪', category: 'digital' },
  'cache': { value: 'cache', label: '缓存文件', emoji: '📦', category: 'digital' },
  
  // 生活用品类 - 餐具器皿
  'cup': { value: 'cup', label: '杯子', emoji: '🥃', category: 'daily' },
  'coffee_cup': { value: 'coffee_cup', label: '咖啡杯', emoji: '☕', category: 'daily' },
  'tea_cup': { value: 'tea_cup', label: '茶杯', emoji: '🍵', category: 'daily' },
  'mug': { value: 'mug', label: '马克杯', emoji: '☕', category: 'daily' },
  'wineglass': { value: 'wineglass', label: '酒杯', emoji: '🍷', category: 'daily' },
  'champagne_glass': { value: 'champagne_glass', label: '香槟杯', emoji: '🥂', category: 'daily' },
  'cocktail_glass': { value: 'cocktail_glass', label: '鸡尾酒杯', emoji: '🍸', category: 'daily' },
  'beer_mug': { value: 'beer_mug', label: '啤酒杯', emoji: '🍺', category: 'daily' },
  'bottle': { value: 'bottle', label: '瓶子', emoji: '🍾', category: 'daily' },
  'wine_bottle': { value: 'wine_bottle', label: '酒瓶', emoji: '🍷', category: 'daily' },
  'beer_bottle': { value: 'beer_bottle', label: '啤酒瓶', emoji: '🍺', category: 'daily' },
  'water_bottle': { value: 'water_bottle', label: '水瓶', emoji: '💧', category: 'daily' },
  'thermos': { value: 'thermos', label: '保温杯', emoji: '🫖', category: 'daily' },
  'plate': { value: 'plate', label: '盘子', emoji: '🍽️', category: 'daily' },
  'bowl': { value: 'bowl', label: '碗', emoji: '🥣', category: 'daily' },
  'fork': { value: 'fork', label: '叉子', emoji: '🍴', category: 'daily' },
  'spoon': { value: 'spoon', label: '勺子', emoji: '🥄', category: 'daily' },
  'chopsticks': { value: 'chopsticks', label: '筷子', emoji: '🥢', category: 'daily' },
  'kettle': { value: 'kettle', label: '水壶', emoji: '🫖', category: 'daily' },
  'teapot': { value: 'teapot', label: '茶壶', emoji: '🫖', category: 'daily' },
  
  // 生活用品类 - 个人护理
  'toothbrush': { value: 'toothbrush', label: '牙刷', emoji: '🪥', category: 'daily' },
  'toothpaste': { value: 'toothpaste', label: '牙膏', emoji: '🦷', category: 'daily' },
  'soap': { value: 'soap', label: '肥皂', emoji: '🧼', category: 'daily' },
  'shampoo': { value: 'shampoo', label: '洗发水', emoji: '🧴', category: 'daily' },
  'towel': { value: 'towel', label: '毛巾', emoji: '🏖️', category: 'daily' },
  'tissue': { value: 'tissue', label: '纸巾', emoji: '🧻', category: 'daily' },
  'toilet_paper': { value: 'toilet_paper', label: '卫生纸', emoji: '🧻', category: 'daily' },
  'electric_razor': { value: 'electric_razor', label: '电动剃须刀', emoji: '🪒', category: 'daily' },
  'perfume': { value: 'perfume', label: '香水', emoji: '🌸', category: 'daily' },
  'lipstick': { value: 'lipstick', label: '口红', emoji: '💄', category: 'daily' },
  'makeup': { value: 'makeup', label: '化妆品', emoji: '💄', category: 'daily' },
  'mirror': { value: 'mirror', label: '镜子', emoji: '🪞', category: 'daily' },
  'comb': { value: 'comb', label: '梳子', emoji: '🪮', category: 'daily' },
  'hairbrush': { value: 'hairbrush', label: '发刷', emoji: '🪮', category: 'daily' },
  
  // 生活用品类 - 烟酒药品
  'cigarette': { value: 'cigarette', label: '香烟', emoji: '🚬', category: 'daily' },
  'cigar': { value: 'cigar', label: '雪茄', emoji: '🚬', category: 'daily' },
  'pipe_tobacco': { value: 'pipe_tobacco', label: '烟斗', emoji: '🚬', category: 'daily' },
  'lighter': { value: 'lighter', label: '打火机', emoji: '🔥', category: 'daily' },
  'matches': { value: 'matches', label: '火柴', emoji: '🔥', category: 'daily' },
  'ashtray': { value: 'ashtray', label: '烟灰缸', emoji: '🚬', category: 'daily' },
  'medicine': { value: 'medicine', label: '药品', emoji: '💊', category: 'daily' },
  'pill': { value: 'pill', label: '药片', emoji: '💊', category: 'daily' },
  'syringe': { value: 'syringe', label: '注射器', emoji: '💉', category: 'daily' },
  'thermometer': { value: 'thermometer', label: '体温计', emoji: '🌡️', category: 'daily' },
  'bandage': { value: 'bandage', label: '绷带', emoji: '🩹', category: 'daily' },
  'first_aid_kit': { value: 'first_aid_kit', label: '急救包', emoji: '🩹', category: 'daily' },
  
  // 生活用品类 - 装饰物品
  'candle': { value: 'candle', label: '蜡烛', emoji: '🕯️', category: 'daily' },
  'lamp': { value: 'lamp', label: '台灯', emoji: '💡', category: 'daily' },
  'bulb': { value: 'bulb', label: '灯泡', emoji: '💡', category: 'daily' },
  'flower': { value: 'flower', label: '花朵', emoji: '🌹', category: 'daily' },
  'rose': { value: 'rose', label: '玫瑰', emoji: '🌹', category: 'daily' },
  'bouquet': { value: 'bouquet', label: '花束', emoji: '💐', category: 'daily' },
  'vase': { value: 'vase', label: '花瓶', emoji: '🏺', category: 'daily' },
  'picture_frame': { value: 'picture_frame', label: '相框', emoji: '🖼️', category: 'daily' },
  'clock': { value: 'clock', label: '时钟', emoji: '🕐', category: 'daily' },
  'alarm_clock': { value: 'alarm_clock', label: '闹钟', emoji: '⏰', category: 'daily' },
  
  // 衣物类 - 上装
  'shirt': { value: 'shirt', label: '衬衫', emoji: '👔', category: 'clothing' },
  'blouse': { value: 'blouse', label: '女式衬衫', emoji: '👚', category: 'clothing' },
  't_shirt': { value: 't_shirt', label: 'T恤', emoji: '👕', category: 'clothing' },
  'tank_top': { value: 'tank_top', label: '背心', emoji: '👕', category: 'clothing' },
  'sweater': { value: 'sweater', label: '毛衣', emoji: '🧥', category: 'clothing' },
  'hoodie': { value: 'hoodie', label: '连帽衫', emoji: '🧥', category: 'clothing' },
  'jacket': { value: 'jacket', label: '夹克', emoji: '🧥', category: 'clothing' },
  'suit_jacket': { value: 'suit_jacket', label: '西装外套', emoji: '🧥', category: 'clothing' },
  'coat': { value: 'coat', label: '外套', emoji: '🧥', category: 'clothing' },
  'overcoat': { value: 'overcoat', label: '大衣', emoji: '🧥', category: 'clothing' },
  'raincoat': { value: 'raincoat', label: '雨衣', emoji: '🧥', category: 'clothing' },
  
  // 衣物类 - 下装
  'pants': { value: 'pants', label: '裤子', emoji: '👖', category: 'clothing' },
  'jeans': { value: 'jeans', label: '牛仔裤', emoji: '👖', category: 'clothing' },
  'shorts': { value: 'shorts', label: '短裤', emoji: '🩳', category: 'clothing' },
  'skirt': { value: 'skirt', label: '裙子', emoji: '👗', category: 'clothing' },
  'dress': { value: 'dress', label: '连衣裙', emoji: '👗', category: 'clothing' },
  'suit': { value: 'suit', label: '西装', emoji: '🤵', category: 'clothing' },
  'uniform': { value: 'uniform', label: '制服', emoji: '👮', category: 'clothing' },
  
  // 衣物类 - 配饰
  'hat': { value: 'hat', label: '帽子', emoji: '🎩', category: 'clothing' },
  'cap': { value: 'cap', label: '棒球帽', emoji: '🧢', category: 'clothing' },
  'helmet': { value: 'helmet', label: '头盔', emoji: '⛑️', category: 'clothing' },
  'scarf': { value: 'scarf', label: '围巾', emoji: '🧣', category: 'clothing' },
  'tie': { value: 'tie', label: '领带', emoji: '👔', category: 'clothing' },
  'bow_tie': { value: 'bow_tie', label: '蝴蝶结', emoji: '🎀', category: 'clothing' },
  'belt': { value: 'belt', label: '腰带', emoji: '👖', category: 'clothing' },
  'gloves': { value: 'gloves', label: '手套', emoji: '🧤', category: 'clothing' },
  'mittens': { value: 'mittens', label: '连指手套', emoji: '🧤', category: 'clothing' },
  'socks': { value: 'socks', label: '袜子', emoji: '🧦', category: 'clothing' },
  'stockings': { value: 'stockings', label: '长筒袜', emoji: '🧦', category: 'clothing' },
  'underwear': { value: 'underwear', label: '内衣', emoji: '🩲', category: 'clothing' },
  'bra': { value: 'bra', label: '胸罩', emoji: '👙', category: 'clothing' },
  
  // 工具类 - 修理工具
  'adjustable_wrench': { value: 'adjustable_wrench', label: '活动扳手', emoji: '🔧', category: 'tool' },
  'screwdriver': { value: 'screwdriver', label: '螺丝刀', emoji: '🪛', category: 'tool' },
  'pliers': { value: 'pliers', label: '钳子', emoji: '🔧', category: 'tool' },
  'drill': { value: 'drill', label: '电钻', emoji: '🔨', category: 'tool' },
  'saw': { value: 'saw', label: '锯子', emoji: '🪚', category: 'tool' },
  'file': { value: 'file', label: '锉刀', emoji: '🔧', category: 'tool' },
  'measuring_tape': { value: 'measuring_tape', label: '卷尺', emoji: '📏', category: 'tool' },
  'level': { value: 'level', label: '水平仪', emoji: '📐', category: 'tool' },
  'toolbox': { value: 'toolbox', label: '工具箱', emoji: '🧰', category: 'tool' },
  
  // 工具类 - 日常工具
  'rope': { value: 'rope', label: '绳子', emoji: '🪢', category: 'tool' },
  'chain': { value: 'chain', label: '链条', emoji: '⛓️', category: 'tool' },
  'wire': { value: 'wire', label: '电线', emoji: '🔌', category: 'tool' },
  'tape': { value: 'tape', label: '胶带', emoji: '📦', category: 'tool' },
  'duct_tape': { value: 'duct_tape', label: '管道胶带', emoji: '📦', category: 'tool' },
  'glue': { value: 'glue', label: '胶水', emoji: '🧴', category: 'tool' },
  'nail': { value: 'nail', label: '钉子', emoji: '🔨', category: 'tool' },
  'screw': { value: 'screw', label: '螺丝', emoji: '🔩', category: 'tool' },
  'bolt': { value: 'bolt', label: '螺栓', emoji: '🔩', category: 'tool' },
  'nut': { value: 'nut', label: '螺母', emoji: '🔩', category: 'tool' },
  
  // 工具类 - 照明安全
  'flashlight': { value: 'flashlight', label: '手电筒', emoji: '🔦', category: 'tool' },
  'lantern': { value: 'lantern', label: '灯笼', emoji: '🏮', category: 'tool' },
  'headlamp': { value: 'headlamp', label: '头灯', emoji: '🔦', category: 'tool' },
  'emergency_light': { value: 'emergency_light', label: '应急灯', emoji: '🚨', category: 'tool' },
  'smoke_detector': { value: 'smoke_detector', label: '烟雾探测器', emoji: '🚨', category: 'tool' },
  'fire_extinguisher': { value: 'fire_extinguisher', label: '灭火器', emoji: '🧯', category: 'tool' },
  'lock': { value: 'lock', label: '锁', emoji: '🔒', category: 'tool' },
  'padlock': { value: 'padlock', label: '挂锁', emoji: '🔒', category: 'tool' },
  'deadbolt': { value: 'deadbolt', label: '门闩', emoji: '🔒', category: 'tool' },
  
  // 工具类 - 测量观察
  'magnifier': { value: 'magnifier', label: '放大镜', emoji: '🔍', category: 'tool' },
  'microscope': { value: 'microscope', label: '显微镜', emoji: '🔬', category: 'tool' },
  'telescope': { value: 'telescope', label: '望远镜', emoji: '🔭', category: 'tool' },
  'binoculars': { value: 'binoculars', label: '双筒望远镜', emoji: '🔭', category: 'tool' },
  'compass': { value: 'compass', label: '指南针', emoji: '🧭', category: 'tool' },
  'ruler': { value: 'ruler', label: '尺子', emoji: '📏', category: 'tool' },
  'protractor': { value: 'protractor', label: '量角器', emoji: '📐', category: 'tool' },
  'scale': { value: 'scale', label: '天平', emoji: '⚖️', category: 'tool' },
  'stopwatch': { value: 'stopwatch', label: '秒表', emoji: '⏱️', category: 'tool' },
  'timer': { value: 'timer', label: '计时器', emoji: '⏲️', category: 'tool' },
  
  // 特殊证物类 - 生物痕迹
  'bloodstain': { value: 'bloodstain', label: '血迹', emoji: '🩸', category: 'special' },
  'blood_spatter': { value: 'blood_spatter', label: '血溅', emoji: '🩸', category: 'special' },
  'blood_pool': { value: 'blood_pool', label: '血泊', emoji: '🩸', category: 'special' },
  'fingerprint': { value: 'fingerprint', label: '指纹', emoji: '👆', category: 'special' },
  'palmprint': { value: 'palmprint', label: '掌纹', emoji: '🖐️', category: 'special' },
  'footprint': { value: 'footprint', label: '脚印', emoji: '👣', category: 'special' },
  'shoe_print': { value: 'shoe_print', label: '鞋印', emoji: '👟', category: 'special' },
  'tire_mark': { value: 'tire_mark', label: '轮胎印', emoji: '🚗', category: 'special' },
  'bite_mark': { value: 'bite_mark', label: '咬痕', emoji: '🦷', category: 'special' },
  'scratch_mark': { value: 'scratch_mark', label: '抓痕', emoji: '✋', category: 'special' },
  'hair': { value: 'hair', label: '毛发', emoji: '💇', category: 'special' },
  'skin_cell': { value: 'skin_cell', label: '皮肤细胞', emoji: '🧬', category: 'special' },
  'saliva': { value: 'saliva', label: '唾液', emoji: '💧', category: 'special' },
  'sweat': { value: 'sweat', label: '汗液', emoji: '💦', category: 'special' },
  'dna': { value: 'dna', label: 'DNA', emoji: '🧬', category: 'special' },
  
  // 特殊证物类 - 化学物质
  'poison': { value: 'poison', label: '毒药', emoji: '☠️', category: 'special' },
  'drug': { value: 'drug', label: '毒品', emoji: '💊', category: 'special' },
  'chemical': { value: 'chemical', label: '化学物质', emoji: '🧪', category: 'special' },
  'acid': { value: 'acid', label: '酸液', emoji: '🧪', category: 'special' },
  'explosive': { value: 'explosive', label: '爆炸物', emoji: '💥', category: 'special' },
  'gunpowder': { value: 'gunpowder', label: '火药', emoji: '💥', category: 'special' },
  'residue': { value: 'residue', label: '残留物', emoji: '🧪', category: 'special' },
  'powder': { value: 'powder', label: '粉末', emoji: '🧂', category: 'special' },
  'liquid': { value: 'liquid', label: '液体', emoji: '💧', category: 'special' },
  'gas': { value: 'gas', label: '气体', emoji: '💨', category: 'special' },
  
  // 特殊证物类 - 痕迹证据
  'fire': { value: 'fire', label: '火焰痕迹', emoji: '🔥', category: 'special' },
  'burn_mark': { value: 'burn_mark', label: '烧痕', emoji: '🔥', category: 'special' },
  'smoke_damage': { value: 'smoke_damage', label: '烟熏痕迹', emoji: '💨', category: 'special' },
  'water_damage': { value: 'water_damage', label: '水渍', emoji: '💧', category: 'special' },
  'rust': { value: 'rust', label: '锈迹', emoji: '🦠', category: 'special' },
  'stain': { value: 'stain', label: '污渍', emoji: '🟤', category: 'special' },
  'dirt': { value: 'dirt', label: '泥土', emoji: '🟫', category: 'special' },
  'dust': { value: 'dust', label: '灰尘', emoji: '🌫️', category: 'special' },
  'fiber': { value: 'fiber', label: '纤维', emoji: '🧵', category: 'special' },
  'fabric_tear': { value: 'fabric_tear', label: '织物撕裂', emoji: '✂️', category: 'special' },
  'glass_shard': { value: 'glass_shard', label: '玻璃碎片', emoji: '💎', category: 'special' },
  'metal_fragment': { value: 'metal_fragment', label: '金属碎片', emoji: '🔩', category: 'special' },
  'wood_chip': { value: 'wood_chip', label: '木屑', emoji: '🪵', category: 'special' },
  'paint_chip': { value: 'paint_chip', label: '油漆片', emoji: '🎨', category: 'special' },
  
  // 交通工具类
  'car': { value: 'car', label: '汽车', emoji: '🚗', category: 'vehicle' },
  'motorcycle': { value: 'motorcycle', label: '摩托车', emoji: '🏍️', category: 'vehicle' },
  'bicycle': { value: 'bicycle', label: '自行车', emoji: '🚲', category: 'vehicle' },
  'truck': { value: 'truck', label: '卡车', emoji: '🚚', category: 'vehicle' },
  'van': { value: 'van', label: '面包车', emoji: '🚐', category: 'vehicle' },
  'bus': { value: 'bus', label: '公交车', emoji: '🚌', category: 'vehicle' },
  'taxi': { value: 'taxi', label: '出租车', emoji: '🚕', category: 'vehicle' },
  'boat': { value: 'boat', label: '船只', emoji: '🚤', category: 'vehicle' },
  'airplane': { value: 'airplane', label: '飞机', emoji: '✈️', category: 'vehicle' },
  'train': { value: 'train', label: '火车', emoji: '🚂', category: 'vehicle' },
  'license_plate': { value: 'license_plate', label: '车牌', emoji: '🚗', category: 'vehicle' },
  
  // 食物饮料类
  'apple': { value: 'apple', label: '苹果', emoji: '🍎', category: 'food' },
  'banana': { value: 'banana', label: '香蕉', emoji: '🍌', category: 'food' },
  'bread': { value: 'bread', label: '面包', emoji: '🍞', category: 'food' },
  'cake': { value: 'cake', label: '蛋糕', emoji: '🎂', category: 'food' },
  'chocolate': { value: 'chocolate', label: '巧克力', emoji: '🍫', category: 'food' },
  'coffee': { value: 'coffee', label: '咖啡', emoji: '☕', category: 'food' },
  'tea': { value: 'tea', label: '茶', emoji: '🍵', category: 'food' },
  'wine': { value: 'wine', label: '红酒', emoji: '🍷', category: 'food' },
  'beer': { value: 'beer', label: '啤酒', emoji: '🍺', category: 'food' },
  'water': { value: 'water', label: '水', emoji: '💧', category: 'food' },
  'milk': { value: 'milk', label: '牛奶', emoji: '🥛', category: 'food' },
  'juice': { value: 'juice', label: '果汁', emoji: '🧃', category: 'food' },
  
  // 默认证物
  'unknown': { value: 'unknown', label: '未知物品', emoji: '❓', category: 'default' },
  'evidence': { value: 'evidence', label: '证物', emoji: '📋', category: 'default' },
  'clue': { value: 'clue', label: '线索', emoji: '🔍', category: 'default' },
  'item': { value: 'item', label: '物品', emoji: '📦', category: 'default' },
  'object': { value: 'object', label: '物体', emoji: '🔲', category: 'default' }
};

// 按类别分组的证物图标
export const EVIDENCE_ICON_CATEGORIES = {
  weapon: { 
    label: '武器工具', 
    icons: ['knife', 'dagger', 'gun', 'pistol', 'hammer', 'sledgehammer', 'scissors', 'axe', 'sword', 'baseball_bat', 'crowbar', 'chainsaw', 'bow'] 
  },
  personal: { 
    label: '个人物品', 
    icons: ['phone', 'smartphone', 'wallet', 'purse', 'watch', 'ring', 'wedding_ring', 'necklace', 'pendant', 'bracelet', 'earrings', 'bag', 'handbag', 'backpack', 'briefcase', 'key', 'car_key', 'glasses', 'sunglasses', 'shoes', 'sneakers', 'high_heels'] 
  },
  document: { 
    label: '文档资料', 
    icons: ['document', 'contract', 'agreement', 'will', 'certificate', 'receipt', 'letter', 'love_letter', 'diary', 'journal', 'note', 'memo', 'newspaper', 'magazine', 'book', 'novel', 'photo', 'photograph', 'map', 'blueprint'] 
  },
  digital: { 
    label: '数字证据', 
    icons: ['usb', 'flash_drive', 'harddisk', 'cd', 'dvd', 'laptop', 'computer', 'camera', 'digital_camera', 'webcam', 'security_camera', 'email', 'text_message', 'chat_log', 'database', 'encrypted_file'] 
  },
  daily: { 
    label: '生活用品', 
    icons: ['cup', 'coffee_cup', 'wineglass', 'bottle', 'wine_bottle', 'plate', 'bowl', 'cigarette', 'lighter', 'medicine', 'pill', 'candle', 'lamp', 'flower', 'rose', 'vase', 'clock', 'mirror', 'perfume', 'soap'] 
  },
  clothing: { 
    label: '衣物配饰', 
    icons: ['shirt', 'blouse', 't_shirt', 'jacket', 'coat', 'pants', 'jeans', 'dress', 'skirt', 'hat', 'cap', 'scarf', 'tie', 'belt', 'gloves', 'socks', 'uniform'] 
  },
  tool: { 
    label: '工具设备', 
    icons: ['wrench', 'screwdriver', 'drill', 'saw', 'rope', 'chain', 'tape', 'flashlight', 'magnifier', 'microscope', 'lock', 'padlock', 'ruler', 'compass', 'toolbox'] 
  },
  special: { 
    label: '特殊证物', 
    icons: ['bloodstain', 'blood_spatter', 'fingerprint', 'palmprint', 'footprint', 'shoe_print', 'hair', 'dna', 'poison', 'drug', 'chemical', 'fire', 'burn_mark', 'fiber', 'glass_shard'] 
  },
  vehicle: { 
    label: '交通工具', 
    icons: ['car', 'motorcycle', 'bicycle', 'truck', 'van', 'bus', 'taxi', 'boat', 'airplane', 'license_plate'] 
  },
  food: { 
    label: '食物饮料', 
    icons: ['apple', 'banana', 'bread', 'cake', 'chocolate', 'coffee', 'tea', 'wine', 'beer', 'water', 'milk', 'juice'] 
  },
  default: { 
    label: '通用证物', 
    icons: ['unknown', 'evidence', 'clue', 'item', 'object'] 
  }
};

// 获取所有证物图标选项
export const getAllEvidenceIcons = (): EvidenceIconOption[] => {
  return Object.values(EVIDENCE_ICON_MAPPING);
};

// 根据图标名称获取图标信息
export const getEvidenceIconInfo = (iconName: string): EvidenceIconOption => {
  return EVIDENCE_ICON_MAPPING[iconName] || EVIDENCE_ICON_MAPPING.unknown;
};

// 根据证物名称智能匹配图标
export const getSmartEvidenceIcon = (evidenceName: string): string => {
  const name = evidenceName.toLowerCase();
  
  // 关键词匹配映射 - 大幅扩充版本
  const keywordMapping: Record<string, string> = {
    // 武器类关键词
    '刀': 'knife', '刀具': 'knife', '水果刀': 'fruit_knife', '菜刀': 'kitchen_knife', '匕首': 'dagger', '手术刀': 'scalpel', '美工刀': 'box_cutter',
    '剃刀': 'razor', '剃须刀': 'razor', '刮胡刀': 'razor',
    '枪': 'gun', '手枪': 'pistol', '步枪': 'rifle', '猎枪': 'shotgun', '左轮': 'revolver', '左轮手枪': 'revolver',
    '锤': 'hammer', '锤子': 'hammer', '铁锤': 'hammer', '大锤': 'sledgehammer', '木槌': 'mallet',
    '棒球棒': 'baseball_bat', '球棒': 'baseball_bat', '木棒': 'club', '撬棍': 'crowbar', '铁棒': 'iron_rod',
    '扳手': 'wrench', '水管': 'pipe', '钢管': 'pipe',
    '剪刀': 'scissors', '剪子': 'scissors',
    '斧': 'axe', '斧头': 'axe', '斧子': 'axe', '小斧': 'hatchet', '电锯': 'chainsaw', '链锯': 'chainsaw',
    '弓': 'bow', '弓箭': 'bow', '弩': 'crossbow', '长矛': 'spear', '弹弓': 'slingshot',
    '剑': 'sword', '武士刀': 'katana', '刀剑': 'sword',
    
    // 个人物品类关键词
    '手机': 'smartphone', '电话': 'phone', '移动电话': 'smartphone', '智能手机': 'smartphone',
    '平板': 'tablet', '平板电脑': 'tablet', 'ipad': 'tablet',
    '笔记本电脑': 'laptop', '电脑': 'computer', '台式电脑': 'computer', '计算机': 'computer',
    '耳机': 'earphones', '蓝牙耳机': 'earphones', '音箱': 'bluetooth_speaker', '扬声器': 'bluetooth_speaker',
    '智能手表': 'smartwatch', '苹果手表': 'smartwatch',
    
    '钱包': 'wallet', '皮夹': 'wallet', '钱夹': 'wallet', '女士钱包': 'purse', '钱袋': 'purse',
    '现金': 'money', '钞票': 'money', '纸币': 'money', '零钱': 'money',
    '信用卡': 'credit_card', '银行卡': 'bank_card', '储蓄卡': 'bank_card',
    '身份证': 'id_card', '护照': 'passport', '驾驶证': 'drivers_license', '驾照': 'drivers_license',
    '名片': 'business_card', '工作证': 'id_card',
    
    '戒指': 'ring', '指环': 'ring', '婚戒': 'wedding_ring', '结婚戒指': 'wedding_ring', '订婚戒指': 'engagement_ring',
    '项链': 'necklace', '链子': 'necklace', '吊坠': 'pendant', '挂件': 'pendant',
    '手镯': 'bracelet', '手链': 'bracelet', '耳环': 'earrings', '耳钉': 'earrings',
    '胸针': 'brooch', '袖扣': 'cufflinks', '领带夹': 'cufflinks',
    '手表': 'watch', '腕表': 'watch', '表': 'watch', '怀表': 'pocket_watch',
    
    '包': 'bag', '手提包': 'handbag', '背包': 'backpack', '公文包': 'briefcase',
    '行李箱': 'suitcase', '拉杆箱': 'suitcase', '旅行箱': 'suitcase',
    '旅行袋': 'duffle_bag', '托特包': 'tote_bag',
    
    '钥匙': 'key', '锁匙': 'key', '车钥匙': 'car_key', '房门钥匙': 'house_key', '钥匙扣': 'keychain',
    '眼镜': 'glasses', '墨镜': 'sunglasses', '太阳镜': 'sunglasses', '隐形眼镜': 'contact_lenses',
    '鞋': 'shoes', '鞋子': 'shoes', '皮鞋': 'dress_shoes', '运动鞋': 'sneakers',
    '高跟鞋': 'high_heels', '靴子': 'boots', '长靴': 'boots',
    
    // 文档类关键词
    '文件': 'document', '档案': 'document', '资料': 'document', '文档': 'document',
    '合同': 'contract', '协议': 'agreement', '契约': 'contract', '法律文件': 'legal_document',
    '遗嘱': 'will', '证书': 'certificate', '文凭': 'diploma', '许可证': 'license',
    '收据': 'receipt', '发票': 'invoice', '账单': 'receipt',
    '报告': 'report', '病历': 'medical_record', '处方': 'prescription',
    
    '信': 'letter', '信件': 'letter', '情书': 'love_letter', '明信片': 'postcard',
    '日记': 'diary', '日志': 'journal', '笔记本': 'notebook',
    '便条': 'note', '纸条': 'note', '留言': 'note', '便利贴': 'sticky_note', '备忘录': 'memo',
    '购物清单': 'shopping_list', '待办清单': 'to_do_list', '清单': 'to_do_list',
    
    '报纸': 'newspaper', '新闻': 'newspaper', '杂志': 'magazine', '期刊': 'magazine',
    '书': 'book', '书籍': 'book', '小说': 'novel', '教科书': 'textbook', '课本': 'textbook',
    '漫画': 'comic', '连环画': 'comic', '宣传册': 'brochure', '传单': 'flyer',
    '海报': 'poster', '日历': 'calendar', '地图': 'map',
    
    '照片': 'photo', '相片': 'photograph', '图片': 'photo', '拍立得': 'polaroid',
    '底片': 'negative', '胶卷': 'film_roll', '录像带': 'video_tape',
    '蓝图': 'blueprint', '草图': 'sketch', '图画': 'drawing',
    
    // 数字证据类关键词
    'u盘': 'usb', 'USB': 'usb', '优盘': 'usb', '闪存盘': 'flash_drive',
    'sd卡': 'sd_card', '存储卡': 'memory_card', 'tf卡': 'memory_card',
    '硬盘': 'harddisk', '移动硬盘': 'external_hdd', '固态硬盘': 'ssd',
    '光盘': 'cd', 'CD': 'cd', 'DVD': 'dvd', '蓝光': 'blu_ray', '软盘': 'floppy_disk',
    
    '服务器': 'server', '路由器': 'router', '调制解调器': 'modem',
    '打印机': 'printer', '扫描仪': 'scanner', '投影仪': 'projector',
    '相机': 'camera', '数码相机': 'digital_camera', '摄像头': 'webcam',
    '监控': 'security_camera', '监控摄像头': 'security_camera', '行车记录仪': 'dash_cam',
    '无人机': 'drone', 'GPS': 'gps', '导航': 'gps',
    
    '邮件': 'email', '电子邮件': 'email', '短信': 'text_message', '信息': 'text_message',
    '聊天记录': 'chat_log', '微信': 'chat_log', 'QQ': 'chat_log',
    '数据库': 'database', '日志文件': 'log_file', '源代码': 'source_code',
    '加密文件': 'encrypted_file', '备份': 'backup_file', '已删除文件': 'deleted_file',
    '浏览历史': 'browser_history', 'cookie': 'cookie', '缓存': 'cache',
    
    // 生活用品类关键词
    '杯': 'cup', '杯子': 'cup', '茶杯': 'tea_cup', '咖啡杯': 'coffee_cup', '马克杯': 'mug',
    '酒杯': 'wineglass', '红酒杯': 'wineglass', '高脚杯': 'wineglass',
    '香槟杯': 'champagne_glass', '鸡尾酒杯': 'cocktail_glass', '啤酒杯': 'beer_mug',
    '瓶': 'bottle', '瓶子': 'bottle', '酒瓶': 'wine_bottle', '水瓶': 'water_bottle',
    '啤酒瓶': 'beer_bottle', '保温杯': 'thermos', '水壶': 'kettle', '茶壶': 'teapot',
    '盘子': 'plate', '碗': 'bowl', '叉子': 'fork', '勺子': 'spoon', '筷子': 'chopsticks',
    
    '牙刷': 'toothbrush', '牙膏': 'toothpaste', '肥皂': 'soap', '洗发水': 'shampoo',
    '毛巾': 'towel', '纸巾': 'tissue', '卫生纸': 'toilet_paper',
    '香水': 'perfume', '口红': 'lipstick', '化妆品': 'makeup', '镜子': 'mirror',
    '梳子': 'comb', '发刷': 'hairbrush',
    
    '烟': 'cigarette', '香烟': 'cigarette', '卷烟': 'cigarette', '雪茄': 'cigar',
    '烟斗': 'pipe_tobacco', '打火机': 'lighter', '火柴': 'matches', '烟灰缸': 'ashtray',
    '药': 'medicine', '药品': 'medicine', '药物': 'medicine', '药片': 'pill',
    '注射器': 'syringe', '体温计': 'thermometer', '绷带': 'bandage', '急救包': 'first_aid_kit',
    
    '蜡烛': 'candle', '台灯': 'lamp', '灯泡': 'bulb',
    '花': 'flower', '鲜花': 'flower', '玫瑰': 'rose', '花束': 'bouquet',
    '花瓶': 'vase', '相框': 'picture_frame', '时钟': 'clock', '闹钟': 'alarm_clock',
    
    // 衣物类关键词
    '衬衫': 'shirt', '衬衣': 'shirt', '女式衬衫': 'blouse',
    'T恤': 't_shirt', 't恤': 't_shirt', '背心': 'tank_top',
    '毛衣': 'sweater', '连帽衫': 'hoodie', '夹克': 'jacket',
    '西装外套': 'suit_jacket', '外套': 'coat', '大衣': 'overcoat', '雨衣': 'raincoat',
    
    '裤子': 'pants', '牛仔裤': 'jeans', '短裤': 'shorts',
    '裙': 'skirt', '裙子': 'skirt', '连衣裙': 'dress', '西装': 'suit', '制服': 'uniform',
    
    '帽': 'hat', '帽子': 'hat', '棒球帽': 'cap', '头盔': 'helmet',
    '围巾': 'scarf', '丝巾': 'scarf', '领带': 'tie', '蝴蝶结': 'bow_tie',
    '腰带': 'belt', '皮带': 'belt',
    '手套': 'gloves', '连指手套': 'mittens', '袜子': 'socks', '长筒袜': 'stockings',
    '内衣': 'underwear', '胸罩': 'bra',
    
    // 工具类关键词
    '螺丝刀': 'screwdriver', '钳子': 'pliers', '电钻': 'drill', '锯子': 'saw', '锉刀': 'file',
    '卷尺': 'measuring_tape', '水平仪': 'level', '工具箱': 'toolbox',
    
    '绳': 'rope', '绳子': 'rope', '绳索': 'rope', '链条': 'chain', '电线': 'wire',
    '胶带': 'tape', '管道胶带': 'duct_tape', '胶水': 'glue',
    '钉子': 'nail', '螺丝': 'screw', '螺栓': 'bolt', '螺母': 'nut',
    
    '手电': 'flashlight', '手电筒': 'flashlight', '电筒': 'flashlight',
    '灯笼': 'lantern', '头灯': 'headlamp', '应急灯': 'emergency_light',
    '烟雾探测器': 'smoke_detector', '灭火器': 'fire_extinguisher',
    '锁': 'lock', '门锁': 'lock', '挂锁': 'padlock', '门闩': 'deadbolt',
    
    '放大镜': 'magnifier', '显微镜': 'microscope', '望远镜': 'telescope',
    '双筒望远镜': 'binoculars', '指南针': 'compass', '尺子': 'ruler',
    '量角器': 'protractor', '天平': 'scale', '秒表': 'stopwatch', '计时器': 'timer',
    
    // 特殊证物类关键词
    '血': 'bloodstain', '血迹': 'bloodstain', '血痕': 'bloodstain', '血溅': 'blood_spatter', '血泊': 'blood_pool',
    '指纹': 'fingerprint', '手印': 'fingerprint', '掌纹': 'palmprint',
    '脚印': 'footprint', '足迹': 'footprint', '鞋印': 'shoe_print', '轮胎印': 'tire_mark',
    '咬痕': 'bite_mark', '抓痕': 'scratch_mark', '毛发': 'hair', '皮肤细胞': 'skin_cell',
    '唾液': 'saliva', '汗液': 'sweat', 'dna': 'dna', 'DNA': 'dna', '基因': 'dna',
    
    '毒': 'poison', '毒药': 'poison', '毒物': 'poison', '毒品': 'drug',
    '化学物质': 'chemical', '酸液': 'acid', '爆炸物': 'explosive', '火药': 'gunpowder',
    '残留物': 'residue', '粉末': 'powder', '液体': 'liquid', '气体': 'gas',
    
    '火': 'fire', '燃烧': 'fire', '烧痕': 'burn_mark', '火焰痕迹': 'fire',
    '烟熏': 'smoke_damage', '水渍': 'water_damage', '锈迹': 'rust',
    '污渍': 'stain', '泥土': 'dirt', '灰尘': 'dust',
    '纤维': 'fiber', '织物撕裂': 'fabric_tear', '玻璃碎片': 'glass_shard',
    '金属碎片': 'metal_fragment', '木屑': 'wood_chip', '油漆片': 'paint_chip',
    
    // 交通工具类关键词
    '汽车': 'car', '轿车': 'car', '车': 'car', '摩托车': 'motorcycle', '自行车': 'bicycle',
    '卡车': 'truck', '货车': 'truck', '面包车': 'van', '公交车': 'bus',
    '出租车': 'taxi', '的士': 'taxi', '船': 'boat', '船只': 'boat',
    '飞机': 'airplane', '火车': 'train', '车牌': 'license_plate', '牌照': 'license_plate',
    
    // 食物饮料类关键词
    '苹果': 'apple', '香蕉': 'banana', '面包': 'bread', '蛋糕': 'cake', '巧克力': 'chocolate',
    '咖啡': 'coffee', '茶': 'tea', '红酒': 'wine', '葡萄酒': 'wine', '啤酒': 'beer',
    '水': 'water', '牛奶': 'milk', '果汁': 'juice', '饮料': 'juice'
  };
  
  // 检查关键词匹配
  for (const [keyword, iconName] of Object.entries(keywordMapping)) {
    if (name.includes(keyword)) {
      return iconName;
    }
  }
  
  // 默认返回通用证物图标
  return 'evidence';
};

// 根据类别获取图标列表
export const getEvidenceIconsByCategory = (category: string): EvidenceIconOption[] => {
  const categoryInfo = EVIDENCE_ICON_CATEGORIES[category as keyof typeof EVIDENCE_ICON_CATEGORIES];
  if (!categoryInfo) return [];
  
  return categoryInfo.icons.map(iconName => EVIDENCE_ICON_MAPPING[iconName]);
};

// 获取所有类别
export const getEvidenceIconCategories = () => {
  return Object.keys(EVIDENCE_ICON_CATEGORIES).map(key => ({
    value: key,
    label: EVIDENCE_ICON_CATEGORIES[key as keyof typeof EVIDENCE_ICON_CATEGORIES].label
  }));
};
