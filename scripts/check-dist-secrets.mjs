// Fails if the public build (dist/) contains a server secret. Never prints secret values.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const DIST = 'dist';
const SECRET_NAMES = ['TURNSTILE_SECRET_KEY', 'RESEND_API_KEY'];
const TEXT_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.xml',
  '.txt',
  '.webmanifest',
  '.svg',
  '.map',
]);

// Shapes of credentials that must never ship to the browser, whatever the variable is called.
const PATTERNS = [
  { name: 'Resend API key', regex: /\bre_[A-Za-z0-9_]{20,}/ },
  { name: 'Private key block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'Supabase service_role key', regex: /service_role/ },
  { name: 'Stripe secret key', regex: /\bsk_(live|test)_[A-Za-z0-9]{10,}/ },
  { name: 'Server-only variable name', regex: /\b(TURNSTILE_SECRET_KEY|RESEND_API_KEY)\b/ },
];

/** Values from the environment and from a local .env, so the check also works on a dev machine. */
function loadSecretValues() {
  const values = new Map(
    Object.entries(process.env).filter(([name, value]) => SECRET_NAMES.includes(name) && value),
  );
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match || !SECRET_NAMES.includes(match[1])) continue;
      const value = match[2].replace(/^["']|["']$/g, '');
      if (value && !values.has(match[1])) values.set(match[1], value);
    }
  }
  // Very short values would match by accident and are not real credentials.
  return [...values].filter(([, value]) => value.length >= 8);
}

function* walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (TEXT_EXTENSIONS.has(extname(entry.name))) yield path;
  }
}

if (!existsSync(DIST)) {
  console.error('✖ No existe dist/. Ejecute "npm run build" primero.');
  process.exit(1);
}

const secrets = loadSecretValues();
const findings = [];
let scanned = 0;

for (const file of walk(DIST)) {
  scanned += 1;
  const content = readFileSync(file, 'utf8');
  for (const [name, value] of secrets) {
    if (content.includes(value))
      findings.push(`${relative('.', file)}: contiene el valor de ${name}`);
  }
  for (const { name, regex } of PATTERNS) {
    if (regex.test(content))
      findings.push(`${relative('.', file)}: coincide con el patrón "${name}"`);
  }
}

if (findings.length > 0) {
  console.error(`✖ Se encontraron posibles secretos en dist/ (${findings.length}):`);
  findings.forEach((finding) => console.error(`  - ${finding}`));
  process.exit(1);
}

console.log(
  `✓ dist/ sin secretos: ${scanned} archivos revisados, ${secrets.length} valores secretos comparados.`,
);
