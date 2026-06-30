import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  AlertTriangle,
  Plane,
  Train,
  Phone,
  Briefcase,
  CheckCircle2,
  Plus,
  Search,
  Youtube,
  ExternalLink,
  Battery,
  User,
  Sparkles,
  Trash2,
  Bell,
  X,
  FileText,
  Check,
  Loader2,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  BookOpen,
  DollarSign,
  Settings
} from "lucide-react";
import { Task, TaskCategory, UserProfile, ReminderAlert } from "./types";
import { sortTasks, getPriorityTierLabel, getTaskPriorityScore } from "./utils/priority";
import ProfilePanel from "./components/ProfilePanel";
import ScannerSimulator from "./components/ScannerSimulator";
import SecureCallLogs from "./components/SecureCallLogs";
import SecureSMSInbox from "./components/SecureSMSInbox";
import TasklineAppSimulator from "./components/TasklineAppSimulator";
import SettingsPanel, { AppSettings } from "./components/SettingsPanel";
import { motion } from "motion/react";

// Initial seed data to make the app interactive and demonstrate all key flows immediately
const INITIAL_TASKS = (baseTime: Date): Task[] => [
  {
    id: "seed-call-mom",
    title: "Missed Call - Mom",
    description: "Missed 2 calls from Mom (Maa). Unable to connect while retrying, but lines are active now. Callback immediately.",
    category: "call",
    dateTime: new Date(baseTime.getTime() + 10 * 60 * 1000).toISOString(), // 10 mins from now
    createdTime: new Date(baseTime.getTime() - 2 * 60 * 1000).toISOString(),
    status: "pending",
    callerName: "Mom",
    callerRole: "mom"
  },
  {
    id: "seed-train-shatabdi",
    title: "Shatabdi Express #12002",
    description: "Train Journey from New Delhi to Bhopal. Seat 34, Coach C2. Live status check starts 30m prior to departure.",
    category: "travel_train",
    dateTime: new Date(baseTime.getTime() + 32 * 60 * 1000).toISOString(), // 32 mins from now
    createdTime: new Date(baseTime.getTime() - 10 * 60 * 1000).toISOString(),
    status: "pending",
    trainNumber: "12002"
  },
  {
    id: "seed-flight-indigo",
    title: "Indigo Flight 6E-2401",
    description: "Flight to Bangalore. Needs web check-in 24 hours prior, and early airport arrival of 5 hours.",
    category: "travel_flight",
    dateTime: new Date(baseTime.getTime() + 26 * 60 * 60 * 1000).toISOString(), // 26 hours from now
    createdTime: new Date(baseTime.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    flightNumber: "6E-2401"
  },
  {
    id: "seed-project-submission",
    title: "React Dashboard Code Submission",
    description: "Upload code files and presentation video to the workspace evaluation folder.",
    category: "project",
    dateTime: new Date(baseTime.getTime() + 45 * 60 * 1000).toISOString(), // 45 mins from now
    createdTime: new Date(baseTime.getTime() - 30 * 60 * 1000).toISOString(),
    status: "pending"
  },
  {
    id: "seed-meeting-technical",
    title: "Q2 Architectural Review Sync",
    description: "Discuss microservice migration plan, serverless deployment costs, and database speed roadblocks.",
    category: "meeting",
    dateTime: new Date(baseTime.getTime() + 90 * 60 * 1000).toISOString(), // 1.5 hours from now
    createdTime: new Date(baseTime.getTime() - 5 * 60 * 1000).toISOString(),
    status: "pending"
  }
];

export default function App() {
  // Set real baseline date but keep tracked simulated date
  const [simulatedTime, setSimulatedTime] = useState<Date>(() => new Date());
  
  // Tasks list
  const [tasks, setTasks] = useState<Task[]>(() => INITIAL_TASKS(new Date()));

  // Automatically increment simulated time by 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedTime(prev => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Profile settings
  const [profile, setProfile] = useState<UserProfile>({
    name: "User001",
    role: "Software Engineer",
    batterySaverMode: false
  });

  // Task creation state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<TaskCategory>("project");
  const [newDateTime, setNewDateTime] = useState("");
  const [newTrainNumber, setNewTrainNumber] = useState("");
  const [newFlightNumber, setNewFlightNumber] = useState("");
  const [newCallerName, setNewCallerName] = useState("");
  const [newCallerRole, setNewCallerRole] = useState("other");

  // Ticket Upload & parsing states
  const [isUploadingTicket, setIsUploadingTicket] = useState(false);
  const [ticketUploadError, setTicketUploadError] = useState<string | null>(null);
  const [ticketUploadSuccess, setTicketUploadSuccess] = useState<string | null>(null);

  const handleTicketUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["png", "jpg", "jpeg", "pdf", "txt"];
    if (!extension || !validExtensions.includes(extension)) {
      setTicketUploadError("Invalid file type. Please upload a .png, .jpg, .jpeg, .pdf, or .txt file.");
      setTicketUploadSuccess(null);
      return;
    }

    setIsUploadingTicket(true);
    setTicketUploadError(null);
    setTicketUploadSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const resultStr = reader.result as string;
        const base64Data = resultStr.split(",")[1] || resultStr;
        const mimeType = file.type || "application/octet-stream";

        try {
          const response = await fetch("/api/parse-ticket", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              base64Data,
              mimeType,
              fileName: file.name
            })
          });

          const data = await response.json();
          if (data.success) {
            if (data.trainNumber) {
              setNewTrainNumber(data.trainNumber);
            }
            if (data.departureDate && data.departureTime) {
              setNewDateTime(`${data.departureDate}T${data.departureTime}`);
            } else if (data.departureDate) {
              setNewDateTime(`${data.departureDate}T12:00`);
            }
            
            // Set dynamic title if empty
            if (!newTitle) {
              setNewTitle(`Train Travel - Train #${data.trainNumber || "Ticket"}`);
            }
            
            // Append details note to description
            setNewDescription(prev => {
              const note = `Auto-extracted from ticket: Train #${data.trainNumber || "N/A"} on ${data.departureDate || "N/A"} at ${data.departureTime || "N/A"}.`;
              return prev ? `${prev}\n\n${note}` : note;
            });

            setTicketUploadSuccess(`Parsed successfully! Train #${data.trainNumber || "N/A"} departure set to ${data.departureDate || ""} ${data.departureTime || ""}.`);
          } else {
            setTicketUploadError(data.error || "Failed to parse ticket details.");
          }
        } catch (err) {
          console.error("API call error:", err);
          setTicketUploadError("Network error. Could not reach parsing service.");
        } finally {
          setIsUploadingTicket(false);
        }
      };

      reader.onerror = () => {
        setTicketUploadError("Failed to read file.");
        setIsUploadingTicket(false);
      };

      reader.readAsDataURL(file);

    } catch (err) {
      console.error("File upload error:", err);
      setTicketUploadError("An error occurred during file upload.");
      setIsUploadingTicket(false);
    }
  };

  // Selected task detail / AI helper view
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Swipe to remove/manage task states
  const [swipedTask, setSwipedTask] = useState<Task | null>(null);
  const [swipeActionView, setSwipeActionView] = useState<"options" | "update">("options");
  const [swipeUpdateTitle, setSwipeUpdateTitle] = useState("");
  const [swipeUpdateDescription, setSwipeUpdateDescription] = useState("");
  const [swipeUpdateDateTime, setSwipeUpdateDateTime] = useState("");

  // Active alerts list (for reminders that fired)
  const [alerts, setAlerts] = useState<ReminderAlert[]>([]);
  
  // Interactive Reminder Bell and animation states
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const prevActiveCountRef = useRef(0);

  useEffect(() => {
    const activeCount = alerts.filter(a => !a.isDismissed).length;
    if (activeCount > prevActiveCountRef.current) {
      setIsRinging(true);
      const timer = setTimeout(() => setIsRinging(false), 2500);
      return () => clearTimeout(timer);
    }
    prevActiveCountRef.current = activeCount;
  }, [alerts]);
  
  // Highlighting recent additions
  const [recentCount, setRecentCount] = useState(0);

  // App settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaults: AppSettings = {
      displayMode: "dark",
      alarmSound: "default",
      customSounds: [],
      vibratePattern: "basic",
      viewOption: "popup",
      travelBufferThreshold: 30
    };
    try {
      const saved = localStorage.getItem("sentinel_settings");
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error(e);
    }
    return defaults;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Dynamic system theme listener state
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Determine active theme
  const isDark = settings.displayMode === "system" ? systemIsDark : settings.displayMode === "dark";

  // Handle saving settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem("sentinel_settings", JSON.stringify(newSettings));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  };

  // Refs for tracking active alarm sound & vibration playback
  const activeAlarmIdRef = React.useRef<string | null>(null);
  const alarmTimeoutIdRef = React.useRef<any>(null);
  const alarmIntervalIdRef = React.useRef<any>(null);
  const vibrationIntervalIdRef = React.useRef<any>(null);
  const audioInstanceRef = React.useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const playedAlertIdsRef = React.useRef<Set<string>>(new Set());

  // Function to play sound using custom Audio or standard Web Audio Oscillator Beep
  const playSynthesizedBeep = (isStrong: boolean) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (isStrong) {
        // Urgent high pitch double-beep for strong alarm
        osc.type = "sine";
        osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        // Second beep shortly after
        setTimeout(() => {
          try {
            const ctx2 = new AudioContextClass();
            const osc2 = ctx2.createOscillator();
            const gain2 = ctx2.createGain();
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(987.77, ctx2.currentTime);
            gain2.gain.setValueAtTime(0.4, ctx2.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.3);
            osc2.connect(gain2);
            gain2.connect(ctx2.destination);
            osc2.start();
            osc2.stop(ctx2.currentTime + 0.3);
          } catch(e) {}
        }, 150);
      } else {
        // Mild warning sound (single clear tone)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      }
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio synthesis failed", e);
    }
  };

  const playCustomAudio = (url: string) => {
    try {
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
      }
      const aud = new Audio(url);
      aud.loop = true; // Loop custom sound during the alarm duration
      audioInstanceRef.current = aud;
      aud.play().catch(e => console.log("Custom sound playback failed", e));
    } catch (e) {
      console.error(e);
    }
  };

  const playVibrationPattern = (pattern: string) => {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    if (pattern === "basic") {
      navigator.vibrate(200);
    } else if (pattern === "heartbeat") {
      navigator.vibrate([150, 100, 150]);
    } else if (pattern === "zig-zag") {
      navigator.vibrate([100, 50, 100, 50, 100]);
    } else if (pattern === "tick-tock") {
      navigator.vibrate([50, 250, 50]);
    }
  };

  const stopActiveAlarm = () => {
    // 1. Clear timeout and intervals
    if (alarmTimeoutIdRef.current) {
      clearTimeout(alarmTimeoutIdRef.current);
      alarmTimeoutIdRef.current = null;
    }
    if (alarmIntervalIdRef.current) {
      clearInterval(alarmIntervalIdRef.current);
      alarmIntervalIdRef.current = null;
    }
    if (vibrationIntervalIdRef.current) {
      clearInterval(vibrationIntervalIdRef.current);
      vibrationIntervalIdRef.current = null;
    }
    
    // 2. Stop custom Audio instances
    if (audioInstanceRef.current) {
      try {
        audioInstanceRef.current.pause();
      } catch(e) {}
      audioInstanceRef.current = null;
    }
    
    // 3. Stop AudioContext
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch(e){}
      audioCtxRef.current = null;
    }
    
    // 4. Cancel active browser vibration
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0);
    }
    
    activeAlarmIdRef.current = null;
  };

  // Sound and vibration notification effect
  useEffect(() => {
    if (settings.pauseReminders) {
      stopActiveAlarm();
      return;
    }

    const activeAlerts = alerts.filter(a => !a.isDismissed);
    
    // Auto-stop currently running sound/vibration if the active alert is dismissed/completed
    if (activeAlarmIdRef.current) {
      const isStillActive = activeAlerts.some(a => a.id === activeAlarmIdRef.current);
      if (!isStillActive) {
        stopActiveAlarm();
      }
    }

    // Identify if any active alerts of matching types need to trigger
    const alertToTrigger = activeAlerts.find(a => {
      const isTargetType = a.type === "30_min_mild" || a.type === "5_min_strong" || a.type === "meeting_1h_strong" || a.type === "flight_airport";
      return isTargetType && !playedAlertIdsRef.current.has(a.id);
    });

    if (alertToTrigger) {
      // Mark it as played so it doesn't trigger repeatedly
      playedAlertIdsRef.current.add(alertToTrigger.id);
      
      // Stop any active alarms
      stopActiveAlarm();
      
      const isStrong = alertToTrigger.type !== "30_min_mild";
      // 10 seconds for "30_min_mild" (mildly strong), 30 seconds for strong ("5_min_strong" / "meeting_1h_strong" / "flight_airport")
      const durationMs = alertToTrigger.type === "30_min_mild" ? 10000 : 30000;
      
      activeAlarmIdRef.current = alertToTrigger.id;
      
      // 1. Play Sound
      const customObj = settings.customSounds.find(s => s.name === settings.alarmSound);
      if (settings.alarmSound !== "default" && customObj && customObj.url) {
        playCustomAudio(customObj.url);
      } else {
        // Initial beep
        playSynthesizedBeep(isStrong);
        // Repeat beep interval
        const repeatRate = isStrong ? 1000 : 2000;
        alarmIntervalIdRef.current = setInterval(() => {
          playSynthesizedBeep(isStrong);
        }, repeatRate);
      }
      
      // 2. Play Vibration
      playVibrationPattern(settings.vibratePattern);
      const vibRate = isStrong ? 1200 : 2500;
      vibrationIntervalIdRef.current = setInterval(() => {
        playVibrationPattern(settings.vibratePattern);
      }, vibRate);
      
      // 3. Schedule automatic stop
      alarmTimeoutIdRef.current = setTimeout(() => {
        stopActiveAlarm();
      }, durationMs);
    }
  }, [alerts, settings]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      stopActiveAlarm();
    };
  }, []);

  // ---------------------------------------------------------
  // Automatic Reminder Engine & Train Live tracking checks
  // ---------------------------------------------------------
  useEffect(() => {
    if (settings.pauseReminders) return;

    const activeTasks = tasks.filter(t => t.status === "pending");

    // Handle alert generation transactionally to completely eliminate duplicate keys
    setAlerts(prev => {
      let changed = false;
      const updated = [...prev];

      activeTasks.forEach(task => {
        const taskTime = new Date(task.dateTime).getTime();
        const nowTime = simulatedTime.getTime();
        const diffMs = taskTime - nowTime;
        const diffMins = Math.round(diffMs / (60 * 1000));
        const diffHours = diffMs / (60 * 60 * 1000);

        // Rule 1: Mild Reminder when 30 minutes are left
        if (diffMins <= 30 && diffMins > 5) {
          const alertId = `${task.id}-30m`;
          if (!updated.some(a => a.id === alertId)) {
            updated.push({
              id: alertId,
              taskId: task.id,
              taskTitle: task.title,
              type: "30_min_mild",
              message: `⚠️ Mild Reminder: "${task.title}" starts in 30 minutes (${diffMins}m left). Ensure your materials are prepared.`,
              timeRemainingMinutes: diffMins,
              isDismissed: false
            });
            changed = true;
          }
        }

        // Rule 1: Strong Reminder Popup when 5 minutes are left
        if (diffMins <= 5 && diffMins >= -10) {
          const alertId = `${task.id}-5m`;
          if (!updated.some(a => a.id === alertId)) {
            updated.push({
              id: alertId,
              taskId: task.id,
              taskTitle: task.title,
              type: "5_min_strong",
              message: `🚨 CRITICAL REMINDER: Only ${diffMins <= 0 ? "0" : diffMins} minutes left for "${task.title}"! Take immediate action.`,
              timeRemainingMinutes: diffMins <= 0 ? 0 : diffMins,
              isDismissed: false
            });
            changed = true;
          }
        }

        // Rule 5: Flight Check-in reminder 1 day (24 hours) before departure
        if (task.category === "travel_flight") {
          if (diffHours <= 24.5 && diffHours >= 20) {
            const alertId = `${task.id}-flight-24h`;
            if (!updated.some(a => a.id === alertId)) {
              updated.push({
                id: alertId,
                taskId: task.id,
                taskTitle: task.title,
                type: "flight_checkin",
                message: `✈️ Web Check-in Alert: Your flight "${task.title}" is in ${Math.round(diffHours)} hours. Web check-in is now open!`,
                isDismissed: false
              });
              changed = true;
            }
          }

          // Rule 5: Reach airport 5 hours before departure time
          if (diffHours <= 5.5 && diffHours >= 4.5) {
            const alertId = `${task.id}-flight-5h`;
            if (!updated.some(a => a.id === alertId)) {
              updated.push({
                id: alertId,
                taskId: task.id,
                taskTitle: task.title,
                type: "flight_airport",
                message: `🚗 Airport Buffer Alert: Your flight departs in 5 hours. Please start traveling to reach the airport on time.`,
                isDismissed: false
              });
              changed = true;
            }
          }
        }

        // Rule 6: Meetings / Project submissions approaching reminders
        if (task.category === "meeting" || task.category === "project") {
          // 1 hour before submission (strong)
          if (diffHours <= 1.0 && diffMins > 0) {
            const alertId = `${task.id}-meeting-1h`;
            if (!updated.some(a => a.id === alertId)) {
              updated.push({
                id: alertId,
                taskId: task.id,
                taskTitle: task.title,
                type: "meeting_1h_strong",
                message: `⚠️ STRONG URGENCY: "${task.title}" starts/is-due in 1 hour! Review your materials immediately.`,
                timeRemainingMinutes: diffMins,
                isDismissed: false
              });
              changed = true;
            }
          }

          // 1 day before submission (full screen reminder trigger)
          if (diffHours <= 24.0 && diffHours >= 18.0) {
            const alertId = `${task.id}-meeting-1d`;
            if (!updated.some(a => a.id === alertId)) {
              updated.push({
                id: alertId,
                taskId: task.id,
                taskTitle: task.title,
                type: "meeting_1d_fullscreen",
                message: `📅 CRITICAL 24-HOUR NOTICE: "${task.title}" is due tomorrow! Plan your deliverables.`,
                isDismissed: false
              });
              changed = true;
            }
          }
        }
      });

      return changed ? updated : prev;
    });
  }, [simulatedTime, tasks]);

  // Automatically remove tasks that are past their deadline by more than 1 day (24 hours)
  useEffect(() => {
    const nowTime = simulatedTime.getTime();
    const tasksToRemove = tasks.filter(task => {
      const taskTime = new Date(task.dateTime).getTime();
      return (nowTime - taskTime) > 24 * 60 * 60 * 1000;
    });

    if (tasksToRemove.length > 0) {
      const idsToRemove = new Set(tasksToRemove.map(t => t.id));
      setTasks(prev => prev.filter(t => !idsToRemove.has(t.id)));
      setAlerts(prev => prev.filter(a => !idsToRemove.has(a.taskId)));
      if (selectedTask && idsToRemove.has(selectedTask.id)) {
        setSelectedTask(null);
      }
      console.log(`[Rolling Queue] Automatically removed ${tasksToRemove.length} task(s) past 1d deadline threshold.`);
    }
  }, [simulatedTime, tasks, selectedTask]);

  // Add a task
  const handleAddTask = (taskData: Omit<Task, "id" | "createdTime" | "isAddedRecently">) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdTime: new Date(simulatedTime).toISOString(),
      isAddedRecently: true // Shows the notification bubble highlight
    };

    setTasks(prev => [newTask, ...prev]);
    setRecentCount(prev => prev + 1);

    // Auto load suggestion with static local defaults
    loadSuggestionsForTask(newTask, false);
  };

  // Handle manual additions
  const handleCreateTaskSubmit = (e) => {
    e.preventDefault();
    if (!newTitle) return;

    // Default datetime calculation if blank
    const dTime = newDateTime || new Date(simulatedTime.getTime() + 45 * 60 * 1000).toISOString();

    handleAddTask({
      title: newTitle,
      description: newDescription,
      category: newCategory,
      dateTime: new Date(dTime).toISOString(),
      status: "pending",
      trainNumber: newCategory === "travel_train" ? newTrainNumber : undefined,
      flightNumber: newCategory === "travel_flight" ? newFlightNumber : undefined,
      callerName: newCategory === "call" ? newCallerName : undefined,
      callerRole: newCategory === "call" ? newCallerRole : undefined,
    });

    // Reset inputs
    setNewTitle("");
    setNewDescription("");
    setNewCategory("project");
    setNewDateTime("");
    setNewTrainNumber("");
    setNewFlightNumber("");
    setNewCallerName("");
    setNewCallerRole("other");
    setTicketUploadError(null);
    setTicketUploadSuccess(null);
    setIsAddingTask(false);
  };

  // Run customized AI suggest engine or offline model mapping
  const loadSuggestionsForTask = async (task: Task, forceReloadAi = false) => {
    if (task.suggestionsLoaded && !forceReloadAi) return;

    if (forceReloadAi) {
      setIsAnalyzing(true);
    }

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          category: task.category,
          userRole: profile.role
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id
              ? { ...t, suggestionsLoaded: true, suggestionsData: data }
              : t
          )
        );
        // Sync selected task if currently open
        if (selectedTask && selectedTask.id === task.id) {
          setSelectedTask(prev => prev ? { ...prev, suggestionsLoaded: true, suggestionsData: data } : null);
        }
      }
    } catch (e) {
      console.error("Suggestion error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dismiss alert
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isDismissed: true } : a));
  };

  // Change task status (Mark complete / Dismiss)
  const changeTaskStatus = (taskId: string, status: "pending" | "completed" | "dismissed") => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    // Clear relevant alerts
    setAlerts(prev => prev.map(a => a.taskId === taskId ? { ...a, isDismissed: true } : a));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status } : null);
    }
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setAlerts(prev => prev.filter(a => a.taskId !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  // Trigger swiped task options modal
  const triggerSwipeAction = (task: Task) => {
    setSwipedTask(task);
    setSwipeActionView("options");
    setSwipeUpdateTitle(task.title);
    setSwipeUpdateDescription(task.description);
    setSwipeUpdateDateTime(task.dateTime);
  };

  // Perform time increment
  const handleIncrementSwipeTime = (minutes: number) => {
    try {
      const currentVal = new Date(swipeUpdateDateTime);
      if (!isNaN(currentVal.getTime())) {
        const newVal = new Date(currentVal.getTime() + minutes * 60000);
        setSwipeUpdateDateTime(newVal.toISOString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save the updated task
  const handleSaveSwipeUpdate = () => {
    if (!swipedTask) return;
    setTasks(prev => prev.map(t => t.id === swipedTask.id ? {
      ...t,
      title: swipeUpdateTitle,
      description: swipeUpdateDescription,
      dateTime: swipeUpdateDateTime,
      status: t.status !== "pending" ? "pending" as const : t.status
    } : t));

    // Also sync with selectedTask if active
    if (selectedTask?.id === swipedTask.id) {
      setSelectedTask(prev => prev ? {
        ...prev,
        title: swipeUpdateTitle,
        description: swipeUpdateDescription,
        dateTime: swipeUpdateDateTime,
        status: prev.status !== "pending" ? "pending" as const : prev.status
      } : null);
    }

    setSwipedTask(null);
  };

  // Simulate advancing time
  const advanceSimulatedTime = (minutes: number) => {
    const nextTime = new Date(simulatedTime.getTime() + minutes * 60 * 1000);
    setSimulatedTime(nextTime);
  };

  // Clear new items bubble
  const clearRecentHighlight = () => {
    setRecentCount(0);
    setTasks(prev => prev.map(t => ({ ...t, isAddedRecently: false })));
  };

  // Sorted list of tasks based on our smart contextual priority criteria
  const sortedTasks = sortTasks(tasks, simulatedTime);

  // Separate recent tasks specifically for the visual highlight widget
  const recentAdditionsList = tasks.filter(t => t.isAddedRecently);

  // Active floating alert (Rule 1: Strong popup when 5 mins left, flight airport criticals, or meeting 1h strong alerts)
  // If viewOption is "popup", also include activeFullscreenAlert in this list so it renders as a popup in the right column!
  const activePopups = [
    ...alerts.filter(
      a => !a.isDismissed && (a.type === "5_min_strong" || a.type === "flight_airport" || a.type === "meeting_1h_strong")
    ),
    ...(settings.viewOption === "popup" && alerts.find(a => !a.isDismissed && a.type === "meeting_1d_fullscreen") 
      ? [alerts.find(a => !a.isDismissed && a.type === "meeting_1d_fullscreen")!] 
      : [])
  ];

  // Active full-screen alert for 1-day proximity deadlines, or critical alerts if settings.viewOption is fullscreen
  const activeFullscreenAlert = settings.viewOption === "fullscreen"
    ? (alerts.find(a => !a.isDismissed && a.type === "meeting_1d_fullscreen") || alerts.find(a => !a.isDismissed && (a.type === "5_min_strong" || a.type === "flight_airport" || a.type === "meeting_1h_strong")))
    : undefined;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#0D0B21] via-[#0A0917] to-[#0E152F] text-slate-300 font-sans flex flex-col selection:bg-violet-500/30 selection:text-white">
      
      {/* CONDITIONAL LIGHT MODE STYLE SHEET OVERRIDE */}
      {!isDark && (
        <style dangerouslySetInnerHTML={{ __html: `
          body, html {
            background-color: #EFF1FE !important;
            color: #1E1B4B !important;
          }
          
          /* 1. Base wrapper & header styles */
          .bg-gradient-to-br {
            background: #EFF1FE !important;
          }
          header {
            background-color: #1A0E30 !important; /* navbar is ALWAYS dark-violet! */
            border-color: #2E1A4E !important;
            box-shadow: 0 4px 12px rgba(26, 14, 48, 0.15) !important;
          }
          /* Ensure header contents stay light/readable on dark-violet navbar in light mode */
          header h1, header h2, header h3, header h4, header h5, header h6, header .text-white, header .text-slate-100, header .text-slate-200 {
            color: #FFFFFF !important;
          }
          header .text-slate-300 {
            color: #D1D5DB !important;
          }
          header .text-slate-400 {
            color: #9CA3AF !important;
          }
          header .text-slate-500 {
            color: #A78BFA !important; /* beautiful violet accent */
          }

          /* 2. Glass Container panels - Light Mode Glassmorphism with black/dark violet text */
          #timeline-controls-banner, 
          #recent-additions-widget, 
          #profile-panel, 
          #scanner-simulator, 
          #secure-call-logs, 
          #secure-sms-inbox, 
          #flutter-taskline-simulator, 
          #settings-modal > div, 
          #fullscreen-urgency-modal > div, 
          #swipe-options-modal > div,
          #bell-reminders-dropdown {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(139, 92, 246, 0.25) !important;
            color: #120A2A !important;
            box-shadow: 0 8px 32px 0 rgba(139, 92, 246, 0.08) !important;
          }
          #bell-reminders-dropdown p, #bell-reminders-dropdown span, #bell-reminders-dropdown button {
            color: #120A2A !important;
          }
          
          .bg-\\[\\#161619\\], .task-block-recent {
            background-color: rgba(255, 255, 255, 0.4) !important;
            border-color: rgba(139, 92, 246, 0.2) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
          }

          /* Task category soft backgrounds for light mode (kept as before) */
          .task-block-call {
            background-color: #FEF2F2 !important; /* Soft rose background */
            border-color: #FEE2E2 !important;
          }
          .task-block-call:hover {
            background-color: #FFE4E4 !important;
            border-color: #FCA5A5 !important;
          }
          
          .task-block-travel {
            background-color: #FFFBEB !important; /* Soft amber background */
            border-color: #FEF3C7 !important;
          }
          .task-block-travel:hover {
            background-color: #FFF9DB !important;
            border-color: #FCD34D !important;
          }
          
          .task-block-project {
            background-color: #EFF6FF !important; /* Soft blue background */
            border-color: #DBEAFE !important;
          }
          .task-block-project:hover {
            background-color: #E0F2FE !important;
            border-color: #BAE6FD !important;
          }
          
          .task-block-other {
            background-color: #F8FAFC !important; /* Soft slate background */
            border-color: #E2E8F0 !important;
          }
          .task-block-other:hover {
            background-color: #F1F5F9 !important;
            border-color: #CBD5E1 !important;
          }

          .task-block-selected {
            background-color: #FFFFFF !important;
            border-color: #8B5CF6 !important; /* Strong violet highlight border */
            box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.15) !important;
          }

          .task-block-recent {
            background-color: rgba(255, 255, 255, 0.4) !important;
            border-color: rgba(139, 92, 246, 0.2) !important;
          }
          .task-block-recent:hover {
            background-color: rgba(255, 255, 255, 0.6) !important;
            border-color: rgba(139, 92, 246, 0.35) !important;
          }
          .bg-black\\/40, .bg-black\\/30, .bg-black\\/20, .bg-slate-950 {
            background-color: rgba(255, 255, 255, 0.3) !important; /* soft violet-blue tint */
            border-color: rgba(139, 92, 246, 0.15) !important;
          }

          /* Set all elements with bg-slate-900 and its variants to bg-slate-300 (#cbd5e1) in light mode */
          .bg-slate-900,
          .bg-slate-900\\/30,
          .bg-slate-900\\/40,
          .bg-slate-900\\/50,
          .bg-slate-900\\/60,
          .bg-slate-900\\/80,
          .hover\\:bg-slate-900:hover {
            background-color: #cbd5e1 !important;
            color: #120A2A !important;
            border-color: rgba(139, 92, 246, 0.2) !important;
          }

          /* 3. Safe, warning, and critical alert mapping */
          .bg-\\[\\#111c2a\\], .bg-sky-950\\/40 {
            background-color: rgba(239, 246, 255, 0.6) !important;
            border-color: rgba(147, 197, 253, 0.4) !important;
          }
          .bg-\\[\\#1a1b14\\], .bg-\\[\\#18120B\\], .bg-amber-500\\/5 {
            background-color: rgba(255, 251, 235, 0.6) !important;
            border-color: rgba(252, 211, 77, 0.4) !important;
          }
          .bg-rose-950\\/40 {
            background-color: rgba(254, 242, 242, 0.6) !important;
            border-color: rgba(252, 165, 165, 0.4) !important;
          }

          /* 4. Text contrast overrides (excluding header) */
          h1:not(header *), h2:not(header *), h3:not(header *), h4:not(header *), h5:not(header *), h6:not(header *), .text-white:not(header *), .text-slate-100:not(header *), .text-slate-200:not(header *) {
            color: #0F0229 !important; /* Rich deep indigo/violet */
          }
          .text-slate-300:not(header *), .text-slate-400:not(header *) {
            color: #1F104D !important; /* Medium blue/violet */
          }
          .text-slate-500:not(header *) {
            color: #3B2A80 !important; /* Soft indigo */
          }
          .text-amber-500, .text-amber-400, .text-amber-300 {
            color: #B45309 !important;
          }
          .text-rose-400, .text-rose-500 {
            color: #DC2626 !important;
          }
          .text-sky-400 {
            color: #2563EB !important;
          }
          
          /* 5. Border overrides */
          header, section, .border-white\\/5, .border-white\\/10, .border-white\\/15, .border-white\\/20, .border-slate-800, .border-slate-700 {
            border-color: rgba(139, 92, 246, 0.2) !important;
          }

          /* 6. Form inputs and dropdown lists */
          input, select, textarea {
            background-color: rgba(255, 255, 255, 0.6) !important;
            border-color: rgba(139, 92, 246, 0.25) !important;
            color: #120A2A !important;
          }
          input::placeholder {
            color: #3B2A80 !important;
            opacity: 0.6;
          }
          select option {
            background-color: #FFFFFF !important;
            color: #120A2A !important;
          }

          /* 7. Button overrides */
          .hover\\:bg-white\\/5:hover {
            background-color: rgba(139, 92, 246, 0.08) !important;
          }
          .hover\\:bg-white\\/10:hover {
            background-color: rgba(139, 92, 246, 0.12) !important;
          }
          button.bg-white\\/5, button.bg-white\\/10 {
            background-color: rgba(255, 255, 255, 0.3) !important;
            border-color: rgba(139, 92, 246, 0.2) !important;
            color: #1F104D !important;
          }
          button.bg-white\\/5:hover, button.bg-white\\/10:hover {
            background-color: rgba(255, 255, 255, 0.5) !important;
            color: #120A2A !important;
          }
          button.bg-amber-500 {
            background-color: #D97706 !important;
            color: #FFFFFF !important;
          }
          button.bg-amber-500:hover {
            background-color: #B45309 !important;
          }

          /* 8. Modals overlays, structures and drop shadow details */
          #settings-modal > div, #fullscreen-urgency-modal > div, #profile-modal > div, #swipe-options-modal > div {
            background: rgba(255, 255, 255, 0.7) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(139, 92, 246, 0.3) !important;
            color: #120A2A !important;
            box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.25) !important;
          }
          #settings-modal .bg-slate-950, #settings-modal .bg-black\\/20, #settings-modal .bg-black\\/30, #settings-modal .bg-black\\/40 {
            background-color: rgba(255, 255, 255, 0.4) !important;
            border-color: rgba(139, 92, 246, 0.15) !important;
          }
          #settings-modal select, #settings-modal input, #settings-modal label {
            color: #120A2A !important;
          }
          .fixed.inset-0.bg-\\[\\#070708\\]\\/95, .fixed.inset-0.bg-black\\/80 {
            background-color: rgba(30, 27, 75, 0.35) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
          }
        ` }} />
      )}

      {/* SETTINGS PANEL MODAL */}
      {isSettingsOpen && (
        <SettingsPanel
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      
      {/* FULL-SCREEN 24H DEADLINE REMINDER */}
      {activeFullscreenAlert && (
        <div id="fullscreen-urgency-modal" className="fixed inset-0 bg-[#070708]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-2xl bg-gradient-to-b from-[#18181B] to-[#0F0F11] border border-amber-500/30 rounded-3xl p-10 space-y-8 shadow-2xl shadow-amber-500/5">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <span className="text-xs uppercase tracking-widest text-amber-500 font-bold bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10">
                {activeFullscreenAlert.type === "meeting_1d_fullscreen" 
                  ? "CRITICAL 24-HOUR DEADLINE WARNING"
                  : activeFullscreenAlert.type === "5_min_strong"
                    ? "IMMEDIATE 5-MINUTE ACTION ALARM"
                    : activeFullscreenAlert.type === "flight_airport"
                      ? "FLIGHT TRAVEL BUFFER ALARM"
                      : "CRITICAL SYSTEM URGENCY ALERT"}
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {activeFullscreenAlert.taskTitle}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {activeFullscreenAlert.message}
              </p>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3 text-left">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-xs text-slate-400">
                This item has been dynamically elevated in your **Rolling Priority Queue** ahead of lower-tier tasks to guarantee completion.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  dismissAlert(activeFullscreenAlert.id);
                  changeTaskStatus(activeFullscreenAlert.taskId, "completed");
                }}
                className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/10"
              >
                Mark Task Completed
              </button>
              <button
                onClick={() => dismissAlert(activeFullscreenAlert.id)}
                className="py-3 px-6 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border border-white/5 cursor-pointer"
              >
                Acknowledge & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="h-18 border-b border-violet-900/20 flex items-center justify-between px-6 bg-[#1A0E30]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-500/15 rounded-xl flex items-center justify-center border border-violet-500/30">
            <div className="w-3.5 h-3.5 bg-violet-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-widest uppercase text-white">
              TASKLINE
            </h1>
            <p className="text-[11px] md:text-[14px] text-slate-400 font-bold uppercase tracking-widest">Interactive Deadline Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Interactive Reminder Bell Button */}
          <div className="relative inline-block text-left">
            <button
              id="bell-notification-btn"
              onClick={() => setIsRemindersOpen(!isRemindersOpen)}
              className="relative w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition shrink-0"
              title="View Reminders"
            >
              <motion.div
                animate={isRinging ? {
                  rotate: [0, -20, 20, -20, 20, -10, 10, -5, 5, 0],
                } : {}}
                transition={{ duration: 0.8 }}
              >
                <Bell 
                  className={`w-5 h-5 ${
                    alerts.filter(a => !a.isDismissed).length > 0 
                      ? "fill-blue-500 text-blue-500 animate-pulse" 
                      : "text-blue-500"
                  }`} 
                />
              </motion.div>
              
              {alerts.filter(a => !a.isDismissed).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1A0E30]">
                  {alerts.filter(a => !a.isDismissed).length}
                </span>
              )}
            </button>

            {/* Dropdown interactive reminder section */}
            {isRemindersOpen && (
              <>
                {/* Backdrop overlay to catch click-outs */}
                <div className="fixed inset-0 z-40" onClick={() => setIsRemindersOpen(false)} />
                
                <div 
                  id="bell-reminders-dropdown" 
                  className="absolute right-0 mt-2 w-80 bg-[#141416]/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-96 backdrop-blur-md"
                >
                  <div className="p-3.5 border-b border-white/5 flex items-center justify-between bg-[#1A0E30]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400 fill-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Active Reminders</span>
                    </div>
                    {alerts.filter(a => !a.isDismissed).length > 0 && (
                      <button
                        onClick={() => {
                          setAlerts(prev => prev.map(a => ({ ...a, isDismissed: true })));
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="p-2 overflow-y-auto divide-y divide-white/5 max-h-72">
                    {alerts.filter(a => !a.isDismissed).length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 italic">
                        No active reminders
                      </div>
                    ) : (
                      alerts.filter(a => !a.isDismissed).map(alert => (
                        <div key={alert.id} className="p-3 space-y-2 text-xs hover:bg-white/5 transition">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-slate-300 leading-normal font-medium">{alert.message}</p>
                            <button
                              onClick={() => dismissAlert(alert.id)}
                              className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-bold uppercase transition shrink-0 cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                          <span className="text-[9px] text-slate-500 block font-mono capitalize">
                            {alert.type.replace("_", " ")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Global Manual Add Button */}
          <button
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black font-bold text-[12px] md:text-[14px] rounded-xl hover:bg-amber-400 cursor-pointer shadow-lg shadow-amber-500/10 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>ADD TASK</span>
          </button>

          {/* Settings Gear Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 cursor-pointer transition hover:rotate-45 duration-300 shrink-0"
            title="Open TASKLINE Preferences"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Simulated Timeline Controls Banner - Placed just below Navbar */}
      <div id="timeline-controls-banner" className="bg-[#121024] border-b border-violet-950/40 py-3 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/10">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-violet-400 animate-pulse shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-bold text-violet-200 uppercase tracking-widest">Device-Linked Clock</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <p className="text-[12px] md:text-[14px] text-slate-400 mt-0.5 font-medium">
              Add time on given clock to test app functionalities quickly
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Simulated Time Display */}
          <div className="flex items-center gap-2 bg-black/40 px-3.5 py-1.5 rounded-xl border border-violet-500/20">
            <span className="text-[12px] md:text-[14px] text-violet-400 font-bold uppercase tracking-wider font-mono">Simulated Time:</span>
            <span className="font-mono text-xs md:text-sm font-bold text-white tracking-wide">
              {simulatedTime.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
              })}{" "}
              •{" "}
              {simulatedTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })}
            </span>
          </div>

          {/* Time Advancement Buttons */}
          <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => advanceSimulatedTime(5)}
              className="px-2.5 py-1 text-[11px] md:text-[14px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg font-bold uppercase transition cursor-pointer"
              title="Advance timeline by 5 mins"
            >
              +5m
            </button>
            <button
              onClick={() => advanceSimulatedTime(15)}
              className="px-2.5 py-1 text-[11px] md:text-[14px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg font-bold uppercase transition cursor-pointer"
              title="Advance timeline by 15 mins"
            >
              +15m
            </button>
            <button
              onClick={() => advanceSimulatedTime(30)}
              className="px-2.5 py-1 text-[11px] md:text-[14px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg font-bold uppercase transition cursor-pointer"
              title="Advance timeline by 30 mins"
            >
              +30m
            </button>
            <button
              onClick={() => advanceSimulatedTime(60)}
              className="px-2.5 py-1 text-[11px] md:text-[14px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg font-bold uppercase transition cursor-pointer"
              title="Advance timeline by 1 hour"
            >
              +1h
            </button>
            <button
              onClick={() => advanceSimulatedTime(24 * 60)}
              className="px-2.5 py-1 text-[11px] md:text-[14px] bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 rounded-lg font-bold uppercase transition cursor-pointer"
              title="Advance timeline by 1 day"
            >
              +24h
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-y-auto">
        
        {/* ACTIVE ALERTS BAR: Strong (5m) alerts stacked - Urgent notification section just below Simulated Time */}
        {activePopups.length > 0 && (
          <div className="col-span-12 bg-rose-950/40 border border-rose-500/30 p-5 rounded-xl space-y-3 relative ring-2 ring-rose-500/20 pulse-glow">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-rose-400">
                Critical Alarm: Action Required
              </h3>
            </div>

            <div className="space-y-3 overflow-hidden">
              {activePopups.map(alert => (
                <motion.div
                  key={alert.id}
                  drag="x"
                  dragConstraints={{ left: -150, right: 150 }}
                  dragElastic={0.4}
                  onDragEnd={(e, info) => {
                    if (Math.abs(info.offset.x) > 80) {
                      dismissAlert(alert.id);
                    }
                  }}
                  style={{ touchAction: "pan-y" }}
                  className="bg-rose-500/10 p-4 rounded-lg border border-rose-500/20 space-y-2 cursor-grab active:cursor-grabbing select-none"
                >
                  <p className="text-xs text-slate-200 leading-relaxed font-semibold">{alert.message}</p>
                  <span className="text-[9px] text-rose-400/50 block font-mono">↔ Swipe left/right or use buttons to stop alarm</span>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        dismissAlert(alert.id);
                        changeTaskStatus(alert.taskId, "completed");
                      }}
                      className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] uppercase rounded transition cursor-pointer"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="px-3 py-1.5 bg-[#141416] text-rose-400 hover:text-white border border-rose-500/20 rounded font-bold text-[10px] uppercase transition cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* LEFT COLUMN: Intelligence Priority Queue (7 Cols) */}
        <section className="col-span-12 lg:col-span-7 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
                Contextual Priority Queue
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Automatically sorted based on neural priority weightings (Call &gt; Travel &gt; Project)
              </p>
            </div>
            
            <span className="text-[10px] text-slate-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded">
              Total Pending: {tasks.filter(t => t.status === "pending").length}
            </span>
          </div>

          {/* Quick Filter Status Bar */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-slate-500 font-medium">Auto-Priority Stack:</span>
            <span className="text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">1. Missed Calls (Family/Work)</span>
            <span className="text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">2. Travel Tickets</span>
            <span className="text-sky-400 bg-sky-500/5 px-2 py-0.5 rounded border border-sky-500/10">3. Meetings & Projects</span>
            <span className="text-slate-400 bg-slate-500/5 px-2 py-0.5 rounded border border-slate-500/10">4. Utilities & Other</span>
          </div>

          {/* Sorted Tasks Render */}
          <div className="space-y-4">
            {sortedTasks.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-[#0D0D0E]">
                <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-semibold">No critical deadlines active</p>
                <p className="text-slate-500 text-xs mt-1">Use the Manual Add button or Simulator to trigger task detection</p>
              </div>
            ) : (
              sortedTasks.map(task => {
                const priorityInfo = getPriorityTierLabel(task, simulatedTime);
                const isPending = task.status === "pending";
                const isCompleted = task.status === "completed";
                const taskTime = new Date(task.dateTime);
                const diffMins = Math.round((taskTime.getTime() - simulatedTime.getTime()) / (60 * 1000));
                
                // Live train info link if checked
                const trainStatus = null;

                // Automated Delay Risk Indicator logic
                const delayRisk = (() => {
                  if (task.category !== "travel_train" && task.category !== "travel_flight") return null;
                  if (!isPending) return null;
                  
                  const threshold = settings.travelBufferThreshold || 30;
                  const minutesDelayed = trainStatus ? trainStatus.minutesDelayed : 0;
                  const isCancelled = trainStatus?.status === "cancelled";
                  
                  // Check cancellation first
                  if (isCancelled) {
                    return {
                      level: "critical",
                      label: "CRITICAL RISK",
                      color: "text-rose-400 border-rose-500/30 bg-rose-500/5",
                      message: "Train CANCELLED! Safety buffer is fully compromised."
                    };
                  }
                  
                  // Remaining time
                  if (diffMins < 0) {
                    return {
                      level: "critical",
                      label: "CRITICAL RISK",
                      color: "text-rose-400 border-rose-500/30 bg-rose-500/5",
                      message: "Departure time passed."
                    };
                  }

                  // Buffer violation
                  if (diffMins < threshold) {
                    if (diffMins < 10) {
                      return {
                        level: "critical",
                        label: "CRITICAL RISK",
                        color: "text-rose-400 border-rose-500/30 bg-rose-500/5",
                        message: `Buffer depleted! Only ${diffMins}m until departure (Preferred: ${threshold}m).`
                      };
                    } else {
                      return {
                        level: "moderate",
                        label: "MODERATE RISK",
                        color: "text-amber-400 border-amber-500/30 bg-amber-500/5",
                        message: `Buffer compromised: ${diffMins}m remaining (User preference: ${threshold}m).`
                      };
                    }
                  }

                  // Check delay
                  if (minutesDelayed > 15) {
                    return {
                      level: "critical",
                      label: "CRITICAL RISK",
                      color: "text-rose-400 border-rose-500/30 bg-rose-500/5",
                      message: `Train delayed by ${minutesDelayed}m. This reduces your connection transfer buffer!`
                    };
                  } else if (minutesDelayed > 0) {
                    return {
                      level: "moderate",
                      label: "MODERATE RISK",
                      color: "text-amber-400 border-amber-500/30 bg-amber-500/5",
                      message: `Train delayed by ${minutesDelayed}m. Minor safety buffer compromise.`
                    };
                  }

                  return {
                    level: "low",
                    label: "LOW RISK",
                    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
                    message: `Safety transition buffer safe (${diffMins}m remaining against preferred ${threshold}m).`
                  };
                })();

                return (
                  <div key={task.id} className="relative overflow-hidden rounded-xl">
                    {/* Background swipe track - only for pending tasks */}
                    {isPending && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 via-[#111113] to-violet-600/30 flex justify-between items-center px-6 rounded-xl border border-dashed border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
                          <CheckCircle2 className="w-4 h-4" />
                          Swipe Left/Right to Manage ⟷
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-violet-400 font-bold font-mono">
                          Release to Resolve or Update
                          <Settings className="w-4 h-4" />
                        </div>
                      </div>
                    )}

                    {/* Draggable Task Card - only draggable when pending */}
                    <motion.div
                      drag={isPending ? "x" : false}
                      dragConstraints={isPending ? { left: 0, right: 0 } : undefined}
                      dragElastic={isPending ? 0.6 : undefined}
                      onDragEnd={isPending ? (event, info) => {
                        if (Math.abs(info.offset.x) > 85) {
                          triggerSwipeAction(task);
                        }
                      } : undefined}
                      onClick={() => {
                        setSelectedTask(task);
                        loadSuggestionsForTask(task, false);
                      }}
                      className={`group relative rounded-xl border p-5 transition cursor-grab active:cursor-grabbing text-left select-none ${
                        selectedTask?.id === task.id
                          ? "bg-[#161619] border-amber-500/50 shadow-md shadow-amber-500/5 task-block-selected"
                          : `bg-[#111113] border-white/5 hover:border-white/15 ${
                              task.category === "call" ? "task-block-call" :
                              task.category === "travel_train" || task.category === "travel_flight" ? "task-block-travel" :
                              task.category === "project" || task.category === "meeting" ? "task-block-project" : "task-block-other"
                            }`
                      } ${!isPending ? "opacity-50" : ""}`}
                    >
                      {/* Priority Indicator Line */}
                      <div
                        className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-xl ${
                          task.category === "call"
                            ? "bg-rose-500"
                            : task.category === "travel_train" || task.category === "travel_flight"
                            ? "bg-amber-500"
                            : task.category === "project" || task.category === "meeting"
                            ? "bg-sky-500"
                            : "bg-slate-600"
                        }`}
                      />

                      {/* Task Header info */}
                      <div className="flex justify-between items-start pl-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase border ${
                              task.category === "call"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : task.category === "travel_train" || task.category === "travel_flight"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : task.category === "project" || task.category === "meeting"
                                ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            }`}>
                              {task.category.replace("_", " ")}
                            </span>

                            <span className="text-[10px] text-slate-500 font-mono">
                              Detected: {new Date(task.createdTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>

                            {task.isAddedRecently && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase animate-pulse">
                                Recent Addition
                              </span>
                            )}

                            {isPending && (
                              <span className="text-[9px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                                ⟷ Swipe
                              </span>
                            )}
                          </div>

                          <h3 className={`text-base font-medium text-white group-hover:text-amber-400 transition mt-1.5 ${isCompleted ? "line-through text-slate-500" : ""}`}>
                            {task.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                            {task.description}
                          </p>
                        </div>

                        {/* Right Hand Metadata & Timing Counter */}
                        <div className="text-right pl-3 shrink-0">
                          {isPending ? (
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Time left</span>
                              <span className={`font-mono text-sm font-bold ${
                                diffMins <= 5 ? "text-rose-500 font-extrabold scale-110" : diffMins <= 30 ? "text-amber-500 animate-pulse" : "text-emerald-400"
                              }`}>
                                {diffMins < 0 ? (
                                  `Overdue by ${Math.abs(diffMins)}m`
                                ) : diffMins >= 60 ? (
                                  `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`
                                ) : (
                                  `${diffMins}m remaining`
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {taskTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-500 font-bold tracking-widest uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Train Live tracking quick status strip if available */}
                      {task.category === "travel_train" && trainStatus && isPending && (
                        <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-lg flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                            <span className="text-slate-400 font-medium">Live Train Status:</span>
                            <span className={`font-bold ${
                              trainStatus.status === "on-time" ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {trainStatus.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {trainStatus.currentStation}
                          </div>
                        </div>
                      )}

                      {/* Automated Delay Risk Indicator */}
                      {delayRisk && (
                        <div className={`mt-3 p-3 rounded-lg border flex flex-col gap-1 text-[11px] ${delayRisk.color}`}>
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1 uppercase tracking-wider text-[10px]">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              Delay Risk: {delayRisk.label}
                            </span>
                            <span className="text-[9px] font-mono opacity-80">
                              Buffer Goal: {settings.travelBufferThreshold}m
                            </span>
                          </div>
                          <p className="leading-relaxed opacity-90 font-medium">
                            {delayRisk.message}
                          </p>
                        </div>
                      )}

                      {/* Priority Indicator Badge */}
                      <div className="mt-3.5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] pl-2">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span>Classification:</span>
                          <span className={`font-semibold ${
                            task.category === "call" ? "text-rose-400" : task.category.startsWith("travel") ? "text-amber-400" : "text-sky-400"
                          }`}>
                            {priorityInfo.label}
                          </span>
                        </div>

                        {/* Interactive Actions */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {isPending ? (
                            <>
                              <button
                                onClick={() => triggerSwipeAction(task)}
                                className="px-2 py-1 bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 rounded font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1"
                                title="Raise Swipe resolution & update popup"
                              >
                                ⟷ Swipe Options
                              </button>
                              <button
                                onClick={() => changeTaskStatus(task.id, "completed")}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px] uppercase transition cursor-pointer"
                              >
                                Resolve
                              </button>
                              {task.category === "call" && (
                                <button
                                  onClick={() => {
                                    // Call resolution simulator
                                    alert(`Placing return callback to ${task.callerName || "Family/Contact"}. PNL logic activated!`);
                                    changeTaskStatus(task.id, "completed");
                                  }}
                                  className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded font-bold text-[10px] uppercase transition cursor-pointer"
                                >
                                  Callback Now
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => changeTaskStatus(task.id, "pending")}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 rounded font-semibold text-[10px] uppercase transition cursor-pointer"
                            >
                              Re-Open
                            </button>
                          )}
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 transition cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })
            )}
          </div>

          {/* Scanning & Integration Simulators */}
          <ScannerSimulator onAddTask={handleAddTask} simulatedTime={simulatedTime} />
        </section>

        {/* RIGHT COLUMN: Interactive Alert Center, Live Train status widget, Recent updates, and profile settings */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-6">

          {/* RECENT ADDITIONS WIDGET with notification badge */}
          <div id="recent-additions-widget" className="bg-[#111113] p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Recent Additions
                </h3>
              </div>
              {recentCount > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {recentCount}
                  </span>
                  <button
                    onClick={clearRecentHighlight}
                    className="text-[9px] uppercase tracking-widest text-slate-500 hover:text-slate-300 border border-white/5 px-2 py-0.5 rounded transition"
                  >
                    Clear Notification
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-600 font-mono uppercase">Sync Nominal</span>
              )}
            </div>

            {recentAdditionsList.length === 0 ? (
              <p className="text-[11px] text-slate-500 leading-normal italic">
                Inbox clear. Simulated new SMS or manual submissions will populate this list instantly.
              </p>
            ) : (
              <div className="space-y-2">
                {recentAdditionsList.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="flex items-center justify-between p-2.5 bg-[#161619] border border-white/5 rounded-lg text-xs hover:border-amber-500/20 transition cursor-pointer task-block-recent"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                      <span className="font-semibold text-slate-300 truncate">{task.title}</span>
                    </div>
                    <span className="text-[9px] text-amber-500 font-mono shrink-0 font-medium">
                      {task.category.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PROFILE & BATTERY CONFIG PANEL */}
          <ProfilePanel profile={profile} onChangeProfile={setProfile} />

        </section>

        {/* SECURE CALL LOGS & SMS LISTENERS */}
        <section id="secure-logs-wrapper" className="col-span-12 mt-4 space-y-6">
          <TasklineAppSimulator />

          <SecureCallLogs 
            onAddIncomingCallTask={(incoming) => {
              const newTask: Task = {
                id: `incoming-call-${Date.now()}`,
                title: incoming.title,
                description: incoming.description,
                category: "call",
                dateTime: incoming.dateTime,
                createdTime: new Date().toISOString(),
                isAddedRecently: true,
                status: "pending",
                callerName: incoming.callerName,
                callerRole: incoming.callerRole
              };
              setTasks(prev => [newTask, ...prev]);
              setRecentCount(c => c + 1);
            }}
            simulatedTime={simulatedTime}
            pauseReminders={settings.pauseReminders}
          />

          <SecureSMSInbox 
            onAddIncomingCallTask={(incoming) => {
              const newTask: Task = {
                id: `incoming-sms-callback-${Date.now()}`,
                title: incoming.title,
                description: incoming.description,
                category: "call",
                dateTime: incoming.dateTime,
                createdTime: new Date().toISOString(),
                isAddedRecently: true,
                status: "pending",
                callerName: incoming.callerName,
                callerRole: incoming.callerRole
              };
              setTasks(prev => [newTask, ...prev]);
              setRecentCount(c => c + 1);
            }}
            pauseReminders={settings.pauseReminders}
          />
        </section>
      </main>

      {/* DYNAMIC MODAL/PANEL: TASK DETAILED SUGGESTIONS & FOCUS AREAS (Rule 6) */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0D0D0E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#111113]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-semibold text-white text-sm">Contextual Suggestions & Focus Topics</h3>
                  <p className="text-[10px] text-slate-400">Tailored context analysis powered by Gemini API</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Selected Task</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="text-xs text-slate-400 uppercase font-medium">{selectedTask.category.replace("_", " ")}</span>
                </div>
                <h4 className="text-lg font-bold text-white leading-snug">{selectedTask.title}</h4>
                <p className="text-xs text-slate-300 bg-black/40 p-3 rounded-lg border border-white/5 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>

              {/* Gemini / Logic Results */}
              {isAnalyzing ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Consulting AI model with your role ({profile.role})...</p>
                </div>
              ) : selectedTask.suggestionsLoaded && selectedTask.suggestionsData ? (
                <div className="space-y-5">
                  
                  {/* Task Summary */}
                  <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1">
                    <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">Context Summary</span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {selectedTask.suggestionsData.summary}
                    </p>
                  </div>

                  {/* Suggestions List (Actionable tips) */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Actionable Suggestions</span>
                    <ul className="space-y-2">
                      {selectedTask.suggestionsData.suggestions.map((tip, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-white/5">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Meeting/Project specific: Focus Topics based on user role */}
                  {selectedTask.suggestionsData.focusTopics && selectedTask.suggestionsData.focusTopics.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold tracking-wider text-sky-400 uppercase">Role-Specific Focus (As {profile.role})</span>
                        <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded">Tailored</span>
                      </div>
                      <ul className="space-y-2">
                        {selectedTask.suggestionsData.focusTopics.map((topic, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-white/5">
                            <ArrowRight className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Search Shortcuts / References (Rule 6 requirements) */}
                  <div className="space-y-3.5 border-t border-white/5 pt-4">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Shortcuts & Search Resources</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      
                      <a
                        href={selectedTask.suggestionsData.googleSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 bg-slate-900 border border-white/10 rounded-lg hover:bg-slate-800 hover:border-white/20 transition text-xs font-medium text-slate-200"
                      >
                        <span className="flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-blue-400" />
                          Google Search
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>

                      <a
                        href={selectedTask.suggestionsData.driveSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 bg-slate-900 border border-white/10 rounded-lg hover:bg-slate-800 hover:border-white/20 transition text-xs font-medium text-slate-200"
                      >
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          Google Drive
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>

                      <a
                        href={selectedTask.suggestionsData.youtubeSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 bg-slate-900 border border-white/10 rounded-lg hover:bg-slate-800 hover:border-white/20 transition text-xs font-medium text-slate-200"
                      >
                        <span className="flex items-center gap-1.5">
                          <Youtube className="w-3.5 h-3.5 text-rose-400" />
                          YouTube Search
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>

                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-6">
                  <button
                    onClick={() => loadSuggestionsForTask(selectedTask, true)}
                    className="px-4 py-2 bg-amber-500 text-black font-semibold text-xs rounded-xl hover:bg-amber-400 transition"
                  >
                    Analyze with Gemini AI
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer actions */}
            <div className="p-4 bg-[#111113] border-t border-white/5 flex justify-between items-center text-xs">
              <span className="text-slate-500">Task Status: {selectedTask.status}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    loadSuggestionsForTask(selectedTask, true);
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition flex items-center gap-1.5"
                  disabled={isAnalyzing}
                >
                  <RefreshCw className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`} />
                  Regenerate Analysis
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-1.5 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE NEW TASK MODAL */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTaskSubmit}
            className="w-full max-w-lg bg-[#0D0D0E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111113]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-white text-sm">Add New Task Entry</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Category Select */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Task Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                  className="w-full text-xs p-2.5 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200"
                >
                  <option value="project">Project submission date</option>
                  <option value="meeting">Project meeting / Sync</option>
                  <option value="travel_train">Train travel ticket</option>
                  <option value="travel_flight">Flight travel ticket</option>
                  <option value="call">Missed/Unconnected call</option>
                  <option value="other_bill">Broadband/Recharge or bill due date</option>
                  <option value="other_sale">Essential items sale date</option>
                  <option value="other_book">Books availability date</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Task / Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Shatabdi Express ticket, Annual project report"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description / SMS text</label>
                <textarea
                  rows={3}
                  placeholder="Paste booking message details, call timestamps, or other context"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200"
                />
              </div>

              {/* Category-Specific fields */}
              {newCategory === "travel_train" && (
                <div className="space-y-4">
                  {/* Smart Ticket Autofill Dropzone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Smart Ticket Autofill
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const mockEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                          handleTicketUpload(mockEvent);
                        }
                      }}
                      onClick={() => document.getElementById("ticket-file-input")?.click()}
                      className="border border-dashed border-white/15 hover:border-amber-500/50 rounded-xl p-4 bg-black/40 hover:bg-black/60 transition cursor-pointer flex flex-col items-center justify-center text-center gap-2 relative group min-h-[96px]"
                    >
                      <input
                        id="ticket-file-input"
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf,.txt"
                        className="hidden"
                        onChange={handleTicketUpload}
                      />
                      <FileText className="w-6 h-6 text-slate-500 group-hover:text-amber-500 transition" />
                      <div>
                        <p className="text-[11px] text-slate-300 font-medium">
                          Click or drag train ticket to autofill
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          Supports .img, .pdf, .txt files
                        </p>
                      </div>

                      {/* Loading overlay */}
                      {isUploadingTicket && (
                        <div className="absolute inset-0 bg-black/95 rounded-xl flex flex-col items-center justify-center gap-2 z-10">
                          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                          <span className="text-[10px] text-slate-300 font-mono">Gemini AI extracting ticket...</span>
                        </div>
                      )}
                    </div>

                    {/* Status Feedback */}
                    {ticketUploadError && (
                      <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] text-rose-400 font-medium">
                        ⚠️ {ticketUploadError}
                      </div>
                    )}
                    {ticketUploadSuccess && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-400 font-medium leading-normal">
                        ✓ {ticketUploadSuccess}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Train Number (5 Digits)</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="e.g., 12002"
                      value={newTrainNumber}
                      onChange={(e) => setNewTrainNumber(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200"
                    />
                  </div>
                </div>
              )}

              {newCategory === "travel_flight" && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Flight Number</label>
                  <input
                    type="text"
                    placeholder="e.g., 6E-2401"
                    value={newFlightNumber}
                    onChange={(e) => setNewFlightNumber(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200"
                  />
                </div>
              )}

              {newCategory === "call" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Caller Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Mom, Dad, Manager Ankit"
                      value={newCallerName}
                      onChange={(e) => setNewCallerName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Caller Classification</label>
                    <select
                      value={newCallerRole}
                      onChange={(e) => setNewCallerRole(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200"
                    >
                      <option value="other">Other/Unclassified</option>
                      <option value="mom">Mom / Mother / Maa</option>
                      <option value="dad">Dad / Father / Papa</option>
                      <option value="sister">Sister / Behen</option>
                      <option value="brother">Brother / Bhai</option>
                      <option value="manager">Manager / Boss</option>
                      <option value="colleague">Colleague / Peer</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Deadline Date & Time Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Departure or Deadline Date & Time</label>
                <input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={(e) => setNewDateTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block leading-normal">
                  Pro-tip: If you select a departure date exactly 30 minutes from the simulated system time, you will immediately see live train tracking alerts activate!
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#111113] border-t border-white/5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition text-xs cursor-pointer"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SWIPE OPTIONS MODAL */}
      {swipedTask && (
        <div id="swipe-options-modal" className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0D0D0E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111113]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="text-xs font-bold font-mono">⟷</span>
                </div>
                <h3 className="font-semibold text-white text-sm">
                  {swipeActionView === "options" ? "Manage Swiped Task" : "Update Task details"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSwipedTask(null)}
                className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {swipeActionView === "options" ? (
                <>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10">
                      {swipedTask.category.replace("_", " ")}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">{swipedTask.title}</h4>
                    <p className="text-xs text-slate-400 leading-normal">{swipedTask.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Scheduled: {new Date(swipedTask.dateTime).toLocaleString()}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    What action would you like to perform on this swiped task entry?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Resolve Button */}
                    <button
                      onClick={() => {
                        changeTaskStatus(swipedTask.id, "completed");
                        setSwipedTask(null);
                        alert("Task completed and removed from pending task list!");
                      }}
                      className="group flex flex-col items-center justify-center p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-center transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Resolve Task</span>
                      <span className="text-[9px] text-slate-400 mt-1">Complete and archive entry</span>
                    </button>

                    {/* Update Button */}
                    <button
                      onClick={() => {
                        setSwipeActionView("update");
                      }}
                      className="group flex flex-col items-center justify-center p-5 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 text-center transition cursor-pointer"
                    >
                      <Settings className="w-8 h-8 text-violet-400 mb-2 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Update Details</span>
                      <span className="text-[9px] text-slate-400 mt-1">Adjust time and description</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Task Title */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Task Title</label>
                    <input
                      type="text"
                      value={swipeUpdateTitle}
                      onChange={(e) => setSwipeUpdateTitle(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200"
                    />
                  </div>

                  {/* Task Description */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Task Description</label>
                    <textarea
                      rows={3}
                      value={swipeUpdateDescription}
                      onChange={(e) => setSwipeUpdateDescription(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200 resize-none"
                    />
                  </div>

                  {/* Increment Time Section */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-400">
                      Adjust / Increment Time
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-black/40 border border-white/5 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleIncrementSwipeTime(5)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-bold rounded transition cursor-pointer"
                      >
                        +5m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIncrementSwipeTime(10)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-bold rounded transition cursor-pointer"
                      >
                        +10m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIncrementSwipeTime(30)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-bold rounded transition cursor-pointer"
                      >
                        +30m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIncrementSwipeTime(60)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-bold rounded transition cursor-pointer"
                      >
                        +1h
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIncrementSwipeTime(120)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-bold rounded transition cursor-pointer"
                      >
                        +2h
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIncrementSwipeTime(300)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-bold rounded transition cursor-pointer"
                      >
                        +5h
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIncrementSwipeTime(1440)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-bold rounded transition cursor-pointer"
                      >
                        +24h
                      </button>
                    </div>

                    {/* Scheduled Display & Native Picker */}
                    <div className="p-3 bg-[#131129]/40 border border-violet-500/15 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400">Current Setting:</span>
                        <span className="text-amber-400 font-bold">
                          {new Date(swipeUpdateDateTime).toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="datetime-local"
                        value={swipeUpdateDateTime.slice(0, 16)} // format standard ISO string for input
                        onChange={(e) => {
                          if (e.target.value) {
                            setSwipeUpdateDateTime(new Date(e.target.value).toISOString());
                          }
                        }}
                        className="w-full text-xs p-2 bg-[#141416] border border-white/10 rounded-lg focus:outline-hidden text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#111113] border-t border-white/5 flex justify-end gap-2">
              {swipeActionView === "options" ? (
                <button
                  type="button"
                  onClick={() => setSwipedTask(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSwipeActionView("options")}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSwipeUpdate}
                    className="px-5 py-2 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition text-xs cursor-pointer"
                  >
                    Update&amp;Continue
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Context Bar */}
      <footer className="h-10 bg-black border-t border-white/5 flex items-center justify-between px-6 text-[9px] uppercase tracking-widest text-slate-600 italic">
        <div>Engine Mode: Silent Vigilance</div>
        <div>Neural Priority Weighting Active (Call &gt; Travel &gt; Project)</div>
        <div>System status: Nominal • Battery Optimization is {profile.batterySaverMode ? "Active" : "Standard"}</div>
      </footer>
    </div>
  );
}
