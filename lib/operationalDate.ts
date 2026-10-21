import { OPERA_DAY_CLOSE_HOUR } from '@/config/constants';

const pad = (value: number) => String(value).padStart(2, '0');

// - Dia operacional (YYYY-MM-DD, hora local): só muda depois do fecho do Opera (~02h), nunca à meia-noite (§8.4)
export const operationalDate = (now: Date = new Date()): string => {
  const shifted = new Date(now.getTime() - OPERA_DAY_CLOSE_HOUR * 3_600_000);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
};
