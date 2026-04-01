import {
  SESSION_COOKIE_KEY,
  SESSION_COOKIE_MAX_AGE_SECONDS,
} from "@/services/auth-constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type AuthSession = {
  email: string;
  loggedAt: string;
};

export type AuthResult = {
  success: true;
  message: string;
  session: AuthSession;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
  return emailRegex.test(email.trim());
}

export function validateCredentials(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};

  if (!email.trim()) {
    errors.email = "El email es obligatorio.";
  } else if (!isValidEmail(email)) {
    errors.email = "Ingresa un email válido.";
  }

  if (!password) {
    errors.password = "La contraseña es obligatoria.";
  } else if (password.length < 6) {
    errors.password = "La contraseña debe tener al menos 6 caracteres.";
  }

  return errors;
}

function persistSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  document.cookie = `${SESSION_COOKIE_KEY}=1; path=/; max-age=${SESSION_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

function sessionToAuthSession(session: Session): AuthSession {
  const email = session.user.email;

  if (!email) {
    throw new Error("La cuenta no tiene email asociado.");
  }

  return {
    email: email.trim().toLowerCase(),
    loggedAt: session.user.last_sign_in_at ?? new Date().toISOString(),
  };
}

export async function clearSessionStorage() {
  if (typeof window === "undefined") {
    return;
  }

  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  document.cookie = `${SESSION_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
}

export async function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  try {
    const session = sessionToAuthSession(data.session);
    document.cookie = `${SESSION_COOKIE_KEY}=1; path=/; max-age=${SESSION_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    return session;
  } catch {
    await clearSessionStorage();
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error("No fue posible iniciar sesión.");
  }

  const session = sessionToAuthSession(data.session);

  persistSession(session);

  return {
    success: true,
    message: "Inicio de sesión exitoso.",
    session,
  };
}

export async function register(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error(
      "Cuenta creada. Verifica tu email antes de iniciar sesión en la app.",
    );
  }

  const session = sessionToAuthSession(data.session);

  persistSession(session);

  return {
    success: true,
    message: "Cuenta creada con éxito.",
    session,
  };
}
