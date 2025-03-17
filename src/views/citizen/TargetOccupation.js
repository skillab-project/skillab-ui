import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, CardHeader, CardTitle, Table, Pagination, PaginationItem, PaginationLink } from 'reactstrap';
import OccupationSelection from './OccupationSelection';
import "../../assets/css/loader.css";
import axios from 'axios';
import SkillsNeeded from './SkillsNeeded';


const TargetOccupation = ({skills}) => {
    const [loadingSkillsNeeded, setLoadingSkillsNeeded] = useState(false);
    const [skillsNeeded, setSkillsNeeded] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState("");
    const [selectedInstitute, setSelectedInstitute] = useState("");
    const [institutes, setInstitutes] = useState([]);

    const handleApplyOccupationSelection = (selectedOccupation) => {
        console.log('Occupation received:', selectedOccupation);
        setLoadingSkillsNeeded(true);
        fetchSkillsNeeded(selectedOccupation[0].label);
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

    const handleSelectInstitute = async (institute) => {
        setSelectedInstitute(institute);
    };

    const handleSelectSkill = async (skill) => {
        setSelectedSkill(skill);

        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL_CURRICULUM_SKILLS}/get_universities_by_skills`,
                {
                    'skills': [skill]
                },
            );
            console.log(res.data);

            // Transform response into the required format
            const formattedInstitutes = Object.entries(res.data).map(([university, courses]) => ({
                name: university,
                location: "", // Country is empty
                courses: Object.entries(courses).map(([courseName, skills]) => ({
                    name: courseName,
                    skills: skills
                }))
            }));

            setInstitutes(formattedInstitutes);
            setSelectedInstitute("");
        } catch (err) {
            console.error("Error fetching data:", err);
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
                                                <SkillsNeeded data={skillsNeeded} skills={skills} onSelectSkill={handleSelectSkill}/>
                                            }
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            {selectedSkill!="" &&
                                <Row>
                                    <Col md="12">
                                        <Card>
                                            <CardTitle tag="h6">
                                                Institutes
                                            </CardTitle>
                                            <CardBody>
                                                <Row>
                                                    <Col md="12">
                                                        <ul style={{paddingLeft:"0px", maxHeight: "500px", overflowY: "auto" }}>
                                                            {institutes.map((institute) => (
                                                                <li
                                                                    key={institute.name}
                                                                    style={{display:"flex", justifyContent:"space-between", alignItems:"center" }}
                                                                    className={`p-3 border border-gray-200 rounded-lg shadow-sm ${
                                                                        institute.name === selectedInstitute?.name ? 'bg-default' : 'bg-white'
                                                                    }`}
                                                                >
                                                                    <span>{institute.name}</span>
                                                                    <button
                                                                        onClick={() => handleSelectInstitute(institute)}
                                                                        aria-label={`More`}
                                                                    >
                                                                        <i className="fas fa-eye text-lg"></i>
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </Col>
                                                    
                                                    {selectedInstitute!="" &&
                                                        <Col md="12">
                                                            <Card>
                                                                <CardBody>
                                                                    <CardTitle>
                                                                        <h6>Courses</h6>
                                                                        {/* <h6>{selectedInstitute.name}</h6>
                                                                        <h6>{selectedInstitute.location}</h6> */}
                                                                    </CardTitle>
                                                                    <CardBody>
                                                                        <ul style={{paddingLeft:"0px", maxHeight: "500px", overflowY: "auto" }}>
                                                                            {selectedInstitute.courses.map((course) => (
                                                                                <li
                                                                                    key={course.name}
                                                                                    style={{display:"flex", justifyContent:"space-around", alignItems:"center" }}
                                                                                    className={`p-3 border border-gray-200 rounded-lg shadow-sm 'bg-white'}`}
                                                                                >
                                                                                    <span>{course.name}</span>
                                                                                    {/* <ul>
                                                                                        {course.skills.map((skill) => (
                                                                                            <li>{skill}</li>
                                                                                        ))}
                                                                                    </ul> */}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </CardBody>
                                                                </CardBody>
                                                            </Card>
                                                        </Col>
                                                    }
                                                </Row>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            }
                        </CardBody>
                    }
                </Card>
            </Col>
        </Row>
    );
};

export default TargetOccupation;