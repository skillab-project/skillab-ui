import React, { useState, useEffect } from "react";
import {Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";


const Taxonomies = () => {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');


    useEffect(() => {
        //to DO
    }, []);

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardBody>
                        Coming soon
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default Taxonomies;