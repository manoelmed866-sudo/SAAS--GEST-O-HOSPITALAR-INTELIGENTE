import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env/public";
import type { Database } from "@/types/database.types";

function isReadonlyCookieError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("Cookies can only be modified") ||
      error.message.includes("ReadonlyRequestCookies"))
  );
}

export async function createClient(): Promise<SupabaseClient<Database>> {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Server Components podem ter cookies somente leitura; o Proxy faz
            // a renovacao regular da sessao nos contextos que permitem escrita.
            if (isReadonlyCookieError(error)) {
              return;
            }

            throw error;
          }
        },
      },
    },
  );
}
