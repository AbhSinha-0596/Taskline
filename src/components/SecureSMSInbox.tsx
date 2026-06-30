import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  PhoneCall, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Clock,
  Trash2,
  CheckCircle,
  HelpCircle,
  FileText
} from "lucide-react";
import { isCallLogPermitted, detectCallerRole } from "../utils/security";

interface SecureSMSInboxProps {
  onAddIncomingCallTask: (task: {
    title: string;
    description: string;
    callerName: string;
    callerRole: string;
    dateTime: string;
  }) => void;
  pauseReminders?: boolean;
}

interface RawSMS {
  id: string;
  sender: string;
  timestamp: string;
  messageText: string;
}

/**
 * Robust Client-Side Redaction function.
 * Matches OTPs, credit/debit numbers, bank accounts, passwords, passcodes, amount figures, etc.
 * Keeps everything within the app; NEVER sends raw strings anywhere.
 */
export function redactSensitiveSmsContent(text: string): {
  redactedText: string;
  containsSensitiveInfo: boolean;
  redactedDetails: string[];
} {
  let redacted = text;
  let containsSensitiveInfo = false;
  const redactedDetails: string[] = [];

  // 1. Redact OTPs (typically 4-8 digit numeric codes)
  const otpRegex = /\b\d{4,8}\b/g;
  if (otpRegex.test(redacted)) {
    redacted = redacted.replace(otpRegex, "[REDACTED_SECURE_OTP]");
    containsSensitiveInfo = true;
    redactedDetails.push("One-Time Password (OTP)");
  }

  // 2. Redact Amounts / Currencies (e.g. Rs. 5000, $1500, USD 200, 10,000 INR)
  const amountRegex = /(?:rs\.?|usd|\$|inr|€|£|amount|balance)\s*\d+(?:,\d{3})*(?:\.\d+)?/gi;
  if (amountRegex.test(redacted)) {
    redacted = redacted.replace(amountRegex, "[REDACTED_SENSITIVE_AMOUNT]");
    containsSensitiveInfo = true;
    redactedDetails.push("Financial Transaction/Balance Amount");
  }

  // 3. Redact common credentials/passwords/codes
  const credsRegex = /(?:password|pwd|passcode|pin|credentials|token):\s*\S+/gi;
  if (credsRegex.test(redacted)) {
    redacted = redacted.replace(credsRegex, "$1: [REDACTED_CREDENTIALS]");
    containsSensitiveInfo = true;
    redactedDetails.push("Account Password/PIN");
  }

  // 4. Redact account numbers (typically 8-18 digits)
  const accountRegex = /\b\d{9,18}\b/g;
  if (accountRegex.test(redacted)) {
    redacted = redacted.replace(accountRegex, "[REDACTED_ACCOUNT_NUMBER]");
    containsSensitiveInfo = true;
    redactedDetails.push("Bank / Credit Card Number");
  }

  return {
    redactedText: redacted,
    containsSensitiveInfo,
    redactedDetails
  };
}

/**
 * Scans SMS locally to check if the sender is "available to make/take calls"
 */
export function scanForCallAvailability(text: string): {
  isAvailable: boolean;
  context: string;
} {
  const lower = text.toLowerCase();
  
  const availabilityKeywords = [
    "free now",
    "available to",
    "available for call",
    "call me now",
    "free to talk",
    "free to make calls",
    "back online",
    "free now to make calls",
    "can talk now",
    "available to talk",
    "meeting is over",
    "completed my task, let's call",
    "ready to talk"
  ];

  const matched = availabilityKeywords.find(keyword => lower.includes(keyword));
  if (matched) {
    return {
      isAvailable: true,
      context: `Sender texted they are free ("${matched}")`
    };
  }

  return {
    isAvailable: false,
    context: ""
  };
}

