import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Table,
  CardTitle,
  Pagination,
  PaginationItem,
  PaginationLink,
  UncontrolledTooltip,
} from "reactstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import axios from 'axios';
import { getOrganization } from "../../../utils/Tokens";
import {
    KU_SOURCE_LIST,
    getKuLabelFor,
    getKuDescriptionFor,
    compareKuIds,
    getErrorMessage,
} from "../employeeSkills/ku/kuSources";


// Tooltip box for the KU Risk chart: same KU info (id - name + description)
// that the Knowledge Units heatmap shows on hover.
const KuRiskTooltip = ({ active, payload, label, valueFormatter, config }) => {
    if (!active || !payload || !payload.length) return null;

    const description = getKuDescriptionFor(config, label);

    return (
        <div
            style={{
                padding: "12px 16px",
                maxWidth: "360px",
                width: "360px",
                fontSize: "13px",
                lineHeight: 1.6,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                whiteSpace: "normal",
                wordWrap: "break-word",
            }}
        >
            <div style={{ fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                {getKuLabelFor(config, label)}
            </div>
            {description && (
                <div style={{ color: "#555", marginBottom: "8px", fontSize: "12px" }}>
                    {description}
                </div>
            )}
            {payload.map((entry) => (
                <div key={entry.dataKey} style={{ color: "#f39423", fontWeight: 600 }}>
                    {entry.name}: {valueFormatter ? valueFormatter(entry.value) : entry.value}
                </div>
            ))}
        </div>
    );
};

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
});

