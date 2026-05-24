import type {
  ApprovalChoice,
  ApprovalRequestEvent,
  HermesSettings,
  Message,
  SlashCommand,
  ToolProgressEvent,
} from '../types';

export type { ApprovalRequestEvent, ToolProgressEvent };

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onToolProgress: (event: ToolProgressEvent) => void;
  onApprovalRequest: (event: ApprovalRequestEvent) => void;
  onComplete: (fullText: string) => void;
  onError: (error: string) => void;
}

function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
}

function parseSseEvent(rawEvent: string): { eventType: string | null; data: string } | null {
  const lines = rawEvent.split(/\r?\n/);
  let eventType: string | null = null;
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventType = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return { eventType, data: dataLines.join('\n') };
}

export async function sendMessage(
  messages: Pick<Message, 'role' | 'content'>[],
  settings: HermesSettings,
  sessionId: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  if (!settings.apiUrl || !settings.apiKey) {
    callbacks.onError('Hermes is not configured. Open Settings to add your API URL and key.');
    return;
  }

  const payload = {
    model: 'hermes',
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    stream: true,
  };

  try {
    const response = await fetch(`${normalizeApiUrl(settings.apiUrl)}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
        'X-Hermes-Session-Id': sessionId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      callbacks.onError(`API error ${response.status}: ${errorText}`);
      return;
    }

    if (!response.body) {
      callbacks.onError('API response did not include a readable stream.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';

      for (const rawEvent of events) {
        const event = parseSseEvent(rawEvent);
        if (!event || event.data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(event.data);

          if (event.eventType === 'hermes.tool.progress') {
            callbacks.onToolProgress(parsed as ToolProgressEvent);
            continue;
          }

          if (event.eventType === 'hermes.approval.request') {
            callbacks.onApprovalRequest(parsed as ApprovalRequestEvent);
            continue;
          }

          const token = parsed.choices?.[0]?.delta?.content ?? '';
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        } catch {
          // Ignore malformed chunks and keep the stream alive.
        }
      }
    }

    if (buffer.trim()) {
      const event = parseSseEvent(buffer);
      if (event && event.data !== '[DONE]') {
        try {
          const parsed = JSON.parse(event.data);
          if (event.eventType === 'hermes.tool.progress') {
            callbacks.onToolProgress(parsed as ToolProgressEvent);
          } else if (event.eventType === 'hermes.approval.request') {
            callbacks.onApprovalRequest(parsed as ApprovalRequestEvent);
          } else {
            const token = parsed.choices?.[0]?.delta?.content ?? '';
            if (token) {
              fullText += token;
              callbacks.onToken(token);
            }
          }
        } catch {
          // Ignore incomplete trailing data.
        }
      }
    }

    callbacks.onComplete(fullText);
  } catch (error) {
    callbacks.onError(`Network error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function respondToApproval(
  settings: HermesSettings,
  request: ApprovalRequestEvent,
  choice: ApprovalChoice,
): Promise<void> {
  if (!settings.apiUrl || !settings.apiKey) {
    throw new Error('Hermes is not configured. Open Settings to add your API URL and key.');
  }

  const response = await fetch(`${normalizeApiUrl(settings.apiUrl)}/v1/approvals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
      'X-Hermes-Session-Id': request.sessionId ?? '',
    },
    body: JSON.stringify({
      approval_session_key: request.approvalSessionKey,
      session_id: request.sessionId,
      choice,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Approval error ${response.status}: ${errorText}`);
  }
}

export async function sendSlashCommand(
  command: string,
  settings: HermesSettings,
  sessionId: string,
): Promise<string> {
  if (!settings.apiUrl || !settings.apiKey) {
    return 'Hermes is not configured. Open Settings to add your API URL and key.';
  }

  const response = await fetch(`${normalizeApiUrl(settings.apiUrl)}/v1/commands`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
      'X-Hermes-Session-Id': sessionId,
    },
    body: JSON.stringify({
      command,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return `Command error ${response.status}: ${errorText}`;
  }

  const parsed = await response.json();
  return parsed.content ?? '';
}

export async function fetchSlashCommands(settings: HermesSettings): Promise<SlashCommand[]> {
  if (!settings.apiUrl || !settings.apiKey) return [];

  const response = await fetch(`${normalizeApiUrl(settings.apiUrl)}/v1/commands`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      command: '/help',
    }),
  });

  if (!response.ok) return [];

  const parsed = await response.json();
  return Array.isArray(parsed.commands) ? (parsed.commands as SlashCommand[]) : [];
}
