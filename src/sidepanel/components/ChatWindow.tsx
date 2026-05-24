import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  isLoaded: boolean;
}

export function ChatWindow({ messages, isLoading, isLoaded }: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  if (!isLoaded) {
    return <main className="chat-window chat-window-empty">Loading conversation...</main>;
  }

  if (messages.length === 0) {
    return (
      <main className="chat-window chat-window-empty">
        <div className="empty-state">
          <h1>Hermes</h1>
          <p>Ask a question or attach the current page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="chat-window">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
        />
      ))}
      <div ref={endRef} />
    </main>
  );
}
