import { ScrollView } from 'react-native';

import { OptionRow, Sheet } from '@/components';
import { formatRelativeDate } from '@/lib/format';

import type { Conversation } from '../types';

type HistorySheetProps = {
  visible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
};

export function HistorySheet({ visible, onClose, conversations, activeId, onOpen, onNew }: HistorySheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Conversas">
      <OptionRow
        icon="compose"
        label="Nova conversa"
        onPress={() => {
          onNew();
          onClose();
        }}
      />
      <ScrollView style={{ maxHeight: 360 }}>
        {conversations.map((conversation) => (
          <OptionRow
            key={conversation.id}
            label={conversation.title}
            description={formatRelativeDate(conversation.updatedAt)}
            selected={conversation.id === activeId}
            onPress={() => {
              onOpen(conversation.id);
              onClose();
            }}
          />
        ))}
      </ScrollView>
    </Sheet>
  );
}
