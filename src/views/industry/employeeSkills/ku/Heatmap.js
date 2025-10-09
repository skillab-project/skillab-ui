import React from "react";
import ReactApexChart from "react-apexcharts";

const Heatmap = ({ analysisResults }) => {
  const authors = Array.from(new Set(analysisResults.map((result) => result.author)));

  // Create a unique list of kus and sort them numerically
  const kus = Array.from(new Set(analysisResults.flatMap((result) => Object.keys(result.detected_kus))))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      return numA - numB;
    });

  // Build multiple series (one per developer) but with a single color scale
  const series = authors.map((author) => {
    const data = kus.map((ku) => {
      const kuCount = analysisResults
        .filter((result) => result.author === author)
        .reduce((acc, result) => acc + (result.detected_kus[ku] || 0), 0);
      return { x: ku, y: kuCount };
    });
    return { name: author, data };
  });

  // Get min and max KU counts across all developers for consistent coloring
  const allKuCounts = series.flatMap((s) => s.data.map((d) => d.y));
  const maxKuCount = Math.max(...allKuCounts);
  const step = Math.max(Math.floor(maxKuCount / 4), 1); // Dynamically adjust step size

  const options = {
    chart: {
      type: "heatmap",
      toolbar: { show: false },
    },
    legend: { show: false }, // Hide the legend
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.8, // Increase contrast
        radius: 0,
        enableShades: true,
        useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            { from: 0, to: 0, color: "#FFFFFF" }, // White for zero
            { from: 1, to: step, color: "#b1e0a4" }, // Very light green
            { from: step + 1, to: step * 2, color: "#7bd470" }, // Light green
            { from: step * 2 + 1, to: step * 3, color: "#398f2e" }, // Medium green
            { from: step * 3 + 1, to: maxKuCount, color: "#003d00" }, // Dark green
          ],
        },
      },
    },
    stroke: { width: 0.1 },
    dataLabels: { enabled: false },
    xaxis: { type: "category", categories: kus },
  };

  return (
    <div id="chart">
      <ReactApexChart options={options} series={series} type="heatmap" />
    </div>
  );
};

export default Heatmap;