import React, { useState } from "react";
import { Card, CardHeader, CardBody, CardTitle, Row, Col } from "reactstrap";
import axios from 'axios';
import OccupationSelectionAndPillar from './OccupationSelectionAndPillar';
import TurfResults from './TurfResults';
import "../../assets/css/loader.css";

function Turf({ datasource }) {
    const [search, setSearch] = useState(false);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isTimeout, setIsTimeout] = useState(false);

    const handleApplySelection = (params) => {
        const { selectedItem, selectedOccupations, combinations, keywords } = params;
        const pillar = selectedItem;
        
        setSearch(true);
        setLoading(true);
        setIsTimeout(false);

        let endpoint = "";
        let queryParams = `pillar=${pillar}&combinations=${combinations}`;

        if (datasource === "jobs") {
            endpoint = "/TurfAnalysis/jobs";
            // Extract the ID from the first selected occupation
            const occId = selectedOccupations.length > 0 ? selectedOccupations[0].id : "";
            queryParams += `&occupation_ids=${occId}&sources=OJA`;
        } else {
            // Policies, Profiles, and Courses use 'occupation' as a required string
            const dummyOccupation = "General"; 
            if (datasource === "EU profiles") endpoint = "/TurfAnalysis/profiles";
            else if (datasource === "Short Courses") endpoint = "/TurfAnalysis/courses";
            else if (datasource === "EU Policies") endpoint = "/TurfAnalysis/policies";

            queryParams += `&occupation=${dummyOccupation}`;
            if (keywords) queryParams += `&keywords=${encodeURIComponent(keywords)}`;
        }

        axios
            .get(`${process.env.REACT_APP_API_URL_SKILL_DEMAND_MATRIX}${endpoint}?${queryParams}`)
            .then((res) => {
                setLoading(false);
                setData(res.data); 
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error fetching data:", err);

                const isTimeoutError =
                    err.code === "ECONNABORTED" ||
                    err.message?.toLowerCase().includes("timeout") ||
                    err.response?.status === 408 ||
                    err.response?.status === 504;

                if (isTimeoutError) {
                    setIsTimeout(true);
                } else {
                    setData([]);
                }
            });
    }

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">Turf Analysis</CardTitle>
                        <OccupationSelectionAndPillar 
                            onApplySelection={handleApplySelection} 
                            datasource={datasource} 
                        />
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <div className="text-center"><div className="lds-dual-ring"></div></div>
                        ) : !search ? (
                            <div className="text-center text-muted">Please configure parameters and click Apply.</div>
                        ) : isTimeout ? (
                            <div className="text-center text-muted">
                                <h6>⏳ Analysis is currently running.</h6>
                                <p>This may take a while. Please come back later and try again.</p>
                            </div>
                        ) : data.length > 0 ? (
                            <TurfResults data={data} />
                        ) : (
                            <h6 className="text-center">No data found for this selection.</h6>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default Turf;