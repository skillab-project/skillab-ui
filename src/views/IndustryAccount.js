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

    const handleViewOrganizationSkills = async () => {
        try {
            const response = await fetch(process.env.REACT_APP_API_URL_KU + '/detected_kus');
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const analysisData = await response.json();
    
            console.log('Fetched Analysis Data:', analysisData);
    
            const aggregatedData = {};
    
            analysisData.forEach((item, index) => {
                console.log(`Processing item ${index}:`, item);
    
                const { kus, author } = item;
    
                for (const key in kus) {
                    if (Object.hasOwnProperty.call(kus, key)) {
                        console.log(`Processing KU "${key}" with value: ${kus[key]}`);
    
                        if (typeof kus[key] === 'number') {
                            if (!aggregatedData[key]) {
                                aggregatedData[key] = {
                                    files: 0,
                                    authors: new Set(),
                                    employeeCount: 0,
                                };
                                console.log(`Initialized data for KU "${key}".`);
                            }
    
                            aggregatedData[key].files += kus[key];
                            console.log(`Updated files for KU "${key}":`, aggregatedData[key].files);
    
                            if (kus[key] === 1) {
                                aggregatedData[key].authors.add(author);
                                console.log(`Added author "${author}" to KU "${key}".`);
                            }
    
                            aggregatedData[key].employeeCount = aggregatedData[key].authors.size;
                            console.log(`Updated employeeCount for KU "${key}":`, aggregatedData[key].employeeCount);
                        }
                    }
                }
            });
    
            console.log('Final Aggregated Data:', aggregatedData);
    
            const sortedKeys = Object.keys(aggregatedData).sort((a, b) => {
                const numA = parseInt(a.slice(1));
                const numB = parseInt(b.slice(1));
                return numA - numB;
            });
    
            console.log('Sorted Keys:', sortedKeys);
    
            const labels = sortedKeys;
            const dataFiles = sortedKeys.map(key => aggregatedData[key].files);
            const dataEmployees = sortedKeys.map(key => aggregatedData[key].employeeCount);
    
            console.log('Chart Data - Files:', dataFiles);
            console.log('Chart Data - Employees:', dataEmployees);
    
            setChartData({
                labels: labels,
                datasets: [
                    {
                        label: 'Number of Files',
                        data: dataFiles,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Number of Authors',
                        data: dataEmployees,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1',
                    },
                ],
                options: {
                    responsive: true,
                    layout: {
                        padding: {
                            right: 150,
                        },
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Number of Files',
                            },
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            offset: true,
                            title: {
                                display: true,
                                text: 'Number of Authors',
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                },
            });
    
            console.log('Chart Data prepared successfully.');

        } catch (error) {
            console.error('Failed to load analysis data:', error);
        }
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
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <MdModelTraining size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Skill Training Sets
                                        </CardFooter>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card style={{cursor:"pointer"}}>
                                        <CardBody>
                                            <SiJfrogpipelines size="50"/>
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
                                            <FaPeopleRoof size="50"/>
                                        </CardBody>
                                        <CardFooter>
                                            Employee Skills
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
