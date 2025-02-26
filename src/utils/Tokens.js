import {jwtDecode} from "jwt-decode";

export function isAuthenticated() {
  var token = localStorage.getItem("accessToken");
  var valid = false;
  if (token !== "" && token !== null) {
    var decoded = jwtDecode(token);
    if (Date.now() >= decoded.exp * 1000) {
      valid = false;
    } else {
      valid = true;
    }
  }
  console.log("valid: " + valid);
  return valid;
}

export function refreshToken() {
  var token = localStorage.getItem("refreshToken");
  //toDo
  //
}

export function isPrivileged() {
  var token = localStorage.getItem("accessToken");

  //token not valid
  if (token === "" || token === null) {
    return false;
  }

  //chech if user is PRIVILEGED
  var decoded = jwtDecode(token);
  console.log("decoded.roles " + decoded.roles);
  if (decoded.roles.includes("PRIVILEGED")) {
    return true;
  } else {
    return false;
  }
}

export function getEmail() {
  var token = localStorage.getItem("accessToken");
  if (token !== "" && token !== null) {
    var decoded = jwtDecode(token);
    return decoded.sub;
  }
  return "";
}

export default isAuthenticated;