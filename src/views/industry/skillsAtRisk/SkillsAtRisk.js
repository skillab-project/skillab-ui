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


function SkillsAtRisk() {
    const [skillRisk, setSkillRisk] = useState([]);
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
        // getSkillRisk();
        // getEmployeeRisk();
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


    return (
    <>
        <Row>
            <Col md="12" xl="6">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h6">Skills Risk</CardTitle>
                    </CardHeader>
                    <CardBody>
                        {/* Skills Risk Table */}
                        <Table striped>
                            <thead>
                                <tr>
                                    <th>Skill</th>
                                    <th>Employee Count</th>
                                    <th>Impact</th>
                                    <th>Risk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {skillRisk.map((item, index) => {
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

    </>);
}

export default SkillsAtRisk;