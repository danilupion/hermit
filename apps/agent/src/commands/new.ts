import { execFileSync } from 'node:child_process';

import { createSession, isTmuxAvailable, sessionExists } from '../tmux.js';

type NewOptions = {
  command?: string;
  attach?: boolean;
};

export const newCommand = (name: string, options: NewOptions): void => {
  if (!isTmuxAvailable()) {
    console.error('Error: tmux is not installed or not in PATH');
    process.exit(1);
  }

  // Validate session name (tmux requirements)
  if (!/^[\w-]+$/.test(name)) {
    console.error(
      'Error: Session name can only contain alphanumeric characters, underscores, and hyphens',
    );
    process.exit(1);
  }

  if (sessionExists(name)) {
    console.error(`Error: Session "${name}" already exists`);
    console.error('Use a different name or kill the existing session first.');
    process.exit(1);
  }

  try {
    const session = createSession(name, options.command);
    console.log(`Created session: ${session.name} (id: ${session.id})`);

    if (options.attach) {
      console.log('Attaching to session...');
      // Use execFileSync to attach in the current terminal
      execFileSync('tmux', ['attach-session', '-t', name], { stdio: 'inherit' });
    } else {
      console.log('');
      console.log('To attach locally: tmux attach -t ' + name);
      console.log('To view remotely: Connect to the relay and select this session');
    }
  } catch (error) {
    console.error('Failed to create session:', error);
    process.exit(1);
  }
};
