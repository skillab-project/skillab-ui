import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Row, Col, Button, Spinner } from "reactstrap";
import CandidateListPanel from "./CandidateListPanel";
import StepsDropDown from "./StepsDropDown";
import StepSkills from "./StepSkills";
import { statusClass } from "./candidateUi";
import "../Interview/interview.css";
import "./Candidates.css";
import CandidateComments from "./CandidateComments";
import ConfirmModal from "../Hire/ConfirmModal";

const API_BASE = process.env.REACT_APP_API_URL_HIRING_MANAGEMENT;

/* Toast helper (global) */
const toast = (msg, type = "info", ttl = 2500) => {
    try { window.hfToast && window.hfToast(msg, type, ttl); } catch { }
};

export default function Candidates({ jobAdId }) {
    // selections
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [, setSelectedStep] = useState(null);
    const [, setSelectedQuestion] = useState(null);

    // data
    const [candidates, setCandidates] = useState([]);
    const [steps, setSteps] = useState([]);
    const [interviewId, setInterviewId] = useState(null);

    // loading states
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [errCandidates, setErrCandidates] = useState(null);
    const [loadingSteps, setLoadingSteps] = useState(false);
    const [errSteps, setErrSteps] = useState(null);

    // modal
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmType, setConfirmType] = useState(null); // 'APPROVED' | 'REJECTED'
    const [confirmLoading, setConfirmLoading] = useState(false);

    // comments
    const [candComment, setCandComment] = useState("");

    // status
    const statusUp = (selectedCandidate?.status || "").toUpperCase();
    const lockedByCandidate = ["APPROVED", "REJECTED", "HIRED"].includes(statusUp);
    const isLocked = !!selectedCandidate && lockedByCandidate;
    const canEdit = !!selectedCandidate && !isLocked;
    const isCommentLocked = isLocked;

    const [rightPane, setRightPane] = useState(null);

    // reset on job change
    useEffect(() => {
        setSelectedCandidate(null);
        setSelectedStep(null);
        setSelectedQuestion(null);
        setCandidates([]);
        setSteps([]);
        setInterviewId(null);
    }, [jobAdId]);

    useEffect(() => {
        if (!selectedCandidate) {
            setSelectedStep(null);
            setSelectedQuestion(null);
            setRightPane(null);                        // κλείνει τα skills
            setCandComment("");                        // καθαρίζει σχόλια
            setSteps(prev => prev.map(s => ({          // καθαρίζει metrics/ratings
                ...s,
                __metrics: undefined,
                questions: (s.questions || []).map(q => ({ ...q, __metrics: undefined }))
            })));
        }
    }, [selectedCandidate]);

    /* 1) candidates */
    useEffect(() => {
        if (!jobAdId) {
            setCandidates([]);
            return;
        }
        const ac = new AbortController();
        setLoadingCandidates(true);
        setErrCandidates(null);

        (async () => {
            try {
                const url = `${API_BASE}/api/v1/candidates/jobad/${jobAdId}`;
                const res = await fetch(url, { signal: ac.signal, headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const mapped = (Array.isArray(data) ? data : []).map((c) => ({
                    id: c.id,
                    name: `${c.firstName} ${c.lastName}`.trim(),
                    email: c.email,
                    status: c.status,
                    cv: c.cvPath,
                    cvName: c.cvOriginalName,
                    interviewReportId: c?.interviewReportId ?? null,
                }));
                setCandidates(mapped);
            } catch (e) {
                if (e.name !== "AbortError") {
                    setErrCandidates(e.message || "Load error");
                    toast("Failed to load candidates", "error");
                }
            } finally {
                setLoadingCandidates(false);
            }
        })();

        return () => ac.abort();
    }, [jobAdId]);

    /* 2) interview + steps + questions */
    useEffect(() => {
        if (!jobAdId) return;
        const ac = new AbortController();

        (async () => {
            try {
                setLoadingSteps(true);
                setErrSteps(null);

                const detailsRes = await fetch(
                    `${API_BASE}/api/v1/jobAds/${jobAdId}/details`,
                    { signal: ac.signal, headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } }
                );
                if (!detailsRes.ok) throw new Error("Failed to fetch interview-details");
                const d = await detailsRes.json();

                const iid = d?.id ?? null;
                setInterviewId(iid);

                const baseSteps = (Array.isArray(d?.steps) ? d.steps : [])
                    .map((s) => ({
                        id: s.id ?? s.stepId ?? null,
                        name: s.title ?? s.tittle ?? "",
                        questions: [],
                    }))
                    .filter((s) => s.id != null);

                const withQuestions = [];
                for (const st of baseSteps) {
                    try {
                        const qsRes = await fetch(
                            `${API_BASE}/api/v1/step/${st.id}/questions`,
                            { signal: ac.signal, headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } }
                        );
                        const qs = qsRes.ok ? await qsRes.json() : [];
                        const mappedQs = (Array.isArray(qs) ? qs : []).map((q) => ({
                            id: q.id,
                            question: q.name ?? q.title ?? "",
                        }));
                        withQuestions.push({ ...st, questions: mappedQs });
                    } catch {
                        withQuestions.push({ ...st, questions: [] });
                    }
                }

                setSteps(withQuestions);
            } catch (e) {
                if (e.name !== "AbortError") {
                    setErrSteps(e.message || "Load error");
                    toast("Failed to load steps", "error");
                }
            } finally {
                setLoadingSteps(false);
            }
        })();

        return () => ac.abort();
    }, [jobAdId]);

    /* 2.5) reset metrics όταν αλλάζει υποψήφιος */
    useEffect(() => {
        setRightPane(null);
        setSteps(prev =>
            prev.map(s => ({
                ...s,
                __metrics: undefined,
                questions: (s.questions || []).map(q => ({ ...q, __metrics: undefined }))
            }))
        );
    }, [selectedCandidate?.id]);


    /* 4) right pane: skills */
    const handleSelectQ = useCallback(
        async (step, q) => {
            setSelectedStep(step);
            setSelectedQuestion(q);

            if (!q?.id) {
                setRightPane(null);
                return;
            }
            try {
                const r = await fetch(`${API_BASE}/api/v1/question/${q.id}/details`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
                if (!r.ok) throw new Error();
                const d = await r.json();
                const skills = (Array.isArray(d?.skills) ? d.skills : [])
                    .map((s) => ({ id: s?.id, name: s?.title || s?.name || "" }))
                    .filter((s) => s.id && s.name);

                setRightPane({
                    name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
                    skills,
                    context: {
                        candidateId: selectedCandidate?.id ?? null,
                        questionId: q.id,
                        stepId: step?.id ?? null,
                    },
                });
            } catch {
                setRightPane({
                    name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
                    skills: [],
                    context: {
                        candidateId: selectedCandidate?.id ?? null,
                        questionId: q.id,
                        stepId: step?.id ?? null,
                    },
                });
            }
        },
        [selectedCandidate?.id]
    );

    // refresh metrics after save
    const refreshMetrics = useCallback(
        async ({ stepId, questionId, totalSkills }) => {
            if (!selectedCandidate?.id || !questionId) return;
            try {
                const r = await fetch(
                    `${API_BASE}/api/v1/skill-scores/candidate/${selectedCandidate.id}/question/${questionId}`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } }
                );
                const arr = r.ok ? await r.json() : [];
                const scores = arr.map((x) => Number(x?.score)).filter((v) => Number.isFinite(v));
                const ratedSkills = scores.length;
                const avg = ratedSkills > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / ratedSkills) : null;

                setSteps((prev) =>
                    prev.map((s) => {
                        if (s.id !== stepId) return s;
                        const newQuestions = (s.questions || []).map((q) => {
                            if ((q.id ?? q.questionId) !== questionId) return q;
                            const total = Number.isFinite(totalSkills)
                                ? totalSkills
                                : Array.isArray(q.skills) ? q.skills.length : 0;
                            return { ...q, __metrics: { totalSkills: total, ratedSkills, averageScore: avg } };
                        });

                        let fullyRated = 0, sum = 0, cnt = 0;
                        for (const q of newQuestions) {
                            const m = q.__metrics;
                            const totalForQ = Number.isFinite(m?.totalSkills) ? m.totalSkills : Array.isArray(q?.skills) ? q.skills.length : 0;
                            const ratedForQ = Number.isFinite(m?.ratedSkills) ? m.ratedSkills : 0;
                            if (totalForQ > 0 && ratedForQ === totalForQ) fullyRated += 1;
                            if (Number.isFinite(m?.averageScore)) { sum += m.averageScore; cnt += 1; }
                        }
                        const localAvg = cnt ? Math.round(sum / cnt) : null;

                        return {
                            ...s,
                            questions: newQuestions,
                            __metrics: {
                                totalQuestions: newQuestions.length,
                                ratedQuestions: fullyRated,
                                averageScore: localAvg,
                            },
                        };
                    })
                );

                toast("Scores saved", "success");
            } catch {
                toast("Failed to refresh metrics", "error");
            }
        },
        [selectedCandidate?.id, interviewId]
    );

    const rightPaneStepObj = useMemo(() => rightPane, [rightPane]);

    async function updateCandidateStatus(newStatus) {
        if (!selectedCandidate) return;
        try {
            const backendStatus =
                newStatus === "APPROVED" ? "Approved" :
                    newStatus === "REJECTED" ? "Rejected" : newStatus;

            const resp = await fetch(
                `${API_BASE}/api/v1/candidates/${selectedCandidate.id}/status`,
                { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
                body: JSON.stringify({ status: backendStatus }) }
            );
            if (!resp.ok) {
                const txt = await resp.text().catch(() => "");
                throw new Error(`Failed to update status. HTTP ${resp.status} ${txt}`.trim());
            }

            setSelectedCandidate((prev) => prev ? { ...prev, status: backendStatus } : prev);
            setCandidates((prev) => prev.map((c) => c.id === selectedCandidate.id ? { ...c, status: backendStatus } : c));
            setSteps((prev) => [...prev]);

            toast(`Candidate ${backendStatus}`, "success");
        } catch (e) {
            console.error(e);
            toast(e.message || "Status update failed", "error");
        }
    }

    const openConfirm = (type) => {
        if (!selectedCandidate) return;
        setConfirmType(type);
        setShowConfirm(true);
    };

    const onConfirm = async () => {
        if (!confirmType) return;
        setConfirmLoading(true);
        await updateCandidateStatus(confirmType);
        setConfirmLoading(false);
        setShowConfirm(false);
        setConfirmType(null);
    };

    useEffect(() => {
        if (!rightPane?.context || !isLocked) return;
        const { candidateId, questionId } = rightPane.context;
        try {
            const raw = localStorage.getItem("hf_skill_drafts");
            if (!raw) return;
            const all = JSON.parse(raw);
            const key = `cand:${candidateId}|q:${questionId}`;
            delete all[key];
            localStorage.setItem("hf_skill_drafts", JSON.stringify(all));
        } catch { }
    }, [isLocked, rightPane?.context]);

    useEffect(() => {
        if (!selectedCandidate?.id) {
            setCandComment("");
            return;
        }
        (async () => {
            try {
                const r = await fetch(`${API_BASE}/api/v1/candidates/${selectedCandidate.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
                const d = r.ok ? await r.json() : null;
                setCandComment(d?.comments ?? "");
            } catch {
                setCandComment("");
            }
        })();
    }, [selectedCandidate?.id]);

    async function saveCandidateComment() {
        if (!selectedCandidate) return;
        try {
            const resp = await fetch(
                `${API_BASE}/api/v1/candidates/${selectedCandidate.id}/comments`,
                { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
                 body: JSON.stringify({ comments: candComment }) }
            );
            if (!resp.ok) {
                const txt = await resp.text().catch(() => "");
                throw new Error(`Failed to save comment. HTTP ${resp.status} ${txt}`.trim());
            }
            toast("Comment saved", "success");
        } catch (e) {
            console.error(e);
            toast(e.message || "Failed to save comment", "error");
        }
    }

    if (!jobAdId) return <p className="text-muted" style={{ padding: "1rem" }}>Select a Job Ad to view its candidates.</p>;

    return (
        <div className="iv-page">
            {/* ---------- 1. Candidates ---------- */}
            <CandidateListPanel
                jobAdId={jobAdId}
                loadingCandidates={loadingCandidates}
                errCandidates={errCandidates}
                candidates={candidates}
                setSelectedCandidate={setSelectedCandidate}
                selectedCandidate={selectedCandidate}
                onCreated={(newCand) => {
                    const mapped = {
                        id: newCand.id,
                        name: `${newCand.firstName} ${newCand.lastName}`.trim(),
                        email: newCand.email,
                        status: newCand.status ?? "Pending",
                        cv: newCand.cvPath,
                        cvName: newCand.cvOriginalName,
                        interviewReportId: newCand?.interviewReport?.id ?? null,
                    };
                    // add to the list without duplicates; the current selection stays as is
                    setCandidates(prev => {
                        const exists = prev.some(c => c.id === mapped.id);
                        return exists ? prev.map(c => (c.id === mapped.id ? mapped : c)) : [...prev, mapped];
                    });
                    toast("Candidate added", "success");
                }}
            />

            {/* ---------- 2. Evaluation ---------- */}
            <section className="iv-section iv-section--head-center">
                <div className="iv-section-head">
                    <div>
                        <h5 className="iv-section-title">
                            Evaluation{selectedCandidate ? ` — ${selectedCandidate.name}` : ""}
                        </h5>
                        <p className="iv-section-sub">
                            {selectedCandidate
                                ? isLocked
                                    ? "The decision has been made, so the scores are read-only."
                                    : "Open a step, pick a question and score each of its skills. Then approve or reject the candidate."
                                : "Select a candidate above to evaluate them."}
                        </p>
                    </div>
                    {selectedCandidate && (
                        isLocked ? (
                            <span className={`cand-status ${statusClass(selectedCandidate.status)}`} style={{ fontSize: 12, padding: "4px 14px" }}>
                                <i className="nc-icon nc-lock-circle-open mr-1" />
                                {selectedCandidate.status}
                            </span>
                        ) : (
                            <div className="iv-actions">
                                <Button color="success" onClick={() => openConfirm("APPROVED")}>
                                    <i className="nc-icon nc-check-2 mr-1" style={{ verticalAlign: "middle" }} /> Approve
                                </Button>
                                <Button color="danger" outline onClick={() => openConfirm("REJECTED")}>
                                    <i className="nc-icon nc-simple-remove mr-1" style={{ verticalAlign: "middle" }} /> Reject
                                </Button>
                            </div>
                        )
                    )}
                </div>

                {!selectedCandidate ? (
                    <div className="iv-empty">
                        <i className="nc-icon nc-tap-01" />
                        Select a candidate to see the interview steps and score their skills.
                    </div>
                ) : (
                    <Row>
                        <Col xl="5" className="mb-4">
                            <div className="cand-panel-title">Interview steps</div>
                            {loadingSteps ? (
                                <div className="iv-empty"><Spinner size="sm" className="mr-2" /> Loading steps…</div>
                            ) : errSteps ? (
                                <div className="iv-empty text-danger">Could not load the steps ({errSteps}).</div>
                            ) : (
                                <StepsDropDown
                                    steps={steps}
                                    ratings={{}}
                                    onSelect={handleSelectQ}
                                    showScore={true}
                                    candidateId={selectedCandidate?.id}
                                    interviewReportId={selectedCandidate?.interviewReportId}
                                />
                            )}
                        </Col>
                        <Col xl="7" className="mb-4">
                            <div className="cand-panel-title">Skills of the selected question</div>
                            <StepSkills
                                step={rightPaneStepObj}
                                mode={canEdit ? "edit" : "view"}
                                onAfterSave={({ stepId, questionId, totalSkills }) =>
                                    refreshMetrics({
                                        stepId,
                                        questionId,
                                        totalSkills: Number.isFinite(totalSkills)
                                            ? totalSkills
                                            : rightPaneStepObj?.skills?.length ?? 0,
                                    })
                                }
                            />
                        </Col>
                    </Row>
                )}
            </section>

            {/* ---------- 3. Comments ---------- */}
            <section className="iv-section iv-section--head-center">
                <div className="iv-section-head">
                    <div>
                        <h5 className="iv-section-title">Comments</h5>
                        <p className="iv-section-sub">Notes about the candidate, shared with the hiring team.</p>
                    </div>
                </div>
                <CandidateComments
                    selectedCandidate={selectedCandidate}
                    candComment={candComment}
                    setCandComment={setCandComment}
                    isCommentLocked={isCommentLocked}
                    saveCandidateComment={saveCandidateComment}
                />
            </section>

            {/* Modal επιβεβαίωσης έξω από τα panels */}
            <ConfirmModal
                isOpen={showConfirm}
                title={confirmType === "REJECTED" ? "Confirm Reject" : "Confirm Approve"}
                message={
                    <>
                        Do you really want to <b>{confirmType === "REJECTED" ? "Reject" : "Approve"}</b>{" "}
                        <b>{selectedCandidate?.name}</b>? This will change the status to <b>{confirmType}</b>.
                    </>
                }
                confirmText="Confirm"
                cancelText="Cancel"
                confirmColor={confirmType === "REJECTED" ? "danger" : "success"}
                loading={confirmLoading}
                onConfirm={onConfirm}
                onCancel={() => { setShowConfirm(false); setConfirmType(null); }}
            />
        </div>
    );
}
