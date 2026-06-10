const { useState, useEffect, useRef } = React;

// --- Minimalist Lucide Icon Component ---
const Icon = ({ name, className = "w-5 h-5", size = 20 }) => {
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [name]);
  return <i data-lucide={name} class={`${className}`} style={{ width: size, height: size }}></i>;
};

// --- macOS Boot Sequence Component ---
const BootSequence = ({ onComplete }) => {
  const [percent, setPercent] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Fluid progress bar ease to 100% over 2.8 seconds
    const start = Date.now();
    const duration = 2800;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Hardware-accelerated cubic-bezier emulation for progress step
      const t = progress;
      const easePercent = Math.round((t * t * (3 - 2 * t)) * 100);
      setPercent(easePercent);

      if (progress >= 1) {
        clearInterval(interval);
        // Cinematic dissolve fade-out over 0.8s
        setTimeout(() => {
          setFade(true);
          setTimeout(onComplete, 800);
        }, 300);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div class={`fixed inset-0 bg-black flex flex-col items-center justify-center z-50 transition-opacity duration-800 ${fade ? 'opacity-0' : 'opacity-100'}`}>
      <div class="flex flex-col items-center select-none">
        {/* Minimal caret hexagon emblem */}
        <div class="relative w-24 h-24 flex items-center justify-center">
          <svg class="absolute w-24 h-24 text-cyber-amber/20 animate-[pulse_3s_infinite]" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5">
            <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" />
          </svg>
          <span class="text-cyber-amber text-4xl font-extralight tracking-tighter glow-text-amber font-mono select-none">^</span>
        </div>
        
        {/* Sleek horizontal progress line */}
        <div class="w-48 h-[1px] bg-zinc-900 mt-10 overflow-hidden relative">
          <div 
            class="h-full bg-white transition-all duration-75"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// --- Main Application Viewport ---
const App = () => {
  const [booted, setBooted] = useState(false);
  const [workflowMode, setWorkflowMode] = useState("Deep Analytics"); // Deep Analytics vs Fast Creative
  const [history, setHistory] = useState([
    { role: "assistant", content: "APEX SYSTEM v3.4 ONLINE. Quantitative reasoning engine and unprivileged execution sandbox initialized. Ingeststock metrics using $TICKER or drop chart mockups below." }
  ]);
  const [activeArtifact, setActiveArtifact] = useState({
    type: "welcome",
    title: "System Diagnostic Ready"
  });
  
  const [commandInput, setCommandInput] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editorCode, setEditorCode] = useState(
`# Sample Python stock evaluation script
# Edit and execute within isolated container
import sys
prices = [150.2, 152.4, 149.8, 151.1, 155.0]
avg = sum(prices) / len(prices)
print(f"Computed 5-Day average: {avg:.2f}")
`
  );

  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);

  // Auto-scroll conversational thread
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  // Handle image drag & drop / copy-paste hooks
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage({
          base64: event.target.result.split(",")[1],
          mime: file.type,
          url: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagePaste = (e) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"));
    if (item) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage({
          base64: event.target.result.split(",")[1],
          mime: file.type,
          url: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const selectAttachedImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage({
          base64: event.target.result.split(",")[1],
          mime: file.type,
          url: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit bottom command input
  const handleSendCommand = async () => {
    if (!commandInput.trim() && !attachedImage) return;

    const userMsg = { role: "user", content: commandInput, image: attachedImage?.url };
    setHistory(prev => [...prev, userMsg]);
    setLoading(true);

    const input = commandInput.trim();
    setCommandInput("");
    setAttachedImage(null);

    // Stock lookup query
    const tickerMatch = input.match(/\$?([A-Za-z]{1,5})/);
    if (tickerMatch && input.toLowerCase().includes("check") || input.startsWith("$")) {
      const ticker = tickerMatch[1].toUpperCase();
      setHistory(prev => [...prev, { role: "assistant", content: `✦ Querying Quantitative Reasoning Engine for ticker \$${ticker}...` }]);
      try {
        const r = await fetch(`/api/stocks/${ticker}`);
        const data = await r.json();
        
        setActiveArtifact({
          type: "ticker",
          title: `${data.ticker} Market Probability`,
          data: data
        });
        
        setHistory(prev => [...prev, {
          role: "assistant", 
          content: `Directional prediction calculated: **${data.prediction}** with **${data.confidence}%** confidence. Sentiment momentum: **${data.sentiment_label}**.`
        }]);
      } catch (e) {
        setHistory(prev => [...prev, { role: "assistant", content: `[Connection Error: Quantitative API call failed]` }]);
      }
    } 
    // Vision screenshot analyzer query
    else if (attachedImage) {
      setHistory(prev => [...prev, { role: "assistant", content: `✦ Sending base64 chart mockup to Vision Analyst...` }]);
      try {
        const r = await fetch("/api/stocks/analyze_image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_base64: attachedImage.base64,
            mime_type: attachedImage.mime
          })
        });
        const data = await r.json();
        
        setActiveArtifact({
          type: "ticker",
          title: `${data.ticker} Vision Forecast`,
          data: data
        });
        
        setHistory(prev => [...prev, {
          role: "assistant",
          content: `Vision quantitative check complete. Mockup parsed as **${data.name}** (\$${data.ticker}). Prediction: **${data.prediction}** (${data.confidence}% confidence).`
        }]);
      } catch (e) {
        setHistory(prev => [...prev, { role: "assistant", content: `[Vision Error: Screenshot analysis failed]` }]);
      }
    }
    // Generic chat fallback
    else {
      setTimeout(() => {
        setHistory(prev => [...prev, { role: "assistant", content: "Sandbox diagnostic complete. Write Python scripts on the right pane or check stocks with $TICKER (e.g. check $AAPL)." }]);
      }, 1000);
    }

    setLoading(false);
  };

  // Python execution console trigger
  const runSandboxScript = async (codeToRun) => {
    setLoading(true);
    try {
      const r = await fetch("/api/sandbox/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToRun })
      });
      const data = await r.json();
      
      setActiveArtifact({
        type: "sandbox",
        title: "Sandbox Run Metrics",
        code: codeToRun,
        result: data
      });
      
      if (data.success) {
        setHistory(prev => [...prev, { role: "assistant", content: "Sandbox execution completed successfully. Metrics printed to display canvas." }]);
      } else {
        setHistory(prev => [...prev, { role: "assistant", content: `⚠️ sandbox crash on line ${data.error_line || 'unknown'}: ${data.stderr ? data.stderr.trim().split('\n').pop() : 'Compile error'}` }]);
      }

    } catch (e) {
      setHistory(prev => [...prev, { role: "assistant", content: "[Connection Error: Subprocess sandbox runner timed out]" }]);
    }
    setLoading(false);
  };

  // Text scrambling morph animation on self-healing diff injection
  const applySolutionAndReRun = (correctedCode) => {
    let count = 0;
    const chars = "010101$_#@^&*ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const originalLines = correctedCode.split("\n");
    
    const interval = setInterval(() => {
      const scrambled = originalLines.map(line => {
        return line.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
      }).join('\n');
      setEditorCode(scrambled);
      count++;
      
      if (count > 7) {
        clearInterval(interval);
        setEditorCode(correctedCode);
        runSandboxScript(correctedCode);
      }
    }, 70);
  };

  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />;
  }

  return (
    <div class="w-full h-full flex flex-col p-4 relative z-10 transition-all duration-700 ease-[var(--ease-premium)]">
      
      {/* 1. Sleek Top-Bar Toggle Header */}
      <header class="flex items-center justify-between border-b border-amber-500/10 pb-4 mb-4 select-none">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6 text-cyber-amber" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5">
            <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" />
          </svg>
          <span class="text-lg font-light tracking-widest text-[#ff9e00] glow-text-amber uppercase">Apex Intel</span>
        </div>
        
        {/* Grok Toggles */}
        <div class="flex bg-zinc-950/80 border border-amber-500/10 rounded-lg p-[3px] select-none">
          {["Deep Analytics", "Fast Creative"].map((mode) => (
            <button
              key={mode}
              onClick={() => setWorkflowMode(mode)}
              class={`px-4 py-1.5 rounded-md text-xs tracking-wider transition-all duration-300 ${workflowMode === mode ? 'bg-cyber-amber text-black font-medium' : 'text-zinc-400 hover:text-zinc-100'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </header>

      {/* 2. Primary Split Viewport Layout */}
      <main class="flex-grow w-full flex space-x-4 mb-24 overflow-hidden">
        
        {/* Left Pane: Chat Thread history */}
        <section class="w-[45%] glass-panel flex flex-col p-4 overflow-hidden relative">
          <div class="flex items-center space-x-2 border-b border-amber-500/10 pb-2 mb-3">
            <Icon name="message-square" className="text-cyber-amber" size={16} />
            <span class="text-xs tracking-widest text-zinc-400 uppercase">Conversational Thread</span>
          </div>
          
          <div class="flex-grow overflow-y-auto space-y-4 pr-2 select-text">
            {history.map((msg, index) => (
              <div 
                key={index} 
                class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.5s_var(--ease-premium)]`}
              >
                <div class={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed border ${
                  msg.role === 'user' 
                    ? 'bg-zinc-900/40 border-amber-500/20 text-zinc-200' 
                    : 'bg-zinc-950/20 border-zinc-900 text-zinc-300'
                }`}>
                  {msg.image && (
                    <img src={msg.image} class="max-w-xs rounded border border-amber-500/20 mb-2 max-h-36 object-cover" />
                  )}
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={threadEndRef}></div>
          </div>
        </section>

        {/* Right Pane: Artifact Display Canvas */}
        <section class="w-[55%] glass-panel flex flex-col p-4 overflow-hidden relative">
          
          {/* Welcome Diagnostic Screen */}
          {activeArtifact.type === "welcome" && (
            <div class="flex-grow flex flex-col items-center justify-center text-center p-6 select-none">
              <Icon name="cpu" className="text-cyber-amber w-12 h-12 mb-4 animate-[pulse_3s_infinite]" size={48} />
              <h2 class="text-lg font-light tracking-widest uppercase text-cyber-amber glow-text-amber mb-2">Diagnostic Core</h2>
              <p class="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
                Apex terminal is fully operational. Type `$AAPL` or `$NVDA` into the bottom palette to evaluate stocks, or trigger calculations in the sandbox.
              </p>
              <button 
                onClick={() => setActiveArtifact({ type: "sandbox", title: "Active Python Sandbox" })}
                class="px-5 py-2 border border-cyber-amber/20 hover:border-cyber-amber/50 rounded text-xs tracking-widest uppercase text-cyber-amber transition-colors duration-300"
              >
                Activate Code Sandbox
              </button>
            </div>
          )}

          {/* Stock Prediction Probability display */}
          {activeArtifact.type === "ticker" && (
            <div class="flex-grow flex flex-col p-4 select-none overflow-y-auto">
              <div class="flex items-center justify-between border-b border-amber-500/10 pb-3 mb-6">
                <span class="text-sm font-light uppercase tracking-widest text-cyber-amber glow-text-amber">{activeArtifact.title}</span>
                <span class="text-xs text-zinc-400 font-mono">${activeArtifact.data.ticker}</span>
              </div>
              
              <div class="flex items-center space-x-8 mb-8">
                {/* Big Direction Card */}
                <div class={`flex-grow p-6 rounded-lg border flex flex-col items-center justify-center ${
                  activeArtifact.data.prediction === 'BULLISH'
                    ? 'bg-cyber-gold/5 border-cyber-gold/20'
                    : 'bg-cyber-rust/5 border-cyber-rust/20'
                }`}>
                  <span class="text-xs text-zinc-500 uppercase tracking-widest mb-1">Calculated Direction</span>
                  <span class={`text-4xl font-light tracking-widest ${
                    activeArtifact.data.prediction === 'BULLISH' ? 'text-cyber-gold glow-text-gold' : 'text-cyber-rust glow-text-rust'
                  }`}>
                    {activeArtifact.data.prediction}
                  </span>
                </div>

                {/* Radial Probability Circle */}
                <div class="relative w-32 h-32 flex items-center justify-center">
                  <svg class="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="rgba(255,158,0,0.08)" stroke-width="4" fill="transparent" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="#ff9e00" stroke-width="4" 
                      fill="transparent" 
                      class="radial-ring"
                      stroke-dasharray={251.2}
                      stroke-dashoffset={251.2 - (251.2 * activeArtifact.data.confidence) / 100}
                    />
                  </svg>
                  <div class="absolute flex flex-col items-center justify-center">
                    <span class="text-xl font-light text-zinc-100">{activeArtifact.data.confidence}%</span>
                    <span class="text-[9px] text-zinc-500 uppercase tracking-widest">Conf</span>
                  </div>
                </div>
              </div>

              {/* Sentiment momentum bar dial */}
              <div class="border border-amber-500/10 rounded-lg p-5 bg-zinc-950/20 mb-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs text-zinc-400 uppercase tracking-widest">Sentiment Momentum</span>
                  <span class={`text-xs uppercase font-mono tracking-widest ${
                    activeArtifact.data.sentiment_label === 'Euphoria' ? 'text-cyber-gold' : activeArtifact.data.sentiment_label === 'Panic' ? 'text-cyber-rust' : 'text-zinc-400'
                  }`}>
                    {activeArtifact.data.sentiment_label}
                  </span>
                </div>
                {/* Horizontal slider bar transition */}
                <div class="w-full h-2 bg-zinc-900 rounded overflow-hidden relative">
                  <div 
                    class={`h-full transition-all duration-700 ease-[var(--ease-premium)] ${
                      activeArtifact.data.sentiment_label === 'Panic' ? 'bg-cyber-rust' : activeArtifact.data.sentiment_label === 'Euphoria' ? 'bg-cyber-gold' : 'bg-cyber-amber'
                    }`}
                    style={{ width: `${activeArtifact.data.sentiment}%` }}
                  ></div>
                </div>
                <div class="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest mt-2">
                  <span>Panic</span>
                  <span>Neutral</span>
                  <span>Euphoria</span>
                </div>
              </div>
            </div>
          )}

          {/* Code Execution Sandbox displays */}
          {activeArtifact.type === "sandbox" && (
            <div class="flex-grow flex flex-col overflow-hidden h-full">
              <div class="flex items-center justify-between border-b border-amber-500/10 pb-3 mb-4 select-none">
                <span class="text-sm font-light uppercase tracking-widest text-cyber-amber glow-text-amber">{activeArtifact.title}</span>
                <button
                  onClick={() => runSandboxScript(editorCode)}
                  class="px-4 py-1.5 bg-cyber-amber hover:bg-amber-600 rounded text-black text-xs font-medium uppercase tracking-wider transition-colors duration-300"
                >
                  Execute Script
                </button>
              </div>

              {/* Code Edit Window */}
              <div class="flex-grow flex flex-col space-y-4 overflow-y-auto pr-1">
                <div class="h-48 border border-amber-500/10 rounded bg-zinc-950/80 p-3 overflow-y-auto">
                  <textarea
                    value={editorCode}
                    onChange={(e) => setEditorCode(e.target.value)}
                    class="w-full h-full bg-transparent text-zinc-200 border-none outline-none font-mono text-xs resize-none code-editor-line leading-relaxed"
                    spellcheck="false"
                  />
                </div>

                {/* Output Screen */}
                {activeArtifact.result && (
                  <div class="flex-col flex space-y-4">
                    {/* Console Print Out */}
                    <div class="border border-amber-500/10 rounded bg-black/40 p-4">
                      <div class="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 border-b border-amber-500/5 pb-1 select-none">Stdout output</div>
                      <pre class="font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                        {activeArtifact.result.success 
                          ? activeArtifact.result.stdout || "[Executed clean, empty stdout]" 
                          : activeArtifact.result.stderr}
                      </pre>
                    </div>

                    {/* Chart visual display output */}
                    {activeArtifact.result.visualization_url && (
                      <div class="border border-amber-500/10 rounded p-2 bg-black/20 flex flex-col items-center">
                        <img src={activeArtifact.result.visualization_url} class="max-h-64 rounded object-contain border border-amber-500/10" />
                      </div>
                    )}

                    {/* Diff Healing Code Block (If crashed) */}
                    {!activeArtifact.result.success && activeArtifact.result.corrected_code && (
                      <div class="border border-cyber-amber/20 rounded bg-zinc-950/40 p-4 relative overflow-hidden">
                        <div class="flex items-center justify-between border-b border-amber-500/10 pb-2 mb-3 select-none">
                          <span class="text-xs text-cyber-amber glow-text-amber uppercase tracking-widest">Self-Healing correction proposed</span>
                          <button
                            onClick={() => applySolutionAndReRun(activeArtifact.result.corrected_code)}
                            class="px-3 py-1 border border-cyber-amber/30 hover:border-cyber-amber text-cyber-amber rounded text-xs font-light tracking-widest uppercase transition-all duration-300"
                          >
                            Apply Solution
                          </button>
                        </div>
                        <pre class="font-mono text-xs overflow-x-auto leading-relaxed select-text">
                          {activeArtifact.result.corrected_code.split("\n").map((line, idx) => {
                            const isErr = idx + 1 === activeArtifact.result.error_line;
                            return (
                              <div key={idx} class={`${isErr ? 'code-line-error-amber p-[2px]' : ''}`}>
                                <span class="text-zinc-600 mr-2 text-[10px] select-none">{idx + 1}</span>
                                <span class="text-zinc-300">{line}</span>
                              </div>
                            );
                          })}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 3. Floating Pill Command Input Bar */}
      <footer class="fixed bottom-6 left-0 right-0 flex justify-center z-20 px-4 select-none">
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onPaste={handleImagePaste}
          class="w-full max-w-xl command-palette rounded-full flex items-center px-4 py-2 relative"
        >
          {/* File Attachment Icon */}
          <button 
            onClick={() => fileInputRef.current.click()}
            class="text-zinc-400 hover:text-cyber-amber transition-colors duration-300 p-1 mr-2"
          >
            <Icon name="paperclip" size={18} />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={selectAttachedImage} 
            accept="image/*" 
            class="hidden" 
          />

          {/* Attached image preview */}
          {attachedImage && (
            <div class="relative flex items-center bg-zinc-900 border border-amber-500/20 rounded px-2 py-1 mr-2 max-w-[100px]">
              <img src={attachedImage.url} class="w-6 h-6 object-cover rounded mr-1" />
              <button 
                onClick={() => setAttachedImage(null)}
                class="text-cyber-rust text-[9px] font-bold p-[2px]"
              >
                X
              </button>
            </div>
          )}

          {/* Command Input field */}
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
            placeholder="Evaluate ticker ($AAPL) or type calculations..."
            class="flex-grow bg-transparent text-sm text-zinc-100 outline-none placeholder-zinc-500 font-light pr-4"
          />

          {/* Send Action Trigger */}
          <button
            onClick={handleSendCommand}
            class="text-cyber-amber glow-text-amber hover:text-amber-400 p-1.5 transition-colors duration-300"
          >
            <Icon name="send" size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
};

// --- Mount Application Element ---
ReactDOM.render(<App />, document.getElementById("root"));
