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
  GET_EMPLOYEE_REPORT_URL,
  GET_EMPLOYEE_SKILL_TIMELINE_URL,
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



function EmployeeSkills({
  employees,
  selectedDeptId,
  activeTab,
  startDate,
  endDate,
}) {
  //  Employee selection 
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  //  Skills (table) 
  const [employeeSkills,   setEmployeeSkills]   = useState([]);
  const [loadingEmpSkills, setLoadingEmpSkills] = useState(false);
  const [empSearch,        setEmpSearch]        = useState("");

  //  Chart data 
  const [selectedSkillId,    setSelectedSkillId]    = useState("");
  const [empOverallData,     setEmpOverallData]     = useState(null);
  const [empPerfData,        setEmpPerfData]        = useState(null);
  const [empTimelineData,    setEmpTimelineData]    = useState(null);
  const [loadingEmpOverall,  setLoadingEmpOverall]  = useState(false);
  const [loadingEmpPerf,     setLoadingEmpPerf]     = useState(false);
  const [loadingEmpTimeline, setLoadingEmpTimeline] = useState(false);
  const [attemptedEmpOverall,  setAttemptedEmpOverall]  = useState(false);
  const [attemptedEmpPerf,     setAttemptedEmpPerf]     = useState(false);
  const [attemptedEmpTimeline, setAttemptedEmpTimeline] = useState(false);

  //  Reset employee if dept filter clears them 
  useEffect(() => {
    if (selectedDeptId && selectedEmployeeId) {
      const emp = employees.find((e) => e.id?.toString() === selectedEmployeeId);
      if (emp?.departmentId?.toString() !== selectedDeptId) {
        setSelectedEmployeeId("");
        setEmployeeSkills([]);
        setSelectedSkillId("");
      }
    }
  }, [selectedDeptId, employees, selectedEmployeeId]);

  //  Load employee latest skill entries 
  useEffect(() => {
    if (!selectedEmployeeId) { setEmployeeSkills([]); return; }
    const load = async () => {
      setLoadingEmpSkills(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/employees/${selectedEmployeeId}/skill-entries/latest`, { headers: await getAuthHeaders() });
        setEmployeeSkills(res.data || []);
      } catch (err) {
        console.error("Failed to load employee skills:", err);
      } finally {
        setLoadingEmpSkills(false);
      }
    };
    load();
  }, [selectedEmployeeId]);

  //  Chart: employee overall rating 
  useEffect(() => {
    if (!selectedEmployeeId || activeTab !== TAB_CHARTS) {
      setEmpOverallData(null);
      setAttemptedEmpOverall(false);
      return;
    }
    const load = async () => {
      setLoadingEmpOverall(true);
      setAttemptedEmpOverall(true);
      try {
        const res = await axios.get(GET_EMPLOYEE_REPORT_URL(parseInt(selectedEmployeeId), null, startDate, endDate), { headers: await getAuthHeaders() });
        const data = res.data;
        if (data && !data.overallRatings) data.overallRatings = [];
        setEmpOverallData(data || null);
      } catch {
        setEmpOverallData(null);
      } finally {
        setLoadingEmpOverall(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, startDate, endDate, activeTab]);

  //  Chart: employee perf review + skill timeline 
  useEffect(() => {
    if (!selectedEmployeeId || !selectedSkillId || activeTab !== TAB_CHARTS) {
      setEmpPerfData(null);
      setEmpTimelineData(null);
      setAttemptedEmpPerf(false);
      setAttemptedEmpTimeline(false);
      return;
    }
    const load = async () => {
      setLoadingEmpPerf(true);
      setLoadingEmpTimeline(true);
      setAttemptedEmpPerf(true);
      setAttemptedEmpTimeline(true);
      const headers = await getAuthHeaders();
      try {
        const res = await axios.get(GET_EMPLOYEE_REPORT_URL(parseInt(selectedEmployeeId), parseInt(selectedSkillId), startDate, endDate), { headers });
        const data = res.data;
        if (data && !data.skills) data.skills = [];
        setEmpPerfData(data || null);
      } catch {
        setEmpPerfData(null);
      } finally {
        setLoadingEmpPerf(false);
      }
      try {
        const res = await axios.get(GET_EMPLOYEE_SKILL_TIMELINE_URL(parseInt(selectedEmployeeId), parseInt(selectedSkillId), startDate, endDate), { headers });
        setEmpTimelineData(res.data || null);
      } catch {
        setEmpTimelineData(null);
      } finally {
        setLoadingEmpTimeline(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, selectedSkillId, startDate, endDate, activeTab]);

  //  Derived data 
  const filteredEmployees = useMemo(() => {
    if (!selectedDeptId) return employees;
    return employees.filter((e) => e.departmentId?.toString() === selectedDeptId);
  }, [employees, selectedDeptId]);

  const filteredEmpSkills = useMemo(
    () => employeeSkills.filter((s) => s.skillName?.toLowerCase().includes(empSearch.toLowerCase())),
    [employeeSkills, empSearch]
  );

  const chartSkillOptions = useMemo(
    () => employeeSkills.map((e) => ({ id: e.skillId, name: e.skillName })),
    [employeeSkills]
  );

  const empOverallPoints  = useMemo(() => buildOverallPoints(empOverallData),                         [empOverallData]);
  const empPerfPoints     = useMemo(() => buildPerfPoints(empPerfData),                               [empPerfData]);
  const empTimelinePoints = useMemo(() => buildSkillTimelinePoints(empTimelineData, selectedSkillId), [empTimelineData, selectedSkillId]);

  const selectedEmployee = employees.find((e) => e.id?.toString() === selectedEmployeeId);
  const selectedSkillName = chartSkillOptions.find((s) => s.id?.toString() === selectedSkillId)?.name || "";
  const empPerfSkillName  = empPerfData?.skills?.[0]?.skillName || selectedSkillName;
  const dateRangeLabel    = startDate && endDate ? ` — ${fmtDisplay(startDate)} to ${fmtDisplay(endDate)}` : "";

  const handleEmployeeChange = (e) => {
    setSelectedEmployeeId(e.target.value);
    setSelectedSkillId("");
  };

  //  Render — shared employee selector (used in both tabs)
  const EmployeeSelector = (
    <Col md={3} className="mb-3">
      <FormGroup className="mb-0">
        <Label for="empFilter">Employee <span className="text-danger">*</span></Label>
        <Input
          type="select"
          id="empFilter"
          value={selectedEmployeeId}
          onChange={handleEmployeeChange}
        >
          <option value="">Select an employee…</option>
          {filteredEmployees.map((e) => (
            <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
          ))}
        </Input>
      </FormGroup>
    </Col>
  );

  //  Render — TABLE TAB
  if (activeTab !== TAB_CHARTS) {
    return (
      <Col md="12">
        <Row className="mb-3">{EmployeeSelector}</Row>
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <h5 className="mb-0">
                {selectedEmployee ? (
                  <>
                    Skills — <span style={{ fontWeight: 400, color: "#6c757d" }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                    {!loadingEmpSkills && <Badge color="secondary" pill style={{ marginLeft: "8px" }}>{employeeSkills.length}</Badge>}
                  </>
                ) : "Employee Skills"}
              </h5>
              {selectedEmployee && (
                <Input
                  type="text"
                  bsSize="sm"
                  placeholder="Search skills…"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  style={{ maxWidth: 220 }}
                />
              )}
            </div>
          </CardHeader>
          <CardBody style={{ padding: selectedEmployee ? 0 : undefined }}>
            {!selectedEmployee ? (
              <div className="text-center text-muted p-4">Select an employee above to view their skills.</div>
            ) : loadingEmpSkills ? (
              <div className="p-4 text-center text-muted">Loading skills…</div>
            ) : filteredEmpSkills.length === 0 ? (
              <div className="p-4 text-center text-muted">
                {employeeSkills.length === 0 ? "This employee has no skill entries yet." : "No skills match your search."}
              </div>
            ) : (
              <Table hover responsive className="mb-0">
                <thead><tr><th>#</th><th>Skill Name</th><th>Rating</th><th>Category</th><th>Last Reviewed</th></tr></thead>
                <tbody>
                  {filteredEmpSkills.map((entry, idx) => (
                    <tr key={entry.id ?? entry.skillId}>
                      <td className="text-muted" style={{ width: 48 }}>{idx + 1}</td>
                      <td><strong>{entry.skillName}</strong></td>
                      <td><RatingBadge rating={entry.rating} /></td>
                      <td>
                        {entry.skillCategory
                          ? <Badge color="light" className="text-dark border">{entry.skillCategory}</Badge>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-muted">
                        {entry.reviewDate ? new Date(entry.reviewDate).toLocaleDateString("en-GB") : "—"}
                      </td>
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
      {/*  Employee selector  */}
      <Col md="12">
        <Card className="mb-4">
          <CardBody>
            <Row className="align-items-end">{EmployeeSelector}</Row>
          </CardBody>
        </Card>
      </Col>

      {/*  Overall Rating Timeline  */}
      <Col md="12">
        <CollapsibleChartCard title="Employee Overall Rating Timeline">
          {loadingEmpOverall && <div className="mt-4 text-center"><p>Loading chart data...</p></div>}

          {!selectedEmployee && (
            <div className="mt-4 text-muted"><p>Select an employee above to view charts.</p></div>
          )}
          {selectedEmployee && empOverallPoints.length > 0 && (
            <div className="mt-4">
              <h5 className="mb-3">{selectedEmployee.firstName} {selectedEmployee.lastName}{dateRangeLabel}</h5>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={empOverallPoints} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: "Overall Rating", angle: -90, position: "insideLeft" }} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                  <Tooltip /><Legend />
                  <Line type="monotone" dataKey="avgOverallRating" stroke="#8884d8" name="Overall Rating" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {selectedEmployee && attemptedEmpOverall && !loadingEmpOverall && empOverallPoints.length === 0 && (
            <div className="mt-4 text-muted">
              <p>{empOverallData
                ? "No overall rating data available for the selected employee and date range."
                : "No overall rating data found. Please try a different employee or date range."}
              </p>
            </div>
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
                    disabled={!selectedEmployeeId}
                  >
                    <option value="">{!selectedEmployeeId ? "Select an employee first" : "Select a skill…"}</option>
                    {chartSkillOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Input>
                  {selectedEmployeeId && !selectedSkillId && (
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
        <CollapsibleChartCard title="Employee Performance Review Chart">
          {loadingEmpPerf && <div className="mt-4 text-center"><p>Loading chart data...</p></div>}

          {!selectedEmployee && (
            <div className="mt-4 text-muted"><p>Select an employee above to view charts.</p></div>
          )}
          {selectedEmployee && empPerfPoints.length > 0 && (
            <div className="mt-4">
              <h5 className="mb-3">
                {selectedEmployee.firstName} {selectedEmployee.lastName}
                {empPerfSkillName && ` — ${empPerfSkillName}`}
                {dateRangeLabel}
              </h5>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={empPerfPoints} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis label={{ value: "Rating", angle: -90, position: "insideLeft" }} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                  <Tooltip /><Legend />
                  <Bar dataKey="avgRating" fill="#8884d8" name="Average Rating" />
                  <Bar dataKey="maxRating" fill="#ff7300" name="Max Rating" />
                  <Bar dataKey="minRating" fill="#ffc658" name="Min Rating" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {selectedEmployee && attemptedEmpPerf && !loadingEmpPerf && empPerfPoints.length === 0 && (
            <div className="mt-4 text-muted">
              <p>{empPerfData
                ? `No review data available${empPerfSkillName ? ` for ${empPerfSkillName}` : ""} for the selected date range.`
                : `No review data found${empPerfSkillName ? ` for ${empPerfSkillName}` : ""}. Please try a different skill or date range.`}
              </p>
            </div>
          )}
          {selectedEmployee && !selectedSkillId && (
            <div className="mt-4 text-muted"><p>Select a skill above to view the performance review chart.</p></div>
          )}
        </CollapsibleChartCard>
      </Col>

      {/*  Skill Timeline Chart  */}
      <Col md="12">
        <CollapsibleChartCard title="Employee Skill Timeline">
          {loadingEmpTimeline && <div className="mt-4 text-center"><p>Loading chart data...</p></div>}

          {!selectedEmployee && (
            <div className="mt-4 text-muted"><p>Select an employee above to view charts.</p></div>
          )}
          {selectedEmployee && empTimelinePoints.length > 0 && (() => {
            const ratings = empTimelinePoints.map((p) => p.rating);
            const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
            return (
              <div className="mt-4">
                <h5 className="mb-3">{selectedEmployee.firstName} {selectedEmployee.lastName}{selectedSkillName && ` — ${selectedSkillName}`}</h5>
                <div className="mb-5">
                  <h6 className="mb-3">
                    {selectedSkillName}
                    <span className="text-muted" style={{ fontSize: "0.9rem", marginLeft: "12px" }}>
                      (Avg: {avg.toFixed(2)}, Min: {Math.min(...ratings).toFixed(2)}, Max: {Math.max(...ratings).toFixed(2)})
                    </span>
                  </h6>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={empTimelinePoints} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          {selectedEmployee && attemptedEmpTimeline && !loadingEmpTimeline && empTimelinePoints.length === 0 && (
            <div className="mt-4 text-muted">
              <p>{empTimelineData
                ? `No timeline data available${selectedSkillName ? ` for ${selectedSkillName}` : ""}.`
                : `No timeline data found${selectedSkillName ? ` for ${selectedSkillName}` : ""}. Please try a different skill or date range.`}
              </p>
            </div>
          )}
          {selectedEmployee && !selectedSkillId && (
            <div className="mt-4 text-muted"><p>Select a skill above to view the skill timeline.</p></div>
          )}
        </CollapsibleChartCard>
      </Col>
    </>
  );
}

export default EmployeeSkills;
