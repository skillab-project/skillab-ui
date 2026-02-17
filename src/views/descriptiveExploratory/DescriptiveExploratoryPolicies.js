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
import ExploratoryAnalytics from "./ExploratoryAnalytics";
import DescriptiveAnalytics from "./DescriptiveAnalytics";
import TopTypeFrequency from "./TopTypeFrequency";
import TrendAnalysis from "./TrendAnalysis";


const DescriptiveExploratoryPolicies = ({filters}) => {
    const [dataAreReady, setDataAreReady] = useState(false);
    const [dataOccupations, setDataOccupations] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [typeFrequencyData, setTypeFrequencyData] = useState([]);
    const [dataTrending, setDataTrending] = useState([]);
    const [analysisIsRunning, setAnalysisIsRunning] = useState(false);
    const [errorWithAnalysis, setErrorWithAnalysis] = useState(false);
    
    // derive constants from props
    const filterSources = useMemo(() => filters?.dataSource?.[0] || "", [filters]);
    const filterLimitData = useMemo(() => filters.dataLimit || "", [filters]);

    
    // Check if there is same analysis or
    //  start new
    const checkLoadedDataOfUser = async () => {
        setDataAreReady(true);
        fetchDataSkills();
    }

    // Get Data for Descriptive component
    const fetchDataSkills = async () => {
        try {
            const response = await axios.get(process.env.REACT_APP_API_URL_TRACKER + "/api/descriptive-analytics/law-policies?"
                + "limit=" + 1000 ,
                {
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`
                }
            });

            // Check if there is error with loading data
            if(response.status!=200){
                setErrorWithAnalysis(true);
                return;
            }

            // set data
            setDataOccupations(response.data);

            // fetch data one by one
            fetchLocationData();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Get Data for Location component
    const fetchLocationData = async () => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_TRACKER + "/api/descriptive-analytics/law-policies/types?"
                + "limit=" + 500 ,
                {
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`
                }
            });

            // Check if there is error with loading data
            if(response.status!=200){
                setErrorWithAnalysis(true);
                return;
            }
        
            // Process the data from the initial response
            const transformedOrgData = response.data.map(item => ({
                type: item.Var1,
                frequency: item.Freq
            }));
            setTypeFrequencyData(transformedOrgData);

            // Fetch exploratory data
            fetchDataExploratory();
        }
        catch (error) {
            console.error('Error fetching location data:', error);
        }
    }

    // Get Data for Exploratory component 
    const fetchDataExploratory = async () => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_TRACKER + "/api/exploratory-analytics/law-policies/skills-by-type?"
                + "limit=" + 1000 ,
                {
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`
                }
            });

            // Check if there is error with loading data
            if(response.status!=200){
                setErrorWithAnalysis(true);
                return;
            }

            // Process the data from the response
            processAnalyticsData(response.data);
        }
        catch (error) {
            console.error('Error fetching type data:', error);
        }
    };

    // Helper function to process the exploratory analytics data
    const processAnalyticsData = (analyticsData) => {
        if (!analyticsData || !Array.isArray(analyticsData)) return;

        const typeGroup = {};
        analyticsData.forEach(({ type, label, Freq }) => {
            // Initialize the type entry if not already present
            if (!typeGroup[type]) {
                typeGroup[type] = { country: type };
            }

            // Aggregate frequencies for the skill label
            // This sums frequencies if the same skill label appears multiple times for one type
            typeGroup[type][label] = (typeGroup[type][label] || 0) + Freq;
        });

        // 2. Convert Object to Array and Sort
        const transformedData = Object.values(typeGroup).sort((a, b) => {
            // Calculate totals for each type to sort by "most popular" overall
            const totalA = Object.values(a).reduce((sum, val) => 
                typeof val === 'number' ? sum + val : sum, 0
            );
            const totalB = Object.values(b).reduce((sum, val) => 
                typeof val === 'number' ? sum + val : sum, 0
            );
            return totalB - totalA;
        });

        setDataExploratory(transformedData);
        
        fetchDataTrending();
    };

    // Get Data for Trend component 
    const fetchDataTrending = async () => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_TRACKER + "/api/trend-analytics/law-policies/skills-by-type?limit=1000",
                {
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`
                }
            });

            // Check if there is error with loading data
            if(response.status!=200){
                setErrorWithAnalysis(true);
                return;
            }

            const rawData = response.data;
            const grouped = rawData.reduce((acc, item) => {
                if (!acc[item.type]) {
                    acc[item.type] = { country: item.type };
                }
                acc[item.type][item.Date] = item.Freq;
                return acc;
            }, {});
            const transformedData = Object.values(grouped);
            setDataTrending(transformedData);
        }
        catch (error) {
            console.error('Error fetching trending data:', error);
        }
    };


    useEffect(() => {
        const load = async () => {
            // Reset state before fetching new data
            setDataAreReady(false);
            setAnalysisIsRunning(false);
            setErrorWithAnalysis(false);
            setDataOccupations([]);
            setDataExploratory([]);
            setTypeFrequencyData([]);
            
            console.log("Filters changed, re-running analysis with:", filters);
            checkLoadedDataOfUser();
        };

        load();
    }, [filters]);


    
    return (
        <>
            {(errorWithAnalysis || analysisIsRunning) && (
                <Row>
                    <Col md="12">
                    <Card>
                        <CardBody>
                        {errorWithAnalysis
                            ? "Error with analysis, try different filters"
                            : "Come back soon, the analysis might take a while"}
                        </CardBody>
                    </Card>
                    </Col>
                </Row>
            )}
            
            {!dataAreReady ? 
                <div className="lds-dual-ring"></div>
                :
                (<>
                    <Row>
                        <Col md="12">
                            {(dataOccupations && dataOccupations.length>0) &&
                                <DescriptiveAnalytics data={dataOccupations}/>
                            }
                        </Col>
                    </Row>

                    <Row>
                        <Col md="12">
                            {(typeFrequencyData && typeFrequencyData.length>0) &&
                                <TopTypeFrequency data={typeFrequencyData}/>
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

                    <Row>
                        <Col md="12">
                            {dataTrending && dataTrending.length>0 &&
                                <TrendAnalysis data={dataTrending} />
                            }
                        </Col>
                    </Row> 

                    {!errorWithAnalysis &&
                            (dataOccupations.length==0 || typeFrequencyData.length==0 || dataExploratory.length==0 ) &&
                        <div class="lds-dual-ring"></div>
                    }
                </>)
            }
        </>
    );
}

export default DescriptiveExploratoryPolicies;