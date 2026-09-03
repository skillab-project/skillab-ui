import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button,
  Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner, Input, Label,
  FormGroup, Badge, Table, Collapse,
  Modal, ModalHeader, ModalBody, ModalFooter
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

  // ---- analysis identity ----
  const [stTitle, setStTitle] = useState("");
  const [stDescription, setStDescription] = useState("");
  const [activeTitle, setActiveTitle] = useState(null); // title of the results on screen
  const [activeFilters, setActiveFilters] = useState(null); // filters of the loaded past analysis

  // ---- run state ----
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(null);
  const [status, setStatus] = useState(null); // running | completed
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [openSkill, setOpenSkill] = useState(null);
  const [openMissing, setOpenMissing] = useState({}); // per-university "Missing skills by occupation" toggle
  const [error, setError] = useState(null);

  // ---- past analyses ----
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [showPastModal, setShowPastModal] = useState(false);

  const pollRef = useRef(null);

  // ================= LONG TERM ANALYSIS (setup step) =================
  // Selects a Future Technology Trends analysis (by sector, then title) and
  // the country/universities the long-term analysis will target.
  const [ltSectors, setLtSectors] = useState([]);
  const [ltSectorsLoading, setLtSectorsLoading] = useState(false);
  const [ltSector, setLtSector] = useState("");

  const [ltTitles, setLtTitles] = useState([]);
  const [ltTitlesLoading, setLtTitlesLoading] = useState(false);
  const [ltTitle, setLtTitle] = useState(""); // FTTI analysis (source) title

  // Save title: the unique key this long-term analysis is stored under. Defaults
  // to "<source> — <country>" so several countries of the same FTTI analysis get
  // distinct titles, but is editable.
  const [ltSaveTitle, setLtSaveTitle] = useState("");
  const ltSaveTitleTouched = useRef(false);

  const [ltCountries, setLtCountries] = useState([]);
  const [ltCountriesLoading, setLtCountriesLoading] = useState(false);
  const [ltCountry, setLtCountry] = useState("");

  // esco similarity threshold for the title-gap pipeline (default 0.4)
  const [ltEscoThreshold, setLtEscoThreshold] = useState(0.4);

  // ---- long-term run / results ----
  const [ltRunning, setLtRunning] = useState(false);
  const [ltResults, setLtResults] = useState(null);   // {skills, coverage_pct, ...}
  const [ltActiveTitle, setLtActiveTitle] = useState(null);
  const [ltActiveFilters, setLtActiveFilters] = useState(null); // filters of the loaded past long-term analysis
  const [ltOpenSkill, setLtOpenSkill] = useState(null);

  // ---- long-term past analyses ----
  const [ltRuns, setLtRuns] = useState([]);
  const [ltRunsLoading, setLtRunsLoading] = useState(false);
  const [ltShowPastModal, setLtShowPastModal] = useState(false);

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
      } catch (e) {
        setError(`Could not load occupations: ${errText(e)}`);
      }
      try {
        const res = await axios.get(`${CURRICULUM}/universities`);
        setUniversities(res.data.universities || []);
      } catch (e) {
        // universities are optional filters — don't block on failure
      }
      loadRuns();
    })();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    loadLtRuns();
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

  const selectedLtTitle = useMemo(
    () => ltTitles.find((t) => t.title === ltTitle) || null,
    [ltTitles, ltTitle]
  );

  // Auto-suggest a save title from the chosen analysis + country, until the
  // user edits the field themselves.
  useEffect(() => {
    if (ltSaveTitleTouched.current) return;
    if (!ltTitle) { setLtSaveTitle(""); return; }
    setLtSaveTitle(ltCountry ? `${ltTitle} — ${ltCountry}` : ltTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ltTitle, ltCountry]);

  // The backend uses ALL universities of the chosen country, so no university
  // picker is needed — a source analysis, a save title and a country are enough.
  const canStartLt = !!ltSector && !!ltTitle && !!ltCountry && !!ltSaveTitle.trim();

  const goCreateFtti = () => {
    // Same layout (policy-industry / policy-education), sibling route.
    navigate(window.location.pathname.replace("program-and-needs", "future-technology-trends"));
  };

  // ---- long-term past analyses ----
  const loadLtRuns = async () => {
    setLtRunsLoading(true);
    try {
      const res = await axios.get(`${CURRICULUM}/skill-gap/longterm/gap-by-title/runs`);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.runs || raw?.data || []);
      const sorted = [...list].sort((a, b) => runDateValue(b) - runDateValue(a));
      setLtRuns(sorted);
    } catch (e) {
      // non-fatal
    } finally {
      setLtRunsLoading(false);
    }
  };

  const fetchLtResults = async (title) => {
    if (!title) return;
    setLtRunning(true);
    setLtError(null);
    try {
      const res = await axios.get(
        `${CURRICULUM}/skill-gap/longterm/gap-by-title/results`,
        { params: { title } }
      );
      const data = res.data;
      if (!data || !Array.isArray(data.skills)) {
        setLtResults({ skills: [] });
        setLtInfo(data?.message || "No saved results for this analysis.");
      } else {
        setLtResults(data);
      }
      setLtActiveTitle(title);
    } catch (e) {
      setLtError(`Could not load results: ${errText(e)}`);
      setLtResults(null);
    } finally {
      setLtRunning(false);
    }
  };

  const openPastLt = (run) => {
    const saveTitle = run?.title;
    if (!saveTitle) return;
    setLtShowPastModal(false);
    setLtInfo(null);
    setLtError(null);
    // reflect the run's source analysis / save title / country where we can
    ltSaveTitleTouched.current = true;
    setLtSaveTitle(saveTitle);
    setLtTitle(run?.source_title || saveTitle);
    const country = run?.filters?.country || run?.country || "";
    if (country) setLtCountry(country);
    setLtActiveFilters({
      source_title: run?.source_title || null,
      country: run?.filters?.country || run?.country || null,
      esco_threshold: run?.filters?.esco_threshold,
    });
    setLtOpenSkill(null);
    fetchLtResults(saveTitle);
  };

  const startLongTerm = async () => {
    setLtError(null);
    setLtInfo(null);
    const saveTitle = ltSaveTitle.trim();
    if (!ltTitle || !ltCountry) {
      setLtError("Select an analysis and a country first.");
      return;
    }
    if (!saveTitle) {
      setLtError("Please give this analysis a title to save it under.");
      return;
    }
    // If a long-term analysis already exists under this save title, show it
    // instead of re-running (the backend rejects duplicate titles).
    const existing = ltRuns.find((r) => (r?.title || "") === saveTitle);
    if (existing) {
      setLtInfo(`An analysis titled "${saveTitle}" already exists — showing the saved results.`);
      openPastLt(existing);
      return;
    }
    setLtRunning(true);
    setLtResults(null);
    setLtOpenSkill(null);
    const now = new Date();
    try {
      const res = await axios.post(`${CURRICULUM}/skill-gap/longterm/gap-by-title`, {
        title: saveTitle,
        source_title: ltTitle,
        description: selectedLtTitle?.description || null,
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        country: ltCountry,
        esco_threshold: Number(ltEscoThreshold) || 0.4,
      });
      setLtResults(res.data || { skills: [] });
      setLtActiveTitle(saveTitle);
      setLtActiveFilters(null); // fresh run — the form fields already show the filters
      loadLtRuns();
    } catch (e) {
      if (e?.response?.status === 409) {
        setLtError(`An analysis titled "${saveTitle}" already exists. Choose a different title or open it from "Past analyses".`);
        loadLtRuns();
      } else {
        setLtError(`Could not run the analysis: ${errText(e)}`);
      }
    } finally {
      setLtRunning(false);
    }
  };

  // ---- past analyses ----
  const loadRuns = async () => {
    setRunsLoading(true);
    try {
      const res = await axios.get(`${CURRICULUM}/policy/runs`);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.runs || raw?.data || []);
      // newest first when a date is available
      const withDate = [...list].sort((a, b) => runDateValue(b) - runDateValue(a));
      setRuns(withDate);
    } catch (e) {
      // non-fatal — the "Past analyses" button just shows nothing
    } finally {
      setRunsLoading(false);
    }
  };

  const runDateValue = (r) => {
    const y = r?.year, m = r?.month, d = r?.day;
    if (y) return new Date(y, (m || 1) - 1, d || 1).getTime();
    const t = Date.parse(r?.date || r?.created_at || "");
    return Number.isNaN(t) ? 0 : t;
  };

  const runDateLabel = (r) => {
    const y = r?.year, m = r?.month, d = r?.day;
    if (y) return `${String(d || 1).padStart(2, "0")}/${String(m || 1).padStart(2, "0")}/${y}`;
    const raw = r?.date || r?.created_at;
    if (!raw) return "";
    const t = Date.parse(raw);
    return Number.isNaN(t) ? String(raw) : new Date(t).toLocaleDateString();
  };

  const openPastAnalysis = (run) => {
    const title = run?.title;
    if (!title) return;
    const country = run?.filters?.country || run?.country || "";
    if (pollRef.current) clearTimeout(pollRef.current);
    setShowPastModal(false);
    setError(null);
    setStTitle(title);
    if (run.description) setStDescription(run.description);
    setActiveTitle(title);
    setActiveFilters(run.filters || null);
    // Reflect the run's own country in the filters (and reset the university).
    setSelectedCountry(country);
    setSelectedUniversity("");
    setRunId(null);
    setRunning(false);
    setStatus("completed");
    setResults(null);
    fetchResults({ title, country, university: "" });
  };

  // ---- run analysis ----
  const runAnalysis = async () => {
    setError(null);
    setResults(null);
    const title = stTitle.trim();
    if (!title) {
      setError("Please give this analysis a title.");
      return;
    }
    if (!selectedOccupations.length) {
      setError("Please select at least one occupation.");
      return;
    }
    if (!selectedCountry) {
      setError("Please select a country.");
      return;
    }
    if (runs.some((r) => (r?.title || "").trim().toLowerCase() === title.toLowerCase())) {
      setError(`An analysis titled "${title}" already exists. Please choose a different title.`);
      return;
    }
    if (pollRef.current) clearTimeout(pollRef.current);
    setRunning(true);
    setStatus("running");
    setActiveTitle(title);
    setActiveFilters(null); // fresh run — the form fields already show the filters
    const now = new Date();
    try {
      const res = await axios.post(`${CURRICULUM}/policy/analyze`, {
        title,
        description: stDescription.trim() || null,
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        country: selectedCountry || null,
        occupations: selectedOccupations,
        threshold: Number(threshold) || 0,
        top_n: Number(topN) || 100,
      });
      const rid = res.data.run_id;
      setRunId(rid);
      loadRuns();
      pollStatus(rid, title);
    } catch (e) {
      setError(`Could not start the analysis: ${errText(e)}`);
      setRunning(false);
      setStatus(null);
    }
  };

  const pollStatus = (rid, title) => {
    const tick = async () => {
      try {
        const res = await axios.get(`${CURRICULUM}/policy/status/${rid}`);
        if (res.data.status === "completed") {
          setStatus("completed");
          setRunning(false);
          fetchResults({ title, run_id: rid });
          return; // stop polling
        }
      } catch (e) {
        // transient — keep polling
      }
      pollRef.current = setTimeout(tick, 4000);
    };
    pollRef.current = setTimeout(tick, 3000);
  };

  const fetchResults = async (opts = {}) => {
    const title = opts.title != null ? opts.title : activeTitle;
    const rid = opts.run_id || runId;
    if (!title && !rid) return;
    setLoadingResults(true);
    setError(null);
    try {
      const params = {};
      if (title) params.title = title;
      else params.run_id = rid;
      // `country` (and `university`) override the current UI filters — used when
      // loading a past analysis so results are scoped to that run's own country.
      const country = opts.country !== undefined
        ? opts.country
        : (opts.applyFilters !== false ? selectedCountry : "");
      const university = opts.university !== undefined
        ? opts.university
        : (opts.applyFilters !== false ? selectedUniversity : "");
      if (country) params.country = country;
      if (university) params.university = university;
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
  const toggleMissing = (key) =>
    setOpenMissing((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderUniversityResult = (r, idx) => {
    const present = r.present_skills_count ?? 0;
    const missing = r.missing_skills_count ?? 0;
    const totalConsidered = present + missing;
    const pct = totalConsidered > 0 ? Math.round((present / totalConsidered) * 100) : 0;
    const missingDepts = r.missing_departments || {};
    const missKey = r.id || idx;
    const missOpen = !!openMissing[missKey];
    const missCount = Object.keys(missingDepts).length;
    // coverage_score is present/total*100 (2 decimals) — the precise coverage %.
    const cov = r.coverage_score != null ? r.coverage_score : pct;

    return (
      <Card key={r.id || idx} style={{ marginBottom: 12 }}>
        <CardHeader>
          <CardTitle tag="h5" className="mb-1">
            {r.university_name}{" "}
            <span style={{ color: "#888", fontWeight: 400 }}>({r.country})</span>
          </CardTitle>
          <div>
            <Badge color={cov >= 50 ? "success" : cov >= 20 ? "warning" : "danger"}>
              {cov}% covered
            </Badge>{" "}
            <Badge color="success" outline>{present} present</Badge>{" "}
            <Badge color="danger" outline>{missing} missing</Badge>
          </div>
        </CardHeader>
        <CardBody>
          {/* Missing skills grouped by occupation — collapsed by default */}
          {missCount === 0 ? (
            <>
              <h6 className="mb-1">Missing skills by occupation</h6>
              <em style={{ color: "#999" }}>None.</em>
            </>
          ) : (
            <>
              <div
                onClick={() => toggleMissing(missKey)}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <h6 className="mb-0">
                  <i className={`fas ${missOpen ? "fa-chevron-down" : "fa-chevron-right"}`} style={{ marginRight: 8 }}></i>
                  Missing skills by occupation
                </h6>
                <Button
                  color="link"
                  size="sm"
                  className="p-0"
                  onClick={(e) => { e.stopPropagation(); toggleMissing(missKey); }}
                >
                  {missOpen ? "Hide" : "Show"}
                </Button>
              </div>
              <Collapse isOpen={missOpen}>
                <div style={{ marginTop: 8 }}>
                  {Object.entries(missingDepts).map(([occ, skills]) => (
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
                  ))}
                </div>
              </Collapse>
            </>
          )}
        </CardBody>
      </Card>
    );
  };

  // ---- long-term renderers ----
  const renderLtSummary = (data) => {
    const skills = data.skills || [];
    const total = data.total_skills ?? data.total_unique_skills ?? skills.length;
    const covered = data.covered_count ?? skills.filter((s) => s.in_curriculum).length;
    const missing = data.missing_count ?? (total - covered);
    const pct = data.coverage_pct != null
      ? Math.round(data.coverage_pct)
      : (total > 0 ? Math.round((covered / total) * 100) : 0);
    const country = data.country || data.filters?.country;
    return (
      <Card style={{ marginBottom: 12 }}>
        <CardBody>
          <h5 className="mb-2">
            Coverage{country ? <span style={{ color: "#999", fontWeight: 400 }}> · {country}</span> : null}
          </h5>
          <Badge color={pct >= 50 ? "success" : pct >= 20 ? "warning" : "danger"}>
            {pct}% covered
          </Badge>{" "}
          <Badge color="success" outline>{covered} in curricula</Badge>{" "}
          <Badge color="danger" outline>{missing} missing</Badge>{" "}
          <span style={{ color: "#999" }}>{total} skill{total === 1 ? "" : "s"} total</span>
          {data.jobs_found != null && (
            <span style={{ color: "#999" }}> · {data.jobs_found} PDF analysis job{data.jobs_found === 1 ? "" : "s"}</span>
          )}
        </CardBody>
      </Card>
    );
  };

  const renderLtSkill = (s, idx) => {
    const key = `lt::${idx}::${s.skill_id || s.skill_name}`;
    const open = ltOpenSkill === key;
    const courses = s.curriculum_courses || [];
    const techs = s.technologies || [];
    return (
      <Card key={key} style={{ marginBottom: 8 }}>
        <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            <strong>{s.skill_name}</strong>{" "}
            <Badge color={s.in_curriculum ? "success" : "danger"} style={{ color: "#fff" }}>
              {s.in_curriculum ? "in curricula" : "missing"}
            </Badge>
          </span>
          <Button size="sm" color="link" onClick={() => setLtOpenSkill(open ? null : key)}>
            <i className={`fas ${open ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
          </Button>
        </CardHeader>
        <Collapse isOpen={open}>
          <CardBody>
            {techs.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <strong>Technologies:</strong>{" "}
                {techs.map((t, i) => (
                  <Badge key={i} color="info" outline style={{ marginRight: 4, marginBottom: 4 }}>{t}</Badge>
                ))}
              </div>
            )}
            <div>
              <strong>Taught at</strong>{" "}
              {courses.length === 0 ? (
                <em style={{ color: "#999" }}>not found in the selected country's curricula.</em>
              ) : (
                <ul style={{ marginTop: 4, marginBottom: 0 }}>
                  {courses.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              )}
            </div>
          </CardBody>
        </Collapse>
      </Card>
    );
  };

  // Small read-only panel showing the filters a loaded past analysis was run with.
  const renderUsedFilters = (items, occupations) => (
    <div style={{ border: "1px solid #eee", background: "#fafafa", borderRadius: 6, padding: "8px 12px", marginBottom: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        <i className="fas fa-filter" style={{ marginRight: 6, color: "#888" }}></i>
        Filters used for this analysis
      </div>
      <div style={{ marginBottom: (occupations && occupations.length) ? 6 : 0 }}>
        {items
          .filter((it) => it.value !== undefined && it.value !== null && it.value !== "")
          .map((it, i) => (
            <span key={i} style={{ marginRight: 14 }}>
              <span style={{ color: "#888" }}>{it.label}: </span>{it.value}
            </span>
          ))}
      </div>
      {Array.isArray(occupations) && occupations.length > 0 && (
        <div>
          <span style={{ color: "#888" }}>Occupations: </span>
          {occupations.map((o, i) => (
            <Badge key={i} color="info" style={{ marginRight: 4, marginBottom: 4 }}>{o}</Badge>
          ))}
        </div>
      )}
    </div>
  );

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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <div style={{ color: "#666" }}>
                  {activeTitle && <span>Viewing: <strong>{activeTitle}</strong></span>}
                </div>
                <Button color="info" outline size="sm" onClick={() => { setShowPastModal(true); loadRuns(); }}>
                  <i className="fas fa-history" style={{ marginRight: 6 }}></i>Past analyses
                </Button>
              </div>

              {activeFilters && renderUsedFilters(
                [
                  { label: "Country", value: activeFilters.country || "All countries" },
                  { label: "Threshold", value: activeFilters.threshold ?? 0 },
                  { label: "Top N", value: activeFilters.top_n },
                ],
                activeFilters.occupations
              )}

              <Row className="align-items-end">
                <Col md="6">
                  <FormGroup>
                    <Label><strong>Title</strong> *</Label>
                    <Input
                      bsSize="sm"
                      placeholder="A unique name for this analysis"
                      value={stTitle}
                      onChange={(e) => setStTitle(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Description <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span></Label>
                    <Input
                      bsSize="sm"
                      placeholder="What is this analysis about?"
                      value={stDescription}
                      onChange={(e) => setStDescription(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>

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
                  <Button color="primary" onClick={runAnalysis} disabled={running || !stTitle.trim() || selectedOccupations.length === 0 || !selectedCountry}>
                    {running ? <><Spinner size="sm" /> Analysing…</> : "Run Short-Term Analysis"}
                  </Button>{" "}
                  {status === "completed" && (
                    <Button color="secondary" outline onClick={() => fetchResults({ title: activeTitle, run_id: runId })} disabled={loadingResults}>
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <div style={{ color: "#666" }}>
                  {ltActiveTitle && <span>Viewing: <strong>{ltActiveTitle}</strong></span>}
                </div>
                <Button color="info" outline size="sm" onClick={() => { setLtShowPastModal(true); loadLtRuns(); }}>
                  <i className="fas fa-history" style={{ marginRight: 6 }}></i>Past analyses
                </Button>
              </div>

              {ltActiveFilters && renderUsedFilters(
                [
                  { label: "Source analysis", value: ltActiveFilters.source_title },
                  { label: "Country", value: ltActiveFilters.country || "All countries" },
                  { label: "ESCO threshold", value: ltActiveFilters.esco_threshold ?? 0.4 },
                ],
                null
              )}

              <p className="text-muted">
                Choose a Future Technology Trends analysis (filter by sector, then pick
                the analysis) and a country. The analysis compares that country's
                curricula against the skills behind the selected technology trends.
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

              {/* Step 2 — pick the target country */}
              <h6 className="mt-3"><Badge color="primary" pill>2</Badge> Target country</h6>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>Country *</Label>
                    <Input
                      type="select"
                      value={ltCountry}
                      onChange={(e) => setLtCountry(e.target.value)}
                      disabled={ltCountriesLoading}
                    >
                      <option value="">
                        {ltCountriesLoading ? "Loading countries…" : "— select a country —"}
                      </option>
                      {ltCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Input>
                    <small className="text-muted">
                      All universities of the selected country are included automatically.
                    </small>
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label>ESCO similarity threshold</Label>
                    <Input
                      type="number" min="0" max="1" step="0.05"
                      value={ltEscoThreshold}
                      onChange={(e) => setLtEscoThreshold(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>

              {/* Step 3 — the title this analysis is saved under */}
              <h6 className="mt-3"><Badge color="primary" pill>3</Badge> Save as</h6>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>Analysis title *</Label>
                    <Input
                      value={ltSaveTitle}
                      onChange={(e) => { ltSaveTitleTouched.current = true; setLtSaveTitle(e.target.value); }}
                      placeholder="A unique name to save this analysis under"
                    />
                    <small className="text-muted">
                      Must be unique. Defaults to the analysis name and country, so you can
                      save one long-term analysis per country for the same trends analysis.
                    </small>
                  </FormGroup>
                </Col>
              </Row>

              {ltInfo && <Alert color="info" toggle={() => setLtInfo(null)} className="mt-2">{ltInfo}</Alert>}

              <Button color="primary" onClick={startLongTerm} disabled={!canStartLt || ltRunning}>
                {ltRunning ? <><Spinner size="sm" /> Analysing…</> : "Start Long-Term Analysis"}
              </Button>
              {!canStartLt && !ltRunning && (
                <small className="text-muted ml-2">
                  Select a sector, an analysis, a country and a title.
                </small>
              )}

              {ltRunning && (
                <Alert color="info" style={{ marginTop: 12 }}>
                  <Spinner size="sm" /> Working — building the skill pool from the analysis and
                  comparing it against {ltCountry || "the country"}'s curricula. This can take a moment.
                </Alert>
              )}

              {!ltRunning && ltResults && Array.isArray(ltResults.skills) && (
                <div style={{ marginTop: 16 }}>
                  {ltResults.skills.length === 0 ? (
                    <Alert color="warning">No skills were produced for this analysis.</Alert>
                  ) : (
                    <>
                      {renderLtSummary(ltResults)}
                      {(() => {
                        const missing = ltResults.skills.filter((s) => !s.in_curriculum);
                        const covered = ltResults.skills.filter((s) => s.in_curriculum);
                        return (
                          <>
                            <h6 className="mt-2">
                              <i className="fas fa-exclamation-triangle" style={{ color: "#e74c3c" }}></i>{" "}
                              Missing from curricula{" "}
                              <span style={{ color: "#999", fontWeight: 400 }}>({missing.length})</span>
                            </h6>
                            {missing.length === 0 ? (
                              <em style={{ color: "#999" }}>None — every skill is covered.</em>
                            ) : (
                              missing.map(renderLtSkill)
                            )}

                            <h6 className="mt-3">
                              <i className="fas fa-check-circle" style={{ color: "#28a745" }}></i>{" "}
                              In curricula{" "}
                              <span style={{ color: "#999", fontWeight: 400 }}>({covered.length})</span>
                            </h6>
                            {covered.length === 0 ? (
                              <em style={{ color: "#999" }}>None found in the selected country's curricula.</em>
                            ) : (
                              covered.map(renderLtSkill)
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
            </TabPane>
          </TabContent>
        </CardBody>
      </Card>

      {/* ================= PAST ANALYSES MODAL ================= */}
      <Modal isOpen={showPastModal} toggle={() => setShowPastModal(false)} size="lg">
        <ModalHeader toggle={() => setShowPastModal(false)}>Past analyses</ModalHeader>
        <ModalBody>
          {runsLoading ? (
            <div><Spinner size="sm" /> loading…</div>
          ) : runs.length === 0 ? (
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
                {runs.map((r, i) => (
                  <tr key={r.title || r.run_id || i}>
                    <td><strong>{r.title || <em className="text-muted">(untitled)</em>}</strong></td>
                    <td style={{ color: "#666" }}>{r.description || ""}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{runDateLabel(r)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Button
                        color="primary"
                        size="sm"
                        outline
                        disabled={!r.title}
                        onClick={() => openPastAnalysis(r)}
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
          <Button color="secondary" outline onClick={() => loadRuns()} disabled={runsLoading}>
            Refresh
          </Button>
          <Button color="secondary" onClick={() => setShowPastModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* ============ LONG-TERM PAST ANALYSES MODAL ============ */}
      <Modal isOpen={ltShowPastModal} toggle={() => setLtShowPastModal(false)} size="lg">
        <ModalHeader toggle={() => setLtShowPastModal(false)}>Past long-term analyses</ModalHeader>
        <ModalBody>
          {ltRunsLoading ? (
            <div><Spinner size="sm" /> loading…</div>
          ) : ltRuns.length === 0 ? (
            <p className="text-muted mb-0">No past analyses yet. Run one to see it here.</p>
          ) : (
            <Table hover responsive size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Source analysis</th>
                  <th>Country</th>
                  <th>Skills</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ltRuns.map((r, i) => (
                  <tr key={r.title || r.run_id || i}>
                    <td><strong>{r.title || <em className="text-muted">(untitled)</em>}</strong></td>
                    <td style={{ color: "#666" }}>{r.source_title || ""}</td>
                    <td style={{ color: "#666" }}>{r.filters?.country || r.country || ""}</td>
                    <td>{r.skills_count != null ? r.skills_count : ""}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{runDateLabel(r)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Button
                        color="primary"
                        size="sm"
                        outline
                        disabled={!r.title}
                        onClick={() => openPastLt(r)}
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
          <Button color="secondary" outline onClick={() => loadLtRuns()} disabled={ltRunsLoading}>
            Refresh
          </Button>
          <Button color="secondary" onClick={() => setLtShowPastModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ProgramAndNeeds;
