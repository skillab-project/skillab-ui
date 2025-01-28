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


const LabourMarketDemandSkill = ({showFilter}) => {
    const [dataAreReady, setDataAreReady] = useState(false);

    const [dataSkills, setDataSkills] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [countryFrequencyData, setCountryFrequencyData] = useState([]);

    
    // Check if the user has loaded data
    //  and if not load them
    const checkLoadedDataOfUser = async () => {
        // axios
        //     .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/load_data?user_id=1&session_id=1&url=http%3A%2F%2Fskillab-tracker.csd.auth.gr%2Fapi%2Fjobs&body=occupation_ids=http://data.europa.eu/esco/occupation/3d190639-90f8-4402-b1b3-a104a17e0d67")
        //     .then((res2) => {
        //         console.log("response: "+res2.data);
        //         setDataAreReady(true);
                
        //         // After that fetch data one by one
        //         fetchDataSkills();
        //     });
            
        // After that fetch data one by one
        setDataAreReady(true);
        fetchDataSkills();
    }

    // Get Data for Descriptive component
    const fetchDataSkills = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/analytics_descriptive?user_id=2&session_id=1&features_query=skills")
            .then((res) => {
                console.log("repos: "+res.data);
                setDataSkills(res.data.skills);

                // fetch data one by one
                fetchLocationData();
            });
    };

    // Get Data for Location component
    const fetchLocationData = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/analytics_descriptive?user_id=2&session_id=1&features_query=location")
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
            .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/analytics_exploratory?user_id=2&session_id=1&features_query=skills%2Clocation")
            .then(async (res) => {
                console.log("repos: "+res.data);
                const analyticsData = res.data;

                // Step 2: Extract unique skill IDs (Var1)
                var skillIds = [...new Set(analyticsData.map((item) => item.Var1))];

                // Helper function to split an array into chunks of a specified size
                const chunkArray = (array, size) => {
                    const result = [];
                    for (let i = 0; i < array.length; i += size) {
                    result.push(array.slice(i, i + size));
                    }
                    return result;
                };

                // Split skillIds into chunks of 1000
                const chunks = chunkArray(skillIds, 300);

                // Step 3: Fetch labels for all skill IDs in chunks
                const allLabels = {};
                for (const chunk of chunks) {
                    const params = new URLSearchParams();
                    chunk.forEach((id) => params.append("ids", id));

                    const labelResponse = await axios.post(
                    "http://skillab-tracker.csd.auth.gr/api/skills?page=1",
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
                    const skillLabel = allLabels[Var1];
                    if (skillLabel) {
                    const country = Var2.split(", ")[1]; // Extract the country from Var2
                    const existingCountry = updatedData.find((item) => item.country === country);

                    if (existingCountry) {
                        // Add or update the skill count
                        existingCountry[skillLabel] = (existingCountry[skillLabel] || 0) + Freq;
                    } else {
                        // Add a new country with the occupation count
                        updatedData.push({
                        country,
                        [skillLabel]: Freq,
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
                        {(dataSkills && dataSkills.length>0) &&
                            <DescriptiveAnalyticsOccupations data={dataSkills} dataCountries={countryFrequencyData}/>
                        }
                    </Col>
                </Row>
                
                <Row>
                    <Col md="12">
                        {(dataExploratory && dataExploratory.length>0) &&
                            <ExploratoryAnalytics data={dataExploratory} />
                        }
                    </Col>
                </Row>
                
                {((dataSkills && dataSkills.length==0) || (dataExploratory && dataExploratory.length==0)) &&
                    <div class="lds-dual-ring"></div>
                }

                
                <Row>
                    <Col md="12">
                        <TrendAnalysis />
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        <InterconnectedSkills/>
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

export default LabourMarketDemandSkill;