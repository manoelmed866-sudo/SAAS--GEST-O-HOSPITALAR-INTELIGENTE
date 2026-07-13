import { redirect } from "next/navigation";
import { getLoginPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

type AuthenticatedUser = {
  id: string;
};

type ActiveProfile = {
  display_name: string;
  status: string;
};

export type PortalAccessResult =
  | {
      status: "allowed";
      userId: string;
      displayName: string;
      accessKind: "platform" | "organization" | "hospital";
    }
  | {
      status: "unauthenticated" | "denied" | "error";
    };

type QueryResult<T> = {
  data: T | null;
  error: { message?: string } | null;
};

async function loadActiveProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<QueryResult<ActiveProfile>> {
  return supabase
    .from("profiles")
    .select("display_name, status")
    .eq("id", userId)
    .maybeSingle();
}

async function hasPlatformAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<QueryResult<unknown[]>> {
  return supabase
    .from("platform_role_assignments")
    .select("id, roles!inner(id, scope, is_system)")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("role_scope", "platform")
    .eq("roles.scope", "platform")
    .limit(1);
}

async function hasOrganizationAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<QueryResult<unknown[]>> {
  return supabase
    .from("organization_memberships")
    .select(
      "id, organizations!inner(id, status), organization_membership_roles!inner(id, status, role_scope, roles!inner(id, scope))",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("organizations.status", "active")
    .eq("organization_membership_roles.status", "active")
    .eq("organization_membership_roles.role_scope", "organization")
    .eq("organization_membership_roles.roles.scope", "organization")
    .limit(1);
}

async function hasHospitalAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<QueryResult<unknown[]>> {
  return supabase
    .from("hospital_memberships")
    .select(
      "id, hospitals!inner(id, status), organization_memberships!inner(id, status, user_id), hospital_membership_roles!inner(id, status, role_scope, roles!inner(id, scope))",
    )
    .eq("status", "active")
    .eq("organization_memberships.user_id", userId)
    .eq("organization_memberships.status", "active")
    .eq("hospitals.status", "active")
    .eq("hospital_membership_roles.status", "active")
    .eq("hospital_membership_roles.role_scope", "hospital")
    .eq("hospital_membership_roles.roles.scope", "hospital")
    .limit(1);
}

function hasRows(result: QueryResult<unknown[]>): boolean {
  return Array.isArray(result.data) && result.data.length > 0;
}

export async function getPortalAccess(): Promise<PortalAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { status: "error" };
  }

  if (!user) {
    return { status: "unauthenticated" };
  }

  const authenticatedUser = user as AuthenticatedUser;
  const profileResult = await loadActiveProfile(supabase, authenticatedUser.id);

  if (profileResult.error) {
    return { status: "error" };
  }

  if (!profileResult.data || profileResult.data.status !== "active") {
    return { status: "denied" };
  }

  const platformResult = await hasPlatformAccess(supabase, authenticatedUser.id);

  if (platformResult.error) {
    return { status: "error" };
  }

  if (hasRows(platformResult)) {
    return {
      status: "allowed",
      userId: authenticatedUser.id,
      displayName: profileResult.data.display_name,
      accessKind: "platform",
    };
  }

  const organizationResult = await hasOrganizationAccess(
    supabase,
    authenticatedUser.id,
  );

  if (organizationResult.error) {
    return { status: "error" };
  }

  if (hasRows(organizationResult)) {
    return {
      status: "allowed",
      userId: authenticatedUser.id,
      displayName: profileResult.data.display_name,
      accessKind: "organization",
    };
  }

  const hospitalResult = await hasHospitalAccess(supabase, authenticatedUser.id);

  if (hospitalResult.error) {
    return { status: "error" };
  }

  if (hasRows(hospitalResult)) {
    return {
      status: "allowed",
      userId: authenticatedUser.id,
      displayName: profileResult.data.display_name,
      accessKind: "hospital",
    };
  }

  return { status: "denied" };
}

export async function requirePortalAccess(): Promise<
  Extract<PortalAccessResult, { status: "allowed" }>
> {
  const access = await getPortalAccess();

  if (access.status === "unauthenticated") {
    redirect(getLoginPath("/painel"));
  }

  if (access.status === "denied") {
    redirect("/acesso-negado");
  }

  if (access.status === "error") {
    throw new Error("Nao foi possivel validar o acesso institucional.");
  }

  if (access.status === "allowed") {
    return access;
  }

  throw new Error("Nao foi possivel validar o acesso institucional.");
}
