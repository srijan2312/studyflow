import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  isAfter,
  startOfDay,
} from "date-fns";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { useHabits } from "../../hooks/useHabits";
import Card, {
  CardContent,
  CardHeader,
  CardTitle,
  StatCard,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Input, { Select, Textarea } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import { cn } from "../../lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getPercentageColor(percentage) {
  if (percentage >= 90)
    return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
  if (percentage >= 70)
    return "bg-green-500/20 text-green-300 border border-green-500/30";
  if (percentage >= 50)
    return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
  if (percentage >= 30)
    return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
  if (percentage >= 10)
    return "bg-red-500/20 text-red-300 border border-red-500/30";
  return "bg-slate-800/50 text-slate-400 border border-slate-700/40";
}

function parseDate(dateLike) {
  if (!dateLike) return null;
  const date = new Date(dateLike);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDayCustom(dateLike) {
  const date = parseDate(dateLike);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function isoDate(dateLike) {
  const date = parseDate(dateLike);
  return date ? date.toISOString().slice(0, 10) : "";
}

function formatMonthLabel(dateLike) {
  const date = parseDate(dateLike);
  return date
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(date)
    : "Invalid date";
}

function formatShortDate(dateLike) {
  const date = parseDate(dateLike);
  return date
    ? new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
      }).format(date)
    : "No start date";
}

function buildMonthDays(viewDate, today) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const todayDate = isoDate(startOfDayCustom(today));
    const dayIso = isoDate(startOfDayCustom(date));
    return {
      key: dayIso,
      date,
      dayLabel: DAYS[date.getDay()],
      dayNumber: index + 1,
      weekIndex: Math.floor(index / 7),
      isWeekStart: index % 7 === 0,
      isWeekEnd: (index + 1) % 7 === 0 || index === totalDays - 1,
      isToday: dayIso === todayDate,
    };
  });
}

function getWeekGroups(days) {
  const groups = [];
  for (let index = 0; index < days.length; index += 7) {
    const weekDays = days.slice(index, index + 7);
    const startDay = weekDays[0]?.dayNumber || 1;
    const endDay = weekDays[weekDays.length - 1]?.dayNumber || startDay;
    groups.push({
      label: `Week ${groups.length + 1}`,
      days: weekDays,
      startIndex: index,
    });
  }
  return groups;
}

function getHabitRowInfo(habit) {
  if (habit.frequency === "daily") {
    return { frequencyBadge: "Daily" };
  }

  if (habit.frequency === "weekly") {
    if (habit.weekly_day === undefined || habit.weekly_day === null) {
      return { frequencyBadge: "Weekly" };
    }

    return {
      frequencyBadge: `Weekly (${DAYS[habit.weekly_day]})`,
    };
  }

  if (habit.frequency === "custom") {
    const labels = habit.custom_days?.map((d) => DAYS[d]).join(", ");
    return { frequencyBadge: labels || "Custom" };
  }
}

function cycleStatus(status) {
  if (status === "completed") return "pending";
  return "completed";
}

function getCellState(habit, day, logMap, today) {
  const startDate = startOfDayCustom(habit.start_date);
  const cellDate = startOfDayCustom(day.date);
  const log = logMap.get(`${habit.id}:${day.key}`);
  const status = log?.status ?? "pending";
  const frozen = log?.frozen ?? false;

  // Calculate date relationships for visual styling
  const beforeStart = startDate && cellDate ? cellDate.getTime() < startDate.getTime() : false;
  const past = !cellDate || !today ? false : cellDate < today;
  const future = !cellDate || !today ? false : cellDate > today;

  // Only allow interaction with past and current days (lock future days)
  let allowedDay = false;

if (habit.frequency === "daily") {
  allowedDay = true;
}

if (habit.frequency === "weekly") {
  allowedDay = day.date.getDay() === habit.weekly_day;
}

if (habit.frequency === "custom") {
  allowedDay =
  Array.isArray(habit.custom_days) &&
  habit.custom_days.includes(day.date.getDay());
}

  const interactive = allowedDay && !beforeStart && !future;
  const canFreeze = false; // Not needed since all cells are interactive

  return {
    status,
    beforeStart,
    past,
    future,
    interactive,
    canFreeze,
    frozen,
    completed: status === "completed",
    skipped: status === "skipped",
  };
}

