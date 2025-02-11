import React, { useState } from 'react';
import { Table, Pagination, PaginationItem, PaginationLink, Row, Col } from 'reactstrap';

const SkillsNeeded = ({ data }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const mapPillar = (pillar) => {
        const pillarMap = { K: "Knowledge", T: "Transversal", L: "Language", S: "Skill" };
        return pillarMap[pillar] || pillar;
    };

    // Get items for current page
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

    // Handle pagination navigation
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Logic for showing page numbers dynamically
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    if (totalPages > maxVisiblePages) {
        if (endPage === totalPages) {
            startPage = totalPages - maxVisiblePages + 1;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <>
            {/* Skills Table */}
            <Table striped>
                <thead>
                    <tr>
                        <th>Skill</th>
                        <th>Pillar</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.Skills}</td>
                            <td>{mapPillar(item.Pillar)}</td>
                            <td>{item.Value}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <Row className="justify-content-center">
                    <Col md="auto">
                        <Pagination>
                            {/* Previous Button */}
                            <PaginationItem disabled={currentPage === 1}>
                                <PaginationLink previous onClick={() => handlePageChange(currentPage - 1)} />
                            </PaginationItem>

                            {/* First Page */}
                            {startPage > 1 && (
                                <PaginationItem>
                                    <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                                </PaginationItem>
                            )}

                            {/* Dots Before */}
                            {startPage > 2 && (
                                <PaginationItem disabled>
                                    <PaginationLink>...</PaginationLink>
                                </PaginationItem>
                            )}

                            {/* Dynamic Page Numbers */}
                            {pageNumbers.map((page) => (
                                <PaginationItem key={page} active={page === currentPage}>
                                    <PaginationLink onClick={() => handlePageChange(page)}>
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            {/* Dots After */}
                            {endPage < totalPages - 1 && (
                                <PaginationItem disabled>
                                    <PaginationLink>...</PaginationLink>
                                </PaginationItem>
                            )}

                            {/* Last Page */}
                            {endPage < totalPages && (
                                <PaginationItem>
                                    <PaginationLink onClick={() => handlePageChange(totalPages)}>
                                        {totalPages}
                                    </PaginationLink>
                                </PaginationItem>
                            )}

                            {/* Next Button */}
                            <PaginationItem disabled={currentPage === totalPages}>
                                <PaginationLink next onClick={() => handlePageChange(currentPage + 1)} />
                            </PaginationItem>
                        </Pagination>
                    </Col>
                </Row>
            )}
        </>
    );
};

export default SkillsNeeded;
