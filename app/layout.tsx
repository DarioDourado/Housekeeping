import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Vila Vita Parc — Housekeeping OS',
  description: 'Sistema integrado de Housekeeping para o resort Vila Vita Parc: gestão operacional de task sheets de manhã e turndown, sincronização com Opera Cloud, auditoria de tempos e chat interno.',
  openGraph: {
    title: 'Vila Vita Parc — Housekeeping OS',
    description: 'Sistema integrado de Housekeeping para o resort Vila Vita Parc: gestão operacional de task sheets de manhã e turndown, sincronização com Opera Cloud, auditoria de tempos e chat interno.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vila Vita Parc — Housekeeping OS',
    description: 'Sistema integrado de Housekeeping para o resort Vila Vita Parc: gestão operacional de task sheets de manhã e turndown, sincronização com Opera Cloud, auditoria de tempos e chat interno.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
