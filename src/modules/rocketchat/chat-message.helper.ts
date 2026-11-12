export interface ChatNotificationContent {
  title: string;
  message: string;
  link?: string | null;
}

export function buildNotificationUrl(baseUrl: string, link: string): string {
  if (/^https?:\/\//i.test(link)) {
    return link;
  }
  const base = baseUrl.replace(/\/+$/, '');
  const path = link.startsWith('/') ? link : `/${link}`;
  return `${base}${path}`;
}

export function buildChatMessage(
  content: ChatNotificationContent,
  baseUrl = '',
): string {
  const lines = [`*${content.title}*`, content.message];
  if (content.link && baseUrl) {
    lines.push(buildNotificationUrl(baseUrl, content.link));
  }
  return lines.join('\n');
}