// Risk tables + chart for ONE detector (Java K1–K28 or Eclipse detector17)
function KuRiskSection({ config, organization }) {
    const [kuRisk, setkuRisk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [employeeRisk, setEmployeeRisk] = useState([]);
    const [sortConfig, setSortConfig] = useState({
        key: "absolute_employee_risk",
        direction: "desc",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 27;


    const formatPercent = (value) => {
        const percent = value * 100;

        if (percent === 0) return "0.00%";
        if (Math.abs(percent) < 0.01) return percent.toExponential(2) + "%"; // very small
        if (Math.abs(percent) < 0.1) return percent.toFixed(4) + "%"; // small but not tiny
        return percent.toFixed(2) + "%"; // normal
    };


    useEffect(() => {
        if (!organization) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setErrorMessage("");
            const [kuRes, empRes] = await Promise.allSettled([
                axios.get(process.env.REACT_APP_API_URL_KU + config.kuRiskPath(organization), authHeaders()),
                axios.get(process.env.REACT_APP_API_URL_KU + config.employeeRiskPath(organization), authHeaders()),
            ]);
            if (cancelled) return;

            if (kuRes.status === "fulfilled" && Array.isArray(kuRes.value.data)) {
                setkuRisk([...kuRes.value.data].sort((a, b) => compareKuIds(config)(a.ku_name, b.ku_name)));
            } else {
                setkuRisk([]);
            }
            if (empRes.status === "fulfilled" && Array.isArray(empRes.value.data)) {
                setEmployeeRisk([...empRes.value.data].sort((a, b) => b.absolute_employee_risk - a.absolute_employee_risk));
            } else {
                setEmployeeRisk([]);
            }

            const failed = [kuRes, empRes].find((r) => r.status === "rejected");
            if (failed) {
                console.error(`Failed to load ${config.title} risk:`, failed.reason);
                setErrorMessage(getErrorMessage(failed.reason, "Failed to load the risk data."));
            }
            setLoading(false);
        };

        load();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organization, config.key]);

    // Sort handler for Employee Risk table
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
        direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    // Apply sorting based on config
    const sortedEmployeeRisk = useMemo(() => {
        const sorted = [...employeeRisk];
        sorted.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (typeof aVal === "string") {
            return sortConfig.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        } else {
            return sortConfig.direction === "asc"
            ? aVal - bVal
            : bVal - aVal;
        }
        });
        return sorted;
    }, [employeeRisk, sortConfig]);

    const getArrow = (key) => {
        if (sortConfig.key !== key) return "";
        return sortConfig.direction === "asc" ? " ▲" : " ▼";
    };

    const kuCountDistribution = useMemo(() => {
        const countMap = {};
        employeeRisk.forEach((emp) => {
            const count = emp.ku_count;
            countMap[count] = (countMap[count] || 0) + 1;
        });
        return Object.keys(countMap)
            .map((key) => ({
            ku_count: key,
            developer_count: countMap[key],
            }))
            .sort((a, b) => a.ku_count - b.ku_count);
    }, [employeeRisk]);



    // Pagination logic
    const totalPages = Math.ceil(sortedEmployeeRisk.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedEmployeeRisk.slice(
        indexOfFirstItem,
        indexOfLastItem
    );
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        }
    };

    // dynamic page numbers
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    if (totalPages > maxVisiblePages && endPage === totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
    }
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);


    const employeeRiskDistribution = useMemo(() => {
        if (!employeeRisk.length) return [];

        // Take log10 of risk and bin it
        const logs = employeeRisk
            .filter((e) => e.absolute_employee_risk > 0)
            .map((e) => Math.log10(e.absolute_employee_risk));

        const minLog = Math.min(...logs);
        const maxLog = Math.max(...logs);
        const binSize = (maxLog - minLog) / 10; // 10 bins by default

        const bins = Array.from({ length: 10 }, (_, i) => ({
            binStart: minLog + i * binSize,
            binEnd: minLog + (i + 1) * binSize,
            count: 0,
        }));

        logs.forEach((val) => {
            const idx = Math.min(
                Math.floor((val - minLog) / binSize),
                bins.length - 1
            );
            bins[idx].count += 1;
        });

        return bins.map((b) => ({
            binLabel: `${b.binStart.toFixed(1)} – ${b.binEnd.toFixed(1)}`,
            count: b.count,
        }));
    }, [employeeRisk]);



    const kuRiskChartData = [...kuRisk]
        .filter(item => item.ku_risk > 0)
        .sort((a, b) => b.ku_risk - a.ku_risk);
    const hasData = kuRisk.length > 0 || employeeRisk.length > 0;

    const sectionHeader = (
        <div className="mb-3 mt-2">
            <h3 className="mb-0">{config.title}</h3>
            <small className="text-muted">{config.subtitle}</small>
        </div>
    );

    if (loading) {
        return (
            <>
                {sectionHeader}
                <Card><CardBody><p className="mb-0">Loading risk data...</p></CardBody></Card>
            </>
        );
    }

    if (!hasData) {
        return (
            <>
                {sectionHeader}
                <Card>
                    <CardBody>
                        <p className="mb-0 text-muted">
                            {errorMessage
                                ? `Could not load the ${config.title} risk: ${errorMessage}`
                                : `No ${config.title} risk data yet. Analyze your organization's projects for ${config.title} in the Knowledge Units tab to calculate it.`}
                        </p>
                    </CardBody>
                </Card>
            </>
        );
    }

    return (
    <>
        {sectionHeader}
        {errorMessage && (
            <p className="text-danger">Some risk data could not be loaded: {errorMessage}</p>
        )}
        <Row>
            <Col md="12" xl="6">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h6">KU Risk — {config.title}</CardTitle>
                    </CardHeader>
                    <CardBody>
                        {/* KU Risk Table */}
                        <Table striped>
                            <thead>
                                <tr>
                                    <th>KU</th>
                                    <th>Employee Count</th>
                                    <th>Impact</th>
                                    <th>Risk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kuRisk.map((item, index) => {
                                    const kuTooltipId = `ku-risk-tooltip-${config.key}-${String(item.ku_name).replace(/[^A-Za-z0-9_-]/g, "_")}-${index}`;
                                    const kuLabel = getKuLabelFor(config, item.ku_name);
                                    const kuDescription = getKuDescriptionFor(config, item.ku_name);
                                    return (
                                        <tr key={index}>
                                            <td>
                                                <span id={kuTooltipId} style={{ cursor: "help" }}>
                                                    {item.ku_name}
                                                </span>
                                                {(kuLabel !== String(item.ku_name) || kuDescription) && (
                                                    <UncontrolledTooltip
                                                        placement="right"
                                                        target={kuTooltipId}
                                                        autohide={false}
                                                        style={{ maxWidth: "360px", textAlign: "left" }}
                                                    >
                                                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                                                            {kuLabel}
                                                        </div>
                                                        {kuDescription && (
                                                            <div style={{ fontSize: "12px" }}>{kuDescription}</div>
                                                        )}
                                                    </UncontrolledTooltip>
                                                )}
                                            </td>
                                            <td>{item.employee_count}</td>
                                            <td>{formatPercent(item.impact)}</td>
                                            <td>{formatPercent(item.ku_risk)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </CardBody>
                </Card>
            </Col>
            <Col md="12" xl="6">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h6">Employee Risk — {config.title}</CardTitle>
                    </CardHeader>
                    <CardBody>
                        {/* Employee Risk Table */}
                        <Table striped>
                            <thead>
                                <tr>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("employee_name")}
                                    >
                                        Name{getArrow("employee_name")}
                                    </th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("ku_count")}
                                    >
                                        KU Count{getArrow("ku_count")}
                                    </th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("absolute_employee_risk")}
                                    >
                                        Risk{getArrow("absolute_employee_risk")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.employee_name}</td>
                                        <td>{item.ku_count}</td>
                                        <td>{formatPercent(item.absolute_employee_risk)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                        <Row className="justify-content-center">
                            <Col md="auto">
                                <Pagination>
                                    <PaginationItem disabled={currentPage === 1}>
                                    <PaginationLink
                                        previous
                                        onClick={() => handlePageChange(currentPage - 1)}
                                    />
                                    </PaginationItem>

                                    {startPage > 1 && (
                                    <PaginationItem>
                                        <PaginationLink onClick={() => handlePageChange(1)}>
                                        1
                                        </PaginationLink>
                                    </PaginationItem>
                                    )}

                                    {startPage > 2 && (
                                    <PaginationItem disabled>
                                        <PaginationLink>...</PaginationLink>
                                    </PaginationItem>
                                    )}

                                    {pageNumbers.map((page) => (
                                    <PaginationItem key={page} active={page === currentPage}>
                                        <PaginationLink onClick={() => handlePageChange(page)}>
                                        {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                    ))}

                                    {endPage < totalPages - 1 && (
                                    <PaginationItem disabled>
                                        <PaginationLink>...</PaginationLink>
                                    </PaginationItem>
                                    )}

                                    {endPage < totalPages && (
                                    <PaginationItem>
                                        <PaginationLink
                                        onClick={() => handlePageChange(totalPages)}
                                        >
                                        {totalPages}
                                        </PaginationLink>
                                    </PaginationItem>
                                    )}

                                    <PaginationItem disabled={currentPage === totalPages}>
                                    <PaginationLink
                                        next
                                        onClick={() => handlePageChange(currentPage + 1)}
                                    />
                                    </PaginationItem>
                                </Pagination>
                            </Col>
                        </Row>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>


        {/* Charts */}
        <Row>
            <Col>
                <Card>
                    <CardHeader>
                        <CardTitle tag="h6">KU Risk — {config.title}</CardTitle>
                    </CardHeader>
                    <CardBody style={{ height: kuRiskChartData.length > 0 ? "400px" : "auto" }}>
                        {kuRiskChartData.length === 0 ? (
                            <p className="mb-0 text-muted">No KU currently has a risk above zero.</p>
                        ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={kuRiskChartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="ku_name"
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis
                                    scale="log"
                                    domain={["auto", "auto"]}
                                    tickFormatter={(val) => val.toExponential(1)}
                                />
                                <Tooltip
                                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                                    content={
                                        <KuRiskTooltip
                                            config={config}
                                            valueFormatter={(value) => `${value.toExponential(2)}%`}
                                        />
                                    }
                                />
                                <Bar
                                    dataKey="ku_risk"
                                    fill="#f39423"
                                    name="Risk"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    </>);
}

function KuAtRisk() {
    const [organization, setOrganization] = useState('');

    useEffect(() => {
        const fetchOrganization = async () => {
            try {
                const org = await getOrganization();
                setOrganization(org);
            } catch (error) {
                console.error("Failed to resolve organization:", error);
            }
        };
        fetchOrganization();
    }, []);

    // Java KUs first, then Eclipse KUs
    return (
        <>
            {KU_SOURCE_LIST.map((config) => (
                <KuRiskSection key={config.key} config={config} organization={organization} />
            ))}
        </>
    );
}

export default KuAtRisk;