"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Plus, Settings, HelpCircle, MessageSquare, Paperclip, Send,
  Sparkles, ChevronLeft, Trash2, Code2, TrendingUp, Brain,
  ArrowUpRight, Play, Zap, BarChart2, AlertTriangle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = "code" | "trade" | "friend";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
  mode?: Mode;
}

interface StockData {
  ticker: string;
  name: string;
  price: number;
  prediction: "BULLISH" | "BEARISH";
  confidence: number;
  sentiment: number;
  sentiment_label: "Panic" | "Neutral" | "Euphoria";
  day_high?: number;
  day_low?: number;
  volume?: number;
  market_cap?: number;
  history?: { name: string; value: number }[];
}

interface ScreenerStock {
  ticker: string;
  name: string;
  price: number;
  direction: "BULLISH" | "BEARISH";
  confidence: number;
  week_change_pct: number;
}

interface SandboxResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
  error_line: number | null;
  corrected_code: string | null;
  time_travel_steps: { line: number; explanation: string; status: "success" | "error" }[];
  visualization_url: string | null;
}

interface ActiveArtifact {
  type: "welcome" | "ticker" | "sandbox" | "screener";
  title: string;
  data?: StockData;
  code?: string;
  result?: SandboxResult;
  screener?: { best_picks: ScreenerStock[]; watch_out: ScreenerStock[] };
}

// ─── Mode Config ─────────────────────────────────────────────────────────────

const MODE_CONFIG = {
  code: {
    label: "APEX CODE",
    icon: Code2,
    color: "#3b82f6",
    colorClass: "text-blue-400",
    borderClass: "border-blue-500/50",
    bgClass: "bg-blue-500/8",
    glowClass: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    focusRing: "focus-within:border-blue-500/70 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    greeting: "What do you want to build?",
    sub: "Extreme Full-Stack Engineer — debug, build, ship.",
    placeholder: "Paste code, describe a bug, or say 'build a React dashboard'...",
    suggestions: [
      { title: "Debug Code", desc: "Paste any code to identify the root cause and fix it.", prompt: "debug", icon: AlertTriangle },
      { title: "Build Website", desc: "Describe what you want to build and generate the implementation.", prompt: "build", icon: Zap },
      { title: "Explain Error", desc: "Paste a stack trace to locate the error and find the fix.", prompt: "explain", icon: Code2 },
    ],
  },
  trade: {
    label: "APEX TRADE",
    icon: TrendingUp,
    color: "#ff9e00",
    colorClass: "text-amber-400",
    borderClass: "border-amber-500/50",
    bgClass: "bg-amber-500/8",
    glowClass: "shadow-[0_0_20px_rgba(255,158,0,0.15)]",
    focusRing: "focus-within:border-amber-500/70 focus-within:shadow-[0_0_15px_rgba(255,158,0,0.15)]",
    greeting: "What is the market status?",
    sub: "Quantitative Market Analyst — live prices, signals, picks.",
    placeholder: "Ask about a stock, e.g. 'TCS analysis' or 'best stocks today'...",
    suggestions: [
      { title: "Check TCS", desc: "Check the live price, seven-day chart, and market signal.", prompt: "TCS", icon: BarChart2 },
      { title: "Best Stocks Today", desc: "View the top bullish picks from Indian and US markets.", prompt: "screener", icon: TrendingUp },
      { title: "Analyze NVDA", desc: "Get a technical breakdown with price momentum and forecasts.", prompt: "NVDA", icon: ArrowUpRight },
    ],
  },
  friend: {
    label: "APEX MIND",
    icon: Brain,
    color: "#a78bfa",
    colorClass: "text-violet-400",
    borderClass: "border-violet-500/50",
    bgClass: "bg-violet-500/8",
    glowClass: "shadow-[0_0_20px_rgba(167,139,250,0.15)]",
    focusRing: "focus-within:border-violet-500/70 focus-within:shadow-[0_0_15px_rgba(167,139,250,0.15)]",
    greeting: "What is on your mind?",
    sub: "Brilliant Confidant — your strategic, sharp, honest companion.",
    placeholder: "Talk to me about anything — ideas, decisions, plans...",
    suggestions: [
      { title: "Think With Me", desc: "Share an idea or problem to get direct feedback.", prompt: "idea", icon: Brain },
      { title: "Give Me Advice", desc: "Discuss any decisions and work through them together.", prompt: "advice", icon: Sparkles },
      { title: "Plan My Day", desc: "State your goals to structure and prioritize your day.", prompt: "plan", icon: ArrowUpRight },
    ],
  },
};

