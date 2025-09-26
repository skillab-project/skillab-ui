// Description/RecommendedSkillsPanel.jsx
import React, {
    useState, useMemo, useRef, useLayoutEffect, useEffect, useCallback,
} from "react";
import { Input, Row, Col } from "reactstrap";
import "./description-card.css";

export default function RecommendedSkillsPanel({
    panelHeight,
    label = "Recommended skills",
    searchPlaceholder = "Search within recommended...",
    jobAdId,
    description,
    requiredSkills = [],
}) {
    const [searchText, setSearchText] = useState("");
    const [toast, setToast] = useState("");

    const items = [];
    const filtered = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        return q ? items.filter((s) => (s || "").toLowerCase().includes(q)) : items;
    }, [searchText]);

    const boxRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const actionRef = useRef(null);
    const [listH, setListH] = useState(240);

    const recalcInsideBox = useCallback(() => {
        const box = boxRef.current, inp = inputRef.current, list = listRef.current, act = actionRef.current;
        if (!box || !inp || !list) return;

        const boxHeight = typeof panelHeight === "number" ? panelHeight : box.clientHeight;
        const csBox = getComputedStyle(box);
        const paddings = parseFloat(csBox.paddingTop || "0") + parseFloat(csBox.paddingBottom || "0");
        const inputH = inp.offsetHeight || 38;
        const listMt = parseFloat(getComputedStyle(list).marginTop || "0");
        const actH = act ? act.offsetHeight || 0 : 0;
        const actMt = act ? parseFloat(getComputedStyle(act).marginTop || "0") : 0;

        const inner = Math.max(100, boxHeight - paddings - inputH - listMt - actH - actMt);
        setListH((prev) => (Math.abs(prev - inner) > 1 ? inner : prev));
    }, [panelHeight]);

    const kickInside = useCallback(() => {
        recalcInsideBox();
        requestAnimationFrame(recalcInsideBox);
        setTimeout(recalcInsideBox, 0);
        setTimeout(recalcInsideBox, 120);
        if (document?.fonts?.ready) document.fonts.ready.then(recalcInsideBox);
    }, [recalcInsideBox]);

    useLayoutEffect(() => { kickInside(); }, [kickInside]);
    useEffect(() => {
        let raf = 0;
        const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(kickInside); };
        window.addEventListener("resize", onResize);
        const t = setTimeout(kickInside, 0);
        return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); clearTimeout(t); };
    }, [kickInside, searchText, panelHeight]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const hitEndpoint = async () => {
        try {
            const url = `${process.env.REACT_APP_API_URL_HIRING_MANAGEMENT}/jobAds/${jobAdId}/recommended-skills`;
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, requiredSkills }),
            });
            throw new Error("Not implemented");
        } catch {
            showToast("❌ Failed to fetch recommended skills!");
        }
    };

    return (
        <>
            {toast && <div className="dc-toast">{toast}</div>}

            <Row className="rsp-root-row">
                <Col className="desc-col">
                    {label ? (
                        <Row className="mb-2 desc-label-row">
                            <Col><label className="description-labels">{label}</label></Col>
                        </Row>
                    ) : null}

                    <Row className={`rsp-content-row ${label ? "has-label" : ""}`}>
                        <Col className="desc-col">
                            {/* ✅ ΕΔΩ προστέθηκε και η boxStyle για το πλαίσιο */}
                            <div ref={boxRef} className="boxStyle dc-box dc-box--skills">
                                <Input
                                    innerRef={inputRef}
                                    type="text"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="dc-input"
                                />

                                <div
                                    ref={listRef}
                                    className="rsp-list selected-skills-container skills-scroll mt-3"
                                    style={{ "--list-h": `${Math.round(listH)}px` }}
                                >
                                    <span className="description-labels">No recommendations.</span>
                                </div>

                                <div
                                    ref={actionRef}
                                    className="dc-action"
                                    onClick={hitEndpoint}
                                    title="Get recommended skills"
                                >
                                    <span className="dc-ai-badge">AI</span>
                                    <span>Get recommended skills</span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </>
    );
}
