"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { PageHeader } from "@/components/ui/page-header";
import type { Database } from "@/types/database";
import {
  createFinancialSetting,
  getTodayValue,
  listFinancialSettings,
  validateFinancialSettingsForm,
  type FinancialSettingsFormValues,
  type FinancialSettingsValidationErrors,
} from "@/services/financial-settings";

type FinancialSetting = Database["public"]["Tables"]["financial_settings"]["Row"];

type Feedback = {
  type: "success" | "error";
  message: string;
};

const INITIAL_FORM: FinancialSettingsFormValues = {
  fixed_amount_to_keep: "",
  withdrawal_percentage: "",
  savings_percentage: "",
  start_date: getTodayValue(),
};

function formatPercent(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function formatAmount(value: number | null) {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function parseRequiredNumber(value: string, fieldName: string) {
  const parsed = parseOptionalNumber(value);

  if (parsed === null) {
    throw new Error(`No se pudo guardar: ${fieldName} es inválido.`);
  }

  return parsed;
}

export function FinancialSettingsModule() {
  const [settings, setSettings] = useState<FinancialSetting[]>([]);
  const [formValues, setFormValues] = useState<FinancialSettingsFormValues>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<FinancialSettingsValidationErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadSettings() {
    setIsLoadingSettings(true);

    try {
      const rows = await listFinancialSettings();
      setSettings(rows);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoadingSettings(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  function resetForm() {
    setFormValues(INITIAL_FORM);
    setFormErrors({});
  }

  function handleChange<K extends keyof FinancialSettingsFormValues>(
    field: K,
    value: FinancialSettingsFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const errors = validateFinancialSettingsForm(formValues);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await createFinancialSetting({
        fixed_amount_to_keep: parseRequiredNumber(formValues.fixed_amount_to_keep, "monto fijo"),
        withdrawal_percentage: parseRequiredNumber(
          formValues.withdrawal_percentage,
          "porcentaje de retiro",
        ),
        savings_percentage: parseRequiredNumber(
          formValues.savings_percentage,
          "porcentaje de ahorros",
        ),
        start_date: formValues.start_date,
      });

      setFeedback({ type: "success", message: "Configuración guardada con éxito." });
      resetForm();
      await loadSettings();
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="app-page">
      <PageHeader
        title="Configuración financiera"
        description="Define el monto fijo mensual a apartar y cómo distribuir el restante entre retiros y ahorros. Las configuraciones anteriores se mantienen como historial."
        icon="settings"
      />

      <div className="app-card p-5 sm:p-6">
        <h2 className="app-section-title">Nueva configuración</h2>
        <p className="app-panel-subtitle">
          Los cambios aplican desde la fecha de inicio y no alteran meses anteriores.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="start-date" className="app-label">
              Fecha de inicio
            </label>
            <input
              id="start-date"
              type="date"
              value={formValues.start_date}
              onChange={(event) => handleChange("start_date", event.target.value)}
              className="mt-1 app-input"
            />
            {formErrors.start_date && (
              <p className="mt-1 text-sm text-rose-600">{formErrors.start_date}</p>
            )}
          </div>

          <div>
            <label htmlFor="fixed-amount" className="app-label">
              Monto fijo a apartar (CLP)
            </label>
            <input
              id="fixed-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={formValues.fixed_amount_to_keep}
              onChange={(event) => handleChange("fixed_amount_to_keep", event.target.value)}
              className="mt-1 app-input"
              placeholder="Ej: 20000"
            />
            {formErrors.fixed_amount_to_keep && (
              <p className="mt-1 text-sm text-rose-600">{formErrors.fixed_amount_to_keep}</p>
            )}
          </div>

          <div>
            <label htmlFor="withdrawal-percentage" className="app-label">
              Porcentaje de retiro
            </label>
            <div className="relative mt-1">
              <input
                id="withdrawal-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputMode="decimal"
                value={formValues.withdrawal_percentage}
                onChange={(event) => handleChange("withdrawal_percentage", event.target.value)}
                className="app-input pr-10"
                placeholder="Ej: 60"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                %
              </span>
            </div>
            {formErrors.withdrawal_percentage && (
              <p className="mt-1 text-sm text-rose-600">{formErrors.withdrawal_percentage}</p>
            )}
          </div>

          <div>
            <label htmlFor="savings-percentage" className="app-label">
              Porcentaje de ahorros
            </label>
            <div className="relative mt-1">
              <input
                id="savings-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputMode="decimal"
                value={formValues.savings_percentage}
                onChange={(event) => handleChange("savings_percentage", event.target.value)}
                className="app-input pr-10"
                placeholder="Ej: 20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                %
              </span>
            </div>
            {formErrors.savings_percentage && (
              <p className="mt-1 text-sm text-rose-600">{formErrors.savings_percentage}</p>
            )}
          </div>

          {feedback && (
            <div className={feedback.type === "success" ? "app-feedback-success" : "app-feedback-error"}>
              {feedback.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full app-btn-primary"
          >
            {isSubmitting ? "Guardando..." : "Guardar configuración"}
          </button>
        </form>
      </div>

      <div className="app-card p-5 sm:p-6">
        <h2 className="app-section-title">Historial de configuraciones</h2>

        {isLoadingSettings ? (
          <p className="mt-4 text-sm text-slate-600">Cargando configuraciones...</p>
        ) : settings.length === 0 ? (
          <p className="mt-4 app-empty">Aún no tienes configuraciones creadas.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {settings.map((setting, index) => (
              <article key={setting.id} className="app-list-item">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <AppIcon name="settings" className="h-4 w-4 text-indigo-700" />
                    Inicio: {formatDate(setting.start_date)}
                  </p>
                  {index === 0 && (
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Más reciente
                    </span>
                  )}
                </div>

                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-600">Monto fijo a apartar</dt>
                    <dd className="font-medium text-slate-900">
                      {formatAmount(setting.fixed_amount_to_keep)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-600">Porcentaje de retiro</dt>
                    <dd className="font-medium text-slate-900">
                      {formatPercent(setting.withdrawal_percentage)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-600">Porcentaje de ahorros</dt>
                    <dd className="font-medium text-slate-900">
                      {formatPercent(setting.savings_percentage)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
