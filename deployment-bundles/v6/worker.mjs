// lib/upstream/activity-contract.mjs
var TYPES = Object.freeze(["Quiz", "Live Poll", "Order It", "Match It", "Categorize", "Spin Wheel", "Open the Box", "Flashcards", "Ultimate Game Show", "Scenario Challenge", "Dropdown"]);
var object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
function check(condition, message) {
  if (!condition) throw new Error(message);
}
function str(value, max = 1e3) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
function strings(list2, min = 2, max = 12) {
  return Array.isArray(list2) && list2.length >= min && list2.length <= max && list2.every((v) => str(v, 160));
}
var distinct = (list2) => new Set(list2).size === list2.length;
function validateActivity(a) {
  check(object(a), "Activity must be an object");
  check(TYPES.includes(a.type), "Unsupported activity type");
  check(str(a.prompt || a.question), "Question or instruction is required");
  check(Number.isInteger(a.timer) && a.timer >= 5 && a.timer <= 300, "Timer must be 5\u2013300 seconds");
  switch (a.type) {
    case "Quiz":
    case "Dropdown":
    case "Ultimate Game Show":
    case "Scenario Challenge":
      check(strings(a.options, 2, 8), "Activity requires 2\u20138 options");
      check(Number.isInteger(a.correct) && a.correct >= 0 && a.correct < a.options.length, "Invalid correct option");
      break;
    case "Live Poll":
      check(strings(a.options, 2, 8), "Poll requires 2\u20138 options");
      check(a.correct == null, "Poll must not expose an answer key");
      break;
    case "Order It":
      check(strings(a.items, 2, 10) && distinct(a.items), "Ordering items must be unique");
      check(Array.isArray(a.order) && a.order.length === a.items.length && distinct(a.order) && a.order.every((i) => Number.isInteger(i) && i >= 0 && i < a.items.length), "Invalid ordering key");
      break;
    case "Match It":
      check(strings(a.left, 2, 8) && strings(a.right, 2, 8) && a.left.length === a.right.length, "Match needs equal left/right choices");
      check(Array.isArray(a.pairs) && a.pairs.length === a.left.length && distinct(a.pairs) && a.pairs.every((i) => Number.isInteger(i) && i >= 0 && i < a.right.length), "Invalid matching pairs");
      break;
    case "Categorize":
      check(strings(a.categories, 2, 8) && strings(a.items, 2, 12), "Categories and items required");
      check(Array.isArray(a.assignments) && a.assignments.length === a.items.length && a.assignments.every((i) => Number.isInteger(i) && i >= 0 && i < a.categories.length), "Invalid category assignments");
      break;
    case "Flashcards":
      check(strings(a.fronts, 1, 15) && Array.isArray(a.backs) && a.backs.length === a.fronts.length && a.backs.every((x) => str(x, 1e3)), "Flashcard fronts/backs required");
      break;
    case "Spin Wheel":
    case "Open the Box":
      check(strings(a.items, 2, 20), "Wheel/box needs 2\u201320 outcomes");
      break;
  }
  return true;
}
function isPermutation(answer, n) {
  return Array.isArray(answer) && answer.length === n && distinct(answer) && answer.every((i) => Number.isInteger(i) && i >= 0 && i < n);
}
function evaluateActivity(a, answer) {
  validateActivity(a);
  if (a.type === "Live Poll") {
    check(Number.isInteger(answer) && answer >= 0 && answer < a.options.length, "Invalid poll choice");
    return { graded: false, correct: null, points: 0 };
  }
  if (["Spin Wheel", "Open the Box", "Flashcards"].includes(a.type)) {
    check(answer === null, "Presentation activities are not graded");
    return { graded: false, correct: null, points: 0 };
  }
  let correct = false;
  if (["Quiz", "Dropdown", "Ultimate Game Show", "Scenario Challenge"].includes(a.type)) {
    check(Number.isInteger(answer) && answer >= 0 && answer < a.options.length, "Invalid choice");
    correct = answer === a.correct;
  } else if (a.type === "Order It") {
    check(isPermutation(answer, a.items.length), "Invalid item ordering");
    correct = answer.every((x, i) => x === a.order[i]);
  } else if (a.type === "Match It") {
    check(isPermutation(answer, a.left.length), "Invalid matching response");
    correct = answer.every((x, i) => x === a.pairs[i]);
  } else if (a.type === "Categorize") {
    check(Array.isArray(answer) && answer.length === a.items.length && answer.every((x) => Number.isInteger(x) && x >= 0 && x < a.categories.length), "Invalid categorization");
    correct = answer.every((x, i) => x === a.assignments[i]);
  }
  return { graded: true, correct, points: correct ? 100 : 0 };
}

