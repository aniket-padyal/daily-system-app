const ANCHORS = [
  {
    id: "chant",
    name: "Wake + Chant",
    sub: "No phone. 5 min chanting. First thing.",
    pill: "5 min",
  },
  {
    id: "gym",
    name: "Move",
    sub: "Gym — or 15 min home workout if late.",
    pill: "non-neg",
  },
  {
    id: "study1",
    name: "Study block 1",
    sub: "Open laptop. Sit down. Start. No ritual.",
    pill: "2 pomodoros",
  },
  {
    id: "study2",
    name: "Study block 2",
    sub: "After a real break. Even 1 counts.",
    pill: "1–2 pomodoros",
  },
  {
    id: "wind",
    name: "Wind down",
    sub: "Read → Chant → 3 lines → Sleep.",
    pill: "closes the day",
  },
];

function todayKey() {
  const d = new Date();
  return (
    "day-" +
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function keyForDate(d) {
  return (
    "day-" +
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function loadDay(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { checked: {}, late: false, ref: { did: "", skip: "", tmr: "" } };
}

function saveDay(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {}
}

function loadStreak() {
  try {
    const raw = localStorage.getItem("streak-data");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { streak: 0, last: "" };
}

function saveStreak(data) {
  try {
    localStorage.setItem("streak-data", JSON.stringify(data));
  } catch (e) {}
}

function updateStreak(doneCount) {
  const today = todayKey().replace("day-", "");
  let sd = loadStreak();
  if (doneCount === 5) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = keyForDate(d).replace("day-", "");
    if (sd.last === yesterday) sd.streak += 1;
    else if (sd.last !== today) sd.streak = 1;
    sd.last = today;
    saveStreak(sd);
  }
  return sd.streak;
}

let state = loadDay(todayKey());

function render() {
  const doneCount = Object.values(state.checked).filter(Boolean).length;

  // Header
  const now = new Date();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  document.getElementById("day-name").textContent = dayNames[now.getDay()];
  document.getElementById("date-full").textContent =
    now.getDate() + " " + monthNames[now.getMonth()] + " " + now.getFullYear();

  // Streak
  const streak =
    doneCount === 5 ? updateStreak(doneCount) : loadStreak().streak;
  document.getElementById("streak-num").textContent = streak;
  const sb = document.getElementById("streak-block");
  if (streak > 0) sb.classList.add("fire");
  else sb.classList.remove("fire");

  // Progress
  document.getElementById("progress-label").textContent = doneCount + " / 5";
  document.getElementById("progress-fill").style.width =
    (doneCount / 5) * 100 + "%";

  // Late toggle
  const lt = document.getElementById("late-toggle");
  const ln = document.getElementById("late-note");
  lt.classList.toggle("on", !!state.late);
  ln.classList.toggle("show", !!state.late);

  // Anchors
  const list = document.getElementById("anchor-list");
  list.innerHTML = "";
  ANCHORS.forEach((a) => {
    const done = !!state.checked[a.id];
    const div = document.createElement("div");
    div.className = "anchor" + (done ? " done" : "");
    div.onclick = () => {
      state.checked[a.id] = !state.checked[a.id];
      saveDay(todayKey(), state);
      render();
    };
    div.innerHTML =
      '<div class="check-circle"><i class="ti ti-check"></i></div>' +
      '<div class="anchor-body">' +
      '<div class="anchor-name">' +
      a.name +
      "</div>" +
      '<div class="anchor-sub">' +
      a.sub +
      "</div>" +
      "</div>" +
      '<div class="anchor-pill">' +
      a.pill +
      "</div>";
    list.appendChild(div);
  });

  // Complete banner
  document
    .getElementById("complete-banner")
    .classList.toggle("show", doneCount === 5);

  // Reflection
  document.getElementById("ref-did").value = state.ref.did || "";
  document.getElementById("ref-skip").value = state.ref.skip || "";
  document.getElementById("ref-tmr").value = state.ref.tmr || "";

  // History
  renderHistory();
}

function renderHistory() {
  const grid = document.getElementById("history-grid");
  grid.innerHTML = "";
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = keyForDate(d);
    const dayData = loadDay(key);
    const count = Object.values(dayData.checked).filter(Boolean).length;
    const dot = document.createElement("div");
    dot.className =
      "history-dot" + (count === 5 ? " full" : count > 0 ? " partial" : "");
    dot.innerHTML = '<span class="dot-date">' + d.getDate() + "</span>";
    dot.title = d.toDateString() + ": " + count + "/5 anchors";
    grid.appendChild(dot);
  }
}

function toggleLate() {
  state.late = !state.late;
  saveDay(todayKey(), state);
  render();
}

function saveReflection() {
  state.ref = {
    did: document.getElementById("ref-did").value,
    skip: document.getElementById("ref-skip").value,
    tmr: document.getElementById("ref-tmr").value,
  };
  saveDay(todayKey(), state);
  const msg = document.getElementById("saved-msg");
  msg.classList.add("show");
  setTimeout(() => msg.classList.remove("show"), 2000);
}

// Auto-refresh at midnight
function scheduleNextDay() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;
  setTimeout(() => {
    state = loadDay(todayKey());
    render();
    scheduleNextDay();
  }, msUntilMidnight);
}

render();
scheduleNextDay();