function getHabitStats(habit, days, logMap) {
  let eligibleDays = 0;
  let completedDays = 0;
  let streak = 0;

  const startDate = startOfDayCustom(habit.start_date);

  for (const day of days) {
    const cellDate = startOfDayCustom(day.date);

    if (startDate && cellDate < startDate) {
  continue;
}

    let shouldCount = false;

    // DAILY
    if (habit.frequency === "daily") {
      shouldCount = true;
    }

    // WEEKLY
    if (habit.frequency === "weekly") {
      const weekday = habit.weekly_day;

      if (weekday === null || weekday === undefined) continue;

      if (cellDate.getDay() === weekday) {
        shouldCount = true;
      }

    }

    // CUSTOM
    if (habit.frequency === "custom") {
      if (habit.custom_days?.includes(cellDate.getDay())) {
        shouldCount = true;
      }
    }

    if (!shouldCount) continue;

    eligibleDays++;

    const status = logMap.get(`${habit.id}:${day.key}`)?.status;

    if (status === "completed") {
      completedDays++;
    }
  }

  const percentage =
    eligibleDays === 0 ? 0 : Math.round((completedDays / eligibleDays) * 100);

  return { completedDays, eligibleDays, percentage, streak };
}

// Convert dates to ISO strings for consistent comparison

const defaultForm = {
  title: "",
  description: "",
  frequency: "daily",
  start_date: new Date().toISOString().slice(0, 10),
  reminder_time: "",
  custom_days: [],
  weekly_day: null,
};

