const storageKey = "video-vocabulary-known-v1";
const labels = { S: "S list", T: "T list", U: "U list", Review: "Review list" };
const state = { words: [], known: new Set(), query: "", section: "all", grade: "all", status: "all", sort: "video" };
const el = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function loadKnown() {
  try { state.known = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]")); }
  catch { state.known = new Set(); }
}

function saveKnown() { localStorage.setItem(storageKey, JSON.stringify([...state.known])); }

function visibleWords() {
  const query = state.query.trim().toLowerCase();
  return state.words.filter((item) => {
    if (state.section !== "all" && item.section !== state.section) return false;
    if (state.grade !== "all" && item.grade !== Number(state.grade)) return false;
    if (state.status === "known" && !state.known.has(item.id)) return false;
    if (state.status === "learn" && state.known.has(item.id)) return false;
    return !query || item.word.toLowerCase().includes(query) || item.meaning.toLowerCase().includes(query) || item.example.toLowerCase().includes(query);
  }).sort((a, b) => state.sort === "az" ? a.word.localeCompare(b.word) : state.sort === "grade" ? a.grade - b.grade || a.id - b.id : a.id - b.id);
}

function updateProgress() {
  const known = state.known.size;
  const learn = state.words.length - known;
  const percent = state.words.length ? Math.round(known / state.words.length * 100) : 0;
  el("known-count").textContent = known;
  el("learn-count").textContent = learn;
  el("known-tab").textContent = known;
  el("learn-tab").textContent = learn;
  el("percent").textContent = `${percent}% complete`;
  el("progress-bar").style.width = `${percent}%`;
}

function render() {
  const visible = visibleWords();
  el("shown-count").textContent = visible.length;
  el("empty").hidden = visible.length !== 0;
  el("rows").innerHTML = visible.map((item) => {
    const checked = state.known.has(item.id);
    return `<tr class="${checked ? "known-row" : ""}">
      <td class="check-column" data-label="Known"><label class="checkbox"><input type="checkbox" data-id="${item.id}" ${checked ? "checked" : ""} aria-label="Mark ${escapeHtml(item.word)} as known"><span aria-hidden="true">✓</span></label></td>
      <td class="number-column" data-label="#">${item.id}</td>
      <td class="word-cell" data-label="Word"><strong>${escapeHtml(item.word)}</strong></td>
      <td class="meaning-cell" data-label="Short meaning">${escapeHtml(item.meaning)}</td>
      <td class="example-cell" data-label="Simple example">${escapeHtml(item.example)}</td>
      <td class="list-column" data-label="List"><span class="pill section-${item.section}">${labels[item.section]}</span></td>
      <td class="grade-column" data-label="Grade level"><span class="pill grade-${item.grade}">Grade ${item.grade}</span></td>
    </tr>`;
  }).join("");
  updateProgress();
}

function exportText() {
  const remaining = state.words.filter((item) => !state.known.has(item.id));
  return [`Complete Video Vocabulary — Words to Learn (${remaining.length})`, "Short English meanings, simple examples, and estimated grade levels", "", ...remaining.map((item, i) => `${i + 1}. ${item.word} — ${item.meaning} — ${item.example} — Grade ${item.grade}`)].join("\n");
}

function notice(message) { el("notice").textContent = message; el("notice").hidden = false; }

el("search").addEventListener("input", (event) => { state.query = event.target.value; render(); });
el("section").addEventListener("change", (event) => { state.section = event.target.value; render(); });
el("grade").addEventListener("change", (event) => { state.grade = event.target.value; render(); });
el("sort").addEventListener("change", (event) => { state.sort = event.target.value; render(); });
document.querySelector(".filter-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-status]"); if (!button) return;
  state.status = button.dataset.status;
  document.querySelectorAll(".filter-tabs button").forEach((item) => item.classList.toggle("active", item === button));
  render();
});
el("rows").addEventListener("change", (event) => {
  const input = event.target.closest("input[data-id]"); if (!input) return;
  const id = Number(input.dataset.id); input.checked ? state.known.add(id) : state.known.delete(id); saveKnown(); render();
});
el("show-learn").addEventListener("click", () => {
  state.status = "learn"; state.query = ""; state.section = "all"; state.grade = "all";
  el("search").value = ""; el("section").value = "all"; el("grade").value = "all";
  document.querySelectorAll(".filter-tabs button").forEach((item) => item.classList.toggle("active", item.dataset.status === "learn"));
  render(); el("word-list").scrollIntoView({ behavior: "smooth" });
});
el("copy").addEventListener("click", async () => { try { await navigator.clipboard.writeText(exportText()); notice("Words to learn copied."); } catch { notice("Copy was blocked. Use Download instead."); } });
el("download").addEventListener("click", () => { const url = URL.createObjectURL(new Blob([exportText()], { type: "text/plain;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "video-vocabulary-words-to-learn.txt"; a.click(); URL.revokeObjectURL(url); notice("Words to learn saved."); });
el("print").addEventListener("click", () => window.print());
el("reset").addEventListener("click", () => { if (!confirm("Clear every checkmark and start again?")) return; state.known.clear(); state.status = "all"; saveKnown(); document.querySelectorAll(".filter-tabs button").forEach((item) => item.classList.toggle("active", item.dataset.status === "all")); render(); notice("All checkmarks were cleared."); });

fetch("./words.json").then((response) => { if (!response.ok) throw new Error("Could not load words"); return response.json(); }).then((words) => { state.words = words; loadKnown(); state.known = new Set([...state.known].filter((id) => words.some((word) => word.id === id))); render(); }).catch(() => { el("rows").innerHTML = '<tr><td colspan="7" class="loading">The word list could not be loaded. Please refresh.</td></tr>'; });
