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
                  {row[occupation]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

function ExploratoryAnalytics(props) {
    const [dataExploratory, setDataExploratory] = useState(props.data);
    const [allOccupationsExploratory, setAllOccupationsExploratory] = useState([]);
    const [visibleOccupationsExploratory, setVisibleOccupationsExploratory] = useState([]);
    const [visibleOccupationsExploratoryNumber, setVisibleOccupationsExploratoryNumber] = useState([]);
    const [visibleRange, setVisibleRange] = useState([0, 4]);
    const [selectedOccupations, setSelectedOccupations] = useState([]);


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

    const generateColor = (index) => {
        const hue = (index * 137) % 360; // Golden ratio for evenly spaced hues
        return `hsl(${hue}, 70%, 50%)`;
    };


    useEffect(() => {
      if(dataExploratory){
        var allOccupations= Object.keys(dataExploratory[0]).filter((key) => key !== "country");
        setAllOccupationsExploratory(allOccupations);
        setVisibleOccupationsExploratory(allOccupations.slice(0,10));
        setVisibleOccupationsExploratoryNumber(10);
        setSelectedOccupations([allOccupations[0],allOccupations[1]]);
      }
    }, []);


    const handleMoreOccupations = () => {
      setVisibleOccupationsExploratory(allOccupationsExploratory.slice(0, visibleOccupationsExploratoryNumber+10));
      setVisibleOccupationsExploratoryNumber(visibleOccupationsExploratoryNumber+10);
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h5">Exploratory Analytics</CardTitle>
            </CardHeader>
            <CardBody>
              {allOccupationsExploratory.length>0 &&
                <>
                  {/* Filter Buttons */}
                  <div style={{ marginBottom: "20px" }}>
                      {visibleOccupationsExploratory.map((occupation) => (
                      <button
                          key={occupation}
                          onClick={() => toggleOccupation(occupation)}
                          style={{
                          marginRight: "10px",
                          marginBottom: "5px",
                          padding: "5px",
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

                  <div>
                    <Button
                        color="success"
                        outline
                        size="m"
                        onClick={() => handleMoreOccupations()}
                      >
                        More
                    </Button>
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
                </>
              }
            </CardBody>
        </Card>
    );
}

export default ExploratoryAnalytics;