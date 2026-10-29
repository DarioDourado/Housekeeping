---
name: 26-privacy
description: >
  RGPD por construção: consentimento, minimização de dados, telemetria sem PII.
  Use when: RGPD, privacidade, consentimento, cookies, GDPR.
metadata:
  stack: "react-web"
  scope: "security"
  requires: "[]"
  related: "[06-patterns, 08-auth, 10-forms, 11-error-handling, 15-env, 20-rules]"
  last-verified: "2026-10-25"
---
# PRIVACY - RGPD e Privacidade

## Objetivo

Garantir que qualquer app gerada por este sistema cumpre o RGPD por construção: consentimento real antes de tracking, minimização de dados no client, e separação clara entre telemetria técnica e analytics de produto. Para software usado na UE isto é requisito legal, não polish. Complementa `11-error-handling` (Sentry sem PII) e `15-env` (flags).

## Classificação — o que exige consentimento e o que não

| Categoria | Exemplos neste sistema | Base legal | Consentimento? |
|---|---|---|---|
| **Essencial** | Cookie httpOnly de refresh (`08-auth`), preferência de idioma (`09-i18n`), flag de hint visto (`06-patterns`) | Necessário ao serviço | **Não** (mas informar na política) |
| **Telemetria técnica** | Sentry sem PII (`11`), Core Web Vitals (`22`) | Interesse legítimo — **só válido com scrubbing** (`beforeSend`, sem PII) | Não, se e só se sem dados pessoais |
| **Analytics de produto** | Comportamento de utilização, funis, heatmaps | Consentimento | **Sim — opt-in prévio** |
| **Marketing** | Pixels, remarketing | Consentimento | **Sim — opt-in prévio** |

## ConsentContext

**Regras:** nada de analytics/marketing carrega antes do opt-in; recusar é tão fácil como aceitar (dois botões iguais, sem dark patterns, sem cookie wall); a escolha persiste e é revogável a qualquer momento (página de definições).

```typescript
// context/ConsentContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  decidedAt: string | null; // null = ainda não respondeu → mostrar banner
}

const STORAGE_KEY = 'consent'; // a preferência de consentimento é, ela própria, essencial

const FALLBACK_CONSENT: ConsentState = { analytics: false, marketing: false, decidedAt: null };

const readConsent = (): ConsentState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return FALLBACK_CONSENT;
  try {
    return { ...FALLBACK_CONSENT, ...JSON.parse(raw) };
  } catch {
    // fail-closed: storage corrompido regista "recusado", nunca crasha a app no arranque
    return FALLBACK_CONSENT;
  }
};

interface ConsentContextType {
  consent: ConsentState;
  updateConsent: (patch: Partial<Pick<ConsentState, 'analytics' | 'marketing'>>) => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const ConsentProvider = ({ children }: { children: ReactNode }) => {
  const [consent, setConsent] = useState<ConsentState>(readConsent);

  const updateConsent = useCallback((patch: Partial<Pick<ConsentState, 'analytics' | 'marketing'>>) => {
    setConsent((prev) => {
      const next = { ...prev, ...patch, decidedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return <ConsentContext.Provider value={{ consent, updateConsent }}>{children}</ConsentContext.Provider>;
};

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsent must be used within ConsentProvider');
  return context;
};
```

## Banner de consentimento

```tsx
// UI/components/ConsentBanner/ConsentBanner.tsx
export const ConsentBanner = () => {
  const { t } = useTranslation();
  const { consent, updateConsent } = useConsent();

  if (consent.decidedAt) return null; // já respondeu — não reperguntar a cada visita

  return (
    <div role="dialog" aria-label={t('privacy.banner.title')}
         className="fixed bottom-0 inset-x-0 z-50 bg-white p-4 shadow-lg dark:bg-gray-800">
      <p className="text-sm">{t('privacy.banner.message')}</p>
      <div className="mt-3 flex gap-2">
        {/* Recusar tem o MESMO peso visual que aceitar — sem dark patterns */}
        <Button variant="secondary" onClick={() => updateConsent({ analytics: false, marketing: false })}>
          {t('privacy.banner.reject')}
        </Button>
        <Button variant="primary" onClick={() => updateConsent({ analytics: true, marketing: false })}>
          {t('privacy.banner.accept')}
        </Button>
      </div>
    </div>
  );
};
```

## Gate de analytics — nunca carregar antes do opt-in

```typescript
// App.tsx — o script de analytics só entra na página após consentimento
const { consent } = useConsent();

useEffect(() => {
  if (env.enableAnalytics && consent.analytics) {
    // Adapter do projeto: inicia o SDK e devolve cleanup sincrono.
    // Se o import for async, cancelar/ignorar resolucoes apos revogacao.
    return startAnalytics();
  }
}, [consent.analytics, env.enableAnalytics]);
```

`VITE_ENABLE_ANALYTICS` (`15-env`) continua a existir como kill-switch de build — o consentimento é a segunda condição, nunca a alternativa.

## Política de storage no client

**Regra:** tudo o que o sistema escreve em `localStorage`/`sessionStorage`/IndexedDB está inventariado; **nunca PII nem tokens** (`20-rules` ❌1); limpeza no logout do que é de sessão.

| Key | Storage | Conteúdo | Vida |
|---|---|---|---|
| `i18nextLng` | localStorage | Código de idioma | Permanente (essencial) |
| `onboarding-dismissed-*` | localStorage | Flag booleana | Permanente (essencial) |
| `consent` | localStorage | Preferência de consentimento | Permanente (essencial) |
| Draft opcional | Memoria por defeito | Allowlist nao sensivel com schema (`10-forms`) | TTL e limpeza na troca de sessao |

Integrar a limpeza no callback clearPrivateData de createAuthClient (08-auth),
incluindo cancelamento e limpeza da cache privada e de drafts em memoria.
Nao duplicar o estado de sessao nem atrasar a limpeza local ate ao pedido remoto.
Sincronizacao entre separadores requer um adapter explicito; enviar apenas sinais,
nunca tokens ou dados pessoais.


## PII em telemetria e limites da validacao tecnica

A remocao de alguns campos nao prova anonimato nem estabelece uma base legal.
URLs, breadcrumbs, payloads e identificadores podem continuar a conter dados pessoais.
Preferir uma allowlist minima, verificar o payload real e documentar retencao,
destinatarios e acesso. Validacao tecnica nao certifica conformidade com RGPD:
a base legal e a necessidade de consentimento exigem avaliacao propria.

## Traduções

```json
"privacy": {
  "banner": {
    "title": "Privacidade",
    "message": "Usamos cookies essenciais para o funcionamento da app. Com o teu consentimento, usamos também analytics para melhorar o produto.",
    "accept": "Aceitar analytics",
    "reject": "Só essenciais"
  }
}
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Opt-in prévio para analytics/marketing | O SDK não é sequer descarregado antes do consentimento |
| Recusar = mesmo peso visual que aceitar | Sem dark patterns, sem cookie walls |
| Essenciais sem consentimento, mas informados | Cookie de auth, idioma, consentimento em si |
| Telemetria técnica só sem PII | `beforeSend` do Sentry é o que sustenta o interesse legítimo (`11`) |
| Storage inventariado | Tabela acima atualizada a cada key nova; nunca PII/tokens |
| Limpeza no logout | Drafts e dados de sessão removidos (propaga entre tabs via `authChannel`) |
| Escolha revogável | Página de definições permite mudar o consentimento a qualquer momento |
