// Configuration for the KU detectors exposed by the KU-Detection service.
// Each entry drives one analysis card in the Knowledge Units tab.
import {
    KU_NAMES,
    KU_DESCRIPTIONS,
    normalizeKuId,
    ECLIPSE_KU_IDS,
    ECLIPSE_KU_NAMES,
    ECLIPSE_KU_DESCRIPTIONS,
} from "../../../../utils/kuInfo";

const enc = encodeURIComponent;

export const KU_SOURCES = {
    java: {
        key: "java",
        title: "Java Detected KUs",
        subtitle: "Java SE / EE Knowledge Units (K1–K28) detected in the repository's Java files.",
        // Legacy pipeline: commits must be fetched/stored first, then analyzed.
        usesCommits: true,
        resultsPath: (repoName) => `/analyzedb?repo_name=${enc(repoName)}`,
        orgSkillsPath: () => `/organizationskills`,
        kuRiskPath: (organization) => `/ku_risk?organization=${enc(organization || "")}`,
        employeeRiskPath: (organization) => `/impact_at_loss?organization=${enc(organization || "")}`,
        commitLimit: { default: "30", min: 1, max: null },
        kuNames: KU_NAMES,
        kuDescriptions: KU_DESCRIPTIONS,
        normalizeKu: normalizeKuId,
        kuOrder: null, // sorted numerically (K1, K2, ...)
    },
    eclipse: {
        key: "eclipse",
        title: "Eclipse Detected KUs",
        subtitle: "Eclipse Knowledge Units (MQTT, EMF, Xtext, Eclipse RCP, ...) detected in the repository's commit history.",
        usesCommits: false,
        startPath: (repoName) => `/detector17/analyze/${enc(repoName)}`,
        resultsPath: (repoName) => `/detector17/results/${enc(repoName)}`,
        orgSkillsPath: () => `/detector17/organizationskills`,
        kuRiskPath: (organization) => `/detector17/ku_risk?organization=${enc(organization || "")}`,
        // Impact@Loss per employee (replaces the delta-based /detector17/employee_risk)
        employeeRiskPath: (organization) => `/detector17/impact_at_loss?organization=${enc(organization || "")}`,
        // Backend accepts commit_limit >= 1; empty → full git history
        commitLimit: { default: "", min: 1, max: null },
        kuNames: ECLIPSE_KU_NAMES,
        kuDescriptions: ECLIPSE_KU_DESCRIPTIONS,
        normalizeKu: (ku) => ku,
        kuOrder: ECLIPSE_KU_IDS,
    },
};

export const KU_SOURCE_LIST = [KU_SOURCES.java, KU_SOURCES.eclipse];

// "K8" -> "K8 – Generics and Collections", "EMF" -> "EMF – Eclipse Modeling Framework (EMF)"
export const getKuLabelFor = (config, rawId) => {
    const key = config.normalizeKu(rawId);
    const name = config.kuNames[key];
    if (!name || name === String(rawId)) return String(rawId);
    return `${rawId} \u2013 ${name}`;
};

export const getKuDescriptionFor = (config, rawId) =>
    config.kuDescriptions[config.normalizeKu(rawId)] || "";

// Sort KU ids in the order of the detector's taxonomy (numeric for K1..K28)
export const compareKuIds = (config) => (a, b) => {
    if (config.kuOrder) {
        const ia = config.kuOrder.indexOf(a);
        const ib = config.kuOrder.indexOf(b);
        return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib) || String(a).localeCompare(String(b));
    }
    const numA = parseInt(String(a).replace(/\D/g, ""), 10);
    const numB = parseInt(String(b).replace(/\D/g, ""), 10);
    return (Number.isNaN(numA) ? Infinity : numA) - (Number.isNaN(numB) ? Infinity : numB);
};

// Both detectors share one analysis_status row per repository in the backend,
// so we remember which detector started the run to resume the right card after a refresh.
const runningKey = (repoName) => `kuAnalysisSource:${repoName}`;

export const rememberRunningSource = (repoName, sourceKey) => {
    try { localStorage.setItem(runningKey(repoName), sourceKey); } catch (e) { /* ignore */ }
};

export const getRunningSource = (repoName) => {
    try { return localStorage.getItem(runningKey(repoName)); } catch (e) { return null; }
};

export const clearRunningSource = (repoName) => {
    try { localStorage.removeItem(runningKey(repoName)); } catch (e) { /* ignore */ }
};

// Accept both the documented ({ files: [{ ku_labels }] }) and the actual (array of rows) result shapes.
export const normalizeResults = (data) => {
    if (Array.isArray(data)) {
        return data.filter((r) => r && r.detected_kus);
    }
    if (data && Array.isArray(data.files)) {
        return data.files
            .map((f) => ({ ...f, detected_kus: f.detected_kus || f.ku_labels || {} }))
            .filter((r) => r.detected_kus);
    }
    return [];
};

export const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    return data?.error || data?.message || fallback;
};
