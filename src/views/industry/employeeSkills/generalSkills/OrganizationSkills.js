import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Collapse,
  Table,
  Row,
  Col,
  FormGroup,
  Label,
  Badge,
  Input,
} from "reactstrap";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  API_BASE_URL,
  getAuthHeaders,
  GET_ORG_DEPT_REPORT_URL,
  GET_ORG_DEPT_SKILL_TIMELINE_URL,
  TAB_CHARTS,
  fmtDisplay,
  buildOverallPoints,
  buildPerfPoints,
  buildSkillTimelinePoints,
} from "./generalSkillsUtils";

//  Shared UI sub-components 
function RatingBadge({ rating }) {
  if (rating == null) return <span className="text-muted">—</span>;
  let color = "secondary";
  if (rating >= 4)      color = "success";
  else if (rating >= 3) color = "info";
  else if (rating >= 2) color = "warning";
  else                  color = "danger";
  return <Badge color={color} pill>{Number(rating).toFixed(1)}</Badge>;
}

function CollapsibleChartCard({ title, children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Card className="mb-4">
      <CardHeader style={{ cursor: "pointer" }} onClick={() => setIsOpen(!isOpen)}>
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">{title}</h4>
          <i className={`bi bi-chevron-${isOpen ? "up" : "down"}`} />
        </div>
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody>{children}</CardBody>
      </Collapse>
    </Card>
  );
}


