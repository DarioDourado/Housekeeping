import { describe, expect, it } from 'vitest';
import { i18n } from '@/lang/i18n.config';

describe('document language', () => {
  it('should follow the active i18n language', async () => {
    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    await i18n.changeLanguage('pt');
    expect(document.documentElement.lang).toBe('pt');
  });
});
