import React, { useState, useEffect } from "react";
import {Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import ProgramSelection from "./ProgramSelection.js"

const Courses = () => {
    const [data, setData] = useState({});
    const [search, setSearch] = useState(false);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        //to DO
    }, []);

    const handleApplyProgramSelection = (selectedDepartment, selectedProgram) => {
        console.log('Deparment: ', selectedDepartment);
        console.log('Program:', selectedProgram);
    }

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">Select Program</CardTitle>
                        <ProgramSelection onApplySelection={handleApplyProgramSelection}/>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <div className="lds-dual-ring"></div>
                        ) : !search ? (
                            <></>
                        ) : (
                            <>show</>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default Courses;