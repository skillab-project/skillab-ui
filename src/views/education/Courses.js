import React, { useState, useEffect } from "react";
import {Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";


const Courses = () => {
    const [data, setData] = useState([]);


    useEffect(() => {
        //to DO
    }, []);

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardBody>
                        Courses
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default Courses;