import React, { useState } from 'react';
import { Row, Col, Card, CardBody, CardHeader, CardTitle, Tooltip, Table } from 'reactstrap';
import { FaInfoCircle } from 'react-icons/fa';
import OccupationSelection from './OccupationSelection';
import "../../assets/css/loader.css";
import axios from 'axios';
import SkillsNeeded from './SkillsNeeded';

const Biodiversity = () => {
    const [loading, setLoading] = useState(false);
    const [diversityIndices, setDiversityIndices] = useState([]);
    const [skillsData, setSkillsData] = useState([]);
    const [tooltipOpen, setTooltipOpen] = useState(false);

    const handleApplyOccupationSelection = (selectedOccupation) => {
        setLoading(true);
        fetchDiversityData(selectedOccupation[0].label);
    };

    const fetchDiversityData = async (occupation) => {
        try {
            // Updated to the new diversity endpoint
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL_SKILLS_DIVERSITY}/diversity?occupation_name=${occupation}`
            );
            
            // Index 0: Diversity Metrics (Richness, Shannon, etc)
            setDiversityIndices(res.data[0]);
            // Index 3: Detailed Skills Groupings
            setSkillsData(res.data[3]);
        } catch (err) {
            console.error("Error fetching diversity data:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle tag="h5">
                            Biodiversity Analysis
                        </CardTitle>
                        <OccupationSelection onApplySelection={handleApplyOccupationSelection}/>
                    </CardHeader>

                    {loading ? (
                        <CardBody className="text-center"><div className="lds-dual-ring"/></CardBody>
                    ) : (
                        diversityIndices.length > 0 && (
                            <CardBody>
                                {/* Section 1: Diversity Indices */}
                                <Row className="mb-4">
                                    <Col md="12">
                                        <Card className="border">
                                            <CardHeader><CardTitle tag="h6">Biodiversity Indices</CardTitle></CardHeader>
                                            <CardBody>
                                                <Table responsive size="sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Role</th>
                                                            <th>Richness</th>
                                                            <th>Shannon</th>
                                                            <th>Simpson</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {diversityIndices.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td>{item.Role}</td>
                                                                <td>{item.Richness}</td>
                                                                <td>{item.Shannon.toFixed(2)}</td>
                                                                <td>{item.Simpson.toFixed(4)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Section 2: Required Skills */}
                                <Row>
                                    <Col md="12">
                                        <Card className="border">
                                            <CardHeader><CardTitle tag="h6">Required Skills & Groupings</CardTitle></CardHeader>
                                            <CardBody>
                                                <SkillsNeeded data={skillsData}/>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            </CardBody>
                        )
                    )}
                </Card>
            </Col>
        </Row>
    );
};

export default Biodiversity;