// lib/domain.mjs
var ok = (v) => {
  if (!v) throw Error("DECK");
};
var str2 = (v, max = 2e3) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
var list = (v, min = 1, max = 100) => Array.isArray(v) && v.length >= min && v.length <= max && v.every((x) => str2(x));
var idx = (v, n) => Number.isInteger(v) && v >= 0 && v < n;
var permutation = (v, n) => Array.isArray(v) && v.length === n && new Set(v).size === n && v.every((x) => idx(x, n));
var presentation = (type) => ["Spin Wheel", "Wheel of Fortune", "Open the Box", "Flashcards"].includes(type);
var unscored = (a) => ["Meta Plan", "Categorize", "Live Poll", "Flashcards"].includes(a.type) || a.scored === false;
function validateActivity2(a, depth = 0) {
  ok(a && typeof a === "object" && !Array.isArray(a) && depth <= 3 && str2(a.prompt) && Number.isInteger(a.timer) && a.timer >= 0 && a.timer <= 3600);
  if (a.media != null) {
    ok(a.media && typeof a.media === "object" && ["image", "video"].includes(a.media.type) && str2(a.media.url, 2048) && /^https:\/\/[^\s]+$/i.test(a.media.url) && (!a.media.alt || typeof a.media.alt === "string" && a.media.alt.length <= 200));
  }
  const type = a.type;
  if (["Quiz", "Ultimate Game Show"].includes(type) && a.questions) {
    ok(Array.isArray(a.questions) && a.questions.length && a.questions.length <= 500);
    a.questions.forEach((q) => validateActivity2({ ...q, timer: q.timer ?? a.timer }, depth + 1));
    return a;
  }
  if (["Quiz", "Dropdown", "True/False", "Ultimate Game Show"].includes(type)) {
    ok(list(a.options, 2, 4) && idx(a.correct, a.options.length));
    if (type === "True/False") ok(a.options.length === 2);
  } else if (type === "Fill Blank") ok(list(a.accepted, 1, 20));
  else if (type === "Image Hotspot") {
    ok(str2(a.image, 2048) && /^https:\/\/|^\/[^/]/.test(a.image) && Array.isArray(a.regions) && a.regions.length > 0 && a.regions.length <= 10 && a.regions.every((r) => ["x", "y", "r"].every((k) => typeof r[k] === "number" && r[k] >= 0 && r[k] <= 1)));
  } else if (type === "Order It") ok(list(a.items, 2, 30) && permutation(a.order, a.items.length));
  else if (type === "Match It") ok(list(a.left, 2, 20) && list(a.right, 2, 20) && a.left.length === a.right.length && permutation(a.pairs, a.left.length));
  else if (["Meta Plan", "Categorize"].includes(type)) {
    ok(list(a.items, 1, 100) && list(a.categories, 2, 20) && Array.isArray(a.assignments) && a.assignments.length === a.items.length && a.assignments.every((x) => idx(x, a.categories.length)));
    a.timer = 0;
    a.scored = false;
  } else if (type === "Live Poll") {
    ok(["choice", "rating", "word", "priority", void 0].includes(a.pollKind));
    if (!["word", "rating"].includes(a.pollKind)) ok(list(a.options, 2, 20));
    ok(a.correct == null);
    a.scored = false;
  } else if (type === "Flashcards") {
    ok(list(a.fronts, 1, 500) && list(a.backs, 1, 500) && a.fronts.length === a.backs.length);
    a.timer = 0;
    a.scored = false;
  } else if (["Wheel of Fortune", "Spin Wheel"].includes(type)) {
    if (a.sectors) {
      ok(Array.isArray(a.sectors) && a.sectors.length >= 2 && a.sectors.length <= 20);
      for (const s of a.sectors) {
        ok(str2(s.label, 100) && ["question", "prize", "penalty", "mystery"].includes(s.kind) && Number.isInteger(s.points ?? 0) && Math.abs(s.points ?? 0) <= 1e4);
        if (s.kind === "question") {
          ok(Array.isArray(s.questions) && s.questions.length > 0 && s.questions.length <= 30);
          s.questions.forEach((q) => validateActivity2(q, depth + 1));
        }
      }
    } else ok(list(a.items, 2, 20));
    a.timer = 0;
    ok(Number.isInteger(a.rounds ?? 1) && (a.rounds ?? 1) >= 1 && (a.rounds ?? 1) <= 50);
    ok((a.spinDuration ?? 6) >= 4 && (a.spinDuration ?? 6) <= 12);
  } else if (type === "Open the Box") {
    ok(list(a.items, 2, 30));
    if (a.boxes) {
      ok(a.boxes.length === a.items.length);
      for (const b of a.boxes) {
        ok(["question", "challenge", "surprise"].includes(b.kind));
        if (b.question) validateActivity2(b.question, depth + 1);
        ok(Number.isInteger(b.points ?? 0) && Math.abs(b.points ?? 0) <= 1e4);
      }
    }
    a.timer = 0;
  } else if (type === "Escape Room") {
    ok(Array.isArray(a.rooms) && a.rooms.length >= 1 && a.rooms.length <= 5);
    for (const r of a.rooms) {
      ok(str2(r.title, 100) && Array.isArray(r.puzzles) && r.puzzles.length > 0 && r.puzzles.length <= 30);
      r.puzzles.forEach((q) => validateActivity2(q, depth + 1));
    }
    ok(["individual", "team", "collaborative", void 0].includes(a.mode));
    a.timer = 0;
  } else if (type === "Scenario Challenge") {
    if (!a.nodes) {
      ok(list(a.options, 2, 4) && idx(a.correct, a.options.length));
    } else {
      ok(Array.isArray(a.nodes) && a.nodes.length > 1 && a.nodes.length <= 100 && new Set(a.nodes.map((n) => n.id)).size === a.nodes.length);
      const ids = new Set(a.nodes.map((n) => n.id));
      ok(ids.has(a.start));
      for (const n of a.nodes) {
        ok(str2(n.id, 100) && str2(n.text));
        if (!n.ending) {
          ok(Array.isArray(n.choices) && n.choices.length > 0 && n.choices.length <= 6);
          n.choices.forEach((c) => ok(str2(c.label, 160) && ids.has(c.next) && Number.isInteger(c.points ?? 0) && Math.abs(c.points ?? 0) <= 1e4));
        }
      }
      const visit = (id, path) => {
        ok(!path.has(id));
        const n = a.nodes.find((n2) => n2.id === id);
        if (!n.ending) for (const c of n.choices) visit(c.next, /* @__PURE__ */ new Set([...path, id]));
      };
      visit(a.start, /* @__PURE__ */ new Set());
      a.timer = 0;
    }
  } else throw Error("DECK");
  if (a.weight != null) ok(typeof a.weight === "number" && a.weight >= 0 && a.weight <= 10);
  if (a.wrongPenalty != null) ok(Number.isInteger(a.wrongPenalty) && a.wrongPenalty >= 0 && a.wrongPenalty <= 1e4);
  if (a.points != null) ok(Number.isInteger(a.points) && a.points >= 0 && a.points <= 1e4);
  return a;
}
function validateDeck(activities) {
  ok(Array.isArray(activities) && activities.length > 0 && activities.length <= 500);
  const copy = JSON.parse(JSON.stringify(activities));
  copy.forEach((a) => validateActivity2(a));
  ok(JSON.stringify(copy).length < 5e5);
  return copy;
}
function flattenDeck(activities) {
  const flat = [];
  activities.forEach((root, group) => {
    let step = 0;
    function visit(a, parent = null) {
      const merged = parent ? { ...a, timer: a.timer ?? parent.timer, weight: a.weight ?? parent.weight ?? 1, points: a.points ?? parent.points ?? 1e3, wrongPenalty: a.wrongPenalty ?? parent.wrongPenalty ?? 0, speed: a.speed ?? parent.speed ?? true, section: a.section || parent.section || parent.prompt, betEnabled: a.betEnabled ?? parent.betEnabled ?? false, participation: a.participation ?? parent.participation ?? "all", stageTheme: a.stageTheme ?? parent.stageTheme ?? "orbital", progression: a.progression || parent.progression || "manual" } : { ...a };
      if (a.questions) {
        for (const q of a.questions) visit(q, merged);
      } else flat.push({ ...merged, mainType: root.type, group, step: step++, revealDelay: root.type === "Ultimate Game Show" ? 2e3 : 0 });
    }
    visit(root);
  });
  return flat;
}
function publicActivity(a, { closed = false, reveal = null, host = false } = {}) {
  if (!a) return null;
  const r = JSON.parse(JSON.stringify(a));
  for (const k of ["correct", "order", "pairs", "assignments", "backs", "accepted", "regions", "nodes", "rooms", "sectors", "boxes", "questions", "explanation"]) delete r[k];
  if (a.sectors) r.sectors = a.sectors.map((s) => ({ label: s.label, kind: s.kind, repeatable: !!s.repeatable }));
  if (a.rooms) r.rooms = a.rooms.map((x) => ({ title: x.title, narrative: x.narrative, puzzles: x.puzzles.length }));
  if (closed) {
    for (const k of ["correct", "order", "pairs", "assignments", "accepted", "regions", "explanation"]) if (a[k] !== void 0) r[k] = a[k];
  }
  if (a.type === "Flashcards" && reveal !== null) r.revealed = { front: a.fronts[reveal], back: a.backs[reveal] };
  if (["Spin Wheel", "Open the Box"].includes(a.type) && !a.sectors && !a.boxes && reveal !== null) r.revealed = a.items[reveal];
  return r;
}
var norm = (s) => String(s).normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
function evaluate(a, answer) {
  let correct = null;
  if (a.type === "Live Poll") {
    if (a.pollKind === "word") {
      if (!str2(answer, 80)) throw Error("ANSWER");
    } else if (a.pollKind === "rating") {
      if (!Number.isInteger(answer) || answer < 1 || answer > (a.scale ?? 5)) throw Error("ANSWER");
    } else if (a.pollKind === "priority") {
      if (!permutation(answer, a.options.length)) throw Error("ANSWER");
    } else if (!idx(answer, a.options.length)) throw Error("ANSWER");
    return { correct: null, points: 0 };
  }
  if (a.options) {
    if (!idx(answer, a.options.length)) throw Error("ANSWER");
    correct = answer === a.correct;
  } else if (a.type === "Fill Blank") {
    if (!str2(answer, 200)) throw Error("ANSWER");
    correct = a.accepted.some((x) => norm(x) === norm(answer));
  } else if (a.type === "Image Hotspot") {
    if (!answer || !["x", "y"].every((k) => typeof answer[k] === "number" && answer[k] >= 0 && answer[k] <= 1)) throw Error("ANSWER");
    correct = a.regions.some((r) => (r.x - answer.x) ** 2 + (r.y - answer.y) ** 2 <= r.r ** 2);
  } else if (a.order) {
    if (!permutation(answer, a.items.length)) throw Error("ANSWER");
    correct = answer.every((x, i) => x === a.order[i]);
  } else if (a.pairs) {
    if (!permutation(answer, a.left.length)) throw Error("ANSWER");
    correct = answer.every((x, i) => x === a.pairs[i]);
  } else if (a.assignments) {
    if (!Array.isArray(answer) || answer.length !== a.items.length || !answer.every((x) => idx(x, a.categories.length))) throw Error("ANSWER");
    correct = answer.every((x, i) => x === a.assignments[i]);
  } else throw Error("ANSWER");
  return { correct: unscored(a) ? null : Number(correct), evaluation: Number(correct), points: correct && !unscored(a) ? a.points ?? 1e3 : !correct && !unscored(a) ? -(a.wrongPenalty || 0) : 0 };
}
function grade(a, answer, { remaining = 1, duration = 1 } = {}) {
  const g = evaluate(a, answer);
  return { ...g, points: Math.round(g.points * (a.weight ?? 1) * (a.speed && g.points > 0 ? 0.5 + 0.5 * Math.max(0, Math.min(1, remaining / duration)) : 1)) };
}
function scoreboards(players, totals, rule = "shared", metrics = {}, teamScoring = "sum") {
  function rank(rows) {
    const sorted = rows.sort((a, b) => b.score - a.score || (rule === "correct" ? (b.correct || 0) - (a.correct || 0) : rule === "speed" ? (a.elapsed || 0) - (b.elapsed || 0) : 0) || String(a.uid || a.team).localeCompare(String(b.uid || b.team)));
    return sorted.map((x, i) => ({ ...x, rank: rule === "shared" ? sorted.findIndex((p) => p.score === x.score) + 1 : i + 1 }));
  }
  const individual = rank(players.filter((p) => p.approval !== "pending" && p.approval !== "rejected").map((p) => ({ uid: p.uid, name: p.name, score: totals[p.uid] || 0, ...metrics[p.uid] }))), groups = /* @__PURE__ */ new Map();
  for (const p of players) {
    if (!p.team || p.approval === "pending" || p.approval === "rejected") continue;
    const g = groups.get(p.team) || { team: p.team, score: 0, members: 0, correct: 0, elapsed: 0 };
    g.score += totals[p.uid] || 0;
    g.members++;
    g.correct += metrics[p.uid]?.correct || 0;
    g.elapsed += metrics[p.uid]?.elapsed || 0;
    groups.set(p.team, g);
  }
  const teamRows = [...groups.values()].map((x) => ({ ...x, score: teamScoring === "average" ? Math.round(x.score / x.members) : x.score }));
  return { individual, teams: rank(teamRows) };
}
function nextState(s, action, now, index) {
  const n = { ...s, revision: s.revision + 1 }, deck = JSON.parse(s.activities);
  if (action === "start" || action === "next") {
    if (action === "start" ? !["lobby", "ready"].includes(s.status) : s.status !== "results") throw Error("STATE");
    const current = s.current + 1;
    if (current >= deck.length) throw Error("STATE");
    const a = deck[current];
    return { ...n, current, status: "question", started_at: now, deadline: a.participation && a.participation !== "all" || a.betEnabled ? null : a.timer ? now + a.timer * 1e3 : null, paused: 0, remaining: 0, reveal: null, runtime: JSON.stringify({ ...JSON.parse(s.runtime || "{}"), spin: void 0, box: void 0, metaCount: void 0, addedTime: 0, keyRevealed: false, targets: [], phase: a.participation && a.participation !== "all" ? "casting" : a.betEnabled ? "betting" : "answering", used: [], turn: 0, target: null }) };
  }
  if (action === "close") {
    if (s.status !== "question") throw Error("STATE");
    return { ...n, status: "results", paused: 0 };
  }
  if (action === "pause") {
    if (s.status !== "question" || s.paused || s.deadline && s.deadline <= now) throw Error("STATE");
    return { ...n, runtime: JSON.stringify({ ...JSON.parse(s.runtime || "{}"), pausedAt: now }), paused: 1, remaining: s.deadline ? Math.max(0, s.deadline - now) : 0 };
  }
  if (action === "resume") {
    if (s.status !== "question" || !s.paused) throw Error("STATE");
    const rt = JSON.parse(s.runtime || "{}"), delta = now - (rt.pausedAt || now);
    if (rt.spin) for (const k of ["startsAt", "stopsAt", "revealAt"]) rt.spin[k] += delta;
    rt.pausedTotal = (rt.pausedTotal || 0) + delta;
    delete rt.pausedAt;
    return { ...n, runtime: JSON.stringify(rt), paused: 0, deadline: s.deadline ? now + s.remaining : null };
  }
  if (action === "addtime") {
    if (s.status !== "question" || s.paused || !s.deadline || s.deadline <= now) throw Error("STATE");
    const rt = JSON.parse(s.runtime || "{}");
    return { ...n, runtime: JSON.stringify({ ...rt, addedTime: (rt.addedTime || 0) + 1e4 }), deadline: s.deadline + 1e4 };
  }
  if (action === "finish") {
    if (!["lobby", "results"].includes(s.status)) throw Error("STATE");
    return { ...n, status: "completed", paused: 0 };
  }
  if (action === "reveal") {
    if (!["question", "results"].includes(s.status)) throw Error("STATE");
    const a = deck[s.current], length = a.type === "Flashcards" ? a.fronts.length : a.items?.length ?? 0;
    if (!Number.isInteger(index) || index < 0 || index >= length) throw Error("INDEX");
    return { ...n, reveal: index };
  }
  throw Error("ACTION");
}
function fairIndex(n) {
  if (!Number.isInteger(n) || n < 1) throw Error("STATE");
  const max = Math.floor(4294967296 / n) * n;
  let x;
  do {
    x = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (x >= max);
  return x % n;
}

// lib/identity.mjs
function normalizeEmployeeId(value) {
  if (typeof value !== "string") throw Error("EMPLOYEE_ID");
  const normalized = value.trim().replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776)).toUpperCase();
  if (!/^[A-Z0-9-]{3,30}$/.test(normalized)) throw Error("EMPLOYEE_ID");
  return normalized;
}
function normalizeRecoveryCode(value) {
  return typeof value === "string" ? value.replace(/[\s-]/g, "").toUpperCase() : "";
}

