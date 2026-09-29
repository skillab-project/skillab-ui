import React from 'react';
import { Button, Input, Row, Col } from 'reactstrap';
import StepsTree from './StepsTree';
import QuestionSkillsEditor from './QuestionSkillsEditor';
import AddQuestionModal from './AddQuestionModal';
import ConfirmModal from '../Hire/ConfirmModal';
import '../Interview/interview.css';
import './questions.css';


const normalizeStatus = (s) =>
    String(s ?? '').replace(/\u00A0/g, ' ').trim().toLowerCase().replace(/\s+/g, '');
const isEditableStatus = (raw) => {
    const n = normalizeStatus(raw);
    return n === 'pending' || n === 'pedding' || n === 'draft';
};

// safe toast helper
const toast = (msg, type = 'success', ttl = 2500) => {
    if (window.hfToast) window.hfToast(msg, type, ttl);
    else window.dispatchEvent(new CustomEvent('hf:toast', { detail: { message: msg, type, ttl } }));
};

export default function Questions({ selectedJobAdId }) {
    const [allSkills, setAllSkills] = React.useState([]);
    const [requiredSkills, setRequiredSkills] = React.useState([]);
    const [questionDesc, setQuestionDesc] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const editorRef = React.useRef(null);
    const [selectedQuestionId, setSelectedQuestionId] = React.useState(null);

    const [status, setStatus] = React.useState(null);
    const canEdit = React.useMemo(() => isEditableStatus(status), [status]);

    const [steps, setSteps] = React.useState([]);
    const [activeStepId, setActiveStepId] = React.useState(null);

    const [showAdd, setShowAdd] = React.useState(false);
    const openCreateModal = () => setShowAdd(true);
    const closeCreateModal = () => setShowAdd(false);

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    /* ===== Skills list (για το δεξί panel) ===== */
    React.useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL_HIRING_MANAGEMENT}/skills`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setAllSkills((data || []).map((s) => (typeof s === 'string' ? s : (s?.title ?? s?.name ?? ''))).filter(Boolean)))
            .catch(() => setAllSkills([]));
    }, []);

    /* ===== Φόρτωση περιγραφής/skills ανά question ===== */
    React.useEffect(() => {
        if (!selectedQuestionId) {
            setQuestionDesc('');
            setRequiredSkills([]);
            return;
        }
        fetch(`${process.env.REACT_APP_API_URL_HIRING_MANAGEMENT}/api/v1/question/${selectedQuestionId}/details`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => {
                setQuestionDesc(d?.description || '');
                setRequiredSkills(((d?.skills) || []).map((s) => (typeof s === 'string' ? s : (s?.title ?? s?.name ?? ''))).filter(Boolean));
            })
            .catch(() => {
                setQuestionDesc('');
                setRequiredSkills([]);
            });
    }, [selectedQuestionId]);

    // Bring the editor into view when a question is picked
    const selectQuestion = React.useCallback((id) => {
        setSelectedQuestionId(id);
        if (id) {
            setTimeout(() => editorRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 50);
        }
    }, []);

    /* ===== Κατάσταση Job Ad ===== */
    React.useEffect(() => {
        if (!selectedJobAdId) {
            setStatus(null);
            return;
        }
        fetch(`${process.env.REACT_APP_API_URL_HIRING_MANAGEMENT}/api/v1/jobAds/details?jobAdId=${selectedJobAdId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setStatus(d?.status ?? null))
            .catch(() => setStatus(null));
    }, [selectedJobAdId]);

    /* ===== Αποθήκευση ===== */
    const handleSave = async () => {
        if (!selectedQuestionId) return;
        setSaving(true);
        try {
            const resp = await fetch(`${process.env.REACT_APP_API_URL_HIRING_MANAGEMENT}/api/v1/question/${selectedQuestionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
                body: JSON.stringify({
                    description: questionDesc || '',
                    skillNames: requiredSkills || [],
                }),
            });
            if (!resp.ok) throw new Error();
            toast('Question updated', 'success');
        } catch {
            toast('Update failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ===== Διαγραφή ===== */
    const askDelete = () => {
        if (!selectedQuestionId) return;
        setConfirmOpen(true);
    };

    const handleDeleteConfirmed = async () => {
        if (!selectedQuestionId) {
            setConfirmOpen(false);
            return;
        }
        setDeleting(true);
        try {
            const r = await fetch(`${process.env.REACT_APP_API_URL_HIRING_MANAGEMENT}/api/v1/question/${selectedQuestionId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
            if (!r.ok) throw new Error('delete-failed');

            const deletedId = selectedQuestionId;
            setSelectedQuestionId(null);
            setQuestionDesc('');
            setRequiredSkills([]);

            window.dispatchEvent(
                new CustomEvent('question-deleted', {
                    detail: { questionId: deletedId, stepId: activeStepId || null },
                })
            );

            setConfirmOpen(false);
            toast('Question deleted', 'success');
        } catch (e) {
            setConfirmOpen(false);
            toast('Delete failed', 'error');
        } finally {
            setDeleting(false);
        }
    };

    if (!selectedJobAdId) {
        return <p className="text-muted" style={{ padding: '1rem' }}>Select a Job Ad to view Questions.</p>;
    }

    const handleCreated = ({ stepId, question }) => {
        window.dispatchEvent(new CustomEvent('question-created', { detail: { stepId, question } }));
        toast('Question created', 'success');
    };

    return (
        <>
            <div className="iv-page">
                {/* ---------- Steps & their questions ---------- */}
                <section className="iv-section iv-section--head-center">
                    <div className="iv-section-head">
                        <div>
                            <h5 className="iv-section-title">Questions by Step</h5>
                            <p className="iv-section-sub">
                                {canEdit
                                    ? 'Open a step to see its questions, click a question to edit it below, drag ⠿ to reorder.'
                                    : 'Open a step to see its questions, click a question to view its details below.'}
                            </p>
                        </div>
                        {canEdit ? (
                            <div className="iv-actions">
                                <Button color="primary" onClick={openCreateModal} disabled={steps.length === 0}>
                                    <i className="nc-icon nc-simple-add mr-1" style={{ verticalAlign: 'middle' }} /> Add Question
                                </Button>
                                <Button color="danger" outline disabled={!selectedQuestionId} onClick={askDelete}
                                    title={selectedQuestionId ? 'Delete the selected question' : 'Select a question to delete'}>
                                    <i className="nc-icon nc-simple-remove mr-1" style={{ verticalAlign: 'middle' }} /> Delete Question
                                </Button>
                            </div>
                        ) : (
                            <span className="iv-readonly-note">
                                <i className="nc-icon nc-lock-circle-open" /> Read-only once the job ad is published
                            </span>
                        )}
                    </div>

                    <StepsTree
                        selectedJobAdId={selectedJobAdId}
                        canEdit={canEdit}
                        selectedQuestionId={selectedQuestionId}
                        onSelectQuestion={selectQuestion}
                        onStepsChange={setSteps}
                        onSelectStep={setActiveStepId}
                    />
                </section>

                {/* ---------- Selected question ---------- */}
                <section className="iv-section iv-section--head-center" ref={editorRef}>
                    <div className="iv-section-head">
                        <div>
                            <h5 className="iv-section-title">Question Details</h5>
                            <p className="iv-section-sub">The description of the selected question and the skills it assesses.</p>
                        </div>
                    </div>

                    {!selectedQuestionId ? (
                        <div className="iv-empty">
                            <i className="nc-icon nc-tap-01" />
                            Select a question above to see its description and skills.
                        </div>
                    ) : (
                        <>
                            {/* Side by side on very wide screens, stacked otherwise */}
                            <Row>
                                <Col xl="6" className="mb-4">
                                    <label className="iv-field-label" htmlFor="q-description">Question description</label>
                                    <Input
                                        id="q-description"
                                        type="textarea"
                                        rows={7}
                                        className="iv-textarea"
                                        value={questionDesc}
                                        onChange={(e) => setQuestionDesc(e.target.value)}
                                        placeholder="What a good answer should cover, how to score it…"
                                        readOnly={!canEdit}
                                        disabled={!canEdit}
                                    />
                                </Col>
                                <Col xl="6" className="mb-4">
                                    <label className="iv-field-label">Skills assessed</label>
                                    <QuestionSkillsEditor
                                        allSkills={allSkills}
                                        skills={requiredSkills}
                                        onChange={setRequiredSkills}
                                        disabled={!canEdit}
                                    />
                                </Col>
                            </Row>

                            {canEdit && (
                                <div className="d-flex justify-content-end">
                                    <Button color="primary" className="m-0" onClick={handleSave} disabled={saving}>
                                        {saving ? 'Saving…' : 'Save Question'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>

            {/* Modal δημιουργίας */}
            <AddQuestionModal
                isOpen={showAdd}
                toggle={closeCreateModal}
                steps={steps}
                defaultStepId={activeStepId}
                onCreated={(payload) => {
                    handleCreated(payload);
                    closeCreateModal();
                }}
            />

            {/* Modal επιβεβαίωσης διαγραφής */}
            <ConfirmModal
                isOpen={confirmOpen}
                title="Delete Question"
                message={
                    <div>
                        Are you sure you want to delete this question?
                        <br />
                        This action cannot be undone.
                    </div>
                }
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="danger"
                loading={deleting}
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
}
