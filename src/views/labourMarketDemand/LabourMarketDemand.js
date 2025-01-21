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
import classnames from 'classnames';
import axios from 'axios';
import InterconnectedSkills from "./InterconnectedSkills";
import ExploratoryAnalytics from "./ExploratoryAnalytics";
import TrendAnalysis from "./TrendAnalysis";
import DescriptiveAnalyticsOccupations from "./DescriptiveAnalyticsOccupations";
import DescriptiveAnalyticsSkills from "./DescriptiveAnalyticsSkills";
import SkillFilter from "./SkillFilter";
import OccupationFilter from "./OccupationFilter";
import "../../assets/css/loader.css";



function LabourMarketDemand() {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    const [showOccupationFilters, setShowOccupationFilters] = useState(false);
    const [showSkillFilters, setShowSkillFilters] = useState(false);
    const [dataAreReady, setDataAreReady] = useState(false);

    //states for 3 main components of occupations tab
    const [dataOccupations, setDataOccupations] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [countryFrequencyData, setCountryFrequencyData] = useState([]);

    // Check if the user has loaded data
    //  and if not load them
    const checkLoadedDataOfUser = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/get_data?user_id=1&session_id=1&attribute=all_stats")
            .then((res) => {
                console.log("get_data: "+res.data);
                if (Array.isArray(res.data)) {
                    console.log("Data will be loaded...");
                    axios
                        .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/load_data?user_id=1&session_id=1&url=http%3A%2F%2Fskillab-tracker.csd.auth.gr%2Fapi%2Fjobs&body=skill_ids%3Dhttp%253A%252F%252Fdata.europa.eu%252Fesco%252Fskill%252Fccd0a1d9-afda-43d9-b901-96344886e14d")
                        .then((res2) => {
                            console.log("response: "+res2.data);
                            setDataAreReady(true);
                        });
                }
                else{
                    console.log("Data are allready loaded!");
                    setDataAreReady(true);
                }

                // After that fetch data one by one
                fetchDataOccupations();
            });
    }

    // Get Data for Descriptive component
    const fetchDataOccupations = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/analytics_descriptive?user_id=1&session_id=1&features_query=occupations")
            .then((res) => {
                console.log("repos: "+res.data);
                setDataOccupations(res.data.occupations);

                // fetch data one by one
                fetchLocationData();
            });
    };

    // Get Data for Location component
    const fetchLocationData = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/analytics_descriptive?user_id=1&session_id=1&features_query=location")
            .then((res) => {
                const locationData = res.data.location;

                if(locationData){
                    const aggregatedData = locationData.reduce((acc, { Var1, Freq }) => {
                        const country = Var1.split(", ")[1]; // Extract the country from Var1
                        if (acc[country]) {
                            acc[country] += Freq; // Add frequency if the country already exists
                        } else {
                            acc[country] = Freq; // Initialize frequency for the country
                        }
                        return acc;
                    }, {});
                
                    const transformedData = Object.entries(aggregatedData)
                        .map(([country, frequency]) => ({ country, frequency }))
                        .sort((a, b) => b.frequency - a.frequency); 

                    console.log(transformedData);

                    setCountryFrequencyData(transformedData);

                    // fetch data one by one
                    fetchDataExploratory();
                }
            });
    }

    // Get Data for Exploratory component 
    const fetchDataExploratory = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/analytics_exploratory?user_id=1&session_id=1&features_query=occupations%2Clocation")
            .then(async (res) => {
                console.log("repos: "+res.data);
                const analyticsData = res.data;

                // Step 2: Extract unique occupation IDs (Var1)
                var occupationIds = [...new Set(analyticsData.map((item) => item.Var1))];

                // Helper function to split an array into chunks of a specified size
                const chunkArray = (array, size) => {
                    const result = [];
                    for (let i = 0; i < array.length; i += size) {
                    result.push(array.slice(i, i + size));
                    }
                    return result;
                };

                // Split occupationIds into chunks of 1000
                const chunks = chunkArray(occupationIds, 1000);

                // Step 3: Fetch labels for all occupation IDs in chunks
                const allLabels = {};
                for (const chunk of chunks) {
                    const params = new URLSearchParams();
                    chunk.forEach((id) => params.append("ids", id));

                    const labelResponse = await axios.post(
                    "http://skillab-tracker.csd.auth.gr/api/occupations?page=1",
                    params,
                    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
                    );

                    // Merge the labels from the current chunk into the allLabels object
                    labelResponse.data.items.forEach((item) => {
                    allLabels[item.id] = item.label;
                    });
                }

                // Step 4: Transform the fetched data to match the existing state structure
                const updatedData = [...dataExploratory];

                analyticsData.forEach(({ Var1, Var2, Freq }) => {
                    const occupationLabel = allLabels[Var1];
                    if (occupationLabel) {
                    const country = Var2.split(", ")[1]; // Extract the country from Var2
                    const existingCountry = updatedData.find((item) => item.country === country);

                    if (existingCountry) {
                        // Add or update the occupation count
                        existingCountry[occupationLabel] = (existingCountry[occupationLabel] || 0) + Freq;
                    } else {
                        // Add a new country with the occupation count
                        updatedData.push({
                        country,
                        [occupationLabel]: Freq,
                        });
                    }
                    }
                });

                // Step 5: Update the state with the transformed data
                setDataExploratory(updatedData);
            });
    };


    useEffect(() => {
        checkLoadedDataOfUser();
    }, []);
  
    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }

    const handleApplyOccupationFilters = (selectedFilters) => {
        console.log('Filters received:', selectedFilters);
    };

    const handleApplySkillFilters = (selectedFilters) => {
        console.log('Filters received:', selectedFilters);
    };

    const handelClickShowFilter = () => {
        if(currentActiveTab ==='1' && showOccupationFilters == false){
            setShowOccupationFilters(true);
        }
        else if(currentActiveTab ==='1' && showOccupationFilters == true){
            setShowOccupationFilters(false);
        }
        else if(currentActiveTab ==='2' && showSkillFilters == false){
            setShowSkillFilters(true);
        }
        else if(currentActiveTab ==='2' && showSkillFilters == true){
            setShowSkillFilters(false);
        }
    };
    

    return (
    <>
      <div className="content">
        <Nav tabs style={{marginBottom:"5px"}}>
            <NavItem style={{cursor:"pointer"}}>
                <NavLink
                    className={classnames({
                        active:
                            currentActiveTab === '1'
                    })}
                    onClick={() => { toggle('1'); }}
                >
                    Occupation
                </NavLink>
            </NavItem>
            <NavItem style={{cursor:"pointer"}}>
                <NavLink
                    className={classnames({
                        active:
                            currentActiveTab === '2'
                    })}
                    onClick={() => { toggle('2'); }}
                >
                    Skill
                </NavLink>
            </NavItem>
            <span style={{margin:"auto", marginRight:"5px", cursor:"pointer"}} onClick={()=>handelClickShowFilter()}>
                <i className="fa fa-filter"></i>
            </span>
        </Nav>

        <TabContent activeTab={currentActiveTab}>

            {/**
             * Tab: Occupation
             */}
            <TabPane tabId="1">
                {showOccupationFilters && <Row>
                    <Col md="12">
                        <SkillFilter onApplyFilters={handleApplyOccupationFilters}/>
                    </Col>
                </Row>
                }

                {dataAreReady ? <>
                    <Row>
                        <Col md="12">
                            {(dataOccupations.length>0 && setCountryFrequencyData.length>0) &&
                                <DescriptiveAnalyticsOccupations data={dataOccupations} dataCountries={countryFrequencyData}/>
                            }
                        </Col>
                    </Row>
                    
                    <Row>
                        <Col md="12">
                            {dataExploratory.length>0 &&
                                <ExploratoryAnalytics data={dataExploratory} />
                            }
                        </Col>
                    </Row>
                    
                    {(dataOccupations.length==0 || dataExploratory.length==0) &&
                        <div class="lds-dual-ring"></div>
                    }

                    
                    <Row>
                        <Col md="12">
                            <TrendAnalysis />
                        </Col>
                    </Row>

                </>
                :
                <>
                    <div class="lds-dual-ring"></div>
                </>}
            </TabPane>
            

            {/**
             * Tab: Skill
             */}
            <TabPane tabId="2">
                {showSkillFilters && <Row>
                    <Col md="12">
                        <OccupationFilter onApplyFilters={handleApplySkillFilters}/>
                    </Col>
                </Row>
                }

                <Row>
                    <Col md="12">
                        <DescriptiveAnalyticsSkills />
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">Exploratory Analytics</CardTitle>
                            </CardHeader>
                            <CardBody>
                                {/**
                                 * Same as occupations, but with skills??
                                 */}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">Trend Analysis</CardTitle>
                            </CardHeader>
                            <CardBody>
                                {/**
                                 * Same as occupations, but with skills??
                                 */}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        <InterconnectedSkills/>
                    </Col>
                </Row>
            </TabPane>
        </TabContent>
      </div>
    </>
    );
}

export default LabourMarketDemand;
