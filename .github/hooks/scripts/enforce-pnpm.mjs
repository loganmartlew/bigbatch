import { readFileSync } from 'node:fs';

function readPayload() {
  try {
    const raw = readFileSync(0, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function findCommand(value, depth = 0) {
  if (depth > 6 || value == null) {
    return '';
  }

  if (typeof value !== 'object') {
    return '';
  }

  if (typeof value.command === 'string') {
    return value.command;
  }

  for (const nested of Object.values(value)) {
    const command = findCommand(nested, depth + 1);
    if (command) {
      return command;
    }
  }

  return '';
}

const payload = readPayload();
const command = findCommand(payload).trim();
const usesNpm = /(^|[;&|]\s*)npm(\s|$)/.test(command);

if (usesNpm) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'This workspace is pnpm-first; use pnpm instead of npm.',
      },
      systemMessage:
        'Blocked npm command. Re-run the package-manager step with pnpm or pnpm dlx in this repository.',
    }),
  );
  process.exit(0);
}

process.stdout.write(JSON.stringify({}));
