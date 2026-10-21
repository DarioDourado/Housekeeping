import { describe, expect, it } from 'vitest';
import pt from '@/lang/pt.json';
import en from '@/lang/en.json';
import { EVENT_LABEL_KEY } from '@/lib/eventLabels';
import { TYPOLOGY_I18N_KEY } from '@/lib/typology';
import { UserRole } from '@/types/auth.types';
import { InspectionStatus, NotPerformedReason, PriorityOrigin, SyncState, TaskStatus } from '@/types/housekeeping.types';
import { AVAILABLE_TEAM_COLORS } from '@/UI/components/TeamManager/teamColorUtils';

type Dictionary = { [key: string]: string | Dictionary };

const flatten = (dictionary: Dictionary, prefix = ''): [string, string][] =>
  Object.entries(dictionary).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value]] : flatten(value, `${prefix}${key}.`),
  );

const ptEntries = flatten(pt as Dictionary);
const enEntries = flatten(en as Dictionary);

const sources = {
  ...import.meta.glob<string>('../UI/**/*.tsx', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob<string>('../pages/**/*.tsx', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob<string>('../src/**/*.tsx', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob<string>('../routes/**/*.tsx', { query: '?raw', import: 'default', eager: true }),
};

// - texto gerado pelos comandos (LocalizedText.key) vive fora dos componentes mas é traduzido por eles
const systemSources = import.meta.glob<string>(['../services/local-api/*.ts', '../lib/*.ts'], { query: '?raw', import: 'default', eager: true });

const existingKeys = new Set(ptEntries.map(([key]) => key));
const hasKey = (key: string) =>
  existingKeys.has(key) || existingKeys.has(`${key}_one`) || existingKeys.has(`${key}_other`);

describe('chaves usadas no código', () => {
  it('todas as chaves estáticas t(\'...\') e i18nKey existem em pt.json', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(15);
    const missing: string[] = [];
    for (const [file, source] of Object.entries(sources)) {
      if (file.endsWith('.test.tsx') || file.includes('ConfigurationPage')) continue;
      // - chaves dinâmicas (template com ${}) ficam de fora; são cobertas pelos testes de UI
      for (const match of source.matchAll(/\bt\('([A-Za-z0-9_.]+)'|i18nKey="([A-Za-z0-9_.]+)"/g)) {
        const key = match[1] ?? match[2] ?? '';
        if (!hasKey(key)) missing.push(`${file.split('/').pop()}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('chaves dinâmicas', () => {
  it('as chaves de texto do sistema existem', () => {
    const missing: string[] = [];
    expect(Object.keys(systemSources).length).toBeGreaterThan(5);
    for (const [file, source] of Object.entries(systemSources)) {
      if (file.endsWith('.test.ts')) continue;
      for (const match of source.matchAll(/\bkey: '([A-Za-z0-9_.]+)'/g)) {
        if (!hasKey(match[1] ?? '')) missing.push(`${file.split('/').pop()}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('cada valor dos enums tem tradução', () => {
    const expected = [
      ...Object.values(TaskStatus).map(value => `task.status.${value}`),
      ...Object.values(NotPerformedReason).map(value => `task.notPerformed.${value}`),
      ...Object.values(InspectionStatus).map(value => `task.inspection.${value}`),
      ...Object.values(SyncState).map(value => `opera.state.${value}`),
      ...Object.values(PriorityOrigin).map(value => `room.priorityOrigin.${value}`),
      ...Object.values(EVENT_LABEL_KEY).map(value => `audit.events.${value}`),
      ...Object.values(TYPOLOGY_I18N_KEY).map(value => `credits.typologies.${value}`)
    ];
    expect(expected.filter(key => !existingKeys.has(key))).toEqual([]);
  });

  it('cada UserRole tem tradução em roles.*', () => {
    for (const role of Object.values(UserRole)) expect(existingKeys.has(`roles.${role}`), role).toBe(true);
  });

  it('cada cor de equipa tem nome e abreviatura', () => {
    for (const id of Object.keys(AVAILABLE_TEAM_COLORS)) {
      expect(existingKeys.has(`teamColors.${id}.name`), id).toBe(true);
      expect(existingKeys.has(`teamColors.${id}.short`), id).toBe(true);
    }
  });
});

describe('traduções', () => {
  it('pt e en têm exatamente as mesmas chaves', () => {
    expect(enEntries.map(([key]) => key).sort()).toEqual(ptEntries.map(([key]) => key).sort());
  });

  it('nenhuma tradução está vazia', () => {
    expect([...ptEntries, ...enEntries].filter(([, value]) => value.trim() === '')).toEqual([]);
  });

  it('as variáveis de interpolação coincidem entre idiomas', () => {
    const variables = (value: string) => (value.match(/{{\w+}}/g) ?? []).sort();
    const enMap = new Map(enEntries);
    for (const [key, value] of ptEntries) {
      expect(variables(enMap.get(key) ?? ''), key).toEqual(variables(value));
    }
  });
});
