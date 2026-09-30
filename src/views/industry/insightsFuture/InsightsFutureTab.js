import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardHeader, CardBody, CardTitle, FormGroup, Label, Input, Button, Alert, Spinner, Badge } from "reactstrap";
import EmergenceSection from "./EmergenceSection";
import useOrgNeedsAnalysis from "../futureNeeds/useOrgNeedsAnalysis";
import ConfirmModal from "../advertisements/Hire/ConfirmModal";
import AnalysisProgress from "../futureNeeds/AnalysisProgress";
import {
  ANALYSIS_KINDS,
  fmtDate,
  isUri,
  resolveTrackerLabels,
  shortLabelFromUri,
} from "../futureNeeds/futureNeedsUtils";

const DEFAULT_TOP_N = 5;

/**
 * One tab of the Insights on Future view: long-term (3–5 year) emergence
 * analysis of skills or occupations, for the organization and its sector(s).
 * Polls while the backend reports { status: "in_progress" }.
 */
function InsightsFutureTab({ kind, organization, loadingOrganization, active }) {
  const kindInfo = ANALYSIS_KINDS[kind];
  const [topN, setTopN] = useState(DEFAULT_TOP_N);
  const [resolvedLabels, setResolvedLabels] = useState({});
  const [selectedSector, setSelectedSector] = useState("");

  const { phase, serverStatus, data, message, waitingSince, nextCheckAt, lastTopN, run, rerun, checkNow } = useOrgNeedsAnalysis({
    path: `longtermanalysis/${kind}`,
    organization,
    topN,
    active,
    errorMessage: `Could not load the long-term ${kindInfo.singular.toLowerCase()} insights. Please try again later.`,
  });

  const sectorResults = useMemo(() => data?.sector_analysis?.results_by_sector || {}, [data]);
  const sectorNames = useMemo(() => Object.keys(sectorResults), [sectorResults]);
  useEffect(() => {
    if (sectorNames.length && !sectorNames.includes(selectedSector)) setSelectedSector(sectorNames[0]);
  }, [sectorNames, selectedSector]);

  // Resolve ESCO URIs used as labels (currently the sector occupations).
  useEffect(() => {
    if (!data) return undefined;
    const uris = [];
    const collect = (list) => (list || []).forEach((e) => isUri(e.label) && uris.push(e.label.trim()));
    collect(data.organization_analysis?.[kindInfo.entitiesKey]);
    Object.values(sectorResults).forEach((s) => collect(s?.[kindInfo.entitiesKey]));
    if (!uris.length) return undefined;
    let alive = true;
    resolveTrackerLabels(uris, kind).then((map) => alive && setResolvedLabels((prev) => ({ ...prev, ...map })));
    return () => {
      alive = false;
    };
  }, [data, kind, kindInfo, sectorResults]);

  const getLabel = useCallback(
    (e) => {
      const raw = (e?.label || e?.uri || "").trim();
      if (!isUri(raw)) return raw || "—";
      return resolvedLabels[raw] || shortLabelFromUri(raw);
    },
    [resolvedLabels]
  );

  const busy = phase === "loading" || phase === "pending";
  const [confirmRerun, setConfirmRerun] = useState(false);
  const profile = data?.organization_profile;
  const sectorAnalysis = data?.sector_analysis;

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = Math.max(1, Math.min(50, Number(topN) || DEFAULT_TOP_N));
    setTopN(n);
    run(n);
  };

  return (
    <Row>
      <Col md="12">
        <Card>
          <CardHeader>
            <CardTitle tag="h4" className="mb-0">
              Long-term {kindInfo.singular} Insights
            </CardTitle>
            <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Which {kindInfo.plural.toLowerCase()} are emerging over the next years, how mature they are and when they are
              expected to go mainstream, with workforce-planning, partnership and compliance recommendations.
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <Row className="align-items-end">
                <Col md="4" className="mb-3">
                  <FormGroup className="mb-0">
                    <Label>Organization</Label>
                    <Input type="text" value={loadingOrganization ? "Loading…" : organization || "—"} disabled />
                  </FormGroup>
                </Col>
                <Col md="2" className="mb-3">
                  <FormGroup className="mb-0">
                    <Label for={`if-topn-${kind}`}>Top {kindInfo.plural}</Label>
                    <Input id={`if-topn-${kind}`} type="number" min="1" max="50" value={topN} onChange={(e) => setTopN(e.target.value)} />
                  </FormGroup>
                </Col>
                <Col md="3" className="mb-3">
                  <Button color="info" type="submit" block disabled={busy || !organization} className="mb-0">
                    {busy ? <Spinner size="sm" /> : data ? "Load Analysis" : "Run Analysis"}
                  </Button>
                </Col>
                {data && (
                  <Col md="3" className="mb-3">
                    <Button
                      color="info"
                      outline
                      block
                      className="mb-0"
                      disabled={busy || !organization || lastTopN == null}
                      onClick={() => setConfirmRerun(true)}
                      title={`Compute the analysis again for the top ${lastTopN} ${kindInfo.plural.toLowerCase()} with the latest data`}
                    >
                      <i className="nc-icon nc-refresh-69 mr-1" style={{ verticalAlign: "middle" }} /> Rerun Analysis
                    </Button>
                  </Col>
                )}
              </Row>
            </form>

            {!loadingOrganization && !organization && (
              <Alert color="warning" className="mb-0">
                Your account is not linked to an organization, so no analysis can be run.
              </Alert>
            )}

            <AnalysisProgress
              phase={phase}
              serverStatus={serverStatus}
              message={message}
              waitingSince={waitingSince}
              nextCheckAt={nextCheckAt}
              onCheckNow={checkNow}
              hasPreviousResult={!!data}
            />

            {phase === "error" && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <h6 className="text-info">{message}</h6>
                <Button color="link" size="sm" className="p-0" onClick={checkNow}>
                  Check again
                </Button>
              </div>
            )}

            {profile && (
              <div style={{ fontSize: "0.85rem" }} className="text-muted mt-2">
                <strong style={{ color: "#333" }}>{profile.name}</strong>
                {profile.location ? ` · ${profile.location}` : ""}
                {(profile.sectors || []).map((s) => (
                  <Badge key={s} color="info" pill className="ml-2">
                    {s}
                  </Badge>
                ))}
                {data?.metadata?.analysis_date ? <span className="ml-2">· Requested {fmtDate(data.metadata.analysis_date)}</span> : null}
              </div>
            )}
          </CardBody>
        </Card>
      </Col>

      {data && (
        <>
          <Col md="12">
            <EmergenceSection
              analysis={data.organization_analysis}
              kindInfo={kindInfo}
              getLabel={getLabel}
              title={`Your Organization — ${kindInfo.plural}`}
              subtitle={`Emergence profile of the ${kindInfo.plural.toLowerCase()} in your own job ads and interviews.`}
            />
          </Col>

          <Col md="12">
            {sectorAnalysis && String(sectorAnalysis.status || "ok").toLowerCase() !== "ok" && !sectorNames.length ? (
              <Alert color="warning">{sectorAnalysis.message || "The sector analysis is not available."}</Alert>
            ) : sectorNames.length > 0 ? (
              <>
                {sectorNames.length > 1 && (
                  <FormGroup style={{ maxWidth: 420 }}>
                    <Label for={`if-sector-${kind}`}>Sector</Label>
                    <Input type="select" id={`if-sector-${kind}`} value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)}>
                      {sectorNames.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                )}
                <EmergenceSection
                  analysis={sectorResults[selectedSector]}
                  kindInfo={kindInfo}
                  getLabel={getLabel}
                  title={`Sector Outlook — ${selectedSector}`}
                  subtitle={`Emerging ${kindInfo.plural.toLowerCase()} across job postings in this sector.`}
                />
              </>
            ) : null}
          </Col>
        </>
      )}

      <ConfirmModal
        isOpen={confirmRerun}
        title="Rerun Analysis"
        message={
          <>
            Compute the analysis again for <b>{organization}</b> (top <b>{lastTopN}</b>{" "}
            {kindInfo.plural.toLowerCase()}) with the latest job data? This can take several minutes; the current
            results stay visible until the new ones are ready.
          </>
        }
        confirmText="Rerun"
        cancelText="Cancel"
        confirmColor="info"
        onConfirm={() => {
          setConfirmRerun(false);
          rerun();
        }}
        onCancel={() => setConfirmRerun(false)}
      />
    </Row>
  );
}

export default InsightsFutureTab;
