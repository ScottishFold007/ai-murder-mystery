import { Evidence } from '../types/evidence';

/**
 * 示例证物数据
 * 为各个剧本提供基础的证物数据，用于演示和测试
 */

// 午夜凶杀案的证物
export const midnightMurderEvidences: Evidence[] = [
  {
    id: 'evidence_knife_bloody',
    name: '血迹水果刀',
    basicDescription: '在书房现场发现的作案工具，刀刃上有明显血迹，疑似为凶器。长约20cm，为厨房常见的水果刀。',
    detailedDescription: '经过搭档分析：血迹为AB型，与被害人血型一致。指纹检测发现两组不同的指纹，其中一组与被害人匹配，另一组需要进一步比对。刀柄材质为不锈钢，与厨房刀具材质一致。',
    deepDescription: '深度检测发现：在刀柄底部有微小的\'W.L.\'字样刻痕。未知指纹经比对确认为王丽的指纹。血迹凝固程度分析显示作案时间为22:00-23:00之间。',
    category: 'physical',
    discoveryState: 'analyzed',
    unlockLevel: 3,
    relatedActors: ['王丽', '李明'],
    relatedEvidences: ['evidence_contract_torn', 'evidence_watch_broken'],
    triggerEvents: ['confrontation_wang_li'],
    reactions: [],
    combinableWith: ['evidence_contract_torn'],
    importance: 'critical',
    sessionId: '',
    scriptId: 'example_1',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_contract_torn',
    name: '撕碎的合同',
    basicDescription: '在现场发现的被撕碎的合同文件，上面写着"收购协议"，内容已无法完整阅读。',
    detailedDescription: '通过拼接分析：这是一份关于公司股权转让的重要合同，涉及李明名下的多项资产。合同显示李强将获得大部分股权，而王丽的份额被大幅减少。',
    category: 'document',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['李明', '王丽', '李强'],
    relatedEvidences: ['evidence_knife_bloody'],
    triggerEvents: [],
    reactions: [],
    combinableWith: ['evidence_knife_bloody'],
    importance: 'high',
    sessionId: '',
    scriptId: 'example_1',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_watch_broken',
    name: '破损的手表',
    basicDescription: '在沙发旁发现的一块手表，表盘破裂，指针停在22:15分。品牌为劳力士，看起来价值不菲。',
    category: 'physical',
    discoveryState: 'surface',
    unlockLevel: 1,
    relatedActors: ['李明'],
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'medium',
    sessionId: '',
    scriptId: 'example_1',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: true,
    hasUpdate: false
  },
  {
    id: 'evidence_phone_victim',
    name: '被害人手机',
    basicDescription: '李明的手机，屏幕有轻微裂痕，已设置密码锁。从外观看最后使用时间应该是案发前不久。',
    detailedDescription: '经技术破解：通话记录显示案发前1小时接到一个神秘电话，通话时长3分钟。短信记录中有几条来自"亲爱的"的信息，时间戳显示为案发当天下午。',
    category: 'digital',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['李明', '王丽'],
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'high',
    sessionId: '',
    scriptId: 'example_1',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: true
  },
  {
    id: 'evidence_ring_wedding',
    name: '结婚戒指',
    basicDescription: '在书房地毯下发现的女式结婚戒指，内侧刻有"W&L Forever"字样，应该是王丽的戒指。',
    category: 'physical',
    discoveryState: 'surface',
    unlockLevel: 1,
    relatedActors: ['王丽'],
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'medium',
    sessionId: '',
    scriptId: 'example_1',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: true,
    hasUpdate: false
  }
];

// 校园谜案的证物
export const campusMysteryEvidences: Evidence[] = [
  {
    id: 'evidence_poison_bottle',
    name: '毒药瓶',
    basicDescription: '在实验室发现的小玻璃瓶，标签显示为"氰化钾"，瓶中还残留少量白色粉末。',
    detailedDescription: '化学分析确认：瓶中确实含有氰化钾残留，浓度足以致命。瓶身发现李医生的指纹，说明他曾经接触过这个容器。',
    category: 'physical',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['李医生', '张明'],
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'critical',
    sessionId: '',
    scriptId: 'example_2',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_research_notes',
    name: '研究笔记',
    basicDescription: '张教授的研究笔记，记录了关于心理创伤治疗的实验数据和理论分析。',
    detailedDescription: '深入分析发现：笔记中记录了与李医生的学术分歧，张教授认为李医生的治疗方法存在严重缺陷，并计划公开发表反驳论文。',
    category: 'document',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['张明', '李医生'],
    relatedEvidences: ['evidence_poison_bottle'],
    triggerEvents: [],
    reactions: [],
    combinableWith: ['evidence_poison_bottle'],
    importance: 'high',
    sessionId: '',
    scriptId: 'example_2',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_student_thesis',
    name: '陈学生的论文草稿',
    basicDescription: '陈学生提交给张教授的论文草稿，上面有大量红色批注和修改意见。',
    category: 'document',
    discoveryState: 'surface',
    unlockLevel: 1,
    relatedActors: ['陈学生', '张明'],
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'low',
    sessionId: '',
    scriptId: 'example_2',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: true,
    hasUpdate: false
  }
];

