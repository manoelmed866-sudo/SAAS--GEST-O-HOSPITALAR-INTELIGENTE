import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env/public";
import type { Database } from "@/types/database.types";

export type SessionRefreshResult = {
  response: NextResponse;
  claims: Record<string, unknown> | null;
};

function createPassThroughResponse(request: NextRequest): NextResponse {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export async function refreshSession(
  request: NextRequest,
): Promise<SessionRefreshResult> {
  const env = getPublicEnv();
  let response = createPassThroughResponse(request);

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(({ name, value }) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          const previousHeaders = new Headers(response.headers);
          response = createPassThroughResponse(request);

          previousHeaders.forEach((value, key) => {
            response.headers.set(key, value);
          });

          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

  return {
    response,
    claims: data?.claims ?? null,
  };
}

export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  const { response } = await refreshSession(request);

  return response;
}
