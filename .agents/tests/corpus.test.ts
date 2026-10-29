import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { inventory, outputs, validateLinks, validatePolicies, check, packageSkills, root } from '../scripts/corpus.mjs';

const temporary: string[] = [];
function workspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'react-corpus-'));
  temporary.push(dir);
  return dir;
}
afterEach(() => temporary.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

it('discovers all modules and verifies generated artifacts', () => {
  expect(inventory()).toHaveLength(35);
  expect(check()).toBe(35);
  expect(outputs(inventory())['react-core.md'].split('\n').length).toBeLessThan(120);
});

it('rejects invalid names, duplicate YAML keys and non-string metadata', () => {
  const dir = workspace();
  fs.mkdirSync(path.join(dir, '00-test'));
  const file = path.join(dir, '00-test/SKILL.md');
  for (const frontmatter of [
    'name: wrong\ndescription: Test',
    'name: 00-test\nname: 00-test\ndescription: Test',
    'name: 00-test\ndescription: Test\nmetadata:\n  scope: [bad]',
  ]) {
    fs.writeFileSync(file, `---\n${frontmatter}\n---\n# Test\n`);
    expect(() => inventory(dir)).toThrow();
  }
});

it('rejects broken resources and unknown module references', () => {
  const dir = workspace();
  fs.mkdirSync(path.join(dir, '00-test'));
  const file = path.join(dir, '00-test/SKILL.md');
  for (const body of ['[missing](references/missing.ts)', 'Consult 98-missing']) {
    fs.writeFileSync(file, `---\nname: 00-test\ndescription: Test\n---\n${body}\n`);
    expect(() => validateLinks(inventory(dir), dir)).toThrow();
  }
});

it('packages all resources without overwriting an existing installation', () => {
  const target = path.join(workspace(), 'skills');
  packageSkills(target);
  expect(inventory(target)).toHaveLength(35);
  expect(fs.existsSync(path.join(target, '08-auth/references/auth-client.ts'))).toBe(true);
  expect(() => packageSkills(target)).toThrow('refusing to overwrite');
});

it('detects master drift', () => {
  const target = path.join(workspace(), 'skills');
  packageSkills(target);
  for (const [name, value] of Object.entries(outputs(inventory()))) fs.writeFileSync(path.join(target, name), value);
  for (const file of ['README.md', 'USAGE_GUIDE.md']) fs.copyFileSync(path.join(root, file), path.join(target, file));
  fs.appendFileSync(path.join(target, 'react-master.md'), '\nDrift\n');
  expect(() => check(target)).toThrow('react-master.md: stale');
});

it('rejects known critical instruction regressions', () => {
  const modules = inventory();
  const altered = modules.map((module) => module.name === '20-rules'
    ? { ...module, body: module.body + '\nO único vetor XSS e JSX.\n' } : module);
  expect(() => validatePolicies(altered)).toThrow('misleading exclusive XSS claim');
});
