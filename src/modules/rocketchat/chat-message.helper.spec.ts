import { buildChatMessage, buildNotificationUrl } from './chat-message.helper';

describe('buildNotificationUrl', () => {
  it('joins a relative link to the base url', () => {
    expect(buildNotificationUrl('http://localhost:5173', '/requests/12')).toBe(
      'http://localhost:5173/requests/12',
    );
  });

  it('ignores a trailing slash on the base url', () => {
    expect(buildNotificationUrl('http://localhost:5173/', '/requests/12')).toBe(
      'http://localhost:5173/requests/12',
    );
  });

  it('adds a missing leading slash', () => {
    expect(buildNotificationUrl('http://localhost:5173', 'requests/12')).toBe(
      'http://localhost:5173/requests/12',
    );
  });

  it('keeps an absolute link unchanged', () => {
    expect(
      buildNotificationUrl('http://localhost:5173', 'https://example.com/a'),
    ).toBe('https://example.com/a');
  });
});

describe('buildChatMessage', () => {
  it('puts the title in bold above the message', () => {
    expect(buildChatMessage({ title: 'Title', message: 'Body' })).toBe(
      '*Title*\nBody',
    );
  });

  it('appends the full link when a base url is given', () => {
    expect(
      buildChatMessage(
        { title: 'Title', message: 'Body', link: '/requests/12' },
        'http://localhost:5173',
      ),
    ).toBe('*Title*\nBody\nhttp://localhost:5173/requests/12');
  });

  it('omits the link when no base url is configured', () => {
    expect(
      buildChatMessage({
        title: 'Title',
        message: 'Body',
        link: '/requests/12',
      }),
    ).toBe('*Title*\nBody');
  });

  it('omits the link when the notification has none', () => {
    expect(
      buildChatMessage(
        { title: 'Title', message: 'Body' },
        'http://localhost:5173',
      ),
    ).toBe('*Title*\nBody');
  });
});
