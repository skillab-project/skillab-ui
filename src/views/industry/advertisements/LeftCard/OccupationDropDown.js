import React, { useEffect, useMemo, useState } from "react";
import { Collapse } from "reactstrap";
import "./OccupationDropdown.css";

// A job ad is Pending → Published → Complete.
export const STATUSES = [
    { key: "pending", label: "Pending" },
    { key: "published", label: "Published" },
    { key: "complete", label: "Complete" },
];

export const statusKey = (status) => {
    const s = String(status || "").trim().toLowerCase();
    if (s === "published") return "published";
    if (s === "pending" || s === "pedding" || s === "draft") return "pending";
    if (s === "complete" || s === "completed") return "complete";
    return "other";
};

export const statusClass = (status) => {
    const k = statusKey(status);
    return k === "other" ? "" : `ja-status--${k}`;
};

export const countByStatus = (jobs = []) =>
    jobs.reduce((acc, j) => {
        const k = statusKey(j.status);
        acc[k] = (acc[k] || 0) + 1;
        return acc;
    }, {});

// Compact per-status counts (only the statuses that occur), e.g. "● 2  ● 1".
export function StatusSummary({ jobs = [] }) {
    const counts = countByStatus(jobs);
    const parts = STATUSES.filter((s) => counts[s.key]);
    if (counts.other) parts.push({ key: "other", label: "Other" });
    const title = parts.map((s) => `${counts[s.key]} ${s.label}`).join(" · ");
    return (
        <span className="ja-summary" title={title}>
            {parts.map((s) => (
                <span key={s.key} className="ja-summary-item">
                    <span className={`ja-job-dot ${s.key === "other" ? "" : `ja-status--${s.key}`}`} />
                    {counts[s.key]}
                </span>
            ))}
        </span>
    );
}

function OccupationDropdown({
    occupations = [],
    onJobAdSelect,
    selectedJobAdId,
    onOccupationSelect,
    selectedOccupationId = null,
    parentDepartmentId = null,
    expandAll = false,
}) {
    const [openIndex, setOpenIndex] = useState(null);
    const [activeJobId, setActiveJobId] = useState(() => selectedJobAdId ?? null);

    // Keep the local selection in sync with the parent (also when it's cleared)
    useEffect(() => {
        if (selectedJobAdId == null) {
            if (activeJobId !== null) setActiveJobId(null);
            return;
        }
        if (selectedJobAdId !== activeJobId) {
            setActiveJobId(selectedJobAdId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedJobAdId]);

    const selectedOccIndex = useMemo(() => {
        if (activeJobId == null) return null;
        const idx = occupations.findIndex((occ) =>
            (occ?.jobTitles ?? []).some((j) => j?.id === activeJobId)
        );
        return idx >= 0 ? idx : null;
    }, [occupations, activeJobId]);

    useEffect(() => {
        if (selectedOccIndex != null) setOpenIndex(selectedOccIndex);
    }, [selectedOccIndex]);

    const handleToggle = (index, occupation) => {
        const nextOpen = openIndex === index ? null : index;
        setOpenIndex(nextOpen);
        // changing occupation clears the job selection
        setActiveJobId(null);
        onJobAdSelect?.(null);
        onOccupationSelect?.({
            id: occupation?.id ?? null,
            name: occupation?.name,
            departmentId: parentDepartmentId ?? null,
        });
    };

    const isOccActive = (occ) => {
        if (selectedOccupationId == null || !occ?.id) return false;
        return Number(selectedOccupationId) === Number(occ.id);
    };

    return (
        <div className="occ-list">
            {occupations.map((occupation, index) => {
                const jobs = occupation.jobTitles || [];
                const isOpen = expandAll || openIndex === index;
                return (
                    <div
                        key={occupation?.id ?? occupation?.name ?? index}
                        className={`ja-occ ${isOpen ? "is-open" : ""} ${isOccActive(occupation) ? "is-active" : ""}`}
                    >
                        <button
                            type="button"
                            className="ja-occ-header"
                            onClick={() => handleToggle(index, occupation)}
                            aria-expanded={isOpen}
                            title={occupation.name}
                        >
                            <span className="ja-occ-name truncate-1">{occupation.name}</span>
                            <StatusSummary jobs={jobs} />
                            <i className="nc-icon nc-minimal-down ja-chevron" />
                        </button>

                        <Collapse isOpen={isOpen}>
                            <div className="ja-jobs">
                                {jobs.map((job, i) => {
                                    const isSelected = job?.id === activeJobId;
                                    const sc = statusClass(job.status);
                                    return (
                                        <button
                                            type="button"
                                            key={job?.id ?? i}
                                            className={`ja-job ${isSelected ? "is-selected" : ""}`}
                                            onClick={() => {
                                                if (!job?.id) return;
                                                setActiveJobId(job.id);
                                                onJobAdSelect?.(job.id);
                                            }}
                                            aria-pressed={isSelected}
                                            title={job?.title ?? ""}
                                        >
                                            <span className={`ja-job-dot ${sc}`} />
                                            <span className="ja-job-title truncate-1">{job.title}</span>
                                            {job.status && <span className={`ja-status ${sc}`}>{job.status}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </Collapse>
                    </div>
                );
            })}
        </div>
    );
}

export default OccupationDropdown;
