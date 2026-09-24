import React, { useEffect, useRef, useState } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input, Button, Row, Col, Spinner, Alert,
} from "reactstrap";
import { getOrganization } from "../../../../utils/Tokens";
import {
  API_BASE, POLL_INTERVAL_MS, EMPLOYMENT_TYPES, WORK_MODELS, SENIORITIES,
  authHeaders, normalizeJobStatus, buildJobAdPayload, formatStructuredExportAsText,
  fetchOrgJobAds, fetchJobAdDescription,
} from "./jobAdRecommendation";

const emptyFields = {
  companySector: "",
  jobRole: "",
  companyName: "",
  location: "",
  employmentType: "Full-time",
  seniority: "Mid-level",
  workModel: "On-site",
  teamContext: "",
  additionalContext: "",
  language: "English",
  tone: "Professional and inclusive",
  maxWords: 650,
  mustInclude: [],
  avoid: [],
  minResponsibilities: 6,
  minRequirements: 5,
  minBenefits: 3,
  pastAds: [],
};

// Small chip-style text list input (type + Enter to add), same idea as the
// one on the Auto Job Ads "Generate" page.
function ChipInput({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const add = (raw) => {
    const v = raw.trim();
    if (!v || values.includes(v)) { setDraft(""); return; }
    onChange([...values, v]);
    setDraft("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div
      style={{
        display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
        border: "1px solid #ced4da", borderRadius: 8, padding: "6px 8px", minHeight: 40, background: "#fff",
      }}
    >
      {values.map((v) => (
        <span
          key={v}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, background: "#eef2ff",
            color: "#3730a3", borderRadius: 999, padding: "3px 10px", fontSize: 12.5, fontWeight: 600,
          }}
        >
          {v}
          <button
            type="button"
            style={{ border: "none", background: "transparent", color: "#6366f1", cursor: "pointer", lineHeight: 1, padding: 0, fontSize: 14 }}
            onClick={() => onChange(values.filter((x) => x !== v))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        style={{ border: "none", outline: "none", flex: 1, minWidth: 120, fontSize: 14 }}
        value={draft}
        placeholder={values.length ? "" : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
      />
    </div>
  );
}

/**
 * Lets the user generate a job ad description with AI (the same engine as
 * industry/account/auto-job-advertisements) without leaving the Description
 * tab. Collects whatever context isn't already known about this job ad,
 * submits it, polls until the job finishes, then shows a preview the user
 * can drop into the description textarea.
 */
function AdRecommendationModal({ isOpen, toggle, onGenerated, defaultJobRole, defaultLocation, excludeJobAdId }) {
  const [fields, setFields] = useState(emptyFields);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // phase: "form" | "generating" | "preview" | "error"
  const [phase, setPhase] = useState("form");
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [generatedText, setGeneratedText] = useState("");

  // "past advertisements" — either typed manually or pulled from an existing job ad
  const [existingJobAds, setExistingJobAds] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState("");
  const [addingExisting, setAddingExisting] = useState(false);
  const [pastAdsError, setPastAdsError] = useState("");

  const pollRef = useRef(null);
  const mountedRef = useRef(true);

  const setField = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const stopPolling = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

  // Reset the form (with prefill) and clear any in-flight poll whenever the modal opens.
  useEffect(() => {
    mountedRef.current = true;
    if (!isOpen) {
      stopPolling();
      return;
    }
    setPhase("form");
    setError("");
    setGeneratedText("");
    setStatusText("");
    setSelectedExistingId("");
    setPastAdsError("");
    setFields({
      ...emptyFields,
      jobRole: defaultJobRole || "",
      location: defaultLocation || "",
    });
    (async () => {
      try {
        const org = await getOrganization();
        if (mountedRef.current && org) {
          setFields((f) => ({ ...f, companyName: f.companyName || org }));
        }
      } catch {
        // ignore — company name just stays editable/empty
      }
    })();
    (async () => {
      setLoadingExisting(true);
      try {
        const jobs = await fetchOrgJobAds();
        if (mountedRef.current) setExistingJobAds(jobs);
      } catch {
        if (mountedRef.current) setPastAdsError("Could not load your existing job ads.");
      } finally {
        if (mountedRef.current) setLoadingExisting(false);
      }
    })();
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const updatePastAd = (index, field, value) =>
    setFields((f) => ({
      ...f,
      pastAds: f.pastAds.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));

  const addPastAd = () =>
    setFields((f) => ({
      ...f,
      pastAds: [...f.pastAds, { title: "", text: "", notes: "", tempId: Math.random() }],
    }));

  const removePastAd = (index) =>
    setFields((f) => ({ ...f, pastAds: f.pastAds.filter((_, i) => i !== index) }));

  const usedExistingIds = new Set(fields.pastAds.map((p) => p.sourceJobAdId).filter(Boolean));
  const selectableExistingJobAds = existingJobAds.filter(
    (j) => String(j.id) !== String(excludeJobAdId) && !usedExistingIds.has(j.id)
  );

  const handleAddExistingAsPastAd = async () => {
    if (!selectedExistingId) return;
    const job = existingJobAds.find((j) => String(j.id) === String(selectedExistingId));
    if (!job) return;
    setAddingExisting(true);
    setPastAdsError("");
    try {
      const text = await fetchJobAdDescription(job.id);
      setFields((f) => ({
        ...f,
        pastAds: [
          ...f.pastAds,
          { title: job.title, text, notes: "", sourceJobAdId: job.id, tempId: Math.random() },
        ],
      }));
      setSelectedExistingId("");
    } catch (e) {
      setPastAdsError(e.message || "Could not load that job ad's description.");
    } finally {
      setAddingExisting(false);
    }
  };

  const poll = (jobId) => {
    const tick = async () => {
      if (!mountedRef.current) return;
      try {
        const r = await fetch(`${API_BASE}/jobs/${jobId}`, { headers: authHeaders(), cache: "no-store" });
        if (!r.ok) throw new Error(`Status request failed (${r.status})`);
        const data = await r.json();
        const uiStatus = normalizeJobStatus(data.status);

        if (uiStatus === "success") {
          const text = formatStructuredExportAsText(data.result);
          if (!text) {
            setPhase("error");
            setError("The job completed but returned no content.");
            return;
          }
          setGeneratedText(text);
          setPhase("preview");
          return;
        }
        if (uiStatus === "error") {
          setPhase("error");
          setError(data.error || "The job failed to generate a description.");
          return;
        }
        setStatusText(String(data.status || "processing").toLowerCase());
        pollRef.current = setTimeout(tick, POLL_INTERVAL_MS);
      } catch (e) {
        setStatusText("retrying…");
        pollRef.current = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };
    pollRef.current = setTimeout(tick, 0);
  };

  const canSubmit =
    fields.companySector.trim() && fields.jobRole.trim() && fields.companyName.trim() && fields.location.trim();

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    setError("");
    setPhase("generating");
    setStatusText("queued");
    try {
      const r = await fetch(`${API_BASE}/jobs/job-ad`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(buildJobAdPayload(fields)),
      });
      if (!r.ok) throw new Error(`Create request failed (${r.status})`);
      const data = await r.json();
      if (!data.job_id) throw new Error("No job_id returned by the service.");
      poll(data.job_id);
    } catch (err) {
      setPhase("error");
      setError(err.message || "Failed to start the generation job.");
    }
  };

  const handleUse = () => {
    onGenerated?.(generatedText);
  };

  const handleClose = () => {
    stopPolling();
    toggle();
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose} size="lg" scrollable>
      <ModalHeader toggle={handleClose}>Ad Recommendation</ModalHeader>
      <ModalBody>
        {phase === "form" && (
          <Form onSubmit={handleSubmit}>
            {error && <Alert color="danger">{error}</Alert>}
            <FormGroup>
              <Label>Company sector *</Label>
              <Input value={fields.companySector} placeholder="e.g., Industrial Manufacturing" onChange={setField("companySector")} />
            </FormGroup>
            <Row>
              <Col sm="6">
                <FormGroup>
                  <Label>Job role *</Label>
                  <Input value={fields.jobRole} placeholder="e.g., Maintenance Technician" onChange={setField("jobRole")} />
                </FormGroup>
              </Col>
              <Col sm="6">
                <FormGroup>
                  <Label>Location *</Label>
                  <Input value={fields.location} placeholder="e.g., Athens, Greece" onChange={setField("location")} />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label>Company name *</Label>
              <Input value={fields.companyName} placeholder="e.g., Acme Industries" onChange={setField("companyName")} />
            </FormGroup>
            <Row>
              <Col sm="4">
                <FormGroup>
                  <Label>Employment</Label>
                  <Input type="select" value={fields.employmentType} onChange={setField("employmentType")}>
                    {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </Input>
                </FormGroup>
              </Col>
              <Col sm="4">
                <FormGroup>
                  <Label>Seniority</Label>
                  <Input type="select" value={fields.seniority} onChange={setField("seniority")}>
                    {SENIORITIES.map((t) => <option key={t}>{t}</option>)}
                  </Input>
                </FormGroup>
              </Col>
              <Col sm="4">
                <FormGroup>
                  <Label>Work model</Label>
                  <Input type="select" value={fields.workModel} onChange={setField("workModel")}>
                    {WORK_MODELS.map((t) => <option key={t}>{t}</option>)}
                  </Input>
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label>Team context <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span></Label>
              <Input type="textarea" rows="2" style={{ maxHeight: 90 }} value={fields.teamContext} placeholder="What team will they join and what do they support?" onChange={setField("teamContext")} />
            </FormGroup>
            <FormGroup>
              <Label>Additional context <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span></Label>
              <Input type="textarea" rows="2" style={{ maxHeight: 90 }} value={fields.additionalContext} placeholder="Anything else worth highlighting" onChange={setField("additionalContext")} />
            </FormGroup>

            <div
              style={{ cursor: "pointer", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, color: "#2563eb", margin: "6px 0 4px" }}
              onClick={() => setShowAdvanced((s) => !s)}
            >
              {showAdvanced ? "▾" : "▸"} Advanced options
            </div>

            {showAdvanced && (
              <div style={{ borderLeft: "3px solid #eef2ff", paddingLeft: 12 }}>
                <Row>
                  <Col sm="8">
                    <FormGroup>
                      <Label>Tone</Label>
                      <Input value={fields.tone} onChange={setField("tone")} />
                    </FormGroup>
                  </Col>
                  <Col sm="4">
                    <FormGroup>
                      <Label>Max words</Label>
                      <Input type="number" min="100" value={fields.maxWords} onChange={setField("maxWords")} />
                    </FormGroup>
                  </Col>
                </Row>
                <FormGroup>
                  <Label>Must include</Label>
                  <ChipInput values={fields.mustInclude} onChange={(v) => setFields((f) => ({ ...f, mustInclude: v }))} placeholder="Type a phrase and press Enter" />
                </FormGroup>
                <FormGroup>
                  <Label>Avoid</Label>
                  <ChipInput values={fields.avoid} onChange={(v) => setFields((f) => ({ ...f, avoid: v }))} placeholder="Words to avoid, press Enter" />
                </FormGroup>
                <Row>
                  <Col sm="4">
                    <FormGroup>
                      <Label>Min responsibilities</Label>
                      <Input type="number" min="0" value={fields.minResponsibilities} onChange={setField("minResponsibilities")} />
                    </FormGroup>
                  </Col>
                  <Col sm="4">
                    <FormGroup>
                      <Label>Min requirements</Label>
                      <Input type="number" min="0" value={fields.minRequirements} onChange={setField("minRequirements")} />
                    </FormGroup>
                  </Col>
                  <Col sm="4">
                    <FormGroup>
                      <Label>Min benefits</Label>
                      <Input type="number" min="0" value={fields.minBenefits} onChange={setField("minBenefits")} />
                    </FormGroup>
                  </Col>
                </Row>

                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6b7280", margin: "18px 0 8px" }}>
                  Past advertisements (optional)
                </div>

                {pastAdsError && <Alert color="warning" toggle={() => setPastAdsError("")}>{pastAdsError}</Alert>}

                <FormGroup>
                  <Label>Add from one of your existing job ads</Label>
                  <Row>
                    <Col sm="8">
                      <Input
                        type="select"
                        value={selectedExistingId}
                        onChange={(e) => setSelectedExistingId(e.target.value)}
                        disabled={loadingExisting}
                      >
                        <option value="">
                          {loadingExisting
                            ? "Loading your job ads…"
                            : selectableExistingJobAds.length
                              ? "— select a job ad —"
                              : "No other job ads available"}
                        </option>
                        {selectableExistingJobAds.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title}{j.status ? ` (${j.status})` : ""}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col sm="4">
                      <Button
                        color="info"
                        outline
                        block
                        type="button"
                        disabled={!selectedExistingId || addingExisting}
                        onClick={handleAddExistingAsPastAd}
                      >
                        {addingExisting ? <Spinner size="sm" /> : "+ Add"}
                      </Button>
                    </Col>
                  </Row>
                </FormGroup>

                {fields.pastAds.map((p, i) => (
                  <div key={p.tempId || i} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 10, background: "#fbfbfd" }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <Label className="mb-0" style={{ fontWeight: 600 }}>
                        Past ad #{i + 1}{p.sourceJobAdId ? " (from your job ads)" : ""}
                      </Label>
                      <button
                        type="button"
                        style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                        onClick={() => removePastAd(i)}
                      >
                        Remove
                      </button>
                    </div>
                    <FormGroup className="mt-2">
                      <Label>Title</Label>
                      <Input value={p.title} onChange={(e) => updatePastAd(i, "title", e.target.value)} />
                    </FormGroup>
                    <FormGroup>
                      <Label>Text</Label>
                      <Input type="textarea" rows="3" style={{ maxHeight: 140 }} value={p.text} onChange={(e) => updatePastAd(i, "text", e.target.value)} />
                    </FormGroup>
                    <FormGroup className="mb-0">
                      <Label>Notes</Label>
                      <Input value={p.notes} placeholder="What worked, or what to change" onChange={(e) => updatePastAd(i, "notes", e.target.value)} />
                    </FormGroup>
                  </div>
                ))}
                <button
                  type="button"
                  style={{ border: "1px dashed #a5b4fc", background: "#f5f7ff", color: "#4338ca", cursor: "pointer", fontWeight: 600, fontSize: 13, borderRadius: 8, padding: "8px 12px", width: "100%", marginTop: 2 }}
                  onClick={addPastAd}
                >
                  + Add a past advertisement manually
                </button>
              </div>
            )}
          </Form>
        )}

        {phase === "generating" && (
          <div className="text-center py-4">
            <Spinner />
            <p className="mt-3 mb-1">Generating your description… {statusText}</p>
            <small className="text-muted">
              This can take a while — feel free to keep this open, or cancel and try again later.
            </small>
          </div>
        )}

        {phase === "error" && (
          <Alert color="danger" className="mb-0">
            ⚠ {error}
          </Alert>
        )}

        {phase === "preview" && (
          <>
            <p className="text-muted mb-2">Review the generated description below, then use it or regenerate.</p>
            <Input
              type="textarea"
              rows="18"
              readOnly
              value={generatedText}
              style={{
                fontFamily: "inherit",
                whiteSpace: "pre-wrap",
                minHeight: 360,
                maxHeight: "60vh",
                height: "60vh",
                resize: "vertical",
                overflowY: "auto",
              }}
            />
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {phase === "form" && (
          <>
            <Button color="secondary" onClick={handleClose}>Cancel</Button>
            <Button color="primary" onClick={handleSubmit} disabled={!canSubmit}>
              Generate description
            </Button>
          </>
        )}
        {phase === "generating" && (
          <Button color="secondary" onClick={handleClose}>Cancel</Button>
        )}
        {phase === "error" && (
          <>
            <Button color="secondary" onClick={handleClose}>Close</Button>
            <Button color="primary" onClick={() => setPhase("form")}>Back to form</Button>
          </>
        )}
        {phase === "preview" && (
          <>
            <Button color="secondary" outline onClick={() => setPhase("form")}>Regenerate</Button>
            <Button color="secondary" onClick={handleClose}>Cancel</Button>
            <Button color="primary" onClick={handleUse}>Use this description</Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default AdRecommendationModal;
