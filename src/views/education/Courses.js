import React, { useState, useEffect } from "react";
import {Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import axios from 'axios';


const Courses = ({universityName}) => {
    const [semesters, setSemesters] = useState([]);
    const [search, setSearch] = useState(true);
    const [loading, setLoading] = useState(false);
    const [semesterShow, setSemesterShow] = useState("");
    const [selectedCourse, setSelectedCourse] = useState({});

    const getUniversityData = async () => {
        try {
            setLoading(true);
            await axios
                .get(process.env.REACT_APP_API_URL_CURRICULUM_SKILLS + "/all_university_data?university_name="+universityName)
                .then((res) => {
                    console.log("get_data: "+res.data);
                    
                    const apiData = res.data;
                    const formattedSemesters = Object.entries(apiData.semesters).map(([semesterName, courses]) => ({
                        name: semesterName,
                        courses: Object.entries(courses).map(([courseName, courseData]) => ({
                            name: courseName,
                            description: courseData.description,
                            skills: courseData.skills.map(skill => skill.name),
                        })),
                    }));

                    setSemesters(formattedSemesters);
                });
        } catch (err) {
            console.error("Error fetching data:", err);
        }
        setLoading(false);
    }

    useEffect(() => {
        getUniversityData();
    }, []);

    // const handleApplyProgramSelection = (selectedDepartment, selectedProgram) => {
    //     console.log('Deparment: ', selectedDepartment);
    //     console.log('Program:', selectedProgram);
    // }

    const handleSelectSemester = (semester) => {
        setSelectedCourse({});
        setSemesterShow(semester.name);
        if(semesterShow == semester.name)
            setSemesterShow("");
    }

    const handleSelectCourse = (course) => {
        setSelectedCourse(course);
    }

    return (
        <Row>
            <Col md="12">
                <Card>
                    {/* <CardHeader>
                        <CardTitle tag="h5">Select Program</CardTitle>
                        <ProgramSelection onApplySelection={handleApplyProgramSelection}/>
                    </CardHeader> */}
                    <CardBody>
                        {loading ? (
                            <div className="lds-dual-ring"></div>
                        ) : !search ? (
                            <></>
                        ) : (
                            <>
                                {semesters.map((semester) => (
                                    <Card>
                                        <CardHeader style={{ cursor: "pointer" }} onClick={() => handleSelectSemester(semester)}>
                                            <CardTitle tag="h5">
                                                {semester.name.split(" (")[0]}{" "}
                                                <span style={{ fontSize: "0.8em", color: "#666" }}>
                                                    ({semester.name.split(" (")[1]}
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        {semesterShow == semester.name && 
                                            <CardBody>
                                                <Row>
                                                    <Col md="4">
                                                        <ul style={{paddingLeft:"0px", maxHeight: "550px", overflowY: "auto" }}>
                                                            {semester.courses.map((course) => (
                                                                <li
                                                                    key={course.name}
                                                                    style={{display:"flex", justifyContent:"space-between", alignItems:"center" }}
                                                                    className={`p-3 border border-gray-200 rounded-lg shadow-sm ${
                                                                        course.name === selectedCourse?.name ? 'bg-default' : 'bg-white'
                                                                    }`}
                                                                >
                                                                    <span style={{textAlign:"left"}}>
                                                                        {course.name}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleSelectCourse(course)}
                                                                        aria-label={`More`}
                                                                    >
                                                                        <i className="fas fa-eye text-lg"></i>
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </Col>
                                                    <Col md="8">
                                                        {Object.keys(selectedCourse).length !== 0 && 
                                                            <>
                                                                <Row>
                                                                    <Col lg="12" xl="8">
                                                                        <Card>
                                                                            <CardHeader>
                                                                                <CardTitle tag="h5">Description</CardTitle>
                                                                            </CardHeader>
                                                                            <CardBody>
                                                                                <span>{selectedCourse.description}</span>
                                                                            </CardBody>
                                                                        </Card>
                                                                    </Col>
                                                                    <Col lg="12" xl="4">
                                                                        <Card>
                                                                            <CardHeader>
                                                                                <CardTitle tag="h5">Skills</CardTitle>
                                                                            </CardHeader>
                                                                            <CardBody>
                                                                                <ul style={{textAlign:"left"}}>
                                                                                    {selectedCourse.skills.map((skill) => (
                                                                                        <li>{skill}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            </CardBody>
                                                                        </Card>
                                                                    </Col>
                                                                </Row>
                                                                <Row>
                                                                    <Col md="4">
                                                                        <Button>
                                                                            <i className="fas fa-save text-lg" style={{fontSize:"large"}}></i>
                                                                            <div>Save</div>
                                                                        </Button>
                                                                    </Col>
                                                                    <Col md="4">
                                                                        <Button>
                                                                            <i className="fas fa-upload text-lg" style={{fontSize:"large"}}></i>
                                                                            <div>Import</div>
                                                                        </Button>
                                                                    </Col>
                                                                    <Col md="4">
                                                                        <Button>
                                                                            <i className="fas fa-trash text-lg" style={{fontSize:"large"}}></i>
                                                                            <div>Delete</div>
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                            </>
                                                        }
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        }
                                    </Card>
                                ))}
                            </>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default Courses;