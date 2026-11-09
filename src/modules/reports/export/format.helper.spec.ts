import { formatCell, toText } from './format.helper';

describe('format.helper', () => {
  describe('formatCell', () => {
    it('renders an em dash for an empty value', () => {
      expect(formatCell(null, 'text')).toBe('—');
      expect(formatCell(undefined, 'text')).toBe('—');
      expect(formatCell('', 'text')).toBe('—');
    });

    it('keeps a zero instead of treating it as empty', () => {
      expect(formatCell(0, 'number')).toBe('0');
    });

    it('formats money with two decimals and a currency sign', () => {
      expect(formatCell(1234.5, 'money')).toBe('1,234.50 ₪');
    });

    it('formats a percentage with one decimal', () => {
      expect(formatCell(85.67, 'percent')).toBe('85.7%');
    });

    it('groups thousands in a plain number', () => {
      expect(formatCell(1234567, 'number')).toBe('1,234,567');
    });

    it('trims a timestamp down to its date part', () => {
      expect(formatCell('2026-05-01T13:45:00.000Z', 'date')).toBe('2026-05-01');
    });

    it('passes text through unchanged', () => {
      expect(formatCell('Hosam Tarade', 'text')).toBe('Hosam Tarade');
    });
  });

  describe('toText', () => {
    it('serialises an object instead of producing [object Object]', () => {
      expect(toText({ id: 7 })).toBe('{"id":7}');
    });

    it('renders a date as an ISO string', () => {
      expect(toText(new Date('2026-05-01T00:00:00.000Z'))).toBe(
        '2026-05-01T00:00:00.000Z',
      );
    });

    it('renders a boolean as a word', () => {
      expect(toText(false)).toBe('false');
    });
  });
});