// lib/workspace.ts
var fail = (c, status = 400) => {
  throw new ApiError(c, status);
};
async function audit(db, owner, session, action, detail = {}) {
  await db.prepare("INSERT INTO audits(id,session,owner,action,detail,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(), session, owner, action, JSON.stringify(detail), Date.now()).run();
}
function validateSurvey(s) {
  if (!s || typeof s.title !== "string" || !s.title.trim() || !Array.isArray(s.questions) || !s.questions.length || s.questions.length > 100) fail("SURVEY");
  for (const q of s.questions) {
    if (typeof q.prompt !== "string" || !q.prompt.trim() || !["rating", "choice", "text"].includes(q.kind)) fail("SURVEY");
    if (q.kind === "choice" && (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 20 || q.options.some((x) => typeof x !== "string" || !x.trim()))) fail("SURVEY");
  }
  return { ...s, anonymous: s.anonymous !== false, stage: s.stage === "before-ceremony" ? "before-ceremony" : "after-ceremony" };
}
async function workspace(db, url, method, b, owner, ctx) {
  const path = url.pathname, now = Date.now(), admin = ctx.role === "admin";
  if (path === "/api/drafts") {
    if (method === "GET") {
      const kind2 = url.searchParams.get("kind");
      return { items: (await db.prepare("SELECT id,owner,title,payload,kind,visibility,version,updated_at FROM drafts WHERE (owner=? OR visibility='shared') AND visibility!='deleted'" + (kind2 ? " AND kind=?" : "") + " ORDER BY updated_at DESC LIMIT 500").bind(...kind2 ? [owner, kind2] : [owner]).all()).results.map((x) => ({ ...x, payload: JSON.parse(x.payload), editable: x.owner === owner || admin })) };
    }
    const kind = b.kind || "session";
    if (!["session", "template", "question", "media", "survey", "team"].includes(kind)) fail("INVALID");
    if (typeof b.title !== "string" || !b.title.trim() || b.title.length > 100) fail("TITLE");
    const old = b.id ? await db.prepare("SELECT * FROM drafts WHERE id=?").bind(b.id).first() : null;
    if (old && old.owner !== owner && !admin) fail("FORBIDDEN", 403);
    if (old && b.version !== old.version) fail("STALE", 409);
    let payload = b.payload;
    try {
      if (["session", "template"].includes(kind)) {
        validateDeck(payload.activities);
        if (payload.survey) validateSurvey(payload.survey);
      }
      if (kind === "question") validateActivity2(payload);
      if (kind === "survey") payload = validateSurvey(payload);
      if (kind === "media" && (!/^https:\/\//.test(payload.url) || payload.url.length > 2048)) fail("MEDIA");
      if (kind === "team" && (!Array.isArray(payload.names) || payload.names.length < 2 || payload.names.length > 20 || payload.names.some((x) => typeof x !== "string" || !x.trim()))) fail("TEAM");
    } catch {
      fail("DECK");
    }
    const id = old?.id || crypto.randomUUID(), visibility = b.visibility === "shared" ? "shared" : b.visibility === "deleted" ? "deleted" : "personal";
    if (old) {
      const r = await db.prepare("UPDATE drafts SET title=?,payload=?,kind=?,visibility=?,version=version+1,updated_at=? WHERE id=? AND version=?").bind(b.title, JSON.stringify(payload), kind, visibility, now, id, old.version).run();
      if (!r.meta.changes) fail("STALE", 409);
    } else await db.prepare("INSERT INTO drafts(id,owner,title,payload,kind,visibility,version,updated_at) VALUES(?,?,?,?,?,?,1,?)").bind(id, owner, b.title, JSON.stringify(payload), kind, visibility, now).run();
    return { id, version: (old?.version || 0) + 1, savedAt: now };
  }
  if (path === "/api/catalog") {
    return { sessions: (await db.prepare("SELECT code,title,owner,status,language,teams,created_at FROM sessions WHERE status!='draft' ORDER BY created_at DESC LIMIT 500").all()).results.map((x) => ({ ...x, editable: x.owner === owner || admin })) };
  }
  if (path === "/api/branding") {
    if (method === "GET") {
      const row = await db.prepare("SELECT payload FROM settings WHERE id='branding'").first();
      return row ? JSON.parse(row.payload) : { mts: "/mts.png", training: "/training.png", primary: "#218e5b", blue: "#176aa4", navy: "#0c2545" };
    }
    if (!admin) fail("ADMIN_ONLY", 403);
    for (const key of ["mts", "training"]) if (typeof b[key] !== "string" || !/^https:\/\/|^\/[^/]/.test(b[key])) fail("MEDIA");
    for (const key of ["primary", "blue", "navy"]) if (!/^#[0-9a-f]{6}$/i.test(b[key])) fail("INVALID");
    const payload = Object.fromEntries(["mts", "training", "primary", "blue", "navy"].map((k) => [k, b[k]]));
    await db.prepare("INSERT INTO settings(id,payload,updated_at) VALUES('branding',?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at").bind(JSON.stringify(payload), now).run();
    await audit(db, owner, null, "branding-updated");
    return { ok: true };
  }
  if (path === "/api/admin") {
    if (!admin) fail("ADMIN_ONLY", 403);
    if (method === "GET") return { trainers: (await db.prepare("SELECT uid,email,name,role,enabled,report_owners FROM trainer_profiles ORDER BY name").all()).results, canProvision: !!ctx.provision };
    if (b.action === "create") {
      if (!ctx.provision) fail("ADMIN_SETUP", 503);
      if (!["trainer", "senior", "admin"].includes(b.role) || typeof b.email !== "string" || typeof b.name !== "string" || typeof b.password !== "string" || b.password.length < 10) fail("INVALID");
      const account = await ctx.provision(b);
      await db.prepare("INSERT INTO trainer_profiles(uid,email,name,role,enabled,report_owners,updated_at) VALUES(?,?,?,?,1,?,?)").bind(account.uid, b.email, b.name, b.role, JSON.stringify(b.reportOwners || []), now).run();
      await audit(db, owner, null, "trainer-created", { uid: account.uid, role: b.role });
      return { uid: account.uid };
    }
    if (b.uid === ctx.uid && (b.enabled === false || b.role !== "admin")) fail("SELF_ROLE");
    if (!["trainer", "senior", "admin"].includes(b.role)) fail("INVALID");
    const r = await db.prepare("UPDATE trainer_profiles SET role=?,enabled=?,report_owners=?,updated_at=? WHERE uid=?").bind(b.role, b.enabled === false ? 0 : 1, JSON.stringify(b.reportOwners || []), now, b.uid).run();
    if (!r.meta.changes) fail("NOT_FOUND", 404);
    await audit(db, owner, null, "trainer-role", { uid: b.uid, role: b.role, enabled: b.enabled !== false });
    return { ok: true };
  }
  return void 0;
}

// lib/request-security.ts
async function readJson(req) {
  const max = 1e6, reader = req.body?.getReader();
  if (!reader) throw new ApiError("INVALID");
  const decoder2 = new TextDecoder();
  let length = 0, text = "";
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > max) {
      await reader.cancel();
      throw new ApiError("TOO_LARGE", 413);
    }
    text += decoder2.decode(value, { stream: true });
  }
  text += decoder2.decode();
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("INVALID");
  }
}
async function checkRate(db, req) {
  if (req.method !== "POST") return;
  const path = new URL(req.url).pathname, token = req.headers.get("X-Player-Token") || req.headers.get("X-Firebase-Token") || "", bucket = Math.floor(Date.now() / 6e4), source = (req.headers.get("CF-Connecting-IP") || "gateway") + ":" + path + ":" + (["/api/recover", "/api/join"].includes(path) ? "" : token) + ":" + bucket;
  const bytes2 = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source))), key = Array.from(bytes2, (b) => b.toString(16).padStart(2, "0")).join("");
  const limit = path === "/api/media-upload" ? 10 : path === "/api/recover" ? 10 : path === "/api/join" ? 120 : 180;
  const r = await db.prepare("INSERT INTO rate_buckets(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").bind(key, Date.now() + 12e4).first();
  if (r.count > limit) throw new ApiError("RATE_LIMIT", 429);
  if (r.count === 1) await db.prepare("DELETE FROM rate_buckets WHERE key IN (SELECT key FROM rate_buckets WHERE expires<? LIMIT 50)").bind(Date.now()).run();
}

