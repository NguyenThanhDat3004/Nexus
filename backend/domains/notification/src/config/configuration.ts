export interface AppConfig {
  port: number;
  webOrigin: string[];
  jwt: { secret: string };
  internalToken: string;
  redis: { host: string; port: number; password?: string };
  mail: { host: string; port: number; secure: boolean; user?: string; pass?: string; from: string };
  otp: { ttlSeconds: number; resendCooldownSeconds: number; maxAttempts: number; hmacSecret: string };
  retention: { notificationDays: number; mailLogDays: number; batchSize: number };
}

function requireSecret(env: NodeJS.ProcessEnv, name: string, minLength: number): string {
  const value = env[name] ?? '';
  if (value.length < minLength) throw new Error(`Thiếu biến môi trường ${name} (tối thiểu ${minLength} ký tự).`);
  return value;
}

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function buildConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: toInt(env.PORT ?? env.NOTIFICATION_SERVICE_PORT, 3002),
    webOrigin: (env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()).filter(Boolean),
    jwt: { secret: requireSecret(env, 'JWT_SECRET', 32) },          // CHUNG với Identity (Đạt)
    internalToken: requireSecret(env, 'INTERNAL_SERVICE_TOKEN', 24), // cho /internal/*
    redis: { host: env.REDIS_HOST ?? 'localhost', port: toInt(env.REDIS_PORT, 6379), password: env.REDIS_PASSWORD || undefined },
    mail: {
      host: env.SMTP_HOST ?? 'localhost',
      port: toInt(env.SMTP_PORT, 1025),
      secure: env.SMTP_SECURE === 'true',
      user: env.SMTP_USER || undefined,
      pass: env.SMTP_PASS || undefined,
      from: env.MAIL_FROM ?? 'Nexus <no-reply@nexus.local>',
    },
    otp: {
      ttlSeconds: toInt(env.OTP_TTL_SECONDS, 60),
      resendCooldownSeconds: toInt(env.OTP_RESEND_COOLDOWN_SECONDS, 60),
      maxAttempts: toInt(env.OTP_MAX_ATTEMPTS, 5),
      hmacSecret: requireSecret(env, 'OTP_HMAC_SECRET', 32),
    },
    // toInt chỉ nhận số > 0 → cấu hình 0 / sai định dạng dùng mặc định, không bao giờ xoá sạch dữ liệu
    retention: {
      notificationDays: toInt(env.NOTIFICATION_RETENTION_DAYS, 90),
      mailLogDays: toInt(env.MAIL_LOG_RETENTION_DAYS, 180),
      batchSize: toInt(env.RETENTION_BATCH_SIZE, 1000),
    },
  };
}

export default () => buildConfig();