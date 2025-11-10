import React, { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Input,
  Button,
  FormGroup,
  Label,
  Alert,
  Badge
} from "reactstrap";
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

import "../../assets/css/loader.css";

const BASE_URL = process.env.REACT_APP_API_URL_GIANT_COMPONENT_NETWORKS;
const ALL_KUS = "K1,K2,K3,K4,K5,K6,K7,K8,K9,K10,K11,K12,K13,K14,K15,K16,K17,K18,K19,K20,K21,K22,K23,K24,K25,K26,K27";

function CoOccurrence({ parentDatasource }) {
    const [loading, setLoading] = useState(false);
    const [apiData, setApiData] = useState(null);
    const [error, setError] = useState(null);
    const [searchTriggered, setSearchTriggered] = useState(false);

    const [organization, setOrganization] = useState('eclipse');
    const [keywords, setKeywords] = useState('');
    const [maxNodes, setMaxNodes] = useState(200);
    const [maxEdges, setMaxEdges] = useState(100);
    const [maxPages, setMaxPages] = useState(10);
    const [source, setSource] = useState('Udacity');

    const [hoverNode, setHoverNode] = useState(null);

    const handleApiCall = useCallback(async () => {
        if (parentDatasource !== 'ku' && !keywords.trim()) {
            setError("Keywords are required for this search.");
            return;
        }
        setLoading(true);
        setApiData(null);
        setError(null);
        setSearchTriggered(true);

        let url = '';
        const params = new URLSearchParams();

        switch (parentDatasource) {
        case 'ku':
            url = `${BASE_URL}/ku-co-occurrence`;
            params.append('kus', ALL_KUS);
            if (organization) params.append('organization', organization);
            params.append('max_nodes', 200);
            params.append('max_edges', 100);
            break;
        case 'jobs':
            url = `${BASE_URL}/api/jobs_mapped_ultra`;
            params.append('keywords', keywords);
            params.append('max_nodes', maxNodes);
            params.append('max_edges', maxEdges);
            params.append('max_pages', maxPages);
            break;
        // CHANGE 1: ADDED 'profiles' CASE
        case 'profiles':
            url = `${BASE_URL}/api/profiles_mapped`;
            params.append('keywords', keywords);
            params.append('max_nodes', maxNodes);
            params.append('max_edges', maxEdges);
            params.append('max_pages', maxPages);
            break;
        case 'courses':
            url = `${BASE_URL}/api/courses_mapped`;
            params.append('keywords', keywords);
            params.append('max_nodes', maxNodes);
            params.append('max_edges', maxEdges);
            if (source) params.append('source', source);
            break;
        default:
            setError("Invalid data source selected.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(url, { params });
            setApiData(response.data);
        } catch (err) {
            console.error("API Error:", err);
            setError("Failed to fetch data. The server might be busy or an error occurred.");
            setApiData(null);
        } finally {
            setLoading(false);
        }
    }, [parentDatasource, organization, keywords, maxNodes, maxEdges, maxPages, source]);

    const graphData = useMemo(() => {
        if (!apiData || !apiData.giant_component || !apiData.giant_component.nodes || apiData.giant_component.nodes.length === 0) {
            return { nodes: [], links: [] };
        }
        const originalNodes = apiData.giant_component.nodes;
        let processedNodes;
        if (typeof originalNodes[0] === 'string') {
            processedNodes = originalNodes.map(nodeId => ({ id: nodeId }));
        } else {
            processedNodes = originalNodes;
        }
        return {
            nodes: processedNodes,
            links: apiData.giant_component.edges
        };
    }, [apiData]);

    const renderFilters = () => {
        if (parentDatasource === 'ku') {
            return (
                <>
                    <Row style={{justifyContent: "center"}}> 
                        <Col md="4">
                            <FormGroup>
                                <Label for="orgInput">Organization (optional)</Label>
                                <Input id="orgInput" type="text" placeholder="e.g., eclipse, apache" value={organization} onChange={e => setOrganization(e.target.value)} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row style={{justifyContent: "center"}}> 
                        <Button color="primary" onClick={handleApiCall} disabled={loading}>
                                {loading ? 'Loading...' : 'Apply'}
                        </Button>
                    </Row>
                </>
            );
        }
        return ( 
            <>
                <Row style={{justifyContent: "center"}}>
                    <Col md="4">
                        <FormGroup>
                            <Label for="keywordInput">Keywords (required)</Label>
                            <Input id="keywordInput" type="text" placeholder="e.g., python, software developer" value={keywords} onChange={e => setKeywords(e.target.value)} />
                        </FormGroup>
                    </Col>
                    {parentDatasource === 'courses' && ( 
                        <Col md="3">
                            <FormGroup>
                                <Label for="sourceInput">Source (optional)</Label>
                                <Input id="sourceInput" type="text" placeholder="e.g., Udacity, europass" value={source} onChange={e => setSource(e.target.value)} />
                            </FormGroup>
                        </Col>
                    )}
                </Row>
                <Row className="align-items-end" style={{justifyContent: "center"}}>
                    <Col md="2">
                        <FormGroup>
                            <Label for="maxNodesInput">Max Nodes</Label>
                            <Input id="maxNodesInput" type="number" value={maxNodes} onChange={e => setMaxNodes(parseInt(e.target.value, 10))} />
                        </FormGroup>
                    </Col>
                    <Col md="2">
                        <FormGroup>
                            <Label for="maxEdgesInput">Max Edges</Label>
                            <Input id="maxEdgesInput" type="number" value={maxEdges} onChange={e => setMaxEdges(parseInt(e.target.value, 10))} />
                        </FormGroup>
                    </Col>
                    {/* CHANGE 2: UPDATED CONDITION TO SHOW MAX PAGES FILTER */}
                    {(parentDatasource === 'jobs' || parentDatasource === 'profiles') && (
                        <Col md="2">
                            <FormGroup>
                                <Label for="maxPagesInput">Max Pages</Label>
                                <Input id="maxPagesInput" type="number" value={maxPages} onChange={e => setMaxPages(parseInt(e.target.value, 10))} />
                            </FormGroup>
                        </Col>
                    )}
                </Row>
                <Row style={{justifyContent: "center"}}>
                    <Button color="primary" onClick={handleApiCall} disabled={loading}>
                            {loading ? 'Loading...' : 'Apply'}
                    </Button>
                </Row>
            </>
        );
    };
    
    const renderResults = () => {
        if (loading) return <div className="lds-dual-ring"></div>;
        if (error) return <Alert color="danger">{error}</Alert>;
        if (!searchTriggered) return <h6>Please define your criteria above and click "Apply" to see the results.</h6>;
        if (!apiData || !apiData.giant_component || !apiData.giant_component.nodes.length === 0) {
            return <h6>No data found for the selected criteria. Please try a different query.</h6>;
        }

        const isKuData = typeof apiData.giant_component.nodes[0] === 'string';

        return (
        <>
            <Row>
                <Col md="12">
                    <h5>{apiData.message}</h5>
                    <h6>{Object.entries(apiData.summary).map(([key, value]) => (<Badge color="info" pill className="mr-2" key={key}>{key}: {value}</Badge>))}</h6>
                </Col>
            </Row>
            <Row>
                <Col md="12" style={{ border: '1px solid #ddd', borderRadius: '5px', marginTop: '15px',
                            overflow: 'hidden', padding:'0px' }}>
                    <ForceGraph2D
                        graphData={graphData}
                        nodeLabel="id"
                        nodeAutoColorBy={isKuData ? 'id' : 'degree'}
                        onNodeHover={node => setHoverNode(node ? node.id : null)}
                        linkColor={link => (link.source.id === hoverNode || link.target.id === hoverNode) ? '#87CEFA' : 'rgba(200, 200, 200, 0.5)'}
                        linkWidth={link => ((link.source.id === hoverNode || link.target.id === hoverNode) ? 2.5 : 1) * Math.max(0.5, link.value * 1.5)}
                        linkCurvature={0.1}
                        nodeCanvasObject={(node, ctx, globalScale) => {
                            const label = node.id;
                            const fontSize = 12 / globalScale;
                            ctx.font = `${fontSize}px Sans-Serif`;
                            const textWidth = ctx.measureText(label).width;
                            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = node.color;
                            ctx.fillText(label, node.x, node.y);
                            node.__bckgDimensions = bckgDimensions;
                        }}
                        nodePointerAreaPaint={(node, color, ctx) => {
                            ctx.fillStyle = color;
                            const bckgDimensions = node.__bckgDimensions;
                            bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
                        }}
                    />
                </Col>
            </Row>
        </>
        );
    };
    
    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">Skill Co-occurrence Network</CardTitle>
                        <p className="card-category">Analyze skill connections based on 
                            {parentDatasource === 'ku' ? 'Knowledge Units' : parentDatasource}.</p>
                    </CardHeader>
                    <CardBody>
                        <div className="filters-section" style={{marginBottom: '20px'}}>
                            {renderFilters()}
                        </div>
                        <div className="results-section">
                            {renderResults()}
                        </div>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}
export default CoOccurrence;