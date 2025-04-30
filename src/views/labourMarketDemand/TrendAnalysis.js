import React, { useState, useMemo, useRef, useEffect } from "react";
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


function TrendAnalysis({ data }) {
    // const [selectedCountries, setSelectedCountries] = useState([]);
    const [selectedCountries, setSelectedCountries] = useState(
        data.length > 0 ? [data[0].country] : []
    );
  
    // Get all available countries and sorted dates (as strings)
    const allCountries = useMemo(() => data.map(d => d.country), [data]);
    const allDates = useMemo(() => {
        const sample = data[0] || {};
        return Object.keys(sample)
            .filter(k => k !== "country")
            .sort((a, b) => parseInt(a) - parseInt(b));
    }, [data]);
  
    // Toggle selected countries
    const toggleCountry = (country) => {
        setSelectedCountries((prev) =>
            prev.includes(country)
            ? prev.filter((c) => c !== country)
            : [...prev, country]
        );
    };
  
    // Build chart data: one entry per date
    const chartData = allDates.map(date => {
        const entry = { date };
        data.forEach(({ country, ...values }) => {
            entry[country] = values[date] || 0;
        });
        return entry;
    });
  
    // Generate colors
    const generateColor = (index) => {
        const hue = (index * 137) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };
  
    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h5">Trend Analysis</CardTitle>
            </CardHeader>
            <CardBody>
                <div style={{ marginBottom: "20px", flexWrap: "wrap" }}>
                    {allCountries.map((country) => (
                    <button
                        key={country}
                        onClick={() => toggleCountry(country)}
                        style={{
                        marginRight: "10px",
                        marginBottom: "10px",
                        padding: "10px",
                        background: selectedCountries.includes(country)
                            ? "#8884d8"
                            : "#ddd",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        }}
                    >
                        {country}
                    </button>
                    ))}
                </div>
        
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" label={{ value: "Month", position: "insideBottomRight", offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {selectedCountries.map((country, index) => (
                            <Line
                            key={country}
                            type="monotone"
                            dataKey={country}
                            stroke={generateColor(index)}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardBody>
        </Card>
    );
  }

export default TrendAnalysis;