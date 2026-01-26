#!/usr/bin/env node
import { Command } from 'commander';

import { connectCommand, initCommand, listCommand, newCommand } from './commands/index.js';
import { VERSION } from './index.js';

const program = new Command();

program.name('hermit').description('Hermit agent - terminal relay client').version(VERSION);

program
  .command('init')
  .description('Initialize hermit configuration')
  .option('-r, --relay-url <url>', 'Relay WebSocket URL')
  .option('-n, --machine-name <name>', 'Name for this machine')
  .option('-t, --token <token>', 'Machine token from relay')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initCommand);

program
  .command('connect')
  .description('Connect to the relay server')
  .option('-d, --daemon', 'Run in background')
  .action(connectCommand);

program.command('list').alias('ls').description('List tmux sessions').action(listCommand);

program
  .command('new <name>')
  .description('Create a new tmux session')
  .option('-c, --command <cmd>', 'Initial command to run')
  .option('-a, --attach', 'Attach to session after creation')
  .action(newCommand);

program.parse();
