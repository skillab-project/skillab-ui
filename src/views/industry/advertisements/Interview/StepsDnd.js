import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Input, Button } from "reactstrap";

export default function StepsDnd({
    steps = [],
    selectedIndex = 0,
    onSelect,
    onReorder,
    onApplyServerReorder,

    // when undefined, descriptions can't be saved
    onUpdateDescription,

    // flags
    readOnlyDescription = false,
    showSaveButton = true,
    dndDisabled = false,
}) {
    const [openIndex, setOpenIndex] = useState(null);
    const [draft, setDraft] = useState({});
    const [savingId, setSavingId] = useState(null);

    const toggleOpen = (idx) => {
        setOpenIndex((prev) => (prev === idx ? null : idx));
        onSelect?.(idx);
    };

    const handleDragEnd = async (result) => {
        if (dndDisabled) return;
        const { source, destination } = result || {};
        if (!destination) return;
        const from = source.index;
        const to = destination.index;
        if (from === to) return;

        const stepId = steps[from]?.id;
        onReorder?.(from, to); // optimistic
        try {
            await onApplyServerReorder?.(stepId, from, to);
            setOpenIndex((prev) => {
                if (prev == null) return prev;
                if (prev === from) return to;
                if (from < prev && to >= prev) return prev - 1;
                if (from > prev && to <= prev) return prev + 1;
                return prev;
            });
        } catch (e) {
            onReorder?.(to, from); // revert
            console.error(e);
        }
    };

    const startEdit = (stepId, value) => {
        if (readOnlyDescription) return;
        setDraft((d) => ({ ...d, [stepId]: value ?? "" }));
    };

    const commitEdit = async (stepId) => {
        if (readOnlyDescription || !onUpdateDescription) return;
        if (!(stepId in draft)) return; // nothing changed
        const text = draft[stepId] ?? "";
        if (savingId === stepId) return;
        setSavingId(stepId);
        try {
            await onUpdateDescription(stepId, text);
            setDraft((d) => {
                const next = { ...d };
                delete next[stepId];
                return next;
            });
        } catch (e) {
            console.error(e);
        } finally {
            setSavingId(null);
        }
    };

    if (steps.length === 0) {
        return (
            <div className="iv-empty">
                <i className="nc-icon nc-bullet-list-67" />
                No interview steps yet.
                {!dndDisabled && <> Use <b>Add Step</b> to create the first one (e.g. Technical, HR Round).</>}
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="steps-accordion">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="iv-steps">
                        {steps.map((s, idx) => {
                            const isSelected = idx === selectedIndex;
                            const isOpen = idx === openIndex;
                            const value = draft[s.id] ?? s.description ?? "";
                            const dirty = s.id in draft && draft[s.id] !== (s.description ?? "");

                            return (
                                <Draggable
                                    key={s.id ?? idx}
                                    draggableId={`step-${s.id ?? idx}`}
                                    index={idx}
                                    isDragDisabled={dndDisabled}
                                >
                                    {(dragProvided, snapshot) => (
                                        <div
                                            ref={dragProvided.innerRef}
                                            {...dragProvided.draggableProps}
                                            className={[
                                                "iv-step",
                                                isSelected ? "is-selected" : "",
                                                isOpen ? "is-open" : "",
                                                snapshot.isDragging ? "is-dragging" : "",
                                            ].join(" ")}
                                            style={dragProvided.draggableProps.style}
                                        >
                                            <div
                                                className="iv-step-header"
                                                onClick={() => toggleOpen(idx)}
                                                role="button"
                                                aria-expanded={isOpen}
                                            >
                                                {!dndDisabled && (
                                                    <span
                                                        {...dragProvided.dragHandleProps}
                                                        className="iv-drag"
                                                        title="Drag to reorder"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        ⠿
                                                    </span>
                                                )}
                                                <span className="iv-step-num">{idx + 1}</span>
                                                <span className="iv-step-text">
                                                    <span className="iv-step-title" title={s.title}>{s.title || "Untitled step"}</span>
                                                    {!isOpen && (
                                                        <span className="iv-step-desc">
                                                            {s.description ? s.description : "No description yet"}
                                                        </span>
                                                    )}
                                                </span>
                                                <i className="nc-icon nc-minimal-down iv-chevron" />
                                            </div>

                                            {isOpen && (
                                                <div className="iv-step-body">
                                                    <label className="iv-field-label" htmlFor={`iv-step-desc-${s.id}`}>
                                                        Step description
                                                    </label>
                                                    <Input
                                                        id={`iv-step-desc-${s.id}`}
                                                        type="textarea"
                                                        rows={3}
                                                        className="iv-textarea"
                                                        value={value}
                                                        onChange={(e) => startEdit(s.id, e.target.value)}
                                                        onBlur={() => commitEdit(s.id)}
                                                        placeholder="What happens in this step and what should be assessed?"
                                                        readOnly={readOnlyDescription}
                                                        disabled={readOnlyDescription}
                                                    />

                                                    {showSaveButton && onUpdateDescription && (
                                                        <div className="d-flex justify-content-end mt-2">
                                                            <Button
                                                                size="sm"
                                                                color="primary"
                                                                className="m-0"
                                                                onClick={() => commitEdit(s.id)}
                                                                disabled={savingId === s.id || !dirty}
                                                            >
                                                                {savingId === s.id ? "Saving…" : "Save step"}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}
