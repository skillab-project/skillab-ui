import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  FormGroup,
  Label,
  Input,
  Button,
  Table,
  Badge,
  Alert,
  Spinner,
  Progress,
} from "reactstrap";
import axios from "axios";
import { GAP_BASE_URL, getGapAuthHeaders, formatRatio } from "./gapCompetitionUtils";

function Form({ children, ...props }) {
  return <form {...props}>{children}</form>;
}

function SkillChips({ skills, color }) {
  if (!skills || skills.length === 0) return <span className="text-muted">None</span>;
  return (
    <div>
      {skills.map((s) => (
        <Badge key={s.id || s.label} color={color} pill className="mr-1 mb-1" style={{ fontWeight: 400 }}>
          {s.label}
        </Badge>
      ))}
    </div>
  );
}

function ObjectivesList({ title, items }) {
  return (
    <Col md="6" className="mb-3">
      <h6 className="text-muted text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>
        {title}
      </h6>
      {items && items.length > 0 ? (
        <ul style={{ paddingLeft: "1.1rem", marginBottom: 0 }}>
          {items.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
      ) : (
        <p className="text-muted mb-0">None set.</p>
      )}
    </Col>
  );
}

function StatTile({ label, value }) {
  return (
    <Col xs="6" md="3" className="mb-3">
      <Card className="mb-0" style={{ height: "100%" }}>
        <CardBody className="text-center">
          <div style={{ fontSize: "1.75rem", fontWeight: 600, color: "#2d3e75" }}>{value}</div>
          <div className="text-muted" style={{ fontSize: "0.85rem" }}>{label}</div>
        </CardBody>
      </Card>
    </Col>
  );
}

function EmployeeScoreCard({ employee, threshold }) {
  if (!employee) return null;
  const scorePct = Math.round((employee.embedding_score_avg || 0) * 100);
  const thresholdPct = Math.round((threshold || 0) * 100);
  return (
    <Card className="mb-0" style={{ border: "1px solid #eee" }}>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <strong>{employee.name}</strong>
            <div className="text-muted" style={{ fontSize: "0.8rem" }}>
              ID: {employee.employee_id}
            </div>
          </div>
          <Badge color={employee.embedding_threshold_pass ? "success" : "danger"} pill>
            {employee.embedding_threshold_pass ? "Meets Threshold" : "Below Threshold"}
          </Badge>
        </div>
        <div className="d-flex justify-content-between" style={{ fontSize: "0.8rem" }}>
          <span>Embedding Match</span>
          <span>
            {scorePct}% <span className="text-muted">(threshold {thresholdPct}%)</span>
          </span>
        </div>
        <Progress value={scorePct} color={employee.embedding_threshold_pass ? "success" : "danger"} />
      </CardBody>
    </Card>
  );
}

function CandidateCard({ candidate, highlight }) {
  if (!candidate) return null;
  return (
    <Card className="mb-0" style={{ border: highlight ? "1px solid #6bd098" : "1px solid #eee" }}>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <strong>{candidate.name}</strong>
            <div className="text-muted" style={{ fontSize: "0.8rem" }}>
              {candidate.current_role} · {candidate.source}
            </div>
          </div>
          <Badge color="info" pill>
            {formatRatio(candidate.match_ratio)} match
          </Badge>
        </div>
        <SkillChips skills={candidate.matched_skills} color="secondary" />
      </CardBody>
    </Card>
  );
}

function WorkforceGapTab({ departments, loadingDepartments }) {
  const [departmentId, setDepartmentId] = useState("");
  const [marketPageSize, setMarketPageSize] = useState(100);
  const [topMarketSkills, setTopMarketSkills] = useState(12);
  const [reskillThreshold, setReskillThreshold] = useState(0.6);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!departmentId) {
      setError("Please select a department.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post(
        `${GAP_BASE_URL}/workforce-gap-recommendation`,
        {
          department_id: Number(departmentId),
          market_page_size: Number(marketPageSize),
          top_market_skills: Number(topMarketSkills),
          reskill_threshold: Number(reskillThreshold),
        },
        { headers: getGapAuthHeaders() }
      );
      setResult(res.data);
    } catch (err) {
      console.error("workforce-gap-recommendation failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to generate a recommendation. Please check the parameters and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isExternalHire = result?.recommendation?.action === "external_hire";
  const hiringProfile = result?.recommendation?.external_hiring_profile;

  return (
    <Row>
      <Col md="12">
        <Card>
          <CardHeader>
            <CardTitle tag="h4" className="mb-0">
              Workforce Gap Recommendation
            </CardTitle>
            <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Get a reskill-or-hire recommendation for a department based on market demand and your team's
              current skills.
            </p>
          </CardHeader>
          <CardBody>
            <Form onSubmit={handleSubmit} className="mb-2">
              <Row className="align-items-end">
                <Col md="3" className="mb-3">
                  <FormGroup className="mb-0">
                    <Label for="wgDepartment">Department</Label>
                    <Input
                      type="select"
                      id="wgDepartment"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      disabled={loadingDepartments}
                    >
                      <option value="">{loadingDepartments ? "Loading departments…" : "Select a department"}</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="2" className="mb-3">
                  <FormGroup className="mb-0">
                    <Label for="wgMarketPageSize">Market Page Size</Label>
                    <Input
                      type="number"
                      id="wgMarketPageSize"
                      min="1"
                      max="1000"
                      value={marketPageSize}
                      onChange={(e) => setMarketPageSize(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="2" className="mb-3">
                  <FormGroup className="mb-0">
                    <Label for="wgTopMarketSkills">Top Market Skills</Label>
                    <Input
                      type="number"
                      id="wgTopMarketSkills"
                      min="1"
                      max="100"
                      value={topMarketSkills}
                      onChange={(e) => setTopMarketSkills(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="3" className="mb-3">
                  <FormGroup className="mb-0">
                    <Label for="wgThreshold">
                      Reskill Threshold ({Math.round(reskillThreshold * 100)}%)
                    </Label>
                    <Input
                      type="range"
                      id="wgThreshold"
                      min="0"
                      max="1"
                      step="0.05"
                      value={reskillThreshold}
                      onChange={(e) => setReskillThreshold(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="2" className="mb-3">
                  <Button color="info" type="submit" disabled={loading} block>
                    {loading ? <Spinner size="sm" /> : "Get Recommendation"}
                  </Button>
                </Col>
              </Row>
            </Form>

            {error && <Alert color="danger">{error}</Alert>}
          </CardBody>
        </Card>
      </Col>

      {result && (
        <>
          <Col md="12">
            <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <CardTitle tag="h4" className="mb-0">
                    Target Role: {result.target_role?.label || "—"}
                  </CardTitle>
                  <Badge color={isExternalHire ? "warning" : "success"} pill style={{ fontSize: "0.85rem" }}>
                    {isExternalHire ? "External Hire Recommended" : "Reskill Recommended"}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <p className="mb-3">{result.recommendation?.reason}</p>
                <Row>
                  <ObjectivesList title="Company Objectives" items={result.objective?.company_objectives} />
                  <ObjectivesList title="Department Objectives" items={result.objective?.department_objectives} />
                </Row>
              </CardBody>
            </Card>
          </Col>

          <Col md="12">
            <Row>
              <StatTile label="Jobs Analyzed" value={result.market_insights?.jobs_analyzed ?? "—"} />
              <StatTile
                label="Total Market Matches"
                value={result.market_insights?.total_market_matches?.toLocaleString?.() ?? "—"}
              />
              <StatTile label="Top Market Skills" value={result.market_insights?.top_market_skills?.length ?? 0} />
              <StatTile label="Gap Skills" value={result.market_insights?.gap_skills?.length ?? 0} />
            </Row>
          </Col>

          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h5" className="mb-0">
                  Market Insights
                </CardTitle>
              </CardHeader>
              <CardBody>
                <h6 className="text-muted text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                  Search Keywords
                </h6>
                <p className="mb-3">
                  {(result.market_insights?.query_keywords || []).map((kw, i) => (
                    <Badge key={i} color="secondary" pill className="mr-1 mb-1" style={{ fontWeight: 400 }}>
                      {kw}
                    </Badge>
                  ))}
                </p>
                <Row>
                  <Col md="6" className="mb-3">
                    <h6 className="text-muted text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                      Top Market Skills
                    </h6>
                    <SkillChips skills={result.market_insights?.top_market_skills} color="info" />
                  </Col>
                  <Col md="6" className="mb-3">
                    <h6 className="text-muted text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                      Gap Skills (not covered internally)
                    </h6>
                    <SkillChips skills={result.market_insights?.gap_skills} color="danger" />
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>

          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h5" className="mb-0">
                  {isExternalHire ? "Top Internal Candidate" : "Recommended Employee"}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <EmployeeScoreCard
                  employee={result.recommendation?.recommended_employee}
                  threshold={reskillThreshold}
                />
              </CardBody>
            </Card>
          </Col>

          {isExternalHire && hiringProfile && (
            <Col md="12">
              <Card>
                <CardHeader>
                  <CardTitle tag="h5" className="mb-0">
                    External Hiring Profile — {hiringProfile.role}
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <h6 className="text-muted text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                    Priority Skills
                  </h6>
                  <div className="mb-3">
                    <SkillChips skills={hiringProfile.priority_skills} color="danger" />
                  </div>

                  {hiringProfile.recommended_candidate && (
                    <>
                      <h6 className="text-muted text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                        Recommended Candidate
                      </h6>
                      <div className="mb-3">
                        <CandidateCard candidate={hiringProfile.recommended_candidate} highlight />
                      </div>
                    </>
                  )}

                  <h6 className="text-muted text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                    Top Candidates
                  </h6>
                  <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                    <Table hover responsive size="sm">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Current Role</th>
                          <th>Source</th>
                          <th className="text-right">Match</th>
                          <th>Matched Skills</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(hiringProfile.top_candidates || []).map((c) => (
                          <tr key={c.profile_id}>
                            <td>{c.name}</td>
                            <td>{c.current_role}</td>
                            <td>{c.source}</td>
                            <td className="text-right">{formatRatio(c.match_ratio)}</td>
                            <td>
                              <SkillChips skills={c.matched_skills} color="secondary" />
                            </td>
                          </tr>
                        ))}
                        {(!hiringProfile.top_candidates || hiringProfile.top_candidates.length === 0) && (
                          <tr>
                            <td colSpan="5" className="text-center text-muted">
                              No external candidates found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          )}
        </>
      )}
    </Row>
  );
}

export default WorkforceGapTab;
