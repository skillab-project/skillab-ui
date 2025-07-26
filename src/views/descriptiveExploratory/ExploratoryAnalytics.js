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

const InfoTable = ({ data, selectedSkills }) => {
  return (
    <div style={{ overflowX: "auto", marginTop: "20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Country</th>
            {selectedSkills.map((skill) => (
              <th key={skill} style={{ border: "1px solid #ddd", padding: "8px" }}>
                {skill}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.country}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.country}</td>
              {selectedSkills.map((skill) => (
                <td
                  key={skill}
                  style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}
                >
                  {row[skill]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function ExploratoryAnalytics(props) {
    const [dataExploratory, setDataExploratory] = useState(props.data);
    const [allSkillsExploratory, setAllSkillsExploratory] = useState([]);
    const [visibleSkillsExploratory, setVisibleSkillsExploratory] = useState([]);
    const [visibleSkillsExploratoryNumber, setVisibleSkillsExploratoryNumber] = useState([]);
    const [visibleRange, setVisibleRange] = useState([0, 4]);
    const [selectedSkills, setSelectedSkills] = useState([]);


    const handleSliderChange = (event) => {
            const value = parseInt(event.target.value, 10);
            setVisibleRange([value, value + 4]); // Show 4 countries at a time
        };
    const toggleskill = (skill) => {
            setSelectedSkills((prev) =>
            prev.includes(skill)
                ? prev.filter((item) => item !== skill)
                : [...prev, skill]
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
        var allSkills= Object.keys(dataExploratory[0]).filter((key) => key !== "country");
        setAllSkillsExploratory(allSkills);
        setVisibleSkillsExploratory(allSkills.slice(0,10));
        setVisibleSkillsExploratoryNumber(10);
        setSelectedSkills([allSkills[0],allSkills[1]]);
      }
    }, []);


    const handleMoreSkills = () => {
      setVisibleSkillsExploratory(allSkillsExploratory.slice(0, visibleSkillsExploratoryNumber+10));
      setVisibleSkillsExploratoryNumber(visibleSkillsExploratoryNumber+10);
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h5">Exploratory Analytics</CardTitle>
            </CardHeader>
            <CardBody>
              {allSkillsExploratory.length>0 &&
                <>
                  {/* Filter Buttons */}
                  <div style={{ marginBottom: "20px" }}>
                      {visibleSkillsExploratory.map((skill) => (
                      <button
                          key={skill}
                          onClick={() => toggleskill(skill)}
                          style={{
                          marginRight: "10px",
                          marginBottom: "5px",
                          padding: "5px",
                          background: selectedSkills.includes(skill)
                              ? "#8884d8"
                              : "#ddd",
                          color: "#fff",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          }}
                      >
                          {skill}
                      </button>
                      ))}
                  </div>

                  <div>
                    <Button
                        color="success"
                        outline
                        size="m"
                        onClick={() => handleMoreSkills()}
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

                      {selectedSkills.map((skill,index) => (
                          <Bar
                          key={skill}
                          dataKey={skill}
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
                  {showTable && <InfoTable data={dataExploratory} selectedSkills={selectedSkills} />}
                </>
              }
            </CardBody>
        </Card>
    );
}

export default ExploratoryAnalytics;