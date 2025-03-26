import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "./utils/Tokens";

const ProtectedRoute = ({ element }) => {
    const [auth, setAuth] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
        const result = await isAuthenticated();
        setAuth(result);
        };
        checkAuth();
    }, []);


    //While authentication is being checked
    if (auth === null) {
        return <div>Loading...</div>;
    }

    return auth ? element : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
