import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Card, CardHeader, CardBody, CardTitle, Row, Col,
  Input, Button, FormGroup, Label, Badge
} from "reactstrap";
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';
import OccupationSelection from "./OccupationSelection";

import "../../assets/css/loader.css";

const BASE_URL = process.env.REACT_APP_API_URL_GIANT_COMPONENT_NETWORKS;
const ALL_KUS = "K1,K2,K3,K4,K5,K6,K7,K8,K9,K10,K11,K12,K13,K14,K15,K16,K17,K18,K19,K20,K21,K22,K23,K24,K25,K26,K27";

function CoOccurrence({ parentDatasource }) {
    const [search, setSearch] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isTakingLong, setIsTakingLong] = useState(false);
    const [infoMessage, setInfoMessage] = useState("");
    const [apiData, setApiData] = useState(null);

    const [organization, setOrganization] = useState('eclipse');
    const [keywords, setKeywords] = useState('');
    const [selectedOccupation, setSelectedOccupation] = useState(null);
    const [maxNodes, setMaxNodes] = useState(200);
    const [maxEdges, setMaxEdges] = useState(100);
    const [source, setSource] = useState('Udacity');
    const [hoverNode, setHoverNode] = useState(null);
    
    const timerRef = useRef(null);

    const handleApply = () => {
        if (parentDatasource === 'jobs' && !selectedOccupation) {
            setInfoMessage("Please select an occupation.");
            setSearch(true);
            return;
        }
        if (parentDatasource !== 'ku' && parentDatasource !== 'jobs' && !keywords.trim()) {
            setInfoMessage("Keywords are required.");
            setSearch(true);
            return;
        }

        setSearch(true);
        setLoading(true);
        setApiData(null);
        setInfoMessage("");
        setIsTakingLong(false);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setIsTakingLong(true);
        }, 30000);

        const params = new URLSearchParams();
        let url = '';

        switch (parentDatasource) {
            case 'ku':
                url = `${BASE_URL}/ku-co-occurrence`;
                params.append('kus', ALL_KUS);
                if (organization) params.append('organization', organization);
                break;
            case 'jobs':
                url = `${BASE_URL}/api/jobs_mapped_ultra`;
                params.append('occupation_ids', selectedOccupation.id);
                break;
            case 'profiles':
                url = `${BASE_URL}/api/profiles_mapped`;
                params.append('keywords', keywords);
                break;
            case 'courses':
                url = `${BASE_URL}/api/courses_mapped`;
                params.append('keywords', keywords);
                if (source) params.append('source', source);
                break;
            case 'policies':
                url = `${BASE_URL}/api/law-policies_mapped`;
                params.append('keywords', keywords);
                break;
            default:
                setLoading(false);
                return;
        }
        params.append('max_nodes', maxNodes);
        params.append('max_edges', maxEdges);

        axios.get(url, { params })
        .then((res) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setLoading(false);

            if (res.data && !res.data.giant_component && res.data.message) {
                setInfoMessage(res.data.message);
                return;
            }

            // Also check for explicit status if your backend sends it
            if (res.data && res.data.status === "in_progress") {
                setInfoMessage(res.data.message || "Analysis in progress...");
                return;
            }

            setApiData(res.data);
        })
        .catch((err) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setLoading(false);
            if (err.response && err.response.status === 504) {
                setInfoMessage("The analysis is still running in the background. Please try clicking 'Apply' again shortly.");
            } else {
                setInfoMessage("An error occurred while fetching data.");
            }
        });
    };

    const graphData = useMemo(() => {
        if (!apiData || !apiData.giant_component?.nodes?.length) return { nodes: [], links: [] };
        return {
            nodes: typeof apiData.giant_component.nodes[0] === 'string' 
                ? apiData.giant_component.nodes.map(id => ({ id })) 
                : apiData.giant_component.nodes,
            links: apiData.giant_component.edges
        };
    }, [apiData]);

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">Skill Co-occurrence Network</CardTitle>
                        <Row className="mt-3 align-items-end" style={{justifyContent:"center"}}>
                            {parentDatasource === 'ku' ? (
                                <Col md="3">
                                    <FormGroup className="mb-0">
                                        <Label size="sm">Organization</Label>
                                        <Input type="text" bsSize="sm" value={organization} onChange={e => setOrganization(e.target.value)} />
                                    </FormGroup>
                                </Col>
                            ) : parentDatasource === 'jobs' ? (
                                <Col md="4">
                                    <FormGroup className="mb-0">
                                        <Label size="sm">Occupation (required)</Label>
                                        <OccupationSelection 
                                            selectedValue={selectedOccupation} 
                                            onChange={(val) => setSelectedOccupation(val)} 
                                        />
                                    </FormGroup>
                                </Col>
                            ) : (
                                <Col md="3">
                                    <FormGroup className="mb-0">
                                        <Label size="sm">Keywords (required)</Label>
                                        <Input type="text" bsSize="sm" value={keywords} onChange={e => setKeywords(e.target.value)} />
                                    </FormGroup>
                                </Col>
                            )}

                            {parentDatasource === 'courses' && (
                                <Col md="2">
                                    <FormGroup className="mb-0">
                                        <Label size="sm">Source</Label>
                                        <Input type="text" bsSize="sm" value={source} onChange={e => setSource(e.target.value)} />
                                    </FormGroup>
                                </Col>
                            )}

                            <Col md="2">
                                <FormGroup className="mb-0">
                                    <Label size="sm">Max Nodes</Label>
                                    <Input type="number" bsSize="sm" value={maxNodes} onChange={e => setMaxNodes(e.target.value)} />
                                </FormGroup>
                            </Col>
                            <Col md="2">
                                <FormGroup className="mb-0">
                                    <Label size="sm">Max Edges</Label>
                                    <Input type="number" bsSize="sm" value={maxEdges} onChange={e => setMaxEdges(e.target.value)} />
                                </FormGroup>
                            </Col>
                            <Col md="auto">
                                <Button color="primary" size="sm" onClick={handleApply} disabled={loading}>
                                    {loading ? 'Applying...' : 'Apply'}
                                </Button>
                            </Col>
                        </Row>
                    </CardHeader>

                    <CardBody>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <div className="lds-dual-ring"></div>
                                {isTakingLong && (
                                    <p style={{ marginTop: "10px", color: "#666", fontWeight: "bold" }}>
                                        The analysis might take some time...
                                    </p>
                                )}
                            </div>
                        ) : !search ? (
                            <></>
                        ) : infoMessage ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <h6 className="text-info">{infoMessage}</h6>
                            </div>
                        ) : (apiData && apiData.giant_component?.nodes?.length > 0) ? (
                            <>
                                <Row className="mb-3">
                                    <Col md="12">
                                        <h5 className="mb-1">{apiData.message}</h5>
                                        <div>
                                            {Object.entries(apiData.summary || {}).map(([key, val]) => (
                                                <Badge color="info" pill className="mr-2" key={key}>{key}: {val}</Badge>
                                            ))}
                                        </div>
                                    </Col>
                                </Row>
                                <div style={{ border: '1px solid #ddd', borderRadius: '5px' }}>
                                    <ForceGraph2D
                                        graphData={graphData}
                                        nodeLabel="id"
                                        height={500}
                                        onNodeHover={node => setHoverNode(node ? node.id : null)}
                                        linkColor={link => (link.source.id === hoverNode || link.target.id === hoverNode) ? '#87CEFA' : 'rgba(200, 200, 200, 0.5)'}
                                        linkWidth={link => ((link.source.id === hoverNode || link.target.id === hoverNode) ? 2.5 : 1) * Math.max(0.5, link.value * 1.5)}
                                    />
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <h6>No data found for the selected filters.</h6>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default CoOccurrence;