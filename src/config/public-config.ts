import { parsePublicEnv } from "@/lib/validation/public-env";

export function getPublicConfig() {
  const env = parsePublicEnv(process.env);

  return {
    appName: env.NEXT_PUBLIC_APP_NAME,
    appEnv: env.NEXT_PUBLIC_APP_ENV,
  };
}