export default function Habits() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [animatedCell, setAnimatedCell] = useState("");
  const [flashMessage, setFlashMessage] = useState(null);
  const [optimisticLogs, setOptimisticLogs] = useState({});
  const gridScrollRef = useRef(null);
  const {
    habits,
    habitLogs,
    loading,
    error,
    addHabit,
    updateHabit,
    deleteHabit,
    upsertHabitLog,
  } = useHabits(viewDate);

  const today = useMemo(() => startOfDayCustom(new Date()), []);
  const days = useMemo(
    () => buildMonthDays(viewDate, today),
    [viewDate, today],
  );
  const totalDays = days.length;
  const monthKey = useMemo(
    () => `${viewDate.getFullYear()}-${viewDate.getMonth() + 1}`,
    [viewDate],
  );
  const weekGroups = useMemo(() => getWeekGroups(days), [days]);
  const todayIndex = useMemo(
    () => days.findIndex((day) => day.isToday),
    [days],
  );

  const mergedLogs = useMemo(() => {
    const base = new Map(
      habitLogs.map((log) => [`${log.habit_id}:${log.date}`, log]),
    );

    Object.entries(optimisticLogs).forEach(([key, value]) => {
      if (!value || value.status === "pending") {
        base.delete(key);
        return;
      }

      const [habitId, date] = key.split(":");
      base.set(key, {
        id: value.id ?? `optimistic:${key}`,
        habit_id: habitId,
        date,
        status: value.status,
        frozen: value.frozen ?? false,
      });
    });

    return base;
  }, [habitLogs, optimisticLogs]);

  const habitRows = useMemo(() => {
    return habits.map((habit) => ({
      ...habit,
      stats: getHabitStats(habit, days, mergedLogs, today),
    }));
  }, [days, habits, mergedLogs, today]);

  const overview = useMemo(() => {
    const totalHabits = habits.length;
    return {
      totalHabits,
    };
  }, [habits]);

  const todaysRoutines = useMemo(() => {
  const todayDay = days.find((d) => d.isToday);
  if (!todayDay) return [];

  const todayKey = isoDate(todayDay.date);

  return habits
    .map((habit) => {
      const cell = getCellState(habit, todayDay, mergedLogs, today);

      if (!cell.interactive) return null;

      const status =
        mergedLogs.get(`${habit.id}:${todayKey}`)?.status ?? "pending";

      return {
        ...habit,
        completed: status === "completed",
      };
    })
    .filter(Boolean);
}, [habits, days, mergedLogs, today]);

  const todayProgress = useMemo(() => {
  const todayKey = isoDate(today);

  let eligible = 0;
  let completed = 0;

  habits.forEach((habit) => {
    const todayDay = days.find((d) => d.isToday);
    if (!todayDay) return;

    const cell = getCellState(habit, todayDay, mergedLogs, today);

    if (!cell.interactive) return;

    eligible++;

    const status =
      mergedLogs.get(`${habit.id}:${todayKey}`)?.status ?? "pending";

    if (status === "completed") completed++;
  });

  return { completed, eligible };
}, [habits, days, mergedLogs, today]);

  useEffect(() => {
    if (!animatedCell) return undefined;
    const timeout = window.setTimeout(() => setAnimatedCell(""), 200);
    return () => window.clearTimeout(timeout);
  }, [animatedCell]);

  useEffect(() => {
    if (!flashMessage) return undefined;
    const timeout = window.setTimeout(() => setFlashMessage(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  useEffect(() => {
    setOptimisticLogs((current) => {
      if (!Object.keys(current).length) return current;
      const next = { ...current };

      habitLogs.forEach((log) => {
        const key = `${log.habit_id}:${log.date}`;
        if (next[key]?.status === log.status) {
          delete next[key];
        }
      });

      return next;
    });
  }, [habitLogs]);

  useEffect(() => {
    const container = gridScrollRef.current;
    if (!container) return undefined;

    const handleWheel = (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (container.scrollWidth <= container.clientWidth) return;
      event.preventDefault();
      container.scrollBy({
        left: event.deltaY,
        behavior: "smooth",
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const openCreate = () => {
    setEditingHabit(null);

    setForm({
      title: "",
      description: "",
      frequency: "daily",
      start_date: "",
      reminder_time: "",
      custom_days: [],
      weekly_day: null,
    });

    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (habit) => {
    setEditingHabit(habit);
    setForm({
      title: habit.title ?? "",
      description: habit.description ?? "",
      frequency: habit.frequency ?? "daily",
      start_date: habit.start_date ?? new Date().toISOString().slice(0, 10),
      reminder_time: habit.reminder_time ?? "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingHabit(null);
    setForm(defaultForm);
    setFormError("");
  };

  const shiftMonth = (direction) => {
    setViewDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  };

  const handleSaveHabit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setFormError("Habit title is required.");
      return;
    }

    if (!form.start_date) {
      setFormError("Start date is required.");
      return;
    }

    if (form.frequency === "weekly" && form.weekly_day === null) {
      setFormError("Please select a weekday.");
      return;
    }

    if (form.frequency === "custom" && form.custom_days.length === 0) {
      setFormError("Please select at least one day.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      title: form.title,
      description: form.description,
      frequency: form.frequency,
      start_date: form.start_date,
      reminder_time: form.reminder_time,
      custom_days: form.custom_days || [],
      weekly_day: form.weekly_day ?? null,
    };

    const result = editingHabit
      ? await updateHabit(editingHabit.id, payload)
      : await addHabit(payload);

    setSaving(false);

    if (result.error) {
      setFormError(result.error.message ?? "Unable to save habit right now.");
      return;
    }

    closeModal();
  };

  const handleToggleCell = async (habit, day) => {
    const key = `${habit.id}:${day.key}`;
    const cell = getCellState(habit, day, mergedLogs, today);

    if (!cell.interactive) return;

    const previousStatus = cell.status;
    const nextStatus = cycleStatus(previousStatus);

    setOptimisticLogs((current) => ({
      ...current,
      [key]: { status: nextStatus, frozen: false },
    }));

    setAnimatedCell(key);

    const result = await upsertHabitLog({
      habitId: habit.id,
      date: day.date,
      status: nextStatus,
    });

    if (result.error) {
      setOptimisticLogs((current) => ({
        ...current,
        [key]: { status: previousStatus },
      }));
      setFlashMessage({
        type: "error",
        text: result.error.message ?? "Could not update habit right now.",
      });
      return;
    }

    setOptimisticLogs((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  // Calculate grid columns dynamically based on days in month
  const gridColumns = useMemo(() => {
    return `220px repeat(${totalDays}, minmax(24px, 1fr)) 80px 80px`;
  }, [totalDays]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Study Routines</h1>
          <p className="mt-1 text-sm text-slate-500">
            Build consistency one day at a time.
          </p>
        </div>
        <Button size="md" leftIcon={<Plus size={16} />} onClick={openCreate}>
          Add Routine
        </Button>
      </div>

      {/* Overview Section */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <StatCard
          icon={<Target size={18} />}
          label="Active Routines"
          value={overview.totalHabits}
          meta={`${formatMonthLabel(viewDate)}`}
          color="indigo"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Completed today"
          value={habits.reduce((count, habit) => {
            const todayStatus = mergedLogs.get(
              `${habit.id}:${isoDate(today)}`,
            )?.status;
            return count + (todayStatus === "completed" ? 1 : 0);
          }, 0)}
          meta={`${habits.length || 0} total`}
          color="emerald"
        />
        <StatCard
          icon={<Sparkles size={18} />}
          label="Avg. completion"
          value={`${
            habits.length > 0
              ? Math.round(
                  habitRows.reduce(
                    (acc, habit) => acc + habit.stats.percentage,
                    0,
                  ) / habitRows.length,
                )
              : 0
          }%`}
          meta="This month"
          color="amber"
        />
      </div>

      {/* Today's Routines */}
<Card className="border-slate-800/40 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))]">
  <CardHeader>
    <CardTitle className="flex items-center justify-between text-slate-100">
  <div className="flex items-center gap-2">
    <CheckCircle2 size={18} />
    Today's Routines
  </div>

  <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md text-slate-300">
    {todayProgress.completed} / {todayProgress.eligible}
  </span>
</CardTitle>
  </CardHeader>

  <CardContent>
    {todaysRoutines.length === 0 ? (
      <p className="text-sm text-slate-500">
        All routines completed for today 🎉
      </p>
    ) : (
      <div className="space-y-2">
        {todaysRoutines.map((habit) => {
          const todayDay = days.find((d) => d.isToday);

          return (
            <div
  key={habit.id}
  className={cn(
    "flex items-center justify-between rounded-xl border border-slate-800/40 bg-slate-900/30 px-4 py-3 transition-all",
    habit.completed && "opacity-60"
  )}
>
  <span
    className={cn(
      "text-sm font-medium transition-all",
      habit.completed
        ? "line-through text-emerald-400"
        : "text-slate-200"
    )}
  >
    {habit.title}
  </span>

  {habit.completed && (
    <Check size={16} className="text-emerald-400" />
  )}
</div>
          );
        })}
      </div>
    )}
  </CardContent>
</Card>

      {/* Habit Tracker Section */}
      <Card className="border-slate-800/40 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))]">
        <CardHeader className="flex items-center border-b border-slate-800/30 pb-3">
          {/* Month navigation */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-700/50 bg-slate-950/50 px-1 py-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-slate-800/70 hover:text-slate-100"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-[140px] px-3 text-center text-sm font-semibold text-slate-100">
              {formatMonthLabel(viewDate)}
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-slate-800/70 hover:text-slate-100"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-3">
          {flashMessage && (
            <div
              className={cn(
                "rounded-xl border px-3 py-2 text-sm mb-3",
                flashMessage.type === "error"
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
              )}
            >
              {flashMessage.text}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300 mb-3">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 rounded-xl border border-slate-800/40 bg-slate-900/40 shimmer"
                />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/60 bg-slate-950/30 px-4 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/70 text-indigo-300">
                <CalendarDays size={20} />
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                No routines yet
              </h3>
              <p className="mt-2 max-w-sm text-xs text-slate-500">
                Start building consistency with your first routine.
              </p>
              <Button
                className="mt-4"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={openCreate}
              >
                Create routine
              </Button>
            </div>
          ) : (
            <div>
              <div
                ref={gridScrollRef}
                className="overflow-x-auto"
                style={{ width: "100%" }}
              >
                <div
                  className="grid gap-0 bg-slate-950/20 rounded-lg overflow-hidden"
                  style={{
                    gridTemplateColumns: gridColumns,
                  }}
                >
                  {/* Header Row */}
                  <div className="contents">
                    {/* Habit header cell */}
                    <div className="sticky left-0 z-20 bg-slate-900/20 px-3 py-2 text-left text-xs font-semibold text-slate-400 tracking-wider border-r border-slate-800/30 border-b border-slate-800/40 flex items-center">
                      ROUTINES
                    </div>

                    {/* Week group headers */}
                    {weekGroups.map((group, i) => (
                      <div
                        key={i}
                        className="border-l border-slate-800/30 px-2 py-1.5 text-center group flex flex-col items-center justify-center bg-slate-900/20 border-b border-slate-800/40"
                        style={{ gridColumn: `span ${group.days.length}` }}
                      >
                        <span className="text-[10px] font-semibold text-slate-300">
                          {group.label}
                        </span>
                      </div>
                    ))}

                    {/* Completed header */}
                    <div className="border-l border-slate-800/30 px-2 py-2 text-center text-xs font-semibold text-slate-400 tracking-wider flex items-center justify-center bg-slate-900/20 border-b border-slate-800/40">
                      DONE
                    </div>

                    {/* Total header */}
                    <div className="border-l border-slate-800/30 px-2 py-2 text-center text-xs font-semibold text-slate-400 tracking-wider flex items-center justify-center bg-slate-900/20 border-b border-slate-800/40">
                      TOTAL
                    </div>
                  </div>

                  {/* Sub-header Row - Day labels */}
                  <div className="contents">
                    {/* Empty cell for habit column */}
                    <div className="sticky left-0 z-10 bg-slate-900/10 px-3 border-r border-slate-800/30 border-b border-slate-800/20"></div>

                    {/* Day headers */}
                    {days.map((day) => {
                      const dateStr = format(day.date, "yyyy-MM-dd");
                      const isToday =
                        format(new Date(), "yyyy-MM-dd") === dateStr;
                      const dayLabels = [
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ];
                      return (
                        <div
                          key={day.key}
                          className={cn(
                            "border-l border-slate-800/20 px-1 py-2 text-center transition-colors flex flex-col items-center justify-center gap-0.5",
                            isToday && "bg-[rgba(120,140,255,0.08)]",
                          )}
                        >
                          <span className="text-[8px] font-medium text-slate-500 uppercase">
                            {dayLabels[getDay(day.date)]}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              isToday ? "text-indigo-300" : "text-slate-300",
                            )}
                          >
                            {format(day.date, "d")}
                          </span>
                        </div>
                      );
                    })}

                    {/* Empty cells for completion columns */}
                    <div className="border-l border-slate-800/20 px-2 py-1 border-b border-slate-800/20"></div>
                    <div className="border-l border-slate-800/20 px-2 py-1 border-b border-slate-800/20"></div>
                  </div>

                  {/* Habit Rows */}
                  {habitRows.map((habit, index) => {
                    const stats = habit.stats;
                    const rowInfo = getHabitRowInfo(habit);

                    return (
                      <React.Fragment key={habit.id}>
                        {/* Habit info cell */}
                        <div
                          className="sticky left-0 z-10 bg-slate-950/90 backdrop-blur-sm border-r border-slate-800/30 border-b border-slate-800/20 flex items-center px-2 py-1.5"
                          style={{
                            gridColumn: "1",
                            minHeight: "40px",
                            height: "40px",
                          }}
                        >
                          <div className="min-w-0 flex-1 flex items-center justify-between group">

  <div className="flex items-center gap-1.5">
    <h3 className="font-semibold text-slate-100 text-sm truncate">
      {habit.title}
    </h3>

    <span className="text-slate-500">•</span>

    <Badge
      variant="indigo"
      className="text-[10px] px-1.5 py-0.5 font-medium"
    >
      {rowInfo.frequencyBadge}
    </Badge>
  </div>

  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
    
    <button
      onClick={() => openEdit(habit)}
      className="text-slate-400 hover:text-indigo-300"
    >
      <Pencil size={14}/>
    </button>

    <button
      onClick={() => deleteHabit(habit.id)}
      className="text-slate-400 hover:text-red-400"
    >
      <Trash2 size={14}/>
    </button>

  </div>
</div>
                        </div>

                        {/* Day cells */}
                        {days.map((day) => {
                          const key = `${habit.id}:${day.key}`;
                          const cell = getCellState(
                            habit,
                            day,
                            mergedLogs,
                            today,
                          );
                          const isToday =
                            format(new Date(), "yyyy-MM-dd") ===
                            format(day.date, "yyyy-MM-dd");

                          const handleClick = () => {
                            if (!cell.interactive) return;
                            handleToggleCell(habit, day);
                          };

                          return (
                            <div
                              key={key}
                              className={cn(
                                "border-l border-slate-800/20 px-1 py-1.5 flex items-center justify-center",

                                isToday && "bg-[rgba(120,140,255,0.08)]",

                                habit.frequency === "weekly" &&
day.date.getDay() !== habit.weekly_day &&
"opacity-50"
                              )}
                            >
                              <button
                                onClick={handleClick}
                                className={cn(
                                  "flex items-center justify-center rounded-[5px] border transition-all duration-150 w-[22px] h-[22px]",

                                  !cell.interactive
                                    ? "border border-slate-700/40 bg-slate-900/30 bg-slate-900/50 cursor-not-allowed"
                                    : cell.completed
                                      ? "border-[rgba(16,185,129,0.6)] bg-[rgba(16,185,129,0.25)] text-emerald-400"
                                      : cell.past
                                        ? "border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.03)]"
                                        : "border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(120,160,255,0.7)] hover:bg-[rgba(120,160,255,0.15)] hover:scale-110 cursor-pointer",
                                )}
                                aria-label={`${habit.title} - ${day.key} - ${cell.status}`}
                              >
                                {cell.completed && (
  <Check size={12} className="text-emerald-400" />
)}

{!cell.interactive && (habit.frequency === "weekly" || habit.frequency === "custom") && (
  <span className="text-[10px] text-slate-600">×</span>
)}
                              </button>
                            </div>
                          );
                        })}

                        {/* Completed summary */}
                        <div className="border-l border-slate-800/20 px-3 py-2 text-center border-b border-slate-800/20 flex items-center justify-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-xs font-semibold text-slate-300">
                              {stats.completedDays}/{stats.eligibleDays || 0}
                            </span>
                          </div>
                        </div>

                        {/* Total summary */}
                        <div className="border-l border-slate-800/20 px-3 py-2 text-center border-b border-slate-800/20 flex items-center justify-center">
                          <div className="flex flex-col items-center justify-center">
                            <div
                              className={cn(
                                "text-xs font-bold px-1.5 py-0.5 rounded",
                                getPercentageColor(stats.percentage),
                              )}
                            >
                              {Math.min(stats.percentage || 0, 100)}%
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingHabit ? "Edit Routine" : "Create Routine"}
        description={
          editingHabit
            ? "Update your routine details below."
            : "Add a routine you want to show up in your monthly tracker."
        }
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleSaveHabit}>
          <div className="space-y-4">
            <Input
              label="Routine Title *"
              placeholder="e.g. Review DSA for 30 minutes"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />

            <Textarea
              label="Description (optional)"
              rows={3}
              placeholder="Add context for routine, why it matters, or what done looks like."
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Select
                  label="Frequency"
                  value={form.frequency}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      frequency: event.target.value,
                    }))
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom Days</option>
                </Select>
              </div>

              {form.frequency === "weekly" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Day
                  </label>

                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            weekly_day: index,
                          }))
                        }
                        className={cn(
                          "p-2 rounded-lg border text-xs font-medium transition",
                          form.weekly_day === index
                            ? "bg-indigo-500/20 border-indigo-400 text-indigo-300"
                            : "border-slate-700 text-slate-400 hover:bg-slate-800",
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.frequency === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Days
                  </label>

                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day, index) => {
                      const selected = form.custom_days?.includes(index);

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = [...(form.custom_days || [])];

                            if (selected) {
                              const i = days.indexOf(index);
                              if (i !== -1) days.splice(i, 1);
                            } else {
                              days.push(index);
                            }

                            setForm((current) => ({
                              ...current,
                              custom_days: days,
                            }));
                          }}
                          className={cn(
                            "p-2 rounded-lg border text-xs font-medium transition",
                            selected
                              ? "bg-indigo-500/20 border-indigo-400 text-indigo-300"
                              : "border-slate-700 text-slate-400 hover:bg-slate-800",
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <Input
                  label="Start Date"
                  type="date"
                  value={form.start_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      start_date: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Input
                  label="Reminder Time (optional)"
                  type="time"
                  value={form.reminder_time}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reminder_time: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                className="flex-1 px-3 py-2 text-sm font-medium"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 px-3 py-2 text-sm font-medium bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50"
                disabled={saving}
              >
                {editingHabit ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <style>{`
        @keyframes habitCellBounce {
          0% { transform: scale(1); }
          35% { transform: scale(1.14); }
          70% { transform: scale(0.96); }
          100% { transform: scale(1); }
        }

        .habit-cell-bounce {
          animation: habitCellBounce 150ms ease-out;
        }

        /* Soft grid borders */
        .grid > div {
          border-color: rgba(255, 255, 255, 0.05);
        }

        /* Week separator rows - slightly stronger */
        .grid > div:first-child {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        /* Habit row separators */
        .grid > div:nth-child(n+3) {
          border-bottom-color: rgba(255, 255, 255, 0.05);
        }

        /* Smooth transitions */
        .grid > div {
          transition: all 0.15s ease;
        }

        /* Cell hover effect */
        button:not(:disabled):hover {
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.2);
        }

        button:active:not(:disabled) {
          transform: scale(0.95);
        }

        /* Sticky column shadow */
        .sticky.left-0 {
          box-shadow: 4px 0 16px rgba(0, 0, 0, 0.12);
        }

        /* Ensure grid fits container */
        .overflow-x-auto {
          overflow-x: auto !important;
        }

        /* Custom scrollbar for webkit */
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }

        .overflow-x-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
