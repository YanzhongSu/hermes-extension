export function isBlocklisted(url: string, blocklist: string[]): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return blocklist.some((domain) => {
      const normalized = domain.trim().toLowerCase();
      return normalized.length > 0 && (hostname === normalized || hostname.endsWith(`.${normalized}`));
    });
  } catch {
    return false;
  }
}
