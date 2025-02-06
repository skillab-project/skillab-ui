import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
  Dropdown,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import { Line, Pie } from "react-chartjs-2";
import {
    dashboard24HoursPerformanceChart,
    dashboardEmailStatisticsChart,
    dashboardNASDAQChart,
  } from "variables/charts.js";
import { LuTrendingUpDown } from "react-icons/lu";
import { MdPolicy } from "react-icons/md";


function PolicyIndustryAccount() {

    function handelClickManagePolicies() {
        window.location.href = "/policy-industry/account/manage-policies";
    }

    return (
    <>
      <div className="content">
        <Row>
            <Col md="12">
                <Card>
                    <Row>
                        <Col md="12">
                            <Row>
                                <Col tag="h6">
                                    Management
                                </Col>
                            </Row>
                            <Row>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}} onClick={()=>handelClickManagePolicies()}>
                                        <CardBody>
                                            <MdPolicy size="50"/>                                        </CardBody>
                                        <CardFooter>
                                            Manage Policies
                                        </CardFooter>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col tag="h6">
                                    Insights
                                </Col>
                            </Row>
                            <Row>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <LuTrendingUpDown size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Future Technology Trends
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
                        <CardTitle tag="h5">My Policies</CardTitle>
                    </CardHeader>
                    <CardBody>
                        Coming Soon
                        {/* <Row>
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
                        </Row> */}
                    </CardBody>
                </Card>
            </Col>
        </Row>
      </div>
    </>
    );
}

export default PolicyIndustryAccount;