const premiumEase = [0.16, 1, 0.3, 1];

// ─── Markdown Renderer Component ─────────────────────────────────────────────

interface MarkdownTextProps {
  content: string;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ content }) => {
  if (!content) return null;

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 font-sans text-sm text-zinc-200 select-text">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.split("\n");
          const firstLine = lines[0];
          const lang = firstLine.replace("```", "").trim() || "code";
          const code = lines.slice(1, -1).join("\n");
          
          return (
            <div key={index} className="my-3 rounded-xl overflow-hidden border border-zinc-700/55 bg-[#07080a] font-mono text-xs shadow-md">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/50 text-[10px] text-zinc-400 uppercase tracking-wider font-sans select-none">
                <span>{lang}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="hover:text-zinc-200 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800/60 font-medium"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-zinc-300 leading-relaxed font-mono">
                <code>
                  {code.split("\n").map((line, lIdx) => (
                    <div key={lIdx}>{highlightLine(line, lang)}</div>
                  ))}
                </code>
              </pre>
            </div>
          );
        } else {
          const lines = part.split("\n");
          return (
            <div key={index} className="space-y-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.trim();
                if (!cleanLine) return <div key={lIdx} className="h-1" />;

                if (cleanLine.startsWith("####")) {
                  return <h5 key={lIdx} className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mt-3">{parseInline(cleanLine.substring(4).trim())}</h5>;
                }
                if (cleanLine.startsWith("###")) {
                  return <h4 key={lIdx} className="text-sm font-semibold text-zinc-200 mt-4">{parseInline(cleanLine.substring(3).trim())}</h4>;
                }
                if (cleanLine.startsWith("##")) {
                  return <h3 key={lIdx} className="text-base font-semibold text-zinc-100 mt-5">{parseInline(cleanLine.substring(2).trim())}</h3>;
                }
                if (cleanLine.startsWith("#")) {
                  return <h2 key={lIdx} className="text-lg font-bold text-zinc-50 mt-6">{parseInline(cleanLine.substring(1).trim())}</h2>;
                }

                if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2.5 pl-2 text-zinc-300">
                      <span className="text-zinc-500 mt-1.5 shrink-0 select-none">•</span>
                      <span className="flex-grow">{parseInline(cleanLine.substring(1).trim())}</span>
                    </div>
                  );
                }

                return <p key={lIdx} className="text-zinc-300 leading-relaxed">{parseInline(cleanLine)}</p>;
              })}
            </div>
          );
        }
      })}
    </div>
  );
};

function parseInline(text: string): React.ReactNode[] {
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  return boldParts.flatMap((part, i): any[] => {
    let content: React.ReactNode = part;
    if (part.startsWith("**") && part.endsWith("**")) {
      content = <strong key={`b-${i}`} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>;
    }
    
    if (typeof content === "string") {
      const codeParts = content.split(/(`.*?`)/g);
      return codeParts.map((subPart, j) => {
        if (subPart.startsWith("`") && subPart.endsWith("`")) {
          return <code key={`c-${i}-${j}`} className="bg-zinc-900 border border-zinc-800/80 text-zinc-200 px-1.5 py-0.5 rounded font-mono text-[11px] font-medium">{subPart.slice(1, -1)}</code>;
        }
        return subPart;
      });
    }
    return [content];
  });
}

