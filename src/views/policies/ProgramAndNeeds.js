import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button,
  Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner, Input, Label,
  FormGroup, Badge, Table, Collapse
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const DIVERSITY = process.env.REACT_APP_API_URL_SKILLS_DIVERSITY;
const CURRICULUM = process.env.REACT_APP_API_URL_CURRICULUM_SKILLS;
const FTTI = process.env.REACT_APP_API_URL_FUTURE_TECHNOLOGY_TRENDS_IDENTIFIER;

// FTTI is served behind the authenticated user-management gateway.
const ftAuth = () => ({ Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` });

const errText = (err, fallback = "Something went wrong") =>
  err?.response?.data?.detail || err?.message || fallback;

const ProgramAndNeeds = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("short");

  // ---- reference data ----
  const [occupations, setOccupations] = useState([]);
  const [occFilter, setOccFilter] = useState("");
  const [selectedOccupations, setSelectedOccupations] = useState([]);
  const [universities, setUniversities] = useState([]);

  // ---- parameters ----
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [threshold, setThreshold] = useState(0);
  const [topN, setTopN] = useState(100);

  // ---- run state ----
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(null);
  const [status, setStatus] = useState(null); // running | completed
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [openSkill, setOpenSkill] = useState(null);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);

  // ================= LONG TERM ANALYSIS (setup step) =================
  // Selects a Future Technology Trends analysis (by sector, then title) and
  // the country/universities the long-term analysis will target.
  const [ltSectors, setLtSectors] = useState([]);
  const [ltSectorsLoading, setLtSectorsLoading] = useState(false);
  const [ltSector, setLtSector] = useState("");

  const [ltTitles, setLtTitles] = useState([]);
  const [ltTitlesLoading, setLtTitlesLoading] = useState(false);
  const [ltTitle, setLtTitle] = useState("");

  const [ltCountries, setLtCountries] = useState([]);
  const [ltCountriesLoading, setLtCountriesLoading] = useState(false);
  const [ltCountry, setLtCountry] = useState("");

  const [ltSelectedUnis, setLtSelectedUnis] = useState([]); // university_id[]

  const [ltError, setLtError] = useState(null);
  const [ltInfo, setLtInfo] = useState(null);
  const ltLoadedRef = useRef(false);

  // ---- load reference data ----
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${DIVERSITY}/available_occupation_names`);
        // response is either [ [ ...names ] ] or [ ...names ]
        const raw = res.data;
        const list = Array.isArray(raw) && raw.length && Array.isArray(raw[0]) ? raw[0] : raw;
        setOccupations(Array.isArray(list) ? list.filter(Boolean) : []);
      } catch (e) {
        setError(`Could not load occupations: ${errText(e)}`);
      }
      try {
        const res = await axios.get(`${CURRICULUM}/universities`);
        setUniversities(res.data.universities || []);
      } catch (e) {
        // universities are optional filters — don't block on failure
      }
    })();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, []);

  const countries = useMemo(() => {
    const set = new Set(universities.map((u) => u.country).filter(Boolean));
    return Array.from(set).sort();
  }, [universities]);

  const universitiesForCountry = useMemo(() => {
    const list = selectedCountry
      ? universities.filter((u) => u.country === selectedCountry)
      : universities;
    return [...list].sort((a, b) => (a.university_name || "").localeCompare(b.university_name || ""));
  }, [universities, selectedCountry]);

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

  // ---- long-term: lazy-load sectors + countries when the tab is first opened ----
  useEffect(() => {
    if (activeTab !== "long" || ltLoadedRef.current) return;
    ltLoadedRef.current = true;
    loadLtSectors();
    loadLtCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadLtSectors = async () => {
    setLtSectorsLoading(true);
    setLtError(null);
    try {
      const res = await axios.get(`${FTTI}/analyses/sectors`, { headers: ftAuth() });
      setLtSectors(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setLtError(`Could not load sectors: ${errText(e)}`);
    } finally {
      setLtSectorsLoading(false);
    }
  };

  const loadLtCountries = async () => {
    setLtCountriesLoading(true);
    try {
      const res = await axios.get(`${CURRICULUM}/recommendation/filters/countries`);
      setLtCountries(res.data?.countries || []);
    } catch (e) {
      setLtError((prev) => prev || `Could not load countries: ${errText(e)}`);
    } finally {
      setLtCountriesLoading(false);
    }
  };

  const onLtSectorChange = async (sector) => {
    setLtSector(sector);
    setLtTitle("");
    setLtTitles([]);
    if (!sector) return;
    setLtTitlesLoading(true);
    setLtError(null);
    try {
      const res = await axios.get(
        `${FTTI}/analyses/by-sector/${encodeURIComponent(sector)}`,
        { headers: ftAuth() }
      );
      setLtTitles(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setLtError(`Could not load analyses for this sector: ${errText(e)}`);
    } finally {
      setLtTitlesLoading(false);
    }
  };

  // Universities come from the same source as the Short Term tab (the
  // `universities` list loaded once from `${CURRICULUM}/universities`),
  // filtered by the selected country.
  const ltUnisForCountry = useMemo(() => {
    const list = ltCountry ? universities.filter((u) => u.country === ltCountry) : [];
    return [...list].sort((a, b) =>
      (a.university_name || "").localeCompare(b.university_name || "")
    );
  }, [universities, ltCountry]);

  const onLtCountryChange = (country) => {
    setLtCountry(country);
    if (!country) {
      setLtSelectedUnis([]);
      return;
    }
    const unis = universities.filter((u) => u.country === country);
    setLtSelectedUnis(unis.map((u) => u.university_id)); // default: all selected
  };

  // If the base university list loads after a country was picked, default to
  // all selected once it becomes available (does not fight a manual "None").
  useEffect(() => {
    if (ltCountry && ltSelectedUnis.length === 0 && ltUnisForCountry.length > 0) {
      setLtSelectedUnis(ltUnisForCountry.map((u) => u.university_id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ltUnisForCountry]);

  const toggleLtUni = (id) =>
    setLtSelectedUnis((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedLtTitle = useMemo(
    () => ltTitles.find((t) => t.title === ltTitle) || null,
    [ltTitles, ltTitle]
  );

  const canStartLt = !!ltSector && !!ltTitle && !!ltCountry && ltSelectedUnis.length > 0;

  const goCreateFtti = () => {
    // Same layout (policy-industry / policy-education), sibling route.
    navigate(window.location.pathname.replace("program-and-needs", "future-technology-trends"));
  };

  const startLongTerm = () => {
    // Backend is not wired up yet — this is the setup step only.
    setLtInfo(
      "Selections captured. The long-term analysis backend isn't available yet, so nothing runs for now."
    );
  };

  // ---- run analysis ----
  const runAnalysis = async () => {
    setError(null);
    setResults(null);
    if (!selectedOccupations.length) {
      setError("Please select at least one occupation.");
      return;
    }
    if (!selectedCountry) {
      setError("Please select a country.");
      return;
    }
    if (pollRef.current) clearTimeout(pollRef.current);
    setRunning(true);
    setStatus("running");
    try {
      const res = await axios.post(`${CURRICULUM}/policy/analyze`, {
        occupations: selectedOccupations,
        threshold: Number(threshold) || 0,
        top_n: Number(topN) || 100,
      });
      const rid = res.data.run_id;
      setRunId(rid);
      pollStatus(rid);
    } catch (e) {
      setError(`Could not start the analysis: ${errText(e)}`);
      setRunning(false);
      setStatus(null);
    }
  };

  const pollStatus = (rid) => {
    const tick = async () => {
      try {
        const res = await axios.get(`${CURRICULUM}/policy/status/${rid}`);
        if (res.data.status === "completed") {
          setStatus("completed");
          setRunning(false);
          fetchResults(rid);
          return; // stop polling
        }
      } catch (e) {
        // transient — keep polling
      }
      pollRef.current = setTimeout(tick, 4000);
    };
    pollRef.current = setTimeout(tick, 3000);
  };

  const fetchResults = async (ridArg) => {
    const rid = ridArg || runId;
    if (!rid) return;
    setLoadingResults(true);
    setError(null);
    try {
      const params = { run_id: rid };
      if (selectedCountry) params.country = selectedCountry;
      if (selectedUniversity) params.university = selectedUniversity;
      const res = await axios.get(`${CURRICULUM}/policy/results`, { params });
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setResults(data);
    } catch (e) {
      setError(`Could not load results: ${errText(e)}`);
      setResults([]);
    }
    setLoadingResults(false);
  };

  // ---- renderers ----
  const renderUniversityResult = (r, idx) => {
    const present = r.present_skills_count ?? 0;
    const missing = r.missing_skills_count ?? 0;
    const totalConsidered = present + missing;
    const pct = totalConsidered > 0 ? Math.round((present / totalConsidered) * 100) : 0;
    const missingDepts = r.missing_departments || {};
    const missingCourses = r.missing_courses || {};

    return (
      <Card key={r.id || idx} style={{ marginBottom: 12 }}>
        <CardHeader>
          <CardTitle tag="h5" className="mb-1">
            {r.university_name}{" "}
            <span style={{ color: "#888", fontWeight: 400 }}>({r.country})</span>
          </CardTitle>
          <div>
            <Badge color={pct >= 50 ? "success" : pct >= 20 ? "warning" : "danger"}>
              {pct}% covered
            </Badge>{" "}
            <Badge color="success" outline>{present} present</Badge>{" "}
            <Badge color="danger" outline>{missing} missing</Badge>{" "}
            <span style={{ color: "#999" }}>coverage score: {r.coverage_score}</span>
          </div>
        </CardHeader>
        <CardBody>
          {/* Missing skills grouped by occupation */}
          <h6>Missing skills by occupation</h6>
          {Object.keys(missingDepts).length === 0 ? (
            <em style={{ color: "#999" }}>None.</em>
          ) : (
            Object.entries(missingDepts).map(([occ, skills]) => (
              <div key={occ} style={{ marginBottom: 8 }}>
                <strong>{occ}</strong>{" "}
                <Badge color="light" style={{ color: "#333" }}>{(skills || []).length}</Badge>
                <div style={{ marginTop: 4 }}>
                  {(skills || []).map((s, i) => (
                    <Badge key={i} color="danger" style={{ marginRight: 4, marginBottom: 4 }} outline>
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Where to find the missing skills (courses in other universities) */}
          <h6 style={{ marginTop: 14 }}>
            Where these skills are taught elsewhere{" "}
            <span style={{ color: "#999", fontWeight: 400 }}>
              ({Object.keys(missingCourses).length} skills)
            </span>
          </h6>
          {Object.keys(missingCourses).length === 0 ? (
            <em style={{ color: "#999" }}>No suggested courses.</em>
          ) : (
            <ul style={{ paddingLeft: 0, margin: 0 }}>
              {Object.entries(missingCourses).map(([skill, courses]) => {
                const key = `${r.id || idx}::${skill}`;
                const open = openSkill === key;
                return (
                  <li key={skill} style={{ listStyle: "none", borderBottom: "1px solid #eee", padding: "6px 0" }}>
                    <div
                      style={{ cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                      onClick={() => setOpenSkill(open ? null : key)}
                    >
                      <span>
                        <i className={`fas ${open ? "fa-chevron-down" : "fa-chevron-right"}`} style={{ marginRight: 6 }}></i>
                        <strong>{skill}</strong>
                      </span>
                      <Badge color="info">{(courses || []).length} course(s)</Badge>
                    </div>
                    <Collapse isOpen={open}>
                      <ul style={{ marginTop: 6 }}>
                        {(courses || []).map((c, i) => (
                          <li key={i} style={{ fontSize: "0.9em" }}>{c}</li>
                        ))}
                      </ul>
                    </Collapse>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="content">
      <Card>
        <CardHeader>
          <CardTitle tag="h4" className="mb-2">Program and Needs</CardTitle>
          <Nav tabs>
            <NavItem style={{ cursor: "pointer" }}>
              <NavLink
                className={classnames({ active: activeTab === "short" })}
                onClick={() => setActiveTab("short")}
              >
                Short Term Analysis
              </NavLink>
            </NavItem>
            <NavItem style={{ cursor: "pointer" }}>
              <NavLink
                className={classnames({ active: activeTab === "long" })}
                onClick={() => setActiveTab("long")}
              >
                Long Term Analysis
              </NavLink>
            </NavItem>
          </Nav>
        </CardHeader>

        <CardBody>
          <TabContent activeTab={activeTab}>
            {/* ================= SHORT TERM ================= */}
            <TabPane tabId="short">
              {error && <Alert color="danger" toggle={() => setError(null)}>{error}</Alert>}

              <Row>
                {/* Occupations picker */}
                <Col md="6">
                  <FormGroup>
                    <Label><strong>Occupations</strong> (select one or more) *</Label>
                    <div style={{ marginBottom: 6 }}>
                      {selectedOccupations.length === 0 ? (
                        <em style={{ color: "#999" }}>No occupations selected yet.</em>
                      ) : (
                        selectedOccupations.map((o) => (
                          <Badge
                            key={o}
                            color="primary"
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
                                padding: "5px 10px",
                                cursor: "pointer",
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
                    {occFilter && occupations.filter((o) => o.toLowerCase().includes(occFilter.toLowerCase())).length > 200 && (
                      <small style={{ color: "#999" }}>Showing first 200 matches — refine your search.</small>
                    )}
                  </FormGroup>
                </Col>

                {/* Parameters */}
                <Col md="6">
                  <Row>
                    <Col md="6">
                      <FormGroup>
                        <Label>Country *</Label>
                        <Input
                          type="select"
                          value={selectedCountry}
                          onChange={(e) => { setSelectedCountry(e.target.value); setSelectedUniversity(""); }}
                        >
                          <option value="">— select a country —</option>
                          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>University</Label>
                        <Input
                          type="select"
                          value={selectedUniversity}
                          onChange={(e) => setSelectedUniversity(e.target.value)}
                        >
                          <option value="">All universities</option>
                          {universitiesForCountry.map((u) => (
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
                          value={threshold}
                          onChange={(e) => setThreshold(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>Top N skills</Label>
                        <Input
                          type="number" min="1" max="500"
                          value={topN}
                          onChange={(e) => setTopN(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Button color="primary" onClick={runAnalysis} disabled={running || selectedOccupations.length === 0 || !selectedCountry}>
                    {running ? <><Spinner size="sm" /> Analysing…</> : "Run Short-Term Analysis"}
                  </Button>{" "}
                  {status === "completed" && (
                    <Button color="secondary" outline onClick={() => fetchResults(runId)} disabled={loadingResults}>
                      Refresh results
                    </Button>
                  )}
                </Col>
              </Row>

              {/* Status / results */}
              {running && (
                <Alert color="info" style={{ marginTop: 12 }}>
                  <Spinner size="sm" /> Analysis running{runId ? ` (run ${runId.slice(0, 8)}…)` : ""}. This can take a couple of minutes — results appear automatically when it's done.
                </Alert>
              )}

              {status === "completed" && !running && (
                <div style={{ marginTop: 12 }}>
                  {loadingResults ? (
                    <div><Spinner size="sm" /> loading results…</div>
                  ) : results && results.length > 0 ? (
                    <>
                      <h5>
                        Results{" "}
                        <span style={{ color: "#999", fontWeight: 400 }}>
                          ({results.length} universit{results.length === 1 ? "y" : "ies"})
                        </span>
                      </h5>
                      {results.map(renderUniversityResult)}
                    </>
                  ) : (
                    <Alert color="warning">
                      No results for the selected filters. Try a different country/university, or clear the filters and refresh.
                    </Alert>
                  )}
                </div>
              )}
            </TabPane>

            {/* ================= LONG TERM ================= */}
            <TabPane tabId="long">
              {ltError && <Alert color="danger" toggle={() => setLtError(null)}>{ltError}</Alert>}

              <p className="text-muted">
                Set up a long-term analysis: choose a Future Technology Trends analysis
                (filter by sector, then pick the analysis) and the country whose
                universities you want to analyse.
              </p>

              {/* Step 1 — pick the FTTI analysis */}
              <h6 className="mt-2"><Badge color="primary" pill>1</Badge> Future Technology Trends analysis</h6>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>Sector *</Label>
                    <Input
                      type="select"
                      value={ltSector}
                      onChange={(e) => onLtSectorChange(e.target.value)}
                      disabled={ltSectorsLoading}
                    >
                      <option value="">
                        {ltSectorsLoading ? "Loading sectors…" : "— select a sector —"}
                      </option>
                      {ltSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Analysis *</Label>
                    <Input
                      type="select"
                      value={ltTitle}
                      onChange={(e) => setLtTitle(e.target.value)}
                      disabled={!ltSector || ltTitlesLoading || ltTitles.length === 0}
                    >
                      <option value="">
                        {ltTitlesLoading
                          ? "Loading analyses…"
                          : !ltSector
                          ? "— select a sector first —"
                          : "— select an analysis —"}
                      </option>
                      {ltTitles.map((t) => (
                        <option key={t.title} value={t.title}>
                          {t.title}{t.count ? ` (${t.count} PDF${t.count === 1 ? "" : "s"})` : ""}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              {/* No analyses for the chosen sector -> prompt to create one */}
              {!ltSectorsLoading && ltSectors.length === 0 && (
                <Alert color="warning">
                  No Future Technology Trends analyses exist yet.{" "}
                  <Button color="link" className="p-0 align-baseline" onClick={goCreateFtti}>
                    Create one
                  </Button>{" "}first.
                </Alert>
              )}
              {ltSector && !ltTitlesLoading && ltTitles.length === 0 && (
                <Alert color="warning">
                  No analyses found for “{ltSector}”.{" "}
                  <Button color="link" className="p-0 align-baseline" onClick={goCreateFtti}>
                    Create a Future Technology Trends analysis
                  </Button>{" "}first.
                </Alert>
              )}
              {selectedLtTitle && (selectedLtTitle.description || selectedLtTitle.created_at) && (
                <p className="text-muted" style={{ marginTop: -6 }}>
                  {selectedLtTitle.description}
                  {selectedLtTitle.created_at
                    ? ` · ${new Date(selectedLtTitle.created_at).toLocaleDateString()}`
                    : ""}
                </p>
              )}

              {/* Step 2 — pick country + universities */}
              <h6 className="mt-3"><Badge color="primary" pill>2</Badge> Target universities</h6>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>Country *</Label>
                    <Input
                      type="select"
                      value={ltCountry}
                      onChange={(e) => onLtCountryChange(e.target.value)}
                      disabled={ltCountriesLoading}
                    >
                      <option value="">
                        {ltCountriesLoading ? "Loading countries…" : "— select a country —"}
                      </option>
                      {ltCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Universities{ltCountry ? ` in ${ltCountry}` : ""}</Label>
                    {!ltCountry ? (
                      <div className="text-muted" style={{ fontSize: "0.9em" }}>
                        Select a country to choose universities.
                      </div>
                    ) : universities.length === 0 ? (
                      <div><Spinner size="sm" /> loading…</div>
                    ) : ltUnisForCountry.length === 0 ? (
                      <div className="text-muted">No universities found for this country.</div>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">
                            {ltSelectedUnis.length} of {ltUnisForCountry.length} selected
                          </small>
                          <div>
                            <Button color="link" size="sm" className="p-0 mr-2"
                              onClick={() => setLtSelectedUnis(ltUnisForCountry.map((u) => u.university_id))}>
                              All
                            </Button>
                            <Button color="link" size="sm" className="p-0"
                              onClick={() => setLtSelectedUnis([])}>
                              None
                            </Button>
                          </div>
                        </div>
                        <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #eee", borderRadius: 6 }}>
                          {ltUnisForCountry.map((u) => {
                            const sel = ltSelectedUnis.includes(u.university_id);
                            return (
                              <div
                                key={u.university_id}
                                onClick={() => toggleLtUni(u.university_id)}
                                style={{
                                  padding: "5px 10px",
                                  cursor: "pointer",
                                  background: sel ? "#e9f5ff" : "transparent",
                                  borderBottom: "1px solid #f4f4f4",
                                }}
                              >
                                <i className={`far ${sel ? "fa-check-square" : "fa-square"}`} style={{ marginRight: 8 }}></i>
                                {u.university_name}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </FormGroup>
                </Col>
              </Row>

              {ltInfo && <Alert color="info" toggle={() => setLtInfo(null)} className="mt-2">{ltInfo}</Alert>}

              <Button color="primary" onClick={startLongTerm} disabled={!canStartLt}>
                Start Long-Term Analysis
              </Button>
              {!canStartLt && (
                <small className="text-muted ml-2">
                  Select a sector, an analysis, a country and at least one university.
                </small>
              )}
            </TabPane>
          </TabContent>
        </CardBody>
      </Card>
    </div>
  );
};

export default ProgramAndNeeds;
