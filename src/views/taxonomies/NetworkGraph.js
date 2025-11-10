import React, { useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const NetworkGraph = ({ data }) => {
    // The library expects 'links' instead of 'edges', so we transform the data.
    // useMemo ensures this only runs when the data prop changes.
    const graphData = useMemo(() => {
        if (!data || !data.nodes || !data.edges) {
            return { nodes: [], links: [] };
        }
        return {
            nodes: data.nodes,
            links: data.edges.map(edge => ({ ...edge })) // Create a new array to be safe
        };
    }, [data]);

    // Custom node rendering to color-code ESCO vs. non-ESCO skills
    const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
        const label = node.id;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        
        ctx.fillStyle = node.group === 'ESCO_skill' ? 'rgba(31, 119, 180, 0.8)' : 'rgba(255, 127, 14, 0.8)';

        // Draw circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
        ctx.fill();

        // Draw label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText(label, node.x, node.y + 8);
    }, []);

    
    return (
        <ForceGraph2D
            graphData={graphData}
            nodeLabel="id"
            nodeRelSize={5}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.1}
            nodeCanvasObject={nodeCanvasObject}
            enablePointerInteraction={true} 
        />
    );
};

export default NetworkGraph;