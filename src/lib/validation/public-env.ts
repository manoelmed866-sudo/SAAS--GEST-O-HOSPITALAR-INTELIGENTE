import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z
    .string()
    .trim()
    .min(1)
    .default("Plataforma de Inteligencia Hospitalar"),
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(
  input: Record<string, string | undefined>,
): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_NAME: input.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_ENV: input.NEXT_PUBLIC_APP_ENV,
  });
}
