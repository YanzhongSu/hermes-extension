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

export interface ApprovalRequestEvent {
  command: string;
  description?: string;
  pattern_key?: string;
  pattern_keys?: string[];
  sessionId?: string;
  approvalSessionKey: string;
  timestamp?: number;
  choices?: ApprovalChoice[];
}

export type ApprovalChoice = 'once' | 'session' | 'always' | 'deny';

export interface ActivityTrailItem {
  id: string;
  tool: string;
  emoji?: string;
  label: string;
  status: ToolProgressEvent['status'];
  count: number;
  timestamp: number;
}

export interface SlashCommand {
  name: string;
  description: string;
  category: string;
  aliases: string[];
  args_hint: string;
  subcommands: string[];
  requires_argument: boolean;
  source: 'builtin' | 'plugin';
}
