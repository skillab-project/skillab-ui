import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, CardHeader, CardTitle, Table, Pagination, PaginationItem, PaginationLink } from 'reactstrap';
import OccupationSelection from './OccupationSelection';
import "../../assets/css/loader.css";
import axios from 'axios';
import SkillsNeeded from './SkillsNeeded';


const TargetOccupation = ({skills}) => {
    const [loadingSkillsNeeded, setLoadingSkillsNeeded] = useState(false);
    const [skillsNeeded, setSkillsNeeded] = useState([]);
    const [selectedInstitute, setSelectedInstitute] = useState("");
    const [institutes, setInstitutes] = useState([{name:"UoM",location:"Greece",courses:[{name:"OOP",skills:["Java","Python"]}]},
                                                    {name:"Auth",location:"Greece",courses:[{name:"OOP",skills:["Java","Python"]}]} ]);

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
            
            fetchInstitutes(res.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoadingSkillsNeeded(false);
        }
    };

    const fetchInstitutes = async (skillsNeededFromRequest) => {
        try {
            console.log(skillsNeededFromRequest);
            const coursesList = skillsNeededFromRequest
                .filter(skill => skill.Pillar === "K" && skill.Value > 0.071)
                .map(skill => skill.Skills);

            console.log(coursesList);
            
            // toDO
            //
            // Make request
            // const res = await axios.get(
            //     `${process.env.REACT_APP_API_URL_CURRICULUM_SKILLS}/proposed-courses?courses=${coursesList}`
            // );
            // //toDO
            // // adjust first?
            // setInstitutes(res.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };


    const handleSelectInstitute = async (institute) => {
        setSelectedInstitute(institute);
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
                                                <SkillsNeeded data={skillsNeeded} skills={skills}/>
                                            }
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

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
                                                                <span>{institute.name}, {institute.location}</span>
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
                                                                                <span style={{fontWeight:"bold"}}>{course.name}</span>
                                                                                <ul>
                                                                                    {course.skills.map((skill) => (
                                                                                        <li>{skill}</li>
                                                                                    ))}
                                                                                </ul>
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
                        </CardBody>
                    }
                </Card>
            </Col>
        </Row>
    );
};

export default TargetOccupation;