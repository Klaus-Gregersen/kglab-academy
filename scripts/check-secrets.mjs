import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const staged = process.argv.includes('--staged');
const args = staged
  ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']
  : ['ls-files', '--cached', '--others', '--exclude-standard', '-z'];
const files = [
  ...new Set(execFileSync('git', args, { encoding: 'utf8' }).split('\0').filter(Boolean)),
];
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bsk-[A-Za-z0-9_-]{30,}\b/,
];
const problems = [];
for (const path of files) {
  const name = path.split('/').at(-1);
  if (
    (/^\.env(?:\.|$)/i.test(name) && name !== '.env.example') ||
    /\.(?:pem|key|p12|pfx|log|kdbx|tfstate[^.]*|sqlite(?:-wal|-shm)?)$/i.test(name) ||
    /(?:^|\/)(?:data|\.ssh|\.kube|\.aws)(?:\/|$)/.test(path) ||
    /^(?:id_rsa|id_ed25519|kubeconfig|credentials.*\.json$|\.(?:npmrc|netrc|pypirc)$)/i.test(name)
  ) {
    problems.push(`${path}: private configuration or data path`);
    continue;
  }
  let data;
  try {
    data = staged
      ? execFileSync('git', ['show', `:${path}`], { maxBuffer: 20 * 1024 * 1024 })
      : readFileSync(path);
  } catch (cause) {
    if (!staged && cause.code === 'ENOENT') continue;
    throw cause;
  }
  if (data.includes(0)) continue;
  if (patterns.some((pattern) => pattern.test(data.toString('utf8'))))
    problems.push(`${path}: possible credential (contents withheld)`);
}
if (problems.length) {
  console.error(`Secret guard blocked ${problems.length} file(s):\n${problems.join('\n')}`);
  process.exitCode = 1;
} else
  console.log(
    `Secret guard checked ${files.length} ${staged ? 'staged' : 'candidate'} files. No matching credentials or forbidden paths found.`,
  );
