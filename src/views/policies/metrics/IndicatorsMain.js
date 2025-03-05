import React, { useState, useEffect } from "react";
import axios from "axios";
import Indicator from "./Indicator"; // Import the Indicator component
import "./css/IndicatorsMain.css";


const IndicatorsMain = () => {
  const [expandedIndicatorId, setExpandedIndicatorId] = useState(null);
  const [data, setData] = useState([]);
  const [indicatorNames, setIndicatorNames] = useState([]);
  const [apiResponses, setApiResponses] = useState([]);
  const [newIndicatorName, setNewIndicatorName] = useState("");
  const [newIndicatorSymbol, setNewIndicatorSymbol] = useState("");

  const createIndicator = () => {
    const apiUrl = `${process.env.REACT_APP_API_URL_KPI}/indicator`;

    const data = {
      name: newIndicatorName,
      symbol: newIndicatorSymbol,
    };

    const config = {
      method: "post",
      url: apiUrl,
      data: data,
    };

    axios(config)
      .then(function (response) {
        console.log(response.data);
        window.location.reload();
      })
      .catch(function (error) {
        console.log("Error:", error);
      });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requestOptions = {
          method: "GET",
          redirect: "follow",
        };

        // Step 1: Make an initial API call to fetch the JSON table
        const response = await fetch(
          process.env.REACT_APP_API_URL_KPI + `/indicator/all`,
          requestOptions
        );
        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) {
          const indicatorNames = result.map((item) => item.name);
          setIndicatorNames(indicatorNames);

          // Step 2: Iterate through the JSON table and make API calls
          const apiPromises = indicatorNames.map(async (indName) => {
            const apiResponse = await fetch(
              process.env.REACT_APP_API_URL_KPI + `/report/indicator?indicatorName=${indName}`,
              requestOptions
            );
            return apiResponse.json();
          });

          // Step 3: Wait for all API calls to complete and update state
          const responses = await Promise.all(apiPromises);
          const newData = responses.map((response, i) => ({
            indicator_name: indicatorNames[i],
            indicator_data: response,
          }));
          setData(newData);
          setApiResponses(responses);
        } else {
          console.log("API response is empty or not an array:", result);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []); // Empty dependency array to run once on component mount

  const toggleIndicator = (indicatorId) => {
    setExpandedIndicatorId((prevId) =>
      prevId === indicatorId ? null : indicatorId
    );
  };

  return (
    <div className="Indicator main_container">
      <div className="new-indicator-section">
        <input
          type="text"
          placeholder="Indicator Name"
          value={newIndicatorName}
          onChange={(e) => setNewIndicatorName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Indicator Symbol"
          value={newIndicatorSymbol}
          onChange={(e) => setNewIndicatorSymbol(e.target.value)}
        />
        <button onClick={createIndicator}>Create New Indicator</button>
      </div>

      {data.map((indicator_component) => (
        <div className={"indicator_component_panel"}>
          <div
            key={indicator_component.indicator_name}
            onClick={() => toggleIndicator(indicator_component.indicator_name)}
            className={`indicator-button ${
              expandedIndicatorId === indicator_component.indicator_name
                ? "active"
                : ""
            }`}
          >
            {indicator_component.indicator_name}
          </div>
          {expandedIndicatorId === indicator_component.indicator_name && (
            <Indicator
              indicatorName={indicator_component.indicator_name}
              jsonData={indicator_component.indicator_data}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default IndicatorsMain;