function highlightLine(line: string, lang: string): React.ReactNode {
  if (!line) return <span> </span>;
  
  if (line.trim().startsWith("#") || line.trim().startsWith("//")) {
    return <span className="text-zinc-500">{line}</span>;
  }
  
  const tokens: React.ReactNode[] = [];
  let currentIdx = 0;
  
  const regex = /(#.*|\/\/.*|["'].*?["']|\b(?:def|class|return|import|from|as|if|else|elif|for|while|try|except|finally|with|in|is|not|and|or|lambda|const|let|var|function|async|await)\b|\b(?:print|len|sum|round|float|int|str|list|dict|set|tuple|console|log|fetch|JSON|stringify|parse|map|filter)\b)/g;
  
  let match;
  while ((match = regex.exec(line)) !== null) {
    const start = match.index;
    const text = match[0];
    
    if (start > currentIdx) {
      tokens.push(line.substring(currentIdx, start));
    }
    
    if (text.startsWith("#") || text.startsWith("//")) {
      tokens.push(<span key={start} className="text-zinc-500">{text}</span>);
    } else if (text.startsWith('"') || text.startsWith("'")) {
      tokens.push(<span key={start} className="text-emerald-400 font-medium">{text}</span>);
    } else if (
      /^(def|class|return|import|from|as|if|else|elif|for|while|try|except|finally|with|in|is|not|and|or|lambda|const|let|var|function|async|await)$/.test(text)
    ) {
      tokens.push(<span key={start} className="text-blue-400 font-semibold">{text}</span>);
    } else {
      tokens.push(<span key={start} className="text-purple-400 font-medium">{text}</span>);
    }
    
    currentIdx = regex.lastIndex;
  }
  
  if (currentIdx < line.length) {
    tokens.push(line.substring(currentIdx));
  }
  
  return <span className="text-zinc-300">{tokens.length > 0 ? tokens : line}</span>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [mode, setMode] = useState<Mode>("friend");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<Message[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<ActiveArtifact>({ type: "welcome", title: "" });
  const [commandInput, setCommandInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mime: string; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [recentChats, setRecentChats] = useState<string[]>([]);
  const [editorCode, setEditorCode] = useState(
`# APEX CODE Sandbox — paste or generate code here
prices = [150.2, 152.4, 149.8, 151.1, 155.0]
avg = sum(prices) / len(prices)
print(f"5-Day Average: {avg:.2f}")`
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cfg = MODE_CONFIG[mode];
  const isDrawerOpen = activeArtifact.type !== "welcome";
  const hasHistory = history.length > 0;

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Reset welcome state when mode changes
  useEffect(() => {
    setActiveArtifact({ type: "welcome", title: "" });
    setHistory([]);
    setCommandInput("");
  }, [mode]);

  const handleTextareaScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // ── Image Handlers ──────────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) readImageFile(file);
  };
  const readImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setAttachedImage({
          base64: (ev.target.result as string).split(",")[1],
          mime: file.type,
          url: ev.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Stock Query ─────────────────────────────────────────────────────────────
  const executeStockQuery = async (ticker: string) => {
    const clean = ticker.replace("$", "").toUpperCase().trim();
    pushMsg("user", `Analyze ${clean}`);
    pushMsg("assistant", `Fetching live market data for **${clean}**...`);
    setLoading(true);
    if (!recentChats.includes(clean)) setRecentChats(p => [clean, ...p.slice(0, 5)]);
    try {
      const r = await fetch(`/api/stocks/${clean}`);
      const data = await r.json();
      setActiveArtifact({ type: "ticker", title: `${data.ticker} Diagnostics`, data });
      pushMsg("assistant",
        `**${data.prediction}** signal on **${data.name}** with **${data.confidence}%** confidence. Sentiment: **${data.sentiment_label}**.`
      );
    } catch {
      pushMsg("assistant", `[Error: Market data fetch failed for ${clean}]`);
    }
    setLoading(false);
  };

  // ── Screener ────────────────────────────────────────────────────────────────
  const loadScreener = async () => {
    setScreenerLoading(true);
    pushMsg("assistant", "Scanning Indian and US markets for top bullish picks...");
    try {
      const r = await fetch("/api/trade/screener");
      const data = await r.json();
      setActiveArtifact({ type: "screener", title: "Market Screener", screener: data });
      pushMsg("assistant", `Screener complete. Found **${data.best_picks?.length ?? 0}** bullish picks.`);
    } catch {
      pushMsg("assistant", "[Error: Screener failed to load]");
    }
    setScreenerLoading(false);
  };

  // ── Main Send ───────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!commandInput.trim() && !attachedImage) return;
    const input = commandInput.trim();
    setCommandInput("");

    // Image analysis
    if (attachedImage) {
      pushMsg("user", input || "Analyze this chart image", attachedImage.url);
      pushMsg("assistant", "Sending chart to Vision Analyst...");
      setAttachedImage(null);
      setLoading(true);
      try {
        const r = await fetch("/api/stocks/analyze_image", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: attachedImage.base64, mime_type: attachedImage.mime }),
        });
        const data = await r.json();
        setActiveArtifact({ type: "ticker", title: `${data.ticker} Vision`, data });
        pushMsg("assistant", `Vision complete. Parsed as **${data.name}**. Prediction: **${data.prediction}** (${data.confidence}%)`);
      } catch {
        pushMsg("assistant", "[Vision Error: Screenshot analysis failed]");
      }
      setLoading(false);
      return;
    }

    // Trade mode shortcuts
    if (mode === "trade") {
      const tickerMatch = input.match(/\$?([A-Z]{2,6})/);
      if (tickerMatch && (input.startsWith("$") || input.toUpperCase() === tickerMatch[1])) {
        return executeStockQuery(tickerMatch[1]);
      }
    }

    // General AI pillar call
    pushMsg("user", input);
    setLoading(true);
    const chatHistory = history.map(h => ({ role: h.role, content: h.content }));
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, history: chatHistory, mode }),
      });
      const data = await r.json();
      pushMsg("assistant", data.reply);

      if (data.code) {
        setEditorCode(data.code);
        setActiveArtifact({ type: "sandbox", title: "AI-Generated Code", code: data.code });
        if (mode === "code") {
          pushMsg("assistant", "Code loaded into sandbox — hit Run Code to execute.");
        }
      } else if (data.auto_ticker && mode === "trade") {
        executeStockQuery(data.auto_ticker);
      }
    } catch {
      pushMsg("assistant", "[Error: AI pillar query failed]");
    }
    setLoading(false);
  };

  const pushMsg = (role: "user" | "assistant", content: string, image?: string) => {
    setHistory(p => [...p, { role, content, image, mode }]);
  };

  // ── Sandbox ─────────────────────────────────────────────────────────────────
  const runSandbox = async (code: string) => {
    setLoading(true);
    try {
      const r = await fetch("/api/sandbox/run", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json();
      setActiveArtifact({ type: "sandbox", title: "Sandbox Result", code, result: data });
      if (data.success) {
        pushMsg("assistant", "Execution successful. Output below.");
      } else {
        pushMsg("assistant", `Crash on line ${data.error_line ?? "?"} — self-healing solution ready.`);
      }
    } catch {
      pushMsg("assistant", "[Sandbox Error: Runner timed out]");
    }
    setLoading(false);
  };

  const applyFix = (code: string) => {
    let count = 0;
    const chars = "01$#@^&*ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const original = code.split("\n");
    const interval = setInterval(() => {
      setEditorCode(original.map(l => l.split("").map(() => chars[Math.floor(Math.random() * chars.length)]).join("")).join("\n"));
      if (++count > 7) { clearInterval(interval); setEditorCode(code); runSandbox(code); }
    }, 70);
  };

  const clearSession = () => {
    setHistory([]);
    setActiveArtifact({ type: "welcome", title: "" });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex bg-[#0e0f11] text-[#f4f4f5] overflow-hidden relative font-sans select-none p-3 gap-3">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={{ width: 256 }} animate={{ width: isSidebarOpen ? 256 : 68 }}
        transition={{ duration: 0.4, ease: premiumEase }}
        className="h-full bg-[#17181c] border border-zinc-800 rounded-2xl flex flex-col justify-between py-4 px-3 relative z-20 shrink-0 shadow-lg"
      >
        <div className="flex flex-col space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between px-2">
            <button onClick={() => setIsSidebarOpen(v => !v)}
              className="text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-zinc-800/40 p-2 rounded-full transition-all duration-200">
              <Menu className="w-5 h-5" />
            </button>
            {isSidebarOpen && (
              <span style={{ color: cfg.color }} className="text-xs font-mono uppercase tracking-widest transition-colors duration-300">
                {cfg.label}
              </span>
            )}
          </div>

          {/* Mode Pills */}
          {isSidebarOpen ? (
            <div className="flex flex-col gap-1.5 px-1">
              {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG.code][]).map(([key, c]) => (
                <button key={key} onClick={() => setMode(key)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    mode === key
                      ? `border text-white border-zinc-700 bg-zinc-800/60 shadow-[0_0_15px_rgba(255,255,255,0.05)]`
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}>
                  <c.icon className="w-4 h-4 shrink-0" style={{ color: mode === key ? c.color : undefined }} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG.code][]).map(([key, c]) => (
                <button key={key} onClick={() => setMode(key)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    mode === key ? `border ${c.borderClass} ${c.bgClass}` : "hover:bg-zinc-800/30"
                  }`}>
                  <c.icon className="w-4.5 h-4.5" style={{ color: mode === key ? c.color : "#71717a" }} />
                </button>
              ))}
            </div>
          )}

          {/* New Chat */}
          <button onClick={clearSession}
            className={`flex items-center transition-all duration-300 rounded-full ${
              isSidebarOpen
                ? `w-full px-4 py-2.5 space-x-3 border text-xs font-medium border-zinc-700 bg-zinc-800/40 hover:bg-zinc-800/85 ${cfg.colorClass}`
                : "w-10 h-10 justify-center mx-auto border border-zinc-800"
            }`}>
            <Plus className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>New Chat</span>}
          </button>

          {/* Recent */}
          {isSidebarOpen && recentChats.length > 0 && (
            <div className="flex flex-col space-y-1 px-1">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider px-2">Recent</span>
              {recentChats.map(t => (
                <button key={t} onClick={() => mode === "trade" ? executeStockQuery(t) : null}
                  className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 py-2 px-3 rounded-lg transition-all duration-200 text-left">
                  <MessageSquare className="w-3 h-3 shrink-0" style={{ color: cfg.color + "99" }} />
                  <span className="font-mono truncate">${t}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col space-y-1">
          {[
            { icon: HelpCircle, label: "Help", action: () => alert(`Mode: ${cfg.label}\nAsk anything in this mode.`) },
            { icon: Trash2, label: "Clear", action: clearSession },
            { icon: Settings, label: "Settings", action: () => alert("Models:\n⚡ Code: Qwen 2.5 Coder 32B\n📈 Trade: DeepSeek Chat\n🧠 Friend: DeepSeek Chat") },
          ].map((item, i) => (
            <button key={i} onClick={item.action}
              className={`flex items-center text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 rounded-full transition-all duration-200 ${
                isSidebarOpen ? "px-4 py-2.5 space-x-4 w-full" : "w-10 h-10 justify-center mx-auto"
              }`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </motion.aside>

      {/* ── Main Workspace ───────────────────────────────────────────────────── */}
      <main className="flex-grow h-full flex overflow-hidden relative z-10 gap-3">

        {/* Chat Panel */}
        <section className={`h-full flex flex-col bg-[#17181c] border border-zinc-800 rounded-2xl relative z-10 transition-all duration-500 ease-in-out shadow-xl ${
          isDrawerOpen ? "w-[52%]" : "w-full"
        }`}>

          {/* Header */}
          <header className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/30 shrink-0">
            <div className="flex items-center gap-2.5">
              <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
              <span className="text-[10px] text-zinc-500 hidden sm:block">— {cfg.sub}</span>
            </div>
            {isDrawerOpen && (
              <Button onClick={() => setActiveArtifact({ type: "welcome", title: "" })}
                variant="outline" size="sm"
                className="h-7 border-zinc-700/50 hover:bg-zinc-800/60 text-xs rounded-full px-3">
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Close
              </Button>
            )}
          </header>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto px-5 py-5 space-y-5 select-text">
            <AnimatePresence mode="wait">
              {!hasHistory ? (
                <motion.div key="welcome"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5, ease: premiumEase }}
                  className="flex flex-col space-y-8 justify-center h-full max-w-2xl mx-auto pt-8">

                  {/* Greeting */}
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight text-white">
                      {cfg.greeting}
                    </h1>
                    <p className="text-sm text-zinc-500">{cfg.sub}</p>
                  </div>

                  {/* Suggestion Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {cfg.suggestions.map((card, i) => (
                      <button key={i}
                        onClick={() => {
                          if (card.prompt === "screener") { pushMsg("user", "Show me the best stocks today"); loadScreener(); }
                          else if (card.prompt === "TCS") executeStockQuery("TCS");
                          else if (card.prompt === "NVDA") executeStockQuery("NVDA");
                          else if (card.prompt === "build") { setMode("code"); setCommandInput("build me a React dashboard"); }
                          else if (card.prompt === "plan") setCommandInput("Help me plan my day");
                          else if (card.prompt === "advice") setCommandInput("I need advice on ");
                          else if (card.prompt === "idea") setCommandInput("Here's my idea: ");
                          else fileInputRef.current?.click();
                        }}
                        className={`bg-[#1e1f24] hover:bg-[#25262c] border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl flex flex-col justify-between text-left h-36 transition-all duration-300 group shadow-sm`}
                        style={{ ["--hover-border" as string]: cfg.color }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color + "40")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "")}>
                        <span className="text-sm font-medium text-zinc-200 leading-snug">{card.title}</span>
                        <div className="flex items-end justify-between w-full mt-2">
                          <span className="text-xs text-zinc-500 leading-relaxed max-w-[82%]">{card.desc}</span>
                          <div className="w-7 h-7 rounded-full border border-zinc-800/60 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:border-opacity-60"
                            style={{}} onMouseEnter={e => { const el = e.currentTarget; el.style.background = cfg.color; el.style.borderColor = cfg.color; }}
                            onMouseLeave={e => { const el = e.currentTarget; el.style.background = ""; el.style.borderColor = ""; }}>
                            <ArrowUpRight className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="space-y-5 max-w-3xl mx-auto">
                  {history.map((msg, i) => {
                    const msgCfg = MODE_CONFIG[msg.mode ?? mode];
                    return (
                      <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
                            style={{ borderColor: msgCfg.color + "40", background: msgCfg.color + "08" }}>
                            <msgCfg.icon className="w-3.5 h-3.5" style={{ color: msgCfg.color }} />
                          </div>
                        )}
                        <div className={`text-sm leading-relaxed max-w-[80%] ${
                          msg.role === "user"
                            ? "bg-[#1e1f24] border border-zinc-800 rounded-2xl rounded-tr-none px-4 py-3 shadow-sm text-zinc-100"
                            : "text-zinc-200 pl-1"
                        }`}>
                          {msg.image && <img src={msg.image} className="max-w-xs rounded-xl border border-zinc-800 mb-2 max-h-36 object-cover" />}
                          {msg.role === "user" ? (
                            <p className="whitespace-pre-line">{msg.content}</p>
                          ) : (
                            <MarkdownText content={msg.content} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
                        style={{ borderColor: cfg.color + "40", background: cfg.color + "08" }}>
                        <cfg.icon className="w-3.5 h-3.5 animate-pulse" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex gap-1 items-center pt-2">
                        {[0, 1, 2].map(j => (
                          <span key={j} className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ background: cfg.color + "80", animationDelay: `${j * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={threadEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Bar */}
          <footer className="px-5 pb-4 pt-2 shrink-0">
            <div className={`w-full bg-[#1e1f24] border border-zinc-800 rounded-full flex items-center px-5 py-3.5 gap-3 shadow-lg transition-all duration-300 focus-within:border-zinc-700 focus-within:shadow-[0_0_15px_rgba(255,255,255,0.03)]`}>
              <button onClick={() => fileInputRef.current?.click()}
                className="text-zinc-550 hover:text-zinc-350 transition-colors shrink-0">
                <Paperclip className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && readImageFile(e.target.files[0])} accept="image/*" className="hidden" />
              {attachedImage && (
                <div className="flex items-center bg-zinc-900/60 border border-zinc-750 rounded-lg px-2 py-1 gap-1.5 shrink-0 max-w-[100px]">
                  <img src={attachedImage.url} className="w-5 h-5 object-cover rounded" />
                  <button onClick={() => setAttachedImage(null)} className="text-rose-400 text-[10px] font-bold">✕</button>
                </div>
              )}
              <input type="text" value={commandInput}
                onChange={e => setCommandInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={cfg.placeholder}
                className="flex-grow bg-transparent text-sm text-zinc-200 outline-none placeholder-zinc-500 font-light"
              />
              <button onClick={handleSend} disabled={loading}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40"
                style={{ background: cfg.color + "20", border: `1px solid ${cfg.color}40` }}>
                <Send className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </button>
            </div>
            <p className="text-[9px] text-zinc-500 mt-1.5 text-center">
              Apex Intel — probabilistic analysis only. Apply strict risk management.
            </p>
          </footer>
        </section>

        {/* ── Artifact Drawer ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.section
              initial={{ width: 0, opacity: 0 }} animate={{ width: "48%", opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: premiumEase }}
              className="h-full bg-[#17181c] border border-zinc-800 rounded-2xl flex flex-col p-5 overflow-hidden shrink-0 relative z-10 shadow-xl"
            >
              {/* Stock Diagnostics */}
              {activeArtifact.type === "ticker" && activeArtifact.data && (() => {
                const d = activeArtifact.data;
                return (
                  <div className="flex-grow flex flex-col overflow-y-auto gap-4">
                    <div className="flex items-center justify-between border-b border-zinc-800/30 pb-3">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Market Diagnostics</span>
                      <span className="text-[10px] text-zinc-500 font-mono">${d.ticker}</span>
                    </div>
                    {/* Name + Signal */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-light text-zinc-100">{d.name}</h2>
                        <span className="text-xs text-zinc-500 font-mono">Price: {d.price}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs tracking-wider uppercase font-semibold ${
                        d.prediction === "BULLISH"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                      }`}>{d.prediction}</span>
                    </div>

                    {/* Confidence Ring */}
                    <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/30 rounded-2xl p-4">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Confidence Score</p>
                        <p className="text-2xl font-light text-zinc-100">{d.confidence}%</p>
                      </div>
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="rgba(255,158,0,0.08)" strokeWidth="6" fill="transparent" />
                          <circle cx="50" cy="50" r="40" stroke="#ff9e00" strokeWidth="6" fill="transparent"
                            className="radial-ring" strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * d.confidence) / 100} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-zinc-200">{d.confidence}%</span>
                      </div>
                    </div>

                    {/* Intraday Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Session High", value: d.day_high ? d.day_high.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "N/A", text: "High", color: "text-emerald-400" },
                        { label: "Session Low", value: d.day_low ? d.day_low.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "N/A", text: "Low", color: "text-rose-400" },
                        { label: "Volume", value: d.volume ? (d.volume / 1e6).toFixed(2) + "M" : "N/A", text: "Volume", color: "text-zinc-400" },
                        { label: "Market Cap", value: d.market_cap ? (d.market_cap / 1e9).toFixed(2) + "B" : "N/A", text: "Market Cap", color: "text-zinc-400" },
                      ].map((s, i) => (
                        <div key={i} className="bg-[#1e1f24] border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-zinc-400 uppercase tracking-wider">{s.label}</span>
                            <span className={`text-[10px] font-mono ${s.color}`}>{s.text}</span>
                          </div>
                          <span className="text-sm font-medium text-zinc-100 font-mono">{s.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Sentiment Bar */}
                    <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-900/40 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Sentiment Momentum</span>
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${
                          d.sentiment_label === "Euphoria" ? "text-emerald-400" : d.sentiment_label === "Panic" ? "text-rose-400" : "text-zinc-400"
                        }`}>{d.sentiment_label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <motion.div initial={{ width: "0%" }} animate={{ width: `${d.sentiment}%` }}
                          transition={{ duration: 0.9, ease: premiumEase }}
                          className={`h-full rounded-full ${d.sentiment_label === "Panic" ? "bg-rose-500" : d.sentiment_label === "Euphoria" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-500 uppercase tracking-wider mt-1.5">
                        <span>Panic</span><span>Neutral</span><span>Euphoria</span>
                      </div>
                    </div>

                    {/* 7-Day Chart */}
                    {d.history && d.history.length > 0 && (
                      <div className="border border-zinc-800/30 rounded-2xl p-4 bg-zinc-900/20">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-3">7-Day Price Trajectory</p>
                        <div className="w-full h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={d.history}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,158,0,0.04)" />
                              <XAxis dataKey="name" stroke="rgba(255,158,0,0.3)" fontSize={8} />
                              <YAxis stroke="rgba(255,158,0,0.3)" fontSize={8} domain={["auto", "auto"]} />
                              <Tooltip contentStyle={{ background: "#0c0c0e", border: "1px solid rgba(255,158,0,0.2)", fontSize: 10, borderRadius: 8 }} />
                              <Line type="monotone" dataKey="value" stroke="#ff9e00" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Screener Panel */}
              {activeArtifact.type === "screener" && activeArtifact.screener && (
                <div className="flex-grow flex flex-col overflow-y-auto gap-4 font-sans select-text">
                  <div className="flex items-center justify-between border-b border-zinc-800/30 pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Market Screener</span>
                    <button onClick={loadScreener} disabled={screenerLoading}
                      className="text-zinc-500 hover:text-amber-400 transition-colors">
                      <RefreshCw className={`w-3.5 h-3.5 ${screenerLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Top Picks — Bullish</p>
                  <div className="flex flex-col gap-2">
                    {activeArtifact.screener.best_picks.map((s, i) => (
                      <button key={i} onClick={() => executeStockQuery(s.ticker)}
                        className="flex items-center justify-between bg-[#1e1f24] hover:bg-[#25262c] border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 transition-all duration-200 text-left group shadow-sm">
                        <div>
                          <p className="text-xs font-medium text-zinc-100">{s.ticker} <span className="text-zinc-550 font-normal text-[10px]">— {s.name.slice(0, 24)}</span></p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">₹/$ {s.price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-mono font-semibold ${s.week_change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {s.week_change_pct >= 0 ? "+" : ""}{s.week_change_pct}%
                          </p>
                          <p className="text-[9px] text-zinc-500">7d change · {s.confidence.toFixed(0)}% conf</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {activeArtifact.screener.watch_out.length > 0 && (
                    <>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-2">Watch Out — Bearish</p>
                      <div className="flex flex-col gap-2">
                        {activeArtifact.screener.watch_out.map((s, i) => (
                          <button key={i} onClick={() => executeStockQuery(s.ticker)}
                            className="flex items-center justify-between bg-[#1e1f24] hover:bg-[#25262c] border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 transition-all duration-200 text-left shadow-sm">
                            <div>
                              <p className="text-xs font-medium text-zinc-100">{s.ticker} <span className="text-zinc-555 font-normal text-[10px]">— {s.name.slice(0, 24)}</span></p>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">₹/$ {s.price.toLocaleString()}</p>
                            </div>
                            <p className="text-xs font-mono font-semibold text-rose-400">
                              {s.week_change_pct}% <span className="text-[9px] text-zinc-500 font-normal">7d change</span>
                            </p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <p className="text-[9px] text-zinc-500 mt-2">Markets are volatile. Apply strict risk management. Not financial advice.</p>
                </div>
              )}

              {/* Code Sandbox */}
              {activeArtifact.type === "sandbox" && (
                <div className="flex-grow flex flex-col overflow-hidden h-full gap-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/30 pb-3 shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Python Sandbox</span>
                    <Button onClick={() => runSandbox(editorCode)} variant="default" size="sm"
                      className="h-7 bg-blue-500 hover:bg-blue-400 text-white text-xs rounded-full px-4 font-medium">
                      <Play className="w-3 h-3 mr-1" /> Run
                    </Button>
                  </div>

                  <div className="flex-grow flex flex-col gap-3 overflow-y-auto">
                    {/* Editor */}
                    <div className="h-56 border border-zinc-800/30 rounded-xl bg-zinc-950/80 flex overflow-hidden font-mono text-xs">
                      <div ref={lineNumbersRef}
                        className="w-8 select-none text-zinc-700 text-right pr-2 border-r border-zinc-800/40 leading-relaxed overflow-y-hidden py-3 pl-1">
                        {editorCode.split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
                      </div>
                      <textarea ref={textareaRef} value={editorCode}
                        onChange={e => setEditorCode(e.target.value)}
                        onScroll={handleTextareaScroll}
                        className="flex-grow bg-transparent text-zinc-300 border-none outline-none resize-none leading-relaxed pl-3 py-3 w-full h-full overflow-y-auto"
                        spellCheck={false} />
                    </div>

                    {/* Console Output */}
                    {activeArtifact.result && (
                      <div className="flex flex-col gap-3">
                        <div className="border border-zinc-800/30 rounded-xl bg-zinc-950/40 p-4">
                          <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2 border-b border-zinc-800/20 pb-1.5">Console Output</p>
                          <pre className={`font-mono text-xs overflow-x-auto leading-relaxed ${activeArtifact.result.success ? "text-zinc-300" : "text-rose-400/90"}`}>
                            {activeArtifact.result.success
                              ? activeArtifact.result.stdout || "[Success: No output]"
                              : activeArtifact.result.stderr}
                          </pre>
                        </div>

                        {activeArtifact.result.success && (
                          <div className="border border-zinc-800/30 rounded-xl p-4 bg-zinc-900/20">
                            <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-3">Output Chart</p>
                            <div className="w-full h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[{ name: "T1", value: 150 }, { name: "T2", value: 155 }, { name: "T3", value: 152 }, { name: "T4", value: 158 }, { name: "T5", value: 162 }]}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.05)" />
                                  <XAxis dataKey="name" stroke="rgba(59,130,246,0.3)" fontSize={8} />
                                  <YAxis stroke="rgba(59,130,246,0.3)" fontSize={8} domain={["auto", "auto"]} />
                                  <Tooltip contentStyle={{ background: "#0c0c0e", border: "1px solid rgba(59,130,246,0.2)", fontSize: 10, borderRadius: 8 }} />
                                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {!activeArtifact.result.success && activeArtifact.result.corrected_code && (
                          <div className="border border-blue-500/20 rounded-xl bg-zinc-950/40 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">Self-Healing Fix</span>
                              <Button onClick={() => applyFix(activeArtifact.result!.corrected_code!)}
                                variant="outline" size="sm"
                                className="h-6 border-blue-500/30 hover:bg-blue-500/10 text-blue-400 text-[10px] rounded-full px-3">
                                Auto-Repair
                              </Button>
                            </div>
                            <pre className="font-mono text-xs overflow-x-auto leading-relaxed">
                              {activeArtifact.result.corrected_code.split("\n").map((line, idx) => (
                                <div key={idx} className={idx + 1 === activeArtifact.result!.error_line ? "code-line-error-amber p-0.5" : ""}>
                                  <span className="text-zinc-700 mr-2 text-[9px] select-none">{idx + 1}</span>
                                  <span className="text-zinc-300">{line}</span>
                                </div>
                              ))}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
