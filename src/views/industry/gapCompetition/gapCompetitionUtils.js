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
// analysis_results.common / only_in_ad / only_in_sector all share the same
// shape: a set of parallel dictionaries keyed by a stringified index, e.g.
// { skill: {"0": "Java", ...}, my_ad_prob: {"0": 0.03, ...}, ... }
// (the label dictionary is called "skill" for a skill-level analysis and
// "job" for an occupation-level one). This flattens one of those sections
// into a plain array of row objects, keeping every numeric field it finds.
export const indexedSectionToArray = (section) => {
  if (!section) return [];
  const labelKey = section.skill ? "skill" : section.job ? "job" : null;
  if (!labelKey) return [];

  const labels = section[labelKey] || {};
  const fieldKeys = Object.keys(section).filter((k) => k !== labelKey);

  return Object.keys(labels).map((idx) => {
    const row = { key: idx, label: labels[idx] };
    fieldKeys.forEach((field) => {
      row[field] = section[field] ? section[field][idx] : undefined;
    });
    return row;
  });
};

export const sectionItemType = (section) => {
  if (!section) return "Item";
  if (section.job) return "Occupation";
  return "Skill";
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
