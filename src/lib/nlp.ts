import { catalog } from "@/data/catalog";
import { IntentAction, LangCode, ParsedCommand, PriceFilter, Product } from "@/types";

/**
 * Rule-based (dictionary + regex) NLP engine.
 * Supports multilingual grocery matching and flexible Indian Rupee (Rs.) / currency extraction.
 */

// ---- 1. Intent keywords, per language -------------------------------------

const CLEAR_WORDS: Record<LangCode, string[]> = {
  "en-US": ["clear my list", "clear the list", "empty my list", "empty the list", "start over", "clear cart", "delete everything"],
  "hi-IN": ["सूची खाली करो", "list khali karo", "list saaf karo", "sab hatao", "puri list hatao"],
  "es-ES": ["vacía la lista", "borra la lista", "limpia la lista"],
};

const REMOVE_WORDS: Record<LangCode, string[]> = {
  "en-US": ["remove", "delete", "take off", "get rid of", "don't need"],
  "hi-IN": ["हटाओ", "hatao", "nikaalo", "निकालो", "kam karo"],
  "es-ES": ["quita", "elimina", "borra", "no necesito"],
};

const SEARCH_WORDS: Record<LangCode, string[]> = {
  "en-US": ["find", "search for", "search", "look for", "show me", "is there", "items under", "snacks under"],
  "hi-IN": ["ढूंढो", "dhoondo", "khojo", "खोजो", "dikhao", "दिखाओ"],
  "es-ES": ["busca", "encuentra", "muéstrame"],
};

const ADD_WORDS: Record<LangCode, string[]> = {
  "en-US": ["add", "buy", "i need", "i want", "get me", "get", "put", "grab", "purchase"],
  "hi-IN": ["जोड़ो", "jodo", "चाहिए", "chahiye", "khareedo", "खरीदो", "lao", "लाओ"],
  "es-ES": ["añade", "agrega", "necesito", "quiero", "compra"],
};

// ---- 2. Quantity words, per language ---------------------------------------

const NUMBER_WORDS: Record<LangCode, Record<string, number>> = {
  "en-US": {
    one: 1, a: 1, an: 1, two: 2, to: 2, too: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  },
  "hi-IN": {
    ek: 1, do: 2, teen: 3, char: 4, paanch: 5, panch: 5, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10,
  },
  "es-ES": {
    un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
    seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  },
};

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[.,!?]/g, "");
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function extractQuantity(text: string, lang: LangCode): number {
  const digitMatch = text.match(/\b(\d{1,2})\b/);
  if (digitMatch) {
    const n = parseInt(digitMatch[1], 10);
    if (n > 0 && n <= 50) return n;
  }
  const words = text.split(/\s+/);
  const dict = NUMBER_WORDS[lang];
  for (const w of words) {
    if (dict[w] !== undefined) return dict[w];
  }
  return 1;
}

function extractPriceFilter(text: string): PriceFilter | undefined {
  // "between Rs 50 and Rs 100" / "between 50 and 100 rupees"
  const between = text.match(
    /between\s*(?:rs\.?|₹|\$)?\s*(\d+(?:\.\d+)?)\s*(?:and|to)\s*(?:rs\.?|₹|\$)?\s*(\d+(?:\.\d+)?)/i
  );
  if (between) return { min: parseFloat(between[1]), max: parseFloat(between[2]) };

  // "under Rs 100" / "below 50 rupees" / "less than 60" / "under 50" / "50 se kam"
  const under = text.match(
    /(?:under|below|less than|se kam|kam)\s*(?:rs\.?|₹|\$)?\s*(\d+(?:\.\d+)?)(?:\s*(?:rupees|rs|rupaye))?/i
  );
  if (under) return { max: parseFloat(under[1]) };

  // "over Rs 50" / "more than 100" / "above 100"
  const over = text.match(
    /(?:over|above|more than|se zyada|zyada)\s*(?:rs\.?|₹|\$)?\s*(\d+(?:\.\d+)?)(?:\s*(?:rupees|rs|rupaye))?/i
  );
  if (over) return { min: parseFloat(over[1]) };

  return undefined;
}

function detectIntent(text: string, lang: LangCode): IntentAction {
  const clearList = CLEAR_WORDS[lang] ?? CLEAR_WORDS["en-US"];
  if (clearList.some((w) => text.includes(w))) return "CLEAR";

  const removeList = REMOVE_WORDS[lang] ?? REMOVE_WORDS["en-US"];
  if (removeList.some((w) => text.includes(w))) return "REMOVE";

  const searchList = SEARCH_WORDS[lang] ?? SEARCH_WORDS["en-US"];
  if (searchList.some((w) => text.includes(w))) return "SEARCH";

  const addList = ADD_WORDS[lang] ?? ADD_WORDS["en-US"];
  if (addList.some((w) => text.includes(w))) return "ADD";

  // Default to ADD — most bare utterances ("milk", "two apples") imply adding.
  return "ADD";
}

/** Finds the catalog product whose alias best matches the transcript, preferring longer/more specific aliases. */
function matchProduct(text: string, lang: LangCode): Product | undefined {
  const candidates: { product: Product; aliasLen: number }[] = [];

  for (const product of catalog) {
    const aliasSets = [
      ...(product.aliases[lang] ?? []),
      ...(product.aliases["en-US"] ?? []), // English fallback so mixed-language speech still resolves
    ];
    for (const alias of aliasSets) {
      const a = stripAccents(alias.toLowerCase());
      if (stripAccents(text).includes(a)) {
        candidates.push({ product, aliasLen: a.length });
      }
    }
  }

  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => b.aliasLen - a.aliasLen);
  return candidates[0].product;
}

function stripKnownWords(text: string, lang: LangCode): string {
  const all = [
    ...(ADD_WORDS[lang] ?? []),
    ...(REMOVE_WORDS[lang] ?? []),
    ...(SEARCH_WORDS[lang] ?? []),
    ...ADD_WORDS["en-US"],
    ...REMOVE_WORDS["en-US"],
    ...SEARCH_WORDS["en-US"],
  ];
  let result = text;
  for (const phrase of all) result = result.replace(phrase, " ");
  result = result.replace(/\b(to|the|my|list|from|for|please|some|a|an|of|rupees|rs|rupaye)\b/g, " ");
  return result.replace(/\s+/g, " ").trim();
}

export function parseTranscript(rawTranscript: string, lang: LangCode): ParsedCommand {
  const text = normalize(rawTranscript);
  const action = detectIntent(text, lang);
  const quantity = extractQuantity(text, lang);
  const priceFilter = extractPriceFilter(text);
  const matchedProduct = matchProduct(text, lang);

  let customName: string | undefined;
  let query: string | undefined;

  if (action === "SEARCH") {
    query = stripKnownWords(text, lang);
  } else if (!matchedProduct && (action === "ADD" || action === "REMOVE")) {
    const leftover = stripKnownWords(text, lang).replace(/\b\d+\b/g, "").trim();
    customName = leftover.length > 0 ? leftover : undefined;
  }

  return { action, matchedProduct, customName, quantity, query, priceFilter, rawTranscript };
}

/** The catalog summary sent to Gemini so it can match against real product ids with Indian Rupee prices. */
export function catalogSummaryForPrompt(): string {
  return catalog.map((p) => `${p.id}: "${p.name}" (${p.category}, Rs. ${p.price})`).join("\n");
}
