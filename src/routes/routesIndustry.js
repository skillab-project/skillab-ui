import IndustryAccount from "views/IndustryAccount";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import Configuration from "views/dataConfiguration/Configuration"
import EuGeneralPurposeStatistics from "views/EuGeneralPurposeStatistics"
import Artifacts from "views/industry/Artifacts";
import KnowleageUnits from "views/industry/KnowledgeUnits";
import DemandAnalytics from "views/demand/analytics/DemandAnalytics"
import DemandForecasting from "views/demand/forecasting/DemandForecasting"
import SupplyAnalytics from "views/supply/analytics/SupplyAnalytics"
import SupplyForecasting from "views/supply/forecasting/SupplyForecasting"
import GapCompetition from "views/industry/GapCompetition";

var routes = [
  {
    path: "/account",
    name: "My Organization",
    icon: "nc-icon nc-single-02",
    component: <IndustryAccount />,
    layout: "/industry",
  },
  {
    path: "/account/gap-competition",
    name: "Gap With Competition",
    icon: "nc-icon nc-single-02",
    component: <GapCompetition />,
    layout: "/industry",
  },
  {
    path: "/account/artifacts",
    name: "My Artifacts",
    icon: "nc-icon nc-single-02",
    component: <Artifacts />,
    layout: "/industry",
  },
  {
    path: "/account/ku",
    name: "Employee KU",
    icon: "nc-icon nc-single-02",
    component: <KnowleageUnits />,
    layout: "/industry",
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
        layout: "/citizen",
      },
      {
        path: "/demand-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <DemandForecasting />,
        layout: "/citizen",
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
        layout: "/citizen",
      },
      {
        path: "/supply-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <SupplyForecasting />,
        layout: "/citizen",
      },
    ],
  },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-settings",
    component: <Configuration />,
    layout: "/industry",
  },
];
export default routes;
