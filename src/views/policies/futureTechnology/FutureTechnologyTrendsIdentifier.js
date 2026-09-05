import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button,
  Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner, Input, Label,
  FormGroup, Badge, Table, Modal, ModalHeader, ModalBody, ListGroup, ListGroupItem,
  Progress
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';
import TechnologyList from "./TechnologyList";
import EscoMappingResults from "./EscoMappingResults";
import PolicyRecommendations from "./PolicyRecommendations";
import { getId } from "../../../utils/Tokens";

const API_BASE_URL = process.env.REACT_APP_API_URL_FUTURE_TECHNOLOGY_TRENDS_IDENTIFIER;

const OVERVIEW = '__overview__';

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` });

// Format an ISO timestamp as a plain date (day / month / year), no time.
const formatAnalysisDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Human label for a pipeline stage.
const stageLabel = (stage, status) => {
  if (status === 'done') return 'Done';
  if (status === 'error') return 'Failed';
  switch (stage) {
    case 'analyzing': return 'Analyzing PDF…';
    case 'recommending': return 'Mapping to ESCO & generating recommendations…';
    case 'queued': return 'Queued…';
    default: return 'Processing…';
  }
};

// Delay function that is cancellable
const cancellableDelay = (ms, signal) => {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      return reject(new axios.Cancel('Operation canceled.'));
    }
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new axios.Cancel('Operation canceled.'));
    });
  });
};

// Continuously attempts to fetch a URL until success or cancellation
const fetchContinuously = async (url, signal, interval = 5000) => {
  let attempt = 0;
  while (true) {
    if (signal.aborted) {
      throw new axios.Cancel('Operation canceled by the user.');
    }
    try {
      const response = await axios.get(url, { signal, headers: authHeader() });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      if (error.response && error.response.status === 404) {
        attempt++;
        await cancellableDelay(interval, signal);
      } else {
        throw error;
      }
    }
  }
};

// Merge the recommendations of all PDFs into a single list, grouped by
// technology, de-duplicating identical actions.
const mergeRecommendations = (pdfs) => {
  const byTech = new Map();
  pdfs.forEach((p) => {
    const recs = (p.recommendationsData && p.recommendationsData.recommendations) || [];
    recs.forEach((r) => {
      const key = r.technology || 'Unknown technology';
      if (!byTech.has(key)) byTech.set(key, { technology: key, actions: [], _seen: new Set() });
      const agg = byTech.get(key);
      (r.actions || []).forEach((a) => {
        const sig = `${a.area || ''}||${a.action || ''}`;
        if (!agg._seen.has(sig)) { agg._seen.add(sig); agg.actions.push(a); }
      });
    });
  });
  return { recommendations: Array.from(byTech.values()).map(({ _seen, ...rest }) => rest) };
};

// Apply a stored policy result (mapping_evidence + recommendations) to a PDF.
// Applied once per PDF (policyApplied guard) so a running poll won't fight the
// user's tab navigation. A policy result is shown even when it produced zero
// recommendations, so the "Policy Recommendations" tab still appears (with the
// "No policy recommendations…" message) instead of staying disabled.
const applyPolicyToPdf = (p, pol) => {
  if (p.policyApplied) return p;
  const content = pol && pol.content;
  if (!content) return p; // policy not ready / job errored — leave as is
  const me = content.mapping_evidence;
  const hasMapping = !!me && (
    (me.occupations && me.occupations.length) || (me.skills && me.skills.length)
  );
  const recs = Array.isArray(content.recommendations) ? content.recommendations : [];
  return {
    ...p,
    policyApplied: true,
    escoMapping: hasMapping ? me : p.escoMapping,
    recommendationsData: { recommendations: recs }, // may be [] -> shows the empty message
    activeTab: '3', // land on the Recommendations tab (its last/most-advanced tab)
  };
};

// ─── Combo select (same look as EducationManagement) ────────────────────────
// A dropdown of existing values plus an "Add new…" option that flips to a
// free-text input (with a link back to the list).
const NEW_SENTINEL = "__ftti_new__";

function ComboSelect({ value, options, onChange, selectPlaceholder, inputPlaceholder, bsSize, disabled, id }) {
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
          id={id}
          bsSize={bsSize}
          type="text"
          value={value}
          placeholder={inputPlaceholder}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button color="link" size="sm" style={{ padding: "2px 0" }}
          onClick={() => { setAdding(false); onChange(""); }}>
          &larr; choose from list
        </Button>
      </div>
    );
  }

  return (
    <Input
      id={id}
      bsSize={bsSize}
      type="select"
      value={options.includes(value) ? value : ""}
      onChange={handleSelect}
      disabled={disabled}
    >
      <option value="">{selectPlaceholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
      <option value={NEW_SENTINEL}>&#43; Add new&hellip;</option>
    </Input>
  );
}

// ─── Previous Analyses Modal ────────────────────────────────────────────────
// Lists the analysis *titles* that exist (including ones still running).

const PreviousAnalysesModal = ({ isOpen, toggle, onLoad, onDeleted }) => {
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState(null);
  const [deletingTitle, setDeletingTitle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) fetchTitles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchTitles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/analyses/titles?include_running=true`, { headers: authHeader() });
      setTitles(res.data || []);
    } catch (err) {
      setError("Failed to load previous analyses.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTitle = async (titleItem) => {
    setLoadingTitle(titleItem.title);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/analyses/by-title/${encodeURIComponent(titleItem.title)}?include_content=true&include_running=true`,
        { headers: authHeader() }
      );
      onLoad(titleItem, res.data || []);
      toggle();
    } catch (err) {
      setError("Failed to load the analyses for this title.");
      console.error(err);
    } finally {
      setLoadingTitle(null);
    }
  };

  const handleDeleteTitle = async (titleItem) => {
    const ok = window.confirm(
      `Delete the analysis "${titleItem.title}" and all ${titleItem.count} PDF${titleItem.count === 1 ? '' : 's'} under it? This cannot be undone.`
    );
    if (!ok) return;
    setDeletingTitle(titleItem.title);
    setError(null);
    try {
      await axios.delete(
        `${API_BASE_URL}/analyses/by-title/${encodeURIComponent(titleItem.title)}`,
        { headers: authHeader() }
      );
      setTitles((prev) => prev.filter((t) => t.title !== titleItem.title));
      if (onDeleted) onDeleted(titleItem.title);
    } catch (err) {
      setError("Failed to delete this analysis.");
      console.error(err);
    } finally {
      setDeletingTitle(null);
    }
  };

  const busy = loadingTitle !== null || deletingTitle !== null;

  const statusBadge = (t) => {
    if (t.status === 'running') {
      return <Badge color="warning"><Spinner size="sm" /> Running {t.done_count}/{t.total}</Badge>;
    }
    if (t.status === 'partial') {
      return <Badge color="danger">Partial {t.done_count}/{t.total}</Badge>;
    }
    return <Badge color="success">Done</Badge>;
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>Previous Analyses</ModalHeader>
      <ModalBody>
        {loading && (
          <div className="text-center py-4">
            <Spinner color="primary" />
            <p className="mt-2">Loading...</p>
          </div>
        )}
        {error && <Alert color="danger">{error}</Alert>}
        {!loading && !error && titles.length === 0 && (
          <p className="text-muted">No previous analyses found.</p>
        )}
        {!loading && titles.length > 0 && (
          <>
          {/* Desktop / tablet: full table */}
          <div className="d-none d-md-block">
          <Table bordered hover responsive size="sm">
            <thead className="thead-light">
              <tr>
                <th>Title</th>
                <th>Sector</th>
                <th className="text-center"># PDFs</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {titles.map((t) => (
                <tr key={t.title}>
                  <td>
                    <strong>{t.title}</strong>
                    {t.created_at && (
                      <small className="text-muted ml-2">{formatAnalysisDate(t.created_at)}</small>
                    )}
                    {t.description && (
                      <div className="text-muted small">{t.description}</div>
                    )}
                  </td>
                  <td>
                    {t.sector
                      ? <Badge color="info">{t.sector}</Badge>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="text-center">{t.count}</td>
                  <td className="text-center">{statusBadge(t)}</td>
                  <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                    <Button color="info" size="sm" className="mr-2" disabled={busy}
                      onClick={() => handleSelectTitle(t)}>
                      {loadingTitle === t.title ? <Spinner size="sm" /> : (t.status === 'running' ? 'View progress' : 'View')}
                    </Button>
                    <Button color="danger" outline size="sm" disabled={busy}
                      onClick={() => handleDeleteTitle(t)}>
                      {deletingTitle === t.title ? <Spinner size="sm" /> : 'Delete'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div>

          {/* Phones: stacked cards so the actions are never cut off */}
          <div className="d-md-none">
            {titles.map((t) => (
              <Card key={t.title} className="mb-2 border">
                <CardBody className="p-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div style={{ minWidth: 0 }}>
                      <strong>{t.title}</strong>
                      {t.created_at && (
                        <small className="text-muted d-block">{formatAnalysisDate(t.created_at)}</small>
                      )}
                    </div>
                    <span className="flex-shrink-0 ml-2">{statusBadge(t)}</span>
                  </div>
                  {t.description && (
                    <div className="text-muted small mt-1">{t.description}</div>
                  )}
                  <div className="d-flex flex-wrap align-items-center mt-2">
                    {t.sector && <Badge color="info" className="mr-2 mb-1">{t.sector}</Badge>}
                    <span className="text-muted small mb-1">{t.count} PDF{t.count === 1 ? '' : 's'}</span>
                  </div>
                  <div className="d-flex mt-2">
                    <Button color="info" size="sm" className="mr-2" disabled={busy}
                      onClick={() => handleSelectTitle(t)}>
                      {loadingTitle === t.title ? <Spinner size="sm" /> : (t.status === 'running' ? 'View progress' : 'View')}
                    </Button>
                    <Button color="danger" outline size="sm" disabled={busy}
                      onClick={() => handleDeleteTitle(t)}>
                      {deletingTitle === t.title ? <Spinner size="sm" /> : 'Delete'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const makePdfEntry = (overrides = {}) => ({
  id: overrides.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  filename: overrides.filename || 'document.pdf',
  file: overrides.file || null,
  jobId: overrides.jobId || null,
  status: overrides.status || 'pending', // pending | polling | done | error
  stage: overrides.stage || null,
  message: '',
  error: overrides.error || null,
  technologies: overrides.technologies || [],
  escoMapping: null,
  escoLoading: false,
  recommendationsData: null,
  recLoading: false,
  policyApplied: false,
  activeTab: '1',
  ...overrides,
});

const PdfStatusIcon = ({ status }) => {
  if (status === 'done') return <span className="text-success mr-1">✓</span>;
  if (status === 'error') return <span className="text-danger mr-1">✗</span>;
  if (status === 'polling' || status === 'uploading') return <Spinner size="sm" className="mr-1" />;
  return <span className="text-muted mr-1">•</span>; // pending / queued
};

// ─── Main component ─────────────────────────────────────────────────────────

const FutureTechnologyTrendsIdentifier = () => {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'results'
  const [meta, setMeta] = useState({ title: '', sector: '', description: '' });
  const [titleTaken, setTitleTaken] = useState(false);
  const [titleChecking, setTitleChecking] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdfId, setSelectedPdfId] = useState(OVERVIEW);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [escoParams, setEscoParams] = useState({ top_n: 5, threshold: 0.4, target: "both" });
  const [policyParams, setPolicyParams] = useState({ similarity_threshold: 0.5, max_actions_per_tech: 5, target: "both" });
  const [showPreviousModal, setShowPreviousModal] = useState(false);
  const [sectorOptions, setSectorOptions] = useState([]); // existing sectors for the combobox

  const runControllerRef = useRef(null);       // aborts the whole batch run / polling
  const recControllersRef = useRef({});         // per-pdf recommendation abort controllers

  useEffect(() => {
    return () => {
      runControllerRef.current?.abort();
      Object.values(recControllersRef.current).forEach((c) => c?.abort());
    };
  }, []);

  // Load the existing sectors so the Sector field can suggest them (and still
  // allow typing a new one).
  const loadSectorOptions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/analyses/sectors`, { headers: authHeader() });
      setSectorOptions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // Non-blocking — the field still works as free text.
    }
  };
  useEffect(() => { loadSectorOptions(); }, []);

  const updatePdf = (id, patch) => {
    setPdfs((prev) => prev.map((p) =>
      p.id === id ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p
    ));
  };

  const cancelRun = () => {
    runControllerRef.current?.abort();
    Object.values(recControllersRef.current).forEach((c) => c?.abort());
    recControllersRef.current = {};
  };

  // ── File selection (setup phase) ──────────────────────────────────────────
  const handleFileChange = (e) => {
    const incoming = Array.from(e.target.files || []);
    setSelectedFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size));
      const merged = [...prev];
      incoming.forEach((f) => { if (!seen.has(f.name + f.size)) merged.push(f); });
      return merged;
    });
    e.target.value = '';
    setError(null);
  };

  const removeSelectedFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Title uniqueness check ────────────────────────────────────────────────
  const checkTitleTaken = async (title) => {
    const t = (title || '').trim();
    if (!t) { setTitleTaken(false); return false; }
    setTitleChecking(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/analyses/title-exists`, {
        params: { title: t }, headers: authHeader(),
      });
      const taken = !!(res.data && res.data.exists);
      setTitleTaken(taken);
      return taken;
    } catch (err) {
      console.error(err);
      setTitleTaken(false);
      return false;
    } finally {
      setTitleChecking(false);
    }
  };

  // ── Fetch a PDF's identified technologies once its analysis is done ────────
  const fetchTechnologies = async (id, jobId, signal) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/results/${jobId}/download`, { signal, headers: authHeader() });
      updatePdf(id, {
        status: 'done', stage: 'done',
        technologies: (res.data && res.data.technologies) || [],
        message: '', error: null,
      });
    } catch (err) {
      if (!axios.isCancel(err)) {
        updatePdf(id, { status: 'error', stage: 'error', error: 'Could not fetch results for this PDF.' });
        console.error(err);
      }
    }
  };

  // ── Pull stored policies for a title and merge them into the PDFs ──────────
  const refreshPolicies = async (title, signal) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/policies/by-title/${encodeURIComponent(title)}?include_content=true`,
        { signal, headers: authHeader() }
      );
      const byJob = {};
      (res.data || []).forEach((pol) => {
        const src = pol.source_job_id;
        if (src && !byJob[src]) byJob[src] = pol;
      });
      setPdfs((prev) => prev.map((p) => (p.jobId && byJob[p.jobId] ? applyPolicyToPdf(p, byJob[p.jobId]) : p)));
    } catch (e) {
      if (!axios.isCancel(e)) console.error('Could not load stored policy results.', e);
    }
  };

  // ── Poll a set of analysis jobs until all finish ──────────────────────────
  const pollBatch = async (batch, title, signal) => {
    const pending = new Set(batch.map((b) => b.id));
    while (pending.size > 0) {
      if (signal.aborted) return;
      for (const { id, jobId } of batch) {
        if (!pending.has(id)) continue;
        try {
          const res = await axios.get(`${API_BASE_URL}/jobs/${jobId}`, { signal, headers: authHeader() });
          const { status, stage, message } = res.data;
          if (status === 'done') {
            pending.delete(id);
            await fetchTechnologies(id, jobId, signal);
          } else if (status === 'error' || status === 'failed') {
            pending.delete(id);
            updatePdf(id, { status: 'error', stage: 'error', error: message || 'Analysis failed.', message: '' });
          } else {
            updatePdf(id, { status: 'polling', stage: stage || status, message });
          }
        } catch (err) {
          if (axios.isCancel(err)) return;
          // A 404 can happen briefly while a job registers — keep waiting.
          if (!(err.response && err.response.status === 404)) console.error(err);
        }
      }
      await refreshPolicies(title, signal);
      if (pending.size === 0) break;
      try { await cancellableDelay(3000, signal); } catch (e) { return; }
    }
    // Final sweep to pick up the last PDFs' recommendations.
    await refreshPolicies(title, signal);
  };

  // ── Start the one-click full analysis ─────────────────────────────────────
  const startAnalysis = async () => {
    if (!meta.title.trim()) { setError("Please enter a title for this analysis."); return; }
    if (selectedFiles.length === 0) { setError("Please add at least one PDF file."); return; }

    const taken = await checkTitleTaken(meta.title);
    if (taken) {
      setError("An analysis with this title already exists. Please choose a different title.");
      return;
    }
    setError(null);

    const metaSnapshot = {
      title: meta.title.trim(),
      sector: meta.sector.trim(),
      description: meta.description.trim(),
    };
    const files = [...selectedFiles];

    const entries = files.map((file) =>
      makePdfEntry({ filename: file.name, file, status: 'pending', stage: 'queued' })
    );
    setPdfs(entries);
    setSelectedPdfId(OVERVIEW);
    setPhase('results');
    setProcessing(true);

    runControllerRef.current = new AbortController();
    const { signal } = runControllerRef.current;

    let userId;
    try { userId = await getId(); } catch (e) { userId = undefined; }

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      if (userId !== undefined && userId !== null) formData.append('user_id', userId);
      formData.append('title', metaSnapshot.title);
      if (metaSnapshot.sector) formData.append('sector', metaSnapshot.sector);
      if (metaSnapshot.description) formData.append('description', metaSnapshot.description);

      const res = await axios.post(`${API_BASE_URL}/analyze/pdf/full`, formData, {
        signal, headers: { 'Content-Type': 'multipart/form-data', ...authHeader() },
      });
      const jobIds = (res.data && res.data.job_ids) || [];

      // Assign job ids to entries by index (backend keeps upload order).
      setPdfs((prev) => prev.map((p, i) => ({
        ...p, jobId: jobIds[i] || p.jobId, status: 'polling', stage: 'queued',
      })));

      const batch = entries
        .map((e, i) => ({ id: e.id, jobId: jobIds[i] }))
        .filter((x) => x.jobId);

      await pollBatch(batch, metaSnapshot.title, signal);
    } catch (err) {
      if (axios.isCancel(err)) {
        setPdfs((prev) => prev.map((p) => (p.status === 'done' ? p : { ...p, status: 'error', stage: 'error', error: 'Canceled.' })));
      } else {
        setError("Failed to start the analysis. Please try again.");
        setPdfs((prev) => prev.map((p) => (p.status === 'done' ? p : { ...p, status: 'error', stage: 'error', error: 'Failed to start.' })));
        console.error(err);
      }
    } finally {
      setProcessing(false);
    }
  };

  // ── Per-PDF ESCO mapping (manual re-run) ──────────────────────────────────
  const handleMapToEsco = async (pdf) => {
    updatePdf(pdf.id, { escoLoading: true, error: null });
    try {
      const res = await axios.post(
        `${API_BASE_URL}/map-to-esco`,
        { job_id: pdf.jobId, ...escoParams },
        { headers: authHeader() }
      );
      updatePdf(pdf.id, { escoMapping: res.data, activeTab: '2', escoLoading: false });
    } catch (err) {
      updatePdf(pdf.id, { escoLoading: false, error: 'Failed to map technologies to ESCO.' });
      console.error(err);
    }
  };

  // ── Per-PDF policy recommendations (manual re-run) ────────────────────────
  const handleGetRecommendations = async (pdf) => {
    updatePdf(pdf.id, { recLoading: true, error: null, message: '' });
    const controller = new AbortController();
    recControllersRef.current[pdf.id] = controller;
    const { signal } = controller;
    try {
      let userId;
      try { userId = await getId(); } catch (e) { userId = undefined; }
      const res = await axios.post(
        `${API_BASE_URL}/policy/recommendations`,
        { job_id: pdf.jobId, user_id: userId, ...policyParams },
        { signal, headers: authHeader() }
      );
      if (res.data.result_path) {
        updatePdf(pdf.id, { message: 'Recommendation job sent. Polling for results...' });
        const downloadUrl = `${API_BASE_URL}/results/${res.data.job_id}/download`;
        const finalData = await fetchContinuously(downloadUrl, signal);
        updatePdf(pdf.id, {
          recommendationsData: { recommendations: finalData.recommendations || [] },
          escoMapping: finalData.mapping_evidence || pdf.escoMapping,
          policyApplied: true,
          activeTab: '3', recLoading: false, message: '',
        });
      } else {
        updatePdf(pdf.id, { recommendationsData: null, recLoading: false, message: '' });
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        updatePdf(pdf.id, { recLoading: false, message: 'Recommendation polling canceled.' });
      } else {
        updatePdf(pdf.id, { recLoading: false, error: 'An error occurred while getting recommendations.', message: '' });
        console.error(err);
      }
    }
  };

  const handleCancelRecommendations = (pdf) => {
    recControllersRef.current[pdf.id]?.abort();
    updatePdf(pdf.id, { recLoading: false, message: 'Recommendation polling canceled.' });
  };

  const setPdfTab = (id, tab) => updatePdf(id, { activeTab: tab });

  // ── Load a previous analysis (by title), resuming if still running ────────
  const handleLoadPrevious = async (titleItem, records) => {
    cancelRun();
    setMeta({
      title: titleItem.title || '',
      sector: titleItem.sector || '',
      description: titleItem.description || '',
    });

    const entries = (records || []).map((rec, i) =>
      makePdfEntry({
        id: rec.job_id || `prev-${Date.now()}-${i}`,
        filename: rec.filename || `PDF ${i + 1}`,
        file: null,
        jobId: rec.job_id,
        status: rec.status === 'done' ? 'done' : (rec.status === 'error' ? 'error' : 'polling'),
        stage: rec.stage,
        technologies: (rec.content && rec.content.technologies) || [],
        error: rec.status === 'error' ? (rec.message || 'Analysis failed.') : null,
      })
    );
    setPdfs(entries);
    setSelectedPdfId(OVERVIEW);
    setError(null);
    setPhase('results');

    const running = entries.filter((e) => e.status !== 'done' && e.status !== 'error');
    setProcessing(running.length > 0);

    runControllerRef.current = new AbortController();
    const { signal } = runControllerRef.current;

    // Restore stored recommendations/mapping for the finished PDFs.
    await refreshPolicies(titleItem.title, signal);

    // Resume polling any PDFs still in progress.
    if (running.length > 0) {
      const batch = running.map((e) => ({ id: e.id, jobId: e.jobId })).filter((x) => x.jobId);
      pollBatch(batch, titleItem.title, signal).finally(() => setProcessing(false));
    }
  };

  const handleDeletedPrevious = (deletedTitle) => {
    if (phase === 'results' && meta.title === deletedTitle) resetAll();
  };

  const resetAll = () => {
    cancelRun();
    setPhase('setup');
    setMeta({ title: '', sector: '', description: '' });
    setTitleTaken(false);
    setTitleChecking(false);
    setSelectedFiles([]);
    setPdfs([]);
    setSelectedPdfId(OVERVIEW);
    setProcessing(false);
    setError(null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedPdf = pdfs.find((p) => p.id === selectedPdfId) || null;
  const overviewData = useMemo(() => mergeRecommendations(pdfs), [pdfs]);

  const total = pdfs.length;
  const doneCount = pdfs.filter((p) => p.status === 'done').length;
  const errorCount = pdfs.filter((p) => p.status === 'error').length;
  const finished = doneCount + errorCount;
  const pct = total ? Math.round((100 * finished) / total) : 0;
  const currentStagePdf = pdfs.find((p) => p.status === 'polling');

  const progressBlock = (total > 0 && (processing || finished < total)) ? (
    <div className="mb-3">
      <Progress value={pct} striped animated={processing}>{pct}%</Progress>
      <small className="text-muted">
        {doneCount} of {total} PDF{total === 1 ? '' : 's'} analyzed
        {errorCount > 0 ? ` · ${errorCount} failed` : ''}
        {currentStagePdf ? ` · ${currentStagePdf.filename}: ${stageLabel(currentStagePdf.stage, currentStagePdf.status)}` : ''}
      </small>
    </div>
  ) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <CardTitle tag="h4" className="mb-0">Future Technology Trends Identifier</CardTitle>
          <Button color="secondary" outline size="sm" onClick={() => setShowPreviousModal(true)}>
            📂 Previous Analyses
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        {/* ───────────── SETUP PHASE ───────────── */}
        {phase === 'setup' && (
          <>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="analysisTitle">Title <span className="text-danger">*</span></Label>
                  <Input
                    id="analysisTitle"
                    type="text"
                    placeholder="e.g. National AI Strategy 2026"
                    value={meta.title}
                    invalid={titleTaken}
                    onChange={(e) => { setMeta({ ...meta, title: e.target.value }); setTitleTaken(false); }}
                    onBlur={(e) => checkTitleTaken(e.target.value)}
                  />
                  {titleChecking && <small className="text-muted">Checking availability…</small>}
                  {titleTaken && (
                    <small className="text-danger">
                      An analysis with this title already exists — please choose a different one.
                    </small>
                  )}
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="analysisSector">Sector</Label>
                  <ComboSelect
                    id="analysisSector"
                    value={meta.sector}
                    options={sectorOptions}
                    onChange={(v) => setMeta({ ...meta, sector: v })}
                    selectPlaceholder="— select a sector —"
                    inputPlaceholder="Type a new sector"
                  />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label for="analysisDescription">Description</Label>
              <Input
                id="analysisDescription"
                type="textarea"
                rows="2"
                placeholder="Short description of this analysis"
                value={meta.description}
                onChange={(e) => setMeta({ ...meta, description: e.target.value })}
              />
            </FormGroup>

            <FormGroup>
              <Label for="pdfFiles">PDF documents to analyze</Label>
              <Input type="file" id="pdfFiles" accept=".pdf" multiple onChange={handleFileChange} />
              <small className="text-muted">
                Add one or more PDFs. One click runs the whole pipeline for each —
                technologies, ESCO mapping and policy recommendations — automatically.
              </small>
            </FormGroup>

            {selectedFiles.length > 0 && (
              <ListGroup className="mb-3">
                {selectedFiles.map((f, idx) => (
                  <ListGroupItem key={f.name + f.size + idx} className="d-flex justify-content-between align-items-center py-2">
                    <span>📄 {f.name} <small className="text-muted">({(f.size / 1024).toFixed(0)} KB)</small></span>
                    <button type="button" className="close" aria-label="Remove" onClick={() => removeSelectedFile(idx)}>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </ListGroupItem>
                ))}
              </ListGroup>
            )}

            {error && <Alert color="danger">{error}</Alert>}

            <Button
              color="primary"
              onClick={startAnalysis}
              disabled={!meta.title.trim() || selectedFiles.length === 0 || titleTaken || titleChecking}
            >
              Analyze {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}
              PDF{selectedFiles.length === 1 ? '' : 's'}
            </Button>
          </>
        )}

        {/* ───────────── RESULTS PHASE ───────────── */}
        {phase === 'results' && (
          <>
            <div className="mb-3">
              <h5 className="mb-1">
                {meta.title || 'Analysis'}
                {meta.sector && <Badge color="info" className="ml-2">{meta.sector}</Badge>}
              </h5>
              {meta.description && <p className="text-muted mb-0">{meta.description}</p>}
            </div>

            {progressBlock}
            {error && <Alert color="danger">{error}</Alert>}

            {/* Overview + per-PDF selector */}
            <Nav pills className="flex-wrap mb-3">
              <NavItem>
                <NavLink
                  className={classnames({ active: selectedPdfId === OVERVIEW })}
                  onClick={() => setSelectedPdfId(OVERVIEW)}
                  style={{ cursor: 'pointer' }}
                >
                  🧭 Overview
                </NavLink>
              </NavItem>
              {pdfs.map((p) => (
                <NavItem key={p.id}>
                  <NavLink
                    className={classnames({ active: selectedPdfId === p.id })}
                    onClick={() => setSelectedPdfId(p.id)}
                    style={{ cursor: 'pointer' }}
                    title={p.filename}
                  >
                    <PdfStatusIcon status={p.status} />
                    {p.filename}
                  </NavLink>
                </NavItem>
              ))}
            </Nav>

            {/* ── OVERVIEW (combined recommendations) ── */}
            {selectedPdfId === OVERVIEW && (
              <div>
                <h5>
                  Combined recommendations
                </h5>
                {overviewData.recommendations.length === 0 ? (
                  processing ? (
                    <Alert color="info">
                      <Spinner size="sm" className="mr-2" />
                      Recommendations will appear here as each PDF finishes…
                    </Alert>
                  ) : (
                    <PolicyRecommendations data={overviewData} />
                  )
                ) : (
                  <>
                    {processing && (
                      <p className="text-muted">
                        <Spinner size="sm" className="mr-1" /> Still analyzing — this view updates as more PDFs finish.
                      </p>
                    )}
                    <PolicyRecommendations data={overviewData} />
                    <hr />
                    <small className="text-muted">Open a PDF above to see its individual technologies and mapping.</small>
                  </>
                )}
              </div>
            )}

            {/* ── PER-PDF DETAIL ── */}
            {selectedPdfId !== OVERVIEW && selectedPdf && (
              <div key={selectedPdf.id}>
                {(selectedPdf.status === 'pending' || selectedPdf.status === 'polling') && (
                  <div className="text-center py-4">
                    <Spinner color="primary" />
                    <p className="mt-3 mb-0">{stageLabel(selectedPdf.stage, selectedPdf.status)}</p>
                  </div>
                )}

                {selectedPdf.status === 'error' && (
                  <Alert color="danger">{selectedPdf.error || 'This PDF could not be analyzed.'}</Alert>
                )}

                {selectedPdf.status === 'done' && (
                  <>
                    {(selectedPdf.escoLoading || selectedPdf.recLoading) && (
                      <div className="mb-2 text-muted d-flex align-items-center">
                        <Spinner size="sm" className="mr-2" />
                        <span>
                          {selectedPdf.escoLoading && 'Mapping to ESCO...'}
                          {selectedPdf.recLoading && (selectedPdf.message || 'Generating recommendations...')}
                        </span>
                        {selectedPdf.recLoading && (
                          <Button color="danger" outline size="sm" className="ml-3"
                            onClick={() => handleCancelRecommendations(selectedPdf)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}

                    <Nav tabs>
                      <NavItem>
                        <NavLink className={classnames({ active: selectedPdf.activeTab === '1' })}
                          onClick={() => setPdfTab(selectedPdf.id, '1')} style={{ cursor: 'pointer' }}>
                          Identified Technologies
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink className={classnames({ active: selectedPdf.activeTab === '2' })}
                          onClick={() => setPdfTab(selectedPdf.id, '2')}
                          disabled={!selectedPdf.escoMapping} style={{ cursor: 'pointer' }}>
                          ESCO Mapping
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink className={classnames({ active: selectedPdf.activeTab === '3' })}
                          onClick={() => setPdfTab(selectedPdf.id, '3')}
                          disabled={!selectedPdf.recommendationsData} style={{ cursor: 'pointer' }}>
                          Policy Recommendations
                        </NavLink>
                      </NavItem>
                    </Nav>

                    <TabContent activeTab={selectedPdf.activeTab} className="mt-3">
                      <TabPane tabId="1">
                        <TechnologyList
                          technologies={selectedPdf.technologies}
                          escoParams={escoParams}
                          setEscoParams={setEscoParams}
                          onMapClick={() => handleMapToEsco(selectedPdf)}
                          loading={selectedPdf.escoLoading}
                        />
                      </TabPane>
                      <TabPane tabId="2">
                        <EscoMappingResults
                          escoMapping={selectedPdf.escoMapping}
                          policyParams={policyParams}
                          setPolicyParams={setPolicyParams}
                          onRecommendClick={() => handleGetRecommendations(selectedPdf)}
                          loading={selectedPdf.recLoading}
                        />
                      </TabPane>
                      <TabPane tabId="3">
                        {selectedPdf.recommendationsData &&
                          (selectedPdf.recommendationsData.recommendations || []).length === 0 && (
                            <div className="mb-2">
                              <Button
                                color="secondary"
                                outline
                                size="sm"
                                onClick={() => setPdfTab(selectedPdf.id, selectedPdf.escoMapping ? '2' : '1')}
                              >
                                ← Adjust parameters &amp; re-run
                              </Button>
                            </div>
                          )}
                        <PolicyRecommendations data={selectedPdf.recommendationsData} />
                      </TabPane>
                    </TabContent>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </CardBody>

      <CardFooter>
        <Button outline color="secondary" onClick={resetAll}>
          {phase === 'setup' ? 'Clear' : 'Start Over'}
        </Button>
      </CardFooter>

      <PreviousAnalysesModal
        isOpen={showPreviousModal}
        toggle={() => setShowPreviousModal(false)}
        onLoad={handleLoadPrevious}
        onDeleted={handleDeletedPrevious}
      />
    </Card>
  );
};

export default FutureTechnologyTrendsIdentifier;
