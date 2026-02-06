import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Title,
  Textarea,
  Text,
  Stack,
  Group,
  Badge,
  Alert
} from '@mantine/core';
import PolishButton from '../PolishButton';


interface StoryEditorProps {
  globalStory: string;
  onUpdate: (globalStory: string) => void;
  onOpenPolish?: () => void;  // 可选的润色回调
}

const StoryEditor: React.FC<StoryEditorProps> = ({ globalStory, onUpdate, onOpenPolish }) => {
  console.log('📝 StoryEditor渲染 - globalStory:', globalStory);
  console.log('📝 StoryEditor渲染 - onUpdate:', onUpdate);
  
  const [localValue, setLocalValue] = useState(globalStory);
  
  // 当外部globalStory变化时，更新本地值
  useEffect(() => {
    setLocalValue(globalStory);
  }, [globalStory]);

  // 防抖更新函数
  const debouncedUpdate = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onUpdate(value);
      }, 300); // 300ms防抖
    };
  }, [onUpdate])();

  // 处理输入变化
  const handleChange = (value: string) => {
    setLocalValue(value);
    debouncedUpdate(value);
  };

  const wordCount = localValue.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = localValue.length;

  return (
    <Paper p="md" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
      <Stack>
        <Group justify="space-between">
          <Title order={3} c="#87CEEB">
            故事背景
          </Title>
          <Group gap="xs">
            <Badge color="cyan" variant="light" c="#00C2FF">
              {wordCount} 词
            </Badge>
            <Badge color="blue" variant="light" c="#87CEEB">
              {charCount} 字符
            </Badge>
            {onOpenPolish && (
              <PolishButton onClick={onOpenPolish} />
            )}
          </Group>
        </Group>

        <Alert
          title="编写提示"
          color="cyan"
          variant="light"
          styles={{
            title: { color: '#87CEEB' }
          }}
        >
          <Text size="sm" c="#90EE90">
            在这里编写整个谋杀悬疑案的背景故事。包括案件发生的时间、地点、受害者信息、嫌疑人之间的关系、重要线索等。
            这个背景信息会提供给AI，帮助它更好地扮演各个角色。
          </Text>
        </Alert>

        <Textarea
          placeholder="请输入案件的背景故事，例如：2024年3月15日晚上8点，知名心理学教授王明被发现死在自己的办公室里。现场门窗完好，没有打斗痕迹，但王教授倒在血泊中，胸口插着一把手术刀。经法医鉴定，死亡时间约为晚上7-8点之间。王教授生前正在研究一个关于心理创伤的课题，与几位同事关系紧张。嫌疑人包括：李医生（王教授的前合作伙伴，因学术分歧而决裂）、张护士（王教授的前女友，最近因感情问题产生矛盾）、陈学生（王教授的研究生，因论文被拒而怀恨在心）。案发当晚，李医生声称在医院值班，张护士说在家看电视，陈学生说在图书馆学习。现场发现了一张被撕碎的纸条，上面写着'真相终将大白'。"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          minRows={20}
          maxRows={50}
          autosize
          styles={{
            input: {
              background: '#1E1E1E',
              border: '2px solid #00C2FF',
              color: '#FFFFFF',
              fontSize: '14px',
              lineHeight: '1.6',
              '&::placeholder': {
                color: '#B8B8B8'
              },
              '&:focus': {
                borderColor: '#4ECCA3',
                boxShadow: '0 0 10px rgba(78, 204, 163, 0.3)'
              }
            }
          }}
        />

        <Text size="xs" c="#90EE90">
          建议字数: 500-2000 字，详细描述案件背景有助于提升游戏体验
        </Text>
      </Stack>
    </Paper>
  );
};

export default StoryEditor;
