import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  Group,
  Stack,
  TextInput,
  SimpleGrid,
  ScrollArea,
  Button,
  Box,
  Badge,
  Divider,
  ActionIcon
} from '@mantine/core';
import {
  IconSearch,
  IconX,
  IconSend,
  IconEye
} from '@tabler/icons-react';
import { Evidence } from '../../types/evidence';
import { getFilteredEvidences } from '../../utils/evidenceManager';
import { getEvidenceIcon } from '../../utils/evidenceIconUtils';
import EvidenceCard from './EvidenceCard';
import {
  selectorModalStyles,
  selectorSearchInputStyles,
  selectorTextInputStyles,
  recommendBadgeStyles,
  getItemHoverHandlers,
  getItemCardStyle,
  selectedPreviewBoxStyle,
  cancelButtonStyles,
  getSendButtonStyles
} from '../shared/selectorPanelStyles';

interface EvidenceSelectorPanelProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (evidence: Evidence) => void;
  onSend: (evidence: Evidence, textContent?: string) => void;
  sessionId: string;
  currentActor?: string;
}

const EvidenceSelectorPanel: React.FC<EvidenceSelectorPanelProps> = ({
  opened, onClose, onSelect, onSend, sessionId, currentActor
}) => {
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    if (opened) {
      const timeoutId = setTimeout(() => { loadEvidences(); }, searchQuery ? 300 : 0);
      return () => clearTimeout(timeoutId);
    }
  }, [opened, sessionId, searchQuery]);

  const loadEvidences = () => {
    try {
      const filteredEvidences = getFilteredEvidences(sessionId, {
        searchQuery: searchQuery.trim() || undefined
      });
      const sortedEvidences = filteredEvidences.sort((a, b) => {
        if (!currentActor) return 0;
        const aRelevant = a.relatedActors.includes(currentActor);
        const bRelevant = b.relatedActors.includes(currentActor);
        if (aRelevant && !bRelevant) return -1;
        if (!aRelevant && bRelevant) return 1;
        const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (importanceOrder[b.importance as keyof typeof importanceOrder] || 0) - 
               (importanceOrder[a.importance as keyof typeof importanceOrder] || 0);
      });
      setEvidences(sortedEvidences);
    } catch (error) {
      console.error('❌ 加载证物失败:', error);
    }
  };

  const handleEvidenceSelect = (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    onSelect(evidence);
  };

  const handleSend = () => {
    if (selectedEvidence) {
      onSend(selectedEvidence, textContent.trim() || undefined);
      handleClose();
    }
  };

  const handleQuickSend = (evidence: Evidence) => {
    onSend(evidence);
    handleClose();
  };

  const handleClose = () => {
    setSelectedEvidence(null);
    setTextContent('');
    setSearchQuery('');
    onClose();
  };

  const getRecommendedEvidences = () => {
    if (!currentActor) return [];
    return evidences.filter(e => e.relatedActors.includes(currentActor)).slice(0, 3);
  };

  const recommendedEvidences = getRecommendedEvidences();

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconSend size={20} />
          <Text fw={600}>选择证物</Text>
          {currentActor && (
            <Badge size="sm" color="blue" variant="light">发送给: {currentActor}</Badge>
          )}
        </Group>
      }
      size="lg"
      styles={selectorModalStyles}
    >
      <Stack gap="md">
        <TextInput
          placeholder="搜索证物..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={searchQuery && (
            <ActionIcon size="sm" variant="subtle" onClick={() => setSearchQuery('')}>
              <IconX size={14} />
            </ActionIcon>
          )}
          styles={selectorSearchInputStyles}
        />

        {recommendedEvidences.length > 0 && !searchQuery && (
          <Box>
            <Group gap="xs" mb="sm">
              <IconEye size={16} color="#4ECCA3" />
              <Text fw={600} size="sm" c="#4ECCA3">推荐证物</Text>
              <Badge size="xs" styles={recommendBadgeStyles}>与{currentActor}相关</Badge>
            </Group>
            <SimpleGrid cols={3} spacing="xs">
              {recommendedEvidences.map((evidence) => (
                <Box
                  key={evidence.id}
                  onClick={() => handleEvidenceSelect(evidence)}
                  onDoubleClick={() => handleQuickSend(evidence)}
                  style={{ ...getItemCardStyle(selectedEvidence?.id === evidence.id), padding: '12px', borderRadius: '10px' }}
                  {...getItemHoverHandlers(selectedEvidence?.id === evidence.id)}
                >
                  <Group gap="xs" justify="center">
                    <Text size="lg">{getEvidenceIcon(evidence.category, evidence.name)}</Text>
                    <Text size="xs" ta="center" c="#00FFFF" fw={600} style={{ wordBreak: 'break-all' }}>
                      {evidence.name}
                    </Text>
                  </Group>
                </Box>
              ))}
            </SimpleGrid>
            <Divider my="md" color="rgba(0, 255, 255, 0.2)" />
          </Box>
        )}

        <Box>
          <Text fw={600} size="sm" c="#00FFFF" mb="sm">所有证物 ({evidences.length})</Text>
          {evidences.length === 0 ? (
            <Text size="sm" c="#BDBDBD" ta="center" py="xl">
              {searchQuery ? '没有找到匹配的证物' : '还没有发现任何证物'}
            </Text>
          ) : (
            <ScrollArea.Autosize mah={300}>
              <SimpleGrid cols={2} spacing="sm">
                {evidences.map((evidence) => (
                  <EvidenceCard
                    key={evidence.id}
                    evidence={evidence}
                    isSelected={selectedEvidence?.id === evidence.id}
                    onClick={() => handleEvidenceSelect(evidence)}
                    onDoubleClick={() => handleQuickSend(evidence)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </SimpleGrid>
            </ScrollArea.Autosize>
          )}
        </Box>

        {selectedEvidence && (
          <>
            <Divider color="rgba(0, 255, 255, 0.2)" />
            <Box p="md" style={selectedPreviewBoxStyle}>
              <Group gap="sm" mb="sm">
                <Text size="lg">{getEvidenceIcon(selectedEvidence.category, selectedEvidence.name)}</Text>
                <Text fw={600} c="#00FFFF">{selectedEvidence.name}</Text>
              </Group>
              <Text size="sm" c="#E0E0E0" mb="sm">{selectedEvidence.basicDescription}</Text>
              {selectedEvidence.detailedDescription && selectedEvidence.unlockLevel >= 2 && (
                <Box mb="sm">
                  <Text fw={600} size="xs" c="#00C2FF" mb="xs">专业分析:</Text>
                  <Text size="xs" c="#E0E0E0">{selectedEvidence.detailedDescription}</Text>
                </Box>
              )}
              {selectedEvidence.deepDescription && selectedEvidence.unlockLevel >= 3 && (
                <Box mb="sm">
                  <Text fw={600} size="xs" c="#E63946" mb="xs">深度发现:</Text>
                  <Text size="xs" c="#E0E0E0">{selectedEvidence.deepDescription}</Text>
                </Box>
              )}
              <Text size="xs" c="#BDBDBD">💡 提示：双击证物可快速发送</Text>
            </Box>
          </>
        )}

        <TextInput
          placeholder="添加说明文字（可选）..."
          value={textContent}
          onChange={(event) => setTextContent(event.currentTarget.value)}
          styles={selectorTextInputStyles}
        />

        <Group justify="flex-end" mt="lg" pt="md" style={{ borderTop: '2px solid rgba(0, 255, 255, 0.3)' }}>
          <Button variant="outline" onClick={handleClose} styles={cancelButtonStyles}>取消</Button>
          <Button
            leftSection={<IconSend size={16} />}
            onClick={handleSend}
            disabled={!selectedEvidence}
            styles={getSendButtonStyles(!!selectedEvidence)}
          >
            发送证物
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default EvidenceSelectorPanel;
