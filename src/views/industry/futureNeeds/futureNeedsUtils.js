import axios from "axios";

//  Base URL 
export const ORG_NEEDS_BASE_URL = process.env.REACT_APP_API_URL_ORGANIZATION_NEEDS;

// The analysis is computed asynchronously. The first request for a new
// analysis answers { status: "started" }, and every following request answers
// { status: "in_progress" } until the finished payload comes back, so the UI
// keeps calling the same endpoint every POLL_INTERVAL_MS.
export const POLL_INTERVAL_MS = 10000;
export const MAX_POLL_ATTEMPTS = 180; // ~30 minutes

export const ANALYSIS_KINDS = {
  skills: { key: "skills", entitiesKey: "skills", singular: "Skill", plural: "Skills" },
  occupations: { key: "occupations", entitiesKey: "occupations", singular: "Occupation", plural: "Occupations" },
};

// The service sits behind the user-management gateway, which reads the
// caller's organization from the bearer token and forwards it as a header,
// so the UI only has to attach the token (no organization parameter).
export const getOrgNeedsAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
});

// path: e.g. "shorttermanalysis/skills" or "longtermanalysis/occupations"
// rerun: true discards the stored result and computes the analysis again
// (send it only on the first request; poll without it afterwards).
export const fetchOrgNeedsAnalysis = (path, topN, signal, rerun = false) =>
  axios.get(`${ORG_NEEDS_BASE_URL}/${path}`, {
    params: rerun ? { top_n: topN, rerun: true } : { top_n: topN },
    headers: getOrgNeedsAuthHeaders(),
    signal,
  });

export const fetchShortTermAnalysis = (kind, topN, signal) =>
  fetchOrgNeedsAnalysis(`shorttermanalysis/${kind}`, topN, signal);

// "started" | "in_progress" while the backend is still working, else null.
export const pendingStatus = (data) => {
  if (!data || typeof data !== "object") return null;
  const st = String(data.status || "").toLowerCase();
  return st === "started" || st === "in_progress" ? st : null;
};

export const isInProgress = (data) => pendingStatus(data) !== null;

//  Formatting 
const isNum = (v) => v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v));

// toFixed without trailing zeros: 47.970 → "47.97", 1.000 → "1", 100 → "100"
const trimFixed = (v, digits) => {
  const s = Number(v).toFixed(digits);
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
};

export const fmtNum = (v, digits = 2) => (isNum(v) ? trimFixed(v, digits) : "—");

// Values that already come as percentages (e.g. 47.973 → "47.97%").
export const fmtPct = (v, digits = 2) => (isNum(v) ? `${trimFixed(v, digits)}%` : "—");

export const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};

//  Labels 
// Sector-level occupations currently come back with the ESCO / ISCO URI as
// their label. These helpers detect that and produce a readable fallback.
export const isUri = (s) => typeof s === "string" && /^https?:\/\//i.test(s.trim());

