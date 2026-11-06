import { useCallback, useEffect, useRef, useState } from 'react';

import { DEMO_REPLY, mockConversations } from './mock-conversations';
import type { ChatMessage, Conversation } from './types';

const titleFrom = (text: string) => (text.length > 42 ? `${text.slice(0, 41).trimEnd()}…` : text);

/**
 * Chat state for the assistant screen. NO real AI: new questions receive a
 * fixed demo reply after a short delay, only to exercise the interface.
 * Conversations live in memory for this session.
 */
export function useAssistantChat() {
  const [history, setHistory] = useState<Conversation[]>(mockConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const messages = history.find((c) => c.id === activeId)?.messages ?? [];

  const append = (id: string, message: ChatMessage) =>
    setHistory((current) =>
      current.map((c) =>
        c.id === id ? { ...c, updatedAt: new Date().toISOString(), messages: [...c.messages, message] } : c,
      ),
    );

  const send = (text: string) => {
    const content = text.trim();
    if (!content || thinking) return;

    let id = activeId;
    if (!id) {
      id = `c-${Date.now().toString(36)}`;
      const conversation: Conversation = { id, title: titleFrom(content), updatedAt: new Date().toISOString(), messages: [] };
      setHistory((current) => [conversation, ...current]);
      setActiveId(id);
    }
    const conversationId = id;
    append(conversationId, { id: `m-${Date.now()}`, role: 'user', text: content });
    setThinking(true);
    timer.current = setTimeout(() => {
      append(conversationId, { id: `m-${Date.now()}-a`, role: 'assistant', text: DEMO_REPLY });
      setThinking(false);
    }, 1400);
  };

  const stopPending = () => {
    if (timer.current) clearTimeout(timer.current);
    setThinking(false);
  };

  const open = useCallback((id: string) => {
    if (timer.current) clearTimeout(timer.current);
    setThinking(false);
    setActiveId(id);
  }, []);

  const startNew = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setThinking(false);
    setActiveId(null);
  }, []);

  const deleteActive = () => {
    stopPending();
    if (activeId) setHistory((current) => current.filter((c) => c.id !== activeId));
    setActiveId(null);
  };

  return { history, activeId, messages, thinking, send, open, startNew, deleteActive };
}
