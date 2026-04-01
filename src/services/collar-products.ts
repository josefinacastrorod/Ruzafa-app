import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type CollarProductRow = Database["public"]["Tables"]["collar_products"]["Row"];
type CollarProductInsert = Database["public"]["Tables"]["collar_products"]["Insert"];
type CollarProductComponentRow = Database["public"]["Tables"]["collar_product_components"]["Row"];
type CollarProductComponentInsert =
  Database["public"]["Tables"]["collar_product_components"]["Insert"];

export type CollarCostType = "manual" | "calculated";

export type CollarComponentInput = {
  id?: string;
  name: string;
  unitCost: number;
  quantityUsed: number;
};

export type CollarProductInput = {
  name: string;
  sellingPrice: number;
  costType: CollarCostType;
  manualCost: number | null;
  components: CollarComponentInput[];
};

export type CollarProductWithComponents = CollarProductRow & {
  collar_product_components: CollarProductComponentRow[];
};

export type CollarProductValidationErrors = {
  name?: string;
  sellingPrice?: string;
  manualCost?: string;
  components?: string;
  componentErrors?: Record<
    number,
    {
      name?: string;
      unitCost?: string;
      quantityUsed?: string;
    }
  >;
};

function getErrorMessage(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

async function getAuthenticatedUserId() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  return user.id;
}

function normalizeComponents(input: CollarComponentInput[]) {
  return input
    .map((component) => ({
      id: component.id,
      name: component.name.trim(),
      unitCost: component.unitCost,
      quantityUsed: component.quantityUsed,
    }))
    .filter((component) => component.name || component.unitCost || component.quantityUsed);
}

export function calculateComponentsTotal(components: CollarComponentInput[]) {
  return components.reduce((accumulator, component) => {
    return accumulator + component.unitCost * component.quantityUsed;
  }, 0);
}

export function getUnitCost(product: CollarProductWithComponents) {
  if (product.cost_type === "manual") {
    return product.manual_cost ?? 0;
  }

  return product.collar_product_components.reduce((accumulator, component) => {
    return accumulator + component.unit_cost * component.quantity_used;
  }, 0);
}

export function getProfitPerUnit(product: CollarProductWithComponents) {
  return product.selling_price - getUnitCost(product);
}

export function getMarginPercentage(product: CollarProductWithComponents) {
  if (product.selling_price <= 0) {
    return null;
  }

  return (getProfitPerUnit(product) / product.selling_price) * 100;
}

export function validateCollarProductForm(input: CollarProductInput): CollarProductValidationErrors {
  const errors: CollarProductValidationErrors = {};
  const componentErrors: CollarProductValidationErrors["componentErrors"] = {};

  if (!input.name.trim()) {
    errors.name = "El nombre del collar es obligatorio.";
  }

  if (!Number.isFinite(input.sellingPrice) || input.sellingPrice < 0) {
    errors.sellingPrice = "El precio de venta debe ser mayor o igual a 0.";
  }

  if (input.costType === "manual") {
    if (input.manualCost === null || !Number.isFinite(input.manualCost) || input.manualCost < 0) {
      errors.manualCost = "El costo manual debe ser mayor o igual a 0.";
    }
  }

  if (input.costType === "calculated") {
    const hasAnyComponent = input.components.some((component) => {
      return (
        component.name.trim().length > 0 ||
        Number.isFinite(component.unitCost) ||
        Number.isFinite(component.quantityUsed)
      );
    });

    if (!hasAnyComponent) {
      errors.components = "Agrega al menos un insumo para calcular el costo.";
    }

    input.components.forEach((component, index) => {
      const hasAnyValue =
        component.name.trim().length > 0 ||
        Number.isFinite(component.unitCost) ||
        Number.isFinite(component.quantityUsed);

      if (!hasAnyValue) {
        return;
      }

      const currentErrors: {
        name?: string;
        unitCost?: string;
        quantityUsed?: string;
      } = {};

      if (!component.name.trim()) {
        currentErrors.name = "El nombre es obligatorio.";
      }

      if (!Number.isFinite(component.unitCost) || component.unitCost < 0) {
        currentErrors.unitCost = "El costo debe ser mayor o igual a 0.";
      }

      if (!Number.isFinite(component.quantityUsed) || component.quantityUsed <= 0) {
        currentErrors.quantityUsed = "La cantidad debe ser mayor a 0.";
      }

      if (Object.keys(currentErrors).length > 0) {
        componentErrors[index] = currentErrors;
      }
    });

    if (Object.keys(componentErrors).length > 0) {
      errors.componentErrors = componentErrors;
    }
  }

  return errors;
}

