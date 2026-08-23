"use client";

import React from "react";
import { catalog } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { PriceFilter } from "@/types";
import { Plus, X, SearchX, ShoppingBag } from "lucide-react";

interface SearchResultsProps {
  query: string;
  priceFilter?: PriceFilter;
  onClose: () => void;
}

export default function SearchResults({ query, priceFilter, onClose }: SearchResultsProps) {
  const { addProduct } = useStore();

  const results = catalog.filter((p) => {
    const nameMatches = query
      ? p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.aliases["en-US"] ?? []).some((a) => a.includes(query.toLowerCase())) ||
        (p.aliases["hi-IN"] ?? []).some((a) => a.includes(query.toLowerCase())) ||
        (p.aliases["es-ES"] ?? []).some((a) => a.includes(query.toLowerCase()))
      : true;
    const priceOk =
      (priceFilter?.min === undefined || p.price >= priceFilter.min) &&
      (priceFilter?.max === undefined || p.price <= priceFilter.max);
    return nameMatches && priceOk;
  });

  return (
    <section className="mb-6 ms-panel p-5">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e1dfdd]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#deecf9] flex items-center justify-center text-[#0078d4]">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-base font-bold text-[#201f1e]">
            Search Results {query ? <span className="text-[#0078d4]">&ldquo;{query}&rdquo;</span> : ""}
            {priceFilter?.max ? (
              <span className="text-xs text-[#605e5c] ml-1.5 font-mono font-normal">(Under Rs. {priceFilter.max})</span>
            ) : null}
          </h4>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 bg-[#f3f2f1] hover:bg-[#e1dfdd] flex items-center justify-center text-[#605e5c] hover:text-[#201f1e] transition-colors"
          aria-label="Close search results"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center text-[#8a8886]">
          <div className="w-10 h-10 bg-[#f3f2f1] flex items-center justify-center mb-2.5 text-[#8a8886]">
            <SearchX className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#605e5c]">No matching items found</p>
          <p className="text-[11px] text-[#8a8886] mt-1 max-w-xs">
            Say &ldquo;Add {query || "item"}&rdquo; or type it above to add to Miscellaneous.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.map((p) => (
            <div
              key={p.id}
              className="ms-card p-3 flex items-center gap-2.5"
            >
              <span className="text-xl shrink-0">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-[#201f1e] truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-[#201f1e] font-mono">
                    Rs. {p.price}
                  </span>
                  <span className="text-[9px] text-[#605e5c] px-1.5 py-0.5 bg-[#f3f2f1]">
                    {p.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => addProduct(p, 1, "voice")}
                className="w-7 h-7 shrink-0 bg-[#0078d4] hover:bg-[#106ebe] text-white flex items-center justify-center transition-colors"
                aria-label={`Add ${p.name}`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
