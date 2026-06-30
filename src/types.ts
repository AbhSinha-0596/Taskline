export type TaskCategory =
  | "travel_train"
  | "travel_flight"
  | "project"
  | "meeting"
  | "call"
  | "other_sale"
  | "other_book"
  | "other_bill";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  dateTime: string; // ISO string or simple datetime string
  createdTime: string; // timestamp when added
  isAddedRecently?: boolean; // triggers highlight in recent additions panel
  status: "pending" | "completed" | "dismissed";
  
  // Specific properties
  trainNumber?: string; // for travel_train
  flightNumber?: string; // for travel_flight
  callerName?: string; // for call
  callerRole?: string; // "home", "mom", "dad", "sister", "brother", "manager", "boss", "colleague", "other"
  
  // Custom suggestion details from Gemini or local logic
  suggestionsLoaded?: boolean;
  suggestionsData?: {
    summary: string;
    suggestions: string[];
    focusTopics?: string[];
    googleSearchUrl: string;
    youtubeSearchUrl: string;
    driveSearchUrl: string;
  };
}

export interface UserProfile {
  name: string;
  role: string; // Developer, Product Manager, Designer, Researcher, Consultant, Student, etc.
  batterySaverMode: boolean; // low energy local scheduling simulations
}

export interface LiveTrainStatus {
  trainNumber: string;
  trainName: string;
  route: string;
  scheduledDeparture: string;
  status: "on-time" | "delayed" | "rescheduled" | "cancelled";
  minutesDelayed: number;
  statusMessage: string;
  currentStation: string;
  lastUpdated: string;
}

export interface ReminderAlert {
  id: string;
  taskId: string;
  taskTitle: string;
  type: "30_min_mild" | "5_min_strong" | "flight_checkin" | "flight_airport" | "meeting_1d_fullscreen" | "meeting_1h_strong";
  message: string;
  timeRemainingMinutes?: number;
  isDismissed: boolean;
}
