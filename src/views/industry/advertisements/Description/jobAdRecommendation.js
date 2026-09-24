// Shared helpers for requesting an AI-generated job ad description from the
// same auto-job-ads service used by the "New Job Ad Recommendation" page
// (industry/account/auto-job-advertisements), reused here so a description
// can be generated directly from the Job Ad's Description tab.

export const API_BASE = process.env.REACT_APP_API_URL_AUTO_JOB_ADS;

export const POLL_INTERVAL_MS = 3000;

const DONE_STATUSES = ["success", "completed", "done", "finished"];
const FAIL_STATUSES = ["failed", "error", "cancelled", "canceled"];

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];
export const WORK_MODELS = ["On-site", "Hybrid", "Remote"];
export const SENIORITIES = ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director"];

const DEFAULT_SECTION_ORDER = [
  "Job title",
  "Role summary",
  "Key responsibilities",
  "Required qualifications",
  "Preferred qualifications",
  "Benefits",
  "Call to action",
];

export const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
});

const bearerOnly = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
});

const HIRING_MANAGEMENT_BASE = process.env.REACT_APP_API_URL_HIRING_MANAGEMENT;

// The organization's own previously-created job ads, for use as "past
// advertisements" context (same list the sidebar uses to build its tree).
export const fetchOrgJobAds = async () => {
  const r = await fetch(`${HIRING_MANAGEMENT_BASE}/api/v1/jobAds`, {
    cache: "no-store",
    headers: bearerOnly(),
  });
  if (!r.ok) throw new Error(`Failed to load job ads (${r.status})`);
  const jobs = await r.json();
  return (Array.isArray(jobs) ? jobs : []).map((j) => ({
    id: j.id,
    title: j.jobTitle || j.title || `Job ad #${j.id}`,
    status: j.status || "",
    departmentName: j.departmentName || "",
    occupationName: j.occupationName || "",
  }));
};

// Full details (including the description text) for one job ad.
export const fetchJobAdDescription = async (jobAdId) => {
  const r = await fetch(`${HIRING_MANAGEMENT_BASE}/api/v1/jobAds/details?jobAdId=${jobAdId}`, {
    cache: "no-store",
    headers: bearerOnly(),
  });
  if (!r.ok) throw new Error(`Failed to load job ad #${jobAdId} (${r.status})`);
  const d = await r.json();
  return d?.description || "";
};

export const normalizeJobStatus = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (DONE_STATUSES.includes(s)) return "success";
  if (FAIL_STATUSES.includes(s)) return "error";
  return "pending";
};

// Build the /jobs/job-ad request body from the (trimmed) modal form fields.
export const buildJobAdPayload = (fields) => {
  const payload = {
    company_sector: fields.companySector.trim(),
    job_role: fields.jobRole.trim(),
    company_name: fields.companyName.trim(),
    location: fields.location.trim(),
    employment_type: fields.employmentType,
    seniority: fields.seniority,
    work_model: fields.workModel,
    team_context: fields.teamContext.trim(),
    additional_context: fields.additionalContext.trim(),
    formatting_constraints: {
      language: fields.language,
      tone: fields.tone,
      max_words: Number(fields.maxWords) || 650,
      section_order: DEFAULT_SECTION_ORDER,
      output_format: "plain_text",
    },
    quality_constraints: {
      must_include: fields.mustInclude,
      avoid: fields.avoid,
      min_responsibilities: Number(fields.minResponsibilities) || 0,
      min_requirements: Number(fields.minRequirements) || 0,
      min_benefits: Number(fields.minBenefits) || 0,
    },
  };

  const cleanedPastAds = (fields.pastAds || [])
    .map((p) => ({ title: (p.title || "").trim(), text: (p.text || "").trim(), notes: (p.notes || "").trim() }))
    .filter((p) => p.title || p.text || p.notes);
  if (cleanedPastAds.length) {
    payload.past_advertisements = cleanedPastAds;
  }

  return payload;
};

// Turn the job's structured_export into the plain text that goes into the
// job ad's Description textarea.
export const formatStructuredExportAsText = (result) => {
  const ex = result?.structured_export || {};
  const lines = [];

  if (ex.title) lines.push(ex.title);
  const meta = [ex.employment_type, ex.work_model, ex.seniority, ex.location].filter(Boolean).join(" · ");
  if (meta) lines.push(meta);
  if (ex.title || meta) lines.push("");

  if (ex.summary) {
    lines.push(ex.summary);
    lines.push("");
  }

  const section = (title, items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    lines.push(`${title}:`);
    items.forEach((it) => lines.push(`- ${it}`));
    lines.push("");
  };

  section("Key Responsibilities", ex.responsibilities);
  section("Required Qualifications", ex.required_qualifications);
  section("Preferred Qualifications", ex.preferred_qualifications);
  section("Benefits", ex.benefits);

  if (ex.call_to_action) {
    lines.push(ex.call_to_action);
    lines.push("");
  }

  if (Array.isArray(ex.keywords) && ex.keywords.length > 0) {
    lines.push(`Keywords: ${ex.keywords.join(", ")}`);
  }

  return lines.join("\n").trim();
};
