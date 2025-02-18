import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Button
} from "reactstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function GroupLevel({ data }) {
  const [dataSkills, setDataSkills] = useState([]);
  const [visibleItems, setVisibleItems] = useState(10);
  const selectedOccupations = ["rank","skill", "priority"];

  const handleLoadMore = () => {
    setVisibleItems((prev) => prev + 10);
  };

  useEffect(() => {
    if (data && data.length > 0) {
      const mappedData = data
        .map((item) => ({
          skill: item.skill,
          priority: (item.normalized_priority * 100).toFixed(2),
          rank: item.rank
        }))
        .sort((a, b) => a.rank - b.rank);
      setDataSkills(mappedData);
    }
  }, [data]);


  return (
    <Row>
      <Col md="12">
        <Card>
          <CardHeader>
            <CardTitle tag="h5">Level {data[0]?.level}</CardTitle>
          </CardHeader>
          <CardBody>
            <Row>
              <Col lg="12" xl="6">
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "20px"
                  }}
                >
                  <thead>
                    <tr>
                      {selectedOccupations.map((skill) => (
                        <th
                          key={skill}
                          style={{ border: "1px solid #ddd", padding: "8px" }}
                        >
                          {skill === "priority" ? "priority %" : skill}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataSkills.slice(0, visibleItems).map((row) => (
                      <tr key={row.skill}>
                        {selectedOccupations.map((skill) => (
                          <td
                            key={skill}
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              textAlign: "center"
                            }}
                          >
                            {row[skill]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Col>

              <Col lg="12" xl="6" style={{ marginTop: "5px" }}>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(300, visibleItems * 60)} // Adjust height based on items
                >
                  <BarChart
                    data={dataSkills.slice(0, visibleItems)} // Show only visible items
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    barSize={30}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="skill" type="category" width={200} />
                    <Tooltip />
                    <Bar dataKey="priority" fill="#f39423" />
                  </BarChart>
                </ResponsiveContainer>
              </Col>
            </Row>

            <Row>
              <Col md="12">
                {/* Load More Button */}
                {visibleItems < dataSkills.length && (
                  <div style={{ textAlign: "center", marginTop: "10px" }}>
                    <Button color="info" onClick={handleLoadMore}>
                      Load More
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}

export default GroupLevel;
