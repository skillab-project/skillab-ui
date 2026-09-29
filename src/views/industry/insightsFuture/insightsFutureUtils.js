// Long-term (EMERGE) analysis helpers for the "Insights on Future" view.
// Shared bits (formatting, labels, recommendation parsing, polling) live in
// ../futureNeeds so both views behave the same way.

// Fuzzy emergence categories, from earliest to most mature.
export const CATEGORIES = [
  {
    key: "speculative",
    label: "Speculative",
    color: "#9a9a9a",
    badge: "secondary",
    help: "Weak, early signals. Keep monitoring before committing budget.",
  },
  {
    key: "niche",
    label: "Niche",
    color: "#51bcda",
    badge: "info",
    help: "Specialised demand concentrated in a narrow set of roles.",
  },
  {
    key: "emerging",
    label: "Emerging",
    color: "#fbc658",
    badge: "warning",
    help: "Growing demand. Prepare actively with pilots and pipelines.",
  },
  {
    key: "breakthrough",
    label: "Breakthrough",
    color: "#6bd098",
    badge: "success",
    help: "Strong, fast-spreading demand. Act now.",
  },
];

export const categoryInfo = (key) =>
  CATEGORIES.find((c) => c.key === String(key || "").toLowerCase()) || {
    key,
    label: key || "—",
    color: "#c0c0c0",
    badge: "light",
    help: "",
  };

export const SIGNAL_LABELS = {
  posting_density: "Posting density",
  recency_intensity: "Recency intensity",
  yoy_growth_rate: "Year-over-year growth",
  occupation_breadth: "Occupation breadth",
  geo_spread: "Geographic spread",
  cross_sector_adoption: "Cross-sector adoption",
};

export const LONG_TERM_DIMENSIONS = [
  { key: "strategic_workforce_planning", label: "Strategic Workforce Planning", color: "#51cbce" },
  { key: "partnerships_and_pipeline", label: "Partnerships & Pipeline", color: "#6bd098" },
  { key: "regulatory_and_compliance", label: "Regulatory & Compliance", color: "#fbc658" },
];

// Explanations for the headline EMERGE metrics (used as tooltips).
export const METRIC_HELP = {
  emergence_quotient: "Emergence Quotient (0–100): overall emergence score.",
  theta: "Theta (0–1): latent maturity estimated by the IRT model.",
  confidence: "Confidence (0–1) of the estimate.",
  time_to_emergence: "Estimated years until mainstream labour-market adoption, with its confidence interval.",
};

export const entitiesAnalysed = (summary, fallback) =>
  summary?.total_entities_analyzed ?? summary?.total_occupations_analyzed ?? summary?.total_skills_analyzed ?? fallback;