// lib/session-games.ts
var read = async (db, s, actor) => {
  const row = await db.prepare("SELECT data,version FROM progress WHERE session=? AND round=? AND actor=?").bind(s.code, s.current, actor).first();
  return { data: row ? JSON.parse(row.data) : {}, version: row?.version ?? 0 };
};
var groupActor = (a, p) => a.type === "Escape Room" && a.mode === "collaborative" ? "collaborative" : a.type === "Escape Room" && a.mode === "team" ? "team:" + p.team : p.id;
async function saveProgress(db, s, actor, old, data, events = [], now = Date.now(), after = []) {
  const guard = "EXISTS(SELECT 1 FROM sessions WHERE code=? AND current=? AND revision=? AND status='question' AND paused=0 AND (deadline IS NULL OR deadline>?))" + (old.version ? " AND EXISTS(SELECT 1 FROM progress WHERE session=? AND round=? AND actor=? AND version=?)" : "");
  const guardArgs = old.version ? [s.code, s.current, s.revision, now, s.code, s.current, actor, old.version] : [s.code, s.current, s.revision, now];
  const statements = events.map((e) => db.prepare("INSERT INTO events(session,id,player,round,kind,points,detail,created_at) SELECT ?,?,?,?,?,?,?,? WHERE " + guard).bind(s.code, e.id, e.player, s.current, e.kind, e.points, JSON.stringify(e.detail || {}), now, ...guardArgs));
  const statement = old.version ? db.prepare("UPDATE progress SET data=?,version=version+1 WHERE session=? AND round=? AND actor=? AND version=? AND " + guard).bind(JSON.stringify(data), s.code, s.current, actor, old.version, ...guardArgs) : db.prepare("INSERT INTO progress(session,round,actor,data,version) SELECT ?,?,?,?,1 WHERE " + guard).bind(s.code, s.current, actor, JSON.stringify(data), ...guardArgs);
  statements.push(statement, ...after);
  try {
    const results = await batch(db, statements);
    if (!results[events.length]?.meta.changes) fail2("STALE", 409);
  } catch (e) {
    if (e.code) throw e;
    fail2("STALE", 409);
  }
}
async function settleWheel(db, s, a, rt, now) {
  if (!rt.spin || rt.spin.revealed || rt.spin.revealAt > now) return;
  const spin = { ...rt.spin, revealed: true }, sector = a.sectors?.[spin.index], points = sector?.kind === "question" ? 0 : Math.round((sector?.points ?? 0) * (a.weight ?? 1));
  const next = { ...rt, spin, used: sector?.repeatable ? rt.used : [.../* @__PURE__ */ new Set([...rt.used || [], spin.index])], turn: (rt.turn || 0) + 1, target: null };
  const statements = [];
  if (spin.target) statements.push(db.prepare("INSERT INTO events(session,id,player,round,kind,points,detail,created_at) SELECT ?,?,?,?,?,?,?,? FROM sessions WHERE code=? AND revision=?").bind(s.code, `wheel:${s.current}:${spin.id}`, spin.target, s.current, "wheel", points, JSON.stringify({ sector: spin.index, turn: rt.turn }), now, s.code, s.revision));
  statements.push(db.prepare("UPDATE sessions SET runtime=?,reveal=?,revision=revision+1 WHERE code=? AND revision=?").bind(JSON.stringify(next), spin.index, s.code, s.revision));
  try {
    await batch(db, statements);
  } catch {
  }
}
async function gameInteract(db, s, a, rt, p, b, now, host) {
  if (s.status !== "question" || s.paused) fail2("CLOSED", 409);
  if (["selectturn", "spin", "respin", "box"].includes(b.action)) {
    if (!["Wheel of Fortune", "Spin Wheel", "Open the Box"].includes(a.type)) fail2("STATE", 409);
    const players = (await db.prepare("SELECT id,name,team FROM players WHERE session=? AND approval='approved' AND eligible_from<=? ORDER BY joined_at").bind(s.code, s.current).all()).results;
    if (!players.length) fail2("PLAYER");
    let target = rt.target || players[(rt.turn || 0) % players.length].id;
    if (b.action === "selectturn") {
      if (!host) fail2("FORBIDDEN", 403);
      if (b.mode === "random") target = players[fairIndex(players.length)].id;
      else if (b.player) {
        if (!players.some((x) => x.id === b.player)) fail2("PLAYER");
        target = b.player;
      }
      rt = { ...rt, target };
    } else {
      if (!host && b.turn !== rt.turn && b.turn !== (rt.turn || 0)) fail2("STALE", 409);
      if (!host && p?.id !== target) fail2("FORBIDDEN", 403);
      if (rt.spin && !rt.spin.revealed) fail2("STATE", 409);
      if (rt.box && a.boxes?.[rt.box.index]?.question) {
        const oldBox = await read(db, s, rt.box.target);
        if (!oldBox.data.boxes?.includes(rt.box.id)) fail2("STATE", 409);
      }
      if (rt.spin?.revealed && a.sectors?.[rt.spin.index]?.kind === "question") {
        const old2 = await read(db, s, `wheel:${rt.spin.id}:${rt.spin.target}`);
        if ((old2.data.step || 0) < a.sectors[rt.spin.index].questions.length) fail2("STATE", 409);
      }
      if ((rt.turn || 0) >= (a.rounds ?? a.items?.length ?? 1) && b.action !== "respin") fail2("ROUNDS_COMPLETE", 409);
      if (b.action === "respin") {
        if (!host || typeof b.reason !== "string" || b.reason.trim().length < 5) fail2("REASON");
        if (rt.spin?.revealed) fail2("IMMUTABLE", 409);
        await audit(db, s.owner, s.code, "wheel-respin", { reason: b.reason, previous: rt.spin?.id });
      }
      if (b.action === "box") {
        const i = b.index;
        if (!Number.isInteger(i) || i < 0 || i >= a.items.length || rt.used?.includes(i) && !a.repeatable) fail2("STATE", 409);
        const box = a.boxes?.[i], id = crypto.randomUUID();
        rt = { ...rt, target, box: { id, index: i, target, done: !box?.question }, used: [...rt.used || [], i], turn: (rt.turn || 0) + 1 };
        const points = box && !box.question ? Math.round((box.points || 0) * (a.weight ?? 1)) : 0;
        const statements = [];
        if (target) statements.push(db.prepare("INSERT INTO events(session,id,player,round,kind,points,detail,created_at) SELECT ?,?,?,?,?,?,?,? FROM sessions WHERE code=? AND revision=?").bind(s.code, "box:" + id, target, s.current, "box", points, JSON.stringify({ box: i }), now, s.code, s.revision));
        statements.push(db.prepare("UPDATE sessions SET runtime=?,reveal=?,revision=revision+1 WHERE code=? AND revision=?").bind(JSON.stringify(rt), i, s.code, s.revision));
        const result = await batch(db, statements);
        if (!result.at(-1)?.meta.changes) fail2("STALE", 409);
        return { ok: true };
      } else if (b.action !== "selectturn") {
        const sectors = a.sectors || a.items.map((label) => ({ label, repeatable: true }));
        const available = sectors.map((_, i) => i).filter((i) => sectors[i].repeatable || !rt.used?.includes(i));
        if (!available.length) fail2("ROUNDS_COMPLETE", 409);
        const index = available[fairIndex(available.length)], id = crypto.randomUUID(), duration = (a.spinDuration ?? 6) * 1e3;
        rt = { ...rt, target, spin: { id, index, target, startsAt: now + 3e3, stopsAt: now + 3e3 + duration, revealAt: now + 3e3 + duration + 2e3, revealed: false } };
      }
    }
    const r = await writeSession(db, s, { ...s, runtime: JSON.stringify(rt), revision: s.revision + 1 });
    if (!r.meta.changes) fail2("STALE", 409);
    return { ok: true };
  }
  if (host && ["override", "hint"].includes(b.action)) {
    if (a.type !== "Escape Room" || !b.player || typeof b.reason !== "string" || b.reason.trim().length < 5) fail2("REASON");
    const target = await db.prepare("SELECT id,team FROM players WHERE session=? AND id=?").bind(s.code, b.player).first();
    if (!target) fail2("PLAYER");
    const actor2 = groupActor(a, target), old2 = await read(db, s, actor2), d2 = { ...old2.data };
    if (b.action === "hint") d2.hostHint = String(b.hint || a.rooms[d2.room || 0]?.hint || "").slice(0, 1e3);
    else {
      const room = d2.room || 0;
      d2.room = Math.min(a.rooms.length, room + 1);
      d2.puzzle = 0;
      d2.overrides = [...d2.overrides || [], { room, reason: b.reason }];
    }
    await saveProgress(db, s, actor2, old2, d2);
    await audit(db, s.owner, s.code, "escape-" + b.action, { player: b.player, reason: b.reason });
    return { ok: true };
  }
  if (!p) fail2("PLAYER", 401);
  const actor = groupActor(a, p), old = await read(db, s, actor), d = { ...old.data }, events = [], after = [];
  if (!["miniquiz"].includes(b.action) && b.version !== old.version) fail2("STALE", 409);
  if (b.action === "bet") {
    if (rt.targets?.length && !rt.targets.includes(p.id)) fail2("FORBIDDEN", 403);
    if (rt.phase !== "betting" || !a.betEnabled || d.bet != null || !Number.isInteger(b.amount) || b.amount < 0 || b.amount > 1e4) fail2("STATE", 409);
    const sums = await db.prepare("SELECT (SELECT COALESCE(SUM(points),0) FROM answers WHERE session=? AND player=?)+(SELECT COALESCE(SUM(points),0) FROM events WHERE session=? AND player=?) AS score").bind(s.code, p.id, s.code, p.id).first();
    if (b.amount > sums.score) fail2("BET");
    d.bet = b.amount;
    events.push({ id: `bet:${s.current}:${p.id}`, player: p.id, kind: "bet", points: -b.amount });
  } else if (b.action === "lifeline") {
    if (a.mainType !== "Ultimate Game Show" || ["betting", "casting"].includes(rt.phase) || rt.targets?.length && !rt.targets.includes(p.id)) fail2("STATE");
    d.lifelines = d.lifelines || [];
    if (!["fifty", "audience", "time"].includes(b.kind) || d.lifelines.includes(b.kind)) fail2("STATE");
    d.lifelines.push(b.kind);
    if (b.kind === "fifty") {
      if (!a.options || a.options.length < 3) fail2("STATE");
      d.eliminated = a.options.map((_, i) => i).filter((i) => i !== a.correct).slice(0, 2);
    }
    if (b.kind === "audience") d.audience = true;
    if (b.kind === "time") {
      if (!s.deadline || s.deadline <= now) fail2("STATE");
      d.mutation = crypto.randomUUID();
      after.push(db.prepare("UPDATE sessions SET deadline=deadline+30000,revision=revision+1 WHERE code=? AND revision=? AND EXISTS(SELECT 1 FROM progress WHERE session=? AND round=? AND actor=? AND json_extract(data,'$.mutation')=?)").bind(s.code, s.revision, s.code, s.current, actor, d.mutation));
    }
  } else if (b.action === "audience") {
    if (a.mainType !== "Ultimate Game Show" || !Number.isInteger(b.choice) || b.choice < 0 || b.choice >= a.options.length || d.audienceVote != null) fail2("STATE");
    d.audienceVote = b.choice;
  } else if (a.type === "Flashcards") {
    if (!Number.isInteger(b.index) || b.index < 0 || b.index >= a.fronts.length) fail2("ANSWER");
    d.card = b.index;
    if (["flip", "card"].includes(b.action)) d.flipped = b.action === "flip";
    d.reviewed = [.../* @__PURE__ */ new Set([...d.reviewed || [], b.index])];
    if (b.action === "selfassess") {
      d.assessment = { ...d.assessment || {}, [b.index]: b.known === true };
    }
  } else if (a.type === "Escape Room") {
    const room = d.room || 0, puzzle = d.puzzle || 0, r = a.rooms[room];
    if (!r) fail2("CLOSED", 409);
    d.attempts = d.attempts || 0;
    if (b.action === "hint") {
      if (d.attempts < (r.hintAfter ?? 1)) fail2("HINT_LOCKED");
      d.hint = r.hint;
    } else if (b.action === "puzzle") {
      const q = r.puzzles[puzzle];
      if (r.seconds && now > (d.roomClock || s.started_at) + r.seconds * 1e3 + (rt.pausedTotal || 0)) fail2("TIMEOUT");
      if (!q) fail2("STATE");
      let g;
      try {
        g = evaluate(q, b.answer);
      } catch {
        fail2("ANSWER");
      }
      d.attempts++;
      d.lastCorrect = !!g.evaluation;
      if (g.evaluation) {
        const eventId = `escape:${s.current}:${actor}:${room}:${puzzle}`;
        if (a.scored !== false && !d.credited?.includes(eventId)) events.push({ id: eventId, player: p.id, kind: "escape", points: Math.round((q.points ?? 1e3) * (a.weight ?? 1)), detail: { actor, room, puzzle } });
        d.credited = [.../* @__PURE__ */ new Set([...d.credited || [], eventId])];
        d.history = [...d.history || [], { room, puzzle, answer: b.answer, correct: true }];
        d.puzzle = puzzle + 1;
        if (d.puzzle >= (r.unlockAfter || r.puzzles.length)) {
          d.room = room + 1;
          d.roomClock = now - (rt.pausedTotal || 0);
          d.puzzle = 0;
          d.hint = null;
          d.attempts = 0;
        }
      } else if (r.wrongPolicy === "restart-room") d.puzzle = 0;
    } else fail2("ACTION");
  } else if (a.type === "Scenario Challenge" && a.nodes) {
    if (b.action !== "decision") fail2("ACTION");
    const node = a.nodes.find((x) => x.id === (d.node || a.start));
    if (!node || node.ending || !Number.isInteger(b.choice) || !node.choices[b.choice]) fail2("STATE");
    const c = node.choices[b.choice];
    d.node = c.next;
    d.consequence = c.consequence;
    d.path = [...d.path || [], { node: node.id, choice: b.choice, consequence: c.consequence }];
    if (a.scored !== false && c.points) events.push({ id: `scenario:${s.current}:${p.id}:${node.id}`, player: p.id, kind: "scenario", points: Math.round(c.points * (a.weight ?? 1)), detail: { node: node.id, choice: b.choice } });
  } else if (["Wheel of Fortune", "Spin Wheel"].includes(a.type) && b.action === "miniquiz") {
    if (!rt.spin?.revealed || rt.spin.target !== p.id) fail2("FORBIDDEN", 403);
    const sector = a.sectors[rt.spin.index];
    if (sector.kind !== "question") fail2("STATE");
    const miniActor = `wheel:${rt.spin.id}:${p.id}`, miniOld = await read(db, s, miniActor), md = { ...miniOld.data }, step = md.step || 0, q = sector.questions[step];
    if (b.version !== miniOld.version) fail2("STALE", 409);
    if (!q) fail2("CLOSED");
    const deadline = (md.clock || rt.spin.revealAt - (rt.pausedTotal || 0)) + q.timer * 1e3 + (rt.pausedTotal || 0);
    let g;
    if (now >= deadline) g = { points: 0, correct: false };
    else try {
      g = grade({ ...q, weight: a.weight ?? 1, speed: true }, b.answer, { remaining: deadline - now, duration: q.timer * 1e3 });
    } catch {
      fail2("ANSWER");
    }
    md.step = step + 1;
    md.clock = now - (rt.pausedTotal || 0);
    md.lastCorrect = !!g.correct;
    events.push({ id: `mini:${rt.spin.id}:${step}`, player: p.id, kind: "wheel-quiz", points: g.points, detail: { step } });
    await saveProgress(db, s, miniActor, miniOld, md, events, now);
    return { ok: true };
  } else if (a.type === "Open the Box" && b.action === "boxquiz") {
    if (!rt.box || rt.box.target !== p.id) fail2("FORBIDDEN", 403);
    const box = a.boxes?.[rt.box.index];
    if (!box?.question || d.boxes?.includes(rt.box.id)) fail2("STATE");
    let g;
    try {
      g = grade({ ...box.question, weight: a.weight ?? 1 }, b.answer);
    } catch {
      fail2("ANSWER");
    }
    d.boxes = [...d.boxes || [], rt.box.id];
    events.push({ id: `boxquiz:${rt.box.id}`, player: p.id, kind: "box-quiz", points: g.points });
  } else fail2("ACTION");
  await saveProgress(db, s, actor, old, d, events, now, after);
  return { ok: true };
}
async function gameSnapshot(db, s, a, rt, p, host, now) {
  if (!a) return {};
  const actor = p ? groupActor(a, p) : "", old = p ? await read(db, s, actor) : { data: {}, version: 0 }, d = old.data, game = { version: old.version || 0 };
  if (["Wheel of Fortune", "Spin Wheel", "Open the Box"].includes(a.type)) {
    const players = (await db.prepare("SELECT id AS uid,name,team FROM players WHERE session=? AND approval='approved' AND eligible_from<=? ORDER BY joined_at").bind(s.code, s.current).all()).results;
    game.target = rt.target || players[(rt.turn || 0) % Math.max(1, players.length)]?.uid;
    game.turn = rt.turn || 0;
    game.rounds = a.rounds ?? a.items?.length ?? 1;
    game.used = rt.used || [];
    if (rt.spin) {
      game.spinTarget = rt.spin.target;
      game.spin = { id: rt.spin.id, startsAt: rt.spin.startsAt, stopsAt: rt.spin.stopsAt, revealAt: rt.spin.revealAt, revealed: !!rt.spin.revealed, index: now >= rt.spin.stopsAt ? rt.spin.index : null };
      if (rt.spin.revealed) {
        const sector = a.sectors?.[rt.spin.index];
        game.outcome = sector ? { label: sector.label, kind: sector.kind, detail: sector.detail, points: sector.points || 0 } : a.items[rt.spin.index];
        if (sector?.kind === "question") {
          const md = await read(db, s, `wheel:${rt.spin.id}:${rt.spin.target}`), q = sector.questions[md.data.step || 0];
          game.mini = { version: md.version, step: md.data.step || 0, total: sector.questions.length, question: q ? publicActivity(q) : null, deadline: q ? (md.data.clock || rt.spin.revealAt - (rt.pausedTotal || 0)) + q.timer * 1e3 + (rt.pausedTotal || 0) : null, lastCorrect: md.data.lastCorrect };
        }
      }
    }
    if (rt.box) {
      const box = a.boxes?.[rt.box.index];
      game.box = { id: rt.box.id, target: rt.box.target, index: rt.box.index, label: a.items[rt.box.index], detail: box?.detail, question: box?.question ? publicActivity(box.question) : null, answered: !!d.boxes?.includes(rt.box.id) };
    }
  }
  if (a.type === "Flashcards" && p) {
    game.card = d.card ?? 0;
    game.flipped = !!d.flipped;
    game.back = d.flipped ? a.backs[d.card ?? 0] : null;
    game.reviewed = d.reviewed || [];
    game.assessment = d.assessment || {};
  }
  if (a.type === "Escape Room") {
    const r = a.rooms[d.room || 0], q = r?.puzzles[d.puzzle || 0];
    game.escape = p ? { room: d.room || 0, puzzle: d.puzzle || 0, totalRooms: a.rooms.length, title: r?.title, narrative: r?.narrative, hint: d.hostHint || d.hint, hintAvailable: (d.attempts || 0) >= (r?.hintAfter ?? 1), attempts: d.attempts || 0, lastCorrect: d.lastCorrect, question: q ? publicActivity(q) : null, escaped: !r, deadline: r?.seconds ? (d.roomClock || s.started_at) + r.seconds * 1e3 + (rt.pausedTotal || 0) : null, history: d.history || [] } : null;
    if (host) game.progress = (await db.prepare("SELECT actor,data FROM progress WHERE session=? AND round=?").bind(s.code, s.current).all()).results.map((x) => {
      const d2 = JSON.parse(x.data);
      return { actor: x.actor, room: d2.room || 0, puzzle: d2.puzzle || 0, attempts: d2.attempts || 0 };
    });
  }
  if (a.nodes && p) {
    const node = a.nodes.find((n) => n.id === (d.node || a.start));
    game.scenario = { text: node.text, ending: !!node.ending, discussion: node.discussion, choices: node.choices?.map((c) => ({ label: c.label })), consequence: d.consequence, path: d.path || [] };
  }
  if (a.mainType === "Ultimate Game Show") {
    game.lifelines = d.lifelines || [];
    game.eliminated = d.eliminated || [];
    game.bet = d.bet ?? null;
    game.audienceRequested = !!d.audience;
    const allProgress = (await db.prepare("SELECT data FROM progress WHERE session=? AND round=?").bind(s.code, s.current).all()).results.map((x) => JSON.parse(x.data));
    game.audienceRequested = allProgress.some((x) => x.audience);
    const audience = allProgress.filter((x) => x.audienceVote != null);
    game.audience = a.options?.map((_, i) => audience.filter((x) => x.audienceVote === i).length) || [];
  }
  return { game };
}

