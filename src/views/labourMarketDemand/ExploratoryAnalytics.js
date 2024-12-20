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

const InfoTable = ({ data, selectedOccupations }) => {
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Country</th>
            {selectedOccupations.map((occupation) => (
              <th key={occupation} style={{ border: "1px solid #ddd", padding: "8px" }}>
                {occupation}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.country}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.country}</td>
              {selectedOccupations.map((occupation) => (
                <td
                  key={occupation}
                  style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}
                >
                  {row[occupation]}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

function ExploratoryAnalytics() {
    const dataExploratory = [
        { country: "France", Engineer: 30, Teacher: 20, Nurse: 50 },
        { country: "Germany", Engineer: 40, Teacher: 25, Nurse: 35 },
        { country: "Italy", Engineer: 25, Teacher: 30, Nurse: 45 },
        { country: "Spain", Engineer: 35, Teacher: 20, Nurse: 45 },
        { country: "Poland", Engineer: 45, Teacher: 15, Nurse: 40 },
        { country: "Netherlands", Engineer: 20, Teacher: 35, Nurse: 45 },
        { country: "Belgium", Engineer: 30, Teacher: 40, Nurse: 30 },
        { country: "Sweden", Engineer: 50, Teacher: 20, Nurse: 30 },
    ];
    const allOccupationsExploratory = Object.keys(dataExploratory[0]).filter((key) => key !== "country");
    const [visibleRange, setVisibleRange] = useState([0, 4]);
    const [selectedOccupations, setSelectedOccupations] = useState([
            allOccupationsExploratory[0],allOccupationsExploratory[1]
        ]);
    const handleSliderChange = (event) => {
            const value = parseInt(event.target.value, 10);
            setVisibleRange([value, value + 4]); // Show 4 countries at a time
        };
    const toggleOccupation = (occupation) => {
            setSelectedOccupations((prev) =>
            prev.includes(occupation)
                ? prev.filter((item) => item !== occupation)
                : [...prev, occupation]
            );
        };
    const visibleData = dataExploratory.slice(visibleRange[0], visibleRange[1]);
    const [showTable, setShowTable] = useState(false);


    //Generate Color
    const generateColor = (index) => {
        const hue = (index * 137) % 360; // Golden ratio for evenly spaced hues
        return `hsl(${hue}, 70%, 50%)`;
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h5">Exploratory Analytics</CardTitle>
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
                    {allOccupationsExploratory.map((occupation) => (
                    <button
                        key={occupation}
                        onClick={() => toggleOccupation(occupation)}
                        style={{
                        marginRight: "10px",
                        padding: "10px",
                        background: selectedOccupations.includes(occupation)
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

                {/* Slider */}
                <input
                    type="range"
                    min={0}
                    max={dataExploratory.length - 4}
                    value={visibleRange[0]}
                    onChange={handleSliderChange}
                    style={{ width: "100%", marginBottom: "20px" }}
                />

                {/* Bar Chart */}
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                    data={visibleData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    {selectedOccupations.map((occupation,index) => (
                        <Bar
                        key={occupation}
                        dataKey={occupation}
                        fill={generateColor(index)}
                        />
                    ))}
                    </BarChart>
                </ResponsiveContainer>

                {/* More Info Button */}
                <button
                    onClick={() => setShowTable(!showTable)}
                    style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    background: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    }}
                >
                    {showTable ? "Hide Info" : "More Info"}
                </button>
                {/* Conditional Rendering of Table */}
                {showTable && <InfoTable data={visibleData} selectedOccupations={selectedOccupations} />}
            </CardBody>
        </Card>
    );
}

export default ExploratoryAnalytics;