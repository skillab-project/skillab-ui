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
import { MdManageAccounts } from "react-icons/md";
import { GiTeamIdea } from "react-icons/gi";


function EducationAccount() {

    const handelClickManagement =()=> {
        window.location.href = "/education/account/management";
    }

    const handelClickTaxonomy =()=> {
        window.location.href = "/education/account/taxonomy";
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
                                    Skill Identification offered by an Educational Institute
                                </Col>
                            </Row>
                            <Row>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}} onClick={()=>handelClickManagement()}>
                                        <CardBody>
                                            <MdManageAccounts size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Management
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}} onClick={()=>handelClickTaxonomy()}>
                                        <CardBody>
                                            <MdManageAccounts size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Taxonomy
                                        </CardFooter>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col tag="h6">
                                    Provision of Educational Recommendations
                                </Col>
                            </Row>
                            <Row>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <GiTeamIdea size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Recommendations
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
                        <CardTitle tag="h5">My University</CardTitle>
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

export default EducationAccount;
