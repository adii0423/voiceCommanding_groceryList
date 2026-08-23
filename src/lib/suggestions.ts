import { catalog, findProductById } from "@/data/catalog";
import { ShoppingItem, Suggestion } from "@/types";

/** Items on sale / in season this month — a simple calendar lookup, no ML needed. */
export function getSeasonalSuggestions(cartItems: ShoppingItem[], date: Date = new Date()): Suggestion[] {
  const month = date.getMonth() + 1;
  const inCart = new Set(cartItems.map((i) => i.productId).filter(Boolean));

  return catalog
    .filter((p) => p.seasonalMonths?.includes(month) && !inCart.has(p.id))
    .slice(0, 3)
    .map((product) => ({
      product,
      reason: `In season this month`,
      kind: "seasonal" as const,
    }));
}

/**
 * "You're probably running low" — based on how often the user has added an
 * item historically, if it's not currently on the list.
 */
export function getRestockSuggestions(
  purchaseHistory: Record<string, number>,
  cartItems: ShoppingItem[]
): Suggestion[] {
  const inCart = new Set(cartItems.map((i) => i.productId).filter(Boolean));

  return Object.entries(purchaseHistory)
    .filter(([productId, count]) => count >= 2 && !inCart.has(productId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([productId]) => {
      const product = findProductById(productId)!;
      return {
        product,
        reason: `You buy this often — running low?`,
        kind: "restock" as const,
      };
    })
    .filter((s) => s.product);
}

/** If an item on the list is out of stock, suggest its substitute. */
export function getSubstituteSuggestions(cartItems: ShoppingItem[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  for (const item of cartItems) {
    if (!item.productId) continue;
    const product = findProductById(item.productId);
    if (product?.outOfStock && product.substituteId) {
      const sub = findProductById(product.substituteId);
      if (sub) {
        suggestions.push({
          product: sub,
          reason: `${product.name} is out of stock — try this instead?`,
          kind: "substitute",
        });
      }
    }
  }
  return suggestions;
}
