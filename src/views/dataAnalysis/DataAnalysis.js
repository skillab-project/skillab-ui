import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  Row,
  Col,
  Button,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from "reactstrap";
import classnames from 'classnames';
import JobVacancies from "./JobVacancies";
import CVDatabases from "./CVDatabases"


function DataAnalysis() {
  const [currentActiveTab, setCurrentActiveTab] = useState('1');
  const toggle = tab => {
    if (currentActiveTab !== tab) setCurrentActiveTab(tab);
  }

  return (
    <>
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
                    Job Vacancies
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
                    CV Databases
                </NavLink>
            </NavItem>
            <NavItem style={{cursor:"pointer"}}>
                <NavLink
                    className={classnames({
                        active:
                            currentActiveTab === '3'
                    })}
                    onClick={() => { toggle('3'); }}
                >
                    Artifact Analysis
                </NavLink>
            </NavItem>
            <NavItem style={{cursor:"pointer"}}>
                <NavLink
                    className={classnames({
                        active:
                            currentActiveTab === '4'
                    })}
                    onClick={() => { toggle('4'); }}
                >
                    Document Text Mining
                </NavLink>
            </NavItem>
        </Nav>

        <TabContent activeTab={currentActiveTab}>
            <TabPane tabId="1">
                <Row>
                    <Col md="12">
                        <JobVacancies />
                    </Col>
                </Row>
            </TabPane>
            <TabPane tabId="2">
                <Row>
                    <Col md="12">
                        <CVDatabases />
                    </Col>
                </Row>
            </TabPane>
            <TabPane tabId="3">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">ss3</CardTitle>
                            </CardHeader>
                            <CardBody>
                                ss3
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </TabPane>
            <TabPane tabId="4">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">ss4</CardTitle>
                            </CardHeader>
                            <CardBody>
                                ss4
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </TabPane>
        </TabContent>
      </div>
    </>
  );
}

export default DataAnalysis;
