import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    Card, CardHeader, CardBody, CardFooter, CardTitle,
    Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane,
    Input, Table, Badge, Alert, Collapse, Spinner, Label, FormGroup,
    Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import classnames from "classnames";
import axios from "axios";

const API = process.env.REACT_APP_API_URL_CURRICULUM_SKILLS;
const DIVERSITY = process.env.REACT_APP_API_URL_SKILLS_DIVERSITY;

const errText = (err, fallback) =>
    err?.response?.data?.detail || err?.message || fallback;

// Bearer token for POSTs through the authenticated user-management gateway.
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` });

const Recommendations = () => {
    const [currentActiveTab, setCurrentActiveTab] = useState("1");

    // Shared: "your" university
    const [universities, setUniversities] = useState([]);
    const [selectedUnivId, setSelectedUnivId] = useState("");
    const [loadingUnis, setLoadingUnis] = useState(false);
    const [msg, setMsg] = useState(null); // {type, text}

    // similar universities
    const [simTopN, setSimTopN] = useState(5);
    const [similar, setSimilar] = useState(null);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [profiles, setProfiles] = useState({});      // {univId: profile|null|'loading'}
    const [openProfile, setOpenProfile] = useState(null);

    // course recommendations for an existing program
    const [programs, setPrograms] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [recTopN, setRecTopN] = useState(10);
    const [recs, setRecs] = useState(null);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [openRec, setOpenRec] = useState(null);

    // ---- Skill Recommendations (short-term skill-gap) ----
    const [occupations, setOccupations] = useState([]);
    const [occFilter, setOccFilter] = useState("");
    const [selectedOccupations, setSelectedOccupations] = useState([]);
    const [sgTitle, setSgTitle] = useState("");
    const [sgDescription, setSgDescription] = useState("");
    const [sgActiveTitle, setSgActiveTitle] = useState(null); // title of the results on screen
    const [sgCountry, setSgCountry] = useState("");
    const [sgUniversity, setSgUniversity] = useState("");
    const [sgThreshold, setSgThreshold] = useState(0);
    const [sgTopN, setSgTopN] = useState(10);
    const [sgRunning, setSgRunning] = useState(false);
    const [sgRunId, setSgRunId] = useState(null);
    const [sgStatus, setSgStatus] = useState(null);      // running | completed
    const [sgSummary, setSgSummary] = useState(null);    // {hot_skills, oversupplied_skills, ...}
    const [sgLoading, setSgLoading] = useState(false);
    const [sgOpen, setSgOpen] = useState(null);          // expanded skill key
    const [sgMsg, setSgMsg] = useState(null);
    // ---- past skill-gap analyses ----
    const [sgRuns, setSgRuns] = useState([]);
    const [sgRunsLoading, setSgRunsLoading] = useState(false);
    const [sgShowPastModal, setSgShowPastModal] = useState(false);
    const [sgActiveFilters, setSgActiveFilters] = useState(null); // filters of the loaded past analysis
    const sgPollRef = useRef(null);

    const toggleTab = (tab) => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    };

    // ---------------------------------------------------------------- data
    const loadUniversities = useCallback(async () => {
        setLoadingUnis(true);
        setMsg(null);
        try {
            const res = await axios.get(`${API}/universities`);
            setUniversities(res.data.universities || []);
        } catch (err) {
            setMsg({ type: "danger", text: `Failed to load universities: ${errText(err)}` });
        }
        setLoadingUnis(false);
    }, []);

    useEffect(() => {
        loadUniversities();
    }, [loadUniversities]);

    // Load available occupations (for the Skill Recommendations tab) once.
    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get(`${DIVERSITY}/available_occupation_names`);
                const raw = res.data;
                const list = Array.isArray(raw) && raw.length && Array.isArray(raw[0]) ? raw[0] : raw;
                // The endpoint can return the same occupation name several times —
                // de-duplicate (case-insensitive, trimmed) so each appears once, sorted.
                const seen = new Set();
                const unique = (Array.isArray(list) ? list : [])
                    .map((o) => (o == null ? "" : String(o).trim()))
                    .filter((o) => {
                        if (!o) return false;
                        const key = o.toLowerCase();
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    })
                    .sort((a, b) => a.localeCompare(b));
                setOccupations(unique);
            } catch (err) {
                setSgMsg({ type: "danger", text: `Could not load occupations: ${errText(err)}` });
            }
            loadSkillGapRuns();
        })();
        return () => { if (sgPollRef.current) clearTimeout(sgPollRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Derived option lists shared by the skill-gap panel.
    const countries = useMemo(() => {
        const set = new Set(universities.map((u) => u.country).filter(Boolean));
        return Array.from(set).sort();
    }, [universities]);

    const sgUniversitiesForCountry = useMemo(() => {
        const list = sgCountry ? universities.filter((u) => u.country === sgCountry) : universities;
        return [...list].sort((a, b) => (a.university_name || "").localeCompare(b.university_name || ""));
    }, [universities, sgCountry]);

    const filteredOccupations = useMemo(() => {
        const q = occFilter.trim().toLowerCase();
        const base = q ? occupations.filter((o) => o.toLowerCase().includes(q)) : occupations;
        return base.slice(0, 200);
    }, [occupations, occFilter]);

    const toggleOccupation = (occ) => {
        setSelectedOccupations((prev) =>
            prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
        );
    };

    // Filter a skill's "taught at" course list by the chosen country/university.
    // Course entries look like: "Course Name (University) - [Country]".
    const filterCourses = (courses) =>
        (courses || []).filter((c) =>
            (!sgCountry || c.includes(`[${sgCountry}]`)) &&
            (!sgUniversity || c.includes(`(${sgUniversity})`))
        );

    // ---- past skill-gap analyses ----
    const loadSkillGapRuns = async () => {
        setSgRunsLoading(true);
        try {
            const res = await axios.get(`${API}/skill-gap/runs`);
            const raw = res.data;
            const list = Array.isArray(raw) ? raw : (raw?.runs || raw?.data || []);
            const sorted = [...list].sort((a, b) => sgRunDateValue(b) - sgRunDateValue(a));
            setSgRuns(sorted);
        } catch (err) {
            // non-fatal — the "Past analyses" button just shows nothing
        } finally {
            setSgRunsLoading(false);
        }
    };

    const sgRunDateValue = (r) => {
        const t = Date.parse(r?.date || r?.created_at || "");
        return Number.isNaN(t) ? 0 : t;
    };

    const sgRunDateLabel = (r) => {
        const raw = r?.date || r?.created_at;
        if (!raw) return "";
        const t = Date.parse(raw);
        return Number.isNaN(t) ? String(raw) : new Date(t).toLocaleDateString();
    };

    const openPastSkillGap = (run) => {
        const title = run?.title;
        if (!title) return;
        if (sgPollRef.current) clearTimeout(sgPollRef.current);
        setSgShowPastModal(false);
        setSgMsg(null);
        setSgTitle(title);
        if (run.description) setSgDescription(run.description);
        setSgActiveTitle(title);
        setSgActiveFilters(run.filters || null);
        setSgRunId(null);
        setSgRunning(false);
        setSgStatus("completed");
        setSgSummary(null);
        fetchSkillGapSummary({ title });
    };

    const runSkillGap = async () => {
        setSgMsg(null);
        setSgSummary(null);
        const title = sgTitle.trim();
        if (!title) {
            setSgMsg({ type: "warning", text: "Please give this analysis a title." });
            return;
        }
        if (!selectedOccupations.length) {
            setSgMsg({ type: "warning", text: "Please select at least one occupation." });
            return;
        }
        if (sgRuns.some((r) => (r?.title || "").trim().toLowerCase() === title.toLowerCase())) {
            setSgMsg({ type: "warning", text: `An analysis titled "${title}" already exists. Please choose a different title.` });
            return;
        }
        if (sgPollRef.current) clearTimeout(sgPollRef.current);
        setSgRunning(true);
        setSgStatus("running");
        setSgActiveTitle(title);
        setSgActiveFilters(null); // fresh run — the form fields already show the filters
        const now = new Date();
        try {
            const res = await axios.post(`${API}/skill-gap/analyze`, {
                title,
                description: sgDescription.trim() || null,
                day: now.getDate(),
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                country: sgCountry || null,
                university: sgUniversity || null,
                occupations: selectedOccupations,
                threshold: Number(sgThreshold) || 0,
                top_n: Number(sgTopN) || 10,
            }, { headers: authHeader() });
            const rid = res.data.run_id;
            setSgRunId(rid);
            loadSkillGapRuns();
            pollSkillGap(rid, title);
        } catch (err) {
            setSgMsg({ type: "danger", text: `Could not start the analysis: ${errText(err)}` });
            setSgRunning(false);
            setSgStatus(null);
        }
    };

    const pollSkillGap = (rid, title) => {
        const tick = async () => {
            try {
                const res = await axios.get(`${API}/skill-gap/status/${rid}`);
                if (res.data.status === "completed") {
                    setSgStatus("completed");
                    setSgRunning(false);
                    fetchSkillGapSummary({ title, run_id: rid });
                    return;
                }
            } catch (err) {
                // transient — keep polling
            }
            sgPollRef.current = setTimeout(tick, 4000);
        };
        sgPollRef.current = setTimeout(tick, 3000);
    };

    const fetchSkillGapSummary = async (opts = {}) => {
        const title = opts.title != null ? opts.title : sgActiveTitle;
        const rid = opts.run_id || sgRunId;
        if (!title && !rid) return;
        setSgLoading(true);
        try {
            const params = { top_n: Number(sgTopN) || 10 };
            if (title) params.title = title;
            else params.run_id = rid;
            const res = await axios.get(`${API}/skill-gap/results/summary`, { params });
            setSgSummary(res.data || {});
        } catch (err) {
            setSgMsg({ type: "danger", text: `Could not load results: ${errText(err)}` });
            setSgSummary({ hot_skills: [], oversupplied_skills: [] });
        }
        setSgLoading(false);
    };

    // When the selected university changes, reset the dependent panels.
    const onSelectUniversity = async (univId) => {
        setSelectedUnivId(univId);
        setSimilar(null);
        setProfiles({});
        setOpenProfile(null);
        setPrograms([]);
        setSelectedProgramId("");
        setRecs(null);
        setOpenRec(null);
        if (!univId) return;
        try {
            const res = await axios.get(`${API}/university/${univId}/curriculum`);
            setPrograms(res.data.programs || []);
        } catch (err) {
            setMsg({ type: "danger", text: `Failed to load programs: ${errText(err)}` });
        }
    };

    // similar universities --------------------------------------------------------------
    const findSimilar = async () => {
        if (!selectedUnivId) return;
        setLoadingSimilar(true);
        setMsg(null);
        try {
            const res = await axios.get(
                `${API}/recommendation/recommend/universities/${selectedUnivId}/similar`,
                { params: { top_n: simTopN } }
            );
            setSimilar(Array.isArray(res.data) ? res.data : (res.data?.similar || []));
        } catch (err) {
            setMsg({ type: "danger", text: `Could not find similar universities: ${errText(err)}` });
            setSimilar([]);
        }
        setLoadingSimilar(false);
    };

    const toggleProfile = async (uniId) => {
        if (openProfile === uniId) {
            setOpenProfile(null);
            return;
        }
        setOpenProfile(uniId);
        if (profiles[uniId] !== undefined) return; // cached
        setProfiles((p) => ({ ...p, [uniId]: "loading" }));
        try {
            const res = await axios.get(
                `${API}/recommendation/recommend/universities/${uniId}/profile`
            );
            setProfiles((p) => ({ ...p, [uniId]: res.data || {} }));
        } catch (err) {
            setProfiles((p) => ({ ...p, [uniId]: null }));
        }
    };

    // Recommend courses --------------------------------------------------------------
    const selectedProgram = programs.find(
        (p) => String(p.program_id) === String(selectedProgramId)
    );

    const programLabel = (p) => {
        const titles = Array.isArray(p.degree_titles) ? p.degree_titles.filter(Boolean) : [];
        const name = titles.length ? titles.join(", ") : "(untitled program)";
        return `${name} — ${p.degree_type} · #${p.program_id}`;
    };

    const getCourseRecommendations = async () => {
        if (!selectedUnivId || !selectedProgram) return;
        setLoadingRecs(true);
        setMsg(null);
        setOpenRec(null);
        const titles = Array.isArray(selectedProgram.degree_titles)
            ? selectedProgram.degree_titles.filter(Boolean)
            : [];
        try {
            const res = await axios.post(
                `${API}/recommendation/recommend/universities/${selectedUnivId}/programs/${selectedProgram.program_id}/courses-existing-degree`,
                {
                    univ_id: Number(selectedUnivId),
                    program_id: Number(selectedProgram.program_id),
                    degree_title: titles[0] || "",
                    top_n: Number(recTopN),
                },
                { headers: authHeader() }
            );
            setRecs(res.data?.recommendations || []);
        } catch (err) {
            setMsg({ type: "danger", text: `Could not get course recommendations: ${errText(err)}` });
            setRecs([]);
        }
        setLoadingRecs(false);
    };

    // recs can be [{info: "..."}] when nothing was found
    const recInfo = Array.isArray(recs) && recs.length === 1 && recs[0] && recs[0].info && !recs[0].course_name
        ? recs[0].info
        : null;
    const recList = recInfo ? [] : (recs || []);

    // ---------------------------------------------------------------- render
    const universitySelector = (
        <Row className="align-items-end">
            <Col md="8">
                <label>Your university</label>
                <Input
                    type="select"
                    value={selectedUnivId}
                    onChange={(e) => onSelectUniversity(e.target.value)}
                >
                    <option value="">— select a university —</option>
                    {universities.map((u) => (
                        <option key={u.university_id} value={u.university_id}>
                            {u.university_name} ({u.country}) · {u.program_count} program(s), {u.course_count} course(s)
                        </option>
                    ))}
                </Input>
            </Col>
            <Col md="4">
                <Button size="sm" color="primary" outline onClick={loadUniversities}>
                    <i className="fas fa-sync"></i> Refresh
                </Button>
            </Col>
        </Row>
    );

    const renderSkills = (skills) =>
        (skills || []).slice(0, 60).map((s, i) => (
            <Badge key={i} color="info" style={{ marginRight: 4, marginBottom: 4 }}>{s}</Badge>
        ));

    const renderGapSkill = (s, kind, idx) => {
        const key = `${kind}::${idx}::${s.skill}`;
        const open = sgOpen === key;
        const courses = filterCourses(s.curriculum_courses);
        const hidden = (s.curriculum_courses || []).length - courses.length;
        return (
            <Card key={key} style={{ marginBottom: 8 }}>
                <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                        <strong>{s.skill}</strong>{" "}
                        <Badge color={kind === "hot" ? "danger" : "secondary"}>
                            gap {s.gap_score} %
                        </Badge>{" "}
                        <Badge color={s.in_curriculum ? "success" : "light"} style={{ color: s.in_curriculum ? "#fff" : "#333" }}>
                            {s.in_curriculum ? "in curriculum" : "not in curriculum"}
                        </Badge>
                    </span>
                    <Button size="sm" color="link" onClick={() => setSgOpen(open ? null : key)}>
                        <i className={`fas ${open ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                    </Button>
                </CardHeader>
                <Collapse isOpen={open}>
                    <CardBody>
                        <div style={{ marginBottom: 6, color: "#555" }}>
                            <div>demand score <strong>{s.demand_score} %</strong> ({s.demand_count} jobs) </div>
                            <div>supply score <strong>{s.supply_score} %</strong> ({s.supply_count} profiles) </div>
                        </div>
                        {s.occupations && s.occupations.length > 0 && (
                            <div style={{ marginBottom: 6 }}>
                                <strong>Occupations:</strong>{" "}
                                {s.occupations.map((o, i) => (
                                    <Badge key={i} color="info" style={{ marginRight: 4, marginBottom: 4 }} outline>{o}</Badge>
                                ))}
                            </div>
                        )}
                        <div>
                            <strong>Taught at</strong>{" "}
                            <Badge color="light" style={{ color: "#333" }}>{courses.length}</Badge>
                            {hidden > 0 && (
                                <span style={{ color: "#999", fontSize: "0.85em" }}> ({hidden} hidden by filter)</span>
                            )}
                            {courses.length === 0 ? (
                                <div><em style={{ color: "#999" }}>
                                    {(s.curriculum_courses || []).length === 0 ? "Not found in any curriculum." : "No courses match the selected country/university."}
                                </em></div>
                            ) : (
                                <ul style={{ marginTop: 4, maxHeight: 220, overflowY: "auto" }}>
                                    {courses.map((c, i) => <li key={i} style={{ fontSize: "0.9em" }}>{c}</li>)}
                                </ul>
                            )}
                        </div>
                    </CardBody>
                </Collapse>
            </Card>
        );
    };

    return (
        <div className="content">
            <Card>
                <CardHeader>
                    <CardTitle tag="h4" className="mb-2">Recommendations</CardTitle>
                    <Nav tabs>
                        <NavItem style={{ cursor: "pointer" }}>
                            <NavLink
                                className={classnames({ active: currentActiveTab === "1" })}
                                onClick={() => toggleTab("1")}
                            >
                                Courses
                            </NavLink>
                        </NavItem>
                        <NavItem style={{ cursor: "pointer" }}>
                            <NavLink
                                className={classnames({ active: currentActiveTab === "2" })}
                                onClick={() => toggleTab("2")}
                            >
                                Skills
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={currentActiveTab}>
                {/* ================= Course Recommendations ================= */}
                <TabPane tabId="1">
                    {msg && (
                        <Alert color={msg.type} toggle={() => setMsg(null)}>{msg.text}</Alert>
                    )}

                    <Card>
                        <CardBody>
                            {loadingUnis ? <div className="lds-dual-ring"></div> : universitySelector}
                            <p style={{ color: "#666", marginTop: 10, marginBottom: 0 }}>
                                Pick your university, then use either step below — they're independent.
                            </p>
                        </CardBody>
                    </Card>

                    {/* -------- Recommend courses -------- */}
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Recommend courses from other universities</CardTitle>
                            <span style={{ color: "#666" }}>
                                New courses to enrich one of your programs, drawn from similar degrees elsewhere.
                            </span>
                        </CardHeader>
                        <CardBody>
                            <Row className="align-items-end">
                                <Col md="6">
                                    <label>Your program</label>
                                    <Input
                                        type="select"
                                        value={selectedProgramId}
                                        onChange={(e) => setSelectedProgramId(e.target.value)}
                                        disabled={!selectedUnivId}
                                    >
                                        <option value="">
                                            {selectedUnivId
                                                ? (programs.length ? "— select a program —" : "no programs for this university")
                                                : "select a university first"}
                                        </option>
                                        {programs.map((p) => (
                                            <option key={p.program_id} value={p.program_id}>
                                                {programLabel(p)}
                                            </option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col xs="6" md="2">
                                    <label>How many</label>
                                    <Input
                                        type="number" min="1" max="100" bsSize="sm"
                                        value={recTopN}
                                        onChange={(e) => setRecTopN(e.target.value)}
                                    />
                                </Col>
                                <Col xs="6" md="4">
                                    <Button
                                        color="success"
                                        disabled={!selectedProgram || loadingRecs}
                                        onClick={getCourseRecommendations}
                                    >
                                        {loadingRecs ? "Working…" : "Get course recommendations"}
                                    </Button>
                                </Col>
                            </Row>

                            {loadingRecs ? (
                                <div className="lds-dual-ring" style={{ marginTop: 16 }}></div>
                            ) : recInfo ? (
                                <Alert color="info" style={{ marginTop: 16 }}>{recInfo}</Alert>
                            ) : recList.length > 0 ? (
                                <div style={{ marginTop: 16 }}>
                                    {recList.map((c, idx) => (
                                        <Card key={idx} style={{ marginBottom: 8 }}>
                                            <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span>
                                                    <strong>{c.course_name}</strong>{" "}
                                                    <Badge color="secondary">score {c.score}</Badge>
                                                </span>
                                                <Button size="sm" color="link" onClick={() => setOpenRec(openRec === idx ? null : idx)}>
                                                    <i className={`fas ${openRec === idx ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                                                </Button>
                                            </CardHeader>
                                            <Collapse isOpen={openRec === idx}>
                                                <CardBody>
                                                    {c.new_skills && c.new_skills.length > 0 && (
                                                        <div style={{ marginBottom: 6 }}>
                                                            <strong>New skills:</strong>{" "}
                                                            {c.new_skills.map((s, i) => (
                                                                <Badge key={i} color="success" style={{ marginRight: 4, marginBottom: 4 }}>{s}</Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {c.compatible_skills && c.compatible_skills.length > 0 && (
                                                        <div style={{ marginBottom: 6 }}>
                                                            <strong>Compatible skills:</strong>{" "}
                                                            {c.compatible_skills.map((s, i) => (
                                                                <Badge key={i} color="info" style={{ marginRight: 4, marginBottom: 4 }}>{s}</Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {c.description && <p style={{ marginTop: 6 }}>{c.description}</p>}
                                                    {!c.description && !(c.new_skills || []).length && !(c.compatible_skills || []).length && (
                                                        <em style={{ color: "#999" }}>No further details.</em>
                                                    )}
                                                </CardBody>
                                            </Collapse>
                                        </Card>
                                    ))}
                                </div>
                            ) : recs ? (
                                <em style={{ color: "#999", display: "block", marginTop: 12 }}>No recommendations found.</em>
                            ) : (
                                <em style={{ color: "#999", display: "block", marginTop: 12 }}>
                                    Select one of your programs and click the button.
                                </em>
                            )}
                        </CardBody>
                    </Card>

                    {/* -------- Find similar universities -------- */}
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Find similar universities</CardTitle>
                            <span style={{ color: "#666" }}>
                                Universities most closely related to yours by skills, degrees and courses.
                            </span>
                        </CardHeader>
                        <CardBody>
                            <Row className="align-items-end">
                                <Col xs="6" md="3">
                                    <label>How many</label>
                                    <Input
                                        type="number" min="1" max="50" bsSize="sm"
                                        value={simTopN}
                                        onChange={(e) => setSimTopN(e.target.value)}
                                    />
                                </Col>
                                <Col xs="6" md="4">
                                    <Button
                                        color="success"
                                        disabled={!selectedUnivId || loadingSimilar}
                                        onClick={findSimilar}
                                    >
                                        {loadingSimilar ? "Searching…" : "Find similar universities"}
                                    </Button>
                                </Col>
                            </Row>

                            {loadingSimilar ? (
                                <div className="lds-dual-ring" style={{ marginTop: 16 }}></div>
                            ) : similar && similar.length === 0 ? (
                                <em style={{ color: "#999", display: "block", marginTop: 12 }}>
                                    No similar universities found.
                                </em>
                            ) : similar ? (
                                <div style={{ marginTop: 16 }}>
                                    {similar.map((u) => (
                                        <Card key={u.university_id} style={{ marginBottom: 8 }}>
                                            <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span>
                                                    <strong>{u.name}</strong>{" "}
                                                    <span style={{ color: "#888" }}>({u.country})</span>{" "}
                                                    <Badge color="secondary">
                                                        similarity {Math.round((u.similarity_score || 0) * 100)}%
                                                    </Badge>
                                                </span>
                                                <Button size="sm" color="link" onClick={() => toggleProfile(u.university_id)}>
                                                    <i className={`fas ${openProfile === u.university_id ? "fa-chevron-up" : "fa-eye"}`}></i>{" "}
                                                    courses &amp; skills
                                                </Button>
                                            </CardHeader>
                                            <Collapse isOpen={openProfile === u.university_id}>
                                                <CardBody>
                                                    {profiles[u.university_id] === "loading" ? (
                                                        <div className="lds-dual-ring"></div>
                                                    ) : profiles[u.university_id] == null ? (
                                                        <em style={{ color: "#999" }}>Could not load profile.</em>
                                                    ) : (
                                                        <Row>
                                                            <Col md="6">
                                                                <strong>Courses</strong>
                                                                <ul style={{ maxHeight: 240, overflowY: "auto", paddingLeft: 18 }}>
                                                                    {(profiles[u.university_id].courses || []).map((c, i) => (
                                                                        <li key={i}>{c}</li>
                                                                    ))}
                                                                </ul>
                                                                {(profiles[u.university_id].courses || []).length === 0 && (
                                                                    <em style={{ color: "#999" }}>No courses.</em>
                                                                )}
                                                            </Col>
                                                            <Col md="6">
                                                                <strong>Skills</strong>
                                                                <div style={{ maxHeight: 240, overflowY: "auto", marginTop: 4 }}>
                                                                    {renderSkills(profiles[u.university_id].skills)}
                                                                    {(profiles[u.university_id].skills || []).length === 0 && (
                                                                        <em style={{ color: "#999" }}>No skills.</em>
                                                                    )}
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    )}
                                                </CardBody>
                                            </Collapse>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <em style={{ color: "#999", display: "block", marginTop: 12 }}>
                                    {selectedUnivId ? "Click the button to find similar universities." : "Select a university first."}
                                </em>
                            )}
                        </CardBody>
                    </Card>
                </TabPane>

                {/* ================= Skill Recommendations ================= */}
                <TabPane tabId="2">
                    {sgMsg && (
                        <Alert color={sgMsg.type} toggle={() => setSgMsg(null)}>{sgMsg.text}</Alert>
                    )}

                    <Card>
                        <CardHeader>
                            <span style={{ color: "#666" }}>
                                Compare labour-market demand vs. supply for the skills of the occupations you pick,
                                and see where each skill is taught.
                            </span>
                        </CardHeader>
                        <CardBody>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                                <div style={{ color: "#666" }}>
                                    {sgActiveTitle && <span>Viewing: <strong>{sgActiveTitle}</strong></span>}
                                </div>
                                <Button color="info" outline size="sm" onClick={() => { setSgShowPastModal(true); loadSkillGapRuns(); }}>
                                    <i className="fas fa-history" style={{ marginRight: 6 }}></i>Past analyses
                                </Button>
                            </div>

                            {sgActiveFilters && (
                                <div style={{ border: "1px solid #eee", background: "#fafafa", borderRadius: 6, padding: "8px 12px", marginBottom: 12 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                        <i className="fas fa-filter" style={{ marginRight: 6, color: "#888" }}></i>
                                        Filters used for this analysis
                                    </div>
                                    <div style={{ marginBottom: 6 }}>
                                        <span style={{ marginRight: 14 }}>
                                            <span style={{ color: "#888" }}>Scope: </span>
                                            {sgActiveFilters.country || "All countries"}
                                            {sgActiveFilters.university ? ` · ${sgActiveFilters.university}` : ""}
                                        </span>
                                        <span style={{ marginRight: 14 }}>
                                            <span style={{ color: "#888" }}>Threshold: </span>{sgActiveFilters.threshold ?? 0}
                                        </span>
                                        <span>
                                            <span style={{ color: "#888" }}>Top N: </span>{sgActiveFilters.top_n ?? "—"}
                                        </span>
                                    </div>
                                    {Array.isArray(sgActiveFilters.occupations) && sgActiveFilters.occupations.length > 0 && (
                                        <div>
                                            <span style={{ color: "#888" }}>Occupations: </span>
                                            {sgActiveFilters.occupations.map((o, i) => (
                                                <Badge key={i} color="info" style={{ marginRight: 4, marginBottom: 4 }}>{o}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <Row className="align-items-end">
                                <Col md="6">
                                    <FormGroup>
                                        <Label><strong>Title</strong> *</Label>
                                        <Input
                                            bsSize="sm"
                                            placeholder="A unique name for this analysis"
                                            value={sgTitle}
                                            onChange={(e) => setSgTitle(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md="6">
                                    <FormGroup>
                                        <Label>Description <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span></Label>
                                        <Input
                                            bsSize="sm"
                                            placeholder="What is this analysis about?"
                                            value={sgDescription}
                                            onChange={(e) => setSgDescription(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                {/* Occupations picker */}
                                <Col md="6">
                                    <FormGroup>
                                        <Label><strong>Occupations</strong> (one or more) *</Label>
                                        <div style={{ marginBottom: 6 }}>
                                            {selectedOccupations.length === 0 ? (
                                                <em style={{ color: "#999" }}>No occupations selected yet.</em>
                                            ) : (
                                                selectedOccupations.map((o) => (
                                                    <Badge
                                                        key={o} color="primary"
                                                        style={{ marginRight: 4, marginBottom: 4, cursor: "pointer" }}
                                                        onClick={() => toggleOccupation(o)}
                                                        title="Remove"
                                                    >
                                                        {o} <i className="fas fa-times"></i>
                                                    </Badge>
                                                ))
                                            )}
                                        </div>
                                        <Input
                                            bsSize="sm"
                                            placeholder="Search occupations…"
                                            value={occFilter}
                                            onChange={(e) => setOccFilter(e.target.value)}
                                        />
                                        <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #eee", borderRadius: 6, marginTop: 6 }}>
                                            {occupations.length === 0 ? (
                                                <div style={{ padding: 10 }}><Spinner size="sm" /> loading…</div>
                                            ) : filteredOccupations.length === 0 ? (
                                                <div style={{ padding: 10, color: "#999" }}>No matches.</div>
                                            ) : (
                                                filteredOccupations.map((o) => {
                                                    const sel = selectedOccupations.includes(o);
                                                    return (
                                                        <div
                                                            key={o}
                                                            onClick={() => toggleOccupation(o)}
                                                            style={{
                                                                padding: "5px 10px", cursor: "pointer",
                                                                background: sel ? "#e9f5ff" : "transparent",
                                                                borderBottom: "1px solid #f4f4f4",
                                                            }}
                                                        >
                                                            <i className={`far ${sel ? "fa-check-square" : "fa-square"}`} style={{ marginRight: 8 }}></i>
                                                            {o}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </FormGroup>
                                </Col>

                                {/* Parameters + course-list filters */}
                                <Col md="6">
                                    <Row>
                                        <Col md="6">
                                            <FormGroup>
                                                <Label>Country</Label>
                                                <Input
                                                    type="select"
                                                    value={sgCountry}
                                                    onChange={(e) => { setSgCountry(e.target.value); setSgUniversity(""); }}
                                                >
                                                    <option value="">All countries</option>
                                                    {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                        <Col md="6">
                                            <FormGroup>
                                                <Label>University</Label>
                                                <Input
                                                    type="select"
                                                    value={sgUniversity}
                                                    onChange={(e) => setSgUniversity(e.target.value)}
                                                >
                                                    <option value="">All universities</option>
                                                    {sgUniversitiesForCountry.map((u) => (
                                                        <option key={u.university_id} value={u.university_name}>{u.university_name}</option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                        <Col md="6">
                                            <FormGroup>
                                                <Label>Importance threshold</Label>
                                                <Input
                                                    type="number" min="0" max="1" step="0.05"
                                                    value={sgThreshold}
                                                    onChange={(e) => setSgThreshold(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md="6">
                                            <FormGroup>
                                                <Label>Top N skills</Label>
                                                <Input
                                                    type="number" min="1" max="100"
                                                    value={sgTopN}
                                                    onChange={(e) => setSgTopN(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <small style={{ color: "#999" }}>
                                        Country / University filter the "taught at" course lists in the results.
                                    </small>
                                    <div style={{ marginTop: 8 }}>
                                        <Button color="primary" onClick={runSkillGap} disabled={sgRunning || !sgTitle.trim() || selectedOccupations.length === 0}>
                                            {sgRunning ? <><Spinner size="sm" /> Analysing…</> : "Run skill-gap analysis"}
                                        </Button>
                                    </div>
                                </Col>
                            </Row>

                            {sgRunning && (
                                <Alert color="info" style={{ marginTop: 12 }}>
                                    <Spinner size="sm" /> Analysis running{sgRunId ? ` (run ${sgRunId.slice(0, 8)}…)` : ""}. Results appear automatically when it's done.
                                </Alert>
                            )}

                            {sgStatus === "completed" && !sgRunning && (
                                <div style={{ marginTop: 12 }}>
                                    {sgLoading ? (
                                        <div className="lds-dual-ring"></div>
                                    ) : sgSummary ? (
                                        <Row>
                                            <Col md="6">
                                                <h5>
                                                    Hot skills{" "}
                                                    <span style={{ color: "#999", fontWeight: 400 }}>(demand &gt; supply)</span>
                                                </h5>
                                                {(sgSummary.hot_skills || []).length === 0 ? (
                                                    <em style={{ color: "#999" }}>None.</em>
                                                ) : (
                                                    sgSummary.hot_skills.map((s, i) => renderGapSkill(s, "hot", i))
                                                )}
                                            </Col>
                                            <Col md="6">
                                                <h5>
                                                    Oversupplied skills{" "}
                                                    <span style={{ color: "#999", fontWeight: 400 }}>(supply &gt; demand)</span>
                                                </h5>
                                                {(sgSummary.oversupplied_skills || []).length === 0 ? (
                                                    <em style={{ color: "#999" }}>None.</em>
                                                ) : (
                                                    sgSummary.oversupplied_skills.map((s, i) => renderGapSkill(s, "over", i))
                                                )}
                                            </Col>
                                        </Row>
                                    ) : null}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </TabPane>
                    </TabContent>
                </CardBody>
            </Card>

            {/* ================= PAST SKILL-GAP ANALYSES MODAL ================= */}
            <Modal isOpen={sgShowPastModal} toggle={() => setSgShowPastModal(false)} size="lg">
                <ModalHeader toggle={() => setSgShowPastModal(false)}>Past analyses</ModalHeader>
                <ModalBody>
                    {sgRunsLoading ? (
                        <div><Spinner size="sm" /> loading…</div>
                    ) : sgRuns.length === 0 ? (
                        <p className="text-muted mb-0">No past analyses yet. Run one to see it here.</p>
                    ) : (
                        <Table hover responsive size="sm" className="mb-0">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sgRuns.map((r, i) => (
                                    <tr key={r.title || r.run_id || i}>
                                        <td><strong>{r.title || <em className="text-muted">(untitled)</em>}</strong></td>
                                        <td style={{ color: "#666" }}>{r.description || ""}</td>
                                        <td style={{ whiteSpace: "nowrap" }}>{sgRunDateLabel(r)}</td>
                                        <td style={{ whiteSpace: "nowrap" }}>
                                            <Button
                                                color="primary"
                                                size="sm"
                                                outline
                                                disabled={!r.title}
                                                onClick={() => openPastSkillGap(r)}
                                            >
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => loadSkillGapRuns()} disabled={sgRunsLoading}>
                        Refresh
                    </Button>
                    <Button color="secondary" onClick={() => setSgShowPastModal(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default Recommendations;
