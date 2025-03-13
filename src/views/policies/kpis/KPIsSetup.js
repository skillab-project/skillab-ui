import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/KPIsSetup.css";

const KPIsSetup = () => {
  const [equation, setEquation] = useState(""); // State to store the equation
  const [newMetricName, setNewMetricName] = useState("");
  const [newMetricDescription, setNewMetricDescription] = useState("");
  const [metrics, setMetrics] = useState([]);
  const [indicators, setIndicators] = useState([]);

  const handleButtonClicked = (text) => {
      setEquation((prevEquation) => prevEquation + " " + text);
  };

  const handleCreation = async () => {
    const myHeaders = {
      "Content-Type": "application/json"
    };

    const requestData = {
      name: newMetricName,
      equation: equation,
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL_KPI}/metric`,
        requestData,
        {
          headers: myHeaders,
        }
      );

      console.log(response.data);

      // Refresh the page after the request succeeds
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    const fetchIndicatorData = async () => {
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
          // const indicatorNames = result.map((item) => item.name);
          // setIndicatorNames(indicatorNames);
          setIndicators(result);
        } else {
          console.log("API response is empty or not an array:", result);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const fetchMetricData = async () => {
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
          setMetrics(result);
        } else {
          console.log("API response is empty or not an array:", result);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchIndicatorData();
    fetchMetricData();
  }, []); // Empty dependency array to run once on component mount

  return (
    <div className="metrics-setup">
      <div className="left">
        <h3 className="section-title">Existing KPIs</h3>
        {metrics.map((metric) => (
          <div key={metric.id}>
            <b>{metric.name}</b> = {metric.equation}
          </div>
        ))}
      </div>
      <div className="center">
        <h3 className="section-title">Create new KPI</h3>
        <input
          type="text"
          placeholder="New KPI name"
          value={newMetricName}
          onChange={(e) => setNewMetricName(e.target.value)}
        />
        {/* <input
          type="text"
          placeholder="New metric description"
          value={newMetricDescription}
          onChange={(e) => setNewMetricDescription(e.target.value)}
        /> */}
        <div className="seperator" />
        <textarea
          className="equation-input"
          type="text"
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          placeholder="Enter equation"
        />
        <div className="operators" >
          <button onClick={() => handleButtonClicked("+")}>+</button>
          <button onClick={() => handleButtonClicked("-")}>-</button>
          <button onClick={() => handleButtonClicked("*")}>*</button>
          <button onClick={() => handleButtonClicked("/")}>/</button>
          <button onClick={() => handleButtonClicked("%")}>%</button>
          <button onClick={() => handleButtonClicked("(")}>(</button>
          <button onClick={() => handleButtonClicked(")")}>)</button>
          <button onClick={() => handleButtonClicked("^")}>^</button>
        </div>

        <div className="seperator" />
        <button className="create-button" onClick={handleCreation}>
          Create KPI
        </button>
      </div>
      <div className="right">
        <h3 className="section-title">Available Metrics</h3>
        {indicators.map((indicator) => (
          <button
            key={indicator.id}
            onClick={() => handleButtonClicked(indicator.symbol)}
          >
            <b>{indicator.name}</b> - {indicator.symbol}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KPIsSetup;
