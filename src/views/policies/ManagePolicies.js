import React, { useState, useEffect } from "react";
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
    TabPane,
    CardSubtitle
  } from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import Workflows from "./Workflows"
import KPIsMain from "./kpis/KPIsMain"
import MetricsMain from "./metrics/MetricsMain"
import KPIsSetup from "./kpis/KPIsSetup"

function ManagePolicies() {
    // Tabs
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
                        KPIs
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
                        Metrics
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
                        KPIs-Setup
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
                        Workflows
                    </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab={currentActiveTab}>
                <TabPane tabId="1">
                    <Row>
                        <Col md="12">
                            <Card>
                                <CardBody>
                                    <KPIsMain />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </TabPane>
                
                <TabPane tabId="2">
                    <Row>
                        <Col md="12">
                            <Card>
                                <CardBody>
                                    <MetricsMain />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </TabPane>
                
                <TabPane tabId="3">
                    <Row>
                        <Col md="12">
                            <Card>
                                <CardBody>
                                    <KPIsSetup />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </TabPane>
                
                <TabPane tabId="4">
                    <Row>
                        <Col md="12">
                            <Card style={{height:"104vh"}}>
                                <CardBody>
                                    <Workflows/>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </TabPane>
            </TabContent>
        </div>
    );
}

export default ManagePolicies;