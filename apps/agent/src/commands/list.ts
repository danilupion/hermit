import { loadConfig } from '../config.js';
import { isTmuxAvailable, listSessions } from '../tmux.js';

export const listCommand = (): void => {
  if (!isTmuxAvailable()) {
    console.error('Error: tmux is not installed or not in PATH');
    process.exit(1);
  }

  const config = loadConfig();
  const sessions = listSessions();

  if (sessions.length === 0) {
    console.log('No tmux sessions found.');
    console.log('\nCreate a new session with: hermit new <name>');
    return;
  }

  console.log('Local tmux sessions:');
  console.log('');

  const maxNameLen = Math.max(...sessions.map((s) => s.name.length), 4);

  console.log(`${'NAME'.padEnd(maxNameLen)}  ID    CREATED               ATTACHED`);
  console.log('-'.repeat(maxNameLen + 40));

  for (const session of sessions) {
    const name = session.name.padEnd(maxNameLen);
    const id = session.id.padEnd(4);
    const created = session.createdAt.toLocaleString();
    const attached = session.attached ? 'yes' : 'no';

    console.log(`${name}  ${id}  ${created}  ${attached}`);
  }

  if (config) {
    console.log('');
    console.log(`Machine: ${config.machineName}`);
    console.log(`Relay: ${config.relayUrl}`);
  } else {
    console.log('');
    console.log('Tip: Run `hermit init` to connect these sessions to a relay.');
  }
};
