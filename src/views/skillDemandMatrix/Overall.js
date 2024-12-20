import React, { useState, useEffect } from 'react';
import {Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button } from "reactstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,Legend,LineChart,Line} from "recharts";

import axios from 'axios';

const Overall = () => {

    var data = [
        { skill: "skill 1", priority: 30, rank: 20 },
        { skill: "skill 2", priority: 40, rank: 25 },
        { skill: "skill 3", priority: 25, rank: 30 },
        { skill: "skill 4", priority: 35, rank: 20 },
        { skill: "skill 5", priority: 45, rank: 15 },
    ];
    var selectedOccupations= ["skill","priority","rank"];

    var dataSectors = [
        { sector: "Software Engineer", frequency: 100 },
        { sector: "Data Scientist", frequency: 90 },
        { sector: "Teacher", frequency: 70 },
        { sector: "Nurse", frequency: 20 },
        { sector: "Designer", frequency: 60 },
    ];

    return (
        <>
            <Row>
                <Col md="12">
                    <Card>
                        <CardBody>
                            Select Pillar: 
                            <select name="pillar" id="pillar">
                                <option value="">--choose an pillar--</option>
                                <option value="S">S</option>
                                <option value="K">K</option>
                                <option value="L">L</option>
                                <option value="T">T</option>
                            </select>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Level 1</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Row>
                                <Col lg="12" xl="6">
                                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                                        <thead>
                                            <tr>
                                                {selectedOccupations.map((skill) => (
                                                    <th key={skill} style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {skill}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((row) => (
                                                <tr key={row.skill}>
                                                    {selectedOccupations.map((skill) => (
                                                        <td key={skill}
                                                            style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}
                                                        >
                                                            {row[skill]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Col>
                                <Col lg="12" xl="6" style={{marginTop:"5px"}}>
                                    <ResponsiveContainer width="100%" height={data.length * 60}>
                                        <BarChart
                                            data={data}
                                            layout="vertical"
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            barSize={30}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="skill" type="category" width={200} />
                                            <Tooltip />
                                            <Bar dataKey="priority" fill="#f39423"/>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Level 2</CardTitle>
                        </CardHeader>
                        <CardBody>
                            S
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </>
    );
}
export default Overall;