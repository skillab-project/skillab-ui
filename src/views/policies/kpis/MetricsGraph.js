import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MetricsGraph = ({ data }) => {
  if (!data || data.length === 0) {
    // Handle the case when data is empty or undefined
    return <div className="metrics-graph">No data available</div>;
  }

  return (
    <div className="metrics-graph">
      {/* <h2>{data.length > 0 && data[0].metric.name}</h2> */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name={data[0].metric.indicatorList[0].name}
            stroke="#8884d8"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricsGraph;
