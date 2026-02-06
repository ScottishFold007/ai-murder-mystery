// 预设聊天背景映射表
interface BackgroundOption {
  value: string;
  label: string;
  category: string;
}

// 预设背景映射（静态预设）
const PRESET_BACKGROUND_MAPPINGS: BackgroundOption[] = [
  // 这些是预设的背景图，如果文件不存在会在动态加载时过滤掉
  { value: 'script_scenes/preset_default_room.png', label: '默认房间', category: '预设场景' },
  { value: 'script_scenes/preset_government_hall.png', label: '官府大厅', category: '预设场景' },
  { value: 'script_scenes/preset_medical_room.png', label: '医疗室', category: '预设场景' },
  { value: 'script_scenes/preset_merchant_hall.png', label: '商会大厅', category: '预设场景' },
  { value: 'script_scenes/preset_military_camp.png', label: '军营', category: '预设场景' },
  { value: 'script_scenes/preset_study_room.png', label: '书房', category: '预设场景' },
  { value: 'script_scenes/preset_tavern_room.png', label: '酒馆', category: '预设场景' },
];

// 动态背景图列表（从API获取）
let dynamicBackgrounds: BackgroundOption[] = [];

/**
 * 从API加载动态背景图列表
 */
export async function loadDynamicBackgrounds(): Promise<BackgroundOption[]> {
  try {
    const response = await fetch('/api/backgrounds.json');
    if (!response.ok) {
      console.warn('⚠️ 无法加载背景图列表，使用静态预设');
      return PRESET_BACKGROUND_MAPPINGS;
    }
    
    const backgroundFiles: string[] = await response.json();
    // console.log('🎨 加载到动态背景图:', backgroundFiles.length, '个');
    
    // 将文件名转换为背景选项
    const dynamicOptions: BackgroundOption[] = backgroundFiles.map(filename => {
      // 从文件名提取角色名或场景信息
      let label = filename;
      let category = '用户生成';
      
      if (filename.includes('chat_bg_')) {
        // 提取角色名
        const roleName = filename.replace('chat_bg_', '').replace(/_\d+\.png$/, '');
        label = `${roleName}的聊天背景`;
        category = '角色背景';
      } else if (filename.includes('preset_')) {
        // 预设场景
        const sceneName = filename.replace('preset_', '').replace('.png', '');
        label = sceneName;
        category = '预设场景';
      }
      
      return {
        value: `script_scenes/${filename}`,
        label,
        category
      };
    });
    
    dynamicBackgrounds = dynamicOptions;
    // console.log('✅ 动态背景图列表已更新:', dynamicBackgrounds.length, '个');
    return dynamicBackgrounds;
  } catch (error) {
    console.error('❌ 加载动态背景图失败:', error);
    return PRESET_BACKGROUND_MAPPINGS;
  }
}

/**
 * 获取所有可用的背景选项（包含动态加载的背景）
 */
export function getAllBackgroundOptions(): BackgroundOption[] {
  // 合并预设和动态背景，去重
  const allBackgrounds = [...PRESET_BACKGROUND_MAPPINGS, ...dynamicBackgrounds];
  const uniqueBackgrounds = allBackgrounds.filter((bg, index, arr) => 
    arr.findIndex(b => b.value === bg.value) === index
  );
  return uniqueBackgrounds;
}

/**
 * 根据背景文件名获取中文显示名
 */
export function getBackgroundChineseName(backgroundName: string): string {
  const allBackgrounds = getAllBackgroundOptions();
  const background = allBackgrounds.find(bg => bg.value === backgroundName);
  return background ? background.label : backgroundName;
}

/**
 * 根据分类获取背景选项
 */
export function getBackgroundsByCategory(category: string): BackgroundOption[] {
  const allBackgrounds = getAllBackgroundOptions();
  return allBackgrounds.filter(bg => bg.category === category);
}

/**
 * 获取所有背景分类
 */
export function getBackgroundCategories(): string[] {
  const allBackgrounds = getAllBackgroundOptions();
  const categories = allBackgrounds.map(bg => bg.category);
  return Array.from(new Set(categories));
}
