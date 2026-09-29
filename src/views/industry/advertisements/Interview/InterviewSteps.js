import React, { useState, useEffect } from "react";
import StepsDnd from "./StepsDnd";
import "./interview.css";

const API_STEP = process.env.REACT_APP_API_URL_HIRING_MANAGEMENT +"/api/v1/step";

export default function InterviewSteps({
    interviewsteps = [],
    onSelect,
    selectedIndex: controlledSelectedIndex,
    interviewId,
    reloadSteps,
    onLocalReorder,
    canEdit = true,
}) {
    const [internalSelectedIndex, setInternalSelectedIndex] = useState(null);
    const selectedIndex = controlledSelectedIndex ?? internalSelectedIndex;

    useEffect(() => {
        if (
            selectedIndex != null &&
            interviewsteps?.length > 0 &&
            selectedIndex >= interviewsteps.length
        ) {
            const safe = interviewsteps.length - 1;
            setInternalSelectedIndex(safe);
            const step = interviewsteps[safe];
            onSelect?.(safe, step?.id ?? null, step ?? null);
        }
    }, [interviewsteps, selectedIndex, onSelect]);

    const handleSelect = (index) => {
        if (controlledSelectedIndex == null) setInternalSelectedIndex(index);
        const step = interviewsteps?.[index];
        onSelect?.(index, step?.id ?? null, step ?? null);
    };

    const applyServerReorder = async (_stepId, from, to) => {
        if (from === to) return;
        if (!interviewId) throw new Error("Missing interviewId for reorder");

        const orderedIds = interviewsteps.map((s) => s.id);
        const [moved] = orderedIds.splice(from, 1);
        orderedIds.splice(to, 0, moved);

        const r = await fetch(`${API_STEP}/interviews/${interviewId}/steps/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
            body: JSON.stringify({ stepIds: orderedIds }),
        });
        if (!r.ok) {
            const txt = await r.text().catch(() => "");
            throw new Error(`reorder-failed (${r.status}) ${txt}`);
        }
        await reloadSteps?.();
    };

    const updateDescription = async (stepId, description) => {
        const r = await fetch(`${API_STEP}/${stepId}/description`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
            body: JSON.stringify({ description: description ?? "" }),
        });
        if (!r.ok) {
            const txt = await r.text().catch(() => "");
            throw new Error(`failed-to-update-step (${r.status}) ${txt}`);
        }
        await reloadSteps?.();
    };

    return (
        <StepsDnd
            steps={interviewsteps}
            selectedIndex={selectedIndex ?? 0}
            onSelect={handleSelect}
            onReorder={onLocalReorder}
            onApplyServerReorder={applyServerReorder}
            onUpdateDescription={canEdit ? updateDescription : undefined}
            readOnlyDescription={!canEdit}
            showSaveButton={!!canEdit}
            dndDisabled={!canEdit}
        />
    );
}
