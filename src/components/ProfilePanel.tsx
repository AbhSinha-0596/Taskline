import React from "react";
import { UserProfile } from "../types";
import { Shield, Battery, User, ToggleLeft, ToggleRight, Sparkles, Cpu, Clock } from "lucide-react";

interface ProfilePanelProps {
  profile: UserProfile;
  onChangeProfile: (profile: UserProfile) => void;
}

export default function ProfilePanel({ profile, onChangeProfile }: ProfilePanelProps) {
  const roles = [
    "Software Engineer",
    "Product Manager",
    "UI/UX Designer",
    "Data Scientist",
    "Marketing Specialist",
    "College Student",
    "Sales Director",
  ];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeProfile({
      ...profile,
      role: e.target.value,
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeProfile({
      ...profile,
      name: e.target.value,
    });
  };

  const toggleBatterySaver = () => {
    onChangeProfile({
      ...profile,
      batterySaverMode: !profile.batterySaverMode,
    });
  };

  return (
    <div id="profile-panel" className="p-5 rounded-2xl bg-[#0F122A]/70 border border-blue-500/10 hover:border-blue-500/20 shadow-lg shadow-blue-950/10 space-y-5 text-slate-300">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
          <User className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-slate-200 text-sm md:text-base">User Profile & Battery Config</h3>
          <p className="text-[12px] md:text-[14px] text-slate-400 font-medium">Customize role context and efficiency settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name Input */}
        <div>
          <label className="block text-[12px] md:text-[14px] font-bold text-slate-400 mb-1">Your Full Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={handleNameChange}
            className="w-full text-[12px] md:text-[14px] p-2 bg-slate-950 border border-white/5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200"
            placeholder="John Doe"
          />
        </div>

        {/* Role Select */}
        <div>
          <label className="block text-[12px] md:text-[14px] font-bold text-slate-400 mb-1">Professional Role</label>
          <select
            value={profile.role}
            onChange={handleRoleChange}
            className="w-full text-[12px] md:text-[14px] p-2 bg-slate-950 border border-white/5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <span className="text-[11px] md:text-[13px] text-slate-500 font-medium mt-1 block">
            Used by Gemini to tailor meeting focus areas
          </span>
        </div>
      </div>

      {/* Battery Optimization Section */}
      <div className="p-3 bg-[#131129]/60 rounded-xl border border-violet-500/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Battery className={`w-5 h-5 ${profile.batterySaverMode ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
            <div>
              <div className="text-[12px] md:text-[14px] font-bold text-slate-200">Minimum Battery Analysis</div>
              <div className="text-[11px] md:text-[13px] text-slate-400 font-medium">Background task throttling</div>
            </div>
          </div>
          <button onClick={toggleBatterySaver} className="cursor-pointer">
            {profile.batterySaverMode ? (
              <ToggleRight className="w-9 h-9 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-9 h-9 text-slate-400" />
            )}
          </button>
        </div>

        {/* Energy Statistics & Explanation */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
          <div className="p-1.5 rounded-lg bg-slate-950/60 border border-white/5">
            <div className="text-[10px] md:text-[12px] text-slate-400 font-bold uppercase">Active Wakeups</div>
            <div className={`text-xs md:text-sm font-extrabold ${profile.batterySaverMode ? "text-emerald-400" : "text-amber-400"}`}>
              {profile.batterySaverMode ? "Once / 30m" : "Real-time"}
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-950/60 border border-white/5">
            <div className="text-[10px] md:text-[12px] text-slate-400 font-bold uppercase">Battery Drain</div>
            <div className={`text-xs md:text-sm font-extrabold ${profile.batterySaverMode ? "text-emerald-400" : "text-slate-300"}`}>
              {profile.batterySaverMode ? "-88% reduction" : "Standard"}
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-950/60 border border-white/5">
            <div className="text-[10px] md:text-[12px] text-slate-400 font-bold uppercase">Methodology</div>
            <div className="text-[11px] md:text-[13px] text-slate-300 font-semibold truncate" title="Lightweight alarm-manager triggers only">
              Local Alarms
            </div>
          </div>
        </div>

        {/* Dynamic Graphic Visualizing Energy Impact */}
        <div className="mt-2 text-[12px] md:text-[14px] text-slate-300 flex flex-col gap-1.5">
          <div className="flex justify-between font-mono text-[11px] md:text-[13px] text-slate-400">
            <span>CPU Load Impact:</span>
            <span className={profile.batterySaverMode ? "text-emerald-400 font-bold text-xs md:text-sm" : "text-amber-400 font-bold text-xs md:text-sm"}>
              {profile.batterySaverMode ? "1.2% (Eco-Sleep)" : "8.4% (Continuous)"}
            </span>
          </div>
          <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden flex border border-white/5">
            {profile.batterySaverMode ? (
              <>
                <div className="bg-emerald-400 h-full w-[15%]" />
                <div className="bg-slate-700 h-full w-[85%]" />
              </>
            ) : (
              <>
                <div className="bg-amber-400 h-full w-[65%]" />
                <div className="bg-slate-700 h-full w-[35%]" />
              </>
            )}
          </div>
          <p className="text-[12px] md:text-[14px] text-slate-400 leading-relaxed italic">
            {profile.batterySaverMode
              ? "✓ Eco-mode active: Heavy calculations are deferred. Travel checks and reminders run on-demand or align precisely with device wakeup cycles to prevent background drain."
              : "⚠ Normal mode: Task monitoring runs continuously. Turn on battery saver to optimize local resource locks and restrict CPU wakeup timers."}
          </p>
        </div>
      </div>
    </div>
  );
}