export default function SecureSMSInbox({ onAddIncomingCallTask, pauseReminders = false }: SecureSMSInboxProps) {
  const [messages, setMessages] = useState<RawSMS[]>([]);
  const [showRedactedLog, setShowRedactedLog] = useState<Record<string, boolean>>({});
  const [redactedCount, setRedactedCount] = useState(0);

  // New message inputs for simulation
  const [customSender, setCustomSender] = useState("");
  const [customText, setCustomText] = useState("");

  useEffect(() => {
    // Seed default simulated Android SMS text logs (including high-security OTPs & call availability indicators)
    setMessages([
      {
        id: "sms-1",
        sender: "Mom",
        timestamp: "2 mins ago",
        messageText: "Hi beta, I am free now to make calls! Please call. Also, don't share your secret bank password 'MummySpecial' or OTP 827103 with anyone."
      },
      {
        id: "sms-2",
        sender: "ICICI Bank Alerts",
        timestamp: "10 mins ago",
        messageText: "Your account ending 44102911 has been credited with Rs. 45,000. Current balance is Rs. 1,22,500. Secure OTP for next transaction is 918237."
      },
      {
        id: "sms-3",
        sender: "Ankit Manager",
        timestamp: "15 mins ago",
        messageText: "Hi, I just finished my client demo and I am free to talk now. Reach me when you get this."
      },
      {
        id: "sms-4",
        sender: "Amazon Delivery",
        timestamp: "30 mins ago",
        messageText: "Your OTP for order delivery is 48291. Hand this over to the valet rider."
      },
      {
        id: "sms-5",
        sender: "Sneha Colleague",
        timestamp: "1 hour ago",
        messageText: "Hi Suresh, our meeting got canceled. I'm available for a quick sync call now if you are around."
      },
      {
        id: "sms-6",
        sender: "Spam Lottery",
        timestamp: "2 hours ago",
        messageText: "Congratulations! You won Rs. 5000000. Send your bank details to collect the award immediately."
      }
    ]);
  }, []);

  const handleSimulateSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSender || !customText) return;

    const newSms: RawSMS = {
      id: `custom-sms-${Date.now()}`,
      sender: customSender,
      timestamp: "Just Now",
      messageText: customText
    };

    setMessages(prev => [newSms, ...prev]);
    setCustomSender("");
    setCustomText("");
  };

  // Helper to clear simulated inbox
  const clearInbox = () => {
    setMessages([]);
  };

  return (
    <div id="secure-sms-inbox" className="p-5 rounded-2xl bg-[#131129]/70 border border-violet-500/10 space-y-5 mt-6">
      
      {pauseReminders && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-center justify-between gap-3 text-xs font-bold animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>⏸️ Real-Time SMS listeners Paused in Settings</span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider">Background sync inactive</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <MessageSquare className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm md:text-base">Secure Android SMS Listener</h3>
            <p className="text-[12px] md:text-[14px] text-slate-400 font-medium">Zero-Server-Leak parsing (Redacts credentials, OTPs, Amounts)</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-[11px] md:text-[13px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Android SMS Parser
        </div>
      </div>

      {/* Grid: SMS feed & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* SMS List (8 columns) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] md:text-[13px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Android Broadcast Message Stream ({messages.length})
            </span>
            <button
              onClick={clearInbox}
              className="text-[11px] md:text-[13px] text-slate-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition"
            >
              <Trash2 className="w-3 h-3" />
              Clear Feed
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="p-8 text-center bg-black/30 border border-dashed border-white/10 rounded-xl text-slate-500 text-xs">
                No simulated SMS messages received. Use the simulator panel on the right.
              </div>
            ) : (
              messages.map(sms => {
                const isPermittedContact = isCallLogPermitted(sms.sender);
                const role = detectCallerRole(sms.sender);
                
                // RUN EXCLUSIVELY CLIENT SIDE
                const parsed = redactSensitiveSmsContent(sms.messageText);
                const availInfo = scanForCallAvailability(sms.messageText);

                // Check toggle to show raw/redacted
                const revealRaw = showRedactedLog[sms.id] || false;

                const hasCallAction = isPermittedContact && availInfo.isAvailable;

                return (
                  <div 
                    key={sms.id}
                    className={`p-3.5 rounded-xl border transition ${
                      hasCallAction 
                        ? "bg-[#18120B] border-amber-500/30" 
                        : isPermittedContact 
                          ? "bg-slate-900/30 border-white/5" 
                          : "bg-black/20 border-white/5 opacity-55"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{sms.sender}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{sms.timestamp}</span>

                        {isPermittedContact ? (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full font-mono uppercase font-bold">
                            {role}
                          </span>
                        ) : (
                          <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full font-mono uppercase">
                            Non-Priority Contact
                          </span>
                        )}
                      </div>

                      {/* Display warning badge if sensitive data was intercepted & redacted locally */}
                      {parsed.containsSensitiveInfo && (
                        <div className="flex items-center gap-1.5 text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md font-mono">
                          <Lock className="w-3 h-3" />
                          Redacted locally
                        </div>
                      )}
                    </div>

                    {/* Message Body Block */}
                    <div className="space-y-2">
                      <div className="p-2.5 bg-black/40 rounded-lg border border-white/5 text-xs text-slate-300 leading-relaxed font-mono">
                        {revealRaw ? (
                          <p className="text-rose-300 bg-rose-950/20 p-1.5 rounded border border-rose-500/20">
                            {sms.messageText}
                          </p>
                        ) : (
                          <p>{parsed.redactedText}</p>
                        )}
                      </div>

                      {/* Redacted details summary */}
                      {parsed.containsSensitiveInfo && (
                        <div className="flex flex-wrap gap-1.5 items-center text-[10px] text-slate-400">
                          <span className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">Client-Side Redactions:</span>
                          {parsed.redactedDetails.map((det, i) => (
                            <span key={i} className="bg-slate-950 px-1.5 py-0.5 rounded border border-white/5 text-[9px]">
                              {det}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Availability call triggers */}
                      {availInfo.isAvailable && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between gap-3 text-xs text-amber-300">
                          <div className="flex items-center gap-2">
                            <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <p className="font-bold">Contact is available for call!</p>
                              <p className="text-[10px] text-slate-400">{availInfo.context}</p>
                            </div>
                          </div>

                          {isPermittedContact ? (
                            <button
                              onClick={() => {
                                if (pauseReminders) {
                                  alert("Services are paused! Please resume reminders in preferences to sync or add call alerts.");
                                  return;
                                }
                                onAddIncomingCallTask({
                                  title: `Call back - ${sms.sender}`,
                                  description: `Sender is free to make/take calls now! SMS Intercept: "${parsed.redactedText}"`,
                                  callerName: sms.sender,
                                  callerRole: role,
                                  dateTime: new Date().toISOString()
                                });
                                alert(`Task created! "${sms.sender}" promoted directly to top of rolling priority queue.`);
                              }}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-[9px] rounded-md transition shrink-0 cursor-pointer shadow-sm shadow-amber-500/10"
                            >
                              Add Call Alert
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-500 italic shrink-0">Filtered contact</span>
                          )}
                        </div>
                      )}

                      {/* Controls for demonstration / debugging */}
                      {parsed.containsSensitiveInfo && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => setShowRedactedLog(prev => ({ ...prev, [sms.id]: !prev[sms.id] }))}
                            className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1 font-mono uppercase"
                          >
                            {revealRaw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {revealRaw ? "Hide unmasked text" : "Reveal unmasked text (demonstrate client-side encryption)"}
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SMS Simulator (4 columns) */}
        <div className="lg:col-span-4 bg-black/40 p-4 rounded-xl border border-white/5 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-white">Inbound SMS Broadcaster</h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Test how the local security engine strips passcode credentials & triggers a priority callback task.
            </p>
          </div>

          <form onSubmit={handleSimulateSms} className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Sender Name/Number</label>
              <input
                type="text"
                required
                value={customSender}
                onChange={(e) => setCustomSender(e.target.value)}
                placeholder="e.g., Dad, Manager, Citibank Security"
                className="w-full text-xs p-2 bg-slate-950 border border-white/5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Raw SMS Message text</label>
              <textarea
                required
                rows={3}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type passwords/OTPs or availability keywords like 'free to talk now'..."
                className="w-full text-xs p-2 bg-slate-950 border border-white/5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-200 font-mono"
              />
              <span className="text-[8px] text-slate-500 mt-1 block">
                OTPs, amounts ($100), passwords, or phrases like "free to talk" will trigger dynamic responses.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition cursor-pointer"
            >
              Simulate Broadcast SMS
            </button>
          </form>

          {/* Quick presets for testers */}
          <div className="space-y-2 border-t border-white/5 pt-3">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Quick Simulation Presets:</span>
            
            <button
              onClick={() => {
                setCustomSender("Mom");
                setCustomText("Beta, call me now! I am free to talk. The OTP for gas booking is 582910 and amount is Rs. 1050.");
              }}
              className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded text-[10px] text-slate-300 transition truncate block"
            >
              Preset: Mom free + Gas OTP
            </button>

            <button
              onClick={() => {
                setCustomSender("Ankit Manager");
                setCustomText("Done with call! I am available for call now. Reach me to discuss project files.");
              }}
              className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded text-[10px] text-slate-300 transition truncate block"
            >
              Preset: Manager free now
            </button>

            <button
              onClick={() => {
                setCustomSender("CitiBank Transaction");
                setCustomText("Alert! Your card ended 4820 has been charged USD 450.00 at Apple Store. OTP is 9102.");
              }}
              className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded text-[10px] text-slate-300 transition truncate block"
            >
              Preset: Financial alert (OTP & Amount)
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
