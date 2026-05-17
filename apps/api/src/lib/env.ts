function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  NODE_ENV: getEnvOrDefault('NODE_ENV', 'development'),
  PORT: parseInt(getEnvOrDefault('PORT', '3000'), 10),
  LOG_LEVEL: getEnvOrDefault('LOG_LEVEL', 'info'),

  DATABASE_URL: getEnvOrThrow('DATABASE_URL'),
  DATABASE_AUTH_TOKEN: process.env['DATABASE_AUTH_TOKEN'],

  SESSION_SECRET: getEnvOrThrow('SESSION_SECRET'),

  CORS_ORIGIN: getEnvOrDefault('CORS_ORIGIN', 'http://localhost:5173'),
} as const;
