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
    const [isTakingLong, setIsTakingLong] = useState(false);
    const [infoMessage, setInfoMessage] = useState("");
    
    // Ref to store the timeout ID so we can clear it
    const timerRef = useRef(null);

    const handleApplyOccupationSelection = (selectedOccupation, selectedItem) => {
        console.log('Occupation received:', selectedOccupation);
        console.log('Skill category:', selectedItem);
        const occupation = selectedOccupation?.id || "";
        const pillar = selectedItem;
        
        //Reset states for a new search
        setSearch(true);
        setLoading(true);
        setData([]);
        setInfoMessage("");
        setIsTakingLong(false);

        // Start a 30-second timer
        if (timerRef.current)
            clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setIsTakingLong(true);
        }, 30000);

         // Determine URL based on datasource
        let url = "";
        const baseUrl = process.env.REACT_APP_API_URL_SKILL_DEMAND_MATRIX + "/HierarchicalCumulativeVoting";
        
        if (datasource === "jobs") {
            url = `${baseUrl}/jobs?pillar=${pillar}&occupation_ids=${occupation}&source=OJA`;
        } else if (datasource === "EU profiles") {
            url = `${baseUrl}/profiles?pillar=${pillar}&occupation_ids=${occupation}`;
        } else if (datasource === "Short Courses") {
            url = `${baseUrl}/courses?pillar=${pillar}&occupation_ids=${occupation}`;
        } else if (datasource === "EU Policies") {
            url = `${baseUrl}/policies?pillar=${pillar}`;
        }

        // Execute Request
        axios.get(url)
        .then((res) => {
            if (timerRef.current)
                clearTimeout(timerRef.current);
            setLoading(false);

            // Check for "in_progress" status
            if (res.data && res.data.status === "in_progress") {
                setInfoMessage(res.data.message);
                return;
            }

            // Process Data (Grouping Logic)
            const groupedData = res.data.reduce((acc, item) => {
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

            setData(groupedData);
        })
        .catch((err) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setLoading(false);
            setInfoMessage("An error occurred while fetching data.");
            console.error("Error fetching data:", err);
        });
    };
    
    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">Select occupation</CardTitle>
                        <OccupationSelectionAndPillar onApplySelection={handleApplyOccupationSelection} datasource={datasource}/>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <div className="lds-dual-ring"></div>
                                {/* 30 Second Message */}
                                {isTakingLong && (
                                <p style={{ marginTop: "10px", color: "#666", fontWeight: "bold" }}>
                                    The analysis might take some time...
                                </p>
                                )}
                            </div>
                        ) : !search ? (
                            <></>
                        ) : infoMessage ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <h6 className="text-info">{infoMessage}</h6>
                            </div>
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