// lib/service.ts
var ApiError = class extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
};
var fail2 = (code, status = 400) => {
  throw new ApiError(code, status);
};
var hash = async (value) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join("");
async function batch(db, statements) {
  return db.batch(statements);
}
async function service(db, req, owner, ctx = {}) {
  const url = new URL(req.url), method = req.method, now = Date.now();
  let b = {};
  if (method === "POST") b = await readJson(req);
  if (["/api/drafts", "/api/catalog", "/api/branding", "/api/admin"].includes(url.pathname)) {
    if (!owner && !(url.pathname === "/api/branding" && method === "GET")) fail2("SIGN_IN", 401);
    return workspace(db, url, method, b, owner, ctx);
  }
  if (url.pathname === "/api/sessions") {
    if (!owner) fail2("SIGN_IN", 401);
    if (method === "GET") {
      const reportScope = url.searchParams.get("reports") === "1", owners = reportScope && ctx.role === "senior" ? [owner, ...ctx.reportOwners || []] : [owner];
      const where = reportScope && ctx.role === "admin" ? "1=1" : `owner IN (${owners.map(() => "?").join(",")})`;
      return { sessions: (await db.prepare(`SELECT code,title,owner,language,teams,status,current,created_at,(SELECT COUNT(*) FROM players WHERE session=sessions.code) AS participants FROM sessions WHERE ${where} ORDER BY created_at DESC LIMIT 500`).bind(...where === "1=1" ? [] : owners).all()).results };
    }
    if (method !== "POST") fail2("METHOD", 405);
    if (typeof b.title !== "string" || !b.title.trim() || b.title.length > 100) fail2("TITLE");
    let blueprint, deck2;
    try {
      blueprint = validateDeck(b.activities);
      deck2 = flattenDeck(blueprint);
    } catch {
      fail2("DECK");
    }
    const settings2 = { tie: ["shared", "correct", "speed"].includes(b.settings?.tie) ? b.settings.tie : "shared", teamNames: Array.isArray(b.settings?.teamNames) && b.settings.teamNames.length >= 2 && b.settings.teamNames.length <= 20 ? b.settings.teamNames.map((x) => String(x).slice(0, 40)) : ["Lightning", "Wave"], progression: b.settings?.progression === "auto" ? "auto" : "manual", reveal: b.settings?.reveal === "manual" ? "manual" : "auto", surveyOnly: !!b.settings?.surveyOnly, teamScoring: b.settings?.teamScoring === "average" ? "average" : "sum" };
    if (settings2.teamNames.some((x) => !x.trim()) || new Set(settings2.teamNames).size !== settings2.teamNames.length) fail2("TEAM");
    const survey = b.survey ? validateSurvey(b.survey) : null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code2 = String(1e5 + fairIndex(9e5));
      try {
        await db.prepare("INSERT INTO sessions(code,owner,title,language,teams,activities,status,current,revision,paused,remaining,created_at,settings,blueprint,runtime,anonymous_secret,survey) VALUES(?,?,?,?,?,?,?,-1,1,0,0,?,?,?,?,?,?)").bind(code2, owner, b.title.trim(), b.language === "en" ? "en" : "ar", b.teams ? 1 : 0, JSON.stringify(deck2), b.review === true ? "ready" : "lobby", now, JSON.stringify(settings2), JSON.stringify(blueprint), "{}", crypto.randomUUID() + crypto.randomUUID(), survey ? JSON.stringify(survey) : null).run();
        await audit(db, owner, code2, "session-created", { steps: deck2.length });
        return { code: code2 };
      } catch (e) {
        if (attempt === 4 || !String(e).includes("UNIQUE constraint failed: sessions.code")) throw e;
      }
    }
  }
  const code = b.code || url.searchParams.get("code");
  if (!/^\d{6}$/.test(code || "")) fail2("CODE");
  let s = await db.prepare("SELECT * FROM sessions WHERE code=?").bind(code).first();
  if (!s) fail2("NOT_FOUND", 404);
  const requireHost = () => {
    if (!owner || s.owner !== owner && ctx.role !== "admin") fail2("FORBIDDEN", 403);
  };
  const requireReport = () => {
    if (!owner || !(s.owner === owner || ctx.role === "admin" || ctx.role === "senior" && ctx.reportOwners?.includes(s.owner))) fail2("FORBIDDEN", 403);
  };
  const settings = JSON.parse(s.settings || "{}"), deck = JSON.parse(s.activities), active = () => deck[s.current];
  let rt = JSON.parse(s.runtime || "{}");
  if (s.status === "question" && !s.paused && s.deadline && s.deadline <= now && rt.phase !== "betting") {
    await db.prepare("UPDATE sessions SET status='results',paused=0,revision=revision+1 WHERE code=? AND revision=? AND status='question' AND paused=0 AND deadline<=?").bind(code, s.revision, now).run();
    s = await db.prepare("SELECT * FROM sessions WHERE code=?").bind(code).first();
  }
  if (s.status === "question" && !s.paused && rt.spin?.revealAt <= now) {
    await settleWheel(db, s, active(), rt, now);
    s = await db.prepare("SELECT * FROM sessions WHERE code=?").bind(code).first();
    rt = JSON.parse(s.runtime || "{}");
  }
  if (s.status === "results" && settings.progression === "auto" && (settings.reveal !== "manual" || rt.keyRevealed) && active()?.type !== "Meta Plan" && active()?.type !== "Categorize" && s.current + 1 < deck.length && now - (s.deadline || now) > 6e3) {
    const n = nextState(s, "next", now);
    await writeSession(db, s, n);
    s = await db.prepare("SELECT * FROM sessions WHERE code=?").bind(code).first();
    rt = JSON.parse(s.runtime || "{}");
  }
  const token = req.headers.get("X-Player-Token"), player = token ? await db.prepare("SELECT * FROM players WHERE session=? AND token=?").bind(code, await hash(token)).first() : null;
  if (url.pathname === "/api/recover" && method === "POST") {
    let employeeId;
    try {
      employeeId = normalizeEmployeeId(b.employeeId);
    } catch {
      fail2("EMPLOYEE_ID");
    }
    const employeeKey = await hash(code + ":" + employeeId), recovery = normalizeRecoveryCode(b.recoveryCode);
    if (!/^[A-F0-9]{20}$/.test(recovery)) fail2("RECOVERY", 401);
    const newToken = crypto.randomUUID() + crypto.randomUUID();
    const r = await db.prepare("UPDATE players SET token=? WHERE session=? AND employee_key=? AND recovery_hash=?").bind(await hash(newToken), code, employeeKey, await hash(code + ":" + recovery)).run();
    if (!r.meta.changes) fail2("RECOVERY", 401);
    await audit(db, s.owner, code, "device-recovery");
    return { token: newToken };
  }
  if (url.pathname === "/api/join" && method === "POST") {
    if (["ready", "draft", "completed", "archived", "survey"].includes(s.status)) fail2(["ready", "draft"].includes(s.status) ? "NOT_LAUNCHED" : "ENDED");
    if (typeof b.name !== "string" || !b.name.trim() || b.name.trim().length > 40) fail2("NAME");
    let employeeId;
    try {
      employeeId = normalizeEmployeeId(b.employeeId);
    } catch {
      fail2("EMPLOYEE_ID");
    }
    if (b.confirmed !== true) fail2("CONFIRM_IDENTITY");
    const employeeKey = await hash(code + ":" + employeeId);
    if (await db.prepare("SELECT id FROM players WHERE session=? AND employee_key=?").bind(code, employeeKey).first()) fail2("ALREADY_REGISTERED", 409);
    const id = crypto.randomUUID(), newToken = crypto.randomUUID() + crypto.randomUUID(), team = s.teams ? (settings.teamNames || ["Lightning", "Wave"]).includes(b.team) ? b.team : fail2("TEAM") : null, recoveryCode = crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase(), approval = s.status === "lobby" ? "approved" : "pending";
    if (player && !player.employee_id) {
      const upgraded = await db.prepare("UPDATE players SET name=?,team=?,employee_key=?,employee_id=?,recovery_hash=? WHERE session=? AND id=? AND employee_id IS NULL").bind(b.name.trim(), team, employeeKey, employeeId, await hash(code + ":" + recoveryCode), code, player.id).run();
      if (!upgraded.meta.changes) fail2("ALREADY_REGISTERED", 409);
      return { id: player.id, token, recoveryCode: recoveryCode.match(/.{1,5}/g).join("-") };
    }
    let r;
    try {
      r = await db.prepare("INSERT INTO players(session,id,token,name,team,eligible_from,joined_at,employee_key,employee_id,recovery_hash,approval,language) SELECT ?,?,?,?,?,current+1,?,?,?,?,?,? FROM sessions WHERE code=? AND status IN ('lobby','question','results') AND (SELECT COUNT(*) FROM players WHERE session=?)<80").bind(code, id, await hash(newToken), b.name.trim(), team, now, employeeKey, employeeId, await hash(code + ":" + recoveryCode), approval, b.language === "en" ? "en" : "ar", code, code).run();
    } catch {
      fail2("ALREADY_REGISTERED", 409);
    }
    if (!r.meta.changes) fail2("FULL");
    return { id, token: newToken, approval, recoveryCode: recoveryCode.match(/.{1,5}/g).join("-") };
  }
  if (url.pathname === "/api/control" && method === "POST") {
    requireHost();
    if (b.revision !== s.revision) fail2("STALE", 409);
    if (["approve", "reject"].includes(b.action)) {
      const r2 = await db.prepare("UPDATE players SET approval=?,eligible_from=? WHERE session=? AND id=? AND approval='pending'").bind(b.action === "approve" ? "approved" : "rejected", s.current + 1, code, b.player).run();
      if (!r2.meta.changes) fail2("STATE", 409);
      await audit(db, owner, code, b.action, { player: b.player });
      return { ok: true };
    }
    if (b.action === "launch") {
      if (s.status !== "ready") fail2("STATE", 409);
      await db.prepare("UPDATE sessions SET status='lobby',revision=revision+1 WHERE code=? AND revision=?").bind(code, s.revision).run();
      return { ok: true };
    }
    if (b.action === "archive") {
      if (s.status !== "completed") fail2("STATE", 409);
      await db.prepare("UPDATE sessions SET status='archived',revision=revision+1 WHERE code=? AND revision=?").bind(code, s.revision).run();
      return { ok: true };
    }
    if (b.action === "duplicate") {
      const blueprint = JSON.parse(s.blueprint || s.activities);
      return service(db, new Request(url.origin + "/api/sessions", { method: "POST", body: JSON.stringify({ title: s.title + " \xB7 Copy", language: s.language, teams: !!s.teams, activities: blueprint, settings, survey: s.survey ? JSON.parse(s.survey) : null, review: true }) }), owner, ctx);
    }
    if (b.action === "editfuture") {
      if (["completed", "archived", "survey"].includes(s.status)) fail2("IMMUTABLE", 409);
      let bp, next;
      try {
        bp = validateDeck(b.activities);
        next = flattenDeck(bp);
      } catch {
        fail2("DECK");
      }
      if (next.length <= s.current) fail2("IMMUTABLE", 409);
      const historical = s.blueprint ? deck : flattenDeck(validateDeck(deck));
      for (let i = 0; i <= s.current; i++) if (JSON.stringify(next[i]) !== JSON.stringify(historical[i])) fail2("IMMUTABLE", 409);
      const r2 = await db.prepare("UPDATE sessions SET blueprint=?,activities=?,revision=revision+1 WHERE code=? AND revision=?").bind(JSON.stringify(bp), JSON.stringify(next), code, s.revision).run();
      if (!r2.meta.changes) fail2("STALE", 409);
      await audit(db, owner, code, "future-edited", { from: s.current + 1 });
      return { ok: true };
    }
    if (["projection", "revealkey", "lockbets", "survey", "ceremony", "highlight", "notes", "metareveal", "stagecast", "closesurvey"].includes(b.action)) {
      if (b.action === "projection") {
        rt = { ...rt, board: !!b.board, quiet: !!b.quiet, intensity: ["full", "light", "off"].includes(b.intensity) ? b.intensity : "full", analytics: !!b.analytics };
      }
      if (b.action === "revealkey") {
        if (s.status !== "results") fail2("STATE");
        rt.keyRevealed = true;
      }
      if (b.action === "metareveal") {
        if (s.status !== "results" || !active()?.assignments) fail2("STATE");
        rt.metaCount = Math.min(active().items.length, (rt.metaCount || 0) + 1);
        rt.keyRevealed = true;
      }
      if (b.action === "revealkey") rt.metaCount = active()?.items?.length;
      if (b.action === "highlight") rt.highlight = b.index;
      if (b.action === "notes") rt.notes = String(b.notes || "").slice(0, 3e3);
      if (b.action === "closesurvey") {
        if (!["survey", "completed"].includes(s.status)) fail2("STATE");
        rt.surveyOpen = false;
        rt.surveyFinished = true;
        if (s.status === "survey") s.status = "completed";
      }
      if (b.action === "stagecast") {
        if (rt.phase !== "casting" || !Array.isArray(b.players) || !b.players.length) fail2("STATE");
        const eligible = (await db.prepare("SELECT id,team FROM players WHERE session=? AND approval='approved' AND eligible_from<=?").bind(code, s.current).all()).results;
        if (b.players.some((id) => !eligible.some((x) => x.id === id)) || active().participation === "individual" && b.players.length !== 1 || active().participation === "head-to-head" && b.players.length !== 2) fail2("PLAYER");
        rt.targets = [...new Set(b.players)];
        rt.phase = active().betEnabled ? "betting" : "answering";
        s.started_at = now;
        s.deadline = active().betEnabled ? null : now + active().timer * 1e3;
      }
      if (b.action === "lockbets") {
        if (rt.phase !== "betting" || s.status !== "question") fail2("STATE");
        rt.phase = "answering";
        s.deadline = now + active().timer * 1e3;
        s.started_at = now;
      }
      if (b.action === "survey") {
        if (!s.survey || !["lobby", "results", "completed"].includes(s.status)) fail2("STATE");
        s.status = "survey";
        rt.surveyOpen = true;
      }
      if (b.action === "ceremony") {
        if (s.status !== "survey") fail2("STATE");
        s.status = "completed";
        rt.surveyFinished = true;
        rt.surveyOpen = false;
      }
      const written = await writeSession(db, s, { ...s, runtime: JSON.stringify(rt), revision: s.revision + 1 });
      if (!written.meta.changes) fail2("STALE", 409);
      await audit(db, owner, code, b.action, b.action === "notes" ? { notes: rt.notes } : { round: s.current });
      return { ok: true };
    }
    if (["selectturn", "spin", "respin", "box", "override", "hint"].includes(b.action)) return gameInteract(db, s, active(), rt, null, b, now, true);
    if (b.action === "finish" && s.survey && !rt.surveyFinished) {
      const survey = JSON.parse(s.survey);
      if (survey.stage === "before-ceremony") {
        await writeSession(db, s, { ...s, status: "survey", runtime: JSON.stringify({ ...rt, surveyOpen: true }), revision: s.revision + 1 });
        return { ok: true };
      }
      rt.surveyAvailable = true;
      rt.surveyOpen = true;
    }
    let index = b.index;
    if (b.action === "reveal" && active()?.type === "Spin Wheel") index = fairIndex(active().items.length);
    let n;
    try {
      n = nextState(s, b.action, now, index);
    } catch {
      fail2("STATE", 409);
    }
    if (b.action === "close") {
      n.deadline = now;
      n.runtime = JSON.stringify({ ...rt, keyRevealed: !["Meta Plan", "Categorize"].includes(active()?.type) && settings.reveal !== "manual", revealAt: now + (active()?.mainType === "Ultimate Game Show" ? 2e3 : 0) });
    }
    if (b.action === "finish") n.runtime = JSON.stringify(rt);
    const r = await writeSession(db, s, n);
    if (!r.meta.changes) fail2("STALE", 409);
    await audit(db, owner, code, b.action, { round: s.current });
    return { ok: true };
  }
  if (url.pathname === "/api/interact" && method === "POST") {
    if (!player) fail2("PLAYER", 401);
    if (player.approval !== "approved") fail2("PENDING", 403);
    if (s.status !== "question" || s.paused || player.eligible_from > s.current || s.deadline && s.deadline <= now || b.round !== s.current) fail2("CLOSED", 409);
    return gameInteract(db, s, active(), rt, player, b, now, false);
  }
  if (url.pathname === "/api/answer" && method === "POST") {
    if (!player) fail2("PLAYER", 401);
    if (player.approval !== "approved") fail2("PENDING", 403);
    if (s.status !== "question" || s.paused || s.deadline && s.deadline <= now || b.round !== s.current || player.eligible_from > s.current || ["betting", "casting"].includes(rt.phase) || rt.targets?.length && !rt.targets.includes(player.id)) fail2("CLOSED", 409);
    const a2 = active();
    if (presentation(a2.type) || a2.rooms || a2.nodes) fail2("PRESENTATION");
    let scored;
    try {
      scored = grade(a2, b.answer, { remaining: s.deadline ? s.deadline - now : 1, duration: a2.timer * 1e3 + (rt.addedTime || 0) || 1 });
    } catch {
      fail2("ANSWER");
    }
    if (!s.settings) {
      try {
        const g = evaluateActivity(a2, b.answer);
        scored = { points: g.graded && g.correct ? 1e3 : 0, correct: g.correct === null ? null : Number(g.correct) };
      } catch {
        fail2("ANSWER");
      }
    }
    if (a2.betEnabled && scored.correct) {
      const bet = await db.prepare("SELECT data FROM progress WHERE session=? AND round=? AND actor=?").bind(code, s.current, player.id).first();
      scored.points += 2 * (bet ? JSON.parse(bet.data).bet || 0 : 0);
    }
    const receipt = a2.type === "Live Poll" && a2.anonymous ? await hash(s.anonymous_secret + ":poll:" + s.current + ":" + player.id) : null;
    const guard = " FROM sessions WHERE code=? AND current=? AND status='question' AND paused=0 AND (deadline IS NULL OR deadline>?) AND revision=?";
    try {
      let r;
      if (receipt) {
        r = await db.prepare("INSERT INTO anonymous_responses(session,round,receipt,answer,created_at) SELECT ?,?,?,?,?" + guard).bind(code, s.current, receipt, JSON.stringify(b.answer), now, code, s.current, now, s.revision).run();
      } else {
        r = await db.prepare("INSERT INTO answers(session,round,player,answer,points,correct,created_at,elapsed_ms) SELECT ?,?,?,?,?,?,?,?" + guard).bind(code, s.current, player.id, JSON.stringify(b.answer), scored.points, scored.correct, now, Math.max(0, a2.timer * 1e3 + (rt.addedTime || 0) - (s.deadline ? Math.min(a2.timer * 1e3 + (rt.addedTime || 0), s.deadline - now) : a2.timer * 1e3)), code, s.current, now, s.revision).run();
      }
      if (!r.meta.changes) fail2("CLOSED", 409);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (a2.type === "Live Poll" && a2.allowChanges) {
        const table = receipt ? "anonymous_responses" : "answers", field = receipt ? "receipt" : "player";
        await db.prepare(`UPDATE ${table} SET answer=? WHERE session=? AND round=? AND ${field}=? AND EXISTS(SELECT 1 FROM sessions WHERE code=? AND status='question' AND paused=0 AND (deadline IS NULL OR deadline>?) AND revision=?)`).bind(JSON.stringify(b.answer), code, s.current, receipt || player.id, code, now, s.revision).run();
      } else fail2("ALREADY_ANSWERED", 409);
    }
    if (["Meta Plan", "Categorize"].includes(a2.type) && a2.autoClose) {
      const count = await db.prepare("SELECT COUNT(*) AS n FROM players WHERE session=? AND approval='approved' AND eligible_from<=?").bind(code, s.current).first(), answers = await db.prepare("SELECT COUNT(*) AS n FROM answers WHERE session=? AND round=?").bind(code, s.current).first();
      if (count.n > 0 && count.n === answers.n) await db.prepare("UPDATE sessions SET status='results',deadline=?,runtime=?,revision=revision+1 WHERE code=? AND revision=? AND status='question'").bind(now, JSON.stringify({ ...rt, keyRevealed: false }), code, s.revision).run();
    }
    return { ok: true };
  }
  if (url.pathname === "/api/survey" && method === "POST") {
    if (!player || player.approval !== "approved") fail2("PLAYER", 401);
    if (!s.survey || !rt.surveyOpen || !["survey", "completed"].includes(s.status)) fail2("CLOSED", 409);
    const survey = JSON.parse(s.survey);
    if (!Array.isArray(b.answers) || b.answers.length !== survey.questions.length) fail2("SURVEY");
    survey.questions.forEach((q, i) => {
      const x = b.answers[i];
      if (q.kind === "rating" && (!Number.isInteger(x) || x < 1 || x > 5) || q.kind === "choice" && (!Number.isInteger(x) || x < 0 || x >= q.options.length) || q.kind === "text" && (typeof x !== "string" || x.trim().length === 0 || x.length > 2e3)) fail2("SURVEY");
    });
    const receipt = survey.anonymous ? await hash(s.anonymous_secret + ":survey:" + player.id) : player.id;
    try {
      if (survey.anonymous) await db.prepare("INSERT INTO anonymous_responses(session,round,receipt,answer,created_at) VALUES(?,-1,?,?,?)").bind(code, receipt, JSON.stringify(b.answers), now).run();
      else await db.prepare("INSERT INTO answers(session,round,player,answer,points,correct,created_at) VALUES(?,-1,?,?,0,NULL,?)").bind(code, player.id, JSON.stringify(b.answers), now).run();
    } catch {
      fail2("ALREADY_ANSWERED", 409);
    }
    return { ok: true };
  }
  if (url.pathname === "/api/report" && method === "GET") {
    requireReport();
    const players = (await db.prepare("SELECT id,name,employee_id,team,approval,joined_at FROM players WHERE session=?").bind(code).all()).results;
    const answers = (await db.prepare("SELECT round,player,answer,points,correct,created_at FROM answers WHERE session=? ORDER BY round,created_at").bind(code).all()).results;
    const anonymous = (await db.prepare("SELECT round,answer FROM anonymous_responses WHERE session=? ORDER BY round").bind(code).all()).results;
    const events2 = (await db.prepare("SELECT id,round,player,kind,points,detail,created_at FROM events WHERE session=? ORDER BY created_at").bind(code).all()).results;
    const audits = (await db.prepare("SELECT action,detail,created_at FROM audits WHERE session=? ORDER BY created_at").bind(code).all()).results;
    return { code, title: s.title, players, answers, anonymous, events: events2, audits, survey: s.survey ? JSON.parse(s.survey) : null, settings, activities: JSON.parse(s.activities) };
  }
  if (url.pathname !== "/api/state" || method !== "GET") fail2("NOT_FOUND", 404);
  const host = url.searchParams.get("role") === "host";
  if (host) requireHost();
  const all = (await db.prepare("SELECT id AS uid,name,team,eligible_from,employee_id,approval,language FROM players WHERE session=? ORDER BY joined_at").bind(code).all()).results;
  const settled = (await db.prepare("SELECT player,SUM(points) AS total,SUM(correct) AS correct,SUM(elapsed_ms) AS elapsed FROM answers WHERE session=? AND round>=0 AND (round<? OR (? IN ('results','completed','survey','archived') AND round=?)) GROUP BY player").bind(code, s.current, s.status, s.current).all()).results;
  const events = (await db.prepare("SELECT player,SUM(points) AS total FROM events WHERE session=? GROUP BY player").bind(code).all()).results;
  const totals = Object.fromEntries(all.map((p) => [p.uid, 0])), metrics = {};
  for (const r of settled) {
    totals[r.player] = r.total;
    metrics[r.player] = { correct: r.correct || 0, elapsed: r.elapsed || 0 };
  }
  for (const r of events) totals[r.player] = (totals[r.player] || 0) + r.total;
  const roundAnswers = (await db.prepare("SELECT player,answer,points,correct FROM answers WHERE session=? AND round=?").bind(code, s.current).all()).results;
  const anon = (await db.prepare("SELECT receipt,answer FROM anonymous_responses WHERE session=? AND round=?").bind(code, s.current).all()).results;
  const closed = ["results", "completed", "survey", "archived"].includes(s.status), a = active() ?? null, revealed = closed && (["Meta Plan", "Categorize"].includes(a?.type) ? rt.keyRevealed === true : settings.reveal !== "manual" || rt.keyRevealed) && !(rt.revealAt > now);
  const mine = roundAnswers.find((x) => x.player === player?.id);
  let ownAnon = null;
  if (player && a?.anonymous) {
    const receipt = await hash(s.anonymous_secret + ":poll:" + s.current + ":" + player.id);
    ownAnon = anon.find((x) => x.receipt === receipt);
  }
  const responses = [...roundAnswers, ...anon], tally = a?.options ? a.options.map((_, i) => responses.filter((r) => JSON.parse(r.answer) === i).length) : null;
  const boards = scoreboards(all, totals, settings.tie || "shared", metrics, settings.teamScoring);
  let surveySubmitted = false;
  if (player && s.survey) {
    const survey = JSON.parse(s.survey), receipt = await hash(s.anonymous_secret + ":survey:" + player.id);
    surveySubmitted = !!(survey.anonymous ? await db.prepare("SELECT 1 FROM anonymous_responses WHERE session=? AND round=-1 AND receipt=?").bind(code, receipt).first() : await db.prepare("SELECT 1 FROM answers WHERE session=? AND round=-1 AND player=?").bind(code, player.id).first());
  }
  let pub = publicActivity(a, { closed: revealed, reveal: s.reveal });
  if (pub?.assignments && rt.metaCount) pub.assignments = pub.assignments.map((x, i) => i < rt.metaCount ? x : -1);
  if (["betting", "casting"].includes(rt.phase) && pub) {
    pub = { ...pub, prompt: a.section || a.mainType, options: [], correct: void 0 };
  }
  return { code: s.code, title: s.title, language: s.language, teamMode: !!s.teams, surveyOnly: !!settings.surveyOnly, teamNames: settings.teamNames || ["Lightning", "Wave"], settings: host ? settings : void 0, status: s.status, current: s.current, revision: s.revision, deadline: s.deadline, paused: !!s.paused, remaining: s.remaining, reveal: s.reveal, serverNow: now, queue: deck.map((x, i) => ({ type: x.type, mainType: x.mainType, prompt: host || i < s.current || i === s.current && !["betting", "casting"].includes(rt.phase) ? x.prompt : x.mainType || x.type, timer: x.timer, group: x.group, step: x.step })), activity: pub, players: all.filter((p) => host || p.approval === "approved").map(({ eligible_from, employee_id, ...p }) => host ? { ...p, employeeId: employee_id } : p), ...boards, submitted: responses.length, tally: revealed || a?.type === "Live Poll" && a.liveResults ? tally : null, pollSummary: a?.type === "Live Poll" && (revealed || a.liveResults) ? summarizePoll(a, responses.map((x) => JSON.parse(x.answer))) : null, metaSummary: a?.assignments && (host || rt.analytics) ? a.items.map((_, i) => a.categories.map((_2, j) => roundAnswers.filter((x) => JSON.parse(x.answer)[i] === j).length)) : null, keyRevealed: revealed, runtime: { phase: rt.phase, targets: rt.targets || [], board: !!rt.board, quiet: !!rt.quiet, intensity: rt.intensity || "full", analytics: !!rt.analytics, highlight: rt.highlight, notes: host ? rt.notes : void 0 }, mine: player ? { id: player.id, name: player.name, employeeId: player.employee_id, approval: player.approval, language: player.language, eligible: player.approval === "approved" && player.eligible_from <= s.current && (!rt.targets?.length || rt.targets.includes(player.id)), answered: !!(mine || ownAnon), answer: mine ? JSON.parse(mine.answer) : ownAnon ? JSON.parse(ownAnon.answer) : null, points: revealed && mine ? mine.points : null, correct: revealed && mine ? mine.correct : null } : null, survey: closed && s.survey ? JSON.parse(s.survey) : null, surveySubmitted, surveyOpen: !!rt.surveyOpen, surveyCount: s.survey ? Number((await db.prepare("SELECT (SELECT COUNT(*) FROM answers WHERE session=? AND round=-1)+(SELECT COUNT(*) FROM anonymous_responses WHERE session=? AND round=-1) AS n").bind(code, code).first()).n) : 0, ...await gameSnapshot(db, s, a, rt, player, host, now), ...host ? { owner: s.owner, activities: deck, blueprint: JSON.parse(s.blueprint || s.activities), surveyDefinition: s.survey ? JSON.parse(s.survey) : null, metaAnalytics: a?.assignments ? roundAnswers.map((x) => ({ player: x.player, answer: JSON.parse(x.answer) })) : null } : {} };
}
async function writeSession(db, s, n) {
  return db.prepare("UPDATE sessions SET status=?,current=?,revision=?,started_at=?,deadline=?,paused=?,remaining=?,reveal=?,runtime=? WHERE code=? AND revision=?").bind(n.status, n.current, n.revision, n.started_at ?? null, n.deadline ?? null, n.paused, n.remaining, n.reveal ?? null, n.runtime || s.runtime || "{}", s.code, s.revision).run();
}
function summarizePoll(a, answers) {
  if (a.pollKind === "word") {
    const words = {};
    answers.forEach((x) => {
      const key = String(x).trim().toLowerCase();
      words[key] = (words[key] || 0) + 1;
    });
    return { words };
  }
  if (a.pollKind === "rating") return { average: answers.length ? answers.reduce((x, y) => x + y, 0) / answers.length : 0, count: answers.length };
  if (a.pollKind === "priority") return { ranking: a.options.map((label, i) => ({ label, value: answers.reduce((n, order) => n + a.options.length - order.indexOf(i), 0) })).sort((x, y) => y.value - x.value) };
  return null;
}

