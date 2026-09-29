import React, { useState } from "react";
import { Collapse, Button } from "reactstrap";
import { FaDownload } from "react-icons/fa";
import { initials, statusClass } from "./candidateUi";
import "./Candidates.css";

const API_BASE = process.env.REACT_APP_API_URL_HIRING_MANAGEMENT;

/** Small toast without libs */
function TinyToast({ show, text, type = "info", onHide }) {
    React.useEffect(() => {
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

function getCvName(cvPath, fallback = "CV") {
    if (!cvPath) return fallback;
    let s = String(cvPath);
    if (s.startsWith("classpath:")) s = s.slice("classpath:".length);
    return s.split(/[\\/]/).pop() || fallback;
}

/**
 * Candidate list: one card per candidate (initials, name, email, status);
 * clicking selects it and shows email + CV download.
 *
 * Props:
 * - candidates: [{ id, name, email, status, cv, cvName }, ...]
 * - onSelect:  (candidate|null) => void
 * - renderLeft?: (candidate, index) => ReactNode   extra info shown before the status (e.g. score)
 * - selectedId?: number | null   when given, the component is controlled
 * - emptyText?: string
 */
function CandidateDropdown({ candidates = [], onSelect, renderLeft, selectedId, emptyText = "No candidates yet." }) {
    const [openIndex, setOpenIndex] = useState(null);
    const isControlled = selectedId !== undefined;

    const [toast, setToast] = useState({ show: false, text: "", type: "success" });
    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    const handleToggle = (index, cand) => {
        if (isControlled) {
            const nextId = cand?.id ?? null;
            onSelect?.(selectedId === nextId ? null : cand);
            return;
        }
        const next = openIndex === index ? null : index;
        setOpenIndex(next);
        onSelect?.(next === null ? null : cand);
    };

    const handleDownload = (cand) => {
        if (!cand?.id) return;
        window.open(`${API_BASE}/api/v1/candidates/${cand.id}/cv`, "_blank", "noopener,noreferrer");
        setToast({ show: true, text: "CV download started!", type: "success" });
    };

    const openId = isControlled ? selectedId : openIndex !== null ? candidates[openIndex]?.id ?? null : null;

    if (!candidates.length) {
        return (
            <div className="iv-empty">
                <i className="nc-icon nc-single-02" />
                {emptyText}
            </div>
        );
    }

    return (
        <div className="cand-list">
            {candidates.map((c, index) => {
                const isOpen = openId === c.id;
                return (
                    <div key={c.id ?? index} className={`cand-item ${isOpen ? "is-selected" : ""}`}>
                        <button
                            type="button"
                            className="cand-row"
                            onClick={() => handleToggle(index, c)}
                            aria-expanded={isOpen}
                        >
                            <span className="cand-avatar">{initials(c.name)}</span>
                            <span className="cand-main">
                                <span className="cand-name" title={c.name}>{c.name || "Unnamed candidate"}</span>
                                {c.email && <span className="cand-sub">{c.email}</span>}
                            </span>
                            {renderLeft && renderLeft(c, index)}
                            {c.status && <span className={`cand-status ${statusClass(c.status)}`}>{c.status}</span>}
                            <i className="nc-icon nc-minimal-down cand-chevron" />
                        </button>

                        <Collapse isOpen={isOpen}>
                            <div className="cand-details">
                                <span><b>Email:</b>{c.email || "—"}</span>
                                <span>
                                    <b>CV:</b>
                                    {c.cvName || getCvName(c.cv || c.cvPath, "—")}
                                    <Button
                                        size="sm"
                                        color="info"
                                        outline
                                        onClick={() => handleDownload(c)}
                                        title="Download CV"
                                    >
                                        <FaDownload size={11} className="mr-1" /> Download
                                    </Button>
                                </span>
                            </div>
                        </Collapse>
                    </div>
                );
            })}

            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </div>
    );
}

export default CandidateDropdown;
