"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { validateCredentials } from "@/services/auth";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { isAuthenticated, isInitializing, loginUser, registerUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isInitializing, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const errors = validateCredentials(email, password);
    setFieldErrors(errors);

    if (errors.email || errors.password) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        mode === "login"
          ? await loginUser(email, password)
          : await registerUser(email, password);

      setSuccessMessage(result.message);
      router.push("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No fue posible completar la operación. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <section className="mx-auto w-full max-w-md app-card p-6">
      <h1 className="app-title">
        {isLogin ? "Iniciar sesión" : "Crear cuenta"}
      </h1>
      <p className="app-subtitle">
        {isLogin
          ? "Ingresa tus credenciales para acceder al panel."
          : "Registra tu cuenta para comenzar a usar la app."}
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email" className="app-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="app-input"
            placeholder="tu@email.com"
            autoComplete="email"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="app-label">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="app-input"
            placeholder="Mínimo 6 caracteres"
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {formError && (
          <p className="app-feedback-error">
            {formError}
          </p>
        )}

        {successMessage && (
          <p className="app-feedback-success">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full app-btn-primary"
        >
          {isSubmitting
            ? isLogin
              ? "Ingresando..."
              : "Creando cuenta..."
            : isLogin
              ? "Ingresar"
              : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
        <Link
          href={isLogin ? "/registro" : "/login"}
          className="font-semibold text-indigo-700 underline"
        >
          {isLogin ? "Regístrate" : "Inicia sesión"}
        </Link>
      </p>
    </section>
  );
}
