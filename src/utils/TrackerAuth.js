import {jwtDecode} from "jwt-decode";

export async function isAuthenticatedTracker() {
    let token = localStorage.getItem("accessTokenSkillabTracker");
    
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
        token = await authenticateTracker();
    }

    return !!token;
}

export async function authenticateTracker() {
    const response = await fetch(process.env.REACT_APP_API_URL_TRACKER+'/api/login', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'username': process.env.REACT_APP_API_URL_TRACKER_USERNAME,
            'password': process.env.REACT_APP_API_URL_TRACKER_PASSWORD
        })
    });
    if(response.status == 200) {
        var body = await response.json();
        localStorage.setItem("accessTokenSkillabTracker", body);
        return body;
    }
    return "";
}