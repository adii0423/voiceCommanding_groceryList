# 🛒 Voice Grocery — Voice-Controlled Shopping Assistant

A fast, minimalist grocery shopping assistant built with Next.js and the Web Speech API. It recognizes natural voice commands in **English, Hindi (हिंदी), and Spanish (Español)**, auto-categorizes items, handles pricing in Indian Rupees (Rs.), provides seasonal/substitute recommendations, and works completely offline with an optional Gemini AI mode.

🔗 **Live Demo:** [https://voice-command-groceryl-ist.vercel.app](https://voice-command-groceryl-ist.vercel.app)

---

## ✨ Features

- 🎙️ **Multilingual Voice Recognition:** Add, remove, clear, or search grocery items by voice in English, Hindi, or Spanish.
- 🍏 **Apple-Inspired Minimalist UI:** Frosted glass cards, smooth squircle corners, tactile quantity steppers, and a floating Dynamic Island voice control bar.
- 📦 **Smart Auto-Categorization & Custom Items:** Catalog items are automatically grouped into Produce, Dairy & Eggs, Bakery, Pantry, Beverages, Snacks, etc. Custom or unrecognized items default directly to **Miscellaneous**.
- 🇮🇳 **Indian Rupee (Rs.) Pricing & Price Filters:** Realistic grocery pricing and voice-based price filtering (e.g., *"find snacks under Rs. 50"*, *"items between 50 and 100 rupees"*).
- 🔄 **Smart Recommendations:**
  - **In-Season Picks:** Suggests fruits/vegetables currently in season.
  - **Restock Reminders:** Tracks frequently purchased groceries.
  - **Smart Substitutes:** Automatically suggests alternatives when an item is out of stock (e.g. Whole Milk → Almond Milk).
- ✍️ **Quick Add Bar:** Quickly type custom groceries directly with a category picker without needing to use the mic.
- ⚡ **Offline-First with Optional Gemini AI Mode:**
  - **Default (Offline):** Instant rule-based dictionary & regex NLP engine running directly in the browser with zero latency and zero API dependencies.
  - **AI Mode (Optional):** Add a free Google Gemini API key in Settings for richer conversational phrasing. Automatically falls back to offline parser on any timeout or rate limit.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI & Styling:** React 19, Tailwind CSS v4, Lucide Icons
- **Language:** TypeScript
- **Voice & Audio:** Web Speech API (`webkitSpeechRecognition` & `SpeechSynthesis`)
- **AI Engine (Optional):** `@google/generative-ai` (Gemini Flash)
- **Persistence:** Browser `localStorage`

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) installed.

### Installation

```bash
git clone https://github.com/Belal-dev112/voice-command-groceryl-ist.git
cd voice-command-groceryl-ist
npm install
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome, Edge, or any browser supporting the Web Speech API and allow microphone permissions when prompted.

---

## 🎤 Example Voice Commands

| Intent | Example Commands |
|---|---|
| **Add item** | *"Add 2 apples"*, *"I need whole milk"*, *"Buy potato chips"* |
| **Remove item** | *"Remove bread"*, *"Delete apples from my list"* |
| **Price search** | *"Find snacks under Rs. 50"*, *"Show me items under 100 rupees"* |
| **Clear list** | *"Clear my list"*, *"Empty cart"* |
| **Hindi (हिंदी)** | *"दूध जोड़ो"*, *"दो सेब चाहिए"*, *"50 रुपये से कम के स्नैक्स दिखाओ"* |
| **Spanish (Español)** | *"Añade dos manzanas"*, *"Necesito pan"*, *"Busca aperitivos"* |

---

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/nlp/route.ts       # Optional Gemini AI fallback route
│   │   ├── globals.css            # Apple-style glassmorphism & design system
│   │   ├── layout.tsx             # Root layout & Google Fonts
│   │   └── page.tsx               # Main grocery dashboard
│   ├── components/
│   │   ├── SearchResults.tsx      # Voice search results card
│   │   ├── SettingsPanel.tsx      # Gemini API key settings sheet
│   │   ├── ShoppingList.tsx       # Grouped grocery list & steppers
│   │   ├── Suggestions.tsx        # Smart grocery recommendation shelf
│   │   └── VoiceButton.tsx        # Dynamic Island floating mic bar
│   ├── data/
│   │   └── catalog.ts             # Grocery items, aliases (EN/HI/ES), & Rs. prices
│   ├── lib/
│   │   ├── nlp.ts                 # Multilingual dictionary & regex parser
│   │   ├── store.tsx              # Cart state & localStorage sync
│   │   └── suggestions.ts         # Restock, seasonal & substitute logic
│   └── types/
│       ├── index.ts               # Core TypeScript interfaces & Category union
│       └── speech.d.ts            # Web Speech API definitions
├── vercel.json                    # Vercel deployment configuration
└── package.json
```

---

## 📄 License

MIT License. Open source and free to use.
