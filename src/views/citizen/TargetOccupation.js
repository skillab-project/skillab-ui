import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, CardHeader, CardTitle, Table, Pagination, PaginationItem, PaginationLink } from 'reactstrap';
import OccupationSelection from './OccupationSelection';
import "../../assets/css/loader.css";
import axios from 'axios';
import SkillsNeeded from './SkillsNeeded';


const TargetOccupation = ({}) => {
    const [loadingSkillsNeeded, setLoadingSkillsNeeded] = useState(false);
    const [skillsNeeded, setSkillsNeeded] = useState([]);

    const handleApplyOccupationSelection = (selectedOccupation) => {
        console.log('Occupation received:', selectedOccupation);
        setLoadingSkillsNeeded(true);
        fetchSkillsNeeded(selectedOccupation[0].label);
        //toDo
        //fetchInstitutes
    };

    const fetchSkillsNeeded = async (occupation) => {
        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL_SKILLS_REQUIRED}/required_skills_service?occupation_name=${occupation}`
            );
            setSkillsNeeded(res.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoadingSkillsNeeded(false);
        }
    };

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">Target occupation</CardTitle>
                        <OccupationSelection onApplySelection={handleApplyOccupationSelection}/>
                    </CardHeader>
                    {skillsNeeded.length!=0 &&
                        <CardBody>
                            <Row>
                                <Col md="12">
                                    <Card>
                                        <CardTitle tag="h6">
                                            Required Skills
                                        </CardTitle>
                                        <CardBody>
                                            {loadingSkillsNeeded ? 
                                                <div className="lds-dual-ring"/>
                                                :
                                                <SkillsNeeded data={skillsNeeded}/>
                                            }
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col md="12">
                                    <Card>
                                        <CardBody>
                                            Table for Institutes
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </CardBody>
                    }
                </Card>
            </Col>
        </Row>
    );
};

export default TargetOccupation;