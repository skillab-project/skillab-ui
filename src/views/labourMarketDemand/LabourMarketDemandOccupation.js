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
import DescriptiveAnalytics from "./DescriptiveAnalytics";
import SkillFilter from "./SkillFilter";
import OccupationFilter from "./OccupationFilter";


const LabourMarketDemandOccupation = ({showFilter}) => {
    const [dataAreReady, setDataAreReady] = useState(false);

    const [dataOccupations, setDataOccupations] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [countryFrequencyData, setCountryFrequencyData] = useState([]);

    
    // Check if the user has loaded data
    //  and if not load them
    const checkLoadedDataOfUser = async () => {
        // axios
        //     .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/get_data?user_id=1&session_id=1&attribute=all_stats")
        //     .then((res) => {
        //         console.log("get_data: "+res.data);
        //         if (Array.isArray(res.data)) {
        //             console.log("Data will be loaded...");
        //             axios
        //                 .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/load_data?user_id=1&session_id=1&url=http%3A%2F%2Fskillab-tracker.csd.auth.gr%2Fapi%2Fjobs&body=skill_ids%3Dhttp%253A%252F%252Fdata.europa.eu%252Fesco%252Fskill%252Fccd0a1d9-afda-43d9-b901-96344886e14d")
        //                 .then((res2) => {
        //                     console.log("response: "+res2.data);
        //                     setDataAreReady(true);
        //                 });
        //         }
        //         else{
        //             console.log("Data are allready loaded!");
        //             setDataAreReady(true);
        //         }
        //
        //         // After that fetch data one by one
        //         fetchDataOccupations();
        //     });
        
        //Maybe getData not useful
        // axios
        //     .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/load_data?user_id=1&session_id=1&url=http://skillab-tracker.csd.auth.gr/api/jobs&body=skill_ids=http://data.europa.eu/esco/skill/ccd0a1d9-afda-43d9-b901-96344886e14d")
        //     .then((res2) => {
        //         console.log("response: "+res2.data);
        //         setDataAreReady(true);
                
        //         // After that fetch data one by one
        //         fetchDataOccupations();
        //     });
        setDataAreReady(true);
        fetchDataOccupations();
    }

    // Get Data for Descriptive component
    const fetchDataOccupations = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/analytics_descriptive?user_id=1&session_id=1&features_query=occupations")
            .then((res) => {
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
                        if (Var1 !== "not_found_location") { // Skip "not_found_location"
                            const country = Var1.split(", ")[1]; // Extract the country from Var1
                            if (acc[country]) {
                                acc[country] += Freq; // Add frequency if the country already exists
                            } else {
                                acc[country] = Freq; // Initialize frequency for the country
                            }
                        }
                        return acc;
                    }, {});
                
                    const transformedData = Object.entries(aggregatedData)
                        .map(([country, frequency]) => ({ country, frequency }))
                        .sort((a, b) => b.frequency - a.frequency); 

                        //country - not_found_location
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

                // Split occupationIds into chunks of 300
                const chunks = chunkArray(occupationIds, 300);

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


    const handleApplyFilters = (selectedFilters) => {
        console.log('Filters received:', selectedFilters);
    };

    
    return (
        <>
            {showFilter && <Row>
                <Col md="12">
                    <SkillFilter onApplyFilters={handleApplyFilters}/>
                </Col>
            </Row>
            }

            {dataAreReady ? <>
                <Row>
                    <Col md="12">
                        {(dataOccupations && dataOccupations.length>0) &&
                            <DescriptiveAnalytics data={dataOccupations} dataCountries={countryFrequencyData}/>
                        }
                    </Col>
                </Row>
                
                <Row>
                    <Col md="12">
                        {dataExploratory && dataExploratory.length>0 &&
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
        </>
    );
}

export default LabourMarketDemandOccupation;