function OrganizationSkills({
  organizationId,
  organizationName,
  departments,
  selectedDeptId,
  activeTab,
  startDate,
  endDate,
}) {
  //  Skills (table) 
  const [orgSkills,        setOrgSkills]        = useState([]);
  const [loadingOrgSkills, setLoadingOrgSkills] = useState(false);
  const [orgSearch,        setOrgSearch]        = useState("");

  //  Chart data 
  const [selectedSkillId,    setSelectedSkillId]    = useState("");
  const [orgOverallData,     setOrgOverallData]     = useState(null);
  const [orgPerfData,        setOrgPerfData]        = useState(null);
  const [orgTimelineData,    setOrgTimelineData]    = useState(null);
  const [loadingOrgOverall,  setLoadingOrgOverall]  = useState(false);
  const [loadingOrgPerf,     setLoadingOrgPerf]     = useState(false);
  const [loadingOrgTimeline, setLoadingOrgTimeline] = useState(false);
  const [attemptedOrgOverall,  setAttemptedOrgOverall]  = useState(false);
  const [attemptedOrgPerf,     setAttemptedOrgPerf]     = useState(false);
  const [attemptedOrgTimeline, setAttemptedOrgTimeline] = useState(false);

  //  Reset skill selection when dept changes 
  useEffect(() => { setSelectedSkillId(""); }, [selectedDeptId]);

  //  Load org / dept skills 
  useEffect(() => {
    if (!organizationId) return;
    const load = async () => {
      setLoadingOrgSkills(true);
      const url = selectedDeptId
        ? `${API_BASE_URL}/skills/department/${selectedDeptId}`
        : `${API_BASE_URL}/skills/organization/${organizationId}`;
      try {
        const res = await axios.get(url, { headers: await getAuthHeaders() });
        setOrgSkills(res.data || []);
      } catch (err) {
        console.error("Failed to load skills:", err);
      } finally {
        setLoadingOrgSkills(false);
      }
    };
    load();
  }, [organizationId, selectedDeptId]);

  //  Chart: org overall rating 
  useEffect(() => {
    if (!organizationId || activeTab !== TAB_CHARTS) return;
    const load = async () => {
      setLoadingOrgOverall(true);
      setAttemptedOrgOverall(true);
      const deptId = selectedDeptId ? parseInt(selectedDeptId) : null;
      try {
        const res = await axios.get(GET_ORG_DEPT_REPORT_URL(organizationId, deptId, null, startDate, endDate), { headers: await getAuthHeaders() });
        const data = res.data;
        if (data && !data.overallRatings) data.overallRatings = [];
        setOrgOverallData(data || null);
      } catch {
        setOrgOverallData(null);
      } finally {
        setLoadingOrgOverall(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, selectedDeptId, startDate, endDate, activeTab]);

  //  Chart: org perf review 
  useEffect(() => {
    if (!organizationId || !selectedSkillId || activeTab !== TAB_CHARTS) {
      setOrgPerfData(null);
      setAttemptedOrgPerf(false);
      return;
    }
    const load = async () => {
      setLoadingOrgPerf(true);
      setAttemptedOrgPerf(true);
      const deptId = selectedDeptId ? parseInt(selectedDeptId) : null;
      try {
        const res = await axios.get(GET_ORG_DEPT_REPORT_URL(organizationId, deptId, parseInt(selectedSkillId), startDate, endDate), { headers: await getAuthHeaders() });
        const data = res.data;
        if (data && !data.skills) data.skills = [];
        setOrgPerfData(data || null);
      } catch {
        setOrgPerfData(null);
      } finally {
        setLoadingOrgPerf(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, selectedDeptId, selectedSkillId, startDate, endDate, activeTab]);

  //  Chart: org skill timeline 
  useEffect(() => {
    if (!organizationId || !selectedSkillId || activeTab !== TAB_CHARTS) {
      setOrgTimelineData(null);
      setAttemptedOrgTimeline(false);
      return;
    }
    const load = async () => {
      setLoadingOrgTimeline(true);
      setAttemptedOrgTimeline(true);
      const deptId = selectedDeptId ? parseInt(selectedDeptId) : null;
      try {
        const res = await axios.get(GET_ORG_DEPT_SKILL_TIMELINE_URL(organizationId, deptId, parseInt(selectedSkillId), startDate, endDate), { headers: await getAuthHeaders() });
        setOrgTimelineData(res.data || null);
      } catch {
        setOrgTimelineData(null);
      } finally {
        setLoadingOrgTimeline(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, selectedDeptId, selectedSkillId, startDate, endDate, activeTab]);

  //  Derived data 
  const filteredOrgSkills = useMemo(
    () => orgSkills.filter((s) => s.name?.toLowerCase().includes(orgSearch.toLowerCase())),
    [orgSkills, orgSearch]
  );

  const orgOverallPoints  = useMemo(() => buildOverallPoints(orgOverallData),                         [orgOverallData]);
  const orgPerfPoints     = useMemo(() => buildPerfPoints(orgPerfData),                               [orgPerfData]);
  const orgTimelinePoints = useMemo(() => buildSkillTimelinePoints(orgTimelineData, selectedSkillId), [orgTimelineData, selectedSkillId]);

  const selectedDeptName = departments.find((d) => d.id?.toString() === selectedDeptId)?.name || null;
  const selectedSkillName = orgSkills.find((s) => s.id?.toString() === selectedSkillId)?.name || "";
  const orgPerfSkillName  = orgPerfData?.skills?.[0]?.skillName || selectedSkillName;
  const dateRangeLabel    = startDate && endDate ? ` — ${fmtDisplay(startDate)} to ${fmtDisplay(endDate)}` : "";

  //  Render — TABLE TAB
  if (activeTab !== TAB_CHARTS) {
    return (
      <Col md="12">
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <h5 className="mb-0">
                Skills — <span style={{ fontWeight: 400, color: "#6c757d" }}>{selectedDeptName || "All Departments"}</span>
                {!loadingOrgSkills && <Badge color="secondary" pill style={{ marginLeft: "8px" }}>{orgSkills.length}</Badge>}
              </h5>
              <Input
                type="text"
                bsSize="sm"
                placeholder="Search skills…"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                style={{ maxWidth: 220 }}
              />
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {loadingOrgSkills ? (
              <div className="p-4 text-center text-muted">Loading skills…</div>
            ) : filteredOrgSkills.length === 0 ? (
              <div className="p-4 text-center text-muted">
                {orgSkills.length === 0 ? "No skills found for the selected scope." : "No skills match your search."}
              </div>
            ) : (
              <Table hover responsive className="mb-0">
                <thead><tr><th>#</th><th>Skill Name</th><th>Category</th><th>Description</th></tr></thead>
                <tbody>
                  {filteredOrgSkills.map((skill, idx) => (
                    <tr key={skill.id}>
                      <td className="text-muted" style={{ width: 48 }}>{idx + 1}</td>
                      <td><strong>{skill.name}</strong></td>
                      <td>
                        {skill.category
                          ? <Badge color="light" className="text-dark border">{skill.category}</Badge>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-muted" style={{ maxWidth: 360 }}>{skill.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </Col>
    );
  }

  //  Render — CHARTS TAB
  return (
    <>
      {/*  Overall Rating Timeline  */}
      <Col md="12">
        <CollapsibleChartCard title="Organization Overall Rating Timeline">
          {loadingOrgOverall && <div className="mt-4 text-center"><p>Loading chart data...</p></div>}

          {orgOverallPoints.length > 0 && (
            <div className="mt-4">
              <h5 className="mb-3">
                {orgOverallData?.organizationName || organizationName}
                {orgOverallData?.departmentName && ` — ${orgOverallData.departmentName}`}
                {dateRangeLabel}
              </h5>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={orgOverallPoints} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: "Average Overall Rating", angle: -90, position: "insideLeft" }} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                  <Tooltip /><Legend />
                  <Line type="monotone" dataKey="avgOverallRating" stroke="#8884d8" name="Average Overall Rating of Employees" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {attemptedOrgOverall && !loadingOrgOverall && orgOverallPoints.length === 0 && (
            <div className="mt-4 text-muted">
              <p>{orgOverallData ? "No overall rating data available for the selected filters." : "No overall rating data found. Please try a different department or date range."}</p>
            </div>
          )}
          {!attemptedOrgOverall && !loadingOrgOverall && (
            <div className="mt-4 text-muted"><p>Select a date range to view the overall rating timeline.</p></div>
          )}
        </CollapsibleChartCard>
      </Col>

      {/*  Skill filter  */}
      <Col md="12">
        <Card className="mb-4">
          <CardBody>
            <Row className="align-items-end">
              <Col md={4}>
                <FormGroup className="mb-0">
                  <Label for="chartSkillSelect">Skill Filter</Label>
                  <Input
                    type="select"
                    id="chartSkillSelect"
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                  >
                    <option value="">Select a skill…</option>
                    {orgSkills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Input>
                  {!selectedSkillId && (
                    <small className="form-text text-muted">Skill charts will appear when a skill is selected</small>
                  )}
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>

      {/*  Performance Review Chart  */}
      <Col md="12">
        <CollapsibleChartCard title="Organization Performance Review Chart">
          {loadingOrgPerf && <div className="mt-4 text-center"><p>Loading chart data...</p></div>}

          {orgPerfPoints.length > 0 && (
            <div className="mt-4">
              <h5 className="mb-3">
                {orgPerfSkillName}
                {orgPerfData?.departmentName && ` — ${orgPerfData.departmentName}`}
                {dateRangeLabel}
              </h5>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={orgPerfPoints} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis label={{ value: "Rating", angle: -90, position: "insideLeft" }} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                  <Tooltip /><Legend />
                  <Bar dataKey="avgRating" fill="#8884d8" name="Average Rating" />
                  <Bar dataKey="maxRating" fill="#ff7300" name="Max Rating" />
                  <Bar dataKey="minRating" fill="#ffc658" name="Min Rating" />
                </BarChart>
              </ResponsiveContainer>
              {orgPerfData?.skills?.[0]?.periods?.some((p) => p.employeeCount) && (
                <div className="mt-4">
                  <h6>Employee Count by Quarter</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={orgPerfPoints.map((pt, i) => ({
                        ...pt,
                        employeeCount: orgPerfData.skills[0].periods[i]?.employeeCount || 0,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis label={{ value: "Employee Count", angle: -90, position: "insideLeft" }} allowDecimals={false} />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="employeeCount" stroke="#82ca9d" name="Employee Count" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
          {attemptedOrgPerf && !loadingOrgPerf && orgPerfPoints.length === 0 && (
            <div className="mt-4 text-muted">
              <p>{orgPerfData
                ? `No data available for ${orgPerfSkillName || "the selected skill"} and date range.`
                : "No data found for the selected filters. Please try a different skill, department, or date range."}
              </p>
            </div>
          )}
          {!selectedSkillId && (
            <div className="mt-4 text-muted"><p>Select a skill above to view the performance review chart.</p></div>
          )}
        </CollapsibleChartCard>
      </Col>

      {/*  Skill Timeline Chart  */}
      <Col md="12">
        <CollapsibleChartCard title="Organization Skill Timeline">
          {loadingOrgTimeline && <div className="mt-4 text-center"><p>Loading chart data...</p></div>}

          {orgTimelinePoints.length > 0 && (() => {
            const ratings = orgTimelinePoints.map((p) => p.rating);
            const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
            return (
              <div className="mt-4">
                <h5 className="mb-3">
                  {orgTimelineData?.organizationName || organizationName}
                  {orgTimelineData?.departmentName && ` — ${orgTimelineData.departmentName}`}
                  {selectedSkillName && ` — ${selectedSkillName}`}
                </h5>
                <div className="mb-5">
                  <h6 className="mb-3">
                    {selectedSkillName}
                    <span className="text-muted" style={{ fontSize: "0.9rem", marginLeft: "12px" }}>
                      (Avg: {avg.toFixed(2)}, Min: {Math.min(...ratings).toFixed(2)}, Max: {Math.max(...ratings).toFixed(2)})
                    </span>
                  </h6>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={orgTimelinePoints} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                      <YAxis label={{ value: "Rating", angle: -90, position: "insideLeft" }} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="rating" stroke="#8884d8" name="Rating" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
          {attemptedOrgTimeline && !loadingOrgTimeline && orgTimelinePoints.length === 0 && (
            <div className="mt-4 text-muted">
              <p>{orgTimelineData
                ? `No timeline data available${selectedSkillName ? ` for ${selectedSkillName}` : ""}.`
                : "No timeline data found for the selected filters. Please try a different department, skill, or date range."}
              </p>
            </div>
          )}
          {!selectedSkillId && (
            <div className="mt-4 text-muted"><p>Select a skill above to view the skill timeline.</p></div>
          )}
        </CollapsibleChartCard>
      </Col>
    </>
  );
}

export default OrganizationSkills;
