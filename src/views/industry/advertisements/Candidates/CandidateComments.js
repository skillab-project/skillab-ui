import React, { useState, useEffect } from "react";
import { Input, Button } from "reactstrap";
import "./Candidates.css";

function TinyToast({ show, text, type = "info", onHide }) {
    useEffect(() => {
        if (!show) return;
        const t = setTimeout(onHide, 2000);
        return () => clearTimeout(t);
    }, [show, onHide]);

    if (!show) return null;
    return (
        <div className={`tiny-toast tiny-toast--${type}`} role="status" aria-live="polite">
            {text}
        </div>
    );
}

/**
 * Comments about the selected candidate: editable with a Save button, or
 * read-only (with a note) once the candidate has been approved/rejected/hired.
 */
const CandidateComments = ({
    selectedCandidate,
    candComment,
    setCandComment,
    isCommentLocked,
    saveCandidateComment,
}) => {
    const [toast, setToast] = useState({ show: false, text: "", type: "info" });
    const [originalComment, setOriginalComment] = useState("");
    const [originalForCandidateId, setOriginalForCandidateId] = useState(null);
    const [userEdited, setUserEdited] = useState(false);

    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    useEffect(() => {
        if (!selectedCandidate) {
            setOriginalForCandidateId(null);
            setOriginalComment("");
            setUserEdited(false);
            return;
        }
        setOriginalForCandidateId(selectedCandidate.id);
        setOriginalComment(candComment ?? "");
        setUserEdited(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCandidate?.id]);

    // the comment arrives asynchronously after selection
    useEffect(() => {
        if (!selectedCandidate) return;
        if (originalForCandidateId !== selectedCandidate.id) return;
        if (userEdited) return;
        if ((candComment ?? "") !== (originalComment ?? "")) setOriginalComment(candComment ?? "");
    }, [candComment, selectedCandidate, originalForCandidateId, userEdited, originalComment]);

    const hasChanges = (candComment ?? "").trim() !== (originalComment ?? "").trim();
    const isSaveDisabled = !selectedCandidate || !userEdited || !hasChanges || !!isCommentLocked;

    const handleSaveComment = async () => {
        try {
            await Promise.resolve(saveCandidateComment?.());
            setOriginalComment(candComment ?? "");
            setUserEdited(false);
        } catch {
            setToast({ show: true, text: "Save failed", type: "error" });
        }
    };

    if (!selectedCandidate) {
        return (
            <div className="iv-empty">
                <i className="nc-icon nc-chat-33" />
                Select a candidate to see the comments.
            </div>
        );
    }

    return (
        <>
            {isCommentLocked ? (
                <>
                    <div className={`cand-readonly-text ${candComment?.trim() ? "" : "is-empty"}`}>
                        {candComment?.trim() ? candComment : "No comments."}
                    </div>
                    <div className="cand-lock">
                        <i className="nc-icon nc-lock-circle-open" />
                        The candidate is <b>{String(selectedCandidate.status || "").toLowerCase()}</b> — comments can no longer be edited.
                    </div>
                </>
            ) : (
                <>
                    <Input
                        type="textarea"
                        rows={4}
                        className="iv-textarea"
                        placeholder="Write comments about the candidate…"
                        aria-label="Comments about the candidate"
                        value={candComment}
                        onChange={(e) => {
                            setUserEdited(true);
                            setCandComment(e.target.value);
                        }}
                    />
                    <div className="d-flex justify-content-end mt-3">
                        <Button color="primary" className="m-0" onClick={handleSaveComment} disabled={isSaveDisabled}>
                            Save Comments
                        </Button>
                    </div>
                </>
            )}
            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </>
    );
};

export default CandidateComments;
