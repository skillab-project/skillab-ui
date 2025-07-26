import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardBody, CardTitle, Row, Col } from "reactstrap";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = require('../../assets/europe.geojson');
const countryNameMap = {
    "France": "France",
    "Sweden": "Sweden",
    "Česko": "Czech Republic",
    "ITALIA": "Italy",
    "Polska": "Poland",
    "Greece": "Greece",
    "Sverige": "Sweden",
    "Österreich": "Austria",
    "ESPAÑA": "Spain",
    "UnitedKingdom": "United Kingdom",
    "Suomi/Finland": "Finland",
    "Magyarország": "Hungary",
    "Nederland": "Netherlands",
    "Danmark": "Denmark",
    "Latvija": "Latvia",
    "Κύπρος": "Cyprus",
    "Belgique/België": "Belgium",
    "Slovensko": "Slovakia",
    "Germany": "Germany"
};

function TopCountries(props) {
    const [countryFrequencyMap, setCountryFrequencyMap] = useState([]);
    const [colorMaxScale, setColorMaxScale] = useState(0);
    const [standardizedData, setStandardizedData] = useState([]);
    const [hoveredCountry, setHoveredCountry] = useState(null);

    var colorScale = scaleLinear()
            .domain([0, colorMaxScale])
            .range(["#e0f3f8", "#005824"]);
    
    
    useEffect(() => {
        if(props.data && props.data.length>0){
            //set data for bar chart
            const updatedData = props.data.map(item => {
                const standardizedCountry = countryNameMap[item.country] || item.country;
                return { ...item, country: standardizedCountry };
            });
            setStandardizedData(updatedData);

            //set data for graph
            var countryFrequencyMapNew = props.data.reduce((acc, item) => {
                const standardizedCountry = countryNameMap[item.country] || item.country;
                acc[standardizedCountry] = item.frequency;
                return acc;
            }, {});
            setCountryFrequencyMap(countryFrequencyMapNew);
            var maxFrequencyValue = Math.max(
                ...props.data.map((item) => item.frequency)
            );
            setColorMaxScale(maxFrequencyValue);
        }
    }, [props.data]);


    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h6">Countries</CardTitle>
            </CardHeader>
            <CardBody>
                {props.data && props.data.length>0 && 
                    <Row>
                        <Col sm="12" md="6">
                            <ComposableMap
                                projection="geoMercator"
                                projectionConfig={{
                                    scale: 550, // Adjust to zoom in/out
                                    center: [10, 56], // Adjust to center the EU (longitude, latitude)
                                }}
                                style={{width: "100%", height: "500px"}}
                            >
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => {
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
                                                                : "red",
                                                            outline: "none",
                                                        },
                                                    }}
                                                />
                                            );
                                        })
                                    }
                                </Geographies>
                            </ComposableMap>
                        </Col>

                        <Col sm="12" md="6" style={{margin:"auto"}}>
                            <ResponsiveContainer width="100%" height={standardizedData.length * 60}>
                                <BarChart
                                    data={standardizedData}
                                    layout="vertical"
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    barSize={30}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="country" type="category" width={100} />
                                    <Tooltip />
                                    <Bar dataKey="frequency" fill="#f39423"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </Col>
                    </Row>
                }

                {/* Display hover info when a country is hovered */}
                {hoveredCountry && (
                    <div
                        style={{
                            position: "absolute",
                            top: 50,  // Adjust position as needed
                            left: 50, // Adjust position as needed
                            padding: "10px",
                            backgroundColor: "#f4f4f4",
                            borderRadius: "5px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                            pointerEvents: "none",  // Ensure it doesn't block other events
                        }}
                    >
                        <h5>{hoveredCountry.name}</h5>
                        <p>Frequency: {hoveredCountry.frequency}</p>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

export default TopCountries;