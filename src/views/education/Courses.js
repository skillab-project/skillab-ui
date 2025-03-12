import React, { useState, useEffect } from "react";
import {Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import axios from 'axios';


const Courses = ({universityName}) => {
    const [data, setData] = useState({name:"UoM", location:"Greece", semesters:[{name:"semester 1",courses:[{name:"OOP",description:"...",professor:"achat",skills:["Java","Python","OOP"]},
                                                                                                            {name:"OOP2",description:"... more",professor:"achat",skills:["Java","Python","OOP"]}]},
                                                                                {name:"semester 2",courses:[{name:"OOP",description:"...",professor:"achat",skills:["Java","Python","OOP"]}]}]});
    const [search, setSearch] = useState(true);
    const [loading, setLoading] = useState(false);
    const [semesterShow, setSemesterShow] = useState("");
    const [selectedCourse, setSelectedCourse] = useState({});

    // const getUniversityData = async () => {
    //     try {
    //         await axios
    //             .get(process.env.REACT_APP_API_URL_CURRICULUM_SKILLS + "/get_university_data?name="+universityName)
    //             .then((res) => {
    //                 console.log("get_data: "+res.data);
                    
    //                 //toDO
    //                 // setData();
    //             });
    //     } catch (err) {
    //         console.error("Error fetching data:", err);
    //     }
    // }

    useEffect(() => {
        // getUniversityData();
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
                                {data.semesters.map((semester) => (
                                    <Card>
                                        <CardHeader style={{cursor:"pointer"}} onClick={() => handleSelectSemester(semester)}>
                                            <CardTitle tag="h5">{semester.name}</CardTitle>
                                        </CardHeader>
                                        {semesterShow == semester.name && 
                                            <CardBody>
                                                <Row>
                                                    <Col md="4">
                                                        <ul style={{paddingLeft:"0px", maxHeight: "500px", overflowY: "auto" }}>
                                                            {semester.courses.map((course) => (
                                                                <li
                                                                    key={course.name}
                                                                    style={{display:"flex", justifyContent:"space-between", alignItems:"center" }}
                                                                    className={`p-3 border border-gray-200 rounded-lg shadow-sm ${
                                                                        course.name === selectedCourse?.name ? 'bg-default' : 'bg-white'
                                                                    }`}
                                                                >
                                                                    <span>{course.name}</span>
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
                                                                    <Col md="4">
                                                                        <Card>
                                                                            <CardHeader>
                                                                                <CardTitle tag="h5">Professor</CardTitle>
                                                                            </CardHeader>
                                                                            <CardBody>
                                                                                <span>{selectedCourse.professor}</span>
                                                                            </CardBody>
                                                                        </Card>
                                                                    </Col>
                                                                    <Col md="8">
                                                                        <Card>
                                                                            <CardHeader>
                                                                                <CardTitle tag="h5">Description</CardTitle>
                                                                            </CardHeader>
                                                                            <CardBody>
                                                                                <span>{selectedCourse.description}</span>
                                                                            </CardBody>
                                                                        </Card>
                                                                    </Col>
                                                                </Row>
                                                                <Row>
                                                                    <Col md="12">
                                                                        <Card>
                                                                            <CardHeader>
                                                                                <CardTitle tag="h5">Skills</CardTitle>
                                                                            </CardHeader>
                                                                            <CardBody>
                                                                                <ul style={{padding:"0px", listStyle:"none"}}>
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