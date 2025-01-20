import EducationAccount from "views/EducationAccount"
import Configuration from "views/dataConfiguration/Configuration"

var routes = [
  {
    path: "/account",
    name: "My University",
    icon: "nc-icon nc-single-02",
    component: <EducationAccount />,
    layout: "/education",
  },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-bank",
    component: <Configuration />,
    layout: "/education",
  },
];
export default routes;
