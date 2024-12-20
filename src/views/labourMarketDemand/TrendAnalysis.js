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


function TrendAnalysis() {
    // Trend
    const dataTrend = [
      { date: "Jan-2022", Engineer: 20, Teacher: 30, Nurse: 25 },
      { date: "Feb-2022", Engineer: 22, Teacher: 28, Nurse: 27 },
      { date: "Mar-2022", Engineer: 25, Teacher: 26, Nurse: 30 },
      { date: "Apr-2022", Engineer: 23, Teacher: 24, Nurse: 32 },
      { date: "May-2022", Engineer: 27, Teacher: 22, Nurse: 35 },
      { date: "Jun-2022", Engineer: 29, Teacher: 20, Nurse: 38 },
      { date: "Jul-2022", Engineer: 30, Teacher: 18, Nurse: 40 },
      { date: "Aug-2022", Engineer: 28, Teacher: 19, Nurse: 42 },
      { date: "Sep-2022", Engineer: 26, Teacher: 21, Nurse: 39 },
      { date: "Oct-2022", Engineer: 24, Teacher: 23, Nurse: 36 },
      { date: "Nov-2022", Engineer: 22, Teacher: 25, Nurse: 34 },
      { date: "Dec-2022", Engineer: 20, Teacher: 28, Nurse: 31 },
    ];
    const allOccupationsTrend = Object.keys(dataTrend[0]).filter((key) => key !== "date");
    const [selectedOccupationsTrend, setSelectedOccupationsTrend] = useState([
          allOccupationsTrend[0],allOccupationsTrend[1]
      ]);
    const toggleOccupationTrend = (occupation) => {
      setSelectedOccupationsTrend((prev) =>
            prev.includes(occupation)
              ? prev.filter((item) => item !== occupation)
              : [...prev, occupation]
          );
        };

    //Generate Color
    const generateColor = (index) => {
        const hue = (index * 137) % 360; // Golden ratio for evenly spaced hues
        return `hsl(${hue}, 70%, 50%)`;
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h5">Trend Analysis</CardTitle>
                {/* <CardSubtitle>
                    Select ISCO Level: 
                    <select name="isco-levels" id="isco-levels">
                        <option value="">--choose an option--</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="2">3</option>
                        <option value="3">4</option>
                    </select>
                </CardSubtitle> */}
            </CardHeader>
            <CardBody>
                {/* Filter Buttons */}
                <div style={{ marginBottom: "20px" }}>
                    {allOccupationsTrend.map((occupation) => (
                    <button
                        key={occupation}
                        onClick={() => toggleOccupationTrend(occupation)}
                        style={{
                        marginRight: "10px",
                        padding: "10px",
                        background: selectedOccupationsTrend.includes(occupation)
                            ? "#8884d8"
                            : "#ddd",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        }}
                    >
                        {occupation}
                    </button>
                    ))}
                </div>

                {/* Line Chart */}
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                    data={dataTrend}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    {/* Dynamically Render Lines */}
                    {selectedOccupationsTrend.map((occupation,index) => (
                        <Line
                        key={occupation}
                        type="monotone"
                        dataKey={occupation}
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