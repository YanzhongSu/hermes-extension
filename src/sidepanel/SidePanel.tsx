import { useEffect, useState } from 'react';
import { ActivityTrail } from './components/ActivityTrail';
import { ApprovalPanel } from './components/ApprovalPanel';
import { ChatInput } from './components/ChatInput';
import { ChatWindow } from './components/ChatWindow';
import { SettingsPanel } from './components/SettingsPanel';
import {
  respondToApproval,
  fetchSlashCommands,
  sendMessage,
  sendSlashCommand,
  type ApprovalRequestEvent,
  type ToolProgressEvent,
} from './hooks/useHermesApi';
import { useConversation } from './hooks/useConversation';
import { usePageContext } from './hooks/usePageContext';
import type { ActivityTrailItem, ApprovalChoice, SlashCommand } from './types';
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
  const [activityTrail, setActivityTrail] = useState<ActivityTrailItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequestEvent[]>([]);
  const [slashCommands, setSlashCommands] = useState<SlashCommand[]>([]);
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
      fetchSlashCommands(nextSettings).then(setSlashCommands).catch(() => setSlashCommands([]));
    } else {
      setSlashCommands([]);
    }
  };

  useEffect(() => {
    if (!settings.apiUrl || !settings.apiKey) {
      return;
    }
    fetchSlashCommands(settings).then(setSlashCommands).catch(() => setSlashCommands([]));
  }, [settings]);

  const handleNew = async () => {
    await resetConversation();
    setToolActivity(null);
    setActivityTrail([]);
    setPendingApprovals([]);
    setIsLoading(false);
  };

  const addActivity = (event: ToolProgressEvent) => {
    const id = event.toolCallId ?? `${event.tool}:${event.label ?? event.status}`;
    setActivityTrail((previous) => {
      const existingIndex = previous.findIndex((item) => item.id === id);
      if (existingIndex >= 0) {
        const updated = [...previous];
        const current = updated[existingIndex];
        updated[existingIndex] = {
          ...current,
          emoji: event.emoji ?? current.emoji,
          label: event.label ?? current.label,
          status: event.status,
          timestamp: Date.now(),
        };
        return updated;
      }

      const label = event.label ?? event.tool;
      const duplicateIndex = previous.findIndex((item) => item.tool === event.tool && item.label === label);
      if (duplicateIndex >= 0 && event.status === 'running') {
        const updated = [...previous];
        updated[duplicateIndex] = {
          ...updated[duplicateIndex],
          count: updated[duplicateIndex].count + 1,
          status: event.status,
          timestamp: Date.now(),
        };
        return updated;
      }

      return [
        ...previous,
        {
          id,
          tool: event.tool,
          emoji: event.emoji,
          label,
          status: event.status,
          count: 1,
          timestamp: Date.now(),
        },
      ].slice(-20);
    });
  };

  const handleApproval = async (request: ApprovalRequestEvent, choice: ApprovalChoice) => {
    try {
      await respondToApproval(settings, request, choice);
      setPendingApprovals((previous) => previous.filter((item) => item !== request));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setToolActivity({
        tool: 'approval',
        label: message,
        status: 'error',
      });
      setTimeout(() => setToolActivity(null), 3000);
    }
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

    if (userText.trim().startsWith('/') && !pageContext) {
      addMessages([userMessage, assistantMessage]);
      setIsLoading(true);
      const sessionId = await getSessionId();
      const result = await sendSlashCommand(userText.trim(), settings, sessionId);
      flushLastMessage(result);
      setIsLoading(false);
      return;
    }

    const outboundMessages = [...messages, userMessage];
    addMessages([userMessage, assistantMessage]);
    setIsLoading(true);
    setToolActivity(null);
    setActivityTrail([]);
    setPendingApprovals([]);

    let accumulated = '';
    const sessionId = await getSessionId();

    await sendMessage(outboundMessages, settings, sessionId, {
      onToken: (token) => {
        accumulated += token;
        updateLastMessage(accumulated);
      },
      onToolProgress: (event) => {
        setToolActivity(event);
        addActivity(event);
        if (event.status !== 'running') {
          setTimeout(() => setToolActivity(null), 2000);
        }
      },
      onApprovalRequest: (event) => {
        setPendingApprovals((previous) => [...previous, event]);
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

      <ActivityTrail items={activityTrail} />
      <ApprovalPanel approvals={pendingApprovals} onRespond={handleApproval} />

      {toolActivity && (toolActivity.status === 'running' || toolActivity.status === 'error') && (
        <div className={`tool-activity tool-activity-${toolActivity.status}`} role="status">
          <span>{toolActivity.emoji ?? ''}</span>
          <span>{toolActivity.label || toolActivity.tool}{toolActivity.status === 'running' ? '...' : ''}</span>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        onNew={handleNew}
        isLoading={isLoading}
        onExtractPage={extractCurrentPage}
        isExtracting={isExtracting}
        blockedReason={blockedReason}
        slashCommands={slashCommands}
      />
    </div>
  );
}