// lib/firebase-config.ts
var firebaseConfig = {
  "apiKey": "AIzaSyD6rWwK4hQCvDaMlMIntHurpIEyl10AQQI",
  "authDomain": "mts-quiz-64faa.firebaseapp.com",
  "databaseURL": "https://mts-quiz-64faa-default-rtdb.europe-west1.firebasedatabase.app",
  "projectId": "mts-quiz-64faa"
};

// lib/firebase-verifier.mjs
var decoder = new TextDecoder();
function upstreamUnavailable(stage) {
  const error = new Error("AUTH_NETWORK");
  error.stage = stage;
  return error;
}
function bytes(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw Error("INVALID_TOKEN");
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
}
function createFirebaseVerifier({ fetcher = globalThis.fetch, now = () => Date.now() } = {}) {
  let keys = [], expires = 0;
  async function keyset(force = false) {
    if (!force && keys.length && now() < expires) return keys;
    let r;
    try {
      r = await fetcher("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com", { signal: AbortSignal.timeout(1e4), redirect: "manual" });
    } catch {
      throw upstreamUnavailable("google_keys_fetch");
    }
    if (!r.ok) throw upstreamUnavailable("google_keys_http");
    let body;
    try {
      body = await r.json();
    } catch {
      throw upstreamUnavailable("google_keys_parse");
    }
    if (!Array.isArray(body.keys)) throw upstreamUnavailable("google_keys_format");
    const age = Number(/(?:^|,)\s*max-age=(\d+)/i.exec(r.headers.get("Cache-Control") || "")?.[1] ?? 300);
    keys = body.keys;
    expires = now() + Math.min(age, 86400) * 1e3;
    return keys;
  }
  return async function verify2(token, projectId) {
    if (typeof token !== "string" || token.length > 8192) throw Error("INVALID_TOKEN");
    const parts = token.split(".");
    if (parts.length !== 3) throw Error("INVALID_TOKEN");
    let h, p;
    try {
      h = JSON.parse(decoder.decode(bytes(parts[0])));
      p = JSON.parse(decoder.decode(bytes(parts[1])));
    } catch {
      throw Error("INVALID_TOKEN");
    }
    const seconds = Math.floor(now() / 1e3), timestamp = (n) => Number.isSafeInteger(n) && n >= 0;
    if (h.alg !== "RS256" || typeof h.kid !== "string" || !h.kid || h.kid.length > 256) throw Error("INVALID_TOKEN");
    if (p.aud !== projectId || p.iss !== "https://securetoken.google.com/" + projectId || typeof p.sub !== "string" || !p.sub || p.sub.length > 128 || !timestamp(p.exp) || p.exp <= seconds || !timestamp(p.iat) || p.iat > seconds || !timestamp(p.auth_time) || p.auth_time > seconds || p.auth_time > p.iat || typeof p.email !== "string" || !p.email || p.firebase?.sign_in_provider === "anonymous") throw Error("INVALID_TOKEN");
    let list2 = await keyset(), jwk = list2.find((k) => k.kid === h.kid);
    if (!jwk) {
      list2 = await keyset(true);
      jwk = list2.find((k) => k.kid === h.kid);
    }
    if (!jwk || jwk.kty !== "RSA") throw Error("INVALID_TOKEN");
    let valid = false;
    try {
      const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
      valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, bytes(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
    } catch {
      throw Error("INVALID_TOKEN");
    }
    if (!valid) throw Error("INVALID_TOKEN");
    return { uid: p.sub, email: p.email, name: typeof p.name === "string" ? p.name : p.email, expires: p.exp, arenaRole: ["admin", "senior"].includes(p.arenaRole) ? p.arenaRole : "trainer" };
  };
}
var verify = createFirebaseVerifier();
async function authorizeFirebaseTrainer(req, { projectId = "", databaseURL = "", fetcher = globalThis.fetch, verifier = verify } = {}) {
  const token = req.headers.get("X-Firebase-Token");
  if (!token) throw Error("SIGN_IN");
  const user = await verifier(token, projectId);
  const url = new URL(databaseURL);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".firebasedatabase.app") && !url.hostname.endsWith(".firebaseio.com")) throw Error("FIREBASE_CONFIG");
  url.pathname = "/arenaV1/trainerAllowlist/" + encodeURIComponent(user.uid) + ".json";
  url.searchParams.set("auth", token);
  let response;
  try {
    response = await fetcher(url.toString(), { method: "GET", redirect: "manual", signal: AbortSignal.timeout(1e4), headers: { "Cache-Control": "no-cache" } });
  } catch {
    throw upstreamUnavailable("firebase_allowlist_fetch");
  }
  if (!response.ok) {
    if ([401, 403].includes(response.status)) throw Error("TRAINER_NOT_ALLOWED");
    throw upstreamUnavailable("firebase_allowlist_http");
  }
  let allowed;
  try {
    allowed = await response.json();
  } catch {
    throw upstreamUnavailable("firebase_allowlist_parse");
  }
  if (allowed !== true) throw Error("TRAINER_NOT_ALLOWED");
  return { ...user, owner: "firebase:" + user.uid };
}

