import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  EMAIL_FROM: z.string().default("Postmade <no-reply@postmade.local>"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  SWAGGER_ENABLED: z.enum(["true", "false"]).optional(),
});

export type AppConfig = z.infer<typeof schema>;
export function validateConfig(value: Record<string, unknown>) {
  return schema.parse(value);
}
