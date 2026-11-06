export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
};
