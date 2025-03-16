import React, { useState } from 'react';
import { Table, Pagination, PaginationItem, PaginationLink, Row, Col, CustomInput } from 'reactstrap';

const SkillsNeeded = ({ data, skills, onSelectSkill }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [showUserSkillsOnly, setShowUserSkillsOnly] = useState(false);  // Toggle for filtering
    const itemsPerPage = 10;

    const mapPillar = (pillar) => {
        const pillarMap = { K: "Knowledge", T: "Transversal", L: "Language", S: "Skill" };
        return pillarMap[pillar] || pillar;
    };

    // Extract user skills for comparison
    const userSkillsSet = new Set(skills.map(skill => skill.skill.label.trim().toLowerCase()));

    // Filter data if 'Only My Skills' is active
    const filteredData = showUserSkillsOnly
        ? data.filter(item => userSkillsSet.has(item.Skills.trim().toLowerCase()))
        : data;

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Pagination logic AFTER filtering
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    // Handle pagination navigation
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleToggleChange = () => {
        setShowUserSkillsOnly(!showUserSkillsOnly);
        setCurrentPage(1);  // Reset to page 1 when toggling
    };
    
    // Logic for showing page numbers dynamically
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    if (totalPages > maxVisiblePages && endPage === totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    const handleSelectSkill = (selectedSkill) => {
        if (onSelectSkill) {
            onSelectSkill(selectedSkill);
        }
    };

    return (
        <>
            {/* Filter Toggle */}
            <div className="d-flex justify-content-end align-items-center mb-3">
                <span className="mr-2">Only My Skills</span>
                <CustomInput 
                    type="switch" 
                    id="skillToggle" 
                    checked={showUserSkillsOnly} 
                    onChange={handleToggleChange} 
                    className="custom-switch"
                />
            </div>

            {/* Skills Table */}
            <Table striped>
                <thead>
                    <tr>
                        <th>Skill</th>
                        <th>Pillar</th>
                        <th>Importance</th>
                        <th>Upskilling</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((item, index) => {
                        const cleanedSkill = item.Skills.trim().toLowerCase();
                        const matchedSkill = skills.find(userSkill => userSkill.skill.label.trim().toLowerCase() === cleanedSkill);
                        const hasSkill = Boolean(matchedSkill);

                        // Determine dot color based on years
                        let dotColor = '';
                        if (hasSkill) {
                            const years = matchedSkill.years;
                            if (years > 10) dotColor = '#006400'; // Dark Green
                            else if (years > 5) dotColor = '#339933'; // Medium Green
                            else if (years > 2) dotColor = '#66cc66'; // Light Medium Green
                            else dotColor = '#90ee90'; // Light Green
                        }

                        return (
                            <tr key={index}>
                                <td>
                                    {hasSkill && (
                                        <span 
                                            title={`${matchedSkill.years} years`}
                                            style={{ 
                                                height: '10px', 
                                                width: '10px', 
                                                backgroundColor: dotColor, 
                                                borderRadius: '50%', 
                                                display: 'inline-block', 
                                                marginRight: '5px' 
                                            }}
                                        ></span>
                                    )}
                                    {item.Skills}
                                </td>
                                <td>{mapPillar(item.Pillar)}</td>
                                <td>{(item.Value * 100).toFixed(1)}%</td>
                                <td>
                                    <button
                                        onClick={() => handleSelectSkill(item.Skills)}
                                        aria-label={`More`}
                                    >
                                        <i className="fas fa-eye text-lg"></i>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
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
