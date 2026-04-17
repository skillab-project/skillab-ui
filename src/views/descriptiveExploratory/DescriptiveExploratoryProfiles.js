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
import TopCountries from "./TopCountries";


const countryLookup = {
    // ISO Codes
    "FR": "France", "DE": "Germany", "UK": "United Kingdom", "GB": "United Kingdom",
    "PL": "Poland", "NL": "Netherlands", "SE": "Sweden", "IT": "Italy",
    "ES": "Spain", "BE": "Belgium", "CZ": "Czech Republic", "AT": "Austria",
    "SK": "Slovakia", "PT": "Portugal", "IE": "Ireland", "LT": "Lithuania",
    "RO": "Romania", "HU": "Hungary", "DK": "Denmark", "FI": "Finland",
    "LU": "Luxembourg", "BG": "Bulgaria", "EL": "Greece", "GR": "Greece",
    "CY": "Cyprus", "LV": "Latvia", "EE": "Estonia", "HR": "Croatia",
    "MT": "Malta", "SI": "Slovenia",

    // Local Names & Variants
    "FRANCE": "France",
    "SWEDEN": "Sweden", "SVERIGE": "Sweden",
    "ČESKO": "Czech Republic", "CZECHIA": "Czech Republic",
    "ITALIA": "Italy", "ITALY": "Italy",
    "POLSKA": "Poland",
    "GREECE": "Greece", "ΕΛΛΆΔΑ": "Greece",
    "ÖSTERREICH": "Austria", "AUSTRIA": "Austria",
    "ESPAÑA": "Spain", "SPAIN": "Spain",
    "UNITED KINGDOM": "United Kingdom", "NORTHERN IRELAND": "Ireland",
    "SUOMI/FINLAND": "Finland", "FINLAND": "Finland",
    "MAGYARORSZÁG": "Hungary", "HUNGARY": "Hungary",
    "NEDERLAND": "Netherlands", "THE NETHERLANDS": "Netherlands",
    "DANMARK": "Denmark", "DENMARK": "Denmark",
    "LATVIJA": "Latvia", "REPUBLIC OF LATVIA": "Latvia",
    "ΚΎΠΡΟΣ": "Cyprus",
    "BELGIQUE/BELGIË": "Belgium", "BELGIUM": "Belgium",
    "SLOVENSKO": "Slovakia",
    "GERMANY": "Germany", "DEUTSCHLAND": "Germany",
    "ÉIRE/IRELAND": "Ireland"
};
const getStandardCountryName = (locationStr) => {
    if (!locationStr || locationStr === "not_found_location") return null;

    // 1. Split by comma to handle "Amsterdam, Netherlands"
    let parts = locationStr.split(',');
    let rawCountry = parts[parts.length - 1];

    // 2. THE FIX: Remove double spaces, tabs, or newlines and trim
    // This turns "The  Netherlands " into "THE NETHERLANDS"
    let cleaned = rawCountry.replace(/\s+/g, ' ').trim().toUpperCase();

    // 3. Optional: Specific fix for common "The Netherlands" prefixes
    if (cleaned === "NETHERLANDS") return "Netherlands";
    
    // 4. Standard Lookup
    return countryLookup[cleaned] || null;
};


const DescriptiveExploratoryProfiles = ({filters}) => {
    const [dataAreReady, setDataAreReady] = useState(false);
    const [dataOccupations, setDataOccupations] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [countryFrequencyData, setCountryFrequencyData] = useState([]);
    const [analysisIsRunning, setAnalysisIsRunning] = useState(false);
    const [errorWithAnalysis, setErrorWithAnalysis] = useState(false);
    
    // derive constants from props
    const filterSources = useMemo(() => filters?.dataSource?.[0] || "", [filters]);
    const filterLimit = useMemo(() => filters?.dataLimit || "1000", [filters]);

    const pollingRef = useRef(null);

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    useEffect(() => {
        return () => stopPolling();
    }, []);

    const checkLoadedDataOfUser = async () => {
        setDataAreReady(true);
        stopPolling();

        try {
            const url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/analysis/check?sessionId=profiles&filterSource=${filterSources}&limitData=${filterLimit}`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
            });

            if (response.status === 200) {
                if (response.data.finished) {
                    setAnalysisIsRunning(false);
                    loadAllAnalysisData(response.data.id);
                } else {
                    setAnalysisIsRunning(true);
                    startPolling(response.data.id);
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                handleStartNewAnalysis();
            } else {
                console.error('Error checking analysis:', error);
                setErrorWithAnalysis(true);
            }
        }
    };

    const startPolling = (analysisId) => {
        stopPolling();
        pollingRef.current = setInterval(async () => {
            try {
                const url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/analysis/${analysisId}/check`;
                const response = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
                });
                if (response.data.finished) {
                    stopPolling();
                    setAnalysisIsRunning(false);
                    loadAllAnalysisData(analysisId);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 60000);
    };

    const handleStartNewAnalysis = async () => {
        try {
            setAnalysisIsRunning(true);
            const url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/analysis/new`;
            const response = await axios.post(url, null, {
                params: {
                    sessionId: "profiles",
                    filterSource: filterSources,
                    limitData: filterLimit
                },
                headers: { 'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
            });
            if (response.data?.id) {
                startPolling(response.data.id);
            }
        } catch (err) {
            console.error("Failed to start new analysis", err);
            setErrorWithAnalysis(true);
        }
    };

    const loadAllAnalysisData = (id) => {
        fetchDataSkills(id);
        fetchLocationData(id);
        fetchDataExploratory(id);
    };

    const fetchDataSkills = async (analysisId) => {
        try {
            const url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/analysis/${analysisId}/descriptive`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
            });
            if (response.status === 200) {
                setDataOccupations(response.data);
            }
        } catch (error) {
            console.error('Error fetching descriptive data:', error);
        }
    };

    const fetchLocationData = async (analysisId) => {
        try {
            const url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/analysis/${analysisId}/descriptivelocation`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
            });
            if (response.status === 200) {
                processLocationData(response.data);
            }
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    };

    // Helper function to process and transform location data
    const processLocationData = (locationData) => {
        if (!locationData) return;
        const aggregatedData = locationData.reduce((acc, { Var1, Freq }) => {
            const countryName = getStandardCountryName(Var1);
            acc[countryName] = (acc[countryName] || 0) + Freq;
            return acc;
        }, {});
        const transformedData = Object.entries(aggregatedData)
            .map(([country, frequency]) => ({ country, frequency }))
            .sort((a, b) => b.frequency - a.frequency);
        setCountryFrequencyData(transformedData);
    };

    const fetchDataExploratory = async (analysisId) => {
        try {
            const url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/analysis/${analysisId}/exploratory`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
            });
            if (response.status === 200) {
                processAnalyticsData(response.data);
            }
        } catch (error) {
            console.error('Error fetching exploratory data:', error);
        }
    };

    // Helper function to process the exploratory analytics data
    const processAnalyticsData = (analyticsData) => {
        if (!analyticsData || !Array.isArray(analyticsData)) return;

        const countryGroups = {};
        analyticsData.forEach(({ location, label, Freq }) => {
            // Use the helper to standardize names
            const country = getStandardCountryName(location);
            // If the country isn't in our mapping list, skip it
            if (!country) return;

            // Initialize the country entry if not already present
            if (!countryGroups[country]) {
                countryGroups[country] = { country: country };
            }

            // Aggregate frequencies for the skill label
            // This sums frequencies if the same skill label appears multiple times for one country
            countryGroups[country][label] = (countryGroups[country][label] || 0) + Freq;
        });

        // Convert Object to Array and Sort
        const transformedData = Object.values(countryGroups).sort((a, b) => {
            const totalA = Object.values(a).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);
            const totalB = Object.values(b).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);
            return totalB - totalA;
        });

        setDataExploratory(transformedData);
    };

    useEffect(() => {
        const load = async () => {
            stopPolling();
            setDataAreReady(false);
            setAnalysisIsRunning(false);
            setErrorWithAnalysis(false);
            setDataOccupations([]);
            setDataExploratory([]);
            setCountryFrequencyData([]);
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

            {!dataAreReady
                ? <div className="lds-dual-ring"></div>
                : (<>
                    <Row>
                        <Col md="12">
                            {dataOccupations?.length > 0 && <DescriptiveAnalytics data={dataOccupations} />}
                        </Col>
                    </Row>
                    <Row>
                        <Col md="12">
                            {countryFrequencyData?.length > 0 && <TopCountries data={countryFrequencyData} />}
                        </Col>
                    </Row>
                    <Row>
                        <Col md="12">
                            {dataExploratory?.length > 0 && <ExploratoryAnalytics data={dataExploratory} />}
                        </Col>
                    </Row>
                    {!errorWithAnalysis && (dataOccupations.length === 0 || dataExploratory.length === 0) &&
                        <div className="lds-dual-ring"></div>
                    }
                </>)
            }
        </>
    );
};

export default DescriptiveExploratoryProfiles;
