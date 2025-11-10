import React, { useState, useCallback, useMemo } from "react";
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
  Badge,
  Table
} from "reactstrap";
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

import "../../assets/css/loader.css";

const ALL_KUS_EXAMPLE = "K1,K2,K3,K4,K5,K6,K7,K8,K9,K10,K11,K12,K13,K14,K15,K16,K17,K18,K19,K20,K21,K22,K23,K24,K25,K26,K27";

function ForecastingCoOccurence() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [searchTriggered, setSearchTriggered] = useState(false);

    // State for input filters, matching the API parameters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [organization, setOrganization] = useState('');
    const [method, setMethod] = useState('adamic_adar');

    const handleApiCall = useCallback(async () => {
        setLoading(true);
        setResults(null);
        setError(null);
        setSearchTriggered(true);

        const url = `${process.env.REACT_APP_API_URL_GIANT_COMPONENT_NETWORKS}/ku-link-prediction`;
        const params = new URLSearchParams();

        params.append('kus', ALL_KUS_EXAMPLE);
        params.append('max_edges', 100);
        params.append('max_nodes', 200);
        params.append('top_k', 30);
        params.append('method', method);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (organization) params.append('organization', organization);

        try {
            const response = await axios.get(url, { params });
            const processedLinks = response.data.predicted_links.map(link => {
                let emoji = '';
                switch(link.confidence_level) {
                    case 'High confidence': emoji = '🟢'; break;
                    case 'Medium confidence': emoji = '🟡'; break;
                    case 'Low confidence': emoji = '🔴'; break;
                    default: emoji = '⚪️';
                }
                return { ...link, emoji };
            });
            setResults({ ...response.data, predicted_links: processedLinks });
        } catch (err) {
            console.error("API Error:", err);
            setError(err.response?.data?.detail || "Failed to fetch data. The server might be busy or an error occurred.");
            setResults(null);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, organization, method]);


    const graphData = useMemo(() => {
        if (!results || !results.predicted_links || results.predicted_links.length === 0) {
            return { nodes: [], links: [] };
        }

        const nodeSet = new Set();
        results.predicted_links.forEach(link => {
            nodeSet.add(link.source);
            nodeSet.add(link.target);
        });

        const nodes = Array.from(nodeSet).map(id => ({ id }));
        const links = results.predicted_links.map(l => ({ ...l }));

        return { nodes, links };
    }, [results]);


    // Renders the filter input controls
    const renderFilters = () => {
        return (
            <>
                <Row style={{justifyContent:"center"}}>
                    <Col md="3">
                        <FormGroup>
                            <Label for="orgInput">Organization (optional)</Label>
                            <Input id="orgInput" type="text" placeholder="e.g., eclipse, apache" value={organization} onChange={e => setOrganization(e.target.value)} />
                        </FormGroup>
                    </Col>
                     <Col md="3">
                        <FormGroup>
                            <Label for="methodSelect">Method</Label>
                            <Input id="methodSelect" type="select" value={method} onChange={e => setMethod(e.target.value)}>
                                <option value="adamic_adar">Adamic Adar</option>
                                <option value="resource_allocation">Resource Allocation</option>
                                <option value="jaccard">Jaccard</option>
                                <option value="preferential_attachment">Preferential Attachment</option>
                            </Input>
                        </FormGroup>
                    </Col>
                </Row>
                <Row style={{justifyContent:"center"}}>
                    <Col md="2">
                        <FormGroup>
                            <Label for="startDateInput">Start Date (YYYY-MM)</Label>
                            <Input id="startDateInput" type="text" placeholder="e.g., 2022-01" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </FormGroup>
                    </Col>
                    <Col md="2">
                        <FormGroup>
                            <Label for="endDateInput">End Date (YYYY-MM)</Label>
                            <Input id="endDateInput" type="text" placeholder="e.g., 2023-12" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row style={{justifyContent:"center"}}>
                     <Col md="2" className="text-center">
                        <Button color="primary" onClick={handleApiCall} disabled={loading} block>
                            {loading ? 'Loading...' : 'Apply'}
                        </Button>
                    </Col>
                </Row>
            </>
        );
    };
    

    // Renders the results or status messages (loading, error, no data, etc.)
    const renderResults = () => {
        if (loading) return <div className="d-flex justify-content-center"><div className="lds-dual-ring"></div></div>;
        if (error) return <Alert color="danger">{error}</Alert>;
        if (!searchTriggered) return <p className="text-center">Please define your criteria above and click "Apply" to see the results.</p>;
        if (!results || !results.predicted_links || results.predicted_links.length === 0) {
            return <p className="text-center">No data found for the selected criteria. Please try a different query.</p>;
        }

        return (
            <>
                <Row>
                    <Col md="4">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">Summary</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p>{results.message}</p>
                                <div>
                                    {Object.entries(results.summary)
                                        .filter(([key]) => key !== 'Confidence Distribution')
                                        .map(([key, value]) => (
                                            <Badge color="info" pill className="mr-2 mb-2" key={key}>{key}: {String(value)}</Badge>
                                        ))
                                    }
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="8">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">Predicted Skill Links</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table responsive hover>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>Source Skill</th>
                                            <th>Target Skill</th>
                                            <th>Prediction Score</th>
                                            <th>Confidence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.predicted_links.map((item, index) => (
                                            <tr key={`${item.source}-${item.target}-${index}`}>
                                                <td>{item.source}</td>
                                                <td>{item.target}</td>
                                                <td>{item.predicted_score.toFixed(4)}</td>
                                                <td>{item.emoji} {item.confidence_level}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader><CardTitle tag="h5">Predicted Links Network Visualization</CardTitle></CardHeader>
                            <CardBody style={{ minHeight: '300px', border: '1px solid #ddd', borderRadius: '5px', padding: '0px', overflow: 'hidden' }}>
                                <ForceGraph2D
                                    height={400}
                                    graphData={graphData}
                                    nodeAutoColorBy="id"
                                    linkDirectionalArrowLength={3.5}
                                    linkDirectionalArrowRelPos={1}
                                    linkCurvature={0.25}
                                    nodeCanvasObject={(node, ctx, globalScale) => {
                                        const label = node.id;
                                        const fontSize = 12 / globalScale;
                                        ctx.font = `${fontSize}px Sans-Serif`;
                                        const textWidth = ctx.measureText(label).width;
                                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4); 
                                        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
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
                            </CardBody>
                        </Card>
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
                        <CardTitle tag="h5">Knowledge Unit (KU) Link Prediction</CardTitle>
                        <p className="card-category">
                            Reveal potential new conceptual connections between Knowledge Units.
                        </p>
                    </CardHeader>
                    <CardBody>
                        <div style={{marginBottom: '20px'}}>
                            {renderFilters()}
                        </div>
                        <hr />
                        <div>
                            {renderResults()}
                        </div>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default ForecastingCoOccurence;