import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  Row,
  Col
} from "reactstrap";
import { Line, Pie } from "react-chartjs-2";
import {
    dashboard24HoursPerformanceChart,
    dashboardEmailStatisticsChart,
    dashboardNASDAQChart,
  } from "variables/charts.js";


function IndustryAccount() {

    function handelClickArtifactRepositories() {
        window.location.href = "/industry/account/artifacts";
    }
    function handelClickEmployeeKnowleageUnits() {
        window.location.href = "/industry/account/ku";
    }


    return (
    <div className="content">
        <Row>
            <Col md="12">
                <Card>
                    <Row>
                        <Col md="12">
                            <Row>
                                <Col tag="h6">
                                    Organization Insights and Decision Making
                                </Col>
                            </Row>
                            <Row>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <i class="fa fa-globe"></i>
                                        </CardBody>
                                        <CardFooter>
                                            Gap with Competition
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <i class="fa fa-globe"></i>
                                        </CardBody>
                                        <CardFooter>
                                            Knowleage Units at Risk
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <i class="fa fa-globe"></i>
                                        </CardBody>
                                        <CardFooter>
                                            Future Needs
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <i class="fa fa-globe"></i>
                                        </CardBody>
                                        <CardFooter>
                                            Insights on Future
                                        </CardFooter>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col tag="h6">
                                    Job Management
                                </Col>
                            </Row>
                            <Row>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <i class="fa fa-globe"></i>
                                        </CardBody>
                                        <CardFooter>
                                            Job Advertizmetns
                                        </CardFooter>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col tag="h6">
                                    Data Analysis and Skill Identification
                                </Col>
                            </Row>
                            <Row>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}} onClick={()=>handelClickArtifactRepositories()}>
                                        <CardBody>
                                            <i class="fa fa-globe"></i>
                                        </CardBody>
                                        <CardFooter>
                                            Artifact Repositories
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <i class="fa fa-globe"></i>
                                        </CardBody>
                                        <CardFooter>
                                            Skill Training Sets
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <i class="fa fa-globe"></i>
                                        </CardBody>
                                        <CardFooter>
                                            Data Analysis Pipelines
                                        </CardFooter>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col tag="h6">
                                    Employee Skills and Information
                                </Col>
                            </Row>
                            <Row>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}} onClick={()=>handelClickEmployeeKnowleageUnits()}>
                                        <CardBody>
                                            <i class="fa fa-globe"></i>
                                        </CardBody>
                                        <CardFooter>
                                            Employee Skills and Knowleage Units
                                        </CardFooter>
                                    </Card>
                                </Col>
                            </Row>

                        </Col>
                    </Row>
                </Card>
            </Col>
        </Row>


        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">My Organization</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Row>
                            <Col xl="4" md="6" sm="12">
                                <Card className="card-stats">
                                    <CardHeader>
                                        <CardTitle tag="h5">2022</CardTitle>
                                    </CardHeader>
                                    <CardBody>
                                        <Row>
                                            <Col md="12">
                                                table
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col xl="4" md="6" sm="12">
                                <Card className="card-stats">
                                    <CardHeader>
                                        <CardTitle tag="h5">2023</CardTitle>
                                    </CardHeader>
                                    <CardBody>
                                        <Row>
                                        <Col md="12">
                                                table
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col xl="4" md="6" sm="12">
                                <Card className="card-stats">
                                    <CardHeader>
                                        <CardTitle tag="h5">2024</CardTitle>
                                    </CardHeader>
                                    <CardBody>
                                        <Row>
                                            <Col md="12">
                                                table
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        <Row>
                            <Col md="12">
                                <Card>
                                    <CardBody>
                                        <Line
                                        data={dashboard24HoursPerformanceChart.data}
                                        options={dashboard24HoursPerformanceChart.options}
                                        width={400}
                                        height={100}
                                        />
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    </div>
    );
}

export default IndustryAccount;
