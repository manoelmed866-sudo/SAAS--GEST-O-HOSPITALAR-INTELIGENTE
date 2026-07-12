"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSafeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export type LoginActionState = {
  status: "idle" | "error";
  message?: string;
  fields?: {
    email?: string;
  };
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
  nextPath: z.string().optional(),
});

function getStringField(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function getValidationFieldErrors(
  error: z.ZodError<z.infer<typeof loginSchema>>,
): LoginActionState["fieldErrors"] {
  const flattened = z.flattenError(error);

  return {
    email: flattened.fieldErrors.email?.[0],
    password: flattened.fieldErrors.password?.[0],
  };
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const submittedEmail = getStringField(formData, "email").trim().toLowerCase();
  const parsedCredentials = loginSchema.safeParse({
    email: submittedEmail,
    password: getStringField(formData, "password"),
    nextPath: getStringField(formData, "next"),
  });

  if (!parsedCredentials.success) {
    return {
      status: "error",
      message: "Revise os dados informados e tente novamente.",
      fields: {
        email: submittedEmail,
      },
      fieldErrors: getValidationFieldErrors(parsedCredentials.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsedCredentials.data.email,
    password: parsedCredentials.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel entrar com os dados informados.",
      fields: {
        email: parsedCredentials.data.email,
      },
    };
  }

  revalidatePath("/", "layout");
  redirect(getSafeNextPath(parsedCredentials.data.nextPath));
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    throw new Error("Nao foi possivel encerrar a sessao com seguranca.");
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
