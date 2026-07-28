import React from "react";
import { Row, Col, Card, CardHeader, CardBody, CardTitle, Spinner, Badge, Button } from "reactstrap";

const bannerBase = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 10,
    fontWeight: 600,
};

const styles = {
    card: { borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    item: {
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 10,
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
    },
    itemActive: { background: "#eef2ff", borderColor: "#a5b4fc" },
    itemTitle: { fontWeight: 700, color: "#111827", fontSize: 14.5 },
    itemSub: { color: "#6b7280", fontSize: 12.5, marginTop: 2 },
    emptyMsg: { color: "#9ca3af", textAlign: "center", padding: "30px 10px", fontSize: 14 },
    resultBox: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "18px 20px",
    },
    resultTitle: { fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 2 },
    resultMeta: { color: "#6b7280", fontSize: 13, marginBottom: 14 },
    blockH6: {
        fontSize: 13,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        color: "#374151",
        margin: "16px 0 6px",
    },
    ul: { paddingLeft: 18, marginBottom: 4 },
    li: { marginBottom: 4, lineHeight: 1.4 },
    keywords: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 },
    keyword: { background: "#f3f4f6", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "#374151" },
};

const banner = {
    pending: { ...bannerBase, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412" },
    success: { ...bannerBase, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46" },
    error: { ...bannerBase, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" },
};

const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const statusBadge = (status) => {
    if (status === "pending") return <Badge color="warning" pill>Generating…</Badge>;
    if (status === "error") return <Badge color="danger" pill>Failed</Badge>;
    return <Badge color="success" pill>Ready</Badge>;
};

/* --------------------------- Result renderer --------------------------- */
function ResultView({ result }) {
    if (!result) return null;

    const ex = result.structured_export || {};
    const Block = ({ title, items }) =>
        Array.isArray(items) && items.length ? (
            <div>
                <h6 style={styles.blockH6}>{title}</h6>
                <ul style={styles.ul}>{items.map((it, i) => <li key={i} style={styles.li}>{it}</li>)}</ul>
            </div>
        ) : null;

    return (
        <div style={styles.resultBox}>
            <div>
                <div style={styles.resultTitle}>{ex.title || "Job Advertisement"}</div>
                <div style={styles.resultMeta}>
                    {[ex.employment_type, ex.work_model, ex.seniority, ex.location]
                        .filter(Boolean).join(" · ")}
                </div>
            </div>

            {result.prompt_summary && (
                <p style={{ fontStyle: "italic", color: "#4b5563", marginTop: 8 }}>
                    {result.prompt_summary}
                </p>
            )}

            {ex.summary && (
                <div>
                    <h6 style={styles.blockH6}>Summary</h6>
                    <p style={{ lineHeight: 1.5 }}>{ex.summary}</p>
                </div>
            )}
            <Block title="Key responsibilities" items={ex.responsibilities} />
            <Block title="Required qualifications" items={ex.required_qualifications} />
            <Block title="Preferred qualifications" items={ex.preferred_qualifications} />
            <Block title="Benefits" items={ex.benefits} />
            {ex.call_to_action && (
                <div>
                    <h6 style={styles.blockH6}>Call to action</h6>
                    <p style={{ lineHeight: 1.5 }}>{ex.call_to_action}</p>
                </div>
            )}
            {Array.isArray(ex.keywords) && ex.keywords.length > 0 && (
                <div>
                    <h6 style={styles.blockH6}>Keywords</h6>
                    <div style={styles.keywords}>
                        {ex.keywords.map((k, i) => <span key={i} style={styles.keyword}>{k}</span>)}
                    </div>
                </div>
            )}
        </div>
    );
}

/* --------------------- Panel for a selected job entry ------------------ */
function EntryPanel({ entry }) {
    if (!entry) {
        return (
            <div style={styles.emptyMsg}>
                Select a recommendation to preview it.
            </div>
        );
    }

    if (entry.status === "pending") {
        return (
            <div style={{ ...banner.pending, flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                <div className="d-flex align-items-center" style={{ gap: 10 }}>
                    <Spinner size="sm" />
                    <span>
                        Still generating… {entry.statusText || "processing"}
                        {entry.jobId ? ` (job ${String(entry.jobId).slice(0, 8)}…)` : ""}
                    </span>
                </div>
                <small style={{ fontWeight: 400 }}>
                    This can take a while. You can leave this page and come back — it will keep
                    running, and you'll find it here to continue tracking.
                </small>
            </div>
        );
    }

    if (entry.status === "error") {
        return (
            <div style={banner.error}>
                <span>⚠ {entry.error || "The job failed to generate a recommendation."}</span>
            </div>
        );
    }

    // success
    return (
        <>
            <div style={{ ...banner.success, marginBottom: 16 }}>
                <span>✓ Recommendation ready</span>
            </div>
            {entry.result ? (
                <ResultView result={entry.result} />
            ) : (
                <div style={styles.emptyMsg}>The job completed but returned no result.</div>
            )}
        </>
    );
}

/* ----------------------------- History tab ----------------------------- */
export default function HistoryTab({
    history, org, loading, selectedId, previewEntry, pendingCount, onSelect, onRefresh,
}) {
    return (
        <Row>
            <Col lg="5" md="12">
                <Card style={styles.card}>
                    <CardHeader className="d-flex justify-content-between align-items-start">
                        <div>
                            <CardTitle tag="h5" className="mb-0">Past recommendations</CardTitle>
                            <small className="text-muted">
                                {org ? `Organization: ${org}` : "No organization"}
                                {pendingCount > 0 ? ` · ${pendingCount} in progress` : ""}
                            </small>
                        </div>
                        <Button size="sm" color="secondary" outline
                            onClick={onRefresh} disabled={loading}>
                            {loading ? <Spinner size="sm" /> : "Refresh"}
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading && history.length === 0 ? (
                            <div style={styles.emptyMsg}><Spinner size="sm" /> Loading…</div>
                        ) : history.length === 0 ? (
                            <div style={styles.emptyMsg}>No recommendations yet.</div>
                        ) : (
                            history.map((h) => (
                                <div
                                    key={h.jobId}
                                    style={{
                                        ...styles.item,
                                        ...(h.jobId === selectedId ? styles.itemActive : {}),
                                    }}
                                    onClick={() => onSelect(h)}
                                >
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div style={styles.itemTitle}>
                                                {h.title}{" "}
                                                {h.status === "pending" && <Spinner size="sm" />}
                                            </div>
                                            <div style={styles.itemSub}>
                                                {[h.location, fmtDate(h.savedAt)].filter(Boolean).join(" · ")}
                                            </div>
                                        </div>
                                        <div className="d-flex flex-column align-items-end" style={{ gap: 6 }}>
                                            {statusBadge(h.status)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardBody>
                </Card>
            </Col>
            <Col lg="7" md="12">
                <Card style={styles.card}>
                    <CardHeader>
                        <CardTitle tag="h5" className="mb-0">Preview</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <EntryPanel entry={previewEntry} />
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}
