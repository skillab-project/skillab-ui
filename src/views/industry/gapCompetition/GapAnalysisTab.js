import React, { useMemo, useState } from "react";
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
} from "reactstrap";
import axios from "axios";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  GAP_BASE_URL,
  getGapAuthHeaders,
  indexedSectionToArray,
  sectionItemType,
  formatPercent,
  GAP_COLORS,
} from "./gapCompetitionUtils";

const TOP_N_CHART = 15;

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

function CommonSkillsChart({ rows, itemType }) {
  const chartData = useMemo(
    () =>
      [...rows]
        .sort((a, b) => Math.abs(b.difference || 0) - Math.abs(a.difference || 0))
        .slice(0, TOP_N_CHART)
        .sort((a, b) => (b.difference || 0) - (a.difference || 0)),
    [rows]
  );

  if (!chartData.length) return null;

  return (
    <ResponsiveContainer width="100%" height={440}>
      <ComposedChart data={chartData} margin={{ top: 16, right: 24, left: 8, bottom: 90 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis
          dataKey="label"
          angle={-45}
          textAnchor="end"
          interval={0}
          height={100}
          tick={{ fontSize: 11 }}
        />
        <YAxis tickFormatter={(v) => formatPercent(v, 0)} width={60} />
        <ReferenceLine y={0} stroke="#ccc" />
        <Tooltip formatter={(value, name) => [formatPercent(value), name]} />
        <Legend wrapperStyle={{ fontSize: "0.85rem" }} />
        <Bar
          dataKey="difference"
          name={`Company − Sector ${itemType} Difference`}
          fill={GAP_COLORS.difference}
          radius={[4, 4, 0, 0]}
          barSize={26}
        />
        <Scatter dataKey="my_ad_prob" name={`Company ${itemType} Density`} fill={GAP_COLORS.company} />
        <Scatter dataKey="sector_prob" name={`Sector ${itemType} Density`} fill={GAP_COLORS.sector} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function SingleSeriesChart({ rows, dataKey, color, name }) {
  const chartData = useMemo(
    () =>
      [...rows]
        .sort((a, b) => (b[dataKey] || 0) - (a[dataKey] || 0))
        .slice(0, TOP_N_CHART),
    [rows, dataKey]
  );

  if (!chartData.length) return <p className="text-muted mb-0">No data.</p>;

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={chartData} margin={{ top: 16, right: 24, left: 8, bottom: 90 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis dataKey="label" angle={-45} textAnchor="end" interval={0} height={100} tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => formatPercent(v, 0)} width={60} />
        <Tooltip formatter={(value) => [formatPercent(value), name]} />
        <Bar dataKey={dataKey} name={name} radius={[4, 4, 0, 0]} barSize={26}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CommonSkillsTable({ rows, itemType }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => rows.filter((r) => r.label?.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (b.difference || 0) - (a.difference || 0)),
    [filtered]
  );

  return (
    <>
      <Input
        type="text"
        placeholder={`Search ${itemType.toLowerCase()}s…`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
        style={{ maxWidth: "320px" }}
      />
      <div style={{ maxHeight: "420px", overflowY: "auto" }}>
        <Table hover responsive size="sm">
          <thead>
            <tr>
              <th>{itemType}</th>
              <th className="text-right">Company Density</th>
              <th className="text-right">Sector Density</th>
              <th className="text-right">Difference</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td className="text-right">{formatPercent(row.my_ad_prob)}</td>
                <td className="text-right">{formatPercent(row.sector_prob)}</td>
                <td className="text-right">
                  <Badge color={row.difference >= 0 ? "success" : "danger"} pill>
                    {row.difference >= 0 ? "+" : ""}
                    {formatPercent(row.difference)}
                  </Badge>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center text-muted">
                  No matches.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
}

function SingleSeriesTable({ rows, valueKey, valueLabel, itemType }) {
  const sorted = useMemo(() => [...rows].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0)), [rows, valueKey]);
  return (
    <div style={{ maxHeight: "320px", overflowY: "auto" }}>
      <Table hover responsive size="sm">
        <thead>
          <tr>
            <th>{itemType}</th>
            <th className="text-right">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.key}>
              <td>{row.label}</td>
              <td className="text-right">{formatPercent(row[valueKey])}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan="2" className="text-center text-muted">
                No data.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

function GapAnalysisTab({ departments, loadingDepartments }) {
  const [departmentId, setDepartmentId] = useState("");
  const [analysisType, setAnalysisType] = useState("skill");
  const [pageSize, setPageSize] = useState(100);

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
        `${GAP_BASE_URL}/gap-analysis`,
        {
          department_id: Number(departmentId),
          test: false,
          analysis_type: analysisType,
          page_size: Number(pageSize),
        },
        { headers: getGapAuthHeaders() }
      );
      setResult(res.data);
    } catch (err) {
      console.error("gap-analysis failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to run the gap analysis. Please check the parameters and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const common = result?.analysis_results?.common;
  const onlyInAd = result?.analysis_results?.only_in_ad;
  const onlyInSector = result?.analysis_results?.only_in_sector;

  const commonRows = useMemo(() => indexedSectionToArray(common), [common]);
  const onlyInAdRows = useMemo(() => indexedSectionToArray(onlyInAd), [onlyInAd]);
  const onlyInSectorRows = useMemo(() => indexedSectionToArray(onlyInSector), [onlyInSector]);
  const itemType = sectionItemType(common) || (analysisType === "occupation" ? "Occupation" : "Skill");

  return (
    <Row>
      <Col md="12">
        <Card>
          <CardHeader>
            <CardTitle tag="h4" className="mb-0">
              Skills Gap With Competition
            </CardTitle>
            <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Compare how your job ads represent skills or occupations against the wider sector.
            </p>
          </CardHeader>
          <CardBody>
            <Form onSubmit={handleSubmit} className="mb-2">
              <Row className="align-items-end">
                <Col md="4" className="mb-3">
                  <FormGroup className="mb-0">
                    <Label for="gapDepartment">Department</Label>
                    <Input
                      type="select"
                      id="gapDepartment"
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
                <Col md="3" className="mb-3">
                  <FormGroup className="mb-0">
                    <Label for="gapAnalysisType">Analysis Type</Label>
                    <Input
                      type="select"
                      id="gapAnalysisType"
                      value={analysisType}
                      onChange={(e) => setAnalysisType(e.target.value)}
                    >
                      <option value="skill">Skills</option>
                      <option value="occupation">Occupations</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="2" className="mb-3">
                  <FormGroup className="mb-0">
                    <Label for="gapPageSize">Page Size</Label>
                    <Input
                      type="number"
                      id="gapPageSize"
                      min="1"
                      max="1000"
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="3" className="mb-3">
                  <Button color="info" type="submit" disabled={loading} block>
                    {loading ? <Spinner size="sm" /> : "Run Analysis"}
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
            <Row>
              <StatTile label="Total Matches" value={result.count?.toLocaleString?.() ?? result.count ?? "—"} />
              <StatTile label={`Common ${itemType}s`} value={commonRows.length} />
              <StatTile label="Only In Your Ads" value={onlyInAdRows.length} />
              <StatTile label="Only In Sector" value={onlyInSectorRows.length} />
            </Row>
          </Col>

          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h5" className="mb-0">
                  Company vs. Sector — Common {itemType}s
                </CardTitle>
                <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                  Top {Math.min(TOP_N_CHART, commonRows.length)} {itemType.toLowerCase()}s by absolute difference between
                  your job ads and the sector.
                </p>
              </CardHeader>
              <CardBody>
                <CommonSkillsChart rows={commonRows} itemType={itemType} />
                <hr />
                <CommonSkillsTable rows={commonRows} itemType={itemType} />
              </CardBody>
            </Card>
          </Col>

          <Col md="6">
            <Card>
              <CardHeader>
                <CardTitle tag="h5" className="mb-0">
                  Only In Your Job Ads
                </CardTitle>
                <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                  {itemType}s your ads mention that don't show up in the sector benchmark.
                </p>
              </CardHeader>
              <CardBody>
                <SingleSeriesChart
                  rows={onlyInAdRows}
                  dataKey="my_ad_prob"
                  color={GAP_COLORS.company}
                  name="Company Density"
                />
                <hr />
                <SingleSeriesTable
                  rows={onlyInAdRows}
                  valueKey="my_ad_prob"
                  valueLabel="Company Density"
                  itemType={itemType}
                />
              </CardBody>
            </Card>
          </Col>

          <Col md="6">
            <Card>
              <CardHeader>
                <CardTitle tag="h5" className="mb-0">
                  Only In The Sector
                </CardTitle>
                <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                  {itemType}s the sector demands that your ads don't currently mention.
                </p>
              </CardHeader>
              <CardBody>
                <SingleSeriesChart
                  rows={onlyInSectorRows}
                  dataKey="sector_prob"
                  color={GAP_COLORS.sector}
                  name="Sector Density"
                />
                <hr />
                <SingleSeriesTable
                  rows={onlyInSectorRows}
                  valueKey="sector_prob"
                  valueLabel="Sector Density"
                  itemType={itemType}
                />
              </CardBody>
            </Card>
          </Col>
        </>
      )}
    </Row>
  );
}

// Local alias so the form element name doesn't clash with reactstrap's Form
// while keeping the JSX above readable.
function Form({ children, ...props }) {
  return <form {...props}>{children}</form>;
}

export default GapAnalysisTab;
