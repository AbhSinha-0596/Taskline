import React, { useState, useRef } from "react";
import { 
  X, 
  Sun, 
  Moon, 
  Laptop, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Maximize2, 
  Bell, 
  Upload, 
  Play, 
  Pause,
  RotateCcw,
  Sparkles,
  Check,
  Shield,
  FileAudio,
  Clock,
  Plus,
  Trash2,
  UserPlus
} from "lucide-react";

export interface CustomSound {
  name: string;
  url: string; // Object URL or Base64
}

export interface ImportantContact {
  name: string;
  category: "family" | "office" | "friends" | "others";
}

export interface AppSettings {
  displayMode: "light" | "dark" | "system";
  alarmSound: string; // "default" or name of custom uploaded sound
  customSounds: CustomSound[];
  vibratePattern: "basic" | "heartbeat" | "zig-zag" | "tick-tock";
  viewOption: "fullscreen" | "popup";
  travelBufferThreshold: number; // in minutes
  importantContacts?: ImportantContact[];
  pauseReminders?: boolean;
}

interface SettingsPanelProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onSaveSettings, onClose }: SettingsPanelProps) {
  const [displayMode, setDisplayMode] = useState<"light" | "dark" | "system">(settings.displayMode);
  const [alarmSound, setAlarmSound] = useState<string>(settings.alarmSound);
  const [customSounds, setCustomSounds] = useState<CustomSound[]>(settings.customSounds || []);
  const [vibratePattern, setVibratePattern] = useState<"basic" | "heartbeat" | "zig-zag" | "tick-tock">(settings.vibratePattern);
  const [viewOption, setViewOption] = useState<"fullscreen" | "popup">(settings.viewOption);
  const [travelBufferThreshold, setTravelBufferThreshold] = useState<number>(settings.travelBufferThreshold || 30);
  const [pauseReminders, setPauseReminders] = useState<boolean>(!!settings.pauseReminders);
  
