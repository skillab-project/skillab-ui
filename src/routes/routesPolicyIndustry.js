import Configuration from "views/configuration/Configuration";
import PolicyIndustryAccount from "views/PolicyIndustryAccount";
import ManagePolicies from "../views/policies/ManagePolicies";
import EuGeneralPurposeStatistics from "views/EuGeneralPurposeStatistics";
import DemandAnalytics from "views/demand/analytics/DemandAnalytics"
import DemandForecasting from "views/demand/forecasting/DemandForecasting"
import SupplyAnalytics from "views/supply/analytics/SupplyAnalytics"
import SupplyForecasting from "views/supply/forecasting/SupplyForecasting"
import TaxonomyManagement from "views/taxonomies/TaxonomyManagement";
import FutureTechnologyTrends from "views/policies/FutureTechnologyTrends";

var routes = [
  {
    path: "/account",
    name: "My Policies",
    icon: "nc-icon nc-single-02",
    component: <PolicyIndustryAccount />,
    layout: "/policy-industry",
  },
  {
    path: "/account/manage-policies",
    name: "Manage Policies",
    icon: "nc-icon nc-single-02",
    component: <ManagePolicies />,
    layout: "/policy-industry",
  },
  {
    path: "/account/taxonomy",
    name: "Taxonomy",
    icon: "nc-icon nc-single-02",
    component: <TaxonomyManagement />,
    layout: "/policy-industry",
  },
  {
    path: "/account/future-technology-trends",
    name: "Future Technology Trends",
    icon: "nc-icon nc-single-02",
    component: <FutureTechnologyTrends />,
    layout: "/policy-industry",
  },
  {
    name: "Demand",
    isCategory: true, 
    children: [
      {
        path: "/demand-analytics",
        name: "Analytics",
        icon: "nc-icon nc-zoom-split",
        component: <DemandAnalytics />,
        layout: "/policy-industry",
      },
      {
        path: "/demand-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <DemandForecasting />,
        layout: "/policy-industry",
      },
    ],
  },
  {
    name: "Supply",
    isCategory: true,
    children: [
      {
        path: "/supply-analytics",
        name: "Analytics",
        icon: "nc-icon nc-zoom-split",
        component: <SupplyAnalytics />,
        layout: "/policy-industry",
      },
      {
        path: "/supply-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <SupplyForecasting />,
        layout: "/policy-industry",
      },
    ],
  },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-settings",
    component: <Configuration />,
    layout: "/policy-industry",
  },
];
export default routes;
