import React from 'react';
import {
  Paper,
  Title,
  TextInput,
  Select,
  NumberInput,
  Switch,
  Stack,
  Grid,
  Text,
  Alert
} from '@mantine/core';

import { ScriptSettings } from '../../types/script';

interface ScriptSettingsProps {
  settings: ScriptSettings;
  onUpdate: (settings: ScriptSettings) => void;
}

const ScriptSettingsComponent: React.FC<ScriptSettingsProps> = ({ settings, onUpdate }) => {
  return (
    <Paper p="md" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
      <Stack>
        <Title order={3} c="#87CEEB">
          剧本设置
        </Title>

        <Alert
          title="设置说明"
          color="cyan"
          variant="light"
          styles={{
            title: { color: '#87CEEB' }
          }}
        >
          <Text size="sm" c="#90EE90">
            这些设置会影响剧本的显示和游戏体验。难度设置会影响AI角色的行为复杂度。玩家角色请在"角色管理"中设置。
          </Text>
        </Alert>

        <Grid>
          <Grid.Col span={6}>
            <Select
              label="难度等级"
              placeholder="选择难度"
              data={[
                { value: 'easy', label: '简单 - 适合新手玩家' },
                { value: 'medium', label: '中等 - 平衡的挑战' },
                { value: 'hard', label: '困难 - 适合经验丰富的玩家' }
              ]}
              value={settings.difficulty}
              onChange={(value) => value && onUpdate({ ...settings, difficulty: value as any })}
              required
              styles={{
                label: { color: '#87CEEB' }
              }}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <NumberInput
              label="预计游戏时长 (分钟)"
              placeholder="输入预计时长"
              value={settings.estimatedDuration}
              onChange={(value) => onUpdate({ ...settings, estimatedDuration: Number(value) || 60 })}
              min={10}
              max={300}
              required
              styles={{
                label: { color: '#87CEEB' }
              }}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="主题风格"
              placeholder="AI会根据剧本内容自动生成，如：现代都市·职场仇杀、民国谍战·孤岛迷影等"
              description="AI生成剧本时会自动填入，手动剧本可自定义"
              value={settings.theme}
              onChange={(e) => onUpdate({ ...settings, theme: e.target.value })}
              styles={{
                label: { color: '#87CEEB', fontWeight: '600' },
                description: { color: '#B0C4DE' },
                input: {
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  border: '1px solid #00FFFF',
                  color: '#FFFFFF'
                }
              }}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <div>
              <Text size="sm" fw={500} mb="xs" c="#87CEEB">
                高级设置
              </Text>
              <Stack gap="xs">
                <Switch
                  label="启用复杂推理"
                  description="AI角色会使用更复杂的推理逻辑"
                  checked={settings.difficulty === 'hard'}
                  onChange={(e) => onUpdate({ 
                    ...settings, 
                    difficulty: e.currentTarget.checked ? 'hard' : 'medium' 
                  })}
                  styles={{
                    label: { color: '#87CEEB' },
                    description: { color: '#90EE90' }
                  }}
                />
                {settings.qualityReport && (
                  <Alert color="cyan" variant="light">
                    <Text size="sm" c="#90EE90">已生成质检报告，可在剧本库中查看。</Text>
                  </Alert>
                )}
              </Stack>
            </div>
          </Grid.Col>
        </Grid>

        <Alert color="yellow" variant="light" styles={{
          title: { color: '#87CEEB' }
        }}>
          <Text size="sm" c="#90EE90">
            <strong>难度说明:</strong><br />
            • <strong>简单:</strong> 角色行为直接，线索明显，适合新手<br />
            • <strong>中等:</strong> 平衡的挑战，需要一定推理能力<br />
            • <strong>困难:</strong> 角色行为复杂，线索隐蔽，需要深度推理
          </Text>
        </Alert>
      </Stack>
    </Paper>
  );
};

export default ScriptSettingsComponent;