// 密室杀人事件的证物
export const lockedRoomEvidences: Evidence[] = [
  {
    id: 'evidence_key_chain',
    name: '钥匙串',
    basicDescription: '在现场发现的钥匙串，包含店铺钥匙、保险柜钥匙和几把未知用途的钥匙。',
    detailedDescription: '仔细检查发现：其中一把钥匙表面有新鲜的划痕，似乎最近被频繁使用。钥匙串上的指纹主要是赵明的，但也发现了李员工的指纹。',
    category: 'physical',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['赵明', '李员工'],
    relatedEvidences: ['evidence_safe_open'],
    triggerEvents: [],
    reactions: [],
    combinableWith: ['evidence_safe_open'],
    importance: 'high',
    sessionId: '',
    scriptId: 'example_3',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_safe_open',
    name: '打开的保险柜',
    basicDescription: '店内的保险柜门敞开，内部的现金和重要文件散落一地，显然有人翻找过。',
    detailedDescription: '进一步调查显示：保险柜是从内部打开的，说明使用了正确的钥匙。丢失物品清单显示失踪了5万元现金和几件珍贵古董。',
    category: 'physical',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['赵明', '李员工'],
    relatedEvidences: ['evidence_key_chain'],
    triggerEvents: [],
    reactions: [],
    combinableWith: ['evidence_key_chain'],
    importance: 'critical',
    sessionId: '',
    scriptId: 'example_3',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_window_scratch',
    name: '窗户划痕',
    basicDescription: '密室窗户的内侧发现了奇怪的划痕，痕迹很新，似乎是某种工具造成的。',
    category: 'physical',
    discoveryState: 'surface',
    unlockLevel: 1,
    relatedActors: [],
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'medium',
    sessionId: '',
    scriptId: 'example_3',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: true,
    hasUpdate: false
  }
];

// 深宫血色案的证物
export const palaceEvidences: Evidence[] = [
  {
    id: 'evidence_manuscript_missing',
    name: '遗失的宫闱秘录',
    basicDescription: '上官婉儿正在编纂的《宫闱秘录》已不翼而飞，据说其中记录了众多皇室成员的秘密。',
    detailedDescription: '据宫人描述：这本秘录记录了太平公主与藩王的密谋、张昌宗的身体隐疾、武惠妃家族的贪墨案等敏感信息，任何一条都足以要人性命。',
    category: 'document',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['上官婉儿', '太平公主', '张昌宗', '武惠妃'],
    relatedEvidences: ['evidence_broken_brush'],
    triggerEvents: [],
    reactions: [],
    combinableWith: ['evidence_secret_passage'],
    importance: 'critical',
    sessionId: '',
    scriptId: 'example_4',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_broken_brush',
    name: '折断的毛笔',
    basicDescription: '上官婉儿右手紧握的折断毛笔，笔杆为珍贵的紫檀木，笔头沾有墨迹。',
    detailedDescription: '仔细观察发现：毛笔是从中间折断的，需要很大的力气。笔杆上除了上官婉儿的指纹外，还发现了另一组不明指纹。',
    category: 'physical',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['上官婉儿'],
    relatedEvidences: ['evidence_manuscript_missing'],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'high',
    sessionId: '',
    scriptId: 'example_4',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_zhang_sachet',
    name: '张昌宗的香囊',
    basicDescription: '在现场地上发现的香囊，装有特制香料，是张昌宗的贴身之物。',
    detailedDescription: '香囊中的香料经分析为宫廷特制，只有皇帝宠信之人才能拥有。香囊表面有轻微的撕扯痕迹，可能是在争斗中掉落的。',
    category: 'physical',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['张昌宗', '上官婉儿'],
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'medium',
    sessionId: '',
    scriptId: 'example_4',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_secret_passage',
    name: '密室通道',
    basicDescription: '在武惠妃寝宫发现的秘密通道，直通上官婉儿的"绮墨斋"，这是武氏家族为后路准备的逃生通道。',
    detailedDescription: '通道内壁有新鲜的摩擦痕迹，地面有脚印，说明最近有人使用过。通道设计巧妙，外人很难发现。',
    category: 'physical',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['武惠妃', '上官婉儿'],
    relatedEvidences: ['evidence_manuscript_missing'],
    triggerEvents: [],
    reactions: [],
    combinableWith: ['evidence_manuscript_missing'],
    importance: 'critical',
    sessionId: '',
    scriptId: 'example_4',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: true,
    hasUpdate: false
  }
];

