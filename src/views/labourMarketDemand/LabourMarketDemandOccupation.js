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
import {getId} from "../../utils/Tokens";

const countryNameMap = {
    "France": "France",
    "Sweden": "Sweden",
    "Česko": "Czech Republic",
    "ITALIA": "Italy",
    "Polska": "Poland",
    "Greece": "Greece",
    "Sverige": "Sweden",
    "Österreich": "Austria",
    "ESPAÑA": "Spain",
    "UnitedKingdom": "United Kingdom",
    "Suomi/Finland": "Finland",
    "Magyarország": "Hungary",
    "Nederland": "Netherlands",
    "Danmark": "Denmark",
    "Latvija": "Latvia",
    "Κύπρος": "Cyprus",
    "Belgique/België": "Belgium",
    "Slovensko": "Slovakia",
    "Germany": "Germany"
};

const LabourMarketDemandOccupation = ({showFilter, onApplyFilters}) => {
    const [dataAreReady, setDataAreReady] = useState(false);
    const [dataOccupations, setDataOccupations] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [dataTrending, setDataTrending] = useState([]);
    const [countryFrequencyData, setCountryFrequencyData] = useState([]);
    const [filterOccupations, setFilterOccupations] = useState([{id: "http://data.europa.eu/esco/isco/C2512",
                                                                    label: "Software developers"}]);
    var userId="";
    
    // Check if the user has loaded data
    //  and if not load them
    const checkLoadedDataOfUser = async () => {
        await axios
                .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/get_data?user_id=" +userId+ "&session_id=occupation&attribute=data_query_info&storage_name=none")
                .then(async (res) => {
                    console.log("get_data: "+res.data);
                    if (Array.isArray(res.data)) {
                        console.log("Data will be loaded...");
                        await axios
                                .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/load_data?user_id=" +userId+ "&session_id=occupation&url="+process.env.REACT_APP_API_URL_TRACKER+"%2Fapi%2Fjobs&body=occupation_ids%3Dhttp%3A%2F%2Fdata.europa.eu%2Fesco%2Fisco%2FC2512&source=OJA&limit_data_no=5000")
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
        try {
            //  check first in getdata before make new analysis
            const response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/get_data?user_id=" +userId+ "&session_id=occupation&attribute=all_stats&storage_name=skills");

            // Check if response data is empty
            if (Object.keys(response.data).length === 0 && response.data.constructor === Object) {
                console.log('Response get_data for skills, is empty');
                const analyticsResponse = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND+"/analytics_descriptive?user_id=" +userId+ "&session_id=occupation&storage_name=skills&features_query=skills");
                
                // set data 
                setDataOccupations(analyticsResponse.data.skills);
            }
            else{
                // set data
                setDataOccupations(response.data.skills);
            }

            // fetch data one by one
            fetchLocationData();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Get Data for Location component
    const fetchLocationData = async () => {
        try{
            //  check first in getdata before make new analysis
            const response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/get_data?user_id=" +userId+ "&session_id=occupation&attribute=all_stats&storage_name=location");
            
            // Check if response data is empty
            if (Object.keys(response.data).length === 0 && response.data.constructor === Object) {
                console.log('Response get_data for location is empty, fetching analytics data...');
                
                // Fetch analytics data if the initial response is empty
                const analyticsResponse = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND+"/analytics_descriptive?user_id=" +userId+ "&session_id=occupation&storage_name=location&features_query=location");
        
                processLocationData(analyticsResponse.data.location);
            } else {
                // Process the data from the initial response
                processLocationData(response.data.location);
            }
        
            // Fetch exploratory data
            fetchDataExploratory();
        }
        catch (error) {
            console.error('Error fetching location data:', error);
        }
    }

    // Helper function to process and transform location data
    const processLocationData = (locationData) => {
        if (locationData) {
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
                .sort((a, b) => b.frequency - a.frequency); // Sort by frequency descending
        
            // Log the transformed data
            console.log(transformedData);
        
            // Set the transformed data to the state
            setCountryFrequencyData(transformedData);
        }
    };

    // Get Data for Exploratory component 
    const fetchDataExploratory = async () => {
        try{
            //  check first in getdata before make new analysis
            const response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND+"/get_data?user_id=" +userId+ "&session_id=occupation&attribute=explor_stats&storage_name=occupation");
            
            // Check if response data is empty
            if (Object.keys(response.data).length === 0 && response.data.constructor === Object) {
                console.log('Response get_data for exploratory is empty, fetching analytics data...');

                // Fetch analytics data if the initial response is empty
                const analyticsResponse = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/analytics_exploratory?user_id=" +userId+ "&session_id=occupation&storage_name=occupation&features_query=skills%2Clocation");
            
                // Process the fetched analytics data
                processAnalyticsData(analyticsResponse.data);
            }
            else{
                // Process the data from the initial response
                processAnalyticsData(response.data);
            }

            // Fetch trending data
            fetchDataTrending();
        }
        catch (error) {
            console.error('Error fetching location data:', error);
        }
    };

    // Helper function to process the exploratory analytics data
    const processAnalyticsData = async (analyticsData) => {
        // Step 2: Extract unique occupation IDs (Var1)
        const occupationIds = [...new Set(analyticsData.map((item) => item.Var1))];
    
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
        const allLabels = await fetchLabelsInChunks(chunks);
    
        // Step 4: Transform the fetched data to match the existing state structure
        const updatedData = transformAnalyticsData(analyticsData, allLabels);
    
        // Step 5: Update the state with the transformed data
        setDataExploratory(updatedData);
    };
    
    // Helper function to fetch labels in chunks
    const fetchLabelsInChunks = async (chunks) => {
        const allLabels = {};
        for (const chunk of chunks) {
            const params = new URLSearchParams();
            chunk.forEach((id) => params.append('ids', id));
        
            const labelResponse = await axios.post(
                process.env.REACT_APP_API_URL_TRACKER+'/api/skills?page=1',
                params,
                {
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`
                    }
                }
            );
        
            // Merge the labels from the current chunk into the allLabels object
            labelResponse.data.items.forEach((item) => {
                allLabels[item.id] = item.label;
            });
        }
        return allLabels;
    };
    
    // Helper function to transform analytics data into the desired format
    const transformAnalyticsData = (analyticsData, allLabels) => {
        const updatedData = [];
    
        analyticsData.forEach(({ Var1, Var2, Freq }) => {
            const occupationLabel = allLabels[Var1];
            if (occupationLabel) {
                const country = Var2.split(', ')[1]; // Extract the country from Var2
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
    
        return updatedData;
    };

    // Get Data for Trending component 
    const fetchDataTrending = async () => {
        try{
            //  check first in getdata before make new analysis
            const response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND+"/get_data?user_id=" +userId+ "&session_id=occupation&attribute=trend_anal&storage_name=trending");
            
            // Check if response data is empty
            if (Object.keys(response.data).length === 0 && response.data.constructor === Object) {
                console.log('Response get_data for trending is empty, fetching data...');

                // Fetch trending data if the initial response is empty
                const analyticsResponse = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/trend_analysis?user_id=" +userId+ "&session_id=occupation&storage_name=trending&date_field=upload_date&features_query=location&date_format=%25Y-%25m-%25d&what=month");
            
                // Process the fetched data
                processTrendingData(analyticsResponse.data);
            }
            else{
                // Process the data from the initial response
                processTrendingData(response.data);
            }
        }
        catch (error) {
            console.error('Error fetching trending data:', error);
        }
    };

    const processTrendingData = (data) => {
        const rawData = data.location;
        const countryTrends = {};
    
        rawData.forEach(({ date, item, Freq }) => {
            const parts = item.split(", ");
            const countryRaw = parts[parts.length - 1].replace(/\s/g, "");
            const country = countryNameMap[countryRaw] || countryRaw;
            const formattedDate = String(parseInt(date.replace(/^-/, ""), 10)); // Remove "-" and convert to int string
    
            if (!countryTrends[country]) {
                countryTrends[country] = {};
            }
    
            countryTrends[country][formattedDate] = (countryTrends[country][formattedDate] || 0) + Freq;
        });
    
        const transformedData = Object.entries(countryTrends).map(([country, dateFreqs]) => ({
            country,
            ...dateFreqs
        }));
    
        setDataTrending(transformedData);
        console.log("Trending data processed:", transformedData);
    };


    useEffect(() => {
        const load =async () => {
            userId= await getId();
            if(userId=="")
                userId=1;
            checkLoadedDataOfUser();
        }
        
        load();
    }, []);


    const handleApplyFilters = (selectedFilters) => {
        console.log('Filters received:', selectedFilters);
        setFilterOccupations(selectedFilters);
        if (onApplyFilters) {
            onApplyFilters(selectedFilters.length);
        }
    };

    
    return (
        <>
            {showFilter && <Row>
                <Col md="12">
                    <OccupationFilter onApplyFilters={handleApplyFilters}/>
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
                        {dataTrending && dataTrending.length>0 &&
                            <TrendAnalysis data={dataTrending} />
                        }
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