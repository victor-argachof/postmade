import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  EMAIL_FROM: z.string().default("Postmade <no-reply@postmade.local>"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  WEB_APP_URL: z.url().default("http://localhost:5173"),
  API_PUBLIC_URL: z.url().default("http://localhost:3000"),
  CHANNEL_PROVIDER_MODE: z.enum(["mock", "disabled"]).default("mock"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  SWAGGER_ENABLED: z.enum(["true", "false"]).optional(),
});

export type AppConfig = z.infer<typeof schema>;
export function validateConfig(value: Record<string, unknown>) {
  const config = schema.parse(value);
  if (
    config.CHANNEL_PROVIDER_MODE === "mock" &&
    !["development", "test"].includes(config.NODE_ENV)
  )
    throw new Error(
      "CHANNEL_PROVIDER_MODE=mock is only allowed in development or test"
    );
  return config;
}
