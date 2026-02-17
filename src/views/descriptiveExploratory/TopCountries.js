import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardBody, CardTitle, Row, Col } from "reactstrap";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = require('../../assets/europe.geojson');

// Ensure these keys match the "NAME" property inside your europe.geojson
const geoJsonNameMap = {
    "Czechia": "Czech Republic",
    "Republic of Serbia": "Serbia",
    // Add any others if the map doesn't light up correctly
};

function TopCountries(props) {
    const [countryFrequencyMap, setCountryFrequencyMap] = useState({});
    const [colorMaxScale, setColorMaxScale] = useState(0);
    const [standardizedData, setStandardizedData] = useState([]);
    const [hoveredCountry, setHoveredCountry] = useState(null);

    const colorScale = scaleLinear()
        .domain([0, colorMaxScale || 1]) // Avoid division by zero
        .range(["#e0f3f8", "#005824"]);
    
    useEffect(() => {
        if (props.data && props.data.length > 0) {
            console.log("Received country data:", props.data);
            // 1. Prepare Bar Chart Data
            // Data is already mostly clean from parent, but we ensure it matches GeoJSON expectations
            const updatedData = props.data.map(item => ({
                ...item,
                country: geoJsonNameMap[item.country] || item.country
            }));
            setStandardizedData(updatedData);

            // 2. Prepare Map Data (Lookup object)
            const freqMap = {};
            let maxFreq = 0;

            updatedData.forEach(item => {
                freqMap[item.country] = item.frequency;
                if (item.frequency > maxFreq) maxFreq = item.frequency;
            });

            setCountryFrequencyMap(freqMap);
            setColorMaxScale(maxFreq);
        }
    }, [props.data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h4">Top Countries</CardTitle>
            </CardHeader>
            <CardBody style={{ position: "relative" }}>
                {props.data && props.data.length > 0 && 
                    <Row>
                        <Col sm="12" md="6">
                            <ComposableMap
                                projection="geoMercator"
                                projectionConfig={{
                                    scale: 550,
                                    center: [10, 56], 
                                }}
                                style={{ width: "100%", height: "500px" }}
                            >
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => {
                                            // Make sure geo.properties.NAME matches your map keys
                                            const { NAME } = geo.properties;
                                            const frequency = countryFrequencyMap[NAME] || 0;
                                            const isCountryInData = NAME in countryFrequencyMap;

                                            return (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    onMouseEnter={() => setHoveredCountry({ name: NAME, frequency })}
                                                    onMouseLeave={() => setHoveredCountry(null)}
                                                    style={{
                                                        default: {
                                                            fill: isCountryInData
                                                                ? colorScale(frequency)
                                                                : "#F5F5F5", // Light grey for no data
                                                            outline: "none",
                                                            stroke: "#607D8B", // Country borders
                                                            strokeWidth: 0.5
                                                        },
                                                        hover: {
                                                            fill: "#f39423",
                                                            outline: "none"
                                                        }
                                                    }}
                                                />
                                            );
                                        })
                                    }
                                </Geographies>
                            </ComposableMap>
                        </Col>

                        <Col sm="12" md="6" style={{ margin: "auto" }}>
                            <ResponsiveContainer width="100%" height={Math.max(standardizedData.length * 40, 300)}>
                                <BarChart
                                    data={standardizedData}
                                    layout="vertical"
                                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                                    barSize={20}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="country" type="category" width={120} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="frequency" fill="#f39423" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Col>
                    </Row>
                }

                {hoveredCountry && (
                    <div
                        style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            padding: "10px",
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            borderRadius: "5px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                            pointerEvents: "none",
                            zIndex: 10
                        }}
                    >
                        <h6 style={{ margin: 0 }}>{hoveredCountry.name}</h6>
                        <p style={{ margin: 0 }}>Frequency: {hoveredCountry.frequency.toLocaleString()}</p>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

export default TopCountries;