import React, { useEffect, useRef, useState } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Button
  } from "reactstrap";
import * as d3 from "d3";


const SkillClustering = ({data, onApplyChangeValueK, noClustering}) => {
    const svgRef = useRef(null);
    const [noClustNow, setNoClustNow] = useState(noClustering);

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Clear previous SVG content
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 800;
        const height = 600;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };

        // Re-select and configure the SVG element
        svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background", "#f9f9f9")
        .style("border", "1px solid #ccc");

        // Scale functions
        const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.x))
        .range([margin.left, width - margin.right]);

        const yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.y))
        .range([height - margin.bottom, margin.top]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Axes
        svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

        svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

        const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "white")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("display", "none");

        // Draw points
        svg
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 5)
        .attr("fill", (d) => colorScale(d.Cluster))
        .on("mouseover", (event, d) => {
            tooltip
            .style("display", "block")
            .html(`${d.Pref_Label} (Cluster ${d.Cluster})`);
        })
        .on("mousemove", (event) => {
            tooltip
            .style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });

        return () => {
            tooltip.remove();
        };
    }, [data]);


    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h5">Skills Clustering</CardTitle>
            </CardHeader>
            <CardBody>
                { (data && data.length>0) ?
                    <>
                        <div>
                            <label htmlFor="noClustNow">Number of Clusters: </label>
                            <input
                                id="noClustNow"
                                type="number"
                                value={noClustNow}
                                onChange={(e) => setNoClustNow(Number(e.target.value))}
                                style={{ marginBottom: "10px" }}
                                min="2"
                            />
                            <Button
                                    style={{marginLeft:"10px"}}
                                    color="success"
                                    outline
                                    size="m"
                                    onClick={() => onApplyChangeValueK(noClustNow)}
                                >
                                    Update Chart
                            </Button>
                        </div>
                        <svg ref={svgRef} style={{ width: "100%", height: "600px" }} />
                    </>
                    :
                    <div className="lds-dual-ring"></div>
                }
            </CardBody>
        </Card>
    );
};

export default SkillClustering;