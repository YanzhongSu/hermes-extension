import { useEffect, useState } from 'react';
import { ChatInput } from './components/ChatInput';
import { ChatWindow } from './components/ChatWindow';
import { SettingsPanel } from './components/SettingsPanel';
import { sendMessage, type ToolProgressEvent } from './hooks/useHermesApi';
import { useConversation } from './hooks/useConversation';
import { usePageContext } from './hooks/usePageContext';
import {
  DEFAULT_SETTINGS,
  getSessionId,
  getSettings,
  saveSettings,
  type HermesSettings,
  type Message,
} from '../utils/storage';

export function SidePanel() {
  const [settings, setSettings] = useState<HermesSettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<'chat' | 'settings'>('chat');
  const [toolActivity, setToolActivity] = useState<ToolProgressEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    messages,
    addMessages,
    updateLastMessage,
    flushLastMessage,
    resetConversation,
    isLoaded,
  } = useConversation();
  const { extractCurrentPage, isExtracting, blockedReason } = usePageContext(settings.domainBlocklist);

  useEffect(() => {
    getSettings().then((storedSettings) => {
      setSettings(storedSettings);
      if (!storedSettings.apiUrl || !storedSettings.apiKey) {
        setView('settings');
      }
    });
  }, []);

  const handleSaveSettings = async (nextSettings: HermesSettings) => {
    await saveSettings(nextSettings);
    setSettings(nextSettings);
    if (nextSettings.apiUrl && nextSettings.apiKey) {
      setView('chat');
    }
  };

  const handleNew = async () => {
    await resetConversation();
    setToolActivity(null);
    setIsLoading(false);
  };

  const handleSend = async (userText: string, pageContext?: string) => {
    if (isLoading) return;

    const content = pageContext ? `${userText}\n\n--- Page Context ---\n${pageContext}` : userText;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    const outboundMessages = [...messages, userMessage];
    addMessages([userMessage, assistantMessage]);
    setIsLoading(true);
    setToolActivity(null);

    let accumulated = '';
    const sessionId = await getSessionId();

    await sendMessage(outboundMessages, settings, sessionId, {
      onToken: (token) => {
        accumulated += token;
        updateLastMessage(accumulated);
      },
      onToolProgress: (event) => {
        setToolActivity(event);
        if (event.status !== 'running') {
          setTimeout(() => setToolActivity(null), 2000);
        }
      },
      onComplete: (fullText) => {
        flushLastMessage(fullText);
        setIsLoading(false);
        setToolActivity(null);
      },
      onError: (error) => {
        flushLastMessage(`[Error] ${error}`);
        setIsLoading(false);
        setToolActivity(null);
      },
    });
  };

  if (view === 'settings') {
    return (
      <SettingsPanel
        settings={settings}
        onSave={handleSaveSettings}
        onBack={() => setView('chat')}
      />
    );
  }

  return (
    <div className="side-panel">
      <header className="app-header">
        <h1>Hermes</h1>
        <button className="icon-button" type="button" onClick={() => setView('settings')} aria-label="Open settings">
          Settings
        </button>
      </header>

      <ChatWindow messages={messages} isLoading={isLoading} isLoaded={isLoaded} />

      {toolActivity?.status === 'running' && (
        <div className="tool-activity" role="status">
          <span>{toolActivity.emoji ?? ''}</span>
          <span>{toolActivity.label || toolActivity.tool}...</span>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        onNew={handleNew}
        isLoading={isLoading}
        onExtractPage={extractCurrentPage}
        isExtracting={isExtracting}
        blockedReason={blockedReason}
      />
    </div>
  );
}
