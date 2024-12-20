import React, { useState, useEffect  } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,Legend,LineChart,Line} from "recharts";
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
import { ComposableMap, Geographies, Geography, LabelList } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import TopCountries from "./TopCountries";


function DescriptiveAnalyticsOccupations() {
    // Top occupations
    const dataOccupations = [
        { occupation: "Software Engineer", frequency: 100 },
        { occupation: "Data Scientist", frequency: 90 },
        { occupation: "Teacher", frequency: 70 },
        { occupation: "Nurse", frequency: 20 },
        { occupation: "Designer", frequency: 60 },
    ];
    // Top sectors
    const dataSectors = [
        { sector: "Software Engineer", frequency: 100 },
        { sector: "Data Scientist", frequency: 90 },
        { sector: "Teacher", frequency: 70 },
        { sector: "Nurse", frequency: 20 },
        { sector: "Designer", frequency: 60 },
    ];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h4">Descriptive Analytics</CardTitle>
                {/* <CardSubtitle>
                    Select ISCO Level: 
                    <select name="isco-levels" id="isco-levels">
                        <option value="">--choose an option--</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="2">3</option>
                        <option value="3">4</option>
                    </select>
                </CardSubtitle> */}
            </CardHeader>
            <CardBody>
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h6">Top Occupations</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <ResponsiveContainer width="100%" height={dataOccupations.length * 60}>
                                    <BarChart
                                        data={dataOccupations}
                                        layout="vertical"
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        barSize={30}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="occupation" type="category" width={200} />
                                        <Tooltip />
                                        <Bar dataKey="frequency" fill="#f39423"/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>  {/* What is the difference with Top Occupations? */}
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h6">Top Sectors</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <ResponsiveContainer width="100%" height={dataSectors.length * 60}>
                                    <BarChart
                                        data={dataSectors}
                                        layout="vertical"
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        barSize={30}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="sector" type="category" width={200} />
                                        <Tooltip />
                                        <Bar dataKey="frequency" fill="#f39423"/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col md="12">
                        <TopCountries type="Occupations" />
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
}

export default DescriptiveAnalyticsOccupations;