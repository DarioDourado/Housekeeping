---
name: 09-i18n
description: >
  Configuração i18next/react-i18next e estrutura de ficheiros de tradução.
  Use when: tradução, i18n, idioma, locale, pt.json, en.json.
metadata:
  stack: "react-web"
  scope: "ux"
  requires: "[]"
  related: "[02-folder-structure]"
  last-verified: "2026-07-25"
---
# I18N - Internacionalização

## Configuração

```typescript
// lang/i18n.config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from './pt.json';
import en from './en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    fallbackLng: 'pt',
    supportedLngs: ['pt', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
```

## Estrutura JSON Base

```json
{
  "common": {
    "loading": "A carregar...",
    "error": "Ocorreu um erro",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "search": "Pesquisar",
    "noResults": "Sem resultados",
    "confirm": "Confirmar",
    "back": "Voltar",
    "next": "Seguinte",
    "undo": "Desfazer",
    "retry": "Tentar novamente",
    "uploading": "A enviar...",
    "learnMore": "Saber mais",
    "close": "Fechar",
    "bulkActions": "Acoes em lote",
    "deletePermanently": "Elimina permanentemente este registo",
    "dismiss": "Dispensar",
    "language": "Idioma"
  },
  "nav": {
    "breadcrumbs": "Navegação estrutural"
  },
  "auth": {
    "login": "Entrar",
    "logout": "Sair",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Esqueceu a password?"
  },
  "languages": {
    "pt": "Português",
    "en": "English"
  },
  "validation": {
    "required": "Campo obrigatório",
    "email": "Email inválido",
    "minLength": "Mínimo {{count}} caracteres",
    "maxLength": "Máximo {{count}} caracteres",
    "passwordMinLength": "A password deve ter pelo menos 8 caracteres",
    "passwordLetter": "A password deve incluir pelo menos uma letra",
    "passwordNumber": "A password deve incluir pelo menos um número",
    "passwordMatch": "As passwords não coincidem",
    "fileTooLarge": "O ficheiro excede o tamanho máximo (5 MB)",
    "fileType": "Tipo de ficheiro não suportado"
  },
  "errors": {
    "generic": "Ocorreu um erro. Tente novamente.",
    "network": "Erro de ligação. Verifique a internet e tente novamente.",
    "offline": "Sem ligação à internet. As alterações não serão guardadas.",
    "unauthorized": "Não autorizado",
    "notFound": "Não encontrado"
  },
  "results": {
    "count_one": "{{count}} resultado",
    "count_other": "{{count}} resultados"
  }
}
```

## Terminologia do domínio (Heurística 2 — sistema ↔ mundo real)

**Regra:** as traduções usam o vocabulário do **utilizador**, não o do código ou da base de dados. O Context Prompt de cada projeto define o glossário do domínio; as keys refletem-no.

| ❌ Jargão técnico | ✅ Linguagem do utilizador |
|---|---|
| "Persistir entidade" | "Guardar alterações" |
| "Registo inválido (constraint violation)" | "Este email já está registado" |
| "Fetch falhou" | "Não foi possível carregar os dados" |
| "Deletar user" (anglicismo + termo de BD) | "Eliminar utilizador" |

O mesmo termo do domínio traduz-se **sempre da mesma forma** em toda a app (ex.: se o domínio diz "colaborador", nunca alternar com "funcionário"/"utilizador") — manter um glossário no topo do `pt.json` como comentário de referência do Context Prompt.

## Padrão de Keys

```
{domínio}.{grupo}.{key}

Exemplos:
- common.save
- auth.login
- validation.required
- users.form.name
- users.messages.created
```

## Uso

```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('users.title')}</h1>
      <p>{t('validation.minLength', { count: 8 })}</p>
      <button>{t('common.save')}</button>
    </div>
  );
};
```

## Plurais (i18next)

```typescript
// i18next escolhe a forma pelo count — nunca concatenar "s" manualmente
t('results.count', { count: 1 });  // "1 resultado"
t('results.count', { count: 7 });  // "7 resultados"
```

As keys usam os sufixos CLDR (`_one`, `_other`; outros idiomas podem exigir `_few`/`_many`) — ver o bloco `results` no JSON acima.

## Datas, números e moeda — sempre `Intl`, nunca em strings de tradução

**Regra:** formatos de data/número/moeda saem da `Intl` API com o locale ativo (`i18n.language`), nunca hardcoded nem embutidos em traduções. É para isto que existe `utils/formatters/` (`02-folder-structure`).

```typescript
// utils/formatters/date.ts
import i18n from '@/lang/i18n.config';

export const formatDate = (iso: string, locale = i18n.language) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
// pt: "2 de jul. de 2026" · en: "Jul 2, 2026"

export const formatDateTime = (iso: string, locale = i18n.language) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
```

```typescript
// utils/formatters/number.ts
import i18n from '@/lang/i18n.config';

export const formatCurrency = (value: number, locale = i18n.language, currency = 'EUR') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
// pt: "1 234,56 €" · en: "€1,234.56"

export const formatNumber = (value: number, locale = i18n.language) =>
  new Intl.NumberFormat(locale).format(value);
```

## Mudar Idioma

```typescript
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <label>
      <span className="sr-only">{t('common.language')}</span>
      <select
      value={i18n.language} 
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        <option value="pt">{t('languages.pt')}</option>
        <option value="en">{t('languages.en')}</option>
      </select>
    </label>
  );
};
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Sem strings hardcoded | TODOS os textos via i18n |
| Keys descritivas | `users.form.name` não `u.f.n` |
| Interpolação para variáveis | `{{count}}`, `{{name}}` |
| Plurais via sufixos i18next | `key_one`/`key_other` — nunca concatenar "s" manualmente |
| Datas/números/moeda via `Intl` | `utils/formatters/` com o locale ativo — nunca em strings de tradução |
| Ficheiro por idioma | `pt.json`, `en.json` |
