import { useCallback, useState } from 'react';
import { isBlocklisted } from '../../utils/blocklist';
import type { ExtractedContent } from '../types';

export function usePageContext(blocklist: string[]) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const extractCurrentPage = useCallback(async (): Promise<ExtractedContent | null> => {
    setIsExtracting(true);
    setBlockedReason(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url || !tab?.id) return null;

      if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
        setBlockedReason('Cannot extract content from this page type.');
        return null;
      }

      if (isBlocklisted(tab.url, blocklist)) {
        setBlockedReason(
          `Page not shared with Hermes (${new URL(tab.url).hostname} is in your blocklist)`,
        );
        return null;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['inject/extractPage.js'],
      });

      return (results?.[0]?.result as ExtractedContent | null) ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Cannot access') || message.includes('No tab')) {
        setBlockedReason('Reload the page to enable page sharing with Hermes.');
      } else {
        setBlockedReason(`Extraction failed: ${message}`);
      }
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, [blocklist]);

  return { extractCurrentPage, isExtracting, blockedReason };
}
