import React, { useState } from 'react';
import {
  Modal,
  Button,
  Text,
  Stack,
  Group,
  Badge,
  Paper,
  Table,
  ActionIcon,
  Title,
  Alert
} from '@mantine/core';
import { IconRestore, IconInfoCircle } from '@tabler/icons-react';
import { 
  getDeleteStatistics, 
  getDeletedScripts, 
  unmarkScriptAsDeleted,
  cleanupOldDeleteRecords,
  DeletedScriptRecord 
} from '../utils/storageManager';

interface DeleteStateDebuggerProps {
  opened: boolean;
  onClose: () => void;
}

/**
 * 删除状态调试器 - 用于查看和管理删除状态
 * 仅在开发环境或需要时使用
 */
const DeleteStateDebugger: React.FC<DeleteStateDebuggerProps> = ({ opened, onClose }) => {
  const [deletedScripts, setDeletedScripts] = useState<DeletedScriptRecord[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getDeleteStatistics> | null>(null);

  React.useEffect(() => {
    if (opened) {
      refreshData();
    }
  }, [opened]);

  const refreshData = () => {
    setDeletedScripts(getDeletedScripts());
    setStats(getDeleteStatistics());
  };

  const handleRestore = (scriptId: string) => {
    unmarkScriptAsDeleted(scriptId);
    refreshData();
  };

  const handleCleanup = () => {
    cleanupOldDeleteRecords(30);
    refreshData();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'example': return 'blue';
      case 'ai': return 'purple';
      case 'manual': return 'green';
      case 'database': return 'orange';
      default: return 'gray';
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'example': return '示例剧本';
      case 'ai': return 'AI生成';
      case 'manual': return '手动创建';
      case 'database': return '数据库';
      default: return '未知';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={4}>🗑️ 删除状态调试器</Title>}
      size="xl"
      styles={{
        content: {
          backgroundColor: '#1A1B1E',
          color: '#FFFFFF'
        },
        header: {
          backgroundColor: '#1A1B1E',
          borderBottom: '1px solid #373A40'
        },
        title: {
          color: '#FFFFFF'
        }
      }}
    >
      <Stack gap="md">
        {/* 统计信息 */}
        {stats && (
          <Paper p="md" style={{ backgroundColor: '#25262B', border: '1px solid #373A40' }}>
            <Group gap="xl">
              <div>
                <Text size="sm" c="dimmed">总删除数</Text>
                <Text size="xl" fw="bold" c="red">{stats.total}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">最近7天</Text>
                <Text size="xl" fw="bold" c="orange">{stats.recentDeletes.length}</Text>
              </div>
            </Group>
            
            <Group mt="md" gap="sm">
              <Text size="sm" c="dimmed">按类型分布：</Text>
              {Object.entries(stats.bySourceType).map(([type, count]) => (
                <Badge 
                  key={type} 
                  color={getSourceTypeColor(type)} 
                  variant="filled"
                  size="sm"
                >
                  {getSourceTypeLabel(type)}: {count}
                </Badge>
              ))}
            </Group>
          </Paper>
        )}

        {/* 操作按钮 */}
        <Group>
          <Button 
            variant="outline" 
            onClick={refreshData}
            leftSection={<IconInfoCircle size={16} />}
          >
            刷新数据
          </Button>
          <Button 
            variant="outline" 
            color="orange"
            onClick={handleCleanup}
          >
            清理30天前记录
          </Button>
        </Group>

        {/* 已删除剧本列表 */}
        {deletedScripts.length > 0 ? (
          <Paper p="md" style={{ backgroundColor: '#25262B', border: '1px solid #373A40' }}>
            <Title order={5} mb="md" c="white">已删除的剧本</Title>
            <Table>
              <thead>
                <tr>
                  <th style={{ color: '#C1C2C5' }}>剧本ID</th>
                  <th style={{ color: '#C1C2C5' }}>标题</th>
                  <th style={{ color: '#C1C2C5' }}>类型</th>
                  <th style={{ color: '#C1C2C5' }}>删除时间</th>
                  <th style={{ color: '#C1C2C5' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {deletedScripts.map((record) => (
                  <tr key={record.scriptId}>
                    <td style={{ color: '#C1C2C5' }}>
                      <Text size="sm" ff="monospace">{record.scriptId}</Text>
                    </td>
                    <td style={{ color: '#C1C2C5' }}>
                      <Text size="sm">{record.title || '未知'}</Text>
                    </td>
                    <td>
                      <Badge 
                        color={getSourceTypeColor(record.sourceType)} 
                        variant="filled"
                        size="sm"
                      >
                        {getSourceTypeLabel(record.sourceType)}
                      </Badge>
                    </td>
                    <td style={{ color: '#C1C2C5' }}>
                      <Text size="sm">{formatDate(record.deletedAt)}</Text>
                    </td>
                    <td>
                      <ActionIcon
                        color="green"
                        variant="subtle"
                        onClick={() => handleRestore(record.scriptId)}
                        title="恢复剧本（取消删除标记）"
                      >
                        <IconRestore size={16} />
                      </ActionIcon>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Paper>
        ) : (
          <Alert 
            icon={<IconInfoCircle size={16} />} 
            title="无删除记录"
            color="blue"
            styles={{
              root: { backgroundColor: '#1E3A8A', borderColor: '#3B82F6' },
              title: { color: '#FFFFFF' },
              message: { color: '#E5E7EB' }
            }}
          >
            当前没有已删除的剧本记录
          </Alert>
        )}

        {/* 使用说明 */}
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          title="使用说明"
          color="gray"
          styles={{
            root: { backgroundColor: '#374151', borderColor: '#6B7280' },
            title: { color: '#FFFFFF' },
            message: { color: '#E5E7EB' }
          }}
        >
          <Text size="sm">
            • 这个工具显示所有被标记为删除的剧本<br />
            • 点击恢复按钮可以取消删除标记，剧本将在下次刷新时重新出现<br />
            • 清理按钮会移除30天前的删除记录<br />
            • 删除状态存储在浏览器localStorage中
          </Text>
        </Alert>
      </Stack>
    </Modal>
  );
};

export default DeleteStateDebugger;
