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
import SkillClustering from "./SkillClustering";
import TopCountries from "./TopCountries";


const DescriptiveExploratorySyllabus = ({filters}) => {
    const [dataAreReady, setDataAreReady] = useState(false);
    const [dataSkills, setDataSkills] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [dataClustering, setDataClustering] = useState([]);
    const [countryFrequencyData, setCountryFrequencyData] = useState([]);
    
    
    // Get Data for Descriptive component
    const fetchDataSkills = async () => {
        try {
            const response = await axios.get(process.env.REACT_APP_API_URL_CURRICULUM_SKILLS + "/descriptive/skills_frequency");
            const transformedData = response.data.map(item => ({
                label: item.skill,
                Freq: item.frequency
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
            const response = await axios.get(process.env.REACT_APP_API_URL_CURRICULUM_SKILLS + "/descriptive/location");
            const transformedLocationData = response.data.map(item => ({
                country: item.country,
                frequency: item.universities
            }));
            setCountryFrequencyData(transformedLocationData);
        
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
            const response = await axios.get(process.env.REACT_APP_API_URL_CURRICULUM_SKILLS + "/exploratory/skills_location");
            const transformedData = response.data.map((item) => {
                const skillMap = item.skills.reduce((acc, skillEntry) => {
                    acc[skillEntry.skill] = skillEntry.frequency;
                    return acc;
                }, {});

                return {
                    country: item.country,
                    ...skillMap,
                };
            });
            setDataExploratory(transformedData);
            
            // Fetch clustering data
            fetchDataClustering(10);
        }
        catch (error) {
            console.error('Error fetching location data:', error);
        }
    };

    // Fetch clustering skills
    const fetchDataClustering = async (noClustNow) => {
        try {
            const response = await axios.get(process.env.REACT_APP_API_URL_CURRICULUM_SKILLS + "/cluster/universities/"+noClustNow);
            const transformedData = response.data.flatMap((clusterGroup) =>
                clusterGroup.universities.map((uni) => ({
                    Cluster: clusterGroup.cluster,
                    Pref_Label: uni.pref_label,
                    x: uni.x,
                    y: uni.y
                }))
            );
            setDataClustering(transformedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };


    useEffect(() => {
        const load =async () => {
            fetchDataSkills();
        }
        
        load();
    }, []);


    const handleApplyChangeValueK = async (noClustNow) => {
        try {
            const response = await axios.get(process.env.REACT_APP_API_URL_CURRICULUM_SKILLS + "/cluster/universities/"+noClustNow);
            const transformedData = response.data.flatMap((clusterGroup) =>
                clusterGroup.universities.map((uni) => ({
                    Cluster: clusterGroup.cluster,
                    Pref_Label: uni.pref_label,
                    x: uni.x,
                    y: uni.y
                }))
            );
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
                            <DescriptiveAnalytics data={dataSkills}/>
                        }
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        {countryFrequencyData && countryFrequencyData.length>0 &&
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
                        {dataClustering && dataClustering.length>0 &&
                            <SkillClustering data={dataClustering} onApplyChangeValueK={handleApplyChangeValueK} noClustering={10}/>
                        }
                    </Col>
                </Row>


                {(dataSkills.length==0 || dataExploratory.length==0 || dataClustering==0) &&
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

export default DescriptiveExploratorySyllabus;