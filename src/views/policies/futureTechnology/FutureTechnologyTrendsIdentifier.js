import React, { useState, useEffect, useRef } from "react";
import {
  Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button,
  Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner, Input, Label,
  FormGroup, Badge, Table, Modal, ModalHeader, ModalBody, ListGroup, ListGroupItem
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';
import TechnologyList from "./TechnologyList";
import EscoMappingResults from "./EscoMappingResults";
import PolicyRecommendations from "./PolicyRecommendations";
import { getId } from "../../../utils/Tokens";

const API_BASE_URL = process.env.REACT_APP_API_URL_FUTURE_TECHNOLOGY_TRENDS_IDENTIFIER;

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` });

// Format an ISO timestamp as a plain date (day / month / year), no time.
const formatAnalysisDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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
      if (axios.isCancel(error)) {
        console.log('Fetch canceled.');
        throw error;
      }
      if (error.response && error.response.status === 404) {
        attempt++;
        console.log(`Attempt ${attempt} failed with 404. Retrying in ${interval / 1000}s...`);
        await cancellableDelay(interval, signal);
      } else {
        throw error;
      }
    }
  }
};

// ─── Previous Analyses Modal ────────────────────────────────────────────────
// Lists the analysis *titles* that exist (with sector / description / count).
// Selecting one loads all the PDF analyses stored under that title.

const PreviousAnalysesModal = ({ isOpen, toggle, onLoad }) => {
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) fetchTitles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchTitles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/analyses/titles`, { headers: authHeader() });
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
        `${API_BASE_URL}/analyses/by-title/${encodeURIComponent(titleItem.title)}?include_content=true`,
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
          <Table bordered hover responsive size="sm">
            <thead className="thead-light">
              <tr>
                <th>Title</th>
                <th>Sector</th>
                <th className="text-center"># PDFs</th>
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
                  <td className="text-center">
                    <Button
                      color="info"
                      size="sm"
                      disabled={loadingTitle !== null}
                      onClick={() => handleSelectTitle(t)}
                    >
                      {loadingTitle === t.title ? <Spinner size="sm" /> : 'View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
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
  status: overrides.status || 'pending', // pending | uploading | polling | done | error
  message: '',
  error: null,
  technologies: overrides.technologies || [],
  escoMapping: null,
  escoLoading: false,
  recommendationsData: null,
  recLoading: false,
  activeTab: '1',
  ...overrides,
});

const PdfStatusIcon = ({ status }) => {
  if (status === 'done') return <span className="text-success mr-1">✓</span>;
  if (status === 'error') return <span className="text-danger mr-1">✗</span>;
  if (status === 'uploading' || status === 'polling') return <Spinner size="sm" className="mr-1" />;
  return <span className="text-muted mr-1">•</span>; // pending / queued
};

// ─── Main component ─────────────────────────────────────────────────────────

