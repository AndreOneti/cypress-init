#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { execSync, exec } from "child_process";
import { createRequire } from "module";
import { Command } from 'commander';
import ora from 'ora';

const gitignore = readFileSync('./.gitignore', { encoding: 'utf-8' });
const require = createRequire(import.meta.url);
const { version } = require('./package.json');
const program = new Command();

program
  .version(version)
  .description('Initialize cypress project')
  .argument('<projectName>', 'Name to create the folder project')
  .option('-dev <dependencies...>', 'add new dev dependencies')
  .option('-version <version>', 'cypress version', 'latest')
  .action(async (projectName, options) => {
    const devDependencies = (options.Dev || [])?.join(' ');
    const folderCreating = ora('Creating project').start();
    const gitInit = ora('Initializing git');
    const packInit = ora('Initializing package.json');
    const depInstall = ora('Install dependencies');
    if (existsSync(projectName)) {
      folderCreating.fail('Folder already exist...');
      process.exit(1);
    }
    mkdirSync(projectName, { recursive: true });
    folderCreating.succeed();
    gitInit.start();
    process.chdir(projectName);
    execSync('git init');
    gitInit.succeed();
    packInit.start();
    execSync('npm init -y');
    const pkg = JSON.parse(readFileSync(`package.json`, { encoding: 'utf-8' }));
    pkg.scripts = { 'open': 'cypress open', 'run': 'cypress run' }
    pkg.license = "MIT";
    writeFileSync(`package.json`, JSON.stringify(pkg, null, 2));
    writeFileSync('cypress.env.json', '{}');
    writeFileSync('.gitignore', gitignore);
    packInit.succeed();
    depInstall.start();
    exec(`npm i cypress@${options.Version} ${devDependencies} -D`, error => {
      if (error) depInstall.fail(error.message);
      depInstall.succeed();
      exec('npm run open');
    });
  });

program.parse();