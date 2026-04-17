import React, { useState, useMemo } from 'react';
import { Table, Pagination, PaginationItem, PaginationLink, Row, Col, Badge } from 'reactstrap';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const SkillsNeeded = ({ data }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'stat', direction: 'desc' }); // Default sort by Stat high to low
    const itemsPerPage = 10;

    const mapPillar = (pillar) => {
        const pillarMap = { K: "Knowledge", T: "Transversal", L: "Language", S: "Skill" };
        return pillarMap[pillar] || pillar;
    };

    // Sorting Logic
    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // If sorting by Pillar, we sort by the mapped name for better UX
                if (sortConfig.key === 'Pillar') {
                    aValue = mapPillar(a.Pillar);
                    bValue = mapPillar(b.Pillar);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to page 1 when sorting changes
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="ms-1 text-muted" size={12} />;
        return sortConfig.direction === 'asc' ? 
            <FaSortUp className="ms-1 text-primary" size={12} /> : 
            <FaSortDown className="ms-1 text-primary" size={12} />;
    };

    // Pagination logic applied to SORTED data
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // Dynamic page number logic
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
            <Table striped responsive hover>
                <thead>
                    <tr>
                        <th style={{ cursor: 'default' }}>Skill</th>
                        <th 
                            onClick={() => requestSort('Pillar')} 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                            Pillar {getSortIcon('Pillar')}
                        </th>
                        <th>Shared With</th>
                        <th 
                            onClick={() => requestSort('stat')} 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                            Importance {getSortIcon('stat')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((item, index) => (
                        <tr key={index}>
                            <td className="fw-bold">{item.Skill}</td>
                            <td>
                                <Badge color="secondary" outline>
                                    {mapPillar(item.Pillar)}
                                </Badge>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: '#555' }}>
                                {item.Group.split('+').join(', ')}
                            </td>
                            <td className="text-end fw-bold text-primary">
                                {(item.stat * 100).toFixed(1)}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {totalPages > 1 && (
                <Row className="justify-content-center mt-3">
                    <Col md="auto">
                        <Pagination size="sm">
                            <PaginationItem disabled={currentPage === 1}>
                                <PaginationLink previous onClick={() => handlePageChange(currentPage - 1)} />
                            </PaginationItem>

                            {startPage > 1 && (
                                <>
                                    <PaginationItem><PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink></PaginationItem>
                                    {startPage > 2 && <PaginationItem disabled><PaginationLink disabled>...</PaginationLink></PaginationItem>}
                                </>
                            )}

                            {pageNumbers.map((page) => (
                                <PaginationItem key={page} active={page === currentPage}>
                                    <PaginationLink onClick={() => handlePageChange(page)}>{page}</PaginationLink>
                                </PaginationItem>
                            ))}

                            {endPage < totalPages && (
                                <>
                                    {endPage < totalPages - 1 && <PaginationItem disabled><PaginationLink disabled>...</PaginationLink></PaginationItem>}
                                    <PaginationItem><PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink></PaginationItem>
                                </>
                            )}

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