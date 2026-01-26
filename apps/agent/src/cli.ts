#!/usr/bin/env node
import { Command } from 'commander';

import { VERSION } from './index.js';

const program = new Command();

program.name('hermit').description('Hermit agent - terminal relay client').version(VERSION);

program
  .command('init')
  .description('Initialize hermit configuration')
  .action(() => {
    console.log('hermit init - not yet implemented');
  });

program
  .command('connect')
  .description('Connect to the relay server')
  .option('-d, --daemon', 'Run in background')
  .action(() => {
    console.log('hermit connect - not yet implemented');
  });

program
  .command('list')
  .description('List tmux sessions')
  .action(() => {
    console.log('hermit list - not yet implemented');
  });

program
  .command('new <name>')
  .description('Create a new tmux session')
  .action((name: string) => {
    console.log(`hermit new ${name} - not yet implemented`);
  });

program.parse();
