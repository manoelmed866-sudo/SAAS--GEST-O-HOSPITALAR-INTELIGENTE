import { createClient } from "@/lib/supabase/server";

// Sprint 03D1 - Inventario de acessos
//
// Responsabilidade:
// Listar, sob o cliente Supabase server-side autenticado, as organizations e
// hospitals ativos que o usuario atual esta autorizado a ver. A autorizacao
// definitiva e do RLS: estas consultas apenas transportam e normalizam o que o
// banco ja libera. Nenhum service role, nenhum select("*"), nenhum papel ativo
// resolvido aqui (papeis sao tratados na revalidacao de contexto das etapas
// 03D3/03D4, evitando joins e duplicacao da autorizacao).

export type AuthorizedOrganization = {
  id: string;
  code: string;
  displayName: string;
};

export type AuthorizedHospital = {
  id: string;
  organizationId: string;
  code: string;
  displayName: string;
};

export type AuthorizedContextInventory = {
  organizations: AuthorizedOrganization[];
  hospitals: AuthorizedHospital[];
  hospitalCount: number;
};

export type AuthorizedContextInventoryResult =
  | {
      status: "success";
      inventory: AuthorizedContextInventory;
    }
  | {
      status: "error";
    };

type OrganizationRow = {
  id: string;
  code: string;
  display_name: string;
};

type HospitalRow = {
  id: string;
  organization_id: string;
  code: string;
  display_name: string;
};

function normalizeOrganization(row: OrganizationRow): AuthorizedOrganization {
  return {
    id: row.id,
    code: row.code,
    displayName: row.display_name,
  };
}

function normalizeHospital(row: HospitalRow): AuthorizedHospital {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    displayName: row.display_name,
  };
}

export async function getAuthorizedContextInventory(): Promise<AuthorizedContextInventoryResult> {
  const supabase = await createClient();

  const organizationsResult = await supabase
    .from("organizations")
    .select("id, code, display_name")
    .eq("status", "active")
    .order("display_name", { ascending: true })
    .order("id", { ascending: true });

  if (organizationsResult.error) {
    return { status: "error" };
  }

  const hospitalsResult = await supabase
    .from("hospitals")
    .select("id, organization_id, code, display_name")
    .eq("status", "active")
    .order("display_name", { ascending: true })
    .order("id", { ascending: true });

  if (hospitalsResult.error) {
    return { status: "error" };
  }

  const organizations = (organizationsResult.data ?? []).map(
    normalizeOrganization,
  );
  const hospitals = (hospitalsResult.data ?? []).map(normalizeHospital);

  return {
    status: "success",
    inventory: {
      organizations,
      hospitals,
      hospitalCount: hospitals.length,
    },
  };
}