export const shortLabelFromUri = (uri) => {
  if (!isUri(uri)) return (uri || "").trim();
  const parts = uri.trim().replace(/\/+$/, "").split("/");
  const last = parts[parts.length - 1];
  if (/\/isco\//i.test(uri)) return `ISCO group ${last.replace(/^C/i, "")}`;
  return `ESCO ${parts[parts.length - 2] || "item"} ${last.slice(0, 8)}…`;
};

// Best-effort lookup of human-readable labels for ESCO URIs through the
// SKILLAB Tracker. Anything it cannot resolve simply keeps its fallback.
export const resolveTrackerLabels = async (uris, kind) => {
  const unique = [...new Set((uris || []).filter(isUri).map((u) => u.trim()))];
  if (!unique.length || !process.env.REACT_APP_API_URL_TRACKER) return {};
  const endpoint = kind === "skills" ? "skills" : "occupations";
  try {
    const body = new URLSearchParams();
    unique.forEach((u) => body.append("ids", u));
    const res = await axios.post(`${process.env.REACT_APP_API_URL_TRACKER}/api/${endpoint}`, body, {
      params: { page: "1" },
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`,
      },
    });
    const map = {};
    (res.data?.items || []).forEach((item) => {
      if (item?.id && item?.label && unique.includes(item.id)) map[item.id] = item.label;
    });
    return map;
  } catch (err) {
    console.warn("Could not resolve labels from the tracker:", err);
    return {};
  }
};

//  Tiers 
export const TIERS = {
  high: { label: "High", badge: "success", color: "#6bd098" },
  medium: { label: "Medium", badge: "warning", color: "#fbc658" },
  low: { label: "Low", badge: "secondary", color: "#9a9a9a" },
};

export const tierInfo = (tier) =>
  TIERS[String(tier || "").toLowerCase()] || { label: tier || "—", badge: "light", color: "#c0c0c0" };

//  Metrics (with short explanations used as tooltips) 
export const METRICS = [
  { key: "composite_potential_score", label: "Potential Score", fmt: (v) => fmtNum(v, 2), help: "Composite score (0–1) combining growth, penetration and emergence signals." },
  { key: "forecast_cagr_pct", label: "Forecast CAGR", fmt: (v) => fmtPct(v, 1), help: "Compound annual growth rate expected over the forecast horizon." },
  { key: "historical_cagr_pct", label: "Historical CAGR", fmt: (v) => fmtPct(v, 1), help: "Compound annual growth rate over the historical window." },
  { key: "market_penetration_rate_pct", label: "Market Penetration", fmt: (v) => fmtPct(v, 1), help: "Share of the analysed job postings that mention it." },
  { key: "emergence_index", label: "Emergence Index", fmt: (v) => fmtNum(v, 3), help: "Recent demand relative to the historical baseline (1.0 = strong recent acceleration)." },
  { key: "demand_velocity_pct", label: "Demand Velocity", fmt: (v) => fmtPct(v, 1), help: "Recent change in demand momentum." },
  { key: "demand_volatility", label: "Volatility", fmt: (v) => fmtNum(v, 2), help: "Demand volatility; values above 1.0 mean an uncertain forecast." },
  { key: "relative_growth_index", label: "Relative Growth", fmt: (v) => (isNum(v) ? `${fmtNum(v, 2)}×` : "—"), help: "Growth relative to the sector average." },
];

//  Recommendations 
export const DIMENSIONS = [
  { key: "talent_acquisition", label: "Talent Acquisition", color: "#51cbce" },
  { key: "training_and_development", label: "Training & Development", color: "#6bd098" },
  { key: "compensation_and_retention", label: "Compensation & Retention", color: "#fbc658" },
];

const TEXT_KEYS = ["text", "advice", "recommendation", "strategy", "description", "summary", "content", "action", "value"];
const NOTE_KEYS = ["rationale", "volatility_acknowledgement", "note", "notes"];
const TAG_KEYS = ["metrics", "metric_references", "references"];

export const titleCase = (s) =>
  String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const dimensionInfo = (key, dimensions = DIMENSIONS) =>
  dimensions.find((d) => d.key === key) || { key, label: titleCase(key), color: "#51bcda" };

// Extra short fields next to a recommendation (e.g. emergence_category:
// "SPECULATIVE", job_market_signal_values: ["0.2778"]) are shown as tags.
const toTags = (key, value) => {
  const vals = (Array.isArray(value) ? value : [value]).filter(
    (v) => v !== null && v !== undefined && typeof v !== "object" && String(v).trim()
  );
  if (!vals.length) return [];
  if (TAG_KEYS.includes(key)) return vals.map(String);
  return [`${titleCase(key)}: ${vals.join(", ")}`];
};

// The recommendation payload is generated by an LLM and its shape varies from
// entity to entity. Seen so far:
//   { talent_acquisition: "...", training_and_development: "...", ... }
//   { recommendations: [{ dimension, text|advice|recommendation|strategy|description|content|action|value, metrics?, rationale? }] }
//   { recommendations: [{ talent_acquisition: "...", ... }] }
//   { recommendations: [{ strategic_workforce_planning: "...", emergence_category: "X", job_market_signal_values: [...] }] }
// This flattens all of them into [{ dimension, text, notes: [], tags: [] }].
// `dimensions` lists the expected dimension keys (used for ordering and to
// tell recommendation text apart from extra metadata fields).
export const normalizeRecommendations = (rec, dimensions = DIMENSIONS) => {
  const out = [];
  const known = dimensions.map((d) => d.key);

  const push = (dimension, text, notes = [], tags = []) => {
    if (typeof text !== "string" || !text.trim()) return;
    out.push({ dimension, text: text.trim(), notes, tags });
  };

  const fromItem = (item) => {
    if (!item) return;
    if (typeof item === "string") {
      push("general", item);
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(fromItem);
      return;
    }
    if (typeof item !== "object") return;

    if (item.dimension) {
      const textKey = TEXT_KEYS.find((k) => typeof item[k] === "string" && item[k].trim());
      const text =
        (textKey && item[textKey]) ||
        Object.entries(item).find(([k, v]) => k !== "dimension" && typeof v === "string" && v.length > 40)?.[1];
      const notes = NOTE_KEYS.map((k) => item[k]).filter((v) => typeof v === "string" && v.trim());
      const tags = Object.entries(item)
        .filter(([k]) => k !== "dimension" && k !== textKey && !NOTE_KEYS.includes(k))
        .filter(([, v]) => !(typeof v === "string" && v === text))
        .flatMap(([k, v]) => toTags(k, v));
      push(item.dimension, text, notes, tags);
      return;
    }

    if (item.recommendations) {
      fromItem(item.recommendations);
      return;
    }

    // Flat { dimension_key: "text", ...extra fields } object
    const entries = Object.entries(item);
    const isRecText = ([k, v]) =>
      typeof v === "string" && !NOTE_KEYS.includes(k) && (known.includes(k) || v.trim().length > 60);
    const recEntries = entries.filter(isRecText);
    const rest = entries.filter((e) => !isRecText(e));
    const notes = rest.filter(([k, v]) => NOTE_KEYS.includes(k) && typeof v === "string" && v.trim()).map(([, v]) => v);
    const tags = rest.filter(([k, v]) => !NOTE_KEYS.includes(k) && !(Array.isArray(v) && v.some((x) => x && typeof x === "object"))).flatMap(([k, v]) => toTags(k, v));
    recEntries.forEach(([k, v]) => push(k, v, notes, tags));
    rest.filter(([, v]) => Array.isArray(v) && v.some((x) => x && typeof x === "object")).forEach(([, v]) => fromItem(v));
  };

  fromItem(rec);

  const order = (d) => {
    const i = known.indexOf(d);
    return i === -1 ? known.length : i;
  };
  return out.sort((a, b) => order(a.dimension) - order(b.dimension));
};

//  Time series 
// Merges historical counts and forecast values into one array for recharts.
// The last historical point is duplicated into the forecast series so the
// two lines (and the confidence bands) join up visually.
export const buildSeries = (timeSeries) => {
  const hist = timeSeries?.historical || [];
  const fc = timeSeries?.forecast || [];
  const rows = hist.map((h) => ({ quarter: h.quarter, actual: h.count }));

  if (rows.length && fc.length) {
    const last = rows[rows.length - 1];
    last.forecast = last.actual;
    last.ci95 = [last.actual, last.actual];
    last.ci80 = [last.actual, last.actual];
  }

  fc.forEach((f) => {
    rows.push({
      quarter: f.quarter,
      forecast: f.value,
      ci95: [f.ci_lower_95 ?? f.value, f.ci_upper_95 ?? f.value],
      ci80: [f.ci_lower_80 ?? f.value, f.ci_upper_80 ?? f.value],
    });
  });

  return { rows, firstForecastQuarter: fc[0]?.quarter || null };
};

export const sumForecast = (timeSeries) =>
  (timeSeries?.forecast || []).reduce((acc, f) => acc + (Number(f.value) || 0), 0);

export const sumHistorical = (timeSeries) =>
  (timeSeries?.historical || []).reduce((acc, h) => acc + (Number(h.count) || 0), 0);
