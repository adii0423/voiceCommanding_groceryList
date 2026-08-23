"use client";

import React, { useState } from "react";
import Image from "next/image";
import VoiceButton from "@/components/VoiceButton";
import ShoppingList from "@/components/ShoppingList";
import Suggestions from "@/components/Suggestions";
import SearchResults from "@/components/SearchResults";
import SettingsPanel, { useGeminiKey } from "@/components/SettingsPanel";
import { useStore } from "@/lib/store";
import { Category, PriceFilter } from "@/types";
import { catalog } from "@/data/catalog";
import {
  Settings,
  Plus,
  Trash2,
  Package,
  Leaf,
  Volume2,
  Store,
  Calendar,
  Search,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";

type ActiveTab = "pantry" | "market" | "harvest";

const CATEGORIES: Category[] = [
  "Produce",
  "Dairy & Eggs",
  "Meat & Seafood",
  "Bakery",
  "Pantry",
  "Frozen",
  "Beverages",
  "Snacks",
  "Household",
  "Miscellaneous",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Home() {
  const { items, addProduct, addCustomItem, clearList } = useStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("pantry");
  const [marketCategory, setMarketCategory] = useState<string>("All");
  const [marketSearch, setMarketSearch] = useState<string>("");
  const [search, setSearch] = useState<{ query: string; priceFilter?: PriceFilter } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  const [quickCategory, setQuickCategory] = useState<Category>("Miscellaneous");
  const { apiKey, setApiKey } = useGeminiKey();

  const currentMonth = new Date().getMonth() + 1;
  const currentMonthName = MONTH_NAMES[currentMonth - 1];

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const pickedUpCount = items.filter((i) => i.checked).length;
  const totalItemsCount = items.length;
  const progressPercent = totalItemsCount > 0 ? Math.round((pickedUpCount / totalItemsCount) * 100) : 0;

  // Calculate estimated total price in Rs.
  const estimatedTotal = items.reduce((sum, i) => {
    if (i.productId) {
      const match = catalog.find((p) => p.id === i.productId);
      return sum + (match?.price || 0) * i.quantity;
    }
    return sum;
  }, 0);

  // Filter market items
  const filteredMarketItems = catalog.filter((p) => {
    const categoryMatches = marketCategory === "All" || p.category === marketCategory;
    const searchMatches = marketSearch
      ? p.name.toLowerCase().includes(marketSearch.toLowerCase()) ||
        (p.aliases["en-US"] ?? []).some((a) => a.toLowerCase().includes(marketSearch.toLowerCase())) ||
        (p.aliases["hi-IN"] ?? []).some((a) => a.includes(marketSearch.toLowerCase()))
      : true;
    return categoryMatches && searchMatches;
  });

  // Seasonal Harvest items
  const seasonalHarvestItems = catalog.filter((p) => p.seasonalMonths?.includes(currentMonth));

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    addCustomItem(quickInput.trim(), 1, quickCategory, "manual");
    setQuickInput("");
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] text-[#201f1e] flex flex-col justify-between">
      {/* Top Header Navigation */}
      <header className="border-b border-[#e1dfdd] px-6 lg:px-14 py-3 flex items-center justify-between sticky top-0 bg-white z-30">
        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveTab("pantry")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-[#0078d4] flex items-center justify-center text-white">
            <Leaf className="w-4 h-4 stroke-[1.8]" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-[#201f1e]">Voice Grocery</span>
            <span className="text-[10px] block uppercase tracking-[0.14em] text-[#605e5c] font-sans">Grocery List Assistant</span>
          </div>
        </div>

        {/* Center Interactive Nav Links */}
        <nav className="flex items-center gap-1 p-1 bg-[#f3f2f1] border border-[#e1dfdd] text-xs font-semibold uppercase tracking-[0.1em]">
          {/* Market Tab */}
          <button
            onClick={() => setActiveTab("market")}
            className={`px-3.5 sm:px-5 py-1.5 transition-colors flex items-center gap-1.5 ${
              activeTab === "market"
                ? "bg-[#0078d4] text-white font-bold"
                : "text-[#605e5c] hover:text-[#201f1e] hover:bg-white"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Market</span>
            <span className="text-[10px] opacity-80 font-mono">({catalog.length})</span>
          </button>

          {/* Pantry Tab */}
          <button
            onClick={() => setActiveTab("pantry")}
            className={`px-3.5 sm:px-5 py-1.5 transition-colors flex items-center gap-1.5 ${
              activeTab === "pantry"
                ? "bg-[#0078d4] text-white font-bold"
                : "text-[#605e5c] hover:text-[#201f1e] hover:bg-white"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Pantry</span>
            {totalItemsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white/25 text-[10px] font-mono">
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* Harvest Tab */}
          <button
            onClick={() => setActiveTab("harvest")}
            className={`px-3.5 sm:px-5 py-1.5 transition-colors flex items-center gap-1.5 ${
              activeTab === "harvest"
                ? "bg-[#0078d4] text-white font-bold"
                : "text-[#605e5c] hover:text-[#201f1e] hover:bg-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Harvest</span>
            <span className="text-[10px] opacity-80 font-mono">({seasonalHarvestItems.length})</span>
          </button>
        </nav>

        {/* Action Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="ms-btn-secondary px-3.5 sm:px-4 py-1.5 text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5 active:scale-[0.98]"
        >
          <Settings className="w-3 h-3 text-[#0078d4]" />
          <span className="hidden sm:inline">AI Setup</span>
        </button>
      </header>

      {/* Main 3-Column Grid */}
      <main className="max-w-[1400px] w-full mx-auto px-5 lg:px-12 py-8 lg:py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pb-44">
        {/* Left Column: Headline & Context */}
        <div className="lg:col-span-4 flex flex-col justify-between lg:h-full lg:sticky lg:top-24 space-y-6">
          <div>
            {/* View Specific Subtitle */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#deecf9] text-[#005a9e] text-[11px] font-semibold tracking-wide uppercase mb-3">
              {activeTab === "pantry" ? (
                <>
                  <ShoppingBag className="w-3 h-3" /> In Your Basket
                </>
              ) : activeTab === "market" ? (
                <>
                  <Store className="w-3 h-3" /> Full Catalog & Store
                </>
              ) : (
                <>
                  <Calendar className="w-3 h-3" /> {currentMonthName} Harvest
                </>
              )}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#201f1e] leading-[1.1] mb-3">
              {activeTab === "pantry" ? "Pantry" : activeTab === "market" ? "Market" : "Harvest"}
            </h1>

            <div className="w-16 h-[3px] bg-[#0078d4] mb-5" />

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#605e5c] font-normal leading-relaxed max-w-sm mb-6">
              {activeTab === "pantry" &&
                "Review your shopping list, track picked up items, add custom groceries to Miscellaneous, or speak commands in English, Hindi, and Spanish."}
              {activeTab === "market" &&
                "Explore all fresh produce, dairy, bakery, snacks, and essentials available in the grocery catalog with real-time Indian Rupee (Rs.) pricing."}
              {activeTab === "harvest" &&
                `Discover fresh produce picked at peak seasonal freshness for ${currentMonthName}. Add them directly to your weekly grocery basket.`}
            </p>

            {/* Live Basket Summary */}
            <div className="ms-panel p-4 mb-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono bg-[#0078d4] px-2 py-0.5">
                    {progressPercent}%
                  </span>
                  <span className="text-xs text-[#201f1e] font-medium">
                    {pickedUpCount} of {totalItemsCount} items picked ({totalQuantity} units)
                  </span>
                </div>
                {estimatedTotal > 0 && (
                  <span className="text-xs font-bold font-mono text-[#005a9e]">
                    Est. Rs. {estimatedTotal}
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 bg-[#f3f2f1] overflow-hidden">
                <div
                  className="h-full bg-[#0078d4] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Custom Item Addition Box */}
            <form onSubmit={handleQuickAdd} className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-white border border-[#e1dfdd] focus-within:border-[#0078d4] transition-colors">
                <Package className="w-4 h-4 text-[#605e5c] ml-1 shrink-0" />
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Add custom item (e.g. Organic Honey)..."
                  className="bg-transparent text-xs sm:text-sm text-[#201f1e] placeholder:text-[#8a8886] outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value as Category)}
                  className="flex-1 px-3 py-2 bg-white text-xs text-[#201f1e] border border-[#e1dfdd] outline-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!quickInput.trim()}
                  className="px-4 py-2 ms-btn text-xs font-semibold disabled:opacity-40 flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Center Column: Grocery Photo Card */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="relative w-full max-w-[380px] aspect-[9/15] overflow-hidden border border-[#e1dfdd] bg-[#f3f2f1] group">
            <Image
              src="/grocery_hero.jpg"
              alt="Hand holding fresh grocery tote"
              fill
              priority
              className="object-cover"
            />
            {/* Bottom Info Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#201f1e]/90 px-4 py-3 flex items-center justify-between">
              <div className="text-xs text-white font-medium flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#4cc2ff]" />
                <span>
                  {activeTab === "pantry" ? "Voice Assistant Ready" : activeTab === "market" ? "Browse & Add Items" : "In-Season Harvest"}
                </span>
              </div>
              <span className="w-2 h-2 bg-[#4cc2ff] animate-ping" />
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Content Panel */}
        <div className="lg:col-span-4 ms-panel p-5 sm:p-7 space-y-5">
          {/* TAB 1: PANTRY VIEW */}
          {activeTab === "pantry" && (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-[#e1dfdd]">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-[#201f1e]">Your Pantry Basket</h3>
                  <span className="text-xs font-mono text-[#8a8886]">({totalItemsCount} items)</span>
                </div>
                {items.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Clear all items from your grocery list?")) {
                        clearList();
                      }
                    }}
                    className="text-xs text-[#605e5c] hover:text-[#a4262c] flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>

              {/* Voice Search Results */}
              {search && (
                <SearchResults
                  query={search.query}
                  priceFilter={search.priceFilter}
                  onClose={() => setSearch(null)}
                />
              )}

              {/* Seasonal & Smart Suggestions */}
              <Suggestions />

              {/* Categorized Shopping List */}
              <ShoppingList />
            </>
          )}

          {/* TAB 2: MARKET VIEW (All Items in the Store) */}
          {activeTab === "market" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e1dfdd]">
                <div>
                  <h3 className="text-xl font-bold text-[#201f1e]">Marketplace Catalog</h3>
                  <p className="text-xs text-[#605e5c]">All {catalog.length} items available in store</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e1dfdd]">
                <Search className="w-3.5 h-3.5 text-[#8a8886]" />
                <input
                  type="text"
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  placeholder="Search catalog by name or Hindi/Spanish..."
                  className="bg-transparent text-xs text-[#201f1e] placeholder:text-[#8a8886] outline-none w-full"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {["All", ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMarketCategory(cat)}
                    className={`px-3 py-1 whitespace-nowrap transition-colors text-xs border ${
                      marketCategory === cat
                        ? "bg-[#0078d4] text-white font-bold border-[#0078d4]"
                        : "bg-white text-[#605e5c] hover:text-[#201f1e] border-[#e1dfdd]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredMarketItems.map((product) => {
                  const alreadyInCart = items.find((i) => i.productId === product.id);

                  return (
                    <div
                      key={product.id}
                      className="ms-card p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">{product.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-[#201f1e] truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-[#201f1e] font-mono">
                              Rs. {product.price}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-[#8a8886] font-medium">
                              {product.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => addProduct(product, 1, "manual")}
                        className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                          alreadyInCart
                            ? "bg-[#f3f2f1] text-[#201f1e] border border-[#e1dfdd]"
                            : "ms-btn"
                        }`}
                      >
                        {alreadyInCart ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#107c10]" />
                            <span>In Basket ({alreadyInCart.quantity})</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: HARVEST VIEW (Currently In-Season) */}
          {activeTab === "harvest" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e1dfdd]">
                <div>
                  <h3 className="text-xl font-bold text-[#201f1e]">{currentMonthName} Harvest</h3>
                  <p className="text-xs text-[#605e5c]">Fresh produce harvested at peak season</p>
                </div>
                <span className="px-2.5 py-1 bg-[#deecf9] text-xs text-[#005a9e] font-semibold">
                  {seasonalHarvestItems.length} in season
                </span>
              </div>

              {/* Harvest In-Season Cards */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {seasonalHarvestItems.map((product) => {
                  const alreadyInCart = items.find((i) => i.productId === product.id);

                  return (
                    <div
                      key={product.id}
                      className="ms-card p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl shrink-0">{product.emoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-[#201f1e] truncate">
                              {product.name}
                            </p>
                            <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-[#107c10] text-white">
                              Peak Fresh
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-[#201f1e] font-mono">
                              Rs. {product.price}
                            </span>
                            <span className="text-[10px] text-[#605e5c]">
                              {product.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => addProduct(product, 1, "suggestion")}
                        className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                          alreadyInCart
                            ? "bg-[#f3f2f1] text-[#201f1e] border border-[#e1dfdd]"
                            : "bg-[#107c10] text-white hover:bg-[#0e6b0e]"
                        }`}
                      >
                        {alreadyInCart ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#107c10]" />
                            <span>Added ({alreadyInCart.quantity})</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel apiKey={apiKey} onSave={setApiKey} onClose={() => setShowSettings(false)} />
      )}

      {/* Bottom Floating Voice Control */}
      <VoiceButton
        apiKey={apiKey}
        onSearchResults={(query, priceFilter) => {
          setActiveTab("pantry");
          setSearch({ query, priceFilter });
        }}
      />
    </div>
  );
}
