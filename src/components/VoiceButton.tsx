"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Sparkles, Volume2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { parseTranscript } from "@/lib/nlp";
import { LangCode, ParsedCommand, PriceFilter, Product } from "@/types";
import { findProductById } from "@/data/catalog";
import { SpeechRecognitionLike } from "@/types/speech";

const LANGUAGES: { code: LangCode; label: string; short: string }[] = [
  { code: "en-US", label: "English", short: "EN" },
  { code: "hi-IN", label: "हिंदी", short: "HI" },
  { code: "es-ES", label: "Español", short: "ES" },
];

const AI_TIMEOUT_MS = 6000;

interface VoiceButtonProps {
  apiKey: string;
  onSearchResults: (query: string, priceFilter?: PriceFilter) => void;
}

/** Calls the optional Gemini-backed API route; returns null on any failure so the caller can fall back. */
async function tryAiParse(
  transcript: string,
  apiKey: string,
  currentItems: { name: string; quantity: number }[]
): Promise<Omit<ParsedCommand, "rawTranscript"> | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch("/api/nlp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, apiKey, currentItems }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (data.error || !data.action || data.action === "UNKNOWN") return null;

    return {
      action: data.action,
      matchedProduct: data.matchedProductId ? findProductById(data.matchedProductId) : undefined,
      customName: data.customName ?? undefined,
      quantity: data.quantity && data.quantity > 0 ? data.quantity : 1,
      query: data.query ?? undefined,
      priceFilter:
        data.priceMin != null || data.priceMax != null
          ? { min: data.priceMin ?? undefined, max: data.priceMax ?? undefined }
          : undefined,
    };
  } catch {
    return null; // network error, timeout, bad JSON — caller falls back to offline parser
  } finally {
    clearTimeout(timeout);
  }
}

export default function VoiceButton({ apiKey, onSearchResults }: VoiceButtonProps) {
  const { items, addProduct, addCustomItem, removeByName, clearList } = useStore();
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [usedAi, setUsedAi] = useState(false);
  const [lang, setLang] = useState<LangCode>("en-US");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = lang;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setFeedback("Didn't catch that — try again.");
      setTimeout(() => setFeedback(""), 3000);
    };
    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      setTranscript(text);
      handleCommand(text);
    };

    recognitionRef.current = recognition;
    return () => recognition.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, apiKey]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const handleCommand = async (text: string) => {
    setIsProcessing(true);
    setFeedback("Processing…");
    setUsedAi(false);

    let parsed: Omit<ParsedCommand, "rawTranscript"> | null = null;

    if (apiKey) {
      const currentItems = itemsRef.current.map((i) => ({ name: i.name, quantity: i.quantity }));
      parsed = await tryAiParse(text, apiKey, currentItems);
      if (parsed) setUsedAi(true);
    }

    if (!parsed) {
      parsed = parseTranscript(text, lang); // offline fallback — always available, never fails
    }

    let message = "";

    switch (parsed.action) {
      case "CLEAR": {
        clearList();
        message = "Cleared your entire grocery list.";
        break;
      }
      case "REMOVE": {
        const targetName = parsed.matchedProduct?.name ?? parsed.customName;
        const removed = targetName ? removeByName(targetName) : false;
        message = removed ? `Removed ${targetName} from list.` : `Couldn't find "${targetName}" on list.`;
        break;
      }
      case "SEARCH": {
        const q = parsed.matchedProduct?.name ?? parsed.query ?? "";
        onSearchResults(q, parsed.priceFilter);
        message = parsed.priceFilter ? `Found items in price range.` : `Found items for "${q}".`;
        break;
      }
      case "ADD":
      default: {
        if (parsed.matchedProduct) {
          const product: Product = parsed.matchedProduct;
          if (product.outOfStock && product.substituteId) {
            const sub = findProductById(product.substituteId);
            if (sub) {
              addProduct(sub, parsed.quantity, "voice");
              message = `${product.name} is out of stock — added ${sub.name} instead.`;
              break;
            }
          }
          addProduct(product, parsed.quantity, "voice");
          message = `Added ${parsed.quantity} ${product.name}.`;
        } else if (parsed.customName) {
          addCustomItem(parsed.customName, parsed.quantity, "Miscellaneous", "voice");
          message = `Added "${parsed.customName}" to Miscellaneous.`;
        } else {
          message = "Didn't catch an item name — try again.";
        }
      }
    }

    setFeedback(message);
    speak(message);
    setIsProcessing(false);
    setTimeout(() => {
      setFeedback("");
      setTranscript("");
    }, 4000);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis?.cancel();
      setTranscript("");
      setFeedback("");
      try {
        recognitionRef.current.start();
      } catch {
        // start() throws if already started — safe to ignore.
      }
    }
  };

  if (!supported) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 text-xs sm:text-sm text-white bg-[#a4262c] border border-[#8e2126] z-50">
        Voice recognition is supported in Chrome, Edge, and modern browsers.
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 z-40 px-4 w-full max-w-md pointer-events-none">
      {/* Live Voice Feedback Bubble */}
      <div
        className={`transition-all duration-300 w-full pointer-events-auto ${
          feedback || transcript || listening || isProcessing
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="voice-bar px-5 py-3 text-center text-white flex items-center justify-center gap-2.5">
          {listening && !transcript && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 h-5">
                <span className="w-1 bg-[#4cc2ff] bar-1" />
                <span className="w-1 bg-[#4cc2ff] bar-2" />
                <span className="w-1 bg-[#4cc2ff] bar-3" />
                <span className="w-1 bg-[#4cc2ff] bar-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4cc2ff]">
                Listening…
              </span>
            </div>
          )}

          {transcript && !isProcessing && (
            <span className="text-xs sm:text-sm font-medium text-white truncate max-w-xs">
              &ldquo;{transcript}&rdquo;
            </span>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 text-[#4cc2ff] text-xs sm:text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Understanding command…</span>
            </div>
          )}

          {!isProcessing && !transcript && feedback && (
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-[#4cc2ff] shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-white">
                {feedback}
              </span>
              {usedAi && (
                <span className="px-1.5 py-0.5 bg-white/15 text-[#4cc2ff] text-[10px] font-bold tracking-wider uppercase font-mono">
                  AI
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="voice-bar p-1.5 flex items-center gap-2 pointer-events-auto">
        {/* Language Switcher */}
        <div className="flex bg-black/30 border border-white/10 p-0.5">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-3 py-1 text-xs font-semibold transition-colors ${
                lang === l.code
                  ? "bg-[#0078d4] text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {l.short}
            </button>
          ))}
        </div>

        {/* AI status badge */}
        {apiKey && (
          <span
            title="Gemini AI mode active"
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 text-[#4cc2ff] border border-white/15 text-[10px] font-semibold"
          >
            <Sparkles className="w-3 h-3" /> AI
          </span>
        )}

        {/* Mic Button */}
        <div className="relative">
          {listening && (
            <span
              className="absolute inset-[-4px] bg-white/10 ms-pulse-active"
              aria-hidden
            />
          )}
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            aria-label={listening ? "Stop listening" : "Start voice command"}
            className={`relative w-11 h-11 flex items-center justify-center transition-colors ${
              listening
                ? "bg-[#a4262c] hover:bg-[#8e2126] text-white"
                : "bg-[#0078d4] hover:bg-[#106ebe] text-white"
            } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {listening ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Mic className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
