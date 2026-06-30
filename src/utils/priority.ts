import { Task } from "../types";

/**
 * Computes a priority score for sorting. Lower scores mean higher priority.
 * Priority Rules:
 * 1. Missed Call (from home/family [English/Hindi] or work/manager) -> Score 1
 *    - Hindi/English equivalents checked: mom, mother, maa, dad, father, papa, sister, behen, didi, brother, bhai, bhaiya, office, manager, boss, colleague
 * 2. Travel tickets (train/flight) -> Score 2
 * 3. Project meetings & project submissions -> Score 3 (Same level)
 * 4. Other tasks (bills, sales, books) -> Score 4
 */
export function getTaskPriorityScore(task: Task, simulatedTime?: Date): number {
  let baseScore = 4;

  if (task.category === "call") {
    const name = (task.callerName || "").toLowerCase();
    const desc = (task.description || "").toLowerCase();
    
    // Hindi/English family equivalents and work/office keywords
    const isFamilyOrWork =
      // Home & Mom
      name.includes("home") || desc.includes("home") ||
      name.includes("mom") || name.includes("mother") || name.includes("maa") || name.includes("mummy") ||
      desc.includes("mom") || desc.includes("mother") || desc.includes("maa") ||
      // Dad
      name.includes("dad") || name.includes("father") || name.includes("papa") || name.includes("pitaji") ||
      desc.includes("dad") || desc.includes("father") || desc.includes("papa") ||
      // Sister
      name.includes("sister") || name.includes("behen") || name.includes("didi") || name.includes("behna") ||
      desc.includes("sister") || desc.includes("behen") || desc.includes("didi") ||
      // Brother
      name.includes("brother") || name.includes("bhai") || name.includes("bhaiya") ||
      desc.includes("brother") || desc.includes("bhai") || desc.includes("bhaiya") ||
      // Work / Colleague / Manager
      name.includes("office") || name.includes("manager") || name.includes("boss") || name.includes("colleague") ||
      name.includes("sir") || name.includes("team lead") ||
      desc.includes("office") || desc.includes("manager") || desc.includes("boss") || desc.includes("colleague");

    baseScore = isFamilyOrWork ? 1.0 : 1.5; // Critical calls are 1.0, non-critical calls are 1.5
  } else if (task.category === "travel_train" || task.category === "travel_flight") {
    baseScore = 2.0;
  } else if (task.category === "meeting" || task.category === "project") {
    baseScore = 3.0; // Project meeting and Project submission on the same level (3)
  }

  // --- DYNAMIC ROLLING QUEUE DEADLINE ESCALATION ---
  if (simulatedTime) {
    const taskTime = new Date(task.dateTime).getTime();
    const nowTime = simulatedTime.getTime();
    const diffMs = taskTime - nowTime;
    const diffHours = diffMs / (60 * 60 * 1000);

    // 1. Meetings / Project Submissions -> 1 hour before submission (strong) -> Raise priority
    if ((task.category === "meeting" || task.category === "project") && diffHours > 0 && diffHours <= 1) {
      // Escalate from 3.0 to 1.2 (above flight/train travel, but just below Tier 1 call alerts)
      return 1.2;
    }

    // 2. Flight/Train Travel -> Afternoon (12 PM - 2 PM) of the day before travel
    if ((task.category === "travel_train" || task.category === "travel_flight") && diffHours > 0) {
      // Calculate day-before-travel window
      const taskDate = new Date(task.dateTime);
      const simDate = new Date(simulatedTime);
      
      // Zero out hours to check calendar date difference
      const taskMidnight = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()).getTime();
      const simMidnight = new Date(simDate.getFullYear(), simDate.getMonth(), simDate.getDate()).getTime();
      const daysDiff = Math.round((taskMidnight - simMidnight) / (24 * 60 * 60 * 1000));

      if (daysDiff === 1) {
        // It's the day before travel! Now check if time is between 12 PM (12:00) and 2 PM (14:00)
        const hour = simDate.getHours();
        if (hour >= 12 && hour < 14) {
          // Escalate from 2.0 to 1.1 (stands right behind top-tier calls, ensuring user prepares)
          return 1.1;
        }
      }
    }
  }

  return baseScore;
}

/**
 * Returns a human-friendly string of the priority tier including dynamic adjustments
 */
export function getPriorityTierLabel(task: Task, simulatedTime?: Date): { label: string; colorClass: string } {
  const score = getTaskPriorityScore(task, simulatedTime);
  if (score === 1.0) {
    return { label: "Tier 1: Immediate Action Call", colorClass: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50" };
  }
  if (score === 1.1) {
    return { label: "Tier 1.1: Impending Travel prep (Day-Before Afternoon Boost)", colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
  }
  if (score === 1.2) {
    return { label: "Tier 1.2: Impending Submission (1h Proximity Boost)", colorClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" };
  }
  if (score === 1.5) {
    return { label: "Tier 1.5: Callback Alert", colorClass: "text-pink-600 bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-900/50" };
  }
  if (score === 2.0) {
    return { label: "Tier 2: Travel Departure Itinerary", colorClass: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50" };
  }
  if (score === 3.0) {
    return { label: "Tier 3: Core Project / Meet Deadline", colorClass: "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50" };
  }
  return { label: "Tier 4: General Routine task", colorClass: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-900/50" };
}

export function sortTasks(tasks: Task[], simulatedTime?: Date): Task[] {
  return [...tasks].sort((a, b) => {
    const prioA = getTaskPriorityScore(a, simulatedTime);
    const prioB = getTaskPriorityScore(b, simulatedTime);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    // Within same priority level, sort by date/time (earlier deadlines first)
    const timeA = new Date(a.dateTime).getTime();
    const timeB = new Date(b.dateTime).getTime();
    return timeA - timeB;
  });
}