const FutureTechnologyTrendsIdentifier = () => {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'results'
  const [meta, setMeta] = useState({ title: '', sector: '', description: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdfId, setSelectedPdfId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [escoParams, setEscoParams] = useState({ top_n: 5, threshold: 0.4, target: "both" });
  const [policyParams, setPolicyParams] = useState({ similarity_threshold: 0.5, max_actions_per_tech: 5, target: "both" });
  const [showPreviousModal, setShowPreviousModal] = useState(false);

  const runControllerRef = useRef(null);       // aborts the whole sequential run
  const recControllersRef = useRef({});         // per-pdf recommendation abort controllers

  useEffect(() => {
    return () => {
      runControllerRef.current?.abort();
      Object.values(recControllersRef.current).forEach((c) => c?.abort());
    };
  }, []);

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
      incoming.forEach((f) => {
        if (!seen.has(f.name + f.size)) merged.push(f);
      });
      return merged;
    });
    e.target.value = ''; // allow re-selecting the same file later
    setError(null);
  };

  const removeSelectedFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Sequential analysis (one PDF at a time) ───────────────────────────────
  const startAnalysis = async () => {
    if (!meta.title.trim()) { setError("Please enter a title for this analysis."); return; }
    if (selectedFiles.length === 0) { setError("Please add at least one PDF file."); return; }
    setError(null);

    const metaSnapshot = {
      title: meta.title.trim(),
      sector: meta.sector.trim(),
      description: meta.description.trim(),
    };

    const entries = selectedFiles.map((file) =>
      makePdfEntry({ filename: file.name, file, status: 'pending' })
    );
    setPdfs(entries);
    setSelectedPdfId(entries[0].id);
    setPhase('results');
    setProcessing(true);

    runControllerRef.current = new AbortController();
    const { signal } = runControllerRef.current;

    let userId;
    try {
      userId = await getId();
    } catch (e) {
      userId = undefined;
    }

    // Process the PDFs strictly one after another (performance-friendly).
    for (const entry of entries) {
      if (signal.aborted) {
        updatePdf(entry.id, { status: 'error', error: 'Canceled.' });
        continue;
      }
      await analyzeOne(entry, metaSnapshot, userId, signal);
    }

    setProcessing(false);
  };

  const analyzeOne = async (entry, metaSnapshot, userId, signal) => {
    updatePdf(entry.id, { status: 'uploading', error: null, message: 'Uploading...' });
    try {
      const formData = new FormData();
      formData.append('file', entry.file);
      if (userId !== undefined && userId !== null) formData.append('user_id', userId);
      formData.append('title', metaSnapshot.title);
      if (metaSnapshot.sector) formData.append('sector', metaSnapshot.sector);
      if (metaSnapshot.description) formData.append('description', metaSnapshot.description);

      const res = await axios.post(`${API_BASE_URL}/analyze/pdf`, formData, {
        signal,
        headers: { 'Content-Type': 'multipart/form-data', ...authHeader() },
      });
      const { job_id, status } = res.data;
      updatePdf(entry.id, { jobId: job_id });

      if (status === 'done') {
        await fetchTechnologies(entry.id, job_id, signal);
      } else {
        updatePdf(entry.id, { status: 'polling', message: status });
        await pollJob(entry.id, job_id, signal);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        updatePdf(entry.id, { status: 'error', error: 'Canceled.', message: '' });
      } else {
        updatePdf(entry.id, { status: 'error', error: 'Analysis failed for this PDF.', message: '' });
        console.error(err);
      }
    }
  };

  const pollJob = (id, jobId, signal) => new Promise(async (resolve) => {
    while (true) {
      if (signal.aborted) {
        updatePdf(id, { status: 'error', error: 'Canceled.', message: '' });
        return resolve();
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/jobs/${jobId}`, { signal, headers: authHeader() });
        const { status, message } = res.data;
        if (status === 'done') {
          await fetchTechnologies(id, jobId, signal);
          return resolve();
        }
        if (status === 'error' || status === 'failed') {
          updatePdf(id, { status: 'error', error: message || 'Analysis job failed.', message: '' });
          return resolve();
        }
        updatePdf(id, { status: 'polling', message: message || status });
      } catch (err) {
        if (axios.isCancel(err)) {
          updatePdf(id, { status: 'error', error: 'Canceled.', message: '' });
          return resolve();
        }
        // A 404 can happen briefly while the job registers — keep waiting.
        if (!(err.response && err.response.status === 404)) {
          updatePdf(id, { status: 'error', error: 'Could not get job status.', message: '' });
          console.error(err);
          return resolve();
        }
      }
      try {
        await cancellableDelay(3000, signal);
      } catch (e) {
        updatePdf(id, { status: 'error', error: 'Canceled.', message: '' });
        return resolve();
      }
    }
  });

  const fetchTechnologies = async (id, jobId, signal) => {
    const res = await axios.get(`${API_BASE_URL}/results/${jobId}/download`, { signal, headers: authHeader() });
    updatePdf(id, {
      status: 'done',
      technologies: (res.data && res.data.technologies) || [],
      message: '',
      error: null,
    });
  };

  // ── Per-PDF ESCO mapping ──────────────────────────────────────────────────
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

  // ── Per-PDF policy recommendations ────────────────────────────────────────
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
        updatePdf(pdf.id, { recommendationsData: finalData, activeTab: '3', recLoading: false, message: '' });
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

  // ── Load a previous analysis (by title) ───────────────────────────────────
  const handleLoadPrevious = async (titleItem, records) => {
    cancelRun();
    setMeta({
      title: titleItem.title || '',
      sector: titleItem.sector || '',
      description: titleItem.description || '',
    });

    // Show the PDFs (with their technologies) right away.
    const entries = (records || []).map((rec, i) =>
      makePdfEntry({
        id: rec.job_id || `prev-${Date.now()}-${i}`,
        filename: rec.filename || `PDF ${i + 1}`,
        file: null,
        jobId: rec.job_id,
        status: 'done',
        technologies: (rec.content && rec.content.technologies) || [],
      })
    );
    setPdfs(entries);
    setSelectedPdfId(entries.length ? entries[0].id : null);
    setProcessing(false);
    setError(null);
    setPhase('results');

    // Then restore any previously stored policy results (ESCO mapping +
    // recommendations) so the user isn't asked to generate them again.
    // These are saved as policy jobs whose source_job_id is the analysis job.
    try {
      const userId = await getId();
      const polRes = await axios.get(
        `${API_BASE_URL}/users/${userId}/policies?include_content=true`,
        { headers: authHeader() }
      );
      const policyByJob = {};
      (polRes.data || []).forEach((pol) => {
        const src = pol.source_job_id;
        // The list is newest-first, so keep the first (most recent) per source.
        if (src && !policyByJob[src]) policyByJob[src] = pol;
      });

      setPdfs((prev) => prev.map((p) => {
        const pol = policyByJob[p.jobId];
        const content = pol && pol.content;
        if (!content) return p;

        const me = content.mapping_evidence;
        const hasMapping = !!me && (
          (me.occupations && me.occupations.length) ||
          (me.skills && me.skills.length)
        );
        const hasRecs = !!(content.recommendations && content.recommendations.length);
        if (!hasMapping && !hasRecs) return p;

        // Land on recommendations if they exist, otherwise the ESCO mapping.
        const nextTab = hasRecs ? '3' : (hasMapping ? '2' : p.activeTab);

        return {
          ...p,
          escoMapping: hasMapping ? me : p.escoMapping,
          recommendationsData: hasRecs ? { recommendations: content.recommendations } : p.recommendationsData,
          activeTab: nextTab,
        };
      }));
    } catch (e) {
      // Non-fatal: the user can still re-run mapping / recommendations.
      console.error('Could not load stored policy results.', e);
    }
  };

  // ── Start over ────────────────────────────────────────────────────────────
  const resetAll = () => {
    cancelRun();
    setPhase('setup');
    setMeta({ title: '', sector: '', description: '' });
    setSelectedFiles([]);
    setPdfs([]);
    setSelectedPdfId(null);
    setProcessing(false);
    setError(null);
  };

  const selectedPdf = pdfs.find((p) => p.id === selectedPdfId) || null;

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
                    onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="analysisSector">Sector</Label>
                  <Input
                    id="analysisSector"
                    type="text"
                    placeholder="e.g. ICT, Health, Energy"
                    value={meta.sector}
                    onChange={(e) => setMeta({ ...meta, sector: e.target.value })}
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
                You can add several PDFs — they are analyzed one at a time.
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
              disabled={!meta.title.trim() || selectedFiles.length === 0}
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
              {processing && (
                <p className="text-muted mt-2 mb-0">
                  <Spinner size="sm" className="mr-1" /> Analyzing PDFs one at a time...
                </p>
              )}
            </div>

            {error && <Alert color="danger">{error}</Alert>}

            {/* PDF selector */}
            <Nav pills className="flex-wrap mb-3">
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

            {/* Selected PDF detail */}
            {selectedPdf && (
              <div key={selectedPdf.id}>
                {(selectedPdf.status === 'pending' || selectedPdf.status === 'uploading' || selectedPdf.status === 'polling') && (
                  <div className="text-center py-4">
                    <Spinner color="primary" />
                    <p className="mt-3 mb-0">
                      {selectedPdf.status === 'pending' && 'Queued — waiting for earlier PDFs to finish...'}
                      {selectedPdf.status === 'uploading' && 'Uploading and initiating analysis...'}
                      {selectedPdf.status === 'polling' && `Processing: ${selectedPdf.message || 'running'}`}
                    </p>
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
      />
    </Card>
  );
};

export default FutureTechnologyTrendsIdentifier;
