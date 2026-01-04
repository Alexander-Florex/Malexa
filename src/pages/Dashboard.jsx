import React from "react";
import { useAuth } from "../auth/AuthContext";
import AdminDashboard from "./AdminDashboard";
import StaffDashboard from "./StaffDashboard.jsx";

export default function Dashboard() {
    const { user } = useAuth();

    if (user?.role === "admin") {
        return <AdminDashboard />;
    }

    return <StaffDashboard />;
}