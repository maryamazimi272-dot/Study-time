// ===== Күй (state) және сақтау =====
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const today = () => new Date().toLocaleDateString("sv-SE");
const DAYS = ["Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма", "Сенбі"];
const S = Object.assign({ tasks: [], lessons: [], exams: [], log: {}, xp: 0, theme: "light" },
  JSON.parse(localStorage.getItem("st2") || "{}"));
const save = () => { localStorage.setItem("st2", JSON.stringify(S)); render(); };

function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
function addXp(n) {
  const before = Math.floor(S.xp / 100);
  S.xp += n;
  toast(`+${n} XP ⚡`);
  if (Math.floor(S.xp / 100) > before) setTimeout(() => toast("🎉 Жаңа деңгей!"), 2300);
}
function streak() {
  let n = 0, d = new Date();
  if (!S.log[today()]) d.setDate(d.getDate() - 1);
  while (S.log[d.toLocaleDateString("sv-SE")] > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ===== Навигация және тема =====
document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
  document.querySelectorAll("nav button, .tab").forEach(e => e.classList.remove("on"));
  b.classList.add("on"); $(b.dataset.t).classList.add("on");
});
$("theme").onclick = () => { S.theme = S.theme === "dark" ? "light" : "dark"; save(); };

// ===== Тапсырмалар =====
$("addTask").onclick = () => {
  const title = $("tTitle").value.trim(); if (!title) return;
  S.tasks.push({ title, date: $("tDate").value, p: $("tPrio").value, done: false });
  $("tTitle").value = ""; save();
};
$("filter").onchange = render;
$("taskList").onclick = e => {
  const c = e.target.dataset;
  if (c.d !== undefined) { S.tasks.splice(+c.d, 1); save(); }
  else if (c.c !== undefined) { const t = S.tasks[+c.c]; t.done = !t.done; if (t.done) addXp(10); save(); }
};
function rTasks() {
  const f = $("filter").value, pr = { h: 0, m: 1, l: 2 }, name = { h: "Жоғары", m: "Орта", l: "Төмен" };
  const list = S.tasks.map((t, i) => ({ t, i }))
    .filter(({ t }) => f === "all" || (f === "done") === t.done)
    .sort((a, b) => a.t.done - b.t.done || pr[a.t.p] - pr[b.t.p] || (a.t.date || "9").localeCompare(b.t.date || "9"));
  $("taskList").innerHTML = list.map(({ t, i }) => {
    const late = t.date && t.date < today() && !t.done;
    return `<li class="${t.done ? "done" : ""}"><input type="checkbox" data-c="${i}" ${t.done ? "checked" : ""}>
      <span>${esc(t.title)}</span><em class="p ${t.p}">${name[t.p]}</em>
      <small class="${late ? "late" : ""}">${t.date || ""}${late ? " ⚠" : ""}</small>
      <button class="x" data-d="${i}">✕</button></li>`;
  }).join("") || '<p class="muted">Тапсырма жоқ</p>';
}

// ===== Кесте =====
$("addLes").onclick = () => {
  const subject = $("sSub").value.trim(); if (!subject || !$("sTime").value) return;
  S.lessons.push({ day: $("sDay").value, time: $("sTime").value, subject });
  $("sSub").value = ""; save();
};
$("grid").onclick = e => { if (e.target.dataset.d !== undefined) { S.lessons.splice(+e.target.dataset.d, 1); save(); } };
function rSched() {
  $("grid").innerHTML = DAYS.map(d => `<div class="day"><h4>${d}</h4>` +
    S.lessons.map((l, i) => ({ l, i })).filter(o => o.l.day === d)
      .sort((a, b) => a.l.time.localeCompare(b.l.time))
      .map(({ l, i }) => `<div class="les"><span>${l.time} — ${esc(l.subject)}</span><button class="x" data-d="${i}">✕</button></div>`).join("") + "</div>").join("");
}

// ===== Емтихан =====
$("addExam").onclick = () => {
  const subject = $("eSub").value.trim(), total = +$("eTop").value;
  if (!subject || total < 1) return;
  S.exams.push({ subject, date: $("eDate").value, total, done: 0 });
  $("eSub").value = ""; $("eTop").value = ""; save();
};
$("examList").onclick = e => {
  const c = e.target.dataset, x = S.exams[+c.i];
  if (c.a === "+" && x.done < x.total) { x.done++; addXp(5); save(); }
  if (c.a === "-" && x.done > 0) { x.done--; save(); }
  if (c.a === "x") { S.exams.splice(+c.i, 1); save(); }
};
function daysTo(date) { return Math.ceil((new Date(date) - new Date(today())) / 864e5); }
function rExams() {
  $("examList").innerHTML = S.exams.map((e, i) => {
    const pct = Math.round(e.done / e.total * 100);
    const d = e.date ? daysTo(e.date) : null;
    return `<div class="ex"><div class="t"><b>${esc(e.subject)}</b>
      <small>${d === null ? "" : d >= 0 ? d + " күн қалды" : "Өтті"}</small><button class="x" data-a="x" data-i="${i}">✕</button></div>
      <div class="bar"><div style="width:${pct}%"></div></div>
      <div class="row"><button class="ghost" data-a="-" data-i="${i}">−</button>
      <button data-a="+" data-i="${i}">+ Тақырып үйрендім</button><small>${e.done}/${e.total} (${pct}%)</small></div></div>`;
  }).join("") || '<p class="muted">Емтихан қосыңыз</p>';
}

