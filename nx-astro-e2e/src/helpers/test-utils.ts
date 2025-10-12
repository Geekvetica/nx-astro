import { execSync, spawn, ChildProcess } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as net from 'net';

/**
 * Execute an Nx command in the test project directory
 */
export function runNxCommand(
  command: string,
  cwd: string,
  options?: { silent?: boolean; env?: NodeJS.ProcessEnv }
): string {
  const { silent = false, env = process.env } = options || {};

  try {
    const output = execSync(`npx nx ${command}`, {
      cwd,
      env,
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
    });
    return typeof output === 'string' ? output : '';
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Command failed: npx nx ${command}`);
      console.error(error.message);
    }
    throw error;
  }
}

/**
 * Execute a pnpm command in the test project directory
 */
export function runPnpmCommand(
  command: string,
  cwd: string,
  options?: { silent?: boolean; env?: NodeJS.ProcessEnv }
): string {
  const { silent = false, env = process.env } = options || {};

  try {
    const output = execSync(`pnpm ${command}`, {
      cwd,
      env,
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
    });
    return typeof output === 'string' ? output : '';
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Command failed: pnpm ${command}`);
      console.error(error.message);
    }
    throw error;
  }
}

/**
 * Check if a file exists in the test project
 */
export function fileExists(filePath: string, projectDir: string): boolean {
  const fullPath = join(projectDir, filePath);
  return existsSync(fullPath);
}

/**
 * Read file contents from the test project
 */
export function readFile(filePath: string, projectDir: string): string {
  const fullPath = join(projectDir, filePath);
  if (!existsSync(fullPath)) {
    throw new Error(`File does not exist: ${fullPath}`);
  }
  return readFileSync(fullPath, 'utf-8');
}

/**
 * Write content to a file in the test project
 */
export function writeFile(
  filePath: string,
  content: string,
  projectDir: string
): void {
  const fullPath = join(projectDir, filePath);
  writeFileSync(fullPath, content, 'utf-8');
}

/**
 * Read and parse a JSON file from the test project
 */
export function readJsonFile<T = unknown>(
  filePath: string,
  projectDir: string
): T {
  const content = readFile(filePath, projectDir);
  return JSON.parse(content) as T;
}

/**
 * Check if a port is available
 */
export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Wait for a port to be in use (server started)
 */
export function waitForPort(port: number, timeout = 60000): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkPort = () => {
      const socket = new net.Socket();

      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });

      socket.once('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(
            new Error(
              `Timeout waiting for port ${port} to be available after ${timeout}ms`
            )
          );
        } else {
          setTimeout(checkPort, 500);
        }
      });

      socket.connect(port, 'localhost');
    };

    checkPort();
  });
}

/**
 * Start a long-running process (e.g., dev server)
 */
export function startProcess(
  command: string,
  args: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv
): ChildProcess {
  return spawn(command, args, {
    cwd,
    env: env || process.env,
    stdio: 'pipe',
  });
}

/**
 * Kill a process and wait for it to exit
 */
export function killProcess(process: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    process.once('exit', () => resolve());
    process.kill('SIGTERM');

    // Force kill if not terminated after 5 seconds
    setTimeout(() => {
      if (process.exitCode === null) {
        process.kill('SIGKILL');
      }
    }, 5000);
  });
}

/**
 * Wait for a condition to be true
 */
export function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 30000,
  interval = 500
): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const result = await condition();
        if (result) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
        } else {
          setTimeout(check, interval);
        }
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, interval);
        }
      }
    };

    check();
  });
}

/**
 * Log a test step
 */
export function logStep(message: string): void {
  console.log(`\n[E2E Test] ${message}`);
}
