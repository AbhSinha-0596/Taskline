import React from "react";
import { Task, TaskCategory } from "../types";
import { Mail, MessageSquare, PhoneMissed, Sparkles, AlertCircle } from "lucide-react";

interface ScannerSimulatorProps {
  onAddTask: (task: Omit<Task, "id" | "createdTime" | "isAddedRecently">) => void;
  simulatedTime: Date;
}

export default function ScannerSimulator({ onAddTask, simulatedTime }: ScannerSimulatorProps) {
  const triggerSimulate = (type: string) => {
    const baseTime = new Date(simulatedTime);

    switch (type) {
      case "missed_call_mom": {
        onAddTask({
          title: "Missed Call - Mom (Maa)",
          description: "Urgent: Tried calling 3 times regarding family dinner and health update. Callback requested.",
          category: "call",
          dateTime: new Date(baseTime.getTime() + 10 * 60 * 1000).toISOString(), // 10 mins from now
          status: "pending",
          callerName: "Mom / Maa",
          callerRole: "mom",
        });
        break;
      }
      case "missed_call_manager": {
        onAddTask({
          title: "Missed Call - Manager (Ankit Office)",
          description: "Blocked: Unable to connect while retrying to discuss project submission roadblocks and deployment reviews.",
          category: "call",
          dateTime: new Date(baseTime.getTime() + 15 * 60 * 1000).toISOString(),
          status: "pending",
          callerName: "Ankit (Manager)",
          callerRole: "manager",
        });
        break;
      }
      case "train_ticket": {
        onAddTask({
          title: "Train Journey - Shatabdi Express #12002",
          description: "IRCTC Booking SMS: PNR 4248382901. Coach C3 Seat 42. Scheduled departure from New Delhi (NDLS) to Bhopal.",
          category: "travel_train",
          dateTime: new Date(baseTime.getTime() + 31 * 60 * 1000).toISOString(), // 31 mins from now (triggers 30-min status check shortly!)
          status: "pending",
          trainNumber: "12002",
        });
        break;
      }
      case "flight_ticket": {
        onAddTask({
          title: "Flight Travel - Indigo 6E-2401",
          description: "Airline Booking Confirmation: Seat 12F. Scheduled departure from Indira Gandhi Airport Terminal 3 to Bangalore (BLR).",
          category: "travel_flight",
          dateTime: new Date(baseTime.getTime() + 25 * 60 * 60 * 1000).toISOString(), // 25 hours from now (Web check-in alert triggers within 1 hr / 1 day relative)
          status: "pending",
          flightNumber: "6E-2401",
        });
        break;
      }
      case "project_submission": {
        onAddTask({
          title: "Project Submission: Quarter 2 Deliverables",
          description: "Final submission of source files, documentation PDFs, and architecture diagrams to the evaluation dashboard.",
          category: "project",
          dateTime: new Date(baseTime.getTime() + 35 * 60 * 1000).toISOString(), // 35 mins from now
          status: "pending",
        });
        break;
      }
      case "office_meeting": {
        onAddTask({
          title: "Sync Meeting: Q2 Technical Roadmap",
          description: "Discuss system infrastructure, backend performance blocks, database optimization, and key deliverables.",
          category: "meeting",
          dateTime: new Date(baseTime.getTime() + 50 * 60 * 1000).toISOString(), // 50 mins from now
          status: "pending",
        });
        break;
      }
      case "bill_recharge": {
        onAddTask({
          title: "Airtel Fiber Broadband Bill Due",
          description: "Airtel Telecommunications: Your billing cycle for Account #98283921 has completed. Avoid late fee blocks.",
          category: "other_bill",
          dateTime: new Date(baseTime.getTime() + 180 * 60 * 1000).toISOString(), // 3 hours from now
          status: "pending",
        });
        break;
      }
      case "essential_sale": {
        onAddTask({
          title: "Limited Flash Sale: Ergonomic Desk Chair",
          description: "HomeOffice Supplies: The premium mesh high-back chair goes on live flash sale for 50% discount.",
          category: "other_sale",
          dateTime: new Date(baseTime.getTime() + 120 * 60 * 1000).toISOString(), // 2 hours from now
          status: "pending",
        });
        break;
      }
    }
  };

  return (
    <div id="scanner-simulator" className="p-5 rounded-2xl bg-[#131129]/60 border border-violet-500/15 shadow-sm text-slate-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-sm md:text-base">Automated Inbox & SMS Scanner</h3>
            <p className="text-[12px] md:text-[14px] text-slate-400 font-medium">Simulate incoming alerts to test automatic detection</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Call simulations */}
        <button
          onClick={() => triggerSimulate("missed_call_mom")}
          className="flex items-center gap-2 p-2.5 text-left text-xs bg-[#0F122A]/60 hover:bg-rose-950/20 border border-violet-500/10 hover:border-rose-300 rounded-xl transition shadow-xs text-slate-300"
        >
          <PhoneMissed className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <div className="font-bold text-[12px] md:text-[14px] text-rose-300">SMS: Call Mom</div>
            <div className="text-[11px] md:text-[13px] text-slate-400 font-medium">Hindi equivalents</div>
          </div>
        </button>

        <button
          onClick={() => triggerSimulate("missed_call_manager")}
          className="flex items-center gap-2 p-2.5 text-left text-xs bg-[#0F122A]/60 hover:bg-[#1E1B4B]/30 border border-violet-500/10 hover:border-indigo-400 rounded-xl transition shadow-xs text-slate-300"
        >
          <PhoneMissed className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <div className="font-bold text-[12px] md:text-[14px] text-indigo-300">SMS: Boss/Office</div>
            <div className="text-[11px] md:text-[13px] text-slate-400 font-medium">Manager callback</div>
          </div>
        </button>

        {/* Travel simulations */}
        <button
          onClick={() => triggerSimulate("train_ticket")}
          className="flex items-center gap-2 p-2.5 text-left text-xs bg-[#0F122A]/60 hover:bg-amber-950/20 border border-violet-500/10 hover:border-amber-400 rounded-xl transition shadow-xs text-slate-300"
        >
          <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="font-bold text-[12px] md:text-[14px] text-amber-300">SMS: Train Ticket</div>
            <div className="text-[11px] md:text-[13px] text-slate-400 font-medium">NTES check triggers</div>
          </div>
        </button>

        <button
          onClick={() => triggerSimulate("flight_ticket")}
          className="flex items-center gap-2 p-2.5 text-left text-xs bg-[#0F122A]/60 hover:bg-blue-950/20 border border-violet-500/10 hover:border-blue-400 rounded-xl transition shadow-xs text-slate-300"
        >
          <Mail className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <div className="font-bold text-[12px] md:text-[14px] text-blue-300">Email: Flight</div>
            <div className="text-[11px] md:text-[13px] text-slate-400 font-medium">24h web checkin</div>
          </div>
        </button>

        {/* Deliverables simulations */}
        <button
          onClick={() => triggerSimulate("project_submission")}
          className="flex items-center gap-2 p-2.5 text-left text-xs bg-[#0F122A]/60 hover:bg-purple-950/20 border border-violet-500/10 hover:border-purple-400 rounded-xl transition shadow-xs text-slate-300"
        >
          <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <div className="font-bold text-[12px] md:text-[14px] text-purple-300">Project Deadline</div>
            <div className="text-[11px] md:text-[13px] text-slate-400 font-medium">Submission portal</div>
          </div>
        </button>

        <button
          onClick={() => triggerSimulate("office_meeting")}
          className="flex items-center gap-2 p-2.5 text-left text-xs bg-[#0F122A]/60 hover:bg-sky-950/20 border border-violet-500/10 hover:border-sky-400 rounded-xl transition shadow-xs text-slate-300"
        >
          <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
          <div>
            <div className="font-bold text-[12px] md:text-[14px] text-sky-300">Office Meeting</div>
            <div className="text-[11px] md:text-[13px] text-slate-400 font-medium">Topics & summary</div>
          </div>
        </button>

        {/* Other simulations */}
        <button
          onClick={() => triggerSimulate("bill_recharge")}
          className="flex items-center gap-2 p-2.5 text-left text-xs bg-[#0F122A]/60 hover:bg-emerald-950/20 border border-violet-500/10 hover:border-emerald-400 rounded-xl transition shadow-xs text-slate-300"
        >
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-[12px] md:text-[14px] text-emerald-300">Recharge/Bill</div>
            <div className="text-[11px] md:text-[13px] text-slate-400 font-medium">Fiber broadband</div>
          </div>
        </button>

        <button
          onClick={() => triggerSimulate("essential_sale")}
          className="flex items-center gap-2 p-2.5 text-left text-xs bg-[#0F122A]/60 hover:bg-orange-950/20 border border-violet-500/10 hover:border-orange-400 rounded-xl transition shadow-xs text-slate-300"
        >
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
          <div>
            <div className="font-bold text-[12px] md:text-[14px] text-orange-300">Essential Sale</div>
            <div className="text-[11px] md:text-[13px] text-slate-400 font-medium">Limited flash sale</div>
          </div>
        </button>
      </div>
    </div>
  );
}
