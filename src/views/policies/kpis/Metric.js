import React, { useState } from "react";
import MetricsGraph from "./MetricsGraph";
import MetricData from "./MetricData";
import "./css/Metric.css";

const Metric = ({ data }) => {
  const [activeTab, setActiveTab] = useState("Graph");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="metric">
      <h2 className="metric-title">
        {data.length > 0 && data[0].metric.equation}
      </h2>
      <div className="tab-buttons">
        <button
          className={activeTab === "Graph" ? "active" : ""}
          onClick={() => handleTabClick("Graph")}
        >
          Graph
        </button>
        <button
          className={activeTab === "Data" ? "active" : ""}
          onClick={() => handleTabClick("Data")}
        >
          Data
        </button>
      </div>
      <div className="tab-content">
        {activeTab === "Graph" ? <MetricsGraph data={data} /> : null}
        {activeTab === "Data" ? <MetricData data={data} /> : null}
      </div>
    </div>
  );
};

export default Metric;
