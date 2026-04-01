"use client";

import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { PageHeader } from "@/components/ui/page-header";
import {
  calculateComponentsTotal,
  createCollarProduct,
  deleteCollarProduct,
  getMarginPercentage,
  getProfitPerUnit,
  getUnitCost,
  listCollarProducts,
  updateCollarProduct,
  validateCollarProductForm,
  type CollarCostType,
  type CollarProductValidationErrors,
  type CollarProductWithComponents,
} from "@/services/collar-products";

type Feedback = {
  type: "success" | "error";
  message: string;
};

type FormComponent = {
  clientId: string;
  id?: string;
  name: string;
  unitCost: string;
  quantityUsed: string;
};

type FormValues = {
  name: string;
  sellingPrice: string;
  costType: CollarCostType;
  manualCost: string;
  components: FormComponent[];
};

function createEmptyComponent(): FormComponent {
  return {
    clientId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    name: "",
    unitCost: "",
    quantityUsed: "1",
  };
}

const INITIAL_FORM: FormValues = {
  name: "",
  sellingPrice: "",
  costType: "manual",
  manualCost: "",
  components: [createEmptyComponent()],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function toNumber(value: string) {
  return Number(value.replace(",", "."));
}

export function CollarCostsModule() {
  const [products, setProducts] = useState<CollarProductWithComponents[]>([]);
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<CollarProductValidationErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  async function loadProducts() {
    setIsLoading(true);

    try {
      const rows = await listCollarProducts();
      setProducts(rows);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  function resetForm() {
    setFormValues(INITIAL_FORM);
    setFormErrors({});
    setEditingProductId(null);
  }

  function buildPayload() {
    return {
      name: formValues.name,
      sellingPrice: toNumber(formValues.sellingPrice),
      costType: formValues.costType,
      manualCost:
        formValues.costType === "manual"
          ? toNumber(formValues.manualCost)
          : null,
      components: formValues.components.map((component) => ({
        id: component.id,
        name: component.name,
        unitCost: toNumber(component.unitCost),
        quantityUsed: toNumber(component.quantityUsed),
      })),
    };
  }

  const calculatedPreview = useMemo(() => {
    const parsedComponents = formValues.components
      .map((component) => ({
        name: component.name,
        unitCost: Number.isFinite(toNumber(component.unitCost)) ? toNumber(component.unitCost) : 0,
        quantityUsed: Number.isFinite(toNumber(component.quantityUsed))
          ? toNumber(component.quantityUsed)
          : 0,
      }))
      .filter((component) => component.name.trim());

    return calculateComponentsTotal(parsedComponents);
  }, [formValues.components]);

  function handleChange<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleCostTypeChange(value: CollarCostType) {
    setFormValues((current) => {
      if (value === "calculated" && current.components.length === 0) {
        return {
          ...current,
          costType: value,
          components: [createEmptyComponent()],
        };
      }

      return {
        ...current,
        costType: value,
      };
    });

    setFormErrors({});
  }

  function updateComponent(
    componentIndex: number,
    field: keyof Omit<FormComponent, "clientId" | "id">,
    value: string,
  ) {
    setFormValues((current) => ({
      ...current,
      components: current.components.map((component, index) => {
        if (index !== componentIndex) {
          return component;
        }

        return {
          ...component,
          [field]: value,
        };
      }),
    }));

    setFormErrors((current) => {
      if (!current.componentErrors) {
        return current;
      }

      const nextComponentErrors = { ...current.componentErrors };

      if (nextComponentErrors[componentIndex]) {
        nextComponentErrors[componentIndex] = {
          ...nextComponentErrors[componentIndex],
          [field]: undefined,
        };
      }

      return {
        ...current,
        componentErrors: nextComponentErrors,
      };
    });
  }

  function addComponent() {
    setFormValues((current) => ({
      ...current,
      components: [...current.components, createEmptyComponent()],
    }));
    setFormErrors((current) => ({ ...current, components: undefined }));
  }

  function removeComponent(componentIndex: number) {
    setFormValues((current) => ({
      ...current,
      components: current.components.filter((_, index) => index !== componentIndex),
    }));

    setFormErrors((current) => {
      if (!current.componentErrors) {
        return current;
      }

      const nextEntries = Object.entries(current.componentErrors)
        .filter(([index]) => Number(index) !== componentIndex)
        .map(([index, value]) => {
          const numericIndex = Number(index);
          return [numericIndex > componentIndex ? numericIndex - 1 : numericIndex, value] as const;
        });

      return {
        ...current,
        componentErrors: Object.fromEntries(nextEntries),
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const payload = buildPayload();
    const errors = validateCollarProductForm(payload);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingProductId) {
        await updateCollarProduct(editingProductId, payload);
        setFeedback({ type: "success", message: "Collar actualizado con éxito." });
      } else {
        await createCollarProduct(payload);
        setFeedback({ type: "success", message: "Collar creado con éxito." });
      }

      resetForm();
      await loadProducts();
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(product: CollarProductWithComponents) {
    setEditingProductId(product.id);
    setFormValues({
      name: product.name,
      sellingPrice: String(product.selling_price),
      costType: product.cost_type,
      manualCost: product.manual_cost !== null ? String(product.manual_cost) : "",
      components:
        product.collar_product_components.length > 0
          ? product.collar_product_components.map((component) => ({
              clientId: component.id,
              id: component.id,
              name: component.name,
              unitCost: String(component.unit_cost),
              quantityUsed: String(component.quantity_used),
            }))
          : [createEmptyComponent()],
    });
    setFormErrors({});
    setFeedback(null);
  }

  async function handleDelete(product: CollarProductWithComponents) {
    const confirmed = window.confirm(`¿Eliminar el collar "${product.name}"?`);

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setDeletingProductId(product.id);

    try {
      await deleteCollarProduct(product.id);
      setFeedback({ type: "success", message: "Collar eliminado con éxito." });

      if (editingProductId === product.id) {
        resetForm();
      }

      await loadProducts();
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setDeletingProductId(null);
    }
  }

  return (
    <section className="app-page">
      <PageHeader
        title="Costos por collar"
        description="Define fichas de costo unitario por producto de forma manual o calculada por insumos."
        icon="costs"
        badge="Sección independiente"
      />

      <div className="app-card p-5 sm:p-6">
        <h2 className="app-section-title">
          {editingProductId ? "Editar collar" : "Nuevo collar"}
        </h2>
        <p className="app-panel-subtitle">
          Esta sección no impacta costos ni gastos mensuales. Solo guarda referencia fija por producto.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="app-grid-2">
            <div>
              <label htmlFor="collar-name" className="app-label">
                Nombre del collar
              </label>
              <input
                id="collar-name"
                type="text"
                value={formValues.name}
                onChange={(event) => handleChange("name", event.target.value)}
                className="mt-1 app-input"
                placeholder="Ej: Collar Luna"
              />
              {formErrors.name && <p className="mt-1 text-sm text-rose-600">{formErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="collar-selling-price" className="app-label">
                Precio de venta
              </label>
              <input
                id="collar-selling-price"
                type="number"
                min="0"
                step="0.01"
                value={formValues.sellingPrice}
                onChange={(event) => handleChange("sellingPrice", event.target.value)}
                className="mt-1 app-input"
                placeholder="Ej: 12000"
              />
              {formErrors.sellingPrice && (
                <p className="mt-1 text-sm text-rose-600">{formErrors.sellingPrice}</p>
              )}
            </div>
          </div>

          <div>
            <p className="app-label">Modo de costo</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleCostTypeChange("manual")}
                className={[
                  "rounded-2xl border px-4 py-3 text-sm font-semibold text-left transition",
                  formValues.costType === "manual"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-indigo-100 bg-white text-slate-600 hover:border-indigo-200",
                ].join(" ")}
              >
                Costo manual
              </button>
              <button
                type="button"
                onClick={() => handleCostTypeChange("calculated")}
                className={[
                  "rounded-2xl border px-4 py-3 text-sm font-semibold text-left transition",
                  formValues.costType === "calculated"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-indigo-100 bg-white text-slate-600 hover:border-indigo-200",
                ].join(" ")}
              >
                Costo calculado por insumos
              </button>
            </div>
          </div>

          {formValues.costType === "manual" ? (
            <div>
              <label htmlFor="collar-manual-cost" className="app-label">
                Costo unitario manual
              </label>
              <input
                id="collar-manual-cost"
                type="number"
                min="0"
                step="0.01"
                value={formValues.manualCost}
                onChange={(event) => handleChange("manualCost", event.target.value)}
                className="mt-1 app-input"
                placeholder="Ej: 4500"
              />
              {formErrors.manualCost && (
                <p className="mt-1 text-sm text-rose-600">{formErrors.manualCost}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-indigo-950">Insumos</p>
                <button type="button" onClick={addComponent} className="app-btn-secondary py-2">
                  Agregar insumo
                </button>
              </div>

              {formValues.components.map((component, index) => {
                const componentError = formErrors.componentErrors?.[index];

                return (
                  <div key={component.clientId} className="rounded-2xl border border-indigo-100 bg-white p-4">
                    <div className="app-grid-2">
                      <div>
                        <label className="app-label" htmlFor={`component-name-${component.clientId}`}>
                          Nombre del insumo
                        </label>
                        <input
                          id={`component-name-${component.clientId}`}
                          type="text"
                          value={component.name}
                          onChange={(event) => updateComponent(index, "name", event.target.value)}
                          className="mt-1 app-input"
                          placeholder="Ej: Perlas"
                        />
                        {componentError?.name && (
                          <p className="mt-1 text-sm text-rose-600">{componentError.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="app-label" htmlFor={`component-unit-cost-${component.clientId}`}>
                          Costo unitario insumo
                        </label>
                        <input
                          id={`component-unit-cost-${component.clientId}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={component.unitCost}
                          onChange={(event) => updateComponent(index, "unitCost", event.target.value)}
                          className="mt-1 app-input"
                          placeholder="Ej: 250"
                        />
                        {componentError?.unitCost && (
                          <p className="mt-1 text-sm text-rose-600">{componentError.unitCost}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="w-full">
                        <label className="app-label" htmlFor={`component-quantity-${component.clientId}`}>
                          Cantidad usada por collar
                        </label>
                        <input
                          id={`component-quantity-${component.clientId}`}
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={component.quantityUsed}
                          onChange={(event) => updateComponent(index, "quantityUsed", event.target.value)}
                          className="mt-1 app-input"
                          placeholder="Ej: 2"
                        />
                        {componentError?.quantityUsed && (
                          <p className="mt-1 text-sm text-rose-600">{componentError.quantityUsed}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeComponent(index)}
                        className="app-btn-danger"
                        disabled={formValues.components.length === 1}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                );
              })}

              {formErrors.components && (
                <p className="text-sm text-rose-600">{formErrors.components}</p>
              )}

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Costo total calculado
                </p>
                <p className="mt-1 text-lg font-bold text-emerald-900">
                  ${formatCurrency(calculatedPreview)}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="app-btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : editingProductId
                  ? "Actualizar collar"
                  : "Guardar collar"}
            </button>
            {editingProductId && (
              <button
                type="button"
                onClick={resetForm}
                className="app-btn-secondary"
                disabled={isSubmitting}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </div>

      {feedback && (
        <div className={feedback.type === "success" ? "app-feedback-success" : "app-feedback-error"}>
          {feedback.message}
        </div>
      )}

      <div className="app-card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="app-icon-chip text-indigo-700">
            <AppIcon name="costs" className="h-4 w-4" />
          </span>
          <h2 className="app-section-title">Listado de collares</h2>
        </div>

        {isLoading ? (
          <p className="mt-4 app-empty">Cargando collares...</p>
        ) : products.length === 0 ? (
          <p className="mt-4 app-empty">Aún no hay collares registrados.</p>
        ) : (
          <div className="mt-4 app-grid-3">
            {products.map((product) => {
              const unitCost = getUnitCost(product);
              const profit = getProfitPerUnit(product);
              const margin = getMarginPercentage(product);

              return (
                <article key={product.id} className="app-list-item">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-indigo-950">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Tipo: {product.cost_type === "manual" ? "Manual" : "Calculado"}
                      </p>
                    </div>
                    <span className="app-soft-badge">
                      {product.cost_type === "manual"
                        ? "Costo manual"
                        : `${product.collar_product_components.length} insumos`}
                    </span>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <dt>Precio venta</dt>
                      <dd className="font-semibold">${formatCurrency(product.selling_price)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Costo unitario</dt>
                      <dd className="font-semibold">${formatCurrency(unitCost)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Ganancia por unidad</dt>
                      <dd className={profit >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                        ${formatCurrency(profit)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Margen</dt>
                      <dd className="font-semibold">{formatPercent(margin)}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="app-btn-secondary px-3 py-2"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      className="app-btn-danger"
                      disabled={deletingProductId === product.id}
                    >
                      {deletingProductId === product.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
