export type Category =
  | "Produce"
  | "Dairy & Eggs"
  | "Meat & Seafood"
  | "Bakery"
  | "Pantry"
  | "Frozen"
  | "Beverages"
  | "Snacks"
  | "Household"
  | "Miscellaneous";

export type LangCode = "en-US" | "hi-IN" | "es-ES";

/** A catalog product — the "known world" the assistant can recognize by voice. */
export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  emoji: string;
  /** Months (1-12) this item is in season / on sale. Omit = available year-round. */
  seasonalMonths?: number[];
  /** id of a product to offer instead when this one is out of stock. */
  substituteId?: string;
  /** Simulates a real catalog occasionally being out of stock. */
  outOfStock?: boolean;
  /** Recognized words/phrases per language, used for voice matching. */
  aliases: Partial<Record<LangCode, string[]>>;
}

/** An item sitting in the user's shopping list. */
export interface ShoppingItem {
  id: string;
  productId?: string; // links back to a Product, if it matched the catalog
  name: string;
  category: Category;
  quantity: number;
  unit?: string;
  checked: boolean;
  addedVia: "voice" | "manual" | "suggestion";
}

export type IntentAction = "ADD" | "REMOVE" | "SEARCH" | "CLEAR" | "UNKNOWN";

export interface PriceFilter {
  min?: number;
  max?: number;
}

export interface ParsedCommand {
  action: IntentAction;
  matchedProduct?: Product;
  customName?: string;
  quantity: number;
  query?: string;
  priceFilter?: PriceFilter;
  rawTranscript: string;
}

export interface Suggestion {
  product: Product;
  reason: string;
  kind: "seasonal" | "restock" | "substitute";
}
