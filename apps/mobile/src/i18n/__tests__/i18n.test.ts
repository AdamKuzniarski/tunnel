import { i18n, t } from '@/i18n';

afterEach(() => {
  i18n.locale = 'en';
});

describe('t() — default locale', () => {
  it('returns English strings when locale is en', () => {
    i18n.locale = 'en';
    expect(t('common.loading')).toBe('Loading...');
    expect(t('session.title')).toBe('Inside the tunnel');
  });
});

describe('t() — German locale', () => {
  it('returns German strings when locale is de', () => {
    i18n.locale = 'de';
    expect(t('common.loading')).toBe('Lädt...');
    expect(t('session.title')).toBe('Im Tunnel');
  });
});

describe('t() — unsupported locale fallback', () => {
  it('falls back to English for an unsupported locale', () => {
    i18n.locale = 'fr';
    expect(t('common.loading')).toBe('Loading...');
    expect(t('session.title')).toBe('Inside the tunnel');
  });
});

describe('t() — interpolation', () => {
  it('interpolates {{count}} in a singular string', () => {
    i18n.locale = 'en';
    expect(t('home.apps_ready', { count: 1 })).toBe('1 app ready to block');
  });

  it('interpolates {{count}} in a plural string', () => {
    i18n.locale = 'en';
    expect(t('home.apps_ready', { count: 5 })).toBe('5 apps ready to block');
  });

  it('interpolates {{count}} in German', () => {
    i18n.locale = 'de';
    expect(t('home.apps_ready', { count: 3 })).toBe('3 Apps bereit zum Blockieren');
  });
});

describe('t() — missing keys', () => {
  it('returns a string (not a crash) for a missing key', () => {
    i18n.locale = 'en';
    const result = t('nonexistent.key');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a string for a deeply missing key', () => {
    i18n.locale = 'de';
    const result = t('home.does_not_exist');
    expect(typeof result).toBe('string');
  });
});
