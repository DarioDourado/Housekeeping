import type { TFunction } from 'i18next';
import type { LocalizedText } from '@/types/housekeeping.types';

// - Traduz um texto gerado pelo sistema (chave + parâmetros guardados no servidor)
export const localized = (t: TFunction, text: LocalizedText): string => (text.params ? t(text.key, text.params) : t(text.key));
