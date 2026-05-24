import type { HermesSettings, Message } from '../sidepanel/types';

export type { HermesSettings, Message };

export interface StorageData {
  conversation: Message[];
  settings: HermesSettings;
  sessionId: string;
}

export const DEFAULT_SETTINGS: HermesSettings = {
  apiUrl: '',
  apiKey: '',
  domainBlocklist: [
    'bankofamerica.com',
    'chase.com',
    'barclays.co.uk',
    'hsbc.co.uk',
    'lloydsbank.com',
    'monzo.com',
    'paypal.com',
    'revolut.com',
  ],
};

function normalizeSettings(settings?: Partial<HermesSettings>): HermesSettings {
  return {
    apiUrl: settings?.apiUrl ?? DEFAULT_SETTINGS.apiUrl,
    apiKey: settings?.apiKey ?? DEFAULT_SETTINGS.apiKey,
    domainBlocklist: Array.isArray(settings?.domainBlocklist)
      ? settings.domainBlocklist
      : DEFAULT_SETTINGS.domainBlocklist,
  };
}

export async function getSettings(): Promise<HermesSettings> {
  const data = await chrome.storage.local.get('settings');
  return normalizeSettings(data.settings as Partial<HermesSettings> | undefined);
}

export async function saveSettings(settings: HermesSettings): Promise<void> {
  await chrome.storage.local.set({ settings: normalizeSettings(settings) });
}

export async function getConversation(): Promise<Message[]> {
  const data = await chrome.storage.local.get('conversation');
  return Array.isArray(data.conversation) ? data.conversation : [];
}

export async function saveConversation(messages: Message[]): Promise<void> {
  await chrome.storage.local.set({ conversation: messages });
}

export async function clearConversation(): Promise<void> {
  await chrome.storage.local.set({
    conversation: [],
    sessionId: crypto.randomUUID(),
  });
}

export async function getSessionId(): Promise<string> {
  const data = await chrome.storage.local.get('sessionId');
  if (typeof data.sessionId === 'string' && data.sessionId.trim()) {
    return data.sessionId;
  }
  return resetSessionId();
}

export async function resetSessionId(): Promise<string> {
  const sessionId = crypto.randomUUID();
  await chrome.storage.local.set({ sessionId });
  return sessionId;
}
