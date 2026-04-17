import { getOrganization } from "../../../../utils/Tokens";

//  Base URL 
export const API_BASE_URL =
  process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/employee-management-backend";

export const getAuthHeaders = async () => {
  const orgName = await getOrganization();
  return {
    Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
    "X-User-Organization": orgName,
  };
};

//  Report URL builders 
const reportsBase = () =>
  process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/employee-management-backend";

export const GET_ORG_DEPT_REPORT_URL = (orgId, deptId, skillId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (deptId   != null) params.append("deptId",     deptId);
  if (skillId  != null) params.append("skillId",    skillId);
  if (startDate != null) params.append("startDate", startDate);
  if (endDate   != null) params.append("endDate",   endDate);
  return `${reportsBase()}/reports/org/${orgId}?${params.toString()}`;
};

export const GET_ORG_DEPT_SKILL_TIMELINE_URL = (orgId, deptId, skillId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (deptId   != null) params.append("departmentId", deptId);
  if (skillId  != null) params.append("skillId",      skillId);
  if (startDate != null) params.append("startDate",   startDate);
  if (endDate   != null) params.append("endDate",     endDate);
  const qs = params.toString();
  return `${reportsBase()}/reports/organizations/${orgId}/skills/timeline${qs ? `?${qs}` : ""}`;
};

export const GET_EMPLOYEE_REPORT_URL = (employeeId, skillId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (skillId   != null) params.append("skillId",   skillId);
  if (startDate != null) params.append("startDate", startDate);
  if (endDate   != null) params.append("endDate",   endDate);
  return `${reportsBase()}/reports/employee/${employeeId}?${params.toString()}`;
};

export const GET_EMPLOYEE_SKILL_TIMELINE_URL = (employeeId, skillId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (skillId   != null) params.append("skillId",   skillId);
  if (startDate != null) params.append("startDate", startDate);
  if (endDate   != null) params.append("endDate",   endDate);
  const qs = params.toString();
  return `${reportsBase()}/reports/employees/${employeeId}/skills/timeline${qs ? `?${qs}` : ""}`;
};

//  Helpers 
export const getDefaultDates = () => {
  const end   = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 2);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate:   end.toISOString().split("T")[0],
  };
};

export const fmtDisplay = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

export const toQuarter = (dateStr) => {
  const date = new Date(dateStr);
  return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
};

//  Chart data transforms 
export const buildOverallPoints = (data) => {
  if (!data?.overallRatings?.length) return [];
  return data.overallRatings
    .filter((p) => p?.periodStart)
    .map((p) => {
      const date = new Date(p.periodStart);
      if (isNaN(date.getTime())) return null;
      return {
        quarter:          toQuarter(p.periodStart),
        dateValue:        date.getTime(),
        avgOverallRating: p.avgOverallRating || p.overallRating || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.dateValue - b.dateValue);
};

export const buildPerfPoints = (data) => {
  const skill = data?.skills?.[0];
  if (!skill?.periods?.length) return [];
  return skill.periods
    .map((p) => {
      const date = new Date(p.periodStart);
      return {
        quarter:    toQuarter(p.periodStart),
        dateValue:  date.getTime(),
        avgRating:  p.avgRating  || 0,
        minRating:  p.minRating  || 0,
        maxRating:  p.maxRating  || 0,
      };
    })
    .sort((a, b) => {
      const [qA, yA] = a.quarter.split(" ");
      const [qB, yB] = b.quarter.split(" ");
      if (yA !== yB) return parseInt(yA) - parseInt(yB);
      return parseInt(qA[1]) - parseInt(qB[1]);
    });
};

export const buildSkillTimelinePoints = (data, skillId) => {
  const skill = data?.skills?.find((s) => s.skillId === parseInt(skillId));
  if (!skill?.timeline?.length) return [];
  return skill.timeline
    .map((pt) => {
      const date = new Date(pt.date);
      return {
        date:      date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        dateValue: date.getTime(),
        rating:    pt.rating || pt.avgRating || 0,
      };
    })
    .sort((a, b) => a.dateValue - b.dateValue);
};

//  Tab / view constants 
export const TAB_TABLE  = "1";
export const TAB_CHARTS = "2";
export const VIEW_ORG   = "organization";
export const VIEW_EMP   = "employee";




export const GET_PERFORMANCE_REVIEWS_URL = (organizationId) => 
  `${API_BASE_URL}/performance-reviews/organization/${organizationId}`;

export const DELETE_PERFORMANCE_REVIEW_URL = (reviewId) => 
  `${API_BASE_URL}/performance-reviews/${reviewId}`;

// --- Date Helper (Matches your table style) ---
export const fmtTableDate = (dateInput) => {
  if (!dateInput) return "—";
  // Handle backend array format [YYYY, M, D] or string format
  if (Array.isArray(dateInput)) {
    const [y, m, d] = dateInput;
    return new Date(y, m - 1, d).toLocaleDateString("en-GB");
  }
  return new Date(dateInput).toLocaleDateString("en-GB");
};