// 安达山谋杀悬案的证物
export const andaMountainEvidences: Evidence[] = [
  {
    id: 'evidence_horn_trophy',
    name: '断角奖杯',
    basicDescription: '在文斯尸体旁发现的狩猎奖杯，上面的鹿角已经断裂，断面有血迹。',
    detailedDescription: '法医分析确认：鹿角断面的血迹与文斯的血型匹配，这就是致命凶器。奖杯底座刻有"安达山狩猎比赛冠军"字样，应该是文斯的战利品。',
    deepDescription: '进一步检测发现：断角上有业余拉里的指纹，说明他曾经触摸过这个凶器。根据伤口角度分析，凶手身高应该在170-175cm之间。',
    category: 'physical',
    discoveryState: 'analyzed',
    unlockLevel: 3,
    relatedActors: ['文斯', '业余拉里'],
    relatedEvidences: ['evidence_treasure_map'],
    triggerEvents: [],
    reactions: [],
    combinableWith: ['evidence_treasure_map'],
    importance: 'critical',
    sessionId: '',
    scriptId: 'andamountain_mystery',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_treasure_map',
    name: '藏宝图碎片',
    basicDescription: '在文斯的背包中发现的神秘地图碎片，绘制着山洞的布局和标记，似乎指向某个宝藏位置。',
    detailedDescription: '拼接分析显示：这是一张完整藏宝图的一部分，标记着太阳之冠宝石的隐藏位置。地图绘制精细，应该出自专业人士之手。',
    deepDescription: '经过深入研究发现：地图的绘制风格与已故盗贼大师吉姆的作品高度相似，很可能就是他留下的遗物。太阳之冠价值2000万美元。',
    category: 'document',
    discoveryState: 'analyzed',
    unlockLevel: 3,
    relatedActors: ['文斯', '业余拉里', '吉姆'],
    relatedEvidences: ['evidence_horn_trophy'],
    triggerEvents: [],
    reactions: [],
    combinableWith: ['evidence_horn_trophy'],
    importance: 'critical',
    sessionId: '',
    scriptId: 'andamountain_mystery',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_patricia_ring',
    name: '帕特里夏的戒指',
    basicDescription: '在文斯尸体上发现的女式结婚戒指，内侧刻有"P&J Forever"字样，应该是帕特里夏的戒指。',
    detailedDescription: '帕特里夏承认这是她的结婚戒指，她说是作为雇佣文斯杀死暴力杰瑞的抵押品给了文斯。戒指价值不菲，是暴力杰瑞送给她的结婚礼物。',
    category: 'physical',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['帕特里夏', '文斯', '暴力杰瑞'],
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'high',
    sessionId: '',
    scriptId: 'andamountain_mystery',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_marcel_remains',
    name: '马塞尔的遗骸',
    basicDescription: '在小屋后面的井中发现的人类遗骸，据DNA检测确认为15年前失踪的时装设计师马塞尔。',
    detailedDescription: '法医检验显示：死者胸部有枪伤，应该是致命伤。遗骸保存相对完好，死亡时间确实在15年前左右。',
    category: 'physical',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['马塞尔', '孤独汉娜'],
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'high',
    sessionId: '',
    scriptId: 'andamountain_mystery',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  },
  {
    id: 'evidence_forged_notes',
    name: '伪造的便条',
    basicDescription: '发现的两张便条，分别约暴力杰瑞和文斯在小屋后见面，笔迹经分析为同一人所写。',
    detailedDescription: '笔迹专家确认：便条的笔迹与无辜肯的笔迹高度相似，应该是他为了让两人见面而伪造的约会便条。',
    category: 'document',
    discoveryState: 'investigated',
    unlockLevel: 2,
    relatedActors: ['无辜肯', '暴力杰瑞', '文斯'],
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: 'medium',
    sessionId: '',
    scriptId: 'andamountain_mystery',
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isNew: false,
    hasUpdate: false
  }
];

// 根据剧本ID获取对应的证物数据
export const getEvidencesByScriptId = (scriptId: string): Evidence[] => {
  switch (scriptId) {
    case 'example_1':
      return midnightMurderEvidences;
    case 'example_2':
      return campusMysteryEvidences;
    case 'example_3':
      return lockedRoomEvidences;
    case 'example_4':
      return palaceEvidences;
    case 'andamountain_mystery':
      return andaMountainEvidences;
    default:
      return [];
  }
};

// 初始化证物数据到本地存储
export const initializeEvidencesForScript = (scriptId: string, sessionId: string): Evidence[] => {
  const evidences = getEvidencesByScriptId(scriptId);
  
  // 为每个证物设置正确的sessionId
  const initializedEvidences = evidences.map(evidence => ({
    ...evidence,
    sessionId,
    // 随机设置一些证物为新发现状态
    isNew: Math.random() > 0.7,
    // 随机设置一些证物的发现时间
    discoveredAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
  }));
  
  return initializedEvidences;
};
