import {jwtDecode} from "jwt-decode";

export async function isAuthenticated() {
  let token = localStorage.getItem("accessToken");
  
  if (!token) {
    return false;
  }

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch (e) {
    console.error("Invalid token");
    return false;
  }

  if (Date.now() >= decoded.exp * 1000) {
    console.log("Access token expired, refreshing...");
    token = await refreshToken();
  }

  return !!token;
}


export async function refreshToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    console.error("No refresh token available");
    return null;
  }

  try {
    const response = await fetch(process.env.REACT_APP_API_URL_USER_MANAGEMENT+"/user/token/refresh", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to refresh token");
      return null;
    }

    const data = await response.json();

    if (data.accessToken && data.refreshToken) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
  }

  return null;
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