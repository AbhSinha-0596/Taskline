import React, { useState, useEffect } from "react";
import { 
  PhoneCall, 
  ShieldCheck, 
  Key, 
  Filter, 
  UserCheck, 
  Plus, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  PhoneMissed,
  Info
} from "lucide-react";
import { 
  getOrCreateUserPrivateKey, 
  encryptPhoneNumber, 
  decryptPhoneNumber, 
  isCallLogPermitted, 
  detectCallerRole 
} from "../utils/security";
import { Task } from "../types";

interface SecureCallLogsProps {
  onAddIncomingCallTask: (task: {
    title: string;
    description: string;
    callerName: string;
    callerRole: string;
    dateTime: string;
  }) => void;
  simulatedTime: Date;
  pauseReminders?: boolean;
}

interface RawCallLog {
  id: string;
  name: string;
  phone: string;
  time: string;
  duration: string; // e.g. "Missed"
}

export default function SecureCallLogs({ onAddIncomingCallTask, simulatedTime, pauseReminders = false }: SecureCallLogsProps) {
  const [privateKey, setPrivateKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showDecryptedPhones, setShowDecryptedPhones] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<Record<string, boolean>>({});

  // Simulated raw mobile device call logs containing spam, delivery, family, and colleagues
  const [rawLogs, setRawLogs] = useState<RawCallLog[]>([]);

  // Raw user inputs to simulate a custom call log import
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [customStatus, setCustomStatus] = useState("Missed");

  // Load user private key from localStorage on mount
  useEffect(() => {
    const key = getOrCreateUserPrivateKey();
    setPrivateKey(key);
    
    // Seed some initial raw device call logs
    setRawLogs([
      { id: "raw-1", name: "Mom (Maa)", phone: "+91-98765-43210", time: "10 mins ago", duration: "Missed" },
      { id: "raw-2", name: "Delivery Boy (Amazon)", phone: "+91-91234-56789", time: "25 mins ago", duration: "1m 12s" },
      { id: "raw-3", name: "Ankit Manager (Office)", phone: "+91-99887-76655", time: "30 mins ago", duration: "Missed" },
      { id: "raw-4", name: "Spam credit card seller", phone: "+91-90000-11111", time: "1 hour ago", duration: "Missed" },
      { id: "raw-5", name: "Sneha (Colleague)", phone: "+91-94433-22110", time: "2 hours ago", duration: "Missed" },
      { id: "raw-6", name: "Papa (Dad)", phone: "+91-98112-23344", time: "3 hours ago", duration: "Missed" },
      { id: "raw-7", name: "Zomato Valet Rider", phone: "+91-95555-44444", time: "4 hours ago", duration: "45s" },
      { id: "raw-8", name: "Suresh (College Friend)", phone: "+91-96655-44332", time: "5 hours ago", duration: "Missed" },
    ]);
  }, []);

  const handleRegenerateKey = () => {
    if (confirm("Are you sure you want to rotate your local private key? This will change the encrypted values of saved numbers.")) {
      localStorage.removeItem("sentinel_secure_user_key");
      const key = getOrCreateUserPrivateKey();
      setPrivateKey(key);
    }
  };

  const handleAddCustomLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customPhone) return;

    const newLog: RawCallLog = {
      id: `custom-log-${Date.now()}`,
      name: customName,
      phone: customPhone,
      time: "Just Now",
      duration: customStatus
    };

    setRawLogs(prev => [newLog, ...prev]);
    setCustomName("");
    setCustomPhone("");
    setCustomStatus("Missed");
  };

  // Run filtering on current raw logs to see what passes the category check
  const filteredAndProcessed = rawLogs.map(log => {
    const isPermitted = isCallLogPermitted(log.name);
    const role = detectCallerRole(log.name);
    
    // Perform client-side symmetric stream encryption
    const encryptedPhone = encryptPhoneNumber(log.phone, privateKey);
    const decryptedPhone = decryptPhoneNumber(encryptedPhone, privateKey);

    return {
      ...log,
      isPermitted,
      role,
      encryptedPhone,
      decryptedPhone
    };
  });

  const handleImportToQueue = (log: typeof filteredAndProcessed[0]) => {
    if (pauseReminders) {
      alert("Services are paused! Please resume reminders in preferences to sync or import call logs.");
      return;
    }
    onAddIncomingCallTask({
      title: `Missed Call - ${log.name}`,
      description: `Imported secure call log callback request. Origin: SMS/Call log sync (${log.time}). Phone hash: ${log.encryptedPhone}.`,
      callerName: log.name,
      callerRole: log.role,
      dateTime: new Date(simulatedTime.getTime() + 15 * 60 * 1000).toISOString() // schedule alert 15 mins out
    });
    
    // Mark as imported visually
    setSelectedLogs(prev => ({ ...prev, [log.id]: true }));
  };

  return (
    <div id="secure-call-logs" className="p-5 rounded-2xl bg-[#0E122B]/70 border border-blue-500/10 space-y-5">
      
      {pauseReminders && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-center justify-between gap-3 text-xs font-bold animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>⏸️ Real-Time Call Log Listeners Paused in Settings</span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider">Background sync inactive</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <PhoneCall className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm md:text-base">Secure Call Logs Sync & Filter</h3>
            <p className="text-[12px] md:text-[14px] text-slate-400 font-medium">Category-based zero-trust processing (Calls &gt; Priority Queue)</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[11px] md:text-[13px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Client-Side Only
        </div>
      </div>

      {/* Zero Trust Explanation Banner */}
      <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl flex gap-3 text-xs leading-relaxed text-slate-300">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white text-sm">Zero Server Leak Policy</p>
          <p className="text-[12px] md:text-[14px] text-slate-400 font-medium">
            Phone numbers are **never sent to any server**. If needed for references, numbers are hashed and encrypted client-side using a symmetric key. Only permitted contacts (Mom, Dad, Office, Friends) are allowed to auto-promote into your priority list.
          </p>
        </div>
      </div>

      {/* Encryption Key Management */}
      <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Key className="w-4 h-4 text-amber-500" />
            <span className="text-xs md:text-sm font-bold text-white">Unique User Encryption Key</span>
          </div>
          <button
            onClick={handleRegenerateKey}
            className="text-[11px] md:text-[13px] font-mono font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white px-2.5 py-1 rounded transition cursor-pointer"
          >
            Rotate Key
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-slate-950/80 px-3 py-1.5 border border-white/5 rounded-lg font-mono text-xs text-slate-400 flex items-center justify-between overflow-hidden">
            <span className="truncate text-xs md:text-sm">
              {showKey ? privateKey : "••••••••••••••••••••••••••••••••"}
            </span>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-slate-500 hover:text-white transition shrink-0 ml-2"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => setShowDecryptedPhones(!showDecryptedPhones)}
            className={`px-3 py-1.5 text-xs md:text-sm font-bold rounded-lg border transition flex items-center gap-1.5 ${
              showDecryptedPhones 
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {showDecryptedPhones ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{showDecryptedPhones ? "Decrypted View" : "Encrypted View"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Device Logs Scanner on left, Custom log builder on right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Call Logs Table View (7 cols) */}
        <div className="md:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] md:text-[13px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              Incoming Call Logs Sync ({filteredAndProcessed.length})
            </span>
            <span className="text-[11px] md:text-[13px] text-slate-500 font-medium italic">Filters active: Mom/Dad/Office/Colleagues/Friends</span>
          </div>

          <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20 divide-y divide-white/5 max-h-[290px] overflow-y-auto">
            {filteredAndProcessed.map(log => {
              const isImported = selectedLogs[log.id];

              return (
                <div 
                  key={log.id}
                  className={`p-3 flex items-center justify-between gap-3 text-xs transition ${
                    log.isPermitted 
                      ? "bg-slate-900/40 hover:bg-slate-900/80" 
                      : "opacity-40 bg-black/10"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      log.isPermitted 
                        ? log.duration === "Missed" 
                          ? "bg-rose-500/10 text-rose-400" 
                          : "bg-emerald-500/10 text-emerald-400"
                        : "bg-slate-800 text-slate-500"
                    }`}>
                      <PhoneMissed className="w-4 h-4" />
                    </div>

                    <div className="overflow-hidden space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{log.name}</span>
                        {log.isPermitted ? (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full font-mono uppercase font-bold">
                            Permitted: {log.role}
                          </span>
                        ) : (
                          <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full font-mono uppercase">
                            Filtered Out
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                        {showDecryptedPhones ? (
                          <span className="text-emerald-400 font-bold">{log.decryptedPhone}</span>
                        ) : (
                          <span className="text-slate-500 italic truncate max-w-[140px] block" title={log.encryptedPhone}>
                            {log.encryptedPhone}
                          </span>
                        )}
                        <span className="text-slate-600">•</span>
                        <span>{log.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {log.isPermitted ? (
                      isImported ? (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                          Imported ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => handleImportToQueue(log)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-black font-bold text-[10px] uppercase rounded-lg transition shadow-md shadow-rose-500/5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Queue callback
                        </button>
                      )
                    ) : (
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mr-2">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Input Call logs simulation (4 cols) */}
        <div className="md:col-span-4 bg-black/40 p-4 rounded-xl border border-white/5 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-white">Simulate External Inbound Call</h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Insert a raw missed call status. The app filters and encrypts the log parameters client-side.
            </p>
          </div>

          <form onSubmit={handleAddCustomLog} className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Caller Contact Name</label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Mom Office, Delivery guy, Boss"
                className="w-full text-xs p-2 bg-slate-950 border border-white/5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-200"
              />
              <span className="text-[8px] text-slate-500 mt-1 block">Try typing names like "Mom", "Ankit Office" or "Courier Spam".</span>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Phone Number (Clean text)</label>
              <input
                type="text"
                required
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+91-99999-88888"
                className="w-full text-xs p-2 bg-slate-950 border border-white/5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Sync Status Type</label>
              <select
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                className="w-full text-xs p-2 bg-slate-950 border border-white/5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-200"
              >
                <option value="Missed">Missed (Action Trigger)</option>
                <option value="Completed">Connected (Completed)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs rounded-lg border border-white/10 transition cursor-pointer"
            >
              Simulate Device Call Trigger
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