// lib/roles.ts
async function trainerProfile(db, user, adminUids = []) {
  const bootstrap = adminUids.includes(user.uid) || user.arenaRole === "admin";
  await db.prepare("INSERT INTO trainer_profiles(uid,email,name,role,enabled,report_owners,updated_at) VALUES(?,?,?,?,1,'[]',?) ON CONFLICT(uid) DO UPDATE SET email=excluded.email,name=excluded.name").bind(user.uid, user.email, user.name, bootstrap ? "admin" : user.arenaRole === "senior" ? "senior" : "trainer", Date.now()).run();
  const row = await db.prepare("SELECT * FROM trainer_profiles WHERE uid=?").bind(user.uid).first();
  if (!row.enabled) throw new ApiError("AUTH_DISABLED", 403);
  if (bootstrap && row.role !== "admin") {
    await db.prepare("UPDATE trainer_profiles SET role='admin' WHERE uid=?").bind(user.uid).run();
    row.role = "admin";
  }
  return { uid: row.uid, role: row.role, reportOwners: JSON.parse(row.report_owners), name: row.name, email: row.email };
}

// lib/trainer-link.ts
async function connectTrainer(db, siteUser, uid) {
  await db.batch([
    db.prepare("INSERT INTO trainer_links(site_user,firebase_uid,created_at) VALUES(?,?,?) ON CONFLICT(site_user) DO NOTHING").bind(siteUser, uid, Date.now()),
    db.prepare("UPDATE sessions SET owner=? WHERE owner=? AND EXISTS(SELECT 1 FROM trainer_links WHERE site_user=? AND firebase_uid=?)").bind("firebase:" + uid, siteUser, siteUser, uid)
  ]);
}

