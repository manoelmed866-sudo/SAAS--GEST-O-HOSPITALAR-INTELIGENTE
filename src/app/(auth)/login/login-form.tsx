"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/app/(auth)/actions";

const initialState: LoginActionState = {
  status: "idle",
  fields: {
    email: "",
  },
};

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const hasEmailError = Boolean(state.fieldErrors?.email);
  const hasPasswordError = Boolean(state.fieldErrors?.password);

  return (
    <form action={formAction} aria-labelledby="login-title">
      <input name="next" type="hidden" value={nextPath} />

      <div>
        <label htmlFor="email">E-mail institucional</label>
        <input
          aria-describedby={hasEmailError ? "email-error" : undefined}
          aria-invalid={hasEmailError}
          autoComplete="email"
          defaultValue={state.fields?.email}
          id="email"
          name="email"
          required
          type="email"
        />
        {state.fieldErrors?.email ? (
          <p id="email-error">{state.fieldErrors.email}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password">Senha</label>
        <input
          aria-describedby={hasPasswordError ? "password-error" : undefined}
          aria-invalid={hasPasswordError}
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type="password"
        />
        {state.fieldErrors?.password ? (
          <p id="password-error">{state.fieldErrors.password}</p>
        ) : null}
      </div>

      {state.message ? (
        <p aria-live="polite" role="status">
          {state.message}
        </p>
      ) : null}

      <button className="button" disabled={isPending} type="submit">
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
