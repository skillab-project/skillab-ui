import React, { useState, useEffect, useCallback } from "react";
import {
    Card, CardHeader, CardBody, CardFooter, CardTitle,
    Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane,
    Input, Table, Badge, Alert, Collapse
} from "reactstrap";
import classnames from "classnames";
import axios from "axios";

const API = process.env.REACT_APP_API_URL_CURRICULUM_SKILLS;

const errText = (err, fallback) =>
    err?.response?.data?.detail || err?.message || fallback;

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
                }
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

    return (
        <div className="content">
            <Nav tabs style={{ marginBottom: "10px" }}>
                <NavItem style={{ cursor: "pointer" }}>
                    <NavLink
                        className={classnames({ active: currentActiveTab === "1" })}
                        onClick={() => toggleTab("1")}
                    >
                        Course Recommendations
                    </NavLink>
                </NavItem>
                <NavItem style={{ cursor: "pointer" }}>
                    <NavLink
                        className={classnames({ active: currentActiveTab === "2" })}
                        onClick={() => toggleTab("2")}
                    >
                        Skill Recommendations
                    </NavLink>
                </NavItem>
            </Nav>

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
                </TabPane>

                {/* ================= Skill Recommendations ================= */}
                <TabPane tabId="2">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Skill Recommendations</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <div style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
                                <i className="fas fa-tools" style={{ fontSize: "2em", marginBottom: 10 }}></i>
                                <p>Skill recommendations are coming soon — the backend for this is still in progress.</p>
                            </div>
                        </CardBody>
                    </Card>
                </TabPane>
            </TabContent>
        </div>
    );
};

export default Recommendations;
