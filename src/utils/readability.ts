import { Readability } from '@mozilla/readability';

export interface ExtractedContent {
  title: string;
  text: string;
  url: string;
  wordCount: number;
}

export function extractPageContent(): ExtractedContent | null {
  try {
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article?.textContent) return null;

    const text = article.textContent.trim();
    return {
      title: article.title ?? document.title,
      text,
      url: window.location.href,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  } catch {
    return null;
  }
}

export function extractVisibleText(): ExtractedContent {
  const skipTags = new Set(['SCRIPT', 'STYLE', 'NAV', 'FOOTER', 'HEADER']);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (skipTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.offsetParent === null) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const texts: string[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    if (text && text.length > 10) texts.push(text);
  }

  const combined = texts.join('\n').slice(0, 8000);
  return {
    title: document.title,
    text: combined,
    url: window.location.href,
    wordCount: combined.split(/\s+/).filter(Boolean).length,
  };
}
