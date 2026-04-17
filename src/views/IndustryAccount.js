import React, { useState, useEffect } from "react";
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
import { GiStairsGoal } from "react-icons/gi";
import { AiFillAlert } from "react-icons/ai";
import { LuTrendingUpDown } from "react-icons/lu";
import { TbZoomInArea } from "react-icons/tb";
import { TfiAnnouncement } from "react-icons/tfi";
import { FaListUl, FaPeopleRoof } from "react-icons/fa6";
import { SiJfrogpipelines } from "react-icons/si";
import { MdModelTraining } from "react-icons/md";
import { FaBuilding } from "react-icons/fa";
import { Bar } from 'react-chartjs-2';




function IndustryAccount() {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        // handleViewOrganizationSkills();
    }, []);
    

    function handelClickJobAdvertisements() {
        window.location.href = "/industry/account/advertisements";
    }
    function handelClickArtifactRepositories() {
        window.location.href = "/industry/account/artifacts";
    }
    function handelClickEmployeeKnowleageUnits() {
        window.location.href = "/industry/account/employee-skills";
    }
    function handelClickGapWithCompetition() {
        window.location.href = "/industry/account/gap-competition";
    }
    function handelClickSkillsAtRisk() {
        window.location.href = "/industry/account/at-risk";
    }
    function handleClickOrganizationInfo() {
        window.location.href = "/industry/account/organization-info";
    }

    const handleViewOrganizationSkills = async () => {
        //toDo
        // once employee management is ready
    };    


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
                                    <Card style={{cursor:"pointer"}} onClick={()=>handelClickGapWithCompetition()}>
                                        <CardBody>
                                            <GiStairsGoal size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Gap with Competition
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}} onClick={()=>handelClickSkillsAtRisk()}>
                                        <CardBody>
                                            <AiFillAlert size="50" />
                                        </CardBody>
                                        <CardFooter>
                                            Skills at Risk
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <LuTrendingUpDown size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Future Needs
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <TbZoomInArea size="50"/>
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
                                    <Card style={{cursor:"pointer"}} onClick={()=>handelClickJobAdvertisements()}>
                                        <CardBody>
                                            <TfiAnnouncement size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Job Advertisements
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
                                            <FaListUl size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Artifact Repositories
                                        </CardFooter>
                                    </Card>
                                </Col>
                                {/* <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <MdModelTraining size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Skill Training Sets
                                        </CardFooter>
                                    </Card>
                                </Col> */}
                                {/* <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <SiJfrogpipelines size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Data Analysis Pipelines
                                        </CardFooter>
                                    </Card>
                                </Col> */}
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
                                            <FaPeopleRoof size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Employee Skills
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}} onClick={()=>handleClickOrganizationInfo()} >
                                        <CardBody>
                                            <FaBuilding size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Organization Information
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
                        Coming Soon
                        {/* <Row>
                            <Col md="12">
                                {chartData &&
                                    <div className="mt-8">
                                        <Bar data={chartData} />
                                    </div>
                                }
                            </Col>
                        </Row> */}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    </div>
    );
}

export default IndustryAccount;
