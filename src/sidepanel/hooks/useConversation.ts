import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearConversation,
  getConversation,
  saveConversation,
  type Message,
} from '../../utils/storage';

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getConversation().then((stored) => {
      setMessages(stored);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const scheduleSave = useCallback((nextMessages: Message[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveConversation(nextMessages);
    }, 1000);
  }, []);

  const saveNow = useCallback((nextMessages: Message[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveConversation(nextMessages);
  }, []);

  const addMessage = useCallback(
    (role: Message['role'], content: string): Message => {
      const message: Message = {
        id: crypto.randomUUID(),
        role,
        content,
        timestamp: Date.now(),
      };
      setMessages((previous) => {
        const next = [...previous, message];
        scheduleSave(next);
        return next;
      });
      return message;
    },
    [scheduleSave],
  );

  const addMessages = useCallback(
    (newMessages: Message[]) => {
      setMessages((previous) => {
        const next = [...previous, ...newMessages];
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const updateLastMessage = useCallback((content: string) => {
    setMessages((previous) => {
      if (previous.length === 0) return previous;
      const updated = [...previous];
      updated[updated.length - 1] = { ...updated[updated.length - 1], content };
      return updated;
    });
  }, []);

  const flushLastMessage = useCallback(
    (content: string) => {
      setMessages((previous) => {
        if (previous.length === 0) return previous;
        const updated = [...previous];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content };
        saveNow(updated);
        return updated;
      });
    },
    [saveNow],
  );

  const resetConversation = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await clearConversation();
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    addMessages,
    updateLastMessage,
    flushLastMessage,
    resetConversation,
    isLoaded,
  };
}
