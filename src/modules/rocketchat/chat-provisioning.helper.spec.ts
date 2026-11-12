import {
  buildChatUsername,
  buildDepartmentChannelName,
  generateChatPassword,
} from './chat-provisioning.helper';

describe('buildChatUsername', () => {
  it('uses the lower-cased local part of the email', () => {
    expect(buildChatUsername('Ahmad.Ali@ppu.edu.ps')).toBe('ahmad.ali');
  });

  it('replaces unsupported characters with dots', () => {
    expect(buildChatUsername('a+b c@example.com')).toBe('a.b.c');
  });

  it('falls back to a default when nothing usable remains', () => {
    expect(buildChatUsername('+++@example.com')).toBe('user');
  });

  it('appends the suffix when one is given', () => {
    expect(buildChatUsername('ahmad@example.com', 7)).toBe('ahmad.7');
  });

  it('never exceeds the maximum length', () => {
    const long = `${'a'.repeat(50)}@example.com`;
    expect(buildChatUsername(long)).toHaveLength(30);
    const withSuffix = buildChatUsername(long, 12);
    expect(withSuffix).toHaveLength(30);
    expect(withSuffix.endsWith('.12')).toBe(true);
  });
});

describe('buildDepartmentChannelName', () => {
  it('derives a stable name from the department id', () => {
    expect(buildDepartmentChannelName(5)).toBe('dept-5');
  });
});

describe('generateChatPassword', () => {
  it('returns a long url-safe string', () => {
    expect(generateChatPassword()).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  it('returns a different value each time', () => {
    expect(generateChatPassword()).not.toBe(generateChatPassword());
  });
});
