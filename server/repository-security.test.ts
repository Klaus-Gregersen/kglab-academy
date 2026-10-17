import { describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/check-secrets.mjs', import.meta.url));
function fixture(check: (cwd: string) => void) {
  const cwd = mkdtempSync(join(tmpdir(), 'academy-secret-guard-'));
  try {
    execFileSync('git', ['init', '--quiet'], { cwd });
    check(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

describe('staged secret guard', () => {
  it('checks the index even if a staged credential is removed from the working copy', () => {
    fixture((cwd) => {
      const fake = 'ghp_' + 'A'.repeat(36);
      writeFileSync(join(cwd, 'example.ts'), `export const value = '${fake}';`);
      execFileSync('git', ['add', 'example.ts'], { cwd });
      writeFileSync(join(cwd, 'example.ts'), 'export const value = 1;');
      const result = spawnSync(process.execPath, [script, '--staged'], { cwd, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('possible credential');
      expect(result.stderr).not.toContain(fake);
    });
  });
  it('blocks private staged paths without depending on their contents', () => {
    fixture((cwd) => {
      for (const path of ['.env', 'credentials.json', '.npmrc']) {
        writeFileSync(join(cwd, path), 'private fixture');
        execFileSync('git', ['add', path], { cwd });
      }
      const result = spawnSync(process.execPath, [script, '--staged'], { cwd, encoding: 'utf8' });
      expect(result.status).toBe(1);
      for (const path of ['.env', 'credentials.json', '.npmrc'])
        expect(result.stderr).toContain(path);
      expect(result.stderr).not.toContain('private fixture');
    });
  });
});
