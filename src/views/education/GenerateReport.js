import React, { useState, useEffect, useRef } from "react";
import {
  Card, CardHeader, CardBody, CardTitle, Row, Col, Button,
  Alert, Spinner, Input, Label, FormGroup, Badge,
} from "reactstrap";
import axios from "axios";
import { mdToHtml, stripMarkdownFence, PRINT_CSS } from "../../utils/markdown";

const CURRICULUM = process.env.REACT_APP_API_URL_CURRICULUM_SKILLS;

// Curriculum-skills is served behind the authenticated user-management gateway.
const ftAuth = () => ({ Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` });

const errText = (err, fallback = "Something went wrong") =>
  err?.response?.data?.detail || err?.message || fallback;

// The generate endpoint runs the LLM job asynchronously: the first POST (and
// every one after it, as long as the same analysis is selected) either comes
// back "running" — meaning the job is still in progress server-side — or
// "completed" with the recommendations. We poll by resending the same
// request until it reports "completed".
const REPORT_POLL_INTERVAL_MS = 5000;

const runDateValue = (r) => {
  const t = Date.parse(r?.date || r?.created_at || "");
  return Number.isNaN(t) ? 0 : t;
};

// Education accounts only ever get to build a report from their own Skill
// Recommendations (short-term skill-gap) analyses — no Future Technology
// Trends / Long Term picker here, unlike the policy accounts' Generate Report.
const GenerateReport = () => {
  // ---- source analyses ----
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [shorttermTitle, setShorttermTitle] = useState("");

  // ---- options ----
  const [focus, setFocus] = useState("");
  const [forceRefresh, setForceRefresh] = useState(false);

  // ---- result ----
  const [report, setReport] = useState(null);       // markdown string
  const [reportMeta, setReportMeta] = useState(null); // {cached, used_analyses, not_found, created_at}
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState(""); // "running" wait message from the API
  const [error, setError] = useState(null);

  // Tracks whether the component is still mounted, so a poll response that
  // arrives after unmount doesn't try to update state; also holds the
  // pending poll timeout so it can be cancelled (unmount, Cancel, Clear).
  const mountedRef = useRef(true);
  const pollTimeoutRef = useRef(null);

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cancel any in-flight poll on unmount.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, []);

  const loadRuns = async () => {
    setRunsLoading(true);
    try {
      const res = await axios.get(`${CURRICULUM}/skill-gap/runs`);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.runs || raw?.data || []);
      const sorted = [...list].sort((a, b) => runDateValue(b) - runDateValue(a));
      setRuns(sorted);
    } catch (e) {
      setError((prev) => prev || `Could not load Skill Recommendations analyses: ${errText(e)}`);
    } finally {
      setRunsLoading(false);
    }
  };

  const generate = async () => {
    setError(null);
    if (!shorttermTitle) {
      setError("Select an analysis to include in the report.");
      return;
    }
    const basePayload = {
      shortterm_title: shorttermTitle,
      focus: focus.trim() || null,
    };

    setGenerating(true);
    setGeneratingStatus("");

    // The endpoint has no job id: polling means resending the same request.
    // Only the very first request should carry force_refresh — every poll
    // after that must send force_refresh: false, otherwise each poll tick
    // would kick off a brand new computation instead of checking on it.
    const poll = async (isFirstRequest) => {
      const payload = { ...basePayload, force_refresh: isFirstRequest ? forceRefresh : false };
      try {
        const res = await axios.post(`${CURRICULUM}/recommendations/generate`, payload, { headers: ftAuth() });
        if (!mountedRef.current) return;
        const data = res.data || {};

        if (data.status === "running") {
          setGeneratingStatus(data.message || "Your analysis is already running. Check back shortly.");
          pollTimeoutRef.current = setTimeout(() => poll(false), REPORT_POLL_INTERVAL_MS);
          return;
        }

        if (data.status && data.status !== "completed") {
          setReport(null);
          setReportMeta(null);
          setError(data.message || `Unexpected report status: ${data.status}`);
          setGenerating(false);
          setGeneratingStatus("");
          return;
        }

        // status === "completed" (or an older response with no status field at all)
        setReport(data.recommendations || "");
        setReportMeta({
          cached: !!data.cached,
          used_analyses: data.used_analyses,
          not_found: data.not_found || [],
          created_at: data.created_at || null,
        });
        if (!data.recommendations) {
          setError("The report came back empty. Try again or adjust the selected analysis.");
        }
        setGenerating(false);
        setGeneratingStatus("");
      } catch (e) {
        if (!mountedRef.current) return;
        setReport(null);
        setReportMeta(null);
        setError(`Could not generate the report: ${errText(e)}`);
        setGenerating(false);
        setGeneratingStatus("");
      }
    };

    poll(true);
  };

  const cancelGenerating = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setGenerating(false);
    setGeneratingStatus("");
  };

  const clearAll = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setGenerating(false);
    setGeneratingStatus("");
    setShorttermTitle("");
    setFocus("");
    setForceRefresh(false);
    setReport(null);
    setReportMeta(null);
    setError(null);
  };

  const printReport = () => {
    if (!report) return;
    const html =
      `<!doctype html><html><head><meta charset="utf-8">` +
      `<title>Skill Recommendations Report</title><style>${PRINT_CSS}</style></head>` +
      `<body>${mdToHtml(stripMarkdownFence(report))}</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        // ignore
      }
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };

  const reportHtml = report ? mdToHtml(stripMarkdownFence(report)) : "";

  return (
    <div className="content">
      <Card>
        <CardHeader>
          <CardTitle tag="h4" className="mb-1">Generate Report</CardTitle>
          <span style={{ color: "#666" }}>
            Build an LLM report from a Skill Recommendations analysis you have already run.
          </span>
        </CardHeader>
        <CardBody>
          {error && <Alert color="danger" toggle={() => setError(null)}>{error}</Alert>}

          <Row>
            <Col md="6">
              <FormGroup>
                <Label>
                  <i className="fas fa-graduation-cap" style={{ marginRight: 6, color: "#ef8157" }}></i>
                  Skill Recommendations analysis
                </Label>
                <Input
                  type="select"
                  value={shorttermTitle}
                  onChange={(e) => setShorttermTitle(e.target.value)}
                  disabled={runsLoading}
                >
                  <option value="">{runsLoading ? "Loading…" : "— select an analysis —"}</option>
                  {runs.filter((r) => r.title).map((r, i) => (
                    <option key={r.title || r.run_id || i} value={r.title}>
                      {r.title}{r.filters?.country ? ` · ${r.filters.country}` : ""}
                    </option>
                  ))}
                </Input>
                {!runsLoading && runs.length === 0 && (
                  <small className="text-muted">No analyses found. Run one from Recommendations first.</small>
                )}
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md="8">
              <FormGroup>
                <Label>Focus <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span></Label>
                <Input
                  bsSize="sm"
                  placeholder="e.g. focus on Greece, emphasise data-science skills…"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="4" className="d-flex align-items-center">
              <FormGroup check className="mt-2">
                <Label check>
                  <Input
                    type="checkbox"
                    checked={forceRefresh}
                    onChange={(e) => setForceRefresh(e.target.checked)}
                  />{" "}
                  Regenerate (ignore cached report)
                </Label>
              </FormGroup>
            </Col>
          </Row>

          <Button color="primary" onClick={generate} disabled={!shorttermTitle || generating}>
            {generating ? <><Spinner size="sm" /> Generating…</> : "Generate report"}
          </Button>{" "}
          {generating ? (
            <Button color="secondary" outline onClick={cancelGenerating}>
              Cancel
            </Button>
          ) : (
            (shorttermTitle || report) && (
              <Button color="secondary" outline onClick={clearAll}>
                Clear
              </Button>
            )
          )}
          {!shorttermTitle && !generating && (
            <small className="text-muted ml-2">Select an analysis.</small>
          )}

          {generating && (
            <Alert color="info" className="mt-3 mb-0">
              <Spinner size="sm" style={{ marginRight: 8 }} />
              {generatingStatus || "Generating your report…"}
            </Alert>
          )}
        </CardBody>
      </Card>

      {/* ---- Report preview ---- */}
      {report != null && (
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <CardTitle tag="h5" className="mb-1">Recommendations</CardTitle>
                {reportMeta && (
                  <span style={{ color: "#666" }}>
                    {reportMeta.cached ? (
                      <Badge color="secondary">cached{reportMeta.created_at ? ` · ${new Date(reportMeta.created_at).toLocaleDateString()}` : ""}</Badge>
                    ) : (
                      <Badge color="success">freshly generated</Badge>
                    )}
                  </span>
                )}
              </div>
              <Button color="info" outline size="sm" onClick={printReport} disabled={!report}>
                <i className="fas fa-print" style={{ marginRight: 6 }}></i>Print report
              </Button>
            </div>
            {reportMeta && reportMeta.not_found && reportMeta.not_found.length > 0 && (
              <Alert color="warning" className="mt-2 mb-0">
                No saved analysis found for: {reportMeta.not_found.join(", ")}. The report used the rest.
              </Alert>
            )}
          </CardHeader>
          <CardBody>
            {report ? (
              <div className="report-markdown" dangerouslySetInnerHTML={{ __html: reportHtml }} />
            ) : (
              <em style={{ color: "#999" }}>No recommendations were returned.</em>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default GenerateReport;
