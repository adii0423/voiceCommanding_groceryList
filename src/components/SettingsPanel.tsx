"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Check, Trash2, X, ShieldCheck, ExternalLink } from "lucide-react";

const STORAGE_KEY = "voice_list_gemini_key";

export function useGeminiKey() {
  const [apiKey, setApiKeyState] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setApiKeyState(saved);
    }
  }, []);

  const setApiKey = (key: string) => {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
    setApiKeyState(key);
  };

  return { apiKey, setApiKey };
}

interface SettingsPanelProps {
  apiKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function SettingsPanel({ apiKey, onSave, onClose }: SettingsPanelProps) {
  const [draft, setDraft] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    onSave(draft.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg ms-panel p-6 sm:p-7 relative bg-white">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e1dfdd]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#deecf9] flex items-center justify-center text-[#0078d4]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#201f1e]">AI Voice Engine</h3>
              <p className="text-[11px] text-[#605e5c] font-sans">Gemini-powered Natural Language Processing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-[#f3f2f1] hover:bg-[#e1dfdd] flex items-center justify-center text-[#605e5c] hover:text-[#201f1e] transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#605e5c] mb-5 leading-relaxed font-sans">
          Your assistant uses Google Gemini for richer natural phrasing. If missing or rate-limited, it silently falls back to the fast offline parser.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#605e5c] mb-2 font-sans">
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Paste API Key (e.g. AIzaSy... or AQ....)"
                className="flex-1 px-4 py-2.5 bg-white border border-[#e1dfdd] text-xs sm:text-sm text-[#201f1e] placeholder:text-[#8a8886] outline-none focus:border-[#0078d4] transition-colors font-mono"
              />
              <button
                onClick={handleSave}
                className="px-5 py-2.5 ms-btn font-semibold text-xs sm:text-sm flex items-center gap-1.5 active:scale-[0.98]"
              >
                {saved ? <Check className="w-4 h-4" /> : null}
                {saved ? "Saved" : "Save"}
              </button>
              {apiKey && (
                <button
                  onClick={() => {
                    setDraft("");
                    onSave("");
                  }}
                  className="px-3 py-2.5 text-[#a4262c] hover:bg-[#fde7e9] border border-[#e1dfdd] transition-colors"
                  title="Clear key and use offline parser only"
                  aria-label="Clear API key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#605e5c] border-t border-[#e1dfdd] font-sans">
            <span className="flex items-center gap-1 text-[#0078d4]">
              <ShieldCheck className="w-3.5 h-3.5" /> Stored locally in browser
            </span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#201f1e] flex items-center gap-1 transition-colors"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
