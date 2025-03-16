import React, { useState, useMemo, useRef, useEffect } from "react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,Legend,LineChart,Line} from "recharts";
import classnames from 'classnames';
import axios from 'axios';
import InterconnectedSkills from "./InterconnectedSkills";
import ExploratoryAnalytics from "./ExploratoryAnalytics";
import TrendAnalysis from "./TrendAnalysis";
import DescriptiveAnalytics from "./DescriptiveAnalytics";
import SkillFilter from "./SkillFilter";
import OccupationFilter from "./OccupationFilter";


const GeneralJobStatistics = () => {
    const [occupationFirstLevel, setOccupationFirstLevel] = useState([
        {name:"Armed forces occupations", id:"http://data.europa.eu/esco/isco/C0"},
        {name:"Managers", id:"http://data.europa.eu/esco/isco/C1"},
        {name:"Professionals", id:"http://data.europa.eu/esco/isco/C2"},
        {name:"Technicians and associate professionals", id:"http://data.europa.eu/esco/isco/C3"},
        {name:"Clerical support workers", id:"http://data.europa.eu/esco/isco/C4"},
        {name:"Service and sales workers", id:"http://data.europa.eu/esco/isco/C5"},
        {name:"Skilled agricultural, forestry and fishery workers", id:"http://data.europa.eu/esco/isco/C6"},
        {name:"Craft and related trades workers", id:"http://data.europa.eu/esco/isco/C7"},
        {name:"Plant and machine operators and assemblers", id:"http://data.europa.eu/esco/isco/C8"},
        {name:"Elementary occupations", id:"http://data.europa.eu/esco/isco/C9"}]);
    const [occupationLevel, setOccupationLevel] = useState([]);
    const [dataGraph, setDataGraph] = useState([]);
    const [selectedOccupation, setSelectedOccupation] = useState();

    
    const fetchOccupationsAndJobs = async (occupations) => {
        try {
            let updatedDataGraph = [];
    
            for (const occupation of occupations) {
                let allOccupationIds = [];
    
                const response = await axios.post(
                    process.env.REACT_APP_API_URL_TRACKER + '/api/utility/occupations-propagation',
                    new URLSearchParams({ 'ids': occupation.id })
                );
    
                if (response.data && Array.isArray(response.data)) {
                    allOccupationIds.push(...response.data);
                }
    
                if (allOccupationIds.length === 0) continue; // Skip if no occupation IDs found
    
                const searchParams = new URLSearchParams();
                allOccupationIds.forEach(id => searchParams.append('occupation_ids', id));
                searchParams.append('sources', 'OJA');
    
                const jobResponse = await axios.post(
                    process.env.REACT_APP_API_URL_TRACKER + '/api/jobs?page=1',
                    searchParams
                );
    
                const count = jobResponse.data.count || 0;
    
                // Add to updatedDataGraph
                updatedDataGraph.push({ name: occupation.name, count });
            }
    
            // Update state
            setDataGraph(updatedDataGraph);
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }


    useEffect(() => {
        setOccupationLevel(occupationFirstLevel);
        fetchOccupationsAndJobs(occupationFirstLevel);
    }, []);

    const handleSelectOccupation = async (occupation) => {
        try {
            setSelectedOccupation(occupation);
            
            const response = await axios.post(
                process.env.REACT_APP_API_URL_TRACKER + '/api/occupations',
                new URLSearchParams({ 'ids': occupation.id })
            );
    
            const occupationIds = response.data.items[0].children; // List of child occupation IDs
            console.log(occupationIds);
    
            // Fetch names for the child occupation IDs
            const occupationDetailsResponse = await axios.post(
                process.env.REACT_APP_API_URL_TRACKER + '/api/occupations?page=1',
                new URLSearchParams(
                    occupationIds.map(id => ['ids', id]) // Convert array to URLSearchParams format
                )
            );
    
            // Extract IDs and Names
            const occupationList = occupationDetailsResponse.data.items.map(item => ({
                id: item.id,
                name: item.label
            }));
    
            // Call the function with the complete list
            fetchOccupationsAndJobs(occupationList);
    
        } catch (error) {
            console.error("Error selecting occupation:", error);
        }
    }

    
    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardBody>
                        <Row>
                            <Col md="4">
                                <ul style={{paddingLeft:"0px", maxHeight: "700px", overflowY: "auto" }}>
                                    {occupationLevel.map((occupation) => (
                                        <li
                                            key={occupation.name}
                                            style={{display:"flex", justifyContent:"space-between", alignItems:"center" }}
                                            className={`p-3 border border-gray-200 rounded-lg shadow-sm ${
                                                occupation.name === selectedOccupation?.name ? 'bg-default' : 'bg-white'
                                            }`}
                                        >
                                            <span style={{textAlign:"left"}}>
                                                {occupation.name}
                                            </span>
                                            <button
                                                onClick={() => handleSelectOccupation(occupation)}
                                                aria-label={`More`}
                                            >
                                                <i className="fas fa-eye text-lg"></i>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </Col>
                            <Col md="8">
                                <ResponsiveContainer width="100%" height={dataGraph.length * 60}>
                                    <BarChart
                                        data={dataGraph}
                                        layout="vertical"
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        barSize={30}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={200} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#f39423"/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default GeneralJobStatistics;