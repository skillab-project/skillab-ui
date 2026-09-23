import React, { useState, useEffect, useCallback } from "react";
import {
    Card, CardHeader, CardBody, CardFooter, CardTitle,
    Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane,
    Input, Table, Badge, Alert, Collapse
} from "reactstrap";
import classnames from "classnames";
import axios from "axios";
import { getUserUniversity, saveUserUniversity, getInstallation } from "utils/Tokens";

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

const NEW_SENTINEL = "__cs_new__";

// Dropdown (reactstrap select, same look as other views) that also lets the
// user add a value not yet in the list via an "Add new…" option.
function ComboSelect({
    value,
    options,
    onChange,
    selectPlaceholder,
    inputPlaceholder,
    bsSize,
    disabled,
}) {
    const [adding, setAdding] = useState(false);
    const isNew = adding || (!!value && !options.includes(value));

    const handleSelect = (e) => {
        const v = e.target.value;
        if (v === NEW_SENTINEL) {
            setAdding(true);
            onChange("");
        } else {
            setAdding(false);
            onChange(v);
        }
    };

    if (isNew) {
        return (
            <div>
                <Input
                    bsSize={bsSize}
                    type="text"
                    value={value}
                    placeholder={inputPlaceholder}
                    onChange={(e) => onChange(e.target.value)}
                />
                <Button
                    color="link"
                    size="sm"
                    style={{ padding: "2px 0" }}
                    onClick={() => {
                        setAdding(false);
                        onChange("");
                    }}
                >
                    &larr; choose from list
                </Button>
            </div>
        );
    }

    return (
        <Input
            bsSize={bsSize}
            type="select"
            value={options.includes(value) ? value : ""}
            onChange={handleSelect}
            disabled={disabled}
        >
            <option value="">{selectPlaceholder}</option>
            {options.map((o) => (
                <option key={o} value={o}>
                    {o}
                </option>
            ))}
            <option value={NEW_SENTINEL}>&#43; Add new&hellip;</option>
        </Input>
    );
}

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

    // ---- Setup (this user's own university) ----
    const [userUniversity, setUserUniversity] = useState(null); // {universityName, country} | null
    const [setupUniversity, setSetupUniversity] = useState("");
    const [setupCountry, setSetupCountry] = useState("");
    const [savingSetup, setSavingSetup] = useState(false);
    const [setupMsg, setSetupMsg] = useState(null);
    const [allUnis, setAllUnis] = useState([]); // full University table (incl. no-curricula) for Setup options
    // policy-education installations track a country only (no university).
    const [isPolicy, setIsPolicy] = useState(false);

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
            progress: null,
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
        updateRow(idx, { status: "uploading", error: null, progress: null });
        const form = new FormData();
        form.append("file", row.file);
        if (row.university) form.append("university_name", row.university);
        if (row.country) form.append("country", row.country);
        if (row.degreeTitle) form.append("degree_title", row.degreeTitle);
        if (row.degreeType) form.append("degree_type", row.degreeType);
        form.append("split_mode", row.splitMode);
        form.append("save_to_db", "true");
        try {
            // The endpoint now returns immediately with a job_id and processes
            // the PDF in the background — poll until it finishes.
            const res = await axios.post(`${API}/pdf/upload_and_process`, form, {
                headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
            });
            const jobId = res.data?.job_id;
            if (!jobId) {
                // Fallback: a backend that still returns the result directly.
                updateRow(idx, { status: "done", result: res.data, progress: null });
                return true;
            }
            return await pollUpload(jobId, idx);
        } catch (err) {
            const detail =
                err?.response?.data?.detail || err?.message || "Upload failed";
            updateRow(idx, { status: "error", error: String(detail), progress: null });
            return false;
        }
    };

    // Poll a background upload_and_process job until it finishes.
    // Resolves true on success, false on failure.
    const pollUpload = (jobId, idx) =>
        new Promise((resolve) => {
            const tick = async () => {
                try {
                    const res = await axios.get(
                        `${API}/pdf/upload_and_process/status/${jobId}`
                    );
                    const task = res.data || {};
                    if (task.status === "succeeded") {
                        updateRow(idx, { status: "done", result: task.result, progress: null });
                        resolve(true);
                        return;
                    }
                    if (task.status === "failed") {
                        updateRow(idx, {
                            status: "error",
                            error: task.error || "Processing failed",
                            progress: null,
                        });
                        resolve(false);
                        return;
                    }
                    // queued / running — reflect progress if the backend reports it
                    updateRow(idx, { status: "uploading", progress: task.progress || null });
                } catch (err) {
                    // transient error — keep polling
                }
                setTimeout(tick, 3000);
            };
            setTimeout(tick, 2000);
        });

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
            await axios.delete(`${API}/course/${courseId}`, {
                headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
            });
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
            const res = await axios.delete(`${API}/program/${programId}`, {
                headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
            });
            const n = res?.data?.deleted_courses ?? 0;
            setResultsMsg({ type: "success", text: `Program ${programId} deleted (${n} course(s) removed).` });
            if (selectedUni) await loadCurriculum(selectedUni);
            loadUniversities();
        } catch (err) {
            const detail = err?.response?.data?.detail || err?.message;
            setResultsMsg({ type: "danger", text: `Failed to delete program: ${detail}` });
        }
    };

    const deleteUniversity = async (uni) => {
        if (!window.confirm(`Delete "${uni.university_name}" and ALL its programs and courses? This cannot be undone.`)) return;
        try {
            const res = await axios.delete(`${API}/university/${uni.university_id}`, {
                headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
            });
            const p = res?.data?.deleted_programs ?? 0;
            const c = res?.data?.deleted_courses ?? 0;
            setResultsMsg({ type: "success", text: `University "${uni.university_name}" deleted (${p} program(s), ${c} course(s) removed).` });
            if (selectedUni?.university_id === uni.university_id) {
                setSelectedUni(null);
                setCurriculum(null);
            }
            loadUniversities();
        } catch (err) {
            const detail = err?.response?.data?.detail || err?.message;
            setResultsMsg({ type: "danger", text: `Failed to delete university: ${detail}` });
        }
    };

    useEffect(() => {
        loadUniversities();
    }, [loadUniversities]);

    // ============================ Setup ============================
    // Full university list (including universities with no curricula yet) for the
    // Setup dropdown — the browse tab's own list only covers ones with curricula.
    const loadAllUniversities = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/recommendation/filters/universities`);
            setAllUnis(res.data?.universities || []);
        } catch (e) {
            /* non-fatal — Setup can still free-type a university */
        }
    }, []);

    // On mount: load the full list and this user's saved university, pre-filling
    // the Setup form and the Upload defaults (both still editable).
    useEffect(() => {
        loadAllUniversities();
        (async () => {
            const inst = await getInstallation();
            const policy = !!inst && inst.includes("policy");
            setIsPolicy(policy);
            const uni = await getUserUniversity();
            if (uni) {
                setUserUniversity(uni);
                setSetupUniversity(uni.universityName || "");
                setSetupCountry(uni.country || "");
                if (uni.universityName) setDefaultUniversity(uni.universityName);
                if (uni.country) setDefaultCountry(uni.country);
                // policy-education: default the Universities & Results filter to the user's country.
                if (policy && uni.country) setCountryFilter(uni.country);
            }
        })();
    }, [loadAllUniversities]);

    // Once the browse list has loaded, auto-select this user's own university so
    // its programs & courses show without them picking it each time.
    useEffect(() => {
        if (!userUniversity || selectedUni) return;
        if (!universities || universities.length === 0) return;
        const target = (userUniversity.universityName || "").trim().toLowerCase();
        const tctry = (userUniversity.country || "").trim().toLowerCase();
        const match = universities.find(
            (u) =>
                (u.university_name || "").trim().toLowerCase() === target &&
                (!tctry || (u.country || "").trim().toLowerCase() === tctry)
        );
        if (match) loadCurriculum(match);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [universities, userUniversity]);

    const saveSetup = async () => {
        const name = (setupUniversity || "").trim();
        const country = (setupCountry || "").trim();
        if (isPolicy) {
            if (!country) {
                setSetupMsg({ type: "warning", text: "Please select or enter a country." });
                return;
            }
        } else if (!name) {
            setSetupMsg({ type: "warning", text: "Please select or enter a university name." });
            return;
        }
        setSavingSetup(true);
        setSetupMsg(null);
        try {
            // Education: ensure the university exists in the curriculum DB (get-or-create).
            // Policy-education: country only — nothing to create.
            if (!isPolicy) {
                await axios.post(`${API}/universities`, { university_name: name, country }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                    },
                });
            }
            // Persist on the user (extraInfo JSON). Policy stores an empty university.
            await saveUserUniversity(isPolicy ? "" : name, country);
            setUserUniversity({ universityName: isPolicy ? "" : name, country });
            if (!isPolicy) setDefaultUniversity(name);
            setDefaultCountry(country);
            if (isPolicy) setCountryFilter(country);
            setSetupMsg({
                type: "success",
                text: isPolicy
                    ? `Saved. "${country}" is now your default country.`
                    : `Saved. "${name}" is now your default university.`,
            });
            loadUniversities();
            loadAllUniversities();
        } catch (e) {
            const detail = e?.response?.data?.detail || e?.message || "Save failed";
            setSetupMsg({ type: "danger", text: `Could not save: ${detail}` });
        } finally {
            setSavingSetup(false);
        }
    };

    // ---- Setup option lists ----
    // Pool = universities with curricula (same source the Upload tab uses, always
    // available) unioned with the full University table (adds ones with no
    // curricula yet, when that list loads).
    const setupUniPool = [...(universities || []), ...(allUnis || [])];

    const setupCountryOptions = Array.from(
        new Set(setupUniPool.map((u) => (u.country || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const setupUniversityOptions = (country) => {
        const c = (country || "").trim().toLowerCase();
        return Array.from(
            new Set(
                setupUniPool
                    .filter((u) => !c || (u.country || "").trim().toLowerCase() === c)
                    .map((u) => (u.university_name || "").trim())
                    .filter(Boolean)
            )
        ).sort((a, b) => a.localeCompare(b));
    };

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

    // ---- Combobox option lists derived from existing universities ----
    const countryOptions = Array.from(
        new Set(
            (universities || [])
                .map((u) => (u.country || "").trim())
                .filter(Boolean)
        )
    ).sort((a, b) => a.localeCompare(b));

    const universityOptionsForCountry = (country) => {
        const c = (country || "").trim().toLowerCase();
        return Array.from(
            new Set(
                (universities || [])
                    .filter((u) => !c || (u.country || "").trim().toLowerCase() === c)
                    .map((u) => (u.university_name || "").trim())
                    .filter(Boolean)
            )
        ).sort((a, b) => a.localeCompare(b));
    };

    return (
        <div className="content">
            <Nav tabs style={{ marginBottom: "10px" }}>
                <NavItem style={{ cursor: "pointer" }}>
                    <NavLink
                        className={classnames({ active: currentActiveTab === "setup" })}
                        onClick={() => toggleTab("setup")}
                    >
                        Setup
                    </NavLink>
                </NavItem>
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
                {/* ---------------- Setup tab ---------------- */}
                <TabPane tabId="setup">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">{isPolicy ? "Your country" : "Your university"}</CardTitle>
                            <p style={{ color: "#666", marginBottom: 0 }}>
                                {isPolicy
                                    ? "Set the country for this account. Once saved, it is pre-selected across Upload, Universities & Results and Program & Needs. Pick one from the list, or type a new name."
                                    : "Set the university and country for this account. Once saved, it is pre-selected across Upload, Universities & Results and Recommendations. Pick one from the list, or type a new name to create it."}
                            </p>
                        </CardHeader>
                        <CardBody>
                            {userUniversity && (userUniversity.universityName || userUniversity.country) && (
                                <Alert color="info" style={{ marginBottom: 12 }}>
                                    Current: <strong>{isPolicy ? (userUniversity.country || "—") : (userUniversity.universityName || "—")}</strong>
                                    {!isPolicy && userUniversity.country ? ` — ${userUniversity.country}` : ""}
                                </Alert>
                            )}
                            <Row>
                                <Col md="4">
                                    <label>Country</label>
                                    <ComboSelect
                                        value={setupCountry}
                                        options={setupCountryOptions}
                                        onChange={setSetupCountry}
                                        selectPlaceholder="— select a country —"
                                        inputPlaceholder="Type a new country"
                                    />
                                </Col>
                                {!isPolicy && (
                                    <Col md="4">
                                        <label>University</label>
                                        <ComboSelect
                                            value={setupUniversity}
                                            options={setupUniversityOptions(setupCountry)}
                                            onChange={setSetupUniversity}
                                            selectPlaceholder="— select a university —"
                                            inputPlaceholder="Type a new university"
                                        />
                                    </Col>
                                )}
                                <Col md="4" style={{ display: "flex", alignItems: "flex-end" }}>
                                    <Button
                                        color="primary"
                                        disabled={savingSetup || (isPolicy ? !(setupCountry || "").trim() : !(setupUniversity || "").trim())}
                                        onClick={saveSetup}
                                    >
                                        {savingSetup ? "Saving…" : "Save"}
                                    </Button>
                                </Col>
                            </Row>
                            {setupMsg && (
                                <Alert color={setupMsg.type} style={{ marginTop: 12 }}>
                                    {setupMsg.text}
                                </Alert>
                            )}
                        </CardBody>
                    </Card>
                </TabPane>

                {/* ---------------- Upload tab ---------------- */}
                <TabPane tabId="1">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Upload curriculum PDFs</CardTitle>
                            <p style={{ color: "#666", marginBottom: 0 }}>
                                Add one or many PDFs. Set a university (and optional program) per file —
                                so a dean can upload several programs for one university.
                            </p>
                        </CardHeader>
                        <CardBody>
                            <Row>
                                <Col md="4">
                                    <label>Country</label>
                                    <ComboSelect
                                        value={defaultCountry}
                                        options={countryOptions}
                                        onChange={setDefaultCountry}
                                        selectPlaceholder="— select a country —"
                                        inputPlaceholder="Type a new country"
                                    />
                                </Col>
                                <Col md="4">
                                    <label>University</label>
                                    <ComboSelect
                                        value={defaultUniversity}
                                        options={universityOptionsForCountry(defaultCountry)}
                                        onChange={setDefaultUniversity}
                                        selectPlaceholder="— select a university —"
                                        inputPlaceholder="Type a new university"
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
                                                <th>Country</th>
                                                <th>University *</th>
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
                                                        <ComboSelect
                                                            bsSize="sm"
                                                            value={row.country}
                                                            options={countryOptions}
                                                            onChange={(v) => updateRow(idx, { country: v })}
                                                            selectPlaceholder="— country —"
                                                            inputPlaceholder="New country"
                                                        />
                                                    </td>
                                                    <td>
                                                        <ComboSelect
                                                            bsSize="sm"
                                                            value={row.university}
                                                            options={universityOptionsForCountry(row.country)}
                                                            onChange={(v) => updateRow(idx, { university: v })}
                                                            selectPlaceholder="— university —"
                                                            inputPlaceholder="New university"
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
                                                        {row.status === "uploading" && (
                                                            <Badge color="info">
                                                                {row.progress && row.progress.total
                                                                    ? `processing ${row.progress.done}/${row.progress.total}`
                                                                    : row.progress && row.progress.phase
                                                                        ? String(row.progress.phase).replace(/_/g, " ")
                                                                        : "processing…"}
                                                            </Badge>
                                                        )}
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
                                                    style={{
                                                        listStyle: "none",
                                                        padding: "8px",
                                                        borderRadius: 6,
                                                        marginBottom: 4,
                                                        background:
                                                            selectedUni?.university_id === u.university_id ? "#e9f5ff" : "transparent",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <div style={{ cursor: "pointer", flex: 1 }} onClick={() => loadCurriculum(u)}>
                                                        <div style={{ fontWeight: 500, textAlign: "left" }}>
                                                            {u.university_name}
                                                        </div>
                                                        <div style={{ fontSize: "0.8em", color: "#666", textAlign: "left" }}>
                                                            {u.country} · {u.program_count} program(s) · {u.course_count} course(s)
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        color="danger"
                                                        outline
                                                        title="Delete university"
                                                        onClick={(e) => { e.stopPropagation(); deleteUniversity(u); }}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </Button>
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