// lib/api-handler.ts
async function handleArenaRequest(req, db, authorize = authorizeFirebaseTrainer, options = {}) {
  try {
    const url = new URL(req.url), path = url.pathname;
    const requestOrigin = req.headers.get("origin");
    if (req.method === "POST" && requestOrigin && ![url.origin, options.allowedOrigin].filter(Boolean).includes(requestOrigin)) return Response.json({ error: "ORIGIN" }, { status: 403 });
    if (db) await checkRate(db, req);
    const needsTrainer = ["/api/me", "/api/connect", "/api/sessions", "/api/control", "/api/drafts", "/api/catalog", "/api/admin", "/api/report"].includes(path) || path === "/api/branding" && req.method === "POST" || path === "/api/state" && url.searchParams.get("role") === "host";
    let trainer = null;
    if (needsTrainer) {
      if (path === "/api/me" && !req.headers.get("X-Firebase-Token")) return Response.json({ authenticated: false, provider: "firebase" }, { headers: { "Cache-Control": "no-store" } });
      try {
        trainer = await authorize(req, { projectId: firebaseConfig.projectId, databaseURL: firebaseConfig.databaseURL });
      } catch (e) {
        const code = e.message || "INVALID_TOKEN";
        if (code === "AUTH_NETWORK" && typeof e.stage === "string") {
          console.warn("Arena trainer authentication upstream unavailable", { stage: e.stage, path });
          return Response.json({ error: "AUTH_NETWORK", stage: e.stage }, { status: 503, headers: { "Cache-Control": "no-store" } });
        }
        throw new ApiError(code, code === "TRAINER_NOT_ALLOWED" ? 403 : ["AUTH_NETWORK", "FIREBASE_CONFIG"].includes(code) ? 503 : 401);
      }
    }
    const profile = trainer && db ? await trainerProfile(db, trainer, options.adminUids) : null;
    if (path === "/api/me" && req.method === "GET") return Response.json({ authenticated: true, provider: "firebase", name: trainer.name, email: trainer.email, uid: trainer.uid, role: profile?.role || "trainer", owner: trainer.owner }, { headers: { "Cache-Control": "no-store" } });
    if (!db) return Response.json({ error: "DATABASE" }, { status: 503 });
    if (path === "/api/connect" && req.method === "POST") {
      const siteUser = req.headers.get("oai-authenticated-user-id");
      if (siteUser) await connectTrainer(db, siteUser, trainer.uid);
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }
    return Response.json(await service(db, req, trainer?.owner || null, { ...profile, provision: options.provision }), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ApiError) return Response.json({ error: e.code }, { status: e.status });
    console.error("Arena request failed", { name: e instanceof Error ? e.name : "Unknown", path: new URL(req.url).pathname });
    return Response.json({ error: "SERVER" }, { status: 500 });
  }
}

// lib/firebase-admin.ts
var enc = new TextEncoder();
var b64 = (bytes2) => btoa(String.fromCharCode(...bytes2)).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
function createProvisioner(raw, fetcher = globalThis.fetch) {
  if (typeof raw !== "string" || !raw.trim()) return void 0;
  let account;
  try {
    account = JSON.parse(raw);
  } catch {
    return void 0;
  }
  if (account.project_id !== firebaseConfig.projectId || typeof account.private_key !== "string" || typeof account.client_email !== "string") return void 0;
  return async (input) => {
    const seconds = Math.floor(Date.now() / 1e3), h = b64(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))), p = b64(enc.encode(JSON.stringify({ iss: account.client_email, scope: "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email", aud: "https://oauth2.googleapis.com/token", iat: seconds, exp: seconds + 3600 }))), signing = h + "." + p;
    const pem = Uint8Array.from(atob(account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "")), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", pem, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]), signature = b64(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(signing))));
    const auth = await fetcher("https://oauth2.googleapis.com/token", { method: "POST", redirect: "manual", signal: AbortSignal.timeout(1e4), headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: signing + "." + signature }) });
    if (!auth.ok) throw new ApiError("ADMIN_SETUP", 503);
    const token = await auth.json();
    if (!token.access_token) throw new ApiError("ADMIN_SETUP", 503);
    const r = await fetcher(`https://identitytoolkit.googleapis.com/v1/projects/${firebaseConfig.projectId}/accounts?key=${firebaseConfig.apiKey}`, { method: "POST", redirect: "manual", signal: AbortSignal.timeout(1e4), headers: { Authorization: "Bearer " + token.access_token, "Content-Type": "application/json" }, body: JSON.stringify({ email: input.email, password: input.password, displayName: input.name }) });
    if (!r.ok) throw new ApiError(r.status === 400 ? "ACCOUNT_EXISTS" : "ADMIN_SETUP", r.status === 400 ? 409 : 503);
    const user = await r.json();
    const allowed = await fetcher(`${firebaseConfig.databaseURL}/arenaV1/trainerAllowlist/${encodeURIComponent(user.localId)}.json`, { method: "PUT", redirect: "manual", signal: AbortSignal.timeout(1e4), headers: { Authorization: "Bearer " + token.access_token, "Content-Type": "application/json" }, body: "true" });
    if (!allowed.ok) throw new ApiError("ACCOUNT_ALLOWLIST_INCOMPLETE", 503);
    return { uid: user.localId };
  };
}

// github-api-worker.ts
var defaultOrigin = "https://hazemshaaban77.github.io";
var allowedMethods = "GET, POST, OPTIONS";
var allowedHeaders = "Content-Type, X-Firebase-Token, X-Player-Token";
var authHealthCache;
async function authHealth(db) {
  if (authHealthCache && authHealthCache.until > Date.now()) return authHealthCache.result;
  const keys = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
  const url = new URL(firebaseConfig.databaseURL);
  url.pathname = "/arenaV1/trainerAllowlist.json";
  url.searchParams.set("shallow", "true");
  const statuses = await Promise.allSettled([
    fetch(keys, { redirect: "manual", signal: AbortSignal.timeout(5e3) }),
    fetch(url.toString(), { redirect: "manual", signal: AbortSignal.timeout(5e3) })
  ]);
  let ready = false;
  if (db) try {
    const record = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'").first();
    ready = record?.name === "sessions";
  } catch {
  }
  const result = {
    googleKeys: statuses[0].status === "fulfilled" && statuses[0].value.ok ? "reachable" : "unavailable",
    // 401/403 without a Firebase token is expected: it proves RTDB is reachable
    // while keeping the trainer allowlist private.
    firebaseDatabase: statuses[1].status === "fulfilled" && [200, 401, 403].includes(statuses[1].value.status) ? "reachable" : "unavailable",
    appDatabase: ready ? "ready" : "unavailable"
  };
  authHealthCache = { until: Date.now() + 6e4, result };
  return result;
}
var github_api_worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowed = (env.ARENA_PUBLIC_ORIGIN || defaultOrigin).replace(/\/$/, "");
    if (origin && origin !== allowed) return Response.json({ error: "ORIGIN" }, { status: 403 });
    const cors = new Headers({
      "Access-Control-Allow-Origin": allowed,
      "Access-Control-Allow-Methods": allowedMethods,
      "Access-Control-Allow-Headers": allowedHeaders,
      "Access-Control-Max-Age": "3600",
      "Vary": "Origin",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    if (request.method === "OPTIONS") {
      if (!origin) return Response.json({ error: "ORIGIN" }, { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }
    if (url.pathname === "/api/auth-health") {
      if (request.method !== "GET") return Response.json({ error: "METHOD" }, { status: 405, headers: cors });
      const result = await authHealth(env.DB);
      return Response.json(result, { status: 200, headers: { ...Object.fromEntries(cors), "Cache-Control": "public, max-age=60" } });
    }
    if (url.pathname === "/api/media-upload") {
      if (request.method !== "POST") return Response.json({ error: "METHOD" }, { status: 405, headers: cors });
      if (!env.MEDIA) return Response.json({ error: "MEDIA_UNAVAILABLE" }, { status: 503, headers: cors });
      if (!env.DB) return Response.json({ error: "DATABASE" }, { status: 503, headers: cors });
      let trainer;
      try {
        trainer = await authorizeFirebaseTrainer(request, { projectId: firebaseConfig.projectId, databaseURL: firebaseConfig.databaseURL });
      } catch {
        return Response.json({ error: "SIGN_IN" }, { status: 401, headers: cors });
      }
      try {
        await checkRate(env.DB, request);
      } catch {
        return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: cors });
      }
      const mime = (request.headers.get("Content-Type") || "").split(";")[0].toLowerCase();
      const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" };
      if (!ext[mime]) return Response.json({ error: "MEDIA" }, { status: 415, headers: cors });
      if (Number(request.headers.get("Content-Length")) > 12e6) return Response.json({ error: "TOO_LARGE" }, { status: 413, headers: cors });
      let data;
      try {
        data = await request.arrayBuffer();
      } catch {
        return Response.json({ error: "MEDIA" }, { status: 400, headers: cors });
      }
      const bytes2 = new Uint8Array(data);
      if (bytes2.length < 12 || bytes2.length > 12e6 || !validMediaSignature(mime, bytes2)) return Response.json({ error: "MEDIA" }, { status: 415, headers: cors });
      const key = "uploads/" + crypto.randomUUID() + "." + ext[mime];
      await env.MEDIA.put(key, data, { httpMetadata: { contentType: mime }, customMetadata: { ownerUid: trainer.uid } });
      return Response.json({ url: url.origin + "/media/" + key.slice("uploads/".length), type: mime.startsWith("image/") ? "image" : "video" }, { status: 201, headers: cors });
    }
    if (url.pathname.startsWith("/media/")) {
      if (request.method !== "GET" || !env.MEDIA) return Response.json({ error: "NOT_FOUND" }, { status: 404, headers: cors });
      const file = url.pathname.slice("/media/".length);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|webp|mp4|webm)$/.test(file)) return Response.json({ error: "NOT_FOUND" }, { status: 404, headers: cors });
      const obj = await env.MEDIA.get("uploads/" + file);
      if (!obj) return Response.json({ error: "NOT_FOUND" }, { status: 404, headers: cors });
      const mime = obj.httpMetadata?.contentType || "application/octet-stream";
      const headers2 = new Headers(cors);
      headers2.set("Content-Type", mime);
      headers2.set("Content-Disposition", "inline");
      headers2.set("Cache-Control", "private, max-age=300");
      return new Response(obj.body, { status: 200, headers: headers2 });
    }
    if (!url.pathname.startsWith("/api/")) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404, headers: cors });
    }
    if (!["GET", "POST"].includes(request.method)) {
      return Response.json({ error: "METHOD" }, { status: 405, headers: cors });
    }
    const response = await handleArenaRequest(request, env.DB, void 0, {
      allowedOrigin: allowed,
      adminUids: env.ARENA_ADMIN_UIDS?.split(",").map((x) => x.trim()).filter(Boolean) || [],
      provision: createProvisioner(env.FIREBASE_SERVICE_ACCOUNT)
    });
    const headers = new Headers(response.headers);
    for (const [k, v] of cors) headers.set(k, v);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
};
function validMediaSignature(mime, b) {
  const ascii = (offset, length) => String.fromCharCode(...b.slice(offset, offset + length));
  switch (mime) {
    case "image/png":
      return b[0] === 137 && ascii(1, 3) === "PNG" && b[4] === 13 && b[5] === 10 && b[6] === 26 && b[7] === 10;
    case "image/jpeg":
      return b[0] === 255 && b[1] === 216 && b[2] === 255;
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP";
    case "video/mp4":
      return ascii(4, 4) === "ftyp";
    case "video/webm":
      return b[0] === 26 && b[1] === 69 && b[2] === 223 && b[3] === 163;
    default:
      return false;
  }
}
export {
  github_api_worker_default as default
};
