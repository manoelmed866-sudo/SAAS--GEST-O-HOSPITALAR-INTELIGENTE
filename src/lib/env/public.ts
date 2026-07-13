import { z } from "zod";

const privateKeyPrefix = ["sb", "secret"].join("_") + "_";
const serviceRoleMarker = ["service", "role"].join("_");

const supabasePublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .trim()
    .min(1)
    .url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .min(1)
    .refine((value) => !value.startsWith(privateKeyPrefix))
    .refine((value) => !value.toLowerCase().includes(serviceRoleMarker)),
});

export type SupabasePublicEnv = Readonly<
  z.infer<typeof supabasePublicEnvSchema>
>;

function formatPublicEnvError(error: z.ZodError): Error {
  const fields = Array.from(
    new Set(
      error.issues
        .map((issue) => issue.path[0])
        .filter((field): field is string => typeof field === "string"),
    ),
  );

  const fieldList = fields.length > 0 ? fields.join(", ") : "variaveis publicas";

  return new Error(
    `Configuracao publica do Supabase invalida: ${fieldList}. Verifique os nomes e tipos sem expor valores.`,
  );
}

export function parsePublicEnv(
  input: Record<string, string | undefined>,
): SupabasePublicEnv {
  const result = supabasePublicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: input.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      input.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    throw formatPublicEnvError(result.error);
  }

  return Object.freeze(result.data);
}

export function getPublicEnv(): SupabasePublicEnv {
  return parsePublicEnv(process.env);
}
