import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Input } from "reactstrap";
import { scoreColor } from "./candidateUi";
import './Candidates.css';

const API_BASE = process.env.REACT_APP_API_URL_HIRING_MANAGEMENT;

/** Tiny toast using CSS classes */
function TinyToast({ show, text, type = "info", onHide }) {
    useEffect(() => {
        if (!show) return;
        const t = setTimeout(onHide, 2000);
        return () => clearTimeout(t);
    }, [show, onHide]);

    if (!show) return null;
    const variantClass =
        type === "success"
            ? "tiny-toast tiny-toast--success"
            : type === "warning"
                ? "tiny-toast tiny-toast--warning"
                : type === "error"
                    ? "tiny-toast tiny-toast--error"
                    : "tiny-toast tiny-toast--info";

    return (
        <div className={variantClass} role="status" aria-live="polite">
            {text}
        </div>
    );
}

/* Horizontal score bar coloured by value (0–100) */
function ScoreBar({ value }) {
    const v = value === "" || value === null || value === undefined ? NaN : Number(value);
    const pct = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
    return (
        <div className="cand-scorebar" aria-hidden>
            <span style={{ width: `${pct}%`, background: scoreColor(v) }} />
        </div>
    );
}

export default function StepSkills({ step, mode = "edit", onAfterSave }) {
    // Skills memoization
    const skills = useMemo(
        () => (Array.isArray(step?.skills) ? step.skills : []),
        [step?.skills]
    );
    const skillsMemoKey = useMemo(
        () => skills.map((s) => s.id).join("|"),
        [skills]
    );

    const candidateId = step?.context?.candidateId ?? null;
    const questionId = step?.context?.questionId ?? null;

    const readOnly = mode !== "edit";

    // rows: { [skillId]: { score, comment, dirty, exists } }
    const [rows, setRows] = useState({});
    const [loading, setLoading] = useState(false);

    // toast
    const [toast, setToast] = useState({ show: false, text: "", type: "info" });
    const showToast = (text, type = "info") => setToast({ show: true, text, type });
    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    /** GET from API – used also after Save */
    const fetchEvaluations = useCallback(async () => {
        if (!candidateId || !questionId) {
            setRows({});
            return;
        }
        setLoading(true);
        try {
            const url = `${API_BASE}/api/v1/skill-scores/candidate/${candidateId}/question/${questionId}`;
            const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
            const data = r.ok ? await r.json() : [];

            const byId = new Map(
                (Array.isArray(data) ? data : []).map((e) => [
                    e.skillId,
                    {
                        score: Number.isFinite(e.score) ? e.score : "",
                        comment: e.comment || "",
                        exists: true,
                        dirty: false,
                    },
                ])
            );

            const next = {};
            for (const s of skills) {
                next[s.id] =
                    byId.get(s.id) ?? { score: "", comment: "", exists: false, dirty: false };
            }
            setRows(next);
        } catch {
            // keep current state on failure
        } finally {
            setLoading(false);
        }
    }, [candidateId, questionId, skills]);

    useEffect(() => {
        if (!candidateId || !questionId) {
            setRows({});
            return;
        }
        fetchEvaluations();
    }, [candidateId, questionId, skillsMemoKey, fetchEvaluations]);

    // Local edits (not saved until Save pressed)
    const upsertLocal = (skillId, patch) => {
        setRows((prev) => {
            const cur = prev[skillId] || { score: "", comment: "", dirty: false, exists: false };
            const merged = { ...cur, ...patch, dirty: true };
            return { ...prev, [skillId]: merged };
        });
    };

    // clamp 0..100
    const handleChangeScore = (skillId, val) => {
        if (val === "" || val === null || typeof val === "undefined") {
            upsertLocal(skillId, { score: "" });
            return;
        }
        let num = Number(val);
        if (!Number.isFinite(num)) num = "";
        else {
            if (num > 100) num = 100;
            if (num < 0) num = 0;
        }
        upsertLocal(skillId, { score: num });
    };
    const handleChangeComment = (skillId, val) => upsertLocal(skillId, { comment: val });

    const hasSomethingToSave = useMemo(
        () => Object.values(rows).some((r) => r?.dirty),
        [rows]
    );

    // require each dirty row to have valid score 0..100
    const allDirtyValid = useMemo(() => {
        const dirty = Object.values(rows).filter((r) => r?.dirty);
        if (dirty.length === 0) return false;
        for (const r of dirty) {
            if (r.score === "" || r.score === null || typeof r.score === "undefined") {
                return false; // comment-only → no Save
            }
            const sc = Number(r.score);
            if (!Number.isFinite(sc) || sc < 0 || sc > 100) return false;
        }
        return true;
    }, [rows]);

    const handleSave = async () => {
        if (!candidateId || !questionId) return;
        if (!hasSomethingToSave || !allDirtyValid) return;

        setLoading(true);

        const dirtyEntries = Object.entries(rows).filter(([, v]) => v?.dirty === true);
        const toCreate = dirtyEntries.filter(([, v]) => !v.exists);
        const toUpdate = dirtyEntries.filter(([, v]) => v.exists);

        try {
            for (const [skillId, v] of dirtyEntries) {
                const payloadScore =
                    v.score === "" || v.score === null || typeof v.score === "undefined"
                        ? null
                        : Number(v.score);

                if (
                    payloadScore !== null &&
                    (!Number.isFinite(payloadScore) || payloadScore < 0 || payloadScore > 100)
                ) {
                    continue; // skip invalid
                }

                const body = {
                    candidateId,
                    questionId,
                    skillId: Number(skillId),
                    score: payloadScore,
                    comment: v.comment ?? "",
                };

                const resp = await fetch(`${API_BASE}/api/v1/skill-scores`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
                    body: JSON.stringify(body),
                });

                if (!resp.ok) {
                    continue; // leave dirty on failure
                }
            }

            await fetchEvaluations();

            // Toast policy
            if (toCreate.length > 0 && toUpdate.length === 0) {
                showToast("Saved", "success");
            } else {
                showToast("Modified", "success");
            }
        } catch {
            showToast("Save failed", "error");
        } finally {
            setLoading(false);
        }
        try {
            onAfterSave?.({
                candidateId,
                questionId,
                stepId: step?.context?.stepId ?? null,
                totalSkills: skills.length,
            });
        } catch { }
    };

    // ====== Placeholder when nothing is selected / no skills ======
    if (!step) {
        return (
            <div className="iv-empty">
                <i className="nc-icon nc-tap-01" />
                Open a step and pick a question to {readOnly ? "see" : "score"} its skills.
            </div>
        );
    }

    if (skills.length === 0) {
        return (
            <>
                {step?.name && <div className="cand-skills-context">{step.name}</div>}
                <div className="iv-empty">This question has no skills to evaluate.</div>
                <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
            </>
        );
    }

    // ====== Main UI ======
    return (
        <div>
            {step?.name && <div className="cand-skills-context">{step.name}</div>}

            {skills.map((s) => {
                const row = rows[s.id] || { score: "", comment: "", dirty: false, exists: false };

                if (readOnly) {
                    return (
                        <div key={s.id} className="cand-skill">
                            <div className="cand-skill-name">{s.name}</div>
                            <div className="cand-skill-scoreline">
                                <strong style={{ minWidth: 64 }}>{row.score === "" ? "—" : `${row.score}/100`}</strong>
                                <ScoreBar value={row.score} />
                            </div>
                            <div className={`cand-skill-comment-text ${row.comment?.trim() ? "" : "text-muted"}`}>
                                {row.comment?.trim() ? row.comment : "No comment."}
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={s.id} className="cand-skill">
                        <div className="cand-skill-name">{s.name}</div>
                        <div className="cand-skill-scoreline">
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                step={10}
                                placeholder="0–100"
                                aria-label={`Score for ${s.name}`}
                                disabled={loading}
                                value={row.score}
                                onChange={(e) => handleChangeScore(s.id, e.target.value)}
                            />
                            <ScoreBar value={row.score} />
                        </div>
                        <div className="cand-skill-comment">
                            <Input
                                type="textarea"
                                rows={2}
                                disabled={loading}
                                value={row.comment}
                                onChange={(e) => handleChangeComment(s.id, e.target.value)}
                                placeholder="Comment (optional)…"
                                aria-label={`Comment for ${s.name}`}
                            />
                        </div>
                    </div>
                );
            })}

            {!readOnly && (
                <div className="d-flex justify-content-end align-items-center" style={{ gap: 10 }}>
                    {hasSomethingToSave && !allDirtyValid && (
                        <small className="text-muted">Every changed skill needs a score (0–100).</small>
                    )}
                    <Button
                        color="primary"
                        className="m-0"
                        onClick={handleSave}
                        disabled={!hasSomethingToSave || !allDirtyValid || loading}
                    >
                        {loading ? "Saving…" : "Save Scores"}
                    </Button>
                </div>
            )}

            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </div>
    );
}
