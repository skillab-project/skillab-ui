import React from "react";
import ReactApexChart from "react-apexcharts";

import { KU_NAMES, KU_DESCRIPTIONS, normalizeKuId } from "../../../../utils/kuInfo";

// KU metadata lives in a shared module so every KU view shows the same info;
// re-exported here so existing imports from this file keep working.
export { KU_NAMES, KU_DESCRIPTIONS, normalizeKuId };

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
  const step = Math.max(Math.floor(maxKuCount / 4), 1);

  const options = {
    chart: {
      type: "heatmap",
      toolbar: { show: false },
    },
    legend: { show: false },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.8,
        radius: 0,
        enableShades: true,
        useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            { from: 0, to: 0, color: "#FFFFFF" },
            { from: 1, to: step, color: "#b1e0a4" },
            { from: step + 1, to: step * 2, color: "#7bd470" },
            { from: step * 2 + 1, to: step * 3, color: "#398f2e" },
            { from: step * 3 + 1, to: maxKuCount, color: "#003d00" },
          ],
        },
      },
    },
    stroke: { width: 0.1 },
    dataLabels: { enabled: false },
    xaxis: { type: "category", categories: kus },
    tooltip: {
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const ku = kus[dataPointIndex];
        const key = normalizeKuId(ku);
        const name = KU_NAMES[key] || ku;
        const description = KU_DESCRIPTIONS[key] || "";
        const count = series[seriesIndex][dataPointIndex];
        const author = w.globals.seriesNames[seriesIndex];

        return `
          <div style="
            padding: 12px 16px;
            max-width: 360px;
            width: 360px;
            font-size: 13px;
            line-height: 1.6;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            white-space: normal;
            word-wrap: break-word;
            overflow-wrap: break-word;
          ">
            <div style="font-weight: 700; margin-bottom: 6px; color: #333;">
              ${ku} – ${name}
            </div>
            <div style="color: #555; margin-bottom: 8px; font-size: 12px; white-space: normal; word-wrap: break-word;">
              ${description}
            </div>
            <div style="color: #888; font-size: 12px;">
              <strong>Author:</strong> ${author}
            </div>
            <div style="color: #398f2e; font-weight: 600; margin-top: 4px;">
              Count: ${count}
            </div>
          </div>
        `;
      }
    }
  };

  return (
    <div id="chart">
      <ReactApexChart options={options} series={series} type="heatmap" />
    </div>
  );
};

export default Heatmap;