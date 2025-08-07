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
import SkillClustering from "./SkillClustering";
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
    "Germany": "Germany",
    "DEUTSCHLAND": "Germany",
    "Éire/Ireland": "Ireland",
    "Eesti": "Estonia",
    "The Netherlands": "Netherlands",
    "the Netherlands": "Netherlands",
    "Republic of Latvia": "Latvia",
    "Northern Ireland": "Ireland"
};

const DescriptiveExploratoryProfiles = ({filters}) => {
    const [dataAreReady, setDataAreReady] = useState(false);
    const [dataOccupations, setDataOccupations] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [dataTrending, setDataTrending] = useState([]);
    const [dataClustering, setDataClustering] = useState([]);
    const [countryFrequencyData, setCountryFrequencyData] = useState([]);
    const [analysisIsRunning, setAnalysisIsRunning] = useState(false);
    const [filterSources, setFilterSources] = useState("stack-math");//stack-stackoverflow 
    const [filterLimitData, setFilterLimitData] = useState("20000");
    var userId="";

    
    // Check if there is same analysis or
    //  start new
    const checkLoadedDataOfUser = async () => {
        await axios
                .get(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/analysis/check?sessionId=profiles" + 
                        "&filterSources=" +filterSources+ "&limitData=" +filterLimitData, 
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}`
                        }
                    })
                .then(async (res) => {
                    console.log("analysis/check: "+res.data);
                    if(!res.data.finished) {
                        setAnalysisIsRunning(true);
                    }
                    else{
                        // After that fetch data one by one
                        userId = res.data.userId;
                        setDataAreReady(true);
                        fetchDataSkills();
                    }
                })
                .catch((error) => {
                    console.error("Error during analysis/check:", error);

                    // if no same analysis found start new
                    if(error.response.status == 404){
                        axios
                            .post(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/analysis/new?userId=" +userId+ "&sessionId=profiles" + 
                                    "&filterSources=" +filterSources+ "&limitData=" +filterLimitData, 
                                {}, {
                                    headers: {
                                        'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}`
                                    }
                                })
                            .then(async (res) => {
                                console.log("analysis/check: "+res.data);

                                //toDO
                                // Wait for the new analysis to finish....
                                setAnalysisIsRunning(true);
                            })
                            .catch((error) => {
                                console.error("Error during analysis/check:", error);
                                if(error.response.status == 406){
                                    console.log("Same analysis exist");
                                }
                            });
                    }
                });
    }

    // Get Data for Descriptive component
    const fetchDataSkills = async () => {
        try {
            //  check first in getdata before make new analysis
            const completeSessionId = "profiles-sources-"+ filterSources +"-limit-" +filterLimitData;
            console.log("completeSessionId: "+completeSessionId);
            
            const response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/get_data?user_id=" +userId+ "&session_id="
                    +completeSessionId+ "&attribute=all_stats&storage_name=skills");
            
            // Check if response data is empty
            if (Object.keys(response.data).length === 0 && response.data.constructor === Object) {
                console.log('Response get_data for skills, is empty');
                response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND+"/analytics_descriptive?user_id=" +userId+ "&session_id="
                        +completeSessionId+ "&storage_name=skills&features_query=skills");
            }

            // set data
            setDataOccupations(response.data.skills);

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
            const completeSessionId = "profiles-sources-"+ filterSources +"-limit-" +filterLimitData;
            const response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/get_data?user_id=" +userId+ "&session_id="
                +completeSessionId+ "&attribute=all_stats&storage_name=location");
            
            // Check if response data is empty
            if (Object.keys(response.data).length === 0 && response.data.constructor === Object) {
                console.log('Response get_data for location is empty, fetching analytics data...');
                
                response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND+"/analytics_descriptive?user_id=" +userId+ "&session_id="
                        +completeSessionId+ "&storage_name=location&features_query=location");
            }
        
            // Process the data from the initial response
            processLocationData(response.data.location);

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
                    const country = countryNameMap[Var1.split(', ')[1]] || Var1.split(', ')[1]
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
            const completeSessionId = "profiles-sources-"+ filterSources +"-limit-" +filterLimitData;
            const response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND+"/get_data?user_id=" +userId+ "&session_id="
                    +completeSessionId+ "&attribute=explor_stats&storage_name=skills-location");
            
            // Check if response data is empty
            if (Object.keys(response.data).length === 0 && response.data.constructor === Object) {
                console.log('Response get_data for exploratory is empty, fetching analytics data...');

                // Fetch analytics data if the initial response is empty
                response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/analytics_exploratory?user_id=" +userId+ "&session_id="
                    +completeSessionId+ "&storage_name=skills-location&features_query=skills;;location");
            }

            // Process the data from the response
            processAnalyticsData(response.data);

            // Fetch trending data
            // fetchDataTrending();

            // Fetch clustering data
            fetchDataClustering(2);
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
                const country = countryNameMap[Var2.split(', ')[1]] || Var2.split(', ')[1]
                if (country !== undefined){
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
            }
        });
    
        return updatedData;
    };

    // Get Data for Trending component 
    const fetchDataTrending = async () => {
        try{
            //  check first in getdata before make new analysis
            const response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND+"/get_data?user_id=" +userId+ "&session_id=test-profiles&attribute=trend_anal&storage_name=trending");
            
            // Check if response data is empty
            if (Object.keys(response.data).length === 0 && response.data.constructor === Object) {
                console.log('Response get_data for trending is empty, fetching data...');

                // Fetch trending data if the initial response is empty
                response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/trend_analysis?user_id=" +userId+ "&session_id=test-profiles&storage_name=trending&date_field=upload_date&features_query=location&date_format=%25Y-%25m-%25d&what=month");
            }
            
            // Process the fetched data
            processTrendingData(response.data);

            
            // Fetch clustering data
            fetchDataClustering(10);
        }
        catch (error) {
            console.error('Error fetching trending data:', error);
        }
    };

    const processTrendingData = (apiData) => {
        // Check for empty or invalid input
        if (!apiData || !apiData.location || !Array.isArray(apiData.location)) {
            console.warn("processTrendingData received invalid or empty data.");
            return [];
        }
        
        // Step 1: Aggregate data in an intermediate object for easier lookup.
        // Format: { "Germany": { "01": 1188, "02": 950 }, "France": { "01": 432 } }
        const aggregated = {};

        apiData.location.forEach(({ item, date, Freq }) => {
            const country = countryNameMap[item.split(', ')[1]] || item.split(', ')[1]

            // If a country was successfully identified
            if (country) {
                // If we haven't seen this country before, initialize it.
                if (!aggregated[country]) {
                    aggregated[country] = {};
                }
                // If we haven't seen this date for this country, initialize it.
                if (!aggregated[country][date]) {
                    aggregated[country][date] = 0;
                }
                // Add the frequency to the total for that country and date.
                aggregated[country][date] += Freq;
            }
        });

        // Step 2: Transform the aggregated object into the array format the component expects.
        // Format: [{ country: "Germany", "01": 1188, "02": 950 }, { country: "France", ... }]
        const chartData = Object.keys(aggregated).map(countryName => {
            return {
                country: countryName,
                ...aggregated[countryName] // Spread the date-frequency pairs
            };
        });
        

        setDataTrending(chartData);
    };


    //Skills specific calls
    // Fetch clustering skills
    const fetchDataClustering = async (noClustNow) => {
        try {
            //  check first in getdata before make new analysis
            const completeSessionId = "profiles-sources-"+ filterSources +"-limit-" +filterLimitData;
            const response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND+"/get_data?user_id="+userId+"&session_id="
                    +completeSessionId+ "&attribute=skill_clust&storage_name=skillcluster-"+noClustNow);

            // Check if response data is empty
            if (Object.keys(response.data).length === 0 && response.data.constructor === Object) {
                console.log('Response get_data for clustering is empty, fetching data...');
                //test...
                setDataClustering([{
                    x: 1,
                    y: 2,
                    Cluster: 1,
                    Pref_Label: "test"
                }]);
            }
            else{
                const rawData = response.data[0];
                const transformedData = rawData.map(item => ({
                    x: item.V1,
                    y: item.V2,
                    Cluster: item.cluster,
                    Pref_Label: item.Pref_Label,
                }));
                setDataClustering(transformedData);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
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


    const handleApplyChangeValueK = async (noClustNow) => {
        userId= await getId();
        
        // Get analysis if ready
        const completeSessionId = "profiles-sources-"+ filterSources +"-limit-" +filterLimitData;
        const response = await axios.get(process.env.REACT_APP_API_URL_LABOUR_DEMAND+"/get_data?user_id="+userId+"&session_id="
                +completeSessionId+ "&attribute=skill_clust&storage_name=skillcluster-"+noClustNow);
        
        // If ready set response to state
        if(Object.keys(response.data).length !== 0) {
            const rawData = response.data[0];
            const transformedData = rawData.map(item => ({
                x: item.V1,
                y: item.V2,
                Cluster: item.cluster,
                Pref_Label: item.Pref_Label,
            }));
            setDataClustering(transformedData);
        }
        else{
            // If no analysis found, start new
            axios.post(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/analysis/new/" +noClustNow+ "?&sessionId=profiles" + 
                        "&filterSources=" +filterSources+ "&limitData=" +filterLimitData, 
                    {}, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}`
                        }
                    })
                .then(async (res) => {
                    console.log("analysis/check: "+res.data);

                    //toDO
                    // Wait for the new analysis to finish....
                })
                .catch(async (error) => {
                    console.error("Error during analysis/check:", error);
                    if(error.response.status == 406){
                        console.log("Analysis with these filters doesn't exist");
                    }
                });
        }
    };

    
    return (
        <>
            {analysisIsRunning &&
                <Row>
                    <Col md="12">
                        <Card>
                            <CardBody>
                                Come back soon, the analysis might take a while
                            </CardBody>
                        </Card>
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
                
                {/* <Row>
                    <Col md="12">
                        {dataTrending && dataTrending.length>0 &&
                            <TrendAnalysis data={dataTrending} />
                        }
                    </Col>
                </Row> */}

                {/* <Row>
                    <Col md="12">
                        <InterconnectedSkills/>
                    </Col>
                </Row> */}

                <Row>
                    <Col md="12">
                        {dataClustering && dataClustering.length>0 &&
                            <SkillClustering data={dataClustering} onApplyChangeValueK={handleApplyChangeValueK} noClustering={2}/>
                        }
                    </Col>
                </Row>


                {(dataOccupations.length==0 || dataExploratory.length==0 || dataClustering==0) &&
                    <div class="lds-dual-ring"></div>
                }
            </>
            :
            <>
                <div class="lds-dual-ring"></div>
            </>}
        </>
    );
}

export default DescriptiveExploratoryProfiles;