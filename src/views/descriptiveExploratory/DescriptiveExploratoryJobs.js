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
import TrendAnalysis from "./TrendAnalysis";
import DescriptiveAnalytics from "./DescriptiveAnalytics";
import TopCountries from "./TopCountries";

const isoToCountryName = {
    "FR": "France",
    "DE": "Germany",
    "UK": "United Kingdom",
    "PL": "Poland",
    "NL": "Netherlands",
    "SE": "Sweden",
    "IT": "Italy",
    "ES": "Spain",
    "BE": "Belgium",
    "CZ": "Czech Republic",
    "AT": "Austria",
    "SK": "Slovakia",
    "PT": "Portugal",
    "IE": "Ireland",
    "LT": "Lithuania",
    "RO": "Romania",
    "HU": "Hungary",
    "DK": "Denmark",
    "FI": "Finland",
    "LU": "Luxembourg",
    "BG": "Bulgaria",
    "EL": "Greece",
    "GR": "Greece", // GR just in case
    "CY": "Cyprus",
    "LV": "Latvia",
    "EE": "Estonia",
    "HR": "Croatia",
    "MT": "Malta",
    "SI": "Slovenia"
};

const DescriptiveExploratoryJobs = ({filters}) => {
    const [dataAreReady, setDataAreReady] = useState(false);
    const [dataOccupations, setDataOccupations] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [dataTrending, setDataTrending] = useState([]);
    const [countryFrequencyData, setCountryFrequencyData] = useState([]);
    const [analysisIsRunning, setAnalysisIsRunning] = useState(false);
    const [errorWithAnalysis, setErrorWithAnalysis] = useState(false);

    // derive constants from props
    const filterOccupation = useMemo(() => filters?.occupation || {id: "http://data.europa.eu/esco/isco/C2512", label: "Software developers"}, [filters]);
    const filterSources = useMemo(() => filters?.dataSource?.[0] || "", [filters]);
    const filterLimit = useMemo(() => filters?.dataLimit || "1000", [filters]);

    const pollingRef = useRef(null);
    // Helper to clear polling
    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };
    // Cleanup on unmount
    useEffect(() => {
        return () => stopPolling();
    }, []);


    // Check if there is same analysis or
    //  start new
    const checkLoadedDataOfUser = async () => {
        if (!filterOccupation.id) {
            setErrorWithAnalysis(true);
            return;
        }
        setDataAreReady(true);
        stopPolling();

        try {
            let url = process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/analysis/check?sessionId=jobs&filterOccupation="+filterOccupation.id+"&filterSource="+filterSources+"&limitData="+filterLimit;
            const response = await axios.get(url,
                {
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}`
                }
            });
            if (response.status === 200) {
                if (response.data.finished) {
                    // Scenario 1: Already done
                    console.log("Analysis finished, loading data...");
                    setAnalysisIsRunning(false);
                    loadAllAnalysisData(response.data.id);
                } else {
                    // Scenario 2: Exists but still running
                    console.log("Analysis is currently running, starting poll...");
                    setAnalysisIsRunning(true);
                    startPolling(response.data.id);
                }
            }
        }
        catch (error) {
            console.error('Error fetching data:', error);
            if (error.response && error.response.status === 404) {
                // Scenario 3: Doesn't exist, start new
                handleStartNewAnalysis();
            } else {
                console.error('Error checking analysis:', error);
                setErrorWithAnalysis(true);
            }
        }
    }

    const startPolling = (analysisId) => {
        stopPolling(); // Safety check

        pollingRef.current = setInterval(async () => {
            try {
                console.log("Polling analysis status for ID:", analysisId);
                let url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/analysis/${analysisId}/check`;
                
                const response = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
                });

                if (response.data.finished) {
                    console.log("Analysis complete!");
                    stopPolling();
                    setAnalysisIsRunning(false);
                    loadAllAnalysisData(analysisId);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 60000); // 1 minute
    };

    const handleStartNewAnalysis = async () => {
        try {
            setAnalysisIsRunning(true);
            const url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/analysis/new`;
            const response = await axios.post(url, null, {
                params: {
                    sessionId: "jobs",
                    filterOccupation: filterOccupation.id,
                    filterSource: filterSources,
                    limitData: filterLimit
                },
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}` 
                }
            });
            
            if (response.data && response.data.id) {
                startPolling(response.data.id);
            }
        } catch (err) {
            console.error("Failed to start new analysis", err);
            setErrorWithAnalysis(true);
        }
    };

    // Helper to trigger all data fetches once finished
    const loadAllAnalysisData = (id) => {
        fetchDataSkills(id);
        fetchDataExploratory(id);
        fetchDataTrending(id);
        fetchLocationData(id);
    };



    

    // Get Data for Descriptive component
    const fetchDataSkills = async (analysisId) => {
        try {
            let url = process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/analysis/"+analysisId+"/descriptive";
            const response = await axios.get(url,
                {
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}`
                }
            });

            if(response.status==200){
                setDataOccupations(response.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Get Data for Location component
    const fetchLocationData = async (analysisId) => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/analysis/"+analysisId+"/descriptivelocation",
                {
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}`
                }
            });

            // Check if there is error with loading data
            if(response.status==200){
                processLocationData(response.data);
            }
        }
        catch (error) {
            console.error('Error fetching location data:', error);
        }
    }

    // Helper function to process and transform location data
    const processLocationData = (locationData) => {
        if (locationData) {
            const aggregatedData = locationData.reduce((acc, { Var1, Freq }) => {
                const countryName = isoToCountryName[Var1] || Var1; 
                
                if (acc[countryName]) {
                    acc[countryName] += Freq;
                } else {
                    acc[countryName] = Freq;
                }
                return acc;
            }, {});

            const transformedData = Object.entries(aggregatedData)
                .map(([country, frequency]) => ({ country, frequency }))
                .sort((a, b) => b.frequency - a.frequency);

                console.log("Transformed location data:", transformedData);
            setCountryFrequencyData(transformedData);
        }
    };

    // Get Data for Exploratory component 
    const fetchDataExploratory = async (analysisId) => {
        try{
            let url = process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/analysis/"+analysisId+"/exploratory";
            const response = await axios.get(url,
                {
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}`
                }
            });

            if(response.status==200){
                processAnalyticsData(response.data);
            }
        }
        catch (error) {
            console.error('Error fetching location data:', error);
        }
    };

    // Helper function to process the exploratory analytics data
    const processAnalyticsData = (analyticsData) => {
        if (!analyticsData || !Array.isArray(analyticsData)) return;

        const countryGroups = {};
        analyticsData.forEach(({ location_code, label, Freq }) => { // Changed 'location' to 'location_code'
            const country = isoToCountryName[location_code] || location_code;

            if (!country) return;
            if (!countryGroups[country]) {
                countryGroups[country] = { country: country };
            }

            const frequency = Number(Freq) || 0;
            countryGroups[country][label] = (countryGroups[country][label] || 0) + frequency;
        });

        const transformedData = Object.values(countryGroups).sort((a, b) => {
            const totalA = Object.values(a).reduce((sum, val) => 
                typeof val === 'number' ? sum + val : sum, 0
            );
            const totalB = Object.values(b).reduce((sum, val) => 
                typeof val === 'number' ? sum + val : sum, 0
            );
            return totalB - totalA;
        });

        setDataExploratory(transformedData);
    };

    // Get Data for Trending component 
    const fetchDataTrending = async (analysisId) => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_USER_MANAGEMENT+"/analysis/"+analysisId+"/trend",
                {
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}`
                }
            });

            /// Check if there is error with loading data
            if(response.status!=200){
                setErrorWithAnalysis(true);
                return;
            }
            
            // Process the data from the response
            const rawData = response.data;
            const grouped = rawData.reduce((acc, item) => {
                const countryName = isoToCountryName[item.location_code] || item.location_code;
                if (!acc[countryName]) {
                    acc[countryName] = { country: countryName };
                }
                acc[countryName][item.Date] = (acc[countryName][item.Date] || 0) + item.Freq;
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
            stopPolling();
            setDataAreReady(false);
            setAnalysisIsRunning(false);
            setErrorWithAnalysis(false);
            setDataOccupations([]);
            setDataExploratory([]);
            setDataTrending([]);
            setCountryFrequencyData([]);
            
            console.log("Filters changed, re-running analysis with:", filters);
            checkLoadedDataOfUser();
        };

        load();
        return () => stopPolling();
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
                            {(countryFrequencyData && countryFrequencyData.length>0) &&
                                <TopCountries data={countryFrequencyData}/>
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
                            (dataOccupations.length==0 || dataExploratory.length==0 || dataTrending.length==0 ) &&
                        <div class="lds-dual-ring"></div>
                    }
                </>)
            }
        </>
    );
}

export default DescriptiveExploratoryJobs;