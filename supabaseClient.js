/**
 * Launcher so `node supabaseClient.js` works from the repo root.
 * The real script lives in pasar-smart/ (deps + .env.local).
 */
const { spawn } = require('child_process');
const path = require('path');

const script = path.join(__dirname, 'pasar-smart', 'supabaseClient.mjs');
const child = spawn(process.execPath, [script], {
  cwd: path.join(__dirname, 'pasar-smart'),
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
