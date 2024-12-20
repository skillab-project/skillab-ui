import "./css/Indicator.css";
import React, { useState } from "react";
import IndicatorGraph from "./IndicatorGraph";
import IndicatorData from "./IndicatorData";
import AddData from "./AddData";

const Indicator = ({ indicatorName, jsonData }) => {
  const [data, setData] = useState(jsonData);

  // const handleDeleteItem = (id) => {
  //   const updatedData = data.filter((item) => item.id !== id);
  //   setData(updatedData);
  // };

  const handleAddSuccess = (newData) => {
    setData([...data, newData]);
  };

  const [activeTab, setActiveTab] = useState("Graph");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="Indicator">
      {/* <h1 className="indicator-name">{data[0].indicator.name}</h1> */}
      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === "Graph" ? "active" : ""}`}
          onClick={() => handleTabChange("Graph")}
        >
          Graph
        </button>
        <button
          className={`tab-button ${activeTab === "Data" ? "active" : ""}`}
          onClick={() => handleTabChange("Data")}
        >
          Data
        </button>
        <button
          className={`tab-button ${activeTab === "AddData" ? "active" : ""}`}
          onClick={() => handleTabChange("AddData")}
          // disabled={!scripts.isPrivileged()}
        >
          Add Data
        </button>
      </div>
      <div className="content">
        {activeTab === "Graph" && <IndicatorGraph data={data} />}
        {activeTab === "Data" && <IndicatorData data={data} />}
        {activeTab === "AddData" && (
          <AddData name={indicatorName} onAddSuccess={handleAddSuccess} />
        )}
      </div>
    </div>
  );
};

export default Indicator;
