import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Input } from "reactstrap";

import InterviewSteps from "./InterviewSteps";
import AddStepModal from "./AddStepModal";
import ConfirmModal from "../Hire/ConfirmModal";

import "./interview.css";

const API = process.env.REACT_APP_API_URL_HIRING_MANAGEMENT;
const normalizeStatus = (s) =>
    String(s ?? "").replace(/\u00A0/g, " ").trim().toLowerCase().replace(/\s+/g, "");
const isEditableStatus = (raw) => {
    const n = normalizeStatus(raw);
    return n === "pending" || n === "pedding" || n === "draft";
};

// safe toast helper
const toast = (msg, type = "success", ttl = 2500) => {
    if (window.hfToast) window.hfToast(msg, type, ttl);
    else window.dispatchEvent(new CustomEvent("hf:toast", { detail: { message: msg, type, ttl } }));
};

export default function Interview({ selectedJobAdId }) {
    const [interviewId, setInterviewId] = useState(null);
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState([]);
    const [selectedStepIndex, setSelectedStepIndex] = useState(0);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showAddStep, setShowAddStep] = useState(false);

    const [status, setStatus] = useState(null);
    const canEdit = useMemo(() => isEditableStatus(status), [status]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    /* ====== DATA ====== */
    useEffect(() => {
        if (!selectedJobAdId) return;

        setError(null);
        setInterviewId(null);
        setDescription("");
        setSteps([]);
        setSelectedStepIndex(0);
        setStatus(null);

        fetch(`${API}/api/v1/jobAds/${selectedJobAdId}/details`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => {
                setInterviewId(d?.id ?? null);
                setDescription(d?.description ?? "");
            })
            .catch(() => setError("Failed to load interview details."));

        fetch(`${API}/api/v1/jobAds/details?jobAdId=${selectedJobAdId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setStatus(d?.status ?? null))
            .catch(() => setStatus(null));
    }, [selectedJobAdId]);

    const reloadSteps = useCallback(async () => {
        if (!interviewId) return;
        try {
            const r = await fetch(`${API}/api/v1/step/interviews/${interviewId}/steps`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
            if (!r.ok) throw new Error();
            const data = await r.json();
            const safe = (data || []).map((s) => ({
                id: s.id ?? s.stepId ?? null,
                title: s.title ?? s.tittle ?? "",
                description: s.description ?? "",
            }));
            setSteps(safe);

            const idx = Math.min(selectedStepIndex, Math.max(0, safe.length - 1));
            setSelectedStepIndex(idx);
        } catch { /* ignore */ }
    }, [interviewId, selectedStepIndex]);

    useEffect(() => { if (interviewId != null) reloadSteps(); }, [interviewId, reloadSteps]);

    const handleSelectStep = useCallback((index) => {
        setSelectedStepIndex(index ?? 0);
    }, []);

    const getCurrentStepId = () => steps[selectedStepIndex]?.id ?? null;
    const getCurrentStepTitle = () => steps[selectedStepIndex]?.title || "";

    const onLocalReorder = useCallback((from, to) => {
        setSteps((prev) => {
            if (!prev || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
            const arr = [...prev];
            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);
            return arr;
        });
        setSelectedStepIndex((prevIdx) => {
            if (prevIdx === from) return to;
            if (from < prevIdx && to >= prevIdx) return prevIdx - 1;
            if (from > prevIdx && to <= prevIdx) return prevIdx + 1;
            return prevIdx;
        });
    }, []);

    const handleUpdate = async () => {
        if (!interviewId) return;
        setSaving(true);
        try {
            let ok = false;
            try {
                const r = await fetch(`${API}/api/v1/step/interviews/${interviewId}/description`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
                    body: JSON.stringify({ description }),
                });
                if (r.ok) ok = true;
            } catch { /* ignore */ }
            if (!ok) {
                const r2 = await fetch(`${API}/api/v1/step/interviews/${interviewId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
                    body: JSON.stringify({ description }),
                });
                if (!r2.ok) throw new Error();
            }
            toast("Interview updated", "success");
        } catch {
            toast("Update failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const openDeleteConfirm = () => setConfirmOpen(true);

    const handleDeleteCurrentStepConfirmed = async () => {
        const stepId = getCurrentStepId();
        if (!stepId) { setConfirmOpen(false); return; }

        setDeleting(true);
        const prevSteps = steps;
        const currentIndex = selectedStepIndex;
        const nextSteps = prevSteps.filter((s) => s.id !== stepId);
        const newIndex = Math.max(0, Math.min(currentIndex, nextSteps.length - 1));

        setSteps(nextSteps);
        setSelectedStepIndex(newIndex);

        try {
            const res = await fetch(`${API}/api/v1/step/${stepId}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
            if (!res.ok) throw new Error();
            setConfirmOpen(false);
            toast("Step deleted", "success");
        } catch {
            setSteps(prevSteps);
            setSelectedStepIndex(currentIndex);
            setConfirmOpen(false);
            toast("Delete failed", "error");
        } finally {
            setDeleting(false);
        }
    };

    if (!selectedJobAdId) return <p className="text-muted" style={{ padding: "1rem" }}>Select a Job Ad to view the Interview.</p>;
    if (error) return <p className="text-danger" style={{ padding: "1rem" }}>{error}</p>;

    const currentTitle = getCurrentStepTitle();

    return (
        <>
            <div className="iv-page">
                {/* ---------- Interview steps ---------- */}
                <section className="iv-section">
                    <div className="iv-section-head">
                        <div>
                            <h5 className="iv-section-title">Interview Steps</h5>
                            <p className="iv-section-sub">
                                {canEdit
                                    ? "The stages candidates go through. Click a step to edit its description, drag ⠿ to reorder. Add the skills and questions of each step in the Questions tab."
                                    : "The stages candidates go through. Skills and questions per step are in the Questions tab."}
                            </p>
                        </div>
                        {canEdit ? (
                            <div className="iv-actions">
                                <Button color="primary" onClick={() => setShowAddStep(true)} disabled={!interviewId}>
                                    <i className="nc-icon nc-simple-add mr-1" style={{ verticalAlign: "middle" }} /> Add Step
                                </Button>
                                <Button
                                    color="danger"
                                    outline
                                    onClick={openDeleteConfirm}
                                    disabled={!getCurrentStepId()}
                                    title={currentTitle ? `Delete “${currentTitle}”` : "Select a step to delete"}
                                >
                                    <i className="nc-icon nc-simple-remove mr-1" style={{ verticalAlign: "middle" }} /> Delete Step
                                </Button>
                            </div>
                        ) : (
                            <span className="iv-readonly-note">
                                <i className="nc-icon nc-lock-circle-open" /> Read-only once the job ad is published
                            </span>
                        )}
                    </div>

                    <InterviewSteps
                        interviewsteps={steps}
                        onSelect={handleSelectStep}
                        selectedIndex={selectedStepIndex}
                        interviewId={interviewId}
                        reloadSteps={async () => { await reloadSteps(); toast("Steps updated", "info"); }}
                        onLocalReorder={onLocalReorder}
                        canEdit={canEdit}
                    />
                </section>

                {/* ---------- Interview description (centred) ---------- */}
                <section className="iv-section iv-section--center">
                    <div className="iv-section-head">
                        <div>
                            <h5 className="iv-section-title">Interview Description</h5>
                            <p className="iv-section-sub">General information about the interview process shared with candidates.</p>
                        </div>
                    </div>

                    <Input
                        type="textarea"
                        rows={7}
                        className="iv-textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the interview process, e.g. format, duration, who takes part…"
                        readOnly={!canEdit}
                        disabled={!canEdit}
                        aria-label="Interview description"
                    />

                    {canEdit && (
                        <div className="d-flex justify-content-center mt-3">
                            <Button color="primary" className="m-0" onClick={handleUpdate} disabled={saving || !interviewId}>
                                {saving ? "Saving…" : "Save Description"}
                            </Button>
                        </div>
                    )}
                </section>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title="Delete Step"
                message={
                    <div>
                        Are you sure you want to delete this step?
                        {getCurrentStepTitle() ? <> <b> “{getCurrentStepTitle()}”</b>;</> : <> this?</>}
                        <br />This action cannot be undone.
                    </div>
                }
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="danger"
                loading={deleting}
                onConfirm={handleDeleteCurrentStepConfirmed}
                onCancel={() => setConfirmOpen(false)}
            />

            <AddStepModal
                isOpen={showAddStep}
                toggle={() => setShowAddStep((v) => !v)}
                interviewId={interviewId}
                onCreated={async () => { await reloadSteps(); toast("Step created", "success"); }}
            />
        </>
    );
}
