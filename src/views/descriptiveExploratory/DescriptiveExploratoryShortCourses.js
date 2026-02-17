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
import DescriptiveAnalytics from "./DescriptiveAnalytics";


const DescriptiveExploratoryShortCourses = ({filters}) => {
    const [dataAreReady, setDataAreReady] = useState(false);
    const [dataOccupations, setDataOccupations] = useState([]);
    const [analysisIsRunning, setAnalysisIsRunning] = useState(false);
    const [errorWithAnalysis, setErrorWithAnalysis] = useState(false);
    
    // derive constants from props
    const filterSources = useMemo(() => filters?.dataSource?.[0] || "", [filters]);
    const filterLimitData = useMemo(() => filters.dataLimit || "", [filters]);

    
    // Check if the user has loaded data
    //  and if not load them
    const checkLoadedDataOfUser = async () => {
        setDataAreReady(true);
        fetchDataSkills();
    }

    // Get Data for Descriptive component
    const fetchDataSkills = async () => {
        try {
            let url = process.env.REACT_APP_API_URL_TRACKER + "/api/descriptive-analytics/courses?limit=200";
            if (filterSources) {
                url += "&source="+filterSources;
            }
            const response = await axios.get(url,
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
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };


    useEffect(() => {
        const load = async () => {
            
            // Reset state before fetching new data
            setDataAreReady(false);
            setAnalysisIsRunning(false);
            setErrorWithAnalysis(false);
            setDataOccupations([]);
            
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

                    {!errorWithAnalysis &&
                            (dataOccupations.length==0) &&
                        <div class="lds-dual-ring"></div>
                    }
                </>)
            }
        </>
    );
}

export default DescriptiveExploratoryShortCourses;