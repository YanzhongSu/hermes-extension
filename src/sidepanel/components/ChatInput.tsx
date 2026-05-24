import { type KeyboardEvent, useState } from 'react';
import type { ExtractedContent } from '../types';

interface ChatInputProps {
  onSend: (message: string, pageContext?: string) => void;
  onNew: () => void;
  isLoading: boolean;
  onExtractPage: () => Promise<ExtractedContent | null>;
  isExtracting: boolean;
  blockedReason: string | null;
}

function formatPageContext(content: ExtractedContent): string {
  return [
    `Title: ${content.title}`,
    `URL: ${content.url}`,
    `Words: ${content.wordCount}`,
    '',
    content.text,
  ].join('\n');
}

export function ChatInput({
  onSend,
  onNew,
  isLoading,
  onExtractPage,
  isExtracting,
  blockedReason,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [pageContext, setPageContext] = useState<string | undefined>();
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    if (trimmed === '/new') {
      onNew();
      setValue('');
      setPageContext(undefined);
      setPageTitle(null);
      setNotice('Conversation cleared');
      setTimeout(() => setNotice(null), 2200);
      return;
    }

    onSend(trimmed, pageContext);
    setValue('');
    setPageContext(undefined);
    setPageTitle(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const attachPage = async () => {
    const content = await onExtractPage();
    if (!content) return;
    setPageContext(formatPageContext(content));
    setPageTitle(content.title || new URL(content.url).hostname);
    setNotice('Page attached');
    setTimeout(() => setNotice(null), 2200);
  };

  return (
    <footer className="composer">
      {(notice || blockedReason || pageTitle) && (
        <div className="composer-status" role="status">
          {blockedReason ?? notice ?? `Page attached: ${pageTitle}`}
        </div>
      )}
      <div className="composer-row">
        <button
          className="secondary-button attach-button"
          type="button"
          onClick={attachPage}
          disabled={isLoading || isExtracting}
          title="Attach current page"
        >
          {isExtracting ? '...' : '@ page'}
        </button>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          placeholder={isLoading ? 'Hermes is responding...' : 'Message Hermes'}
        />
        <button className="primary-button send-button" type="button" onClick={submit} disabled={isLoading || !value.trim()}>
          Send
        </button>
      </div>
    </footer>
  );
}
