import IndustryAccount from "views/IndustryAccount";
import LabourMarketDemand from "views/labourMarketDemand/LabourMarketDemand";
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
    path: "/labour-market-demand",
    name: "Labour Market Demand",
    icon: "nc-icon nc-bank",
    component: <LabourMarketDemand />,
    layout: "/industry",
  },
  {
    path: "/skills-demand-matrix",
    name: "Skills Demand Matrix",
    icon: "nc-icon nc-bank",
    component: <SkillDemandMatrix />,
    layout: "/industry",
  },
  {
    path: "/eu-general-purpose-statistics",
    name: "EU General-Purpose Statistics",
    icon: "nc-icon nc-bank",
    component: <EuGeneralPurposeStatistics />,
    layout: "/industry",
  },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-bank",
    component: <Configuration />,
    layout: "/industry",
  },
];
export default routes;
