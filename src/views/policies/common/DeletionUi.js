import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Collapse,
    FormGroup,
    Input,
    Label,
    ListGroup,
    ListGroupItem,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Spinner,
} from 'reactstrap';

/** Small trash-can button meant to sit on the right side of a list row. */
export function DeleteIconButton({ onClick, title = 'Delete', disabled = false, ...rest }) {
    return (
        <Button
            color="link"
            className="text-danger p-0 ml-2"
            title={title}
            aria-label={title}
            disabled={disabled}
            onClick={(e) => {
                // Rows are clickable (they select the item) - don't select when deleting
                e.stopPropagation();
                onClick(e);
            }}
            style={{ lineHeight: 1 }}
            {...rest}
        >
            <i className="fa fa-trash" />
        </Button>
    );
}

/**
 * Confirmation dialog that lets the user choose between a soft delete (move to trash,
 * restorable) and a hard delete (permanent). Either option can be disabled with a reason.
 */
export function SoftHardDeleteModal({
    isOpen,
    toggle,
    entityLabel,          // "KPI" | "Metric"
    name,
    details = null,       // extra content (e.g. what uses this item)
    loading = false,      // details still loading
    softBlockedReason = null,
    hardBlockedReason = null,
    softDescription,
    hardDescription,
    onConfirm,            // async (hard: boolean) => void
}) {
    const [mode, setMode] = useState('soft');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    // Reset every time the dialog opens, and pick the first allowed option
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setBusy(false);
            setMode(softBlockedReason && !hardBlockedReason ? 'hard' : 'soft');
        }
    }, [isOpen, softBlockedReason, hardBlockedReason]);

    const selectedBlocked = mode === 'soft' ? softBlockedReason : hardBlockedReason;

    const handleConfirm = async () => {
        setBusy(true);
        setError(null);
        try {
            await onConfirm(mode === 'hard');
        } catch (e) {
            setError(e.message || String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={busy ? undefined : toggle}>
            <ModalHeader toggle={busy ? undefined : toggle}>Delete {entityLabel}: {name}</ModalHeader>
            <ModalBody>
                {loading ? (
                    <div className="text-center p-3"><Spinner size="sm" /> Checking where it is used...</div>
                ) : (
                    <>
                        {details}
                        <FormGroup check className="mb-2">
                            <Label check>
                                <Input
                                    type="radio"
                                    name="deleteMode"
                                    checked={mode === 'soft'}
                                    disabled={!!softBlockedReason}
                                    onChange={() => setMode('soft')}
                                />{' '}
                                <strong>Move to trash</strong> (soft delete)
                                <div className="text-muted small">{softDescription}</div>
                                {softBlockedReason && <div className="text-warning small">{softBlockedReason}</div>}
                            </Label>
                        </FormGroup>
                        <FormGroup check>
                            <Label check>
                                <Input
                                    type="radio"
                                    name="deleteMode"
                                    checked={mode === 'hard'}
                                    disabled={!!hardBlockedReason}
                                    onChange={() => setMode('hard')}
                                />{' '}
                                <strong className="text-danger">Delete permanently</strong> (hard delete)
                                <div className="text-muted small">{hardDescription}</div>
                                {hardBlockedReason && <div className="text-warning small">{hardBlockedReason}</div>}
                            </Label>
                        </FormGroup>
                        {error && <Alert color="danger" className="mt-3 mb-0">{error}</Alert>}
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle} disabled={busy}>Cancel</Button>
                <Button
                    color={mode === 'hard' ? 'danger' : 'warning'}
                    onClick={handleConfirm}
                    disabled={busy || loading || !!selectedBlocked}
                >
                    {busy && <Spinner size="sm" className="mr-1" />}
                    {mode === 'hard' ? 'Delete permanently' : 'Move to trash'}
                </Button>
            </ModalFooter>
        </Modal>
    );
}

/** Collapsible "Trash" card listing soft-deleted items with Restore / Delete permanently actions. */
export function TrashCard({ title = 'Trash', items, renderLabel, onRestore, onHardDelete, emptyText = 'Nothing here.' }) {
    const [open, setOpen] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const run = async (id, action) => {
        setBusyId(id);
        try {
            await action();
        } finally {
            setBusyId(null);
        }
    };

    return (
        <Card className="mt-4">
            <CardHeader style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
                <CardTitle tag="h5" className="d-flex justify-content-between align-items-center mb-0">
                    <span><i className="fa fa-trash mr-2" />{title} ({items.length})</span>
                    <i className={open ? 'fa fa-chevron-up' : 'fa fa-chevron-down'} />
                </CardTitle>
            </CardHeader>
            <Collapse isOpen={open}>
                <CardBody style={{ padding: 0 }}>
                    {items.length === 0 ? (
                        <p className="text-muted p-3 mb-0">{emptyText}</p>
                    ) : (
                        <ListGroup flush>
                            {items.map(item => (
                                <ListGroupItem key={item.id} className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">{renderLabel(item)}</span>
                                    <span className="text-nowrap">
                                        {busyId === item.id ? <Spinner size="sm" /> : (
                                            <>
                                                <Button size="sm" color="info" outline className="m-0" title="Restore"
                                                        onClick={() => run(item.id, () => onRestore(item))}>
                                                    <i className="fa fa-undo" /> Restore
                                                </Button>
                                                <Button size="sm" color="danger" outline className="my-0 ml-1" title="Delete permanently"
                                                        onClick={() => run(item.id, () => onHardDelete(item))}>
                                                    <i className="fa fa-trash" />
                                                </Button>
                                            </>
                                        )}
                                    </span>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    )}
                </CardBody>
            </Collapse>
        </Card>
    );
}
