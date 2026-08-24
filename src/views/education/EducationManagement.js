import React, { useState, useEffect, useCallback } from "react";
import {
    Card, CardHeader, CardBody, CardFooter, CardTitle,
    Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane,
    Input, Table, Badge, Alert, Collapse
} from "reactstrap";
import classnames from "classnames";
import axios from "axios";

const API = process.env.REACT_APP_API_URL_CURRICULUM_SKILLS;

const SPLIT_MODES = [
    { value: "full_text", label: "Full text (detect course blocks)" },
    { value: "per_page", label: "Per page" },
    { value: "llm_course_boundaries", label: "LLM course boundaries" },
    { value: "force_chunk", label: "Force fixed chunks" },
];

const DEGREE_TYPES = ["", "BSc", "MSc", "PhD", "Other"];

// Turn a file name into a reasonable default university guess.
const cleanName = (filename) =>
    (filename || "")
        .replace(/\.pdf$/i, "")
        .replace(/[_\W]+/g, " ")
        .trim();

const EducationManagement = () => {
    const [currentActiveTab, setCurrentActiveTab] = useState("1");

    // ---- Upload state ----
    const [defaultUniversity, setDefaultUniversity] = useState("");
    const [defaultCountry, setDefaultCountry] = useState("");
    const [rows, setRows] = useState([]); // {file, university, country, degreeTitle, degreeType, splitMode, status, result, error}
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState(null); // {type, text}

    // ---- Results state ----
    const [countryFilter, setCountryFilter] = useState("");
    const [universities, setUniversities] = useState([]);
    const [loadingUnis, setLoadingUnis] = useState(false);
    const [selectedUni, setSelectedUni] = useState(null);
    const [curriculum, setCurriculum] = useState(null);
    const [loadingCurriculum, setLoadingCurriculum] = useState(false);
    const [openPrograms, setOpenPrograms] = useState({});
    const [openCourse, setOpenCourse] = useState(null);
    const [resultsMsg, setResultsMsg] = useState(null);

    const toggleTab = (tab) => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    };

    // ============================ Upload ============================
    const onFilesSelected = (e) => {
        const files = Array.from(e.target.files || []);
        const newRows = files.map((file) => ({
            file,
            university: defaultUniversity || cleanName(file.name),
            country: defaultCountry || "",
            degreeTitle: "",
            degreeType: "",
            splitMode: "full_text",
            status: "pending", // pending | uploading | done | error
            result: null,
            error: null,
        }));
        setRows((prev) => [...prev, ...newRows]);
        // allow re-selecting the same file later
        e.target.value = "";
    };

    const updateRow = (idx, patch) =>
        setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

    const removeRow = (idx) =>
        setRows((prev) => prev.filter((_, i) => i !== idx));

    const clearDone = () =>
        setRows((prev) => prev.filter((r) => r.status !== "done"));

    const uploadOne = async (row, idx) => {
        updateRow(idx, { status: "uploading", error: null });
        const form = new FormData();
        form.append("file", row.file);
        if (row.university) form.append("university_name", row.university);
        if (row.country) form.append("country", row.country);
        if (row.degreeTitle) form.append("degree_title", row.degreeTitle);
        if (row.degreeType) form.append("degree_type", row.degreeType);
        form.append("split_mode", row.splitMode);
        form.append("save_to_db", "true");
        try {
            const res = await axios.post(`${API}/pdf/upload_and_process`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            updateRow(idx, { status: "done", result: res.data });
            return true;
        } catch (err) {
            const detail =
                err?.response?.data?.detail || err?.message || "Upload failed";
            updateRow(idx, { status: "error", error: String(detail) });
            return false;
        }
    };

    const uploadAll = async () => {
        setUploading(true);
        setUploadMsg(null);
        let ok = 0;
        let fail = 0;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].status === "done") continue;
            if (!rows[i].university || !rows[i].university.trim()) {
                updateRow(i, { status: "error", error: "University name is required" });
                fail += 1;
                continue;
            }
            // eslint-disable-next-line no-await-in-loop
            const success = await uploadOne(rows[i], i);
            success ? (ok += 1) : (fail += 1);
        }
        setUploading(false);
        setUploadMsg({
            type: fail ? "warning" : "success",
            text: `Finished: ${ok} uploaded, ${fail} failed. Saved uploads appear under "Universities & Results".`,
        });
        loadUniversities();
    };

    // ============================ Results ============================
    const loadUniversities = useCallback(async () => {
        setLoadingUnis(true);
        setResultsMsg(null);
        try {
            const url =
                `${API}/universities` +
                (countryFilter ? `?country=${encodeURIComponent(countryFilter)}` : "");
            const res = await axios.get(url);
            setUniversities(res.data.universities || []);
        } catch (err) {
            const detail = err?.response?.data?.detail || err?.message;
            setResultsMsg({ type: "danger", text: `Failed to load universities: ${detail}` });
        }
        setLoadingUnis(false);
    }, [countryFilter]);

    const loadCurriculum = async (uni) => {
        setSelectedUni(uni);
        setCurriculum(null);
        setOpenPrograms({});
        setOpenCourse(null);
        setLoadingCurriculum(true);
        try {
            const res = await axios.get(`${API}/university/${uni.university_id}/curriculum`);
            setCurriculum(res.data);
        } catch (err) {
            const detail = err?.response?.data?.detail || err?.message;
            setResultsMsg({ type: "danger", text: `Failed to load curriculum: ${detail}` });
        }
        setLoadingCurriculum(false);
    };

    const deleteCourse = async (courseId) => {
        if (!window.confirm("Delete this course? This cannot be undone.")) return;
        try {
            await axios.delete(`${API}/course/${courseId}`);
            setResultsMsg({ type: "success", text: `Course ${courseId} deleted.` });
            if (selectedUni) await loadCurriculum(selectedUni);
            loadUniversities();
        } catch (err) {
            const detail = err?.response?.data?.detail || err?.message;
            setResultsMsg({ type: "danger", text: `Failed to delete course: ${detail}` });
        }
    };

    const deleteProgram = async (programId) => {
        if (!window.confirm("Delete this program and all its courses? This cannot be undone.")) return;
        try {
            const res = await axios.delete(`${API}/program/${programId}`);
            const n = res?.data?.deleted_courses ?? 0;
            setResultsMsg({ type: "success", text: `Program ${programId} deleted (${n} course(s) removed).` });
            if (selectedUni) await loadCurriculum(selectedUni);
            loadUniversities();
        } catch (err) {
            const detail = err?.response?.data?.detail || err?.message;
            setResultsMsg({ type: "danger", text: `Failed to delete program: ${detail}` });
        }
    };

    useEffect(() => {
        loadUniversities();
    }, [loadUniversities]);

    // ============================ Renderers ============================
    const renderCourse = (course) => {
        const isOpen = openCourse === course.course_id;
        return (
            <li
                key={course.course_id}
                style={{
                    listStyle: "none",
                    borderBottom: "1px solid #eee",
                    padding: "8px 4px",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ textAlign: "left", fontWeight: 500 }}>
                        {course.lesson_name}
                        <span style={{ color: "#999", fontWeight: 400, marginLeft: 8 }}>
                            #{course.course_id}
                        </span>
                    </span>
                    <span>
                        <Button
                            size="sm"
                            color="link"
                            onClick={() => setOpenCourse(isOpen ? null : course.course_id)}
                            title="Details"
                        >
                            <i className={`fas ${isOpen ? "fa-chevron-up" : "fa-eye"}`}></i>
                        </Button>
                        <Button
                            size="sm"
                            color="danger"
                            outline
                            onClick={() => deleteCourse(course.course_id)}
                            title="Delete course"
                        >
                            <i className="fas fa-trash"></i>
                        </Button>
                    </span>
                </div>
                <Collapse isOpen={isOpen}>
                    <div style={{ padding: "8px 4px", textAlign: "left" }}>
                        {course.semester_label && (
                            <div><strong>Semester:</strong> {course.semester_label}</div>
                        )}
                        {course.website && (
                            <div>
                                <strong>Website:</strong>{" "}
                                <a href={course.website} target="_blank" rel="noreferrer">{course.website}</a>
                            </div>
                        )}
                        {course.description && (
                            <p style={{ marginTop: 6 }}>{course.description}</p>
                        )}
                        {course.skills && course.skills.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                                <strong>Skills:</strong>{" "}
                                {course.skills.map((s, i) => (
                                    <Badge key={i} color="info" style={{ marginRight: 4, marginBottom: 4 }}>
                                        {s}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {!course.description && (!course.skills || course.skills.length === 0) && (
                            <em style={{ color: "#999" }}>No extracted details.</em>
                        )}
                    </div>
                </Collapse>
            </li>
        );
    };

    const renderProgram = (program) => {
        const open = !!openPrograms[program.program_id];
        const titles = Array.isArray(program.degree_titles)
            ? program.degree_titles.filter(Boolean)
            : [];
        const label = titles.length ? titles.join(", ") : "(untitled program)";
        return (
            <Card key={program.program_id} style={{ marginBottom: 10 }}>
                <CardHeader style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                            onClick={() =>
                                setOpenPrograms((p) => ({ ...p, [program.program_id]: !open }))
                            }
                            style={{ flex: 1 }}
                        >
                            <i className={`fas ${open ? "fa-chevron-down" : "fa-chevron-right"}`} style={{ marginRight: 8 }}></i>
                            <strong>{label}</strong>{" "}
                            <Badge color="secondary">{program.degree_type}</Badge>{" "}
                            <Badge color="light" style={{ color: "#333" }}>
                                {(program.courses || []).length} course(s)
                            </Badge>
                            <span style={{ color: "#999", marginLeft: 8 }}>#{program.program_id}</span>
                        </span>
                        <Button
                            size="sm"
                            color="danger"
                            onClick={() => deleteProgram(program.program_id)}
                            title="Delete program and its courses"
                        >
                            <i className="fas fa-trash"></i> Program
                        </Button>
                    </div>
                </CardHeader>
                <Collapse isOpen={open}>
                    <CardBody>
                        {(program.courses || []).length === 0 ? (
                            <em style={{ color: "#999" }}>No courses in this program.</em>
                        ) : (
                            <ul style={{ paddingLeft: 0, margin: 0 }}>
                                {program.courses.map(renderCourse)}
                            </ul>
                        )}
                    </CardBody>
                </Collapse>
            </Card>
        );
    };

    return (
        <div className="content">
            <Nav tabs style={{ marginBottom: "10px" }}>
                <NavItem style={{ cursor: "pointer" }}>
                    <NavLink
                        className={classnames({ active: currentActiveTab === "1" })}
                        onClick={() => toggleTab("1")}
                    >
                        Upload Curricula
                    </NavLink>
                </NavItem>
                <NavItem style={{ cursor: "pointer" }}>
                    <NavLink
                        className={classnames({ active: currentActiveTab === "2" })}
                        onClick={() => toggleTab("2")}
                    >
                        Universities &amp; Results
                    </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab={currentActiveTab}>
                {/* ---------------- Upload tab ---------------- */}
                <TabPane tabId="1">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Upload curriculum PDFs</CardTitle>
                            <p style={{ color: "#666", marginBottom: 0 }}>
                                Add one or many PDFs. Set a university (and optional program) per file —
                                so a dean can upload several programs for one university, or a ministry can
                                upload for many universities at once.
                            </p>
                        </CardHeader>
                        <CardBody>
                            <Row>
                                <Col md="4">
                                    <label>Default university (applied to new files)</label>
                                    <Input
                                        value={defaultUniversity}
                                        onChange={(e) => setDefaultUniversity(e.target.value)}
                                        placeholder="e.g. University of Macedonia"
                                    />
                                </Col>
                                <Col md="4">
                                    <label>Default country</label>
                                    <Input
                                        value={defaultCountry}
                                        onChange={(e) => setDefaultCountry(e.target.value)}
                                        placeholder="e.g. Greece"
                                    />
                                </Col>
                                <Col md="4" style={{ display: "flex", alignItems: "flex-end" }}>
                                    <label
                                        className="btn btn-primary"
                                        style={{ marginBottom: 0, cursor: "pointer" }}
                                    >
                                        <i className="fas fa-plus"></i> Add PDFs
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            multiple
                                            hidden
                                            onChange={onFilesSelected}
                                        />
                                    </label>
                                </Col>
                            </Row>

                            {uploadMsg && (
                                <Alert color={uploadMsg.type} style={{ marginTop: 12 }}>
                                    {uploadMsg.text}
                                </Alert>
                            )}

                            {rows.length > 0 && (
                                <div style={{ overflowX: "auto", marginTop: 16 }}>
                                    <Table responsive>
                                        <thead>
                                            <tr>
                                                <th>File</th>
                                                <th>University *</th>
                                                <th>Country</th>
                                                <th>Program / degree title</th>
                                                <th>Type</th>
                                                <th>Split mode</th>
                                                <th>Status</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ maxWidth: 160, wordBreak: "break-word" }}>
                                                        {row.file.name}
                                                    </td>
                                                    <td>
                                                        <Input
                                                            bsSize="sm"
                                                            value={row.university}
                                                            onChange={(e) => updateRow(idx, { university: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Input
                                                            bsSize="sm"
                                                            value={row.country}
                                                            onChange={(e) => updateRow(idx, { country: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Input
                                                            bsSize="sm"
                                                            placeholder="(optional)"
                                                            value={row.degreeTitle}
                                                            onChange={(e) => updateRow(idx, { degreeTitle: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Input
                                                            type="select"
                                                            bsSize="sm"
                                                            value={row.degreeType}
                                                            onChange={(e) => updateRow(idx, { degreeType: e.target.value })}
                                                        >
                                                            {DEGREE_TYPES.map((t) => (
                                                                <option key={t} value={t}>{t || "—"}</option>
                                                            ))}
                                                        </Input>
                                                    </td>
                                                    <td>
                                                        <Input
                                                            type="select"
                                                            bsSize="sm"
                                                            value={row.splitMode}
                                                            onChange={(e) => updateRow(idx, { splitMode: e.target.value })}
                                                        >
                                                            {SPLIT_MODES.map((m) => (
                                                                <option key={m.value} value={m.value}>{m.label}</option>
                                                            ))}
                                                        </Input>
                                                    </td>
                                                    <td>
                                                        {row.status === "pending" && <Badge color="secondary">pending</Badge>}
                                                        {row.status === "uploading" && <Badge color="info">uploading…</Badge>}
                                                        {row.status === "done" && (
                                                            <Badge color="success">
                                                                {row.result?.lesson_count ?? 0} course(s)
                                                            </Badge>
                                                        )}
                                                        {row.status === "error" && (
                                                            <Badge color="danger" title={row.error}>error</Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Button
                                                            size="sm"
                                                            color="link"
                                                            onClick={() => removeRow(idx)}
                                                            disabled={row.status === "uploading"}
                                                            title="Remove row"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </CardBody>
                        {rows.length > 0 && (
                            <CardFooter>
                                <Button color="success" onClick={uploadAll} disabled={uploading}>
                                    {uploading ? "Uploading…" : "Analyze & Save all"}
                                </Button>{" "}
                                <Button color="secondary" outline onClick={clearDone} disabled={uploading}>
                                    Clear completed
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </TabPane>

                {/* ---------------- Results tab ---------------- */}
                <TabPane tabId="2">
                    {resultsMsg && (
                        <Alert color={resultsMsg.type} toggle={() => setResultsMsg(null)}>
                            {resultsMsg.text}
                        </Alert>
                    )}
                    <Row>
                        <Col md="4">
                            <Card>
                                <CardHeader>
                                    <CardTitle tag="h5">Universities</CardTitle>
                                    <Row>
                                        <Col xs="8">
                                            <Input
                                                bsSize="sm"
                                                placeholder="Filter by country"
                                                value={countryFilter}
                                                onChange={(e) => setCountryFilter(e.target.value)}
                                            />
                                        </Col>
                                        <Col xs="4">
                                            <Button size="sm" color="primary" onClick={loadUniversities}>
                                                <i className="fas fa-sync"></i>
                                            </Button>
                                        </Col>
                                    </Row>
                                </CardHeader>
                                <CardBody>
                                    {loadingUnis ? (
                                        <div className="lds-dual-ring"></div>
                                    ) : universities.length === 0 ? (
                                        <em style={{ color: "#999" }}>No universities yet. Upload some PDFs first.</em>
                                    ) : (
                                        <ul style={{ paddingLeft: 0, margin: 0 }}>
                                            {universities.map((u) => (
                                                <li
                                                    key={u.university_id}
                                                    onClick={() => loadCurriculum(u)}
                                                    style={{
                                                        listStyle: "none",
                                                        cursor: "pointer",
                                                        padding: "8px",
                                                        borderRadius: 6,
                                                        marginBottom: 4,
                                                        background:
                                                            selectedUni?.university_id === u.university_id ? "#e9f5ff" : "transparent",
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 500, textAlign: "left" }}>
                                                        {u.university_name}
                                                    </div>
                                                    <div style={{ fontSize: "0.8em", color: "#666", textAlign: "left" }}>
                                                        {u.country} · {u.program_count} program(s) · {u.course_count} course(s)
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md="8">
                            <Card>
                                <CardHeader>
                                    <CardTitle tag="h5">
                                        {selectedUni ? selectedUni.university_name : "Select a university"}
                                    </CardTitle>
                                </CardHeader>
                                <CardBody>
                                    {loadingCurriculum ? (
                                        <div className="lds-dual-ring"></div>
                                    ) : !curriculum ? (
                                        <em style={{ color: "#999" }}>
                                            Pick a university on the left to see its analyzed programs and courses.
                                        </em>
                                    ) : (
                                        <>
                                            <p style={{ color: "#666" }}>
                                                {curriculum.program_count} program(s) · {curriculum.course_count} course(s)
                                            </p>

                                            {curriculum.programs.map(renderProgram)}

                                            {curriculum.unassigned_courses &&
                                                curriculum.unassigned_courses.length > 0 && (
                                                    <Card style={{ marginTop: 10 }}>
                                                        <CardHeader>
                                                            <strong>Courses without a program</strong>{" "}
                                                            <Badge color="light" style={{ color: "#333" }}>
                                                                {curriculum.unassigned_courses.length}
                                                            </Badge>
                                                        </CardHeader>
                                                        <CardBody>
                                                            <ul style={{ paddingLeft: 0, margin: 0 }}>
                                                                {curriculum.unassigned_courses.map(renderCourse)}
                                                            </ul>
                                                        </CardBody>
                                                    </Card>
                                                )}

                                            {curriculum.program_count === 0 &&
                                                (!curriculum.unassigned_courses ||
                                                    curriculum.unassigned_courses.length === 0) && (
                                                    <em style={{ color: "#999" }}>
                                                        No saved courses for this university yet.
                                                    </em>
                                                )}
                                        </>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </TabPane>
            </TabContent>
        </div>
    );
};

export default EducationManagement;
