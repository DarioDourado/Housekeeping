import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function inventory(base = root) {
  return fs.readdirSync(base).filter((name) => /^\d{2}-[a-z0-9-]+$/.test(name))
    .sort().map((name) => {
      const file = path.join(base, name, 'SKILL.md');
      const text = fs.readFileSync(file, 'utf8');
      const match = text.match(/^---\n([\s\S]*?)\n---\n/);
      if (!match) throw new Error(`${name}: missing frontmatter`);
      const doc = parseDocument(match[1], { uniqueKeys: true });
      if (doc.errors.length) throw new Error(`${name}: ${doc.errors.join('; ')}`);
      const meta = doc.toJS();
      if (meta.name !== name) throw new Error(`${name}: name must match directory, found ${meta.name}`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.name) || meta.name.length > 64) throw new Error(`${name}: invalid name`);
      if (typeof meta.description !== 'string' || !meta.description.trim() || meta.description.length > 1024) throw new Error(`${name}: invalid description`);
      if (meta.metadata !== undefined && (!meta.metadata || typeof meta.metadata !== 'object'
        || Array.isArray(meta.metadata) || Object.values(meta.metadata).some((value) => typeof value !== 'string'))) {
        throw new Error(`${name}: metadata must be a string map`);
      }
      return { name, meta, text, body: text.slice(match[0].length) };
    });
}

export function outputs(modules) {
  const index = modules.map(({ name, meta }) => `- [${name}](${name}/SKILL.md): ${meta.description.trim().replace(/\s+/g, ' ')}`).join('\n');
  const core = fs.readFileSync(path.join(root, 'instructions/core.md'), 'utf8');
  const table = modules.map(({ name }) => `- [${name}](skills/${name}/SKILL.md)`).join('\n');
  return {
    'MODULES.md': `# Modulos disponiveis\n\nGerado por scripts/corpus.mjs; editar as fontes.\n\n${index}\n`,
    'react-core.md': `${core.trim()}\n\n## Catalogo sob pedido\n\nCaminhos relativos a .github/copilot-instructions.md na distribuicao Copilot.\n\n${table}\n`,
    'react-master.md': `# React Enterprise System v2\n\nGerado deterministicamente de ${modules.length} modulos. Referencia completa; preferir react-core.md e skills por tarefa.\nAs instrucoes especializadas aplicam-se apenas ao respetivo ambito. Recursos relativos requerem os modulos distribuidos ao lado deste ficheiro.\n\n${modules.map(({ name }) => `- [${name}](#${name})`).join('\n')}\n${modules.map(({ name, body }) => `\n---\n\n<a id="${name}"></a>\n\n<!-- MÓDULO: ${name} -->\n\n${body.trim().replace(/\[([^\]]*)\]\(([^)]+)\)/g, (full, label, target) => /^(?:https?:|mailto:|#)/.test(target) ? full : `[${label}](${path.posix.normalize(name + '/' + target)})`)}\n`).join('')}`,
  };
}

export function validateLinks(modules, base = root) {
  for (const { name, text } of modules) {
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(https?:|mailto:)/.test(target)) continue;
      const absolute = path.resolve(base, name, target);
      if (!absolute.startsWith(`${base}${path.sep}`) || !fs.existsSync(absolute)) throw new Error(`${name}: missing or external resource ${target}`);
    }
    for (const ref of text.matchAll(/\b\d{2}-[a-z][a-z0-9-]+/g)) {
      if (!modules.some((m) => m.name === ref[0])) throw new Error(`${name}: unknown module ${ref[0]}`);
    }
  }
}

export function check(base = root) {
  const modules = inventory(base);
  validateLinks(modules, base);
  validatePolicies(modules);
  for (const [name, expected] of Object.entries(outputs(modules))) {
    if (fs.readFileSync(path.join(base, name), 'utf8') !== expected) throw new Error(`${name}: stale; run npm run generate`);
  }
  for (const file of ['README.md', 'USAGE_GUIDE.md', '00-meta/SKILL.md']) {
    if (!fs.readFileSync(path.join(base, file), 'utf8').includes('MODULES.md')) throw new Error(`${file}: no complete index link`);
  }
  return modules.length;
}

// Targeted regression checks, not a general proof of semantic consistency.
export function validatePolicies(modules) {
  const rules = modules.find((module) => module.name === '20-rules')?.body ?? '';
  const auth = modules.find((module) => module.name === '08-auth')?.body ?? '';
  if (!rules.includes('localStorage') || !rules.includes('dangerouslySetInnerHTML')) {
    throw new Error('20-rules: missing critical token/XSS guidance');
  }
  if (!auth.includes('single-flight')) throw new Error('08-auth: missing single-flight guidance');
  if (/único vetor XSS/i.test(rules)) throw new Error('20-rules: misleading exclusive XSS claim');
  for (const { name, text } of modules) {
    for (const line of text.split('\n')) {
      if (/(nunca|não |proib|❌|isso é CRA)/i.test(line)) continue;
      if (/REACT_APP_|cacheTime|sourcemap:\s*true|(?:local|session)Storage\.setItem\(['"]accessToken/.test(line)) {
        throw new Error(`${name}: obsolete or unsafe example: ${line.trim()}`);
      }
    }
  }
}

export function packageSkills(destination, modules = inventory()) {
  const target = path.resolve(destination);
  if (fs.existsSync(target)) throw new Error(`Destination already exists: ${target}; refusing to overwrite`);
  fs.mkdirSync(target, { recursive: true });
  for (const { name } of modules) fs.cpSync(path.join(root, name), path.join(target, name), { recursive: true });
  // Meta links to this common catalog; keep it alongside skill directories.
  fs.copyFileSync(path.join(root, 'MODULES.md'), path.join(target, 'MODULES.md'));
  fs.copyFileSync(path.join(root, 'CONTEXT-PROMPT-TEMPLATE.md'), path.join(target, 'CONTEXT-PROMPT-TEMPLATE.md'));
  validateLinks(inventory(target), target);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const command = process.argv[2];
    if (command === 'generate') {
      for (const [name, text] of Object.entries(outputs(inventory()))) fs.writeFileSync(path.join(root, name), text);
      console.log('Generated MODULES.md, react-core.md and react-master.md');
    } else if (command === 'check') console.log(`${check()} modules: metadata, links and generated artifacts valid`);
    else if (command === 'package' && process.argv[3]) { check(); packageSkills(process.argv[3]); console.log('Skills packaged; IDE discovery still requires a real smoke test'); }
    else throw new Error('Usage: node scripts/corpus.mjs generate|check|package <new-directory>');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
