import CitizenAccount from "views/CitizenAccount";
import LabourMarketDemand from "views/labourMarketDemand/LabourMarketDemand"
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix"
import Configuration from "views/dataConfiguration/Configuration"

var routes = [
  {
    path: "/account",
    name: "My Account",
    icon: "nc-icon nc-single-02",
    component: <CitizenAccount />,
    layout: "/citizen",
  },
  {
    path: "/labour-market-demand",
    name: "Labour Market Demand",
    icon: "nc-icon nc-bank",
    component: <LabourMarketDemand />,
    layout: "/citizen",
  },
  {
    path: "/skills-demand-matrix",
    name: "Skills Demand Matrix",
    icon: "nc-icon nc-bank",
    component: <SkillDemandMatrix />,
    layout: "/citizen",
  },
  {
    path: "/Configuration",
    name: "Configuration",
    icon: "nc-icon nc-bank",
    component: <Configuration />,
    layout: "/citizen",
  }
];
export default routes;
