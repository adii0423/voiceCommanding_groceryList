"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Category, Product, ShoppingItem } from "@/types";

interface StoreContextType {
  items: ShoppingItem[];
  purchaseHistory: Record<string, number>;
  loading: boolean;
  addProduct: (product: Product, quantity: number, addedVia: ShoppingItem["addedVia"]) => void;
  addCustomItem: (
    name: string,
    quantity: number,
    category?: Category,
    addedVia?: ShoppingItem["addedVia"]
  ) => void;
  removeById: (id: string) => void;
  removeByName: (name: string) => boolean;
  updateQuantity: (id: string, quantity: number) => void;
  toggleChecked: (id: string) => void;
  clearList: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);
const CART_KEY = "voice_list_cart_v1";
const HISTORY_KEY = "voice_list_history_v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Load once on mount.
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedCart) setItems(JSON.parse(savedCart));
      if (savedHistory) setPurchaseHistory(JSON.parse(savedHistory));
    } catch {
      // Corrupt localStorage — start fresh rather than crashing the app.
    } finally {
      setLoading(false);
    }
  }, []);

  // Persist on every change (after initial load).
  useEffect(() => {
    if (!loading) localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, loading]);

  useEffect(() => {
    if (!loading) localStorage.setItem(HISTORY_KEY, JSON.stringify(purchaseHistory));
  }, [purchaseHistory, loading]);

  const recordHistory = (productId?: string) => {
    if (!productId) return;
    setPurchaseHistory((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
  };

  const addProduct: StoreContextType["addProduct"] = (product, quantity, addedVia) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: `${product.id}_${Date.now()}`,
          productId: product.id,
          name: product.name,
          category: product.category,
          quantity,
          checked: false,
          addedVia,
        },
      ];
    });
    recordHistory(product.id);
  };

  const addCustomItem: StoreContextType["addCustomItem"] = (
    name,
    quantity,
    category = "Miscellaneous",
    addedVia = "voice"
  ) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => !i.productId && i.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: `custom_${Date.now()}`,
          name,
          category,
          quantity,
          checked: false,
          addedVia,
        },
      ];
    });
  };

  const removeById: StoreContextType["removeById"] = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const removeByName: StoreContextType["removeByName"] = (name) => {
    const lower = name.toLowerCase().trim();
    let found = false;
    setItems((prev) => {
      const match = prev.find(
        (i) =>
          i.name.toLowerCase().includes(lower) ||
          lower.includes(i.name.toLowerCase())
      );
      if (!match) return prev;
      found = true;
      return prev.filter((i) => i.id !== match.id);
    });
    return found;
  };

  const updateQuantity: StoreContextType["updateQuantity"] = (id, quantity) => {
    if (quantity <= 0) return removeById(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const toggleChecked: StoreContextType["toggleChecked"] = (id) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const clearList = () => setItems([]);

  return (
    <StoreContext.Provider
      value={{
        items,
        purchaseHistory,
        loading,
        addProduct,
        addCustomItem,
        removeById,
        removeByName,
        updateQuantity,
        toggleChecked,
        clearList,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
