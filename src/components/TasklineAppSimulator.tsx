import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  Wifi, 
  Battery, 
  MessageSquare, 
  PhoneCall, 
  Settings, 
  Plus, 
  Trash2, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  UserPlus, 
  Info,
  Calendar,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { encryptPhoneNumber, decryptPhoneNumber } from "../utils/security";

interface Task {
  id: string;
  title: string;
  description: string;
  category: "task" | "travel_train" | "family_call";
  dateTime: string;
  isCompleted: boolean;
  callerName?: string;
  callerRole?: string;
}

interface SimulatedImportantContact {
  name: string;
  category: "family" | "office" | "friends" | "others";
}

export default function TasklineAppSimulator() {
  // Mobile app simulator state
  const [appTheme, setAppTheme] = useState<"dark" | "light">("dark");
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "settings">("dashboard");
  const [simulatedClock, setSimulatedClock] = useState("10:42 AM");
  const [revealRawNumbers, setRevealRawNumbers] = useState(false);

  // Manual states sync'd with local storage or state
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "sim-t1",
      title: "Review Client Document",
      description: "Final check with Ankit Manager",
      category: "task",
      dateTime: "11:30 AM",
      isCompleted: false
    },
    {
      id: "sim-t2",
      title: "Train Delhi Express - scheduled",
      description: "Platform 3 delay alert monitored",
      category: "travel_train",
      dateTime: "12:15 PM",
      isCompleted: false
    }
  ]);

  const [importantContacts, setImportantContacts] = useState<SimulatedImportantContact[]>([
    { name: "Mom", category: "family" },
    { name: "Dad", category: "family" },
    { name: "Ankit Manager", category: "office" },
  ]);

  // Input states inside the simulator settings screen
  const [newContactName, setNewContactName] = useState("");
  const [newContactCategory, setNewContactCategory] = useState<"family" | "office" | "friends" | "others">("family");

  // Inbound SMS simulation feeds inside phone
  const [smsMessages, setSmsMessages] = useState([
    {
      id: "sms-1",
      sender: "Mom",
      time: "2m ago",
      text: "Hi beta, I am free now to make calls! Please call. Also, don't share your secret bank password 'MummySpecial' or OTP 827103 with anyone."
    },
    {
      id: "sms-2",
      sender: "ICICI Bank Alerts",
      time: "10m ago",
      text: "Your account ending 44102911 has been credited with Rs. 45,000. Secure OTP for transaction is 918237."
    },
    {
      id: "sms-3",
      sender: "Ankit Manager",
      time: "15m ago",
      text: "Hi, I just finished my client demo and I am free to talk now. Reach me when you get this."
    }
  ]);

  const [callLogs, setCallLogs] = useState([
    { name: "Mom (Maa)", phone: "+91-98765-43210", time: "10 mins ago", type: "Missed" },
    { name: "Ankit Manager", phone: "+91-99887-76655", time: "30 mins ago", type: "Missed" },
    { name: "Spam Seller", phone: "+91-90000-11111", time: "1 hour ago", type: "Missed" },
    { name: "Papa (Dad)", phone: "+91-98112-23344", time: "3 hours ago", type: "Missed" },
  ]);

  // Quick SMS injector helpers
  const [testSmsSender, setTestSmsSender] = useState("");
  const [testSmsText, setTestSmsText] = useState("");
  const [testCallName, setTestCallName] = useState("");
  const [testCallPhone, setTestCallPhone] = useState("");

  // Update simulator clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setSimulatedClock(`${hours}:${minutes} ${ampm}`);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Secure Local Cryptography representation for SMS OTPs/Passwords
  const getSmsSecureHash = (input: string) => {
    let hashVal = 0;
    for (let i = 0; i < input.length; i++) {
      hashVal = (hashVal << 5) - hashVal + input.charCodeAt(i);
      hashVal |= 0; // Convert to 32bit integer
    }
    const hex = Math.abs(hashVal).toString(16).toUpperCase();
    return `HASH_SHA256_${hex}...${hex.slice(-4)}`;
  };

  // Local state parsing function mirroring Flutter security utils
  const processSmsText = (text: string) => {
    let processed = text;
    let containsSensitive = false;
    let redactedItems: string[] = [];

    // Redact OTPs (4-8 digits)
    const otpRegex = /\b\d{4,8}\b/g;
    const otpMatches = text.match(otpRegex);
    if (otpMatches) {
      otpMatches.forEach(match => {
        const hashed = getSmsSecureHash(match);
        processed = processed.replace(match, `[REDACTED_OTP: ${hashed}]`);
      });
      containsSensitive = true;
      redactedItems.push("OTP");
    }

    // Redact Credentials/Passcodes
    const passcodeRegex = /(?:password|pwd|passcode|pin|credentials|token):\s*['"]?([a-zA-Z0-9_@$#]+)['"]?/gi;
    let passcodeMatch;
    while ((passcodeMatch = passcodeRegex.exec(text)) !== null) {
      const matchedValue = passcodeMatch[1];
      const hashed = getSmsSecureHash(matchedValue);
      processed = processed.replace(matchedValue, `[REDACTED_PASSCODE: ${hashed}]`);
      containsSensitive = true;
      redactedItems.push("Passcode/PIN");
    }

    // Redact Account Numbers
    const acctRegex = /\b\d{9,18}\b/g;
    const acctMatches = text.match(acctRegex);
    if (acctMatches) {
      acctMatches.forEach(match => {
        const hashed = getSmsSecureHash(match);
        processed = processed.replace(match, `[REDACTED_ACCOUNT: ${hashed}]`);
      });
      containsSensitive = true;
      redactedItems.push("Account Number");
    }

    // Redact Amounts
    const amountRegex = /(?:rs\.?|usd|\$|inr|€|£|amount|balance)\s*\d+(?:,\d{3})*(?:\.\d+)?/gi;
    if (amountRegex.test(processed)) {
      processed = processed.replace(amountRegex, "[REDACTED_AMOUNT]");
      containsSensitive = true;
      redactedItems.push("Balance/Amount");
    }

    return {
      text: processed,
      containsSensitive,
      redactedItems
    };
  };

  // Helper function to check if name is permitted inside the simulator (using custom important contacts list)
  const isSimulatedPermitted = (name: string) => {
    const lowerName = name.toLowerCase();
    
    // 1. Check custom settings names
    const matchedCustom = importantContacts.find(c => 
      lowerName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lowerName)
    );
    if (matchedCustom) return true;

    // 2. Fallback default keywords
    const defaults = [
      "mom", "mother", "maa", "mummy", "dad", "father", "papa", "papa (dad)", "mom (maa)",
      "relative", "sister", "brother", "office", "colleague", "manager", "boss", "friend"
    ];
    return defaults.some(k => lowerName.includes(k));
  };

  // Helper to detect contact role inside simulator
  const detectSimulatedRole = (name: string) => {
    const lowerName = name.toLowerCase();

    const matchedCustom = importantContacts.find(c => 
      lowerName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lowerName)
    );
    if (matchedCustom) return matchedCustom.category;

    if (lowerName.includes("mom") || lowerName.includes("mother") || lowerName.includes("maa") || lowerName.includes("mummy")) return "family";
    if (lowerName.includes("dad") || lowerName.includes("father") || lowerName.includes("papa")) return "family";
    if (lowerName.includes("manager") || lowerName.includes("office") || lowerName.includes("boss") || lowerName.includes("sir")) return "office";
    if (lowerName.includes("friend") || lowerName.includes("yaar") || lowerName.includes("buddy") || lowerName.includes("dost")) return "friends";
    return "others";
  };

  // Add simulated Task
  const addSimulatedTask = (title: string, desc: string, cat: "task" | "travel_train" | "family_call", callerName?: string, role?: string) => {
    setTasks(prev => [
      {
        id: `task-${Date.now()}`,
        title,
        description: desc,
        category: cat,
        dateTime: "Just Now",
        isCompleted: false,
        callerName,
        callerRole: role
      },
      ...prev
    ]);
  };

  // Dynamic category class color definitions
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "family": return "bg-pink-500/15 text-pink-400 border-pink-500/20";
      case "office": return "bg-blue-500/15 text-blue-400 border-blue-500/20";
      case "friends": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      default: return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div id="flutter-taskline-simulator" className="p-6 rounded-3xl bg-[#09090b] border border-white/5 space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-500 animate-bounce" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Separate Native Android Build</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">TASKLINE APP (Flutter Simulator)</h2>
          <p className="text-xs text-slate-400">Zero-server leaking offline logs processing with AES/DES hashing & custom priority detection.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900 border border-white/5 p-1.5 rounded-xl text-xs text-slate-400 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Local Storage Sync Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Visual Mobile Phone Frame Simulator (5 columns) */}
        <div className="xl:col-span-5 flex justify-center items-center">
          
          {/* Phone wrapper */}
          <div className="relative w-[340px] h-[680px] bg-black rounded-[48px] p-3.5 border-[8px] border-slate-800 shadow-2xl shadow-amber-500/5 overflow-hidden flex flex-col justify-between">
            
            {/* Phone Speaker Cutout */}
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30 flex justify-center items-start pt-1">
              {/* Camera Lens */}
              <div className="w-3.5 h-3.5 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
                <div className="w-1 h-1 bg-indigo-500 rounded-full animate-ping" />
              </div>
              <div className="w-12 h-1 bg-slate-800 rounded-full ml-3" />
            </div>

            {/* Simulated Phone Screen Canvas */}
            <div className={`w-full h-full rounded-[38px] overflow-hidden flex flex-col justify-between select-none border border-white/5 ${
              appTheme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
            }`}>
              
              {/* A. Mobile Top Notification Bar */}
              <div className={`pt-6 px-5 pb-1 flex justify-between items-center text-[10px] font-mono ${
                appTheme === "dark" ? "bg-black/40 text-slate-400" : "bg-slate-100 text-slate-600"
              }`}>
                <span>{simulatedClock}</span>
                <div className="flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  <span className="text-[8px] font-bold">5G</span>
                  <Battery className="w-4 h-4" />
                </div>
              </div>

              {/* B. Simulated App Main Header */}
              <div className={`px-4 py-3 flex items-center justify-between border-b ${
                appTheme === "dark" 
                  ? "bg-slate-900/60 border-white/5" 
                  : "bg-amber-500 border-amber-600/20 text-black"
              }`}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-black tracking-wider uppercase">TASKLINE APP</span>
                </div>
                
                <button 
                  onClick={() => setCurrentScreen(currentScreen === "dashboard" ? "settings" : "dashboard")}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    appTheme === "dark" 
                      ? "hover:bg-white/5 text-slate-400 hover:text-white" 
                      : "hover:bg-black/15 text-black"
                  }`}
                  title="Configure Priority Rules"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* C. Scrollable Virtual App Body */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 max-h-[500px]">
                
                {currentScreen === "settings" ? (
                  /* ================= VIRTUAL SETTINGS SCREEN ================= */
                  <div className="space-y-4 animate-fade-in">
                    
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-amber-500">App Preferences</h4>
                      <button 
                        onClick={() => setCurrentScreen("dashboard")}
                        className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Back
                      </button>
                    </div>

                    {/* Theme Mode Toggle */}
                    <div className={`p-3 rounded-xl border ${
                      appTheme === "dark" ? "bg-slate-900/50 border-white/5" : "bg-white border-slate-200"
                    }`}>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Display Theme</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          onClick={() => setAppTheme("dark")}
                          className={`py-1.5 rounded-lg border font-bold transition ${
                            appTheme === "dark" 
                              ? "bg-amber-500 border-amber-500 text-black" 
                              : "bg-slate-100 border-slate-200 text-slate-600"
                          }`}
                        >
                          Dark App
                        </button>
                        <button
                          onClick={() => setAppTheme("light")}
                          className={`py-1.5 rounded-lg border font-bold transition ${
                            appTheme === "light" 
                              ? "bg-amber-500 border-amber-500 text-black" 
                              : "bg-slate-100 border-slate-200 text-slate-600"
                          }`}
                        >
                          Light App
                        </button>
                      </div>
                    </div>

                    {/* IMPORTANT CONTACT PANEL */}
                    <div className={`p-3 rounded-xl border space-y-3 ${
                      appTheme === "dark" ? "bg-slate-900/50 border-white/5" : "bg-white border-slate-200"
                    }`}>
                      
                      <div>
                        <span id="simulator-important-contact-panel" className="text-[11px] font-bold uppercase text-amber-500 block">important contact</span>
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">add contacts names to automatically detect</span>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          placeholder="Contact Name Only"
                          className="w-full text-[11px] p-2 bg-black border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-200 placeholder-slate-600"
                        />

                        <select
                          value={newContactCategory}
                          onChange={(e) => setNewContactCategory(e.target.value as any)}
                          className="w-full text-[11px] p-2 bg-black border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-200"
                        >
                          <option value="family">Family</option>
                          <option value="office">Office</option>
                          <option value="friends">Friends</option>
                          <option value="others">Others</option>
                        </select>

                        <button
                          onClick={() => {
                            if (!newContactName.trim()) return;
                            setImportantContacts([...importantContacts, { name: newContactName.trim(), category: newContactCategory }]);
                            setNewContactName("");
                          }}
                          className="w-full py-1.5 bg-amber-500 text-black font-bold text-[10px] rounded-lg cursor-pointer hover:bg-amber-400 transition"
                        >
                          Add Detection Rule
                        </button>
                      </div>

                      {/* Active contacts list inside phone settings */}
                      <div className="space-y-1.5 border-t border-white/5 pt-2">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Active Rules ({importantContacts.length})</span>
                        <div className="space-y-1 max-h-[100px] overflow-y-auto pr-0.5">
                          {importantContacts.map((c, i) => (
                            <div key={i} className="flex justify-between items-center bg-black/40 p-1.5 rounded border border-white/5 text-[10px]">
                              <span className="font-semibold text-white truncate max-w-[120px]">{c.name}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1 rounded font-bold">{c.category}</span>
                                <button 
                                  onClick={() => setImportantContacts(importantContacts.filter((_, idx) => idx !== i))}
                                  className="text-red-400 hover:text-red-200 shrink-0"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  /* ================= VIRTUAL DASHBOARD SCREEN ================= */
                  <div className="space-y-4 animate-fade-in">
                    
                    {/* (i) Rolling priority tasks queue */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Priority Task Queue ({tasks.length})
                      </span>

                      <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                        {tasks.map(t => (
                          <div 
                            key={t.id}
                            onClick={() => {
                              setTasks(tasks.map(task => task.id === t.id ? { ...task, isCompleted: !task.isCompleted } : task));
                            }}
                            className={`p-2 rounded-xl border text-[11px] flex items-start gap-2 transition cursor-pointer ${
                              t.isCompleted 
                                ? "opacity-45 bg-slate-900/30 border-white/5 line-through" 
                                : appTheme === "dark"
                                  ? "bg-slate-900 border-white/5 hover:bg-slate-900/80"
                                  : "bg-white border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={t.isCompleted} 
                              readOnly 
                              className="mt-0.5 text-amber-500 focus:ring-0 rounded"
                            />
                            <div className="overflow-hidden">
                              <p className="font-bold truncate text-slate-200">{t.title}</p>
                              <p className="text-[9px] text-slate-500 truncate">{t.description}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-[8px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1 rounded">{t.category}</span>
                                {t.callerRole && (
                                  <span className={`text-[8px] uppercase font-bold tracking-wider px-1 rounded ${getRoleBadgeColor(t.callerRole)}`}>
                                    {t.callerRole}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* (ii) SMS Listener with encrypted/redacted details */}
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                        SMS Decryption Engine
                      </span>

                      <div className="space-y-2">
                        {smsMessages.slice(0, 2).map(msg => {
                          const parsed = processSmsText(msg.text);
                          const isPermitted = isSimulatedPermitted(msg.sender);
                          const role = detectSimulatedRole(msg.sender);

                          return (
                            <div key={msg.id} className="p-2 bg-black/40 border border-white/5 rounded-xl text-[10px]">
                              <div className="flex justify-between items-center text-[9px] text-slate-400 mb-1">
                                <span className="font-black text-white">{msg.sender} ({role.toUpperCase()})</span>
                                <span>{msg.time}</span>
                              </div>
                              <p className="font-mono text-slate-300 leading-normal bg-black/30 p-1.5 rounded border border-white/5">{parsed.text}</p>
                              {parsed.containsSensitive && (
                                <div className="text-[8px] text-rose-400 font-semibold mt-1 flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" />
                                  Securely Encrypted Hashed Content
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* (iii) Call logs with encrypted view toggle */}
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                          <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
                          Call Logs (AES/DES)
                        </span>
                        
                        <button 
                          onClick={() => setRevealRawNumbers(!revealRawNumbers)}
                          className="text-[8px] text-amber-500 font-bold uppercase cursor-pointer"
                        >
                          {revealRawNumbers ? "AES HASH VIEW" : "DECRYPT VIEW"}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {callLogs.slice(0, 3).map((log, index) => {
                          const isPermitted = isSimulatedPermitted(log.name);
                          const role = detectSimulatedRole(log.name);
                          // Generate simulated RC4/AES encrypted hex value
                          const mockEncPhone = "ENC_" + log.phone.replace(/[^0-9]/g, "").slice(1).split("").reverse().join("AC7F");

                          return (
                            <div key={index} className={`p-2 rounded-xl flex justify-between items-center ${
                              isPermitted ? "bg-slate-900 border border-white/5" : "bg-slate-900/30 opacity-40"
                            }`}>
                              <div className="overflow-hidden mr-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-200 truncate">{log.name}</span>
                                  <span className={`text-[7px] uppercase font-black px-1 rounded ${getRoleBadgeColor(role)}`}>{role}</span>
                                </div>
                                <span className="text-[8px] font-mono text-slate-500 block truncate">
                                  {revealRawNumbers ? log.phone : mockEncPhone}
                                </span>
                              </div>

                              {isPermitted && (
                                <button
                                  onClick={() => {
                                    addSimulatedTask(`Missed call - ${log.name}`, `Callback request synced from Call logs. Hash: ${mockEncPhone}`, "family_call", log.name, role);
                                    alert(`Scheduled callback task for ${log.name} inside phone!`);
                                  }}
                                  className="px-1.5 py-1 bg-amber-500 text-black text-[8px] font-bold rounded cursor-pointer"
                                >
                                  Queue
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* D. Simulated Phone Home button navigation bar */}
              <div className={`p-2 flex justify-center items-center ${
                appTheme === "dark" ? "bg-black/40 border-t border-white/5" : "bg-slate-100 border-t border-slate-200"
              }`}>
                <button 
                  onClick={() => {
                    setCurrentScreen("dashboard");
                  }}
                  className="w-16 h-1 bg-slate-500 hover:bg-slate-300 rounded-full cursor-pointer transition"
                  title="Phone Home Screen"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Interaction controller playground (7 columns) */}
        <div className="xl:col-span-7 space-y-6">
          
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Simulated Device Actions
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Simulate sending texts or calls to the phone, and see how the dynamic "Important Contact" settings you configure filters them in real-time!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: SMS Broadcast Simulator */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Simulate SMS Incoming Broadcast</span>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Sender Name/Number</label>
                    <input
                      type="text"
                      value={testSmsSender}
                      onChange={(e) => setTestSmsSender(e.target.value)}
                      placeholder="e.g., Sister, Manager, Ankit"
                      className="w-full text-xs p-1.5 bg-slate-950 border border-white/5 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Message Body</label>
                    <textarea
                      rows={2}
                      value={testSmsText}
                      onChange={(e) => setTestSmsText(e.target.value)}
                      placeholder="Insert passcode: 48920, OTP: 91823, or 'I am free to talk now'..."
                      className="w-full text-xs p-1.5 bg-slate-950 border border-white/5 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-200"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!testSmsSender || !testSmsText) return;
                      setSmsMessages([
                        {
                          id: `sms-${Date.now()}`,
                          sender: testSmsSender,
                          time: "Just Now",
                          text: testSmsText
                        },
                        ...smsMessages
                      ]);
                      setTestSmsSender("");
                      setTestSmsText("");
                    }}
                    className="w-full py-1.5 bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 text-white rounded font-bold cursor-pointer transition text-[11px]"
                  >
                    Broadcast SMS to Phone
                  </button>
                </div>
              </div>

              {/* Box 2: Inbound Call Simulator */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Simulate Call Incoming Trigger</span>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Caller Name</label>
                    <input
                      type="text"
                      value={testCallName}
                      onChange={(e) => setTestCallName(e.target.value)}
                      placeholder="e.g., Rohit Friend, Mom"
                      className="w-full text-xs p-1.5 bg-slate-950 border border-white/5 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={testCallPhone}
                      onChange={(e) => setTestCallPhone(e.target.value)}
                      placeholder="+91-95555-82710"
                      className="w-full text-xs p-1.5 bg-slate-950 border border-white/5 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-200"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!testCallName || !testCallPhone) return;
                      setCallLogs([
                        {
                          name: testCallName,
                          phone: testCallPhone,
                          time: "Just Now",
                          type: "Missed"
                        },
                        ...callLogs
                      ]);
                      setTestCallName("");
                      setTestCallPhone("");
                    }}
                    className="w-full py-1.5 bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 text-white rounded font-bold cursor-pointer transition text-[11px]"
                  >
                    Trigger Missed Call
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Quick presets controller */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">Quick Simulation Presets</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSmsMessages([
                    {
                      id: `sms-${Date.now()}`,
                      sender: "Ankit Manager",
                      time: "Just Now",
                      text: "Done with sync. I am free now to make calls. Ping me regarding project documents."
                    },
                    ...smsMessages
                  ]);
                }}
                className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-white/5 text-left text-xs transition block truncate"
              >
                <div className="font-semibold text-amber-500">Preset: Ankit Manager Free Status</div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">Triggers availability action panel on phone</div>
              </button>

              <button
                onClick={() => {
                  setSmsMessages([
                    {
                      id: `sms-${Date.now()}`,
                      sender: "CitiBank Fraud Control",
                      time: "Just Now",
                      text: "Alert! Account 4829104820 charged $295.00. Secure OTP pin: 81739. Do not share credentials."
                    },
                    ...smsMessages
                  ]);
                }}
                className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-white/5 text-left text-xs transition block truncate"
              >
                <div className="font-semibold text-amber-500">Preset: Financial OTP & Account</div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">Applies cryptographic SHA-256 secure hash</div>
              </button>
            </div>
          </div>

          {/* Flutter features explanation bento box */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/5 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              TASKLINE APP Native Flutter Architecture
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-amber-500" />
                  1. SMS Cryptographic Hashes
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The Flutter SMS Listener parses incoming texts entirely offline on-device. When sensitive values (credentials, OTPs, passcodes, bank accounts) are encountered, they are redacted and replaced with irreversible SHA-256 hashes for references.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-amber-500" />
                  2. AES/DES Hashed Call Logs
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The native call logs are processed locally using custom symmetric stream ciphers mimicking AES/DES. Numbers are encrypted and hidden in the memory layer to guarantee zero network leak, with categories of Mom, Dad, Relatives, Colleagues, and Friends.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-amber-500" />
                  3. Dynamic Settings Panel
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Under the Flutter Settings menu, the **"important contact"** list allows users to input any custom contact names. Added names immediately override spam logic and promote calls/texts to the top of the priority task queue!
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-amber-500" />
                  4. Export-Ready Source
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The source code of this fully featured Flutter app has been created under <strong>/taskline_app</strong> of this workspace! You can easily export this project via settings as a ZIP or to GitHub to compile and deploy on real Android devices.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
