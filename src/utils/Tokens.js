import {jwtDecode} from "jwt-decode";

export async function isAuthenticated() {
  let token = localStorage.getItem("accessTokenSkillab");
  
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
  const refreshToken = localStorage.getItem("refreshTokenSkillab");

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
      localStorage.setItem("accessTokenSkillab", data.accessToken);
      localStorage.setItem("refreshTokenSkillab", data.refreshToken);
      return data.accessToken;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
  }

  return null;
}

export function isPrivileged() {
  var token = localStorage.getItem("accessTokenSkillab");

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
  var token = localStorage.getItem("accessTokenSkillab");
  if (token !== "" && token !== null) {
    var decoded = jwtDecode(token);
    return decoded.sub;
  }
  return "";
}

export async function getId() {
  var token = localStorage.getItem("accessTokenSkillab");
  if (token !== "" && token !== null) {
    var decoded = jwtDecode(token);
    return decoded.id;
  }
  return "";
}

export async function getOrganization() {
  var token = localStorage.getItem("accessTokenSkillab");
  if (token !== "" && token !== null) {
    var decoded = jwtDecode(token);
    return decoded.organization;
  }
  return "";
}

export async function getInstallation() {
  var token = localStorage.getItem("accessTokenSkillab");
  if (token !== "" && token !== null) {
    var decoded = jwtDecode(token);
    return decoded.installation;
  }
  return "";
}

// ---- Education installation: the user's own university (stored as extraInfo JSON) ----
// extraInfo shape: {"universityName": "...", "country": "..."}

export async function getUserUniversity() {
  const token = localStorage.getItem("accessTokenSkillab");
  const id = await getId();
  if (!token || !id) return null;
  try {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const user = await res.json();
    if (!user || !user.extraInfo) return null;
    let info;
    try {
      info = JSON.parse(user.extraInfo);
    } catch (e) {
      return null;
    }
    const universityName = info.universityName || info.university || "";
    const country = info.country || info.universityCountry || "";
    if (!universityName && !country) return null;
    return { universityName, country };
  } catch (e) {
    console.error("getUserUniversity failed", e);
    return null;
  }
}

export async function saveUserUniversity(universityName, country) {
  const token = localStorage.getItem("accessTokenSkillab");
  const id = await getId();
  if (!token || !id) throw new Error("Not authenticated");
  const extraInfo = JSON.stringify({
    universityName: universityName || "",
    country: country || "",
  });
  const url =
    `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user/${id}` +
    `?extraInfo=${encodeURIComponent(extraInfo)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Save failed (${res.status})`);
  }
  return res.json().catch(() => null);
}
