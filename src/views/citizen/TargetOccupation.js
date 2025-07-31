import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, CardHeader, CardTitle, Tooltip } from 'reactstrap';
import { FaInfoCircle } from 'react-icons/fa';
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
    const [coursesForUpskilling, setCoursesForUpskilling] = useState([]);
    const [tooltipOpen, setTooltipOpen] = useState(false);

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

        // Univerities
        getUniversities(skill);
        // Courses
        getCourses(skill);
    };

    const getCourses = async (skill) => {
        setCoursesForUpskilling([]);
        try {
            // Get skill id
            var skillId = "";
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL_TRACKER}/api/skills`,
                new URLSearchParams({
                    'keywords': skill
                }),
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`
                    },
                }
            );
            const items = res.data.items || [];
            const matchedSkill = items.find(item => item.label.toLowerCase() === skill.toLowerCase());

            if (matchedSkill) {
                const skillId = matchedSkill.id;
                console.log("Skill ID:", skillId);

                // Get courses
                const courseRes = await axios.post(
                    `${process.env.REACT_APP_API_URL_TRACKER}/api/courses?page=1`,
                    new URLSearchParams({
                        'skill_ids': skillId
                    }),
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`
                        },
                    }
                );
                
                console.log(courseRes.data);
                const formattedCourses = (courseRes.data.items || []).map(course => ({
                    title: course.title,
                    rating: course.rating,
                    url: course.url,
                    source: course.source
                }));
                setCoursesForUpskilling(formattedCourses);
                console.log(formattedCourses);
            } else {
                console.warn("Skill not found for label:", skill);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    }

    const getUniversities = async (skill) => {
        try {
            const res = await axios.get(
                process.env.REACT_APP_API_URL_CURRICULUM_SKILLS+"/get_universities_by_skills?skills="+skill
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
    }

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <div style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
                            <CardTitle tag="h5">Target occupation</CardTitle>
                            <FaInfoCircle
                                id="occupationInfo"
                                className="ms-2"
                                style={{ cursor: 'pointer', marginLeft:'10px' }}
                            />
                            <Tooltip
                                isOpen={tooltipOpen}
                                target="occupationInfo"
                                toggle={() => setTooltipOpen(!tooltipOpen)}
                            >
                                This is the role you're aiming for in your career.
                            </Tooltip>
                        </div>
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
                                                                        institute.name === selectedInstitute?.name ? 'bg-success' : 'bg-white'
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

                                    <Col md="12">
                                        <Card>
                                            <CardTitle tag="h6">
                                                Online Courses
                                            </CardTitle>
                                            <CardBody>
                                                <Row>
                                                    {coursesForUpskilling.map((course) => (
                                                        <Col md="3">
                                                            <Card>
                                                                <CardTitle tag="h6">
                                                                    <a href={course.url} style={{textDecoration: "inherit",color: "inherit"}} target="_blank">
                                                                        {course.title}
                                                                    </a>
                                                                </CardTitle>
                                                                <CardBody>
                                                                    {course.rating != null  &&
                                                                        <div>{course.rating}/10</div>
                                                                    }
                                                                    <div>{course.source}</div>
                                                                </CardBody>
                                                            </Card>
                                                        </Col>
                                                    ))}
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