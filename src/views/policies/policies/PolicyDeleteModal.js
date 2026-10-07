import React, { useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Spinner,
} from 'reactstrap';
import { apiErrorMessage, deletePolicy, getPolicyDeletionPreview } from '../common/policyApi';

/**
 * Confirmation dialog for permanently deleting a policy. It first asks the backend what will be
 * removed (KPIs, KPI history, metrics used only by this policy) and what is kept because other
 * policies still need it.
 */
function PolicyDeleteModal({ policy, isOpen, toggle, onDeleted }) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [deleteOrphanMetrics, setDeleteOrphanMetrics] = useState(true);

    useEffect(() => {
        if (!isOpen || !policy) return;
        let cancelled = false;
        setPreview(null);
        setError(null);
        setBusy(false);
        setDeleteOrphanMetrics(true);
        setLoading(true);
        getPolicyDeletionPreview(policy.id)
            .then(data => { if (!cancelled) setPreview(data); })
            .catch(e => { if (!cancelled) setError(`Could not load what will be deleted: ${apiErrorMessage(e)}`); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen, policy]);

    const handleDelete = async () => {
        setBusy(true);
        setError(null);
        try {
            const result = await deletePolicy(policy.id, deleteOrphanMetrics);
            await onDeleted(policy, result);
        } catch (e) {
            setError(`Failed to delete policy: ${apiErrorMessage(e)}`);
            setBusy(false);
        }
    };

    const close = busy ? undefined : toggle;

    return (
        <Modal isOpen={isOpen} toggle={close} size="lg">
            <ModalHeader toggle={close}>Delete policy: {policy?.name}</ModalHeader>
            <ModalBody>
                {loading && <div className="text-center p-3"><Spinner size="sm" /> Checking related data...</div>}

                {preview && (
                    <>
                        <p>
                            This permanently deletes the policy <strong>{preview.policyName}</strong> and
                            cannot be undone.
                        </p>

                        <h6>KPIs that will be deleted ({preview.kpis.length})</h6>
                        {preview.kpis.length > 0 ? (
                            <ul className="mb-1">
                                {preview.kpis.map(k => (
                                    <li key={k.id}>
                                        {k.name} {k.deleted && <Badge color="secondary">in trash</Badge>}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-muted">None</p>}
                        {preview.kpiReportCount > 0 && (
                            <p className="text-muted small">Including {preview.kpiReportCount} historical KPI value(s).</p>
                        )}

                        <h6 className="mt-3">Metrics used only by this policy ({preview.metricsToDelete.length})</h6>
                        {preview.metricsToDelete.length > 0 ? (
                            <>
                                <ul className="mb-2">
                                    {preview.metricsToDelete.map(m => (
                                        <li key={m.id}>{m.name} ({m.symbol})</li>
                                    ))}
                                </ul>
                                <FormGroup check>
                                    <Label check>
                                        <Input
                                            type="checkbox"
                                            checked={deleteOrphanMetrics}
                                            onChange={() => setDeleteOrphanMetrics(v => !v)}
                                        />{' '}
                                        Also delete these metrics and their values
                                    </Label>
                                </FormGroup>
                            </>
                        ) : <p className="text-muted">None</p>}

                        {preview.metricsKept.length > 0 && (
                            <>
                                <h6 className="mt-3">Metrics kept because other policies use them ({preview.metricsKept.length})</h6>
                                <ul className="mb-0">
                                    {preview.metricsKept.map(({ metric, usedBy }) => (
                                        <li key={metric.id}>
                                            {metric.name} ({metric.symbol})
                                            <span className="text-muted small">
                                                {' '}— used by {usedBy.map(k => `${k.name}${k.policyName ? ` (${k.policyName})` : ''}`).join(', ')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </>
                )}

                {error && <Alert color="danger" className="mt-3 mb-0">{error}</Alert>}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle} disabled={busy}>Cancel</Button>
                <Button color="danger" onClick={handleDelete} disabled={busy || loading || !preview}>
                    {busy && <Spinner size="sm" className="mr-1" />}
                    Delete policy
                </Button>
            </ModalFooter>
        </Modal>
    );
}

export default PolicyDeleteModal;
