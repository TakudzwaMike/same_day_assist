import { spawn } from 'child_process';

console.log('🚀 Starting Same Day Assist Backend Server & Frontend Client...\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npx.cmd' : 'npx';

// 1. Spawn Backend Server
const serverProcess = spawn(npmCmd, ['tsx', 'watch', 'server/src/index.ts'], {
  stdio: 'inherit',
  shell: true
});

// 2. Spawn Vite Frontend Client
const clientProcess = spawn(npmCmd, ['vite', '--port=3000', '--host=0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\nStopping development servers...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