  const [importantContacts, setImportantContacts] = useState<ImportantContact[]>(
    settings.importantContacts || [
      { name: "Mom", category: "family" },
      { name: "Dad", category: "family" },
      { name: "Ankit Manager", category: "office" }
    ]
  );
  const [newContactName, setNewContactName] = useState("");
  const [newContactCategory, setNewContactCategory] = useState<"family" | "office" | "friends" | "others">("family");

  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [isVibrating, setIsVibrating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play standard beep synthesizer (default sound)
  const playDefaultBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
      
      setIsPlaying("default");
      setTimeout(() => setIsPlaying(null), 500);
    } catch (e) {
      console.error("Web Audio beep failed", e);
    }
  };

  const handlePlaySound = (soundName: string, soundUrl?: string) => {
    if (isPlaying === soundName) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(null);
      return;
    }

    if (soundName === "default") {
      playDefaultBeep();
      return;
    }

    if (soundUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(soundUrl);
      audioRef.current = audio;
      setIsPlaying(soundName);
      audio.play().catch(e => console.error("Audio play failed", e));
      audio.onended = () => {
        setIsPlaying(null);
      };
    }
  };

  // Triggers client-side vibration pattern
  const triggerVibration = (pattern: typeof vibratePattern) => {
    setIsVibrating(true);
    let delay = 600;

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (pattern === "basic") {
        navigator.vibrate(200);
        delay = 200;
      } else if (pattern === "heartbeat") {
        navigator.vibrate([150, 100, 150]);
        delay = 400;
      } else if (pattern === "zig-zag") {
        navigator.vibrate([100, 50, 100, 50, 100]);
        delay = 400;
      } else if (pattern === "tick-tock") {
        navigator.vibrate([50, 250, 50]);
        delay = 350;
      }
    } else {
      // Simulate visual duration
      if (pattern === "basic") delay = 250;
      else if (pattern === "heartbeat") delay = 500;
      else if (pattern === "zig-zag") delay = 600;
      else if (pattern === "tick-tock") delay = 400;
    }

    setTimeout(() => {
      setIsVibrating(false);
    }, delay);
  };

  // Handling file uploader
  const processFiles = (files: FileList) => {
    const validFiles: CustomSound[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const nameLower = file.name.toLowerCase();
      if (nameLower.endsWith(".wav") || nameLower.endsWith(".aiff") || nameLower.endsWith(".aif") || file.type.startsWith("audio/")) {
        // Create dynamic Object URL
        const fileUrl = URL.createObjectURL(file);
        validFiles.push({
          name: file.name,
          url: fileUrl
        });
      }
    }

    if (validFiles.length > 0) {
      const updated = [...customSounds, ...validFiles];
      setCustomSounds(updated);
      // Auto-select first uploaded sound
      setAlarmSound(validFiles[0].name);
    } else {
      alert("Please upload a valid .wav or .aiff audio file.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleRemoveCustomSound = (soundName: string) => {
    const filtered = customSounds.filter(s => s.name !== soundName);
    setCustomSounds(filtered);
    if (alarmSound === soundName) {
      setAlarmSound("default");
    }
  };

  const handleSave = () => {
    onSaveSettings({
      displayMode,
      alarmSound,
      customSounds,
      vibratePattern,
      viewOption,
      travelBufferThreshold,
      importantContacts,
      pauseReminders
    });
    onClose();
  };

  const handleResetDefaults = () => {
    if (confirm("Reset settings back to defaults?")) {
      setDisplayMode("dark");
      setAlarmSound("default");
      setVibratePattern("basic");
      setViewOption("popup");
      setTravelBufferThreshold(30);
      setPauseReminders(false);
    }
  };

  return (
    <div id="settings-modal" className="fixed inset-0 bg-[#070708]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0D0D0E] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">TASKLINE Preferences</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">System &amp; Reminder Controls</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Contents */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* 1. DISPLAY MODE */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                Display Mode
              </h4>
              <p className="text-[10px] text-slate-500">Configure visual themes for high-contrast day or night compliance.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setDisplayMode("light")}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                  displayMode === "light"
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-black/30 border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-xs font-semibold">Light Mode</span>
              </button>

              <button
                onClick={() => setDisplayMode("dark")}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                  displayMode === "dark"
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-black/30 border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-xs font-semibold">Dark Mode</span>
              </button>

              <button
                onClick={() => setDisplayMode("system")}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                  displayMode === "system"
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-black/30 border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                <Laptop className="w-5 h-5" />
                <span className="text-xs font-semibold">System Default</span>
              </button>
            </div>
          </div>

          {/* 1b. PAUSE REMINDERS & BACKGROUND SERVICES */}
          <div className="space-y-3 border-t border-white/5 pt-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Pause className="w-4 h-4 text-amber-500" />
                Pause Reminders & Background Checks
              </h4>
              <p className="text-[10px] text-slate-500">Temporarily suspend all real-time alerts, notifications, and automated call/SMS listener background activities.</p>
            </div>

            <div className="bg-[#131129]/60 p-4 rounded-xl border border-violet-500/15 flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <span className="text-xs font-bold text-slate-200 block">Suspend Sentinel Services</span>
                <span className="text-[10px] text-slate-400 leading-normal block">
                  When enabled, no notifications will ring, no schedule timers will trigger alerts, and incoming SMS or call logs will not be automatically checked.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPauseReminders(!pauseReminders)}
                className="cursor-pointer shrink-0 focus:outline-hidden"
              >
                {pauseReminders ? (
                  <div className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 rounded-lg text-rose-400 text-xs font-bold uppercase tracking-wider transition">
                    <Pause className="w-4 h-4 animate-pulse" />
                    PAUSED
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-bold uppercase tracking-wider transition">
                    <Check className="w-4 h-4" />
                    ACTIVE
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 2. SOUNDS & VIBRATIONS */}
          <div className="space-y-4 border-t border-white/5 pt-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-rose-500" />
                Sounds &amp; Vibrations
              </h4>
              <p className="text-[10px] text-slate-500">Manage acoustic responses and haptic alert vibrations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* (i) ALARM SOUND OPTIONS */}
              <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Alarm Sound Ringtone
                </span>
                
                {/* Available sounds radio group */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {/* Default Beep */}
                  <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/5 text-xs text-slate-300 cursor-pointer hover:bg-slate-900 transition">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="alarmSound"
                        value="default"
                        checked={alarmSound === "default"}
                        onChange={() => setAlarmSound("default")}
                        className="text-amber-500 focus:ring-0"
                      />
                      <span className="font-medium">Synthesizer Beep (Default)</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySound("default");
                      }}
                      className="p-1 rounded bg-white/5 hover:bg-amber-500 hover:text-black transition text-slate-400"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </label>

                  {/* Custom Uploaded Sounds */}
                  {customSounds.map((sound) => (
                    <label 
                      key={sound.name}
                      className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/5 text-xs text-slate-300 cursor-pointer hover:bg-slate-900 transition"
                    >
                      <div className="flex items-center gap-2 overflow-hidden mr-2">
                        <input
                          type="radio"
                          name="alarmSound"
                          value={sound.name}
                          checked={alarmSound === sound.name}
                          onChange={() => setAlarmSound(sound.name)}
                          className="text-amber-500 focus:ring-0 shrink-0"
                        />
                        <span className="truncate font-mono text-[10px]" title={sound.name}>
                          {sound.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaySound(sound.name, sound.url);
                          }}
                          className={`p-1 rounded transition ${
                            isPlaying === sound.name
                              ? "bg-amber-500 text-black"
                              : "bg-white/5 hover:bg-amber-500 hover:text-black text-slate-400"
                          }`}
                        >
                          {isPlaying === sound.name ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomSound(sound.name);
                          }}
                          className="p-1 rounded bg-white/5 hover:bg-rose-500 hover:text-white transition text-slate-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </label>
                  ))}
                </div>

                {/* File Uploader supporting drag-and-drop & file click */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed p-3 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    isDragging 
                      ? "border-amber-500 bg-amber-500/5 text-amber-400" 
                      : "border-white/10 hover:border-white/20 bg-slate-950 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Upload className="w-4 h-4 text-amber-500" />
                  <div className="text-[10px]">
                    <span className="font-bold text-amber-500">Click to upload</span> or drag .wav / .aiff
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wav,.aiff,.aif,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                </div>
              </div>

              {/* (ii) VIBRATE PATTERNS */}
              <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-2">
                    Vibration Pattern
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "basic", label: "Basic Single", pattern: "200ms Pulse" },
                      { id: "heartbeat", label: "Heartbeat Double", pattern: "Double Thump" },
                      { id: "zig-zag", label: "Zig-Zag Burst", pattern: "Tri-pulse Speed" },
                      { id: "tick-tock", label: "Tick-Tock Echo", pattern: "Subtle Pulse" },
                    ].map((patternItem) => (
                      <button
                        key={patternItem.id}
                        type="button"
                        onClick={() => {
                          setVibratePattern(patternItem.id as any);
                          triggerVibration(patternItem.id as any);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition text-xs flex flex-col justify-between cursor-pointer ${
                          vibratePattern === patternItem.id
                            ? "bg-amber-500/10 border-amber-500 text-amber-400"
                            : "bg-slate-950 border-white/5 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        <span className="font-semibold text-white">{patternItem.label}</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-1">{patternItem.pattern}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shaker / Simulator Display */}
                <div className="pt-2">
                  <div className="p-2 bg-slate-950 rounded-lg border border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Smartphone className={`w-3.5 h-3.5 text-amber-500 ${isVibrating ? "animate-bounce" : ""}`} />
                      Haptic Feedback Preview:
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerVibration(vibratePattern)}
                      className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded font-mono font-bold uppercase text-[9px] transition cursor-pointer"
                    >
                      Test Vibrator
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* 3. VIEW OPTIONS */}
          <div className="space-y-3 border-t border-white/5 pt-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                View Options &amp; Alert Delivery
              </h4>
              <p className="text-[10px] text-slate-500">Configure how rolling priority reminders takeover your workspace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setViewOption("popup")}
                className={`p-4 rounded-xl border text-left transition flex gap-3.5 items-start cursor-pointer ${
                  viewOption === "popup"
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-black/30 border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${viewOption === "popup" ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-400"}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Notification Popup (Default)</span>
                  <span className="text-[10px] text-slate-500 leading-normal block mt-1">
                    Displays non-disruptive, floating cards in the top corner of the app layout.
                  </span>
                </div>
              </button>

              <button
                onClick={() => setViewOption("fullscreen")}
                className={`p-4 rounded-xl border text-left transition flex gap-3.5 items-start cursor-pointer ${
                  viewOption === "fullscreen"
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-black/30 border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${viewOption === "fullscreen" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-400"}`}>
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Full Screen Overlays</span>
                  <span className="text-[10px] text-slate-500 leading-normal block mt-1">
                    Forces critical modal takes-over of the viewport to command immediate focus.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 4. TRAVEL SAFETY BUFFER */}
          <div className="space-y-3 border-t border-white/5 pt-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Automated Delay Risk Buffer
              </h4>
              <p className="text-[10px] text-slate-500">Configure your minimum safe transition buffer before travel task departures.</p>
            </div>

            <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Desired Safety Transition Buffer:</span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                  {travelBufferThreshold} Minutes
                </span>
              </div>
              
              <div className="space-y-1.5">
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={travelBufferThreshold}
                  onChange={(e) => setTravelBufferThreshold(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-950 cursor-pointer h-1.5 rounded-lg border border-white/5"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>10 mins (Minimum)</span>
                  <span>30 mins (Standard)</span>
                  <span>45 mins (Conservative)</span>
                  <span>60 mins (Ultra-safe)</span>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-500 leading-normal">
                If the remaining buffer time to reach destination falls below this preference threshold (cross-referencing real-time delay status), the <strong>Automated Delay Risk Indicator</strong> triggers.
              </p>
            </div>
          </div>

          {/* 5. IMPORTANT CONTACT */}
          <div className="space-y-3 border-t border-white/5 pt-5">
            <div>
              <h4 id="settings-important-contact-title" className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-amber-500" />
                important contact
              </h4>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">add contacts names to automatically detect</p>
              <p className="text-[10px] text-slate-500 mt-1">Incoming SMS content and call logs from these specific names will bypass standard checks and trigger automatic callback actions.</p>
            </div>

            <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">Contact Name Only</label>
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="e.g., Sis, Rohit Friend, Office manager"
                    className="w-full text-xs p-2 bg-slate-950 border border-white/5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">Select Category</label>
                  <select
                    value={newContactCategory}
                    onChange={(e) => setNewContactCategory(e.target.value as any)}
                    className="w-full text-xs p-2 bg-slate-950 border border-white/5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-200"
                  >
                    <option value="family">Family</option>
                    <option value="office">Office</option>
                    <option value="friends">Friends</option>
                    <option value="others">Others</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!newContactName.trim()) {
                    alert("Please enter a contact name.");
                    return;
                  }
                  if (importantContacts.some(c => c.name.toLowerCase() === newContactName.trim().toLowerCase())) {
                    alert("This contact rule already exists.");
                    return;
                  }
                  setImportantContacts([...importantContacts, { name: newContactName.trim(), category: newContactCategory }]);
                  setNewContactName("");
                }}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition cursor-pointer animate-pulse"
              >
                Add Priority Rule
              </button>

              <div className="space-y-1.5 border-t border-white/5 pt-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Active Detection Rules ({importantContacts.length})</span>
                {importantContacts.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">No custom rules configured. Standard filters (Mom, Dad, Manager, friends, etc.) are active.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {importantContacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-white/5 text-xs">
                        <div className="overflow-hidden mr-2">
                          <p className="font-semibold text-white truncate">{contact.name}</p>
                          <span className={`text-[8px] uppercase font-bold tracking-wider ${
                            contact.category === "family" ? "text-pink-400" :
                            contact.category === "office" ? "text-blue-400" :
                            contact.category === "friends" ? "text-emerald-400" : "text-amber-400"
                          }`}>{contact.category}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setImportantContacts(importantContacts.filter((_, idx) => idx !== index));
                          }}
                          className="p-1 rounded bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer actions */}
        <div className="p-5 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 uppercase tracking-wider transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/5"
            >
              Save Preferences
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
