import React, { useState, useEffect } from "react";
import Metric from "./Metric"; // Import the Metric component
import "./css/KPIsMain.css";


const KPIsMain = ({}) => {
  // Initialize state to track which Metric is expanded
  const [expandedMetricId, setExpandedMetricId] = useState(null);
  const [data, setData] = useState([]);
  const [metricNames, setMetricNames] = useState([]);
  const [apiResponses, setApiResponses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requestOptions = {
          method: "GET",
          redirect: "follow",
        };

        // Step 1: Make an initial API call to fetch the JSON table
        const response = await fetch(
          process.env.REACT_APP_API_URL_KPI + "/metric/all",
          requestOptions
        );
        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) {
          const metricNames = result.map((item) => item.name);
          setMetricNames(metricNames);

          // Step 2: Iterate through the JSON table and make API calls
          const apiPromises = metricNames.map(async (metricName) => {
            const apiResponse = await fetch(
              process.env.REACT_APP_API_URL_KPI + `/report/metric?metricName=${metricName}`,
              requestOptions
            );
            return apiResponse.json();
          });

          // Step 3: Wait for all API calls to complete and update state
          const responses = await Promise.all(apiPromises);
          const newData = responses.map((response, i) => ({
            metric_name: metricNames[i],
            metric_data: response,
          }));
          setData(newData);
          setApiResponses(responses);

          // console.log("responses --> " + JSON.stringify(responses));
          // console.log("newData --> " + JSON.stringify(newData));
        } else {
          console.log("API response is empty or not an array:", result);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []); // Empty dependency array to run once on component mount

  // Function to toggle the expanded state of an Metric
  const toggleMetric = (metricId) => {
    setExpandedMetricId((prevId) => (prevId === metricId ? null : metricId));
  };

  return (
    <div className="Metric main_container">
      {data.map((metric_component) => (
        <div className={"metric_component_panel"}>
          <div
            key={metric_component.metric_name}
            onClick={() => toggleMetric(metric_component.metric_name)}
            className={`metric-button ${
              expandedMetricId === metric_component.metric_name ? "active" : ""
            }`}
          >
            {metric_component.metric_name}
          </div>
          {expandedMetricId === metric_component.metric_name && (
            <Metric data={metric_component.metric_data} />
          )}
        </div>
      ))}
    </div>
  );
};

export default KPIsMain;
