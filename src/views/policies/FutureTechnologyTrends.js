import React, { useState, useEffect, useRef } from "react";
import {
  Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button,
  Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner, Input, Label,
  FormGroup
} from "reactstrap";
import classnames from 'classnames';
import FutureTechnologyTrendsIdentifier from "./futureTechnology/FutureTechnologyTrendsIdentifier";
import JobClassifier from "./futureTechnology/JobClassifier";

const FutureTechnologyTrends = () => {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }

    return (
    <div className="content">
        <Nav tabs style={{marginBottom:"5px"}}>
            <NavItem style={{cursor:"pointer"}}>
                <NavLink
                    className={classnames({
                        active:
                            currentActiveTab === '1'
                    })}
                    onClick={() => { toggle('1'); }}
                >
                    Future Technology Trends Identifier
                </NavLink>
            </NavItem>
            <NavItem style={{cursor:"pointer"}}>
                <NavLink
                    className={classnames({
                        active:
                            currentActiveTab === '2'
                    })}
                    onClick={() => { toggle('2'); }}
                >
                    Job classifier
                </NavLink>
            </NavItem>
        </Nav>

        <TabContent activeTab={currentActiveTab}>
            <TabPane tabId="1">
                <Row>
                    <Col md="12">
                        <FutureTechnologyTrendsIdentifier />
                    </Col>
                </Row>
            </TabPane>
            <TabPane tabId="2">
                <Row>
                    <Col md="12">
                        <JobClassifier />
                    </Col>
                </Row>
            </TabPane>
        </TabContent>
    </div>
    );
}

export default FutureTechnologyTrends;