import React, { useState, useEffect  } from "react";
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
import axios from 'axios';


const geoUrl = require('../../assets/europe.geojson');

function TopCountries(props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allItems, setAllItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState({}); 

    const [frequencyData, setFrequencyData] = useState([]);
    const countryFrequencyMap = frequencyData.reduce((acc, item) => {
        acc[item.country] = item.frequency;
        return acc;
    }, {});
    const colorScale = scaleLinear()
            .domain([0, 100]) // Adjust based on your data
            .range(["#e0f3f8", "#005824"]);

    useEffect(() => {
        setFrequencyData([{ country: "France", frequency: 40 },
                            { country: "Germany", frequency: 100 },
                            { country: "Italy", frequency: 20 }]);
    },[]);


    const handleSelectItem = (selectedItem) => {
        setSelectedItem(selectedItem);
        setSearchTerm(selectedItem.label);
        setFilteredItems([]); // Clear suggestions
    };

    const getPlaceholder =()=>{
        if(props.type==="Occupations"){
            return "Type an occupation";
        }
        return "Type a skill";
    }

    // Fetch items when the user types 3 or more characters
    useEffect(() => {
        const fetchItems = async () => {
            if (searchTerm.length === 3) {
                setIsLoading(true);
                const accumulatedItems = [];
                let currentPage = 1;
                let hasMorePages = true;
    
                try {
                    while (hasMorePages) {
                        var response;
                        if(props.type==="Occupations"){
                            response = await axios.post(
                                process.env.REACT_APP_API_URL_TRACKER+'/api/occupations',
                                new URLSearchParams({
                                    'keywords': searchTerm
                                }),
                                {
                                    params: {
                                        'page': currentPage.toString(),
                                    },
                                    headers: {
                                        'accept': 'application/json',
                                    },
                                }
                            );
                        }
                        else{
                            response = await axios.post(
                                process.env.REACT_APP_API_URL_TRACKER+'/api/skills',
                                new URLSearchParams({
                                    'min_skill_level': '1',
                                    'keywords': searchTerm
                                }),
                                {
                                    params: {
                                        'page': currentPage.toString(),
                                    },
                                    headers: {
                                        'accept': 'application/json',
                                    },
                                }
                            );
                        }

                        if(response.data.items.length==0){
                            break;
                        }
    
                        const items = response.data.items.map((item) => ({
                            label: item.label,
                            id: item.id,
                        }));
                        accumulatedItems.push(...items);
                        currentPage += 1;
                    }
    
                    setAllItems(accumulatedItems);
                } catch (error) {
                    console.error('Error fetching items:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
    
        fetchItems();
    }, [searchTerm]);

    // Filter the list of itmes based on the current input
    useEffect(() => {
        if (searchTerm.length >= 3 && allItems.length > 0) {
            setFilteredItems(
                allItems.filter((item) =>
                    item.label.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredItems([]);
        }
    }, [searchTerm, allItems]);



    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h6">{props.type} per Contry</CardTitle>
                <CardSubtitle>
                    <input
                        id="skill-input"
                        type="text"
                        placeholder={getPlaceholder()}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            marginTop: '8px',
                            fontSize: '14px',
                        }}
                    />
                    {isLoading && (
                        <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                            Loading...
                        </div>
                    )}
                    {filteredItems.length > 0 && (
                        <ul
                            style={{
                                listStyleType: 'none',
                                padding: 0,
                                margin: 0,
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                position: 'absolute',
                                background: '#fff',
                                width: '95%',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                zIndex: 1000,
                            }}
                        >
                            {filteredItems.map((item) => (
                                <li
                                    key={item.id}
                                    onClick={() => handleSelectItem(item)}
                                    style={{
                                        padding: '10px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f0f0f0',
                                        background: '#fff',
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = '#f5f5f5')
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = '#fff')
                                    }
                                >
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardSubtitle>
            </CardHeader>
            <CardBody>
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
                                    const { NAME } = geo.properties; // Ensure NAME matches your frequencyData country key
                                    const frequency = countryFrequencyMap[NAME] || 0;

                                    return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        style={{
                                        default: { fill: colorScale(frequency), outline: "none" },
                                        hover: { fill: "#f00", outline: "none" },
                                        pressed: { fill: "#00f", outline: "none" },
                                        }}
                                    />
                                    );
                                })
                                }
                            </Geographies>
                        </ComposableMap>
                    </Col>

                    <Col sm="12" md="6">
                        Lolipop
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
}

export default TopCountries;