export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface HermesSettings {
  apiUrl: string;
  apiKey: string;
  domainBlocklist: string[];
}

export interface ExtractedContent {
  title: string;
  text: string;
  url: string;
  wordCount: number;
  method: 'readability' | 'fallback';
}

export interface ToolProgressEvent {
  tool: string;
  emoji?: string;
  label?: string;
  status: 'running' | 'completed' | 'error';
  toolCallId?: string;
}
