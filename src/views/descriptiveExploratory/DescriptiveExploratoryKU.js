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
import {getId} from "../../utils/Tokens";


const DescriptiveExploratoryKU = ({filters}) => {
    const [dataAreReady, setDataAreReady] = useState(false);
    const [dataSkills, setDataSkills] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [dataTrending, setDataTrending] = useState([]);
    const [dataClustering, setDataClustering] = useState([]);
    const [countryFrequencyData, setCountryFrequencyData] = useState([]);
    const [organizationFrequencyData, setOrganizationFrequencyData] = useState([]);
    const [filterOccupations, setFilterOccupations] = useState([{id: "http://data.europa.eu/esco/isco/C2512",
                                                                    label: "Software developers"}]);
    var userId="";
    
    
    // Get Data for Descriptive component
    const fetchDataSkills = async () => {
        try {
            const response = await axios.get(process.env.REACT_APP_API_URL_KU + "/ku_statistics");
            const transformedData = response.data.map(item => ({
                label: item.ku_id,
                Freq: item.count
            }));
            setDataSkills(transformedData);

            setDataAreReady(true);

            // fetch data one by one
            fetchLocationData();
        } catch (error) {
            console.error('Error fetching data:', error);
            alert("There was a problem fetching the data descriptive/skills_frequency.");
        }
    };

    // Get Data for Location component
    const fetchLocationData = async () => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_KU + "/organization_stats");
            const transformedOrgData = response.data.map(item => ({
                organization: item.organization,
                frequency: item.count
            }));
            setOrganizationFrequencyData(transformedOrgData);
        
            // Fetch exploratory data
            fetchDataExploratory();
        }
        catch (error) {
            console.error('Error fetching location data:', error);
            alert("There was a problem fetching the data descriptive/location.");
        }
    }

    // Get Data for Exploratory component 
    const fetchDataExploratory = async () => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_KU + "/ku_by_organization");
            const transformedData = response.data.map(item => {
                const kuData = {};
                item.ku_counts.forEach(ku => {
                    kuData[ku.ku_id] = ku.count;
                });
                return {
                    country: item.organization,
                    ...kuData
                };
            });
            setDataExploratory(transformedData);
            
            // Fetch trending data
            fetchDataTrending();
        }
        catch (error) {
            console.error('Error fetching location data:', error);
        }
    };

    // Get Data for Trending component 
    const fetchDataTrending = async () => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_KU + "/monthly_analysis_stats");
            const transformedData = response.data.map(item => {
                const monthData = {};
                item.monthly_counts.forEach(entry => {
                    monthData[entry.month] = entry.count;
                });
                return {
                    country: item.organization,
                    ...monthData
                };
            });
            setDataTrending(transformedData);

            // Fetch clustering data
            fetchDataClustering(2);
        }
        catch (error) {
            console.error('Error fetching trending data:', error);
        }
    };

    // Fetch clustering skills
    const fetchDataClustering = async (noClustNow) => {
        try {
            const response = await axios.post(
                process.env.REACT_APP_API_URL_KU + "/cluster_repos",
                {
                    'num_clusters': noClustNow
                });
            const transformedData = response.data.map((repo) =>({
                    Cluster: repo.cluster,
                    Pref_Label: repo.repo_name,
                    x: repo.coordinates.x,
                    y: repo.coordinates.y
                })
            );
            setDataClustering(transformedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };


    useEffect(() => {
        const load =async () => {
            userId= await getId();
            if(userId=="")
                userId=1;
            fetchDataSkills();
        }
        
        load();
    }, []);


    const handleApplyChangeValueK = async (noClustNow) => {
        try {
            const response = await axios.post(
                process.env.REACT_APP_API_URL_KU + "/cluster_repos",
                {
                    'num_clusters': noClustNow
                });
            const transformedData = response.data.map(item => ({
                x: item.coordinates.x,
                y: item.coordinates.y,
                Cluster: item.cluster,
                Pref_Label: item.repo_name
            }));

            setDataClustering(transformedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    
    return (
        <>
            {dataAreReady ? <>
                <Row>
                    <Col md="12">
                        {(dataSkills && dataSkills.length>0) &&
                            <DescriptiveAnalytics data={dataSkills} dataOrganizarion={organizationFrequencyData}/>
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


                {(dataSkills.length==0 || dataExploratory.length==0 || dataTrending==0 || dataClustering==0) &&
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

export default DescriptiveExploratoryKU;