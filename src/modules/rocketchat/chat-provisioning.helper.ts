import { randomBytes } from 'crypto';

const MAX_USERNAME_LENGTH = 30;

function trimEdges(value: string): string {
  return value.replace(/^[._-]+|[._-]+$/g, '');
}

export function buildChatUsername(email: string, suffix?: number): string {
  const localPart = email.split('@')[0].toLowerCase();
  const cleaned = trimEdges(
    localPart.replace(/[^a-z0-9._-]+/g, '.').replace(/\.{2,}/g, '.'),
  );
  const base = cleaned || 'user';

  if (suffix === undefined) {
    return trimEdges(base.slice(0, MAX_USERNAME_LENGTH)) || 'user';
  }

  const tail = `.${suffix}`;
  const head = trimEdges(base.slice(0, MAX_USERNAME_LENGTH - tail.length));
  return `${head || 'user'}${tail}`;
}

export function buildDepartmentChannelName(departmentId: number): string {
  return `dept-${departmentId}`;
}

export function generateChatPassword(): string {
  return randomBytes(24).toString('base64url');
}
