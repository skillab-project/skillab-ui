import React, { useState } from "react";
import { Button, Spinner } from "reactstrap";
import CandidateDropdown from "./CandidateDropDown";
import AddCandidateModal from "./AddCandidateModal";
import "./Candidates.css";

/**
 * "Candidates" section of the Candidates tab: header with Add Candidate and
 * the list of the job ad's candidates.
 */
const CandidateListPanel = ({
    loadingCandidates,
    errCandidates,
    candidates,
    setSelectedCandidate,
    selectedCandidate,
    jobAdId,
    onCreated,
}) => {
    const [showAdd, setShowAdd] = useState(false);

    return (
        <section className="iv-section iv-section--head-center">
            <div className="iv-section-head">
                <div>
                    <h5 className="iv-section-title">Candidates</h5>
                    <p className="iv-section-sub">
                        {candidates.length
                            ? `${candidates.length} candidate${candidates.length === 1 ? "" : "s"} — select one to evaluate them below.`
                            : "People applying for this job ad."}
                    </p>
                </div>
                <div className="iv-actions">
                    <Button color="primary" onClick={() => setShowAdd(true)}>
                        <i className="nc-icon nc-simple-add mr-1" style={{ verticalAlign: "middle" }} /> Add Candidate
                    </Button>
                </div>
            </div>

            {loadingCandidates ? (
                <div className="iv-empty">
                    <Spinner size="sm" className="mr-2" /> Loading candidates…
                </div>
            ) : errCandidates ? (
                <div className="iv-empty text-danger">Could not load the candidates ({errCandidates}).</div>
            ) : (
                <CandidateDropdown
                    candidates={candidates}
                    selectedId={selectedCandidate?.id ?? null}
                    emptyText="No candidates yet. Use Add Candidate to add the first one."
                    onSelect={(cand) => setSelectedCandidate((prev) => (prev?.id === cand?.id ? null : cand))}
                />
            )}

            <AddCandidateModal
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                jobAdId={jobAdId}
                onCreated={onCreated}
            />
        </section>
    );
};

export default CandidateListPanel;
