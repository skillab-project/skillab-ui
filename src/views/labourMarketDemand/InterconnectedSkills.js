import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    CardSubtitle
  } from "reactstrap";
import ForceGraph2D from "react-force-graph-2d";
import axios from 'axios';

function InterconnectedSkills() {
    const [data, setData] = useState({
        nodes: [
            { id: "Skill A", cluster: 1 },
            { id: "Skill H", cluster: 2 },
        ],
        links: [
            { source: "Skill A", target: "Skill B" },
            { source: "Skill H", target: "Skill A" },
        ],
    });
    const generateClusterColors = (clusters) => {
        const clusterColorMap = {};
        clusters.forEach((cluster, index) => {
        const hue = (index * 137) % 360; // Golden angle for distinct colors
        clusterColorMap[cluster] = `hsl(${hue}, 70%, 50%)`;
        });
        return clusterColorMap;
    };
    const uniqueClusters = useMemo(() => {
        const clusters = new Set(data.nodes.map((node) => node.cluster));
        return Array.from(clusters);
    }, [data.nodes]);
    const clusterColors = useMemo(() => generateClusterColors(uniqueClusters), [
        uniqueClusters,
    ]);
    const graphRef = useRef();

    const fetchData = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_LABOUR_DEMAND + "/skillcluster?type_now=kmeans&user_id=1&session_id=1"
                                                             + "&weight_now=ii_weight&no_clust_now=10&threshold=0.1"
                                                             + "umap_nn=5&umap_dim=2&pillar=Skill&level=2"
                                                             + "vectors_type=weighting")
            .then(async (res) => {
                console.log("res: "+res.data);
                const analyticsData = res.data;
            });
    }

    
    useEffect(() => {
        if (graphRef.current) {
            const graph = graphRef.current;
            // Use a delay to allow the graph to stabilize before zooming
            setTimeout(() => {
                graph.zoomToFit(400, 200); // Adjust duration (400ms) and padding (100px) as needed
            }, 500); // Wait 500ms for initial rendering to stabilize
        }
        setData({
            nodes: [
                { id: "Skill A", cluster: 1 },
                { id: "Skill B", cluster: 1 },
                { id: "Skill C", cluster: 2 },
                { id: "Skill D", cluster: 2 },
                { id: "Skill E", cluster: 3 },
                { id: "Skill F", cluster: 3 },
                { id: "Skill G", cluster: 1 },
                { id: "Skill H", cluster: 2 },
            ],
            links: [
                { source: "Skill A", target: "Skill B" },
                { source: "Skill A", target: "Skill G" },
                { source: "Skill B", target: "Skill C" },
                { source: "Skill C", target: "Skill D" },
                { source: "Skill D", target: "Skill E" },
                { source: "Skill E", target: "Skill F" },
                { source: "Skill G", target: "Skill H" },
                { source: "Skill H", target: "Skill A" },
            ],
        });
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h5">Interconnected Skills</CardTitle>
            </CardHeader>
            <CardBody>
                <div style={{height: "600px",
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            background: "#f5f5f5",
                            overflow: "hidden"
                            }}>
                    <ForceGraph2D
                            ref={graphRef}
                            graphData={data}
                            nodeAutoColorBy="cluster"
                            nodeCanvasObject={(node, ctx, globalScale) => {
                                // Draw node
                                const label = node.id;
                                const fontSize = 12 / globalScale;
                                ctx.font = `${fontSize}px Sans-Serif`;
                                ctx.fillStyle = clusterColors[node.cluster];
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
                                ctx.fill();

                                // Draw label
                                ctx.fillStyle = "#000";
                                ctx.fillText(label, node.x + 8, node.y + 4);
                            }}
                            height={600}
                    />
                </div>
            </CardBody>
        </Card>
    );
}

export default InterconnectedSkills;