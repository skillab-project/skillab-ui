import React, { useCallback, useEffect, useRef, useState } from "react";
import { Row, Col, Nav, NavItem, NavLink } from "reactstrap";
import classnames from "classnames";
import { getOrganization } from "utils/Tokens";
import GenerateTab from "./advertisements/AutoJobAds/GenerateTab";
import HistoryTab from "./advertisements/AutoJobAds/HistoryTab";

const API_BASE = process.env.REACT_APP_API_URL_AUTO_JOB_ADS;

const POLL_INTERVAL_MS = 3000;

const DONE_STATUSES = ["success", "completed", "done", "finished"];
const FAIL_STATUSES = ["failed", "error", "cancelled", "canceled"];

const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
});

// Map the backend status string to one of our three UI states.
const normalizeStatus = (raw) => {
    const s = String(raw || "").toLowerCase();
    if (DONE_STATUSES.includes(s)) return "success";
    if (FAIL_STATUSES.includes(s)) return "error";
    return "pending"; // pending / running / queued / …
};

// Turn a backend job record into the entry shape the UI works with.
const recordToEntry = (record) => {
    const ex = record.result?.structured_export || {};
    return {
        jobId: record.job_id,
        status: normalizeStatus(record.status),
        statusText: String(record.status || "").toLowerCase(),
        title: ex.title || record.title || "Job advertisement",
        location: ex.location || record.location || "",
        savedAt: record.created_at || record.updated_at || new Date().toISOString(),
        result: record.result || null,
        error: record.error || null,
    };
};

const styles = {
    root: { paddingBottom: 20 },
    navDot: {
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#f59e0b",
        marginLeft: 6,
        verticalAlign: "middle",
    },
};

/* ============================ Main component =========================== */
function AutoJobAdvertisements() {
    const [activeTab, setActiveTab] = useState("generate");

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [previewId, setPreviewId] = useState(null);     // shown in the Recommendations tab preview

    // history — hydrated from the backend, plus any in-session pending jobs
    const [org, setOrg] = useState("");
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const orgRef = useRef("");
    const pollersRef = useRef({});   // jobId -> timeout id (active pollers)
    const mountedRef = useRef(true);

    const updateEntry = useCallback((jobId, patch) => {
        setHistory((prev) => prev.map((h) => (h.jobId === jobId ? { ...h, ...patch } : h)));
    }, []);

    // ---- background poller (keeps a pending job's entry up to date) ----
    const startPoll = useCallback((jobId) => {
        if (!jobId || pollersRef.current[jobId]) return; // already polling
        const tick = async () => {
            if (!mountedRef.current) return;
            try {
                const r = await fetch(`${API_BASE}/jobs/${jobId}`, {
                    headers: authHeaders(),
                    cache: "no-store",
                });
                if (!r.ok) throw new Error(`Status request failed (${r.status})`);
                const data = await r.json();
                const uiStatus = normalizeStatus(data.status);
                const ex = data.result?.structured_export || {};

                if (uiStatus === "success" || uiStatus === "error") {
                    updateEntry(jobId, {
                        status: uiStatus,
                        statusText: String(data.status || "").toLowerCase(),
                        result: data.result || null,
                        error: data.error || null,
                        ...(ex.title ? { title: ex.title } : {}),
                        ...(ex.location ? { location: ex.location } : {}),
                    });
                    delete pollersRef.current[jobId];
                    return;
                }
                // still working — keep going
                updateEntry(jobId, { statusText: String(data.status || "processing").toLowerCase() });
                pollersRef.current[jobId] = setTimeout(tick, POLL_INTERVAL_MS);
            } catch (e) {
                // transient network/server hiccup: don't give up, just retry
                updateEntry(jobId, { statusText: "retrying…" });
                pollersRef.current[jobId] = setTimeout(tick, POLL_INTERVAL_MS);
            }
        };
        pollersRef.current[jobId] = setTimeout(tick, 0);
    }, [updateEntry]);

    // ---- fetch the org's persisted recommendations from the backend ----
    const refreshHistory = useCallback(async (organization) => {
        const o = organization ?? orgRef.current;
        if (!o) { setHistory((prev) => prev.filter((h) => h.status === "pending")); return; }
        setLoadingHistory(true);
        try {
            const r = await fetch(`${API_BASE}/jobs?organization=${encodeURIComponent(o)}`, {
                headers: authHeaders(),
                cache: "no-store",
            });
            if (!r.ok) throw new Error(`List request failed (${r.status})`);
            const data = await r.json();
            const ids = Array.isArray(data.job_ids) ? data.job_ids : [];

            const records = await Promise.all(ids.map(async (id) => {
                try {
                    const rr = await fetch(`${API_BASE}/jobs/${id}`, { headers: authHeaders(), cache: "no-store" });
                    if (!rr.ok) return null;
                    return await rr.json();
                } catch { return null; }
            }));
            if (!mountedRef.current) return;

            const entries = records.filter(Boolean).map(recordToEntry);
            setHistory((prev) => {
                // keep in-session pending jobs the server hasn't persisted yet
                const stillPending = prev.filter(
                    (h) => h.status === "pending" && !entries.some((e) => e.jobId === h.jobId)
                );
                const merged = [...stillPending, ...entries];
                merged.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
                return merged;
            });
        } catch {
            // leave the current list in place on failure
        } finally {
            if (mountedRef.current) setLoadingHistory(false);
        }
    }, []);

    // load org, then pull history from the backend
    useEffect(() => {
        mountedRef.current = true;
        (async () => {
            let o = "";
            try { o = (await getOrganization()) || ""; } catch { o = ""; }
            if (!mountedRef.current) return;
            orgRef.current = o;
            setOrg(o);
            refreshHistory(o);
        })();

        const pollers = pollersRef.current;
        return () => {
            mountedRef.current = false;
            Object.values(pollers).forEach((t) => clearTimeout(t));
        };
    }, [refreshHistory]);

    const handleGenerate = useCallback(async (payload) => {
        setSubmitError("");
        setSubmitting(true);
        try {
            const r = await fetch(`${API_BASE}/jobs/job-ad`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });
            if (!r.ok) throw new Error(`Create request failed (${r.status})`);
            const data = await r.json();
            const id = data.job_id;
            if (!id) throw new Error("No job_id returned by the service.");

            // add an in-session pending entry (not yet persisted server-side)
            const entry = {
                jobId: id,
                status: "pending",
                statusText: "queued",
                savedAt: new Date().toISOString(),
                title: payload.job_role,
                location: payload.location,
                result: null,
                error: null,
            };
            setHistory((prev) => [entry, ...prev.filter((h) => h.jobId !== id)]);
            setPreviewId(id);
            setActiveTab("history"); // move the user to the Recommendations tab to wait
            startPoll(id);
        } catch (err) {
            setSubmitError(err.message || "Failed to create the job.");
        } finally {
            setSubmitting(false);
        }
    }, [startPoll]);

    const selectEntry = useCallback((entry) => {
        setPreviewId(entry.jobId);
        if (entry.status === "pending") startPoll(entry.jobId); // make sure it's tracked
        // stay on the History tab and show it in the Preview card only
    }, [startPoll]);

    const previewEntry = history.find((h) => h.jobId === previewId) || null;
    const pendingCount = history.filter((h) => h.status === "pending").length;

    return (
        <div className="content" style={styles.root}>
            <Row>
                <Col md="12">
                    <Nav tabs style={{ marginBottom: 12 }}>
                        <NavItem style={{ cursor: "pointer" }}>
                            <NavLink
                                className={classnames({ active: activeTab === "generate" })}
                                onClick={() => setActiveTab("generate")}
                            >
                                Generate
                            </NavLink>
                        </NavItem>
                        <NavItem style={{ cursor: "pointer" }}>
                            <NavLink
                                className={classnames({ active: activeTab === "history" })}
                                onClick={() => setActiveTab("history")}
                            >
                                Recommendations{history.length ? ` (${history.length})` : ""}
                                {pendingCount > 0 && (
                                    <span style={styles.navDot} title={`${pendingCount} in progress`} />
                                )}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </Col>
            </Row>

            {activeTab === "generate" ? (
                <GenerateTab
                    submitting={submitting}
                    submitError={submitError}
                    orgName={org}
                    onGenerate={handleGenerate}
                />
            ) : (
                <HistoryTab
                    history={history}
                    org={org}
                    loading={loadingHistory}
                    selectedId={previewId}
                    previewEntry={previewEntry}
                    pendingCount={pendingCount}
                    onSelect={selectEntry}
                    onRefresh={() => refreshHistory()}
                />
            )}
        </div>
    );
}

export default AutoJobAdvertisements;
