import { i18n } from '@/lang/i18n.config';

// - Datas e horas só saem da Intl com o idioma ativo (09-i18n); o armazenado é sempre ISO-8601
export const formatTime = (iso: string, locale: string = i18n.language): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);
};

export const formatTimeWithSeconds = (iso: string, locale: string = i18n.language): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
};
