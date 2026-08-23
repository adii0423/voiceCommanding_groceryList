"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Plus, Minus, Trash2, Check, ShoppingBag, Mic, Sparkles, PenLine } from "lucide-react";
import { Category } from "@/types";
import { catalog } from "@/data/catalog";

const CATEGORY_ICONS: Record<Category, string> = {
  Produce: "🥦",
  "Dairy & Eggs": "🧀",
  "Meat & Seafood": "🐟",
  Bakery: "🥖",
  Pantry: "🌾",
  Frozen: "🧊",
  Beverages: "🧃",
  Snacks: "🥨",
  Household: "🧼",
  Miscellaneous: "📦",
};

export default function ShoppingList() {
  const { items, loading, updateQuantity, toggleChecked, removeById } = useStore();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-7 h-7 border-2 border-[#e1dfdd] border-t-[#0078d4] rounded-full animate-spin" />
        <span className="text-xs text-[#605e5c] font-medium">Loading pantry basket…</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 sm:p-8 text-center flex flex-col items-center border border-dashed border-[#c8c6c4] bg-[#faf9f8]">
        <div className="w-12 h-12 bg-[#deecf9] border border-[#e1dfdd] flex items-center justify-center text-[#0078d4] mb-3">
          <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h4 className="text-lg font-bold text-[#201f1e] mb-1">
          Your basket is empty
        </h4>
        <p className="text-xs text-[#605e5c] max-w-xs mb-4 leading-relaxed">
          Say an item like &ldquo;Add whole milk&rdquo; or type below to populate your grocery list.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {['"Add 2 apples"', '"I need milk"', '"Snacks under Rs. 50"'].map((phrase, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 text-[11px] text-[#201f1e] bg-white border border-[#e1dfdd] flex items-center gap-1"
            >
              <Mic className="w-2.5 h-2.5 text-[#0078d4]" /> {phrase}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const getItemEmoji = (item: (typeof items)[0]) => {
    if (item.productId) {
      const match = catalog.find((p) => p.id === item.productId);
      if (match?.emoji) return match.emoji;
    }
    return CATEGORY_ICONS[item.category] || "🛒";
  };

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([categoryName, categoryItems]) => {
        const category = categoryName as Category;
        const icon = CATEGORY_ICONS[category] || "🛒";
        const completedInCategory = categoryItems.filter((i) => i.checked).length;

        return (
          <section key={category} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <h4 className="font-semibold text-xs sm:text-sm tracking-wide text-[#201f1e] uppercase font-sans">
                  {category}
                </h4>
              </div>
              <span className="text-[11px] text-[#8a8886] font-mono">
                {completedInCategory}/{categoryItems.length}
              </span>
            </div>

            <div className="space-y-2">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className={`ms-card p-3 sm:p-3.5 flex items-center gap-3 ${
                    item.checked ? "opacity-50" : ""
                  }`}
                >
                  {/* Check Indicator */}
                  <button
                    onClick={() => toggleChecked(item.id)}
                    aria-label={item.checked ? "Mark as needed" : "Mark as picked up"}
                    className={`w-5 h-5 shrink-0 flex items-center justify-center transition-colors border-2 ${
                      item.checked
                        ? "bg-[#0078d4] border-[#0078d4] text-white"
                        : "border-[#8a8886] hover:border-[#0078d4] bg-white"
                    }`}
                  >
                    {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  {/* Emoji Badge */}
                  <span className="text-lg shrink-0">{getItemEmoji(item)}</span>

                  {/* Item Name & Meta */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm text-[#201f1e] truncate ${
                        item.checked ? "line-through text-[#8a8886]" : ""
                      }`}
                    >
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] tracking-wider uppercase text-[#8a8886] font-medium flex items-center gap-0.5">
                        {item.addedVia === "voice" ? (
                          <>
                            <Mic className="w-2.5 h-2.5 text-[#0078d4]" /> Voice
                          </>
                        ) : item.addedVia === "suggestion" ? (
                          <>
                            <Sparkles className="w-2.5 h-2.5 text-[#107c10]" /> Pick
                          </>
                        ) : (
                          <>
                            <PenLine className="w-2.5 h-2.5 text-[#605e5c]" /> Manual
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-[#e1dfdd] p-0.5 gap-0.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-[#605e5c] hover:text-[#a4262c] hover:bg-[#f3f2f1] transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-[#201f1e] font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center text-[#605e5c] hover:text-[#0078d4] hover:bg-[#f3f2f1] transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeById(item.id)}
                    className="w-7 h-7 flex items-center justify-center text-[#8a8886] hover:text-[#a4262c] transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
