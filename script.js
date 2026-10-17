// ---------- Көмекші функциялар ----------
const $ = id => document.getElementById(id);
const load = (key, def) => JSON.parse(localStorage.getItem(key)) || def;
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

let tasks = load("tasks", []);
let lessons = load("lessons", []);
let exams = load("exams", []);

// ---------- Табтарды ауыстыру ----------
document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("nav button, .tab").forEach(e => e.classList.remove("active"));
    btn.classList.add("active");
    $(btn.dataset.tab).classList.add("active");
  };
});

// ---------- Тапсырмалар ----------
$("addTask").onclick = () => {
  const title = $("taskTitle").value.trim();
  if (!title) return;
  tasks.push({ title, date: $("taskDate").value, done: false });
  $("taskTitle").value = "";
  save("tasks", tasks);
  renderTasks();
};

function renderTasks() {
  const today = new Date().toISOString().slice(0, 10);
  $("taskList").innerHTML = "";
  tasks.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  tasks.forEach((t, i) => {
    const late = t.date && t.date < today && !t.done;
    const li = document.createElement("li");
    if (t.done) li.className = "done";
    li.innerHTML = `<input type="checkbox" ${t.done ? "checked" : ""}>
      <span>${t.title}</span>
      <small class="${late ? "late" : ""}">${t.date || ""}${late ? " ⚠" : ""}</small>
      <button class="del">✕</button>`;
    li.querySelector("input").onchange = () => { t.done = !t.done; save("tasks", tasks); renderTasks(); };
    li.querySelector(".del").onclick = () => { tasks.splice(i, 1); save("tasks", tasks); renderTasks(); };
    $("taskList").appendChild(li);
  });
  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  $("taskBar").style.width = pct + "%";
  $("taskStat").textContent = `Орындалды: ${done} / ${tasks.length} (${pct}%)`;
}

// ---------- Сабақ кестесі ----------
$("addLesson").onclick = () => {
  const subject = $("schSubject").value.trim();
  if (!subject || !$("schTime").value) return;
  lessons.push({ day: $("schDay").value, time: $("schTime").value, subject });
  $("schSubject").value = "";
  save("lessons", lessons);
  renderSchedule();
};

function renderSchedule() {
  const days = ["Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма", "Сенбі"];
  $("scheduleGrid").innerHTML = "";
  days.forEach(day => {
    const box = document.createElement("div");
    box.className = "day";
    box.innerHTML = `<h3>${day}</h3>`;
    lessons.filter(l => l.day === day)
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach(l => {
        const el = document.createElement("div");
        el.className = "lesson";
        el.innerHTML = `<span>${l.time} — ${l.subject}</span><button class="del">✕</button>`;
        el.querySelector("button").onclick = () => {
          lessons.splice(lessons.indexOf(l), 1);
          save("lessons", lessons);
          renderSchedule();
        };
        box.appendChild(el);
      });
    $("scheduleGrid").appendChild(box);
  });
}

// ---------- Pomodoro ----------
let seconds = 25 * 60, interval = null;
let sessions = load("sessions", { date: "", count: 0 });
const todayStr = new Date().toDateString();
if (sessions.date !== todayStr) sessions = { date: todayStr, count: 0 };

function showTime() {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  $("timer").textContent = `${m}:${s}`;
  document.title = `${m}:${s} — Study Time`;
}

document.querySelectorAll(".mode").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".mode").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    stopTimer();
    seconds = Number(btn.dataset.min) * 60;
    showTime();
  };
});

function stopTimer() {
  clearInterval(interval);
  interval = null;
  $("startBtn").textContent = "▶ Бастау";
}

$("startBtn").onclick = () => {
  if (interval) return stopTimer();
  $("startBtn").textContent = "⏸ Тоқтату";
  interval = setInterval(() => {
    seconds--;
    showTime();
    if (seconds <= 0) {
      stopTimer();
      if (document.querySelector(".mode.active").dataset.min === "25") {
        sessions.count++;
        save("sessions", sessions);
        $("sessions").textContent = sessions.count;
      }
      alert("Уақыт бітті! 🎉");
    }
  }, 1000);
};

$("resetBtn").onclick = () => {
  stopTimer();
  seconds = Number(document.querySelector(".mode.active").dataset.min) * 60;
  showTime();
};

// ---------- Емтихан прогресі ----------
$("addExam").onclick = () => {
  const subject = $("exSubject").value.trim();
  const total = Number($("exTopics").value);
  if (!subject || total < 1) return;
  exams.push({ subject, date: $("exDate").value, total, done: 0 });
  $("exSubject").value = "";
  $("exTopics").value = "";
  save("exams", exams);
  renderExams();
};

function renderExams() {
  $("examList").innerHTML = "";
  exams.forEach((e, i) => {
    const pct = Math.round(e.done / e.total * 100);
    let left = "";
    if (e.date) {
      const d = Math.ceil((new Date(e.date) - new Date()) / 86400000);
      left = d >= 0 ? `${d} күн қалды` : "Емтихан өтті";
    }
    const box = document.createElement("div");
    box.className = "exam";
    box.innerHTML = `
      <div class="top"><b>${e.subject}</b><span class="muted">${left}</span>
        <button class="del">✕</button></div>
      <div class="bar"><div style="width:${pct}%"></div></div>
      <div class="row">
        <button class="ghost minus">−</button>
        <button class="plus">+ Тақырып үйрендім</button>
        <span class="muted">${e.done}/${e.total} (${pct}%)</span>
      </div>`;
    box.querySelector(".plus").onclick = () => { if (e.done < e.total) e.done++; save("exams", exams); renderExams(); };
    box.querySelector(".minus").onclick = () => { if (e.done > 0) e.done--; save("exams", exams); renderExams(); };
    box.querySelector(".del").onclick = () => { exams.splice(i, 1); save("exams", exams); renderExams(); };
    $("examList").appendChild(box);
  });
}

// ---------- Іске қосу ----------
$("sessions").textContent = sessions.count;
renderTasks();
renderSchedule();
renderExams();
showTime();
