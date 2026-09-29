// Small shared helpers for the Candidates / Hire tabs.

export const statusClass = (status) => {
    const s = String(status || "").trim().toLowerCase();
    return s ? `cand-status--${s}` : "";
};

// score 0–100 → pill variant
export const scoreVariant = (value) => {
    const v = Number(value);
    if (value === "" || value === null || value === undefined || !Number.isFinite(v)) return "none";
    if (v < 25) return "low";
    if (v < 50) return "mid";
    if (v < 75) return "good";
    return "high";
};

// same thresholds, as a colour (for the score bars)
export const scoreColor = (value) =>
    ({ none: "#d9d9d9", low: "#ef8157", mid: "#f5a462", good: "#fbc658", high: "#6bd098" }[scoreVariant(value)]);

export const initials = (name = "") =>
    String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0] || "")
        .join("") || "?";
