import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL_KPI;

const authConfig = (extra = {}) => ({
    ...extra,
    headers: { Authorization: `Bearer ${localStorage.getItem('accessTokenSkillab')}` },
});

/** Best human-readable message from an axios error (Spring puts it in response.data.message). */
export const apiErrorMessage = (error) =>
    error?.response?.data?.message || error?.message || 'Unknown error';

// ---- Policies ---------------------------------------------------------------------------

/** What deleting the policy would remove (KPIs, KPI history, metrics no other policy uses). */
export const getPolicyDeletionPreview = (policyId) =>
    axios.get(`${API_BASE_URL}/policy/${policyId}/deletion-preview`, authConfig()).then(r => r.data);

/** Permanently deletes a policy, its KPIs and their history (+ orphan metrics if requested). */
export const deletePolicy = (policyId, deleteOrphanMetrics = true) =>
    axios.delete(`${API_BASE_URL}/policy/${policyId}`, authConfig({ params: { deleteOrphanMetrics } })).then(r => r.data);

// ---- KPIs -------------------------------------------------------------------------------

export const getDeletedKpis = () =>
    axios.get(`${API_BASE_URL}/kpi/deleted`, authConfig()).then(r => r.data);

/** hard=false moves the KPI to the trash, hard=true removes it and its history permanently. */
export const deleteKpi = (kpiId, hard = false) =>
    axios.delete(`${API_BASE_URL}/kpi/${kpiId}`, authConfig({ params: { hard } })).then(r => r.data);

export const restoreKpi = (kpiId) =>
    axios.post(`${API_BASE_URL}/kpi/${kpiId}/restore`, null, authConfig()).then(r => r.data);

// ---- Metrics (called "indicator" in the backend) -----------------------------------------

export const getDeletedMetrics = () =>
    axios.get(`${API_BASE_URL}/indicator/deleted`, authConfig()).then(r => r.data);

/** KPIs (active and deleted) that use the metric in their equation. */
export const getMetricUsage = (metricId) =>
    axios.get(`${API_BASE_URL}/indicator/${metricId}/usage`, authConfig()).then(r => r.data);

export const deleteMetric = (metricId, hard = false) =>
    axios.delete(`${API_BASE_URL}/indicator/${metricId}`, authConfig({ params: { hard } })).then(r => r.data);

export const restoreMetric = (metricId) =>
    axios.post(`${API_BASE_URL}/indicator/${metricId}/restore`, null, authConfig()).then(r => r.data);
