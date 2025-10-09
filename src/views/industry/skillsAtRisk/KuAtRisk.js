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


function KuAtRisk() {
    const [kuRisk, setkuRisk] = useState([]);
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


    const getKuRisk = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_KU + "/ku_risk?organization=" + process.env.REACT_APP_INSTALLATION_ORGANIZATION_NAME)
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
            .get(process.env.REACT_APP_API_URL_KU + "/employee_risk?organization="+ process.env.REACT_APP_INSTALLATION_ORGANIZATION_NAME)
            .then((res) => {
                const sorted = res.data.sort((a, b) => b.absolute_employee_risk - a.absolute_employee_risk);
                console.log("data sorted:", sorted);
                setEmployeeRisk(sorted);
            });
    };

    useEffect(() => {
        getKuRisk();
        getEmployeeRisk();
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
                                    return (
                                        <tr key={index}>
                                            <td>{item.ku_name}</td>
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
                                    formatter={(value) => `${value.toExponential(2)}%`}
                                    labelFormatter={(label) => `KU: ${label}`}
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
        <Row>
            <Col>
                <Card>
                    <CardHeader>
                        <CardTitle tag="h6">Developers per KU Count</CardTitle>
                    </CardHeader>
                    <CardBody style={{ height: "400px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={kuCountDistribution}
                                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                            >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="ku_count"
                                label={{
                                    value: "KU Count (eg. 3/27)",
                                    position: "bottom",
                                    offset: 0,
                                }}
                            />
                            <YAxis
                                label={{
                                    value: "Developers",
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                            />
                            <Tooltip />
                            <Bar
                                dataKey="developer_count"
                                fill="#f39423"
                                name="Developers"
                            />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>
            </Col>
        </Row>
        <Row>
            <Col>
                <Card>
                <CardHeader>
                    <CardTitle tag="h6">Employee Absolute Risk Distribution</CardTitle>
                </CardHeader>
                <CardBody style={{ height: "400px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={employeeRiskDistribution}
                            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="binLabel"
                                label={{
                                    value: "log₁₀(Absolute Employee Risk)",
                                    position: "bottom",
                                    offset: 0,
                                }}
                            />
                            <YAxis
                                label={{
                                    value: "Developers",
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                            />
                            <Tooltip
                                formatter={(val) => `${val}`}
                                labelFormatter={(label) => `log₁₀(Risk): ${label}`}
                            />
                            <Bar
                                dataKey="count"
                                fill="#f39423"
                                name="Developers"
                                isAnimationActive={false}
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