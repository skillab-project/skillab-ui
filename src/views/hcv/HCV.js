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
import axios from 'axios';
import GroupLevel from "./GroupLevel";
import OccupationSelectionAndPillar from './OccupationSelectionAndPillar';
import "../../assets/css/loader.css";


function HCV({datasource}) {
    const [search, setSearch] = useState(false);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    

    const handleApplyOccupationSelection = (selectedOccupation, selectedItem) => {
        console.log('Occupation received:', selectedOccupation);
        console.log('Skill category:', selectedItem);
        var occupation = selectedOccupation.id;
        var pillar = selectedItem;
        setSearch(true);
        setLoading(true);

        if(datasource=="jobs"){
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
    }
    
    return (
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
                        ) : !search ? (
                            <></>
                        ) : data.length > 0 ? (
                            data.map((group, index) => <GroupLevel key={index} data={group} />)
                        ) : (
                            <h6>No data</h6>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default HCV;
