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
import { KU_NAMES, KU_DESCRIPTIONS, normalizeKuId, getKuLabel, getKuDescription } from "../../../utils/kuInfo";


// Tooltip box for the KU Risk chart: same KU info (id - name + description)
// that the Knowledge Units heatmap shows on hover.
const KuRiskTooltip = ({ active, payload, label, valueFormatter }) => {
    if (!active || !payload || !payload.length) return null;

    const description = getKuDescription(label);

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
                {getKuLabel(label)}
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

function KuAtRisk() {
    const [kuRisk, setkuRisk] = useState([]);
    const [employeeRisk, setEmployeeRisk] = useState([]);
    const [sortConfig, setSortConfig] = useState({
        key: "absolute_employee_risk",
        direction: "desc",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 27;
    const [organization, setOrganization] = useState('');


    const formatPercent = (value) => {
        const percent = value * 100;

        if (percent === 0) return "0.00%";
        if (Math.abs(percent) < 0.01) return percent.toExponential(2) + "%"; // very small
        if (Math.abs(percent) < 0.1) return percent.toFixed(4) + "%"; // small but not tiny
        return percent.toFixed(2) + "%"; // normal
    };


    const getKuRisk = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_KU + "/ku_risk?organization=" + organization, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                },
            })
            .then((res) => {
                // Sort based on the numeric value after the "K"
                const sortedData = res.data.sort((a, b) => {
                    const numA = parseInt(a.ku_name.replace(/\D/g, ""), 10);
                    const numB = parseInt(b.ku_name.replace(/\D/g, ""), 10);
                    return numA - numB;
                });

                console.log("Sorted KU Risk data:", sortedData);
                setkuRisk(sortedData);
            });
    };

    const getEmployeeRisk = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_KU + "/employee_risk?organization="+ organization, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                },
            })
            .then((res) => {
                const sorted = res.data.sort((a, b) => b.absolute_employee_risk - a.absolute_employee_risk);
                console.log("data sorted:", sorted);
                setEmployeeRisk(sorted);
            });
    };

    useEffect(() => {
        if (!organization) return;
        getKuRisk();
        getEmployeeRisk();
    }, [organization]);

    useEffect(() => {
        const fetchOrganization = async () => {
            const org = await getOrganization();
            setOrganization(org);
        };

        fetchOrganization();
    }, []);
    
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



    return (
    <>
        <Row>
            <Col md="12" xl="6">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h6">KU Risk</CardTitle>
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
                                    const kuKey = normalizeKuId(item.ku_name);
                                    const kuTooltipId = `ku-risk-tooltip-${kuKey}-${index}`;
                                    const kuDescription = KU_DESCRIPTIONS[kuKey];
                                    return (
                                        <tr key={index}>
                                            <td>
                                                <span id={kuTooltipId} style={{ cursor: "help" }}>
                                                    {item.ku_name}
                                                </span>
                                                {(KU_NAMES[kuKey] || kuDescription) && (
                                                    <UncontrolledTooltip
                                                        placement="right"
                                                        target={kuTooltipId}
                                                        autohide={false}
                                                        style={{ maxWidth: "360px", textAlign: "left" }}
                                                    >
                                                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                                                            {getKuLabel(item.ku_name)}
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
                        <CardTitle tag="h6">Employee Risk</CardTitle>
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
                        <CardTitle tag="h6">KU Risk</CardTitle>
                    </CardHeader>
                    <CardBody style={{ height: "400px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={
                                    [...kuRisk]
                                        .filter(item => item.ku_risk > 0)
                                        .sort((a, b) => b.ku_risk - a.ku_risk)
                                }
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
                    </CardBody>
                </Card>
            </Col>
        </Row>
    </>);
}

export default KuAtRisk;