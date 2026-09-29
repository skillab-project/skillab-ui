import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Row, Col, Button } from "reactstrap";
import StepsDropDown from "../Candidates/StepsDropDown";
import StepSkills from "../Candidates/StepSkills";
import ConfirmModal from "./ConfirmModal";
import CandidateDropdown from "../Candidates/CandidateDropDown";
import { scoreVariant, statusClass } from "../Candidates/candidateUi";
import "../Interview/interview.css";
import "../Candidates/Candidates.css";
import "./Hire.css";

const API_BASE = process.env.REACT_APP_API_URL_HIRING_MANAGEMENT;

/* ---------- Toast helper (global + fallback) ---------- */
const toast = (msg, type = "success", ttl = 2500) => {
    if (window.hfToast) window.hfToast(msg, type, ttl);
    else window.dispatchEvent(new CustomEvent("hf:toast", { detail: { message: msg, type, ttl } }));
};

// μικρό helper για basename από path (fallback όταν δεν υπάρχει originalName)
const fileNameFromPath = (p) => (typeof p === "string" ? p.split("/").pop() : "");

export default function Hire({ jobAdId }) {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    const [candidates, setCandidates] = useState([]);
    const [steps, setSteps] = useState([]);
    const [interviewId, setInterviewId] = useState(null);

    const [candComment, setCandComment] = useState("");
    const [rightPane, setRightPane] = useState(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    useEffect(() => {
        setSelectedCandidate(null);
        setSelectedStep(null);
        setSelectedQuestion(null);
        setCandComment("");
        setCandidates([]);
        setSteps([]);
        setInterviewId(null);
        setRightPane(null);
    }, [jobAdId]);

    // Approved candidates με τελικό score
    useEffect(() => {
        if (!jobAdId) return;
        (async () => {
            try {
                const r = await fetch(`${API_BASE}/api/v1/candidates/jobad/${jobAdId}/final-scores`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
                const data = r.ok ? await r.json() : [];
                const mapped = (Array.isArray(data) ? data : [])
                    .filter((d) => ["approved", "accepted", "hired"].includes(String(d.status || "").toLowerCase()))
                    .map((d) => ({
                        id: d.candidateId ?? d.id,
                        name: `${d.firstName || ""} ${d.lastName || ""}`.trim(),
                        status: d.status,
                        avgScore: typeof d.avgScore === "number" && isFinite(d.avgScore) ? d.avgScore : null,
                    }));
                setCandidates(mapped);
            } catch {
                setCandidates([]);
                toast("Failed to load approved candidates", "error");
            }
        })();
    }, [jobAdId]);

    // interview + steps + questions
    useEffect(() => {
        if (!jobAdId) return;
        (async () => {
            try {
                const det = await fetch(`${API_BASE}/api/v1/jobAds/${jobAdId}/details`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
                const d = det.ok ? await det.json() : null;
                const iid = d?.id ?? d?.interviewId ?? null;
                setInterviewId(iid);

                const baseSteps = (Array.isArray(d?.steps) ? d.steps : [])
                    .map((s) => ({
                        id: s.id ?? s.stepId ?? null,
                        name: s.title ?? s.tittle ?? "",
                        questions: [],
                    }))
                    .filter((s) => s.id != null);

                const withQs = [];
                for (const st of baseSteps) {
                    try {
                        const r = await fetch(`${API_BASE}/api/v1/step/${st.id}/questions`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
                        const list = r.ok ? await r.json() : [];
                        withQs.push({
                            ...st,
                            questions: (Array.isArray(list) ? list : []).map((q) => ({
                                id: q.id,
                                question: q.name ?? q.title ?? "",
                            })),
                        });
                    } catch {
                        withQs.push({ ...st, questions: [] });
                    }
                }
                setSteps(withQs);
            } catch {
                setSteps([]);
                toast("Failed to load steps", "error");
            }
        })();
    }, [jobAdId]);

    // comments (read-only)
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
                const d = r.ok ? await r.json() : null;
                const skills = (Array.isArray(d?.skills) ? d.skills : [])
                    .map((s) => ({ id: s?.id, name: s?.title || s?.name }))
                    .filter((s) => s.id && s.name);
                setRightPane({
                    name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
                    skills,
                    context: { candidateId: selectedCandidate?.id ?? null, questionId: q.id },
                });
            } catch {
                setRightPane({
                    name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
                    skills: [],
                    context: { candidateId: selectedCandidate?.id ?? null, questionId: q.id },
                });
            }
        },
        [selectedCandidate?.id]
    );

    const rightPaneStepObj = useMemo(() => rightPane, [rightPane]);

    const openHireModal = () => {
        if (!selectedCandidate) return;
        if (String(selectedCandidate.status || "").toLowerCase() === "hired") {
            toast("This candidate is already hired", "info");
            return;
        }
        setShowConfirm(true);
    };

    const doHire = async () => {
        if (!selectedCandidate) return;
        setConfirmLoading(true);
        try {
            const r = await fetch(`${API_BASE}/api/v1/candidates/${selectedCandidate.id}/hire`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
            if (!r.ok) {
                console.error("Failed to hire candidate", await r.text());
                const msg =
                    r.status === 400
                        ? "Only Approved candidates can be hired"
                        : r.status === 409
                            ? "JobAd already complete"
                            : "Hire failed";
                throw new Error(msg);
            }
            console.log("Candidate hired successfully");
            const data = await r.json();
            setCandidates((prev) =>
                prev.map((c) => (c.id === data.candidateId ? { ...c, status: data.candidateStatus } : c))
            );
            setSelectedCandidate((prev) =>
                prev && prev.id === data.candidateId ? { ...prev, status: data.candidateStatus } : prev
            );

            window.dispatchEvent(
                new CustomEvent("hf:jobad-updated", {
                    detail: { id: data.jobAdId ?? jobAdId, status: data.jobAdStatus ?? "Complete" },
                })
            );
            toast("Candidate hired", "success");
        } catch (e) {
            toast(e.message || "Hire failed", "error");
        } finally {
            setConfirmLoading(false);
            setShowConfirm(false);
        }
    };

    if (!jobAdId) return <p className="text-muted" style={{ padding: "1rem" }}>Select a Job Ad to view its candidates.</p>;

    const selectCandidate = async (cand) => {
        if (!cand) {
            setSelectedCandidate(null);
            setSelectedStep(null);
            setSelectedQuestion(null);
            setRightPane(null);
            setCandComment("");
            return;
        }
        try {
            const r = await fetch(`${API_BASE}/api/v1/candidates/${cand.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
            const d = r.ok ? await r.json() : null;
            // keep cvPath + cvName (original name or basename)
            const enriched = {
                ...cand,
                email: d?.email ?? "",
                cvPath: d?.cvPath ?? "",
                cvName: d?.cvOriginalName ?? fileNameFromPath(d?.cvPath) ?? "",
                interviewReportId:
                    d?.interviewReport?.id ?? d?.interviewReportId ?? cand?.interviewReportId ?? null,
            };
            setSelectedCandidate(enriched);
            setCandidates((prev) =>
                prev.map((x) =>
                    x.id === cand.id
                        ? { ...x, email: enriched.email, cvPath: enriched.cvPath, cvName: enriched.cvName }
                        : x
                )
            );
        } catch {
            setSelectedCandidate(cand);
        }
        setSelectedStep(null);
        setSelectedQuestion(null);
        setRightPane(null);
    };

    const isHired = String(selectedCandidate?.status || "").toLowerCase() === "hired";

    return (
        <div className="iv-page">
            {/* ---------- 1. Approved candidates ---------- */}
            <section className="iv-section iv-section--head-center">
                <div className="iv-section-head">
                    <div>
                        <h5 className="iv-section-title">Approved Candidates</h5>
                        <p className="iv-section-sub">
                            Candidates that passed the evaluation, with their final score. Select one to review and hire.
                        </p>
                    </div>
                    {selectedCandidate && (
                        isHired ? (
                            <span className={`cand-status ${statusClass("hired")}`} style={{ fontSize: 12, padding: "4px 14px" }}>
                                <i className="nc-icon nc-check-2 mr-1" /> Hired
                            </span>
                        ) : (
                            <div className="iv-actions">
                                <Button color="success" onClick={openHireModal}>
                                    <i className="nc-icon nc-check-2 mr-1" style={{ verticalAlign: "middle" }} /> Hire {selectedCandidate.name}
                                </Button>
                            </div>
                        )
                    )}
                </div>

                <CandidateDropdown
                    candidates={candidates}
                    selectedId={selectedCandidate?.id ?? null}
                    emptyText="No approved candidates yet. Approve candidates in the Candidates tab first."
                    renderLeft={(c) => (
                        <span className={`cand-score cand-score--${scoreVariant(c.avgScore)}`} title="Final score">
                            {Number.isFinite(c.avgScore) ? `Score ${c.avgScore}` : "No score"}
                        </span>
                    )}
                    onSelect={selectCandidate}
                />
            </section>

            {/* ---------- 2. Evaluation (read-only) ---------- */}
            <section className="iv-section iv-section--head-center">
                <div className="iv-section-head">
                    <div>
                        <h5 className="iv-section-title">
                            Evaluation{selectedCandidate ? ` — ${selectedCandidate.name}` : ""}
                        </h5>
                        <p className="iv-section-sub">The scores the candidate received in each step (read-only).</p>
                    </div>
                </div>

                {!selectedCandidate ? (
                    <div className="iv-empty">
                        <i className="nc-icon nc-tap-01" />
                        Select a candidate to see their evaluation.
                    </div>
                ) : (
                    <Row>
                        <Col xl="5" className="mb-4">
                            <div className="cand-panel-title">Interview steps</div>
                            <StepsDropDown
                                steps={steps}
                                ratings={{}}
                                onSelect={handleSelectQ}
                                showScore={true}
                                candidateId={selectedCandidate?.id}
                                interviewReportId={selectedCandidate?.interviewReportId}
                            />
                        </Col>
                        <Col xl="7" className="mb-4">
                            <div className="cand-panel-title">Skills of the selected question</div>
                            <StepSkills step={rightPaneStepObj} mode="view" />
                        </Col>
                    </Row>
                )}
            </section>

            {/* ---------- 3. Comments (read-only) ---------- */}
            <section className="iv-section iv-section--head-center">
                <div className="iv-section-head">
                    <div>
                        <h5 className="iv-section-title">Comments</h5>
                        <p className="iv-section-sub">Notes the hiring team wrote about the candidate.</p>
                    </div>
                </div>
                {!selectedCandidate ? (
                    <div className="iv-empty">
                        <i className="nc-icon nc-chat-33" />
                        Select a candidate to see the comments.
                    </div>
                ) : (
                    <div className={`cand-readonly-text ${candComment?.trim() ? "" : "is-empty"}`}>
                        {candComment?.trim() ? candComment : "No comments."}
                    </div>
                )}
            </section>

            <ConfirmModal
                isOpen={showConfirm}
                title="Confirm Hire"
                message={
                    <>
                        Do you really want to <b>Hire</b> <b>{selectedCandidate?.name}</b>? This will change the status to{" "}
                        <b>Hired</b>.
                    </>
                }
                confirmText="Confirm"
                cancelText="Cancel"
                confirmColor="success"
                loading={confirmLoading}
                onConfirm={doHire}
                onCancel={() => setShowConfirm(false)}
            />
        </div>
    );
}
