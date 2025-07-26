import IndustryAccount from "views/IndustryAccount";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import Configuration from "views/dataConfiguration/Configuration"
import EuGeneralPurposeStatistics from "views/EuGeneralPurposeStatistics"
import Artifacts from "views/industry/Artifacts";
import KnowleageUnits from "views/industry/KnowledgeUnits";

var routes = [
  {
    path: "/account",
    name: "My Organization",
    icon: "nc-icon nc-single-02",
    component: <IndustryAccount />,
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
        component: <SkillDemandMatrix />,
        layout: "/industry",
      },
      {
        path: "/demand-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <SkillDemandMatrix />,
        layout: "/industry",
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
        component: <SkillDemandMatrix />,
        layout: "/industry",
      },
      {
        path: "/supply-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <SkillDemandMatrix />,
        layout: "/industry",
      },
    ],
  },
  // {
  //   path: "/labour-market-demand",
  //   name: "Labour Market Demand",
  //   icon: "nc-icon nc-planet",
  //   component: <LabourMarketDemand />,
  //   layout: "/industry",
  // },
  // {
  //   path: "/skills-demand-matrix",
  //   name: "Skills Demand Matrix",
  //   icon: "nc-icon nc-vector",
  //   component: <SkillDemandMatrix />,
  //   layout: "/industry",
  // },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-settings",
    component: <Configuration />,
    layout: "/industry",
  },
];
export default routes;
