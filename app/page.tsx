"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Habit {
  id: string;
  name: string;
  goal: number;
}

const DEFAULT_HABITS: Habit[] = [
  { id: "prayer", name: "Prayer", goal: 31 },
  { id: "scriptures", name: "Scriptures", goal: 31 },
  { id: "temple", name: "Temple", goal: 1 },
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DOW_SHORT = ["S","M","T","W","T","F","S"];

interface HabitState {
  habits: Habit[];
  completedDays: Record<string, Record<string, number[]>>;
}

function loadState(): HabitState {
  if (typeof window === "undefined") return { habits: DEFAULT_HABITS, completedDays: {} };
  try {
    const raw = localStorage.getItem("habit-data");
    if (!raw) return { habits: DEFAULT_HABITS, completedDays: {} };
    const parsed = JSON.parse(raw) as HabitState;
    if (!parsed.habits?.length) parsed.habits = DEFAULT_HABITS;
    return parsed;
  } catch {
    return { habits: DEFAULT_HABITS, completedDays: {} };
  }
}
function saveState(s: HabitState) {
  localStorage.setItem("habit-data", JSON.stringify(s));
}
function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

export default function Home() {
  const today = new Date();
  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [state, setState] = useState<HabitState>({ habits: DEFAULT_HABITS, completedDays: {} });
  const [hydrated, setHydrated] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");

  useEffect(() => { setState(loadState()); setHydrated(true); }, []);

  function update(next: HabitState) { setState(next); saveState(next); }
  function monthKey() { return `${curYear}-${String(curMonth+1).padStart(2,"0")}`; }
  function getDone(id: string): number[] { return state.completedDays[monthKey()]?.[id] ?? []; }

  function toggleDay(habitId: string, day: number) {
    const key = monthKey();
    const monthData = { ...(state.completedDays[key] ?? {}) };
    const days = [...(monthData[habitId] ?? [])];
    const idx = days.indexOf(day);
    if (idx === -1) days.push(day); else days.splice(idx, 1);
    monthData[habitId] = days;
    update({ ...state, completedDays: { ...state.completedDays, [key]: monthData } });
  }

  function changeMonth(dir: number) {
    let m = curMonth + dir, y = curYear;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setCurMonth(m); setCurYear(y);
  }

  function addHabit() {
    const name = newName.trim();
    const goal = parseInt(newGoal, 10);
    if (!name || isNaN(goal) || goal < 1) return;
    update({ ...state, habits: [...state.habits, { id: `custom_${Date.now()}`, name, goal }] });
    setNewName(""); setNewGoal(""); setShowAddForm(false);
  }

  function deleteHabit(id: string) {
    update({ ...state, habits: state.habits.filter(h => h.id !== id) });
  }

  const dim = daysInMonth(curYear, curMonth);
  const isCurrentMonth = curYear === today.getFullYear() && curMonth === today.getMonth();
  const firstDOW = new Date(curYear, curMonth, 1).getDay();

  let totalDone = 0, totalGoal = 0, goalsHit = 0;
  for (const h of state.habits) {
    const done = getDone(h.id).length;
    totalDone += done; totalGoal += h.goal;
    if (done >= h.goal) goalsHit++;
  }
  const overallPct = totalGoal > 0 ? Math.round((totalDone / totalGoal) * 100) : 0;

  return (
    <div style={{ minHeight: "100%", background: "var(--cream)" }}>

      {/* ── Header ── */}
      <header style={{ background: "var(--cream)", borderBottom: "1px solid var(--border-soft)", padding: "28px 32px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 52,
                lineHeight: 1,
                color: "var(--gold)",
                letterSpacing: "-0.01em",
              }}
            >
              Nate&rsquo;s
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 20,
                color: "var(--navy)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Closer to Christ Habits
            </div>
          </div>
          <Link
            href="/read"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--navy)",
              border: "1.5px solid var(--border)",
              borderRadius: 8,
              padding: "9px 16px",
              textDecoration: "none",
              letterSpacing: "0.02em",
              transition: "background 0.15s, border-color 0.15s",
              background: "transparent",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--gold-muted)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--gold)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
            }}
          >
            Open Scripture Reader →
          </Link>
        </div>
        <div className="gold-rule" style={{ marginTop: 20 }} />
      </header>

      <div style={{ maxWidth: "fit-content", margin: "0 auto", padding: "28px 32px 40px" }}>

        {/* ── Month nav ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <button
            onClick={() => changeMonth(-1)}
            style={{
              background: "var(--cream-card)",
              border: "1.5px solid var(--border)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              color: "var(--text-body)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            ←
          </button>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 26,
              color: "var(--navy)",
              minWidth: 180,
              textAlign: "center",
              letterSpacing: "0.01em",
            }}
          >
            {MONTH_NAMES[curMonth]} {curYear}
          </span>
          <button
            onClick={() => changeMonth(1)}
            style={{
              background: "var(--cream-card)",
              border: "1.5px solid var(--border)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              color: "var(--text-body)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            →
          </button>
        </div>

        {/* ── Habit table card ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse" }}>
              <thead>
                {/* Day-of-week row */}
                <tr>
                  <th style={{ width: 120, minWidth: 120 }} />
                  {Array.from({ length: dim }, (_, i) => {
                    const dow = (firstDOW + i) % 7;
                    const isWeekend = dow === 0 || dow === 6;
                    return (
                      <th
                        key={i}
                        style={{
                          width: 34, minWidth: 34,
                          textAlign: "center",
                          fontFamily: "var(--font-body)",
                          fontWeight: 500,
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          color: isWeekend ? "var(--gold)" : "var(--muted)",
                          paddingTop: 16,
                          paddingBottom: 2,
                        }}
                      >
                        {DOW_SHORT[dow]}
                      </th>
                    );
                  })}
                  <th style={{ width: 32 }} />
                </tr>

                {/* Date number row */}
                <tr>
                  <th style={{ paddingLeft: 24, textAlign: "left" }}>
                    <span style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}>
                      Habit
                    </span>
                  </th>
                  {Array.from({ length: dim }, (_, i) => {
                    const day = i + 1;
                    const isToday = isCurrentMonth && day === today.getDate();
                    return (
                      <th
                        key={i}
                        style={{
                          textAlign: "center",
                          fontFamily: "var(--font-body)",
                          fontWeight: isToday ? 700 : 400,
                          fontSize: 11,
                          color: isToday ? "var(--gold)" : "var(--muted)",
                          paddingBottom: 8,
                        }}
                      >
                        {day}
                      </th>
                    );
                  })}
                  <th />
                </tr>
              </thead>

              <tbody>
                {state.habits.map((habit, rowIdx) => {
                  const doneDays = getDone(habit.id);
                  const doneCount = doneDays.length;
                  const pct = habit.goal > 0 ? Math.round((doneCount / habit.goal) * 100) : 0;
                  const isLast = rowIdx === state.habits.length - 1;
                  const borderStyle = "1px solid var(--border-soft)";

                  return (
                    <tr key={habit.id}>
                      {/* Habit name cell */}
                      <td
                        style={{
                          paddingLeft: 24,
                          paddingRight: 16,
                          paddingTop: 10,
                          paddingBottom: isLast ? 20 : 10,
                          borderTop: borderStyle,
                          verticalAlign: "middle",
                          minWidth: 120,
                        }}
                      >
                        <div style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: 16,
                          color: "var(--navy)",
                          lineHeight: 1.2,
                        }}>
                          {habit.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                          <div style={{
                            height: 2,
                            width: `${pct}%`,
                            maxWidth: 64,
                            minWidth: 0,
                            background: "var(--gold)",
                            borderRadius: 2,
                            transition: "width 0.4s",
                          }} />
                          <span style={{
                            fontSize: 10,
                            color: "var(--muted)",
                            fontFamily: "var(--font-body)",
                            whiteSpace: "nowrap",
                          }}>
                            {hydrated ? `${doneCount}/${habit.goal}` : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Day checkboxes */}
                      {Array.from({ length: dim }, (_, i) => {
                        const day = i + 1;
                        const isDone = doneDays.includes(day);
                        const isToday = isCurrentMonth && day === today.getDate();
                        return (
                          <td
                            key={day}
                            style={{
                              padding: "5px 3px",
                              borderTop: borderStyle,
                              paddingBottom: isLast ? 20 : 5,
                              verticalAlign: "middle",
                            }}
                          >
                            <button
                              onClick={() => toggleDay(habit.id, day)}
                              title={`${MONTH_NAMES[curMonth]} ${day}`}
                              style={{
                                width: 26,
                                height: 26,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 5,
                                border: isDone
                                  ? "2px solid var(--navy)"
                                  : isToday
                                  ? "2px solid var(--gold)"
                                  : "2px solid var(--border)",
                                background: isDone ? "var(--navy)" : "transparent",
                                color: isDone ? "white" : "transparent",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 700,
                                lineHeight: 1,
                                transition: "all 0.08s ease",
                                flexShrink: 0,
                              }}
                              onMouseEnter={e => {
                                if (!isDone) {
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--navy)";
                                  (e.currentTarget as HTMLButtonElement).style.background = "var(--gold-muted)";
                                }
                              }}
                              onMouseLeave={e => {
                                if (!isDone) {
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = isToday ? "var(--gold)" : "var(--border)";
                                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                }
                              }}
                            >
                              {isDone ? "✓" : ""}
                            </button>
                          </td>
                        );
                      })}

                      {/* Delete */}
                      <td
                        style={{
                          paddingLeft: 10,
                          paddingRight: 20,
                          borderTop: borderStyle,
                          paddingBottom: isLast ? 20 : 5,
                          verticalAlign: "middle",
                        }}
                      >
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          title="Remove"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--border)",
                            fontSize: 18,
                            lineHeight: 1,
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#e57373")}
                          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "var(--border)")}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Add Goal ── */}
        {showAddForm ? (
          <div className="card" style={{ marginTop: 16, padding: "20px 24px" }}>
            <p style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 18,
              color: "var(--navy)",
              marginBottom: 12,
            }}>
              Add a new goal
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                autoFocus
                type="text"
                placeholder="Habit name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addHabit()}
                style={{
                  flex: 1,
                  border: "1.5px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 14px",
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  color: "var(--text)",
                  background: "var(--cream)",
                  outline: "none",
                  minWidth: 160,
                }}
              />
              <input
                type="number"
                placeholder="Days/mo"
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addHabit()}
                style={{
                  width: 96,
                  border: "1.5px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  color: "var(--text)",
                  background: "var(--cream)",
                  outline: "none",
                }}
                min={1} max={31}
              />
              <button
                onClick={addHabit}
                style={{
                  background: "var(--navy)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                  letterSpacing: "0.03em",
                }}
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  background: "transparent",
                  color: "var(--muted)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 16px",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "14px",
              background: "transparent",
              border: "1.5px dashed var(--border)",
              borderRadius: 12,
              fontSize: 13,
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              color: "var(--muted)",
              cursor: "pointer",
              letterSpacing: "0.03em",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
            }}
          >
            + Add Goal
          </button>
        )}

        {/* ── Monthly Stats ── */}
        <div className="card" style={{ marginTop: 24, padding: "24px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}>
              {MONTH_NAMES[curMonth]} Overview
            </span>
            <div className="gold-rule" style={{ flex: 1 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, textAlign: "center" }}>
            {[
              { value: hydrated ? `${overallPct}%` : "—", label: "Progress" },
              { value: hydrated ? totalDone : "—", label: "Check-ins" },
              { value: hydrated ? goalsHit : "—", label: "Goals Met" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 300,
                  fontSize: 44,
                  lineHeight: 1,
                  color: "var(--navy)",
                  letterSpacing: "-0.02em",
                }}>
                  {value}
                </div>
                <div style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginTop: 6,
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
