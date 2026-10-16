import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { getOrganization } from "../../../utils/Tokens";

//  Base URLs 
export const GAP_BASE_URL = process.env.REACT_APP_API_URL_GAP_WITH_COMPETITION;
export const EMPLOYEE_MGMT_BASE_URL = process.env.REACT_APP_API_URL_EMPLOYEE_MANAGEMENT;

//  Auth headers 
// The gap-competition endpoints sit behind the user-management gateway: the
// gateway reads the caller's organization straight from the bearer token and
// injects it downstream, so the frontend only has to attach the token.
export const getGapAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
});

//  Background analyses
// /gap-analysis and /workforce-gap-recommendation run in the background on the
// server: they answer 202 { status: "running", message } while the analysis
// runs and 200 with the result once it is done. Sending the same request again
// never starts a second analysis, so we simply repeat it until we get a 200.
export const GAP_POLL_INTERVAL_MS = 5000;
export const GAP_POLL_TIMEOUT_MS = 30 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useBackgroundAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  // Each run gets an id; a newer run or unmounting cancels the older loop.
  const runIdRef = useRef(0);

  useEffect(() => () => {
    runIdRef.current += 1;
  }, []);

  const run = useCallback(async (url, body, fallbackError) => {
    const runId = ++runIdRef.current;
    const isCurrent = () => runId === runIdRef.current;
    const deadline = Date.now() + GAP_POLL_TIMEOUT_MS;

    setLoading(true);
    setError("");
    setPendingMessage("");
    setResult(null);
    try {
      for (;;) {
        const res = await axios.post(url, body, { headers: getGapAuthHeaders() });
        if (!isCurrent()) return;
        if (res.status !== 202) {
          setResult(res.data);
          return;
        }
        setPendingMessage(res.data?.message || "The analysis is running in the background…");
        if (Date.now() > deadline) {
          setError("The analysis is still running. Please try again in a few minutes.");
          return;
        }
        await sleep(GAP_POLL_INTERVAL_MS);
        if (!isCurrent()) return;
      }
    } catch (err) {
      if (!isCurrent()) return;
      console.error(`${url} failed:`, err);
      setError(err.response?.data?.message || fallbackError);
    } finally {
      if (isCurrent()) {
        setLoading(false);
        setPendingMessage("");
      }
    }
  }, []);

  return { loading, pendingMessage, error, setError, result, run };
};

// The employee-management endpoints (used here just to resolve departments)
// expect the organization name explicitly, matching the rest of the app.
export const getEmployeeMgmtAuthHeaders = async () => {
  const orgName = await getOrganization();
  return {
    Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
    "X-User-Organization": orgName,
  };
};

//  Departments for the logged-in user's organization 
export const fetchOrganizationAndDepartments = async () => {
  const headers = await getEmployeeMgmtAuthHeaders();
  const orgName = await getOrganization();

  const orgRes = await axios.get(`${EMPLOYEE_MGMT_BASE_URL}/organizations`, { headers });
  const organization = (orgRes.data || []).find((org) => org.name === orgName);

  if (!organization) {
    return { organizationId: null, organizationName: orgName, departments: [] };
  }

  const deptRes = await axios.get(
    `${EMPLOYEE_MGMT_BASE_URL}/organizations/${organization.id}/departments`,
    { headers }
  );
  const depts = deptRes.data?.content || deptRes.data || [];

  return {
    organizationId: organization.id,
    organizationName: orgName,
    departments: Array.isArray(depts) ? depts : [],
  };
};

//  Shared formatting helpers 
export const formatPercent = (value, digits = 2) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : `${(Number(value) * 100).toFixed(digits)}%`;

export const formatRatio = (value, digits = 0) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : `${(Number(value) * 100).toFixed(digits)}%`;

//  gap-analysis response shaping 
// analysis_results.common / only_in_* all share the same shape: a set of
// parallel dictionaries keyed by a stringified index. The two analysis types
// use different names, though:
//   skill: { skill: {"0": "Java"}, my_ad_prob: {...}, sector_prob: {...}, difference }
//          sections: common / only_in_ad / only_in_sector
//   job:   { occupation: {"0": "marketing manager"}, company_count: {...},
//            competition_count: {...}, difference }
//          sections: common / only_in_company / only_in_competition
// Everything is normalised to the skill naming (label, my_ad_prob,
// sector_prob, difference) so the tab can render both the same way.
const LABEL_KEYS = ["skill", "occupation", "job"];
const FIELD_ALIASES = {
  company_count: "my_ad_prob",
  company_prob: "my_ad_prob",
  competition_count: "sector_prob",
  competition_prob: "sector_prob",
};

const sectionLabelKey = (section) => (section ? LABEL_KEYS.find((k) => section[k]) || null : null);

export const indexedSectionToArray = (section) => {
  const labelKey = sectionLabelKey(section);
  if (!labelKey) return [];

  const labels = section[labelKey] || {};
  const fieldKeys = Object.keys(section).filter((k) => k !== labelKey);

  return Object.keys(labels).map((idx) => {
    const row = { key: idx, label: labels[idx] };
    fieldKeys.forEach((field) => {
      const target = FIELD_ALIASES[field] || field;
      row[target] = section[field] ? section[field][idx] : undefined;
    });
    return row;
  });
};

// Picks the three sections regardless of which naming the response uses.
export const getGapSections = (analysisResults) => {
  const r = analysisResults || {};
  return {
    common: r.common,
    onlyInAd: r.only_in_ad || r.only_in_company,
    onlyInSector: r.only_in_sector || r.only_in_competition,
  };
};

export const sectionItemType = (...sections) => {
  for (const section of sections) {
    const key = sectionLabelKey(section);
    if (key === "skill") return "Skill";
    if (key === "occupation" || key === "job") return "Occupation";
  }
  return null;
};

//  Colors (reused from the app's own brand palette for consistency) 
export const GAP_COLORS = {
  company: "#2d3e75", // brand-info
  sector: "#ef8157", // brand-danger
  difference: "rgba(102, 97, 91, 0.45)", // brand-default, translucent
  differencePositive: "#6bd098", // brand-success
  differenceNegative: "#ef8157", // brand-danger
  gap: "#ef8157",
  market: "#2d3e75",
};
