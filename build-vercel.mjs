import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./api/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: './api/index.js',
  external: [
    // Keep these as external dependencies (will be in node_modules)
    'express',
    '@trpc/server',
    'drizzle-orm',
    'postgres',
    'jose',
    'node-mailjet',
    'zod',
    'superjson',
  ],
  banner: {
    js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`,
  },
});

console.log('✅ Build complete: api/index.js');
