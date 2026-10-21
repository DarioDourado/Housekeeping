export function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  const safe = /^[\s\u0000-\u001f]*[=+@-]|^[\t\r\n]/u.test(raw) ? "'" + raw : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
