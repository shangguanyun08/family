"use client";

import { useEffect, useMemo, useState } from "react";
import rows from "./data/words.json";
import styles from "./video.module.css";

type Section = "S" | "T" | "U" | "Review";
type WordRow = {
  id: number;
  word: string;
  meaning: string;
  example: string;
  section: Section;
  grade: number;
  time: number;
};
type Status = "all" | "learn" | "known";
type SortMode = "video" | "az" | "grade";

const words = rows as WordRow[];
const storageKey = "video-vocabulary-known-v1";
const sectionOrder: Section[] = ["S", "T", "U", "Review"];
const sectionLabels: Record<Section, string> = {
  S: "S list",
  T: "T list",
  U: "U list",
  Review: "Review list",
};

function exportText(known: Set<number>) {
  const remaining = words.filter((item) => !known.has(item.id));
  return [
    `Complete Video Vocabulary — Words to Learn (${remaining.length})`,
    "Short English meanings, simple examples, and estimated grade levels",
    "",
    ...remaining.map(
      (item, index) => `${index + 1}. ${item.word} — ${item.meaning} — ${item.example} — Grade ${item.grade}`,
    ),
  ].join("\n");
}

export default function VideoWordLibrary() {
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<"all" | Section>("all");
  const [grade, setGrade] = useState<number | "all">("all");
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<SortMode>("video");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as number[];
      setKnown(new Set(saved.filter((id) => words.some((word) => word.id === id))));
    } catch {
      setKnown(new Set());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify([...known]));
  }, [hydrated, known]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("en-US");
    return words
      .filter((item) => {
        if (section !== "all" && item.section !== section) return false;
        if (grade !== "all" && item.grade !== grade) return false;
        if (status === "known" && !known.has(item.id)) return false;
        if (status === "learn" && known.has(item.id)) return false;
        return (
          !needle ||
          item.word.includes(needle) ||
          item.meaning.toLocaleLowerCase("en-US").includes(needle) ||
          item.example.toLocaleLowerCase("en-US").includes(needle)
        );
      })
      .sort((a, b) => {
        if (sort === "az") return a.word.localeCompare(b.word);
        if (sort === "grade") return a.grade - b.grade || a.id - b.id;
        return a.id - b.id;
      });
  }, [grade, known, query, section, sort, status]);

  const knownCount = known.size;
  const toLearnCount = words.length - knownCount;
  const percent = Math.round((knownCount / words.length) * 100);

  function toggleKnown(id: number) {
    setKnown((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setNotice("");
  }

  function showToLearn() {
    setStatus("learn");
    setSection("all");
    setGrade("all");
    setQuery("");
    requestAnimationFrame(() => document.getElementById("video-word-list")?.scrollIntoView({ behavior: "smooth" }));
  }

  async function copyToLearn() {
    try {
      await navigator.clipboard.writeText(exportText(known));
      setNotice(`${toLearnCount} words to learn copied.`);
    } catch {
      setNotice("Copy was blocked. Use Download instead.");
    }
  }

  function downloadToLearn() {
    const blob = new Blob([exportText(known)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "video-vocabulary-words-to-learn.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${toLearnCount} words saved.`);
  }

  function resetChecks() {
    if (!window.confirm("Clear every checkmark and start again?")) return;
    setKnown(new Set());
    setStatus("all");
    setNotice("All checkmarks were cleared.");
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}><span aria-hidden="true">✦</span> Frame-by-frame vocabulary library</p>
          <h1>Every visible word.<br /><em>One clear list.</em></h1>
          <p className={styles.intro}>
            545 distinct words captured from the S, T, U, and review screens—each with a short English meaning,
            a simple sentence, and one estimated grade level.
          </p>
          <div className={styles.heroStats} aria-label="List totals">
            <div><strong>545</strong><span>distinct words</span></div>
            <div><strong>4</strong><span>video lists</span></div>
            <div><strong>4–6</strong><span>grade span</span></div>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.progressCard} aria-label="Overall progress">
          <div className={styles.progressCopy}><span>Overall check</span><strong>{percent}% complete</strong></div>
          <div className={styles.progressTrack} aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
          <div className={styles.progressNumbers}><b>{knownCount}</b> known · <b>{toLearnCount}</b> to learn</div>
          <button className={styles.primaryButton} onClick={showToLearn}>Show words to learn</button>
        </section>

        <section className={styles.listIntro} id="video-word-list">
          <div>
            <p className={styles.kicker}>THE COMPLETE EXTRACTION</p>
            <h2>545 distinct visible words</h2>
          </div>
          <p>Check a word when it is known. Checkmarks save automatically on this device.</p>
        </section>

        {notice && <div className={styles.notice} role="status">{notice}</div>}

        <section className={styles.libraryCard}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search word, meaning, or example"
                aria-label="Search vocabulary"
              />
            </label>
            <label className={styles.selectBox}>
              <span>List</span>
              <select value={section} onChange={(event) => setSection(event.target.value as "all" | Section)}>
                <option value="all">All lists</option>
                {sectionOrder.map((item) => <option value={item} key={item}>{sectionLabels[item]}</option>)}
              </select>
            </label>
            <label className={styles.selectBox}>
              <span>Grade</span>
              <select value={grade} onChange={(event) => setGrade(event.target.value === "all" ? "all" : Number(event.target.value))}>
                <option value="all">All grades</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
                <option value="6">Grade 6</option>
              </select>
            </label>
            <label className={styles.selectBox}>
              <span>Sort</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                <option value="video">Video order</option>
                <option value="az">A → Z</option>
                <option value="grade">Grade level</option>
              </select>
            </label>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterTabs} aria-label="Knowledge filter">
              <button className={status === "all" ? styles.active : ""} onClick={() => setStatus("all")}>All <b>{words.length}</b></button>
              <button className={status === "learn" ? styles.active : ""} onClick={() => setStatus("learn")}>To learn <b>{toLearnCount}</b></button>
              <button className={status === "known" ? styles.active : ""} onClick={() => setStatus("known")}>Known <b>{knownCount}</b></button>
            </div>
            <span><strong>{visible.length}</strong> shown</span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkColumn}>Known</th>
                  <th className={styles.numberColumn}>#</th>
                  <th>Word</th>
                  <th>Short meaning</th>
                  <th>Simple example</th>
                  <th className={styles.listColumn}>List</th>
                  <th className={styles.gradeColumn}>Grade level</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const checked = known.has(item.id);
                  return (
                    <tr className={checked ? styles.knownRow : ""} key={item.id}>
                      <td className={styles.checkColumn} data-label="Known">
                        <label className={styles.checkBox}>
                          <input type="checkbox" checked={checked} onChange={() => toggleKnown(item.id)} aria-label={`Mark ${item.word} as known`} />
                          <span aria-hidden="true">✓</span>
                        </label>
                      </td>
                      <td className={styles.numberColumn} data-label="#">{item.id}</td>
                      <td className={styles.wordCell} data-label="Word"><strong>{item.word}</strong></td>
                      <td className={styles.meaningCell}>{item.meaning}</td>
                      <td className={styles.exampleCell}>{item.example}</td>
                      <td className={styles.listColumn} data-label="List"><span className={`${styles.sectionPill} ${styles[`section${item.section}`]}`}>{sectionLabels[item.section]}</span></td>
                      <td className={styles.gradeColumn} data-label="Grade level"><span className={`${styles.gradePill} ${styles[`grade${item.grade}`]}`}>Grade {item.grade}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visible.length === 0 && <div className={styles.emptyState}><strong>No matching words</strong><span>Try a different search or filter.</span></div>}
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerActions}>
              <button onClick={copyToLearn}>Copy words to learn</button>
              <button onClick={downloadToLearn}>Download .txt</button>
              <button onClick={() => window.print()}>Print</button>
            </div>
            <button className={styles.resetButton} onClick={resetChecks}>Reset all checks</button>
          </footer>
        </section>
      </div>
    </main>
  );
}