// ===== Басты бет =====
function rHome() {
  const lvl = Math.floor(S.xp / 100) + 1;
  $("lvl").textContent = `${lvl}-деңгей · ${S.xp} XP`;
  $("xpbar").style.width = (S.xp % 100) + "%";
  const done = S.tasks.filter(t => t.done).length;
  $("sFocus").textContent = S.log[today()] || 0;
  $("sDone").textContent = done;
  $("sStreak").textContent = streak();

  // Ақылды жоспар
  const p = [], idx = (new Date().getDay() + 6) % 7;
  S.lessons.filter(l => l.day === DAYS[idx]).sort((a, b) => a.time.localeCompare(b.time))
    .forEach(l => p.push(`🗓 ${l.time} — ${esc(l.subject)}`));
  const due = S.tasks.filter(t => !t.done && t.date && t.date <= today()).length;
  if (due) p.push(`⚠ ${due} тапсырманың мерзімі бүгін немесе өтіп кеткен`);
  S.exams.forEach(e => {
    const left = e.total - e.done; if (left <= 0 || !e.date) return;
    const d = daysTo(e.date); if (d < 0) return;
    p.push(`🎯 ${esc(e.subject)}: бүгін ${Math.ceil(left / Math.max(d, 1))} тақырып оқы (${d} күн қалды)`);
  });
  if (!S.log[today()]) p.push("🍅 Бүгін әлі фокус сессиясы жоқ — бастайық!");
  $("plan").innerHTML = p.map(x => `<li>${x}</li>`).join("") || "<li>Бәрі дайын! 🎉</li>";

  // Апталық график
  const mx = Math.max(30, ...Object.values(S.log)), wd = ["Жс", "Дс", "Сс", "Ср", "Бс", "Жм", "Сб"];
  let h = "";
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const m = S.log[d.toLocaleDateString("sv-SE")] || 0;
    h += `<div class="col"><small>${m}</small><div class="bar2" style="height:${m / mx * 85}%"></div><small>${wd[d.getDay()]}</small></div>`;
  }
  $("chart").innerHTML = h;

  // Жетістіктер
  const tot = Object.values(S.log).reduce((a, b) => a + b, 0);
  const B = [["🌱", "Алғашқы тапсырма", done >= 1], ["🔥", "3 күн қатарынан", streak() >= 3],
    ["⏱", "100 минут фокус", tot >= 100], ["🏆", "5 тапсырма", done >= 5], ["🚀", "3-деңгей", lvl >= 3]];
  $("badges").innerHTML = B.map(([i, n, ok]) => `<span class="b ${ok ? "on" : ""}">${i} ${n}</span>`).join("");
}

// ===== Фокус таймері =====
let mode = "w", left = 25 * 60, end = 0, iv = null;
const dur = () => Math.max(1, +$(mode === "w" ? "wMin" : "bMin").value || 25) * 60;
function draw() {
  const m = String(Math.floor(left / 60)).padStart(2, "0"), s = String(left % 60).padStart(2, "0");
  $("timer").textContent = `${m}:${s}`;
  $("ring").style.strokeDashoffset = 565.5 * (1 - left / dur());
  document.title = iv ? `${m}:${s} — Study Time` : "Study Time 📚";
}
function stop() { clearInterval(iv); iv = null; $("start").textContent = "▶ Бастау"; }
function setMode(m) {
  stop(); mode = m; left = dur(); draw();
  document.querySelectorAll(".mode").forEach(b => b.classList.toggle("on", b.dataset.m === m));
}
function beep() {
  try { const a = new AudioContext(), o = a.createOscillator(); o.connect(a.destination); o.frequency.value = 880; o.start(); o.stop(a.currentTime + .5); } catch (e) {}
}
function tick() {
  left = Math.max(0, Math.round((end - Date.now()) / 1000)); draw();
  if (left > 0) return;
  beep();
  if (mode === "w") {
    S.log[today()] = (S.log[today()] || 0) + Math.round(dur() / 60);
    addXp(20); setMode("b"); save();
  } else { setMode("w"); toast("Үзіліс бітті, жұмысқа! 💪"); }
}
$("start").onclick = () => {
  if (iv) { left = Math.round((end - Date.now()) / 1000); stop(); return draw(); }
  end = Date.now() + left * 1000; iv = setInterval(tick, 250);
  $("start").textContent = "⏸ Тоқтату";
};
$("reset").onclick = () => setMode(mode);
document.querySelectorAll(".mode").forEach(b => b.onclick = () => setMode(b.dataset.m));
$("wMin").onchange = $("bMin").onchange = () => setMode(mode);

// ===== Экспорт / импорт =====
$("exp").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: "application/json" }));
  a.download = "study-time.json"; a.click();
};
$("imp").onchange = e => {
  const r = new FileReader();
  r.onload = () => { try { Object.assign(S, JSON.parse(r.result)); save(); toast("Импортталды ✅"); } catch (x) { toast("Қате файл"); } };
  r.readAsText(e.target.files[0]);
};

// ===== Іске қосу =====
function render() {
  document.documentElement.dataset.theme = S.theme;
  $("theme").textContent = S.theme === "dark" ? "☀️" : "🌙";
  rTasks(); rSched(); rExams(); rHome();
}
render(); draw();