async function listComponentsByProductIds(productIds: string[]) {
  if (productIds.length === 0) {
    return [] as CollarProductComponentRow[];
  }

  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("collar_product_components")
    .select("*")
    .in("product_id", productIds)
    .order("created_at", { ascending: true });

  getErrorMessage(error);

  return data as CollarProductComponentRow[];
}

export async function listCollarProducts() {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("collar_products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  getErrorMessage(error);

  const products = (data ?? []) as CollarProductRow[];
  const components = await listComponentsByProductIds(products.map((product) => product.id));

  const componentsMap = new Map<string, CollarProductComponentRow[]>();

  components.forEach((component) => {
    const current = componentsMap.get(component.product_id) ?? [];
    current.push(component);
    componentsMap.set(component.product_id, current);
  });

  return products.map((product) => ({
    ...product,
    collar_product_components: componentsMap.get(product.id) ?? [],
  }));
}

export async function createCollarProduct(input: CollarProductInput) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const normalizedComponents =
    input.costType === "calculated" ? normalizeComponents(input.components) : [];

  const productPayload: CollarProductInsert = {
    user_id: userId,
    name: input.name.trim(),
    selling_price: input.sellingPrice,
    cost_type: input.costType,
    manual_cost: input.costType === "manual" ? input.manualCost : null,
  };

  const { data: productData, error: productError } = await supabase
    .from("collar_products")
    .insert(productPayload)
    .select("*")
    .single();

  getErrorMessage(productError);

  const createdProduct = productData as CollarProductRow;

  if (normalizedComponents.length > 0) {
    const componentsPayload: CollarProductComponentInsert[] = normalizedComponents.map(
      (component) => ({
        product_id: createdProduct.id,
        name: component.name,
        unit_cost: component.unitCost,
        quantity_used: component.quantityUsed,
      }),
    );

    const { error: componentsError } = await supabase
      .from("collar_product_components")
      .insert(componentsPayload);

    getErrorMessage(componentsError);
  }

  const components = await listComponentsByProductIds([createdProduct.id]);

  return {
    ...createdProduct,
    collar_product_components: components,
  };
}

export async function updateCollarProduct(productId: string, input: CollarProductInput) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const productPayload: Database["public"]["Tables"]["collar_products"]["Update"] = {
    name: input.name.trim(),
    selling_price: input.sellingPrice,
    cost_type: input.costType,
    manual_cost: input.costType === "manual" ? input.manualCost : null,
  };

  const { data: updatedProductData, error: updatedProductError } = await supabase
    .from("collar_products")
    .update(productPayload)
    .eq("id", productId)
    .eq("user_id", userId)
    .select("*")
    .single();

  getErrorMessage(updatedProductError);

  const { error: deleteComponentsError } = await supabase
    .from("collar_product_components")
    .delete()
    .eq("product_id", productId);

  getErrorMessage(deleteComponentsError);

  if (input.costType === "calculated") {
    const normalizedComponents = normalizeComponents(input.components);

    if (normalizedComponents.length > 0) {
      const componentsPayload: CollarProductComponentInsert[] = normalizedComponents.map(
        (component) => ({
          product_id: productId,
          name: component.name,
          unit_cost: component.unitCost,
          quantity_used: component.quantityUsed,
        }),
      );

      const { error: insertComponentsError } = await supabase
        .from("collar_product_components")
        .insert(componentsPayload);

      getErrorMessage(insertComponentsError);
    }
  }

  const components = await listComponentsByProductIds([productId]);

  return {
    ...(updatedProductData as CollarProductRow),
    collar_product_components: components,
  };
}

export async function deleteCollarProduct(productId: string) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("collar_products")
    .delete()
    .eq("id", productId)
    .eq("user_id", userId);

  getErrorMessage(error);
}
