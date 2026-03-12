import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, Dropdown, DropdownMenu, DropdownToggle, DropdownItem, FormGroup, Label, Input } from 'reactstrap';
import axios from 'axios';

const OccupationSelectionAndPillar = ({ onApplySelection, datasource }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allOccupations, setAllOccupations] = useState([]);
    const [filteredOccupations, setFilteredOccupations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOccupations, setSelectedOccupations] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState('skills');

    const [combinations, setCombinations] = useState(2);
    const [keywords, setKeywords] = useState("");

    const toggle = () => setDropdownOpen((prevState) => !prevState);

    const handleSelect = (item) => setSelectedItem(item);

    // Fetch Occupations Logic
    useEffect(() => {
        const fetchOccupations = async () => {
            if (searchTerm.length === 3) {
                setIsLoading(true);
                const accumulatedOccupations = [];
                let currentPage = 1;
                try {
                    while (true) {
                        const response = await axios.post(
                            process.env.REACT_APP_API_URL_TRACKER + '/api/occupations',
                            new URLSearchParams({ 'keywords': searchTerm, 'max_level': '3' }),
                            {
                                params: { 'page': currentPage.toString() },
                                headers: {
                                    'accept': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`
                                },
                            }
                        );
                        if (response.data.items.length === 0) break;
                        const occupations = response.data.items.map((occ) => ({ label: occ.label, id: occ.id }));
                        accumulatedOccupations.push(...occupations);
                        currentPage += 1;
                        if (currentPage > 2) break; // Limit recursion for performance
                    }
                    setAllOccupations(accumulatedOccupations);
                } catch (error) {
                    console.error('Error fetching occupations:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchOccupations();
    }, [searchTerm]);

    useEffect(() => {
        if (searchTerm.length >= 3 && allOccupations.length > 0) {
            setFilteredOccupations(allOccupations.filter((occ) => occ.label.toLowerCase().includes(searchTerm.toLowerCase())));
        } else {
            setFilteredOccupations([]);
        }
    }, [searchTerm, allOccupations]);

    const handleSelectOccupation = (occ) => {
        setSelectedOccupations([occ]); // Only one needed for Turf
        setSearchTerm('');
        setFilteredOccupations([]);
    };

    const handleRemoveOccupation = () => setSelectedOccupations([]);

    const handleApplyFilter = () => {
        if(selectedOccupations.length != 0 && datasource === "jobs" && onApplySelection) {
            onApplySelection({ selectedItem, selectedOccupations, combinations, keywords });
        }
        if(datasource !== "jobs" && onApplySelection) {
            onApplySelection({ selectedItem, combinations, keywords });
        }
    };

    return (
        <Card className="border shadow-none">
            <CardBody>
                <Row style={{justifyContent:"center"}}>
                    {/* OCCUPATION SEARCH - Visible ONLY for Jobs */}
                    {datasource === "jobs" && (
                        <Col md="12" className="mb-3">
                            <Label>Search Occupation</Label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', justifyContent:"center" }}>
                                {selectedOccupations.map((occupation) => (
                                    <div key={occupation.id} style={{ display: 'flex', alignItems: 'center', background: '#e0e0e0', borderRadius: '16px', padding: '4px 12px' }}>
                                        <span style={{ marginRight: '8px' }}>{occupation.label}</span>
                                        <button onClick={handleRemoveOccupation} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                                    </div>
                                ))}
                            </div>
                            {selectedOccupations.length === 0 && (
                                <input
                                    type="text"
                                    placeholder="Type 3 characters to search..."
                                    className="form-control"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            )}
                            {isLoading && <div className="small text-muted mt-1">Loading occupations...</div>}
                            {filteredOccupations.length > 0 && (
                                <ul style={{ listStyleType: 'none', padding: 0, margin: 0, border: '1px solid #ddd', borderRadius: '4px', position: 'absolute', background: '#fff', width: '90%', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                    {filteredOccupations.map((occ) => (
                                        <li key={occ.id} onClick={() => handleSelectOccupation(occ)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                                            {occ.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Col>
                    )}

                    {/* KEYWORDS - Visible for Policies, Profiles, Courses */}
                    {datasource !== "jobs" && (
                        <Col md="6">
                            <FormGroup>
                                <Label>Keywords (comma separated)</Label>
                                <Input 
                                    type="text" 
                                    placeholder="e.g. cloud, management, security" 
                                    value={keywords} 
                                    onChange={(e) => setKeywords(e.target.value)} 
                                />
                            </FormGroup>
                        </Col>
                    )}

                    {/* COMBINATIONS - Always Visible */}
                    <Col md="3">
                        <FormGroup>
                            <Label>Combinations (2-10)</Label>
                            <Input type="select" value={combinations} onChange={(e) => setCombinations(e.target.value)}>
                                {[...Array(9)].map((_, i) => (
                                    <option key={i + 2} value={i + 2}>{i + 2}</option>
                                ))}
                            </Input>
                        </FormGroup>
                    </Col>

                    {/* PILLAR - Always Visible */}
                    <Col md="3">
                        <FormGroup>
                            <Label>Select Pillar</Label>
                            <Dropdown isOpen={dropdownOpen} toggle={toggle} className="w-100">
                                <DropdownToggle caret className="w-100 text-capitalize">
                                    {selectedItem}
                                </DropdownToggle>
                                <DropdownMenu right className="w-100">
                                    <DropdownItem onClick={() => handleSelect('skills')}>Skills</DropdownItem>
                                    <DropdownItem onClick={() => handleSelect('knowledge')}>Knowledge</DropdownItem>
                                    <DropdownItem onClick={() => handleSelect('languages')}>Languages</DropdownItem>
                                    <DropdownItem onClick={() => handleSelect('traversal')}>Transversal</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </FormGroup>
                    </Col>
                </Row>

                <Button
                    className="btn-round"
                    color="info"
                    onClick={handleApplyFilter}
                    style={{ margin: "15px auto 0", display: "block" }}
                >
                    Apply Analysis
                </Button>
            </CardBody>
        </Card>
    );
};

export default OccupationSelectionAndPillar;