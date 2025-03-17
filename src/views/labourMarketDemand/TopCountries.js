import React, { useState, useEffect  } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,Legend,LineChart,Line} from "recharts";
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
import { ComposableMap, Geographies, Geography, LabelList } from "react-simple-maps";
import { scaleLinear } from "d3-scale";


const geoUrl = require('../../assets/europe.geojson');
const countryNameMap = {
    "France": "France",
    "Sweden": "Sweden",
    "Česko": "Czech Republic",  // Standard English name
    "ITALIA": "Italy",  // Convert to standard English name
    "Polska": "Poland",  // Convert to English
    "Greece": "Greece",
    "Sverige": "Sweden",  // Duplicate, map to Sweden
    "Österreich": "Austria",  // Standard English name
    "ESPAÑA": "Spain",  // Convert to English
    "UnitedKingdom": "United Kingdom",  // Fix spacing
    "Suomi/Finland": "Finland",  // Use "Finland"
    "Magyarország": "Hungary",  // Convert to English
    "Nederland": "Netherlands",  // Convert to English
    "Danmark": "Denmark",  // Convert to English
    "Latvija": "Latvia",  // Convert to English
    "Κύπρος": "Cyprus",  // Convert to English
    "Belgique/België": "Belgium",  // Standard English name
    "Slovensko": "Slovakia",  // Convert to English
    "Germany": "Germany"
};

function TopCountries(props) {
    const [countryFrequencyMap, setCountryFrequencyMap] = useState([]);
    const [colorMaxScale, setColorMaxScale] = useState(0);
    const [standardizedData, setStandardizedData] = useState([]);
    
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
                                        const { NAME } = geo.properties; // Ensure NAME matches frequencyData country key
                                        const frequency = countryFrequencyMap[NAME] || 0;

                                        // Check if the country is present in the data
                                        const isCountryInData = NAME in countryFrequencyMap;

                                        return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            style={{
                                                default: {fill: isCountryInData
                                                    ? colorScale(frequency) // Scale for listed countries
                                                    : "red", // Red for unlisted countries
                                                    outline: "none",
                                                },
                                                // hover: { fill: "#f00", outline: "none" },
                                                // pressed: { fill: "#f00", outline: "none" },
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
            </CardBody>
        </Card>
    );
}

export default TopCountries;