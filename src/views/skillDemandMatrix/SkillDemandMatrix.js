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
  TabPane
} from "reactstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,Legend,LineChart,Line} from "recharts";
import classnames from 'classnames';
import axios from 'axios';
import GroupLevel from "./GroupLevel";
import OccupationSelectionAndPillar from './OccupationSelectionAndPillar';
import "../../assets/css/loader.css";


function SkillDemandMatrix() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    var dataSkills = [
        { skill: "skill 1", priority: 30, rank: 20 },
        { skill: "skill 2", priority: 40, rank: 25 },
        { skill: "skill 3", priority: 25, rank: 30 },
        { skill: "skill 4", priority: 35, rank: 20 },
        { skill: "skill 5", priority: 45, rank: 15 },
    ];
    var selectedOccupations= ["skill","priority","rank"];
    
    

    const handleApplyOccupationSelection = (selectedOccupation, selectedItem) => {
        console.log('Occupation received:', selectedOccupation);
        console.log('Skill category:', selectedItem);
        var occupation = selectedOccupation.id;
        var pillar = selectedItem;
        setLoading(true);

        axios
            .get(process.env.REACT_APP_API_URL_SKILL_DEMAND_MATRIX + "/HierarchicalCumulativeVoting?url="+
                                process.env.REACT_APP_API_URL_TRACKER + "/api/jobs" +
                                "&pillar=" + pillar + "&occupation=" + occupation +
                                "&source=OJA")
            .then(async (res) => {
                setLoading(false);
                // Grouping data by level
                const groupedData = res.data.reduce((acc, item) => {
                    // Check if the level already exists in the accumulator
                    const levelIndex = acc.findIndex((group) => group[0].level === item.level);
            
                    const simplifiedItem = {
                        skill: item.skill,
                        level: item.level,
                        normalized_priority: item["normalized priority"],
                        rank: item.rank,
                    };
            
                    if (levelIndex !== -1) {
                        acc[levelIndex].push(simplifiedItem);
                    } else {
                        acc.push([simplifiedItem]);
                    }
            
                    return acc;
                }, []);
                console.log("Grouped Data:", groupedData);
                
                setData(groupedData);
            })
            .catch((err) => {
              console.error("Error fetching data:", err);
            });
    }
    
    return (
        <div className="content">
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Select occupation</CardTitle>
                            <OccupationSelectionAndPillar onApplySelection={handleApplyOccupationSelection}/>
                        </CardHeader>
                        <CardBody>
                            {loading ? (
                                <div className="lds-dual-ring"></div>
                            ) : data.length > 0 ? (
                                data.map((group, index) => <GroupLevel key={index} data={group} />)
                            ) : (
                                <h6>No data</h6>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default SkillDemandMatrix;
