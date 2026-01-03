import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Auth local para MALEXA.
 * - Persiste sesión en localStorage.
 * - Admin predefinido + usuarios staff creados dinámicamente.
 * - Listo para reemplazar por llamadas a tu backend.
 */

const AuthContext = createContext(null);

const LS_SESSION_KEY = "malexa.session.v1";
const LS_USERS_KEY = "malexa.users.v1";
const LS_PRODUCTS_KEY = "malexa.products.v1";

// Usuario administrador predefinido
const ADMIN_USER = {
    id: "admin",
    name: "Administrador",
    email: "admin@malexa.com",
    password: "admin123",
    role: "admin"
};

function safeJsonParse(value, fallback) {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

// Inicializar productos vacíos si no existen
function initializeStorage() {
    if (!localStorage.getItem(LS_PRODUCTS_KEY)) {
        localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(LS_USERS_KEY)) {
        localStorage.setItem(LS_USERS_KEY, JSON.stringify([]));
    }
}

function getUsers() {
    return safeJsonParse(localStorage.getItem(LS_USERS_KEY), []);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        initializeStorage();
        const saved = safeJsonParse(sessionStorage.getItem(LS_SESSION_KEY), null) ||
            safeJsonParse(localStorage.getItem(LS_SESSION_KEY), null);
        if (saved?.user) setUser(saved.user);
    }, []);

    const login = async ({ identifier, password, role, rememberMe }) => {
        // Simulamos latency para una UX más realista
        await new Promise((r) => setTimeout(r, 650));

        const normalized = (identifier || "").trim().toLowerCase();
        let match = null;

        if (role === "admin") {
            // Validar admin predefinido
            if (
                normalized === ADMIN_USER.email.toLowerCase() &&
                password === ADMIN_USER.password
            ) {
                match = ADMIN_USER;
            }
        } else if (role === "staff") {
            // Validar usuarios staff creados por el admin
            const users = getUsers();
            match = users.find(
                (u) =>
                    u.username.toLowerCase() === normalized &&
                    u.password === password &&
                    u.role === "staff"
            );
        }

        if (!match) {
            const error = new Error("Credenciales inválidas. Revisá usuario/email, rol y contraseña.");
            error.code = "INVALID_CREDENTIALS";
            throw error;
        }

        // Normalizar estructura de usuario
        const sessionUser = {
            id: match.id,
            name: match.name,
            email: match.email || null,
            username: match.username || null,
            role: match.role
        };

        setUser(sessionUser);

        if (rememberMe) {
            localStorage.setItem(LS_SESSION_KEY, JSON.stringify({ user: sessionUser, ts: Date.now() }));
        } else {
            // sesión "temporal": se guarda en sessionStorage
            sessionStorage.setItem(LS_SESSION_KEY, JSON.stringify({ user: sessionUser, ts: Date.now() }));
            localStorage.removeItem(LS_SESSION_KEY);
        }

        return sessionUser;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(LS_SESSION_KEY);
        sessionStorage.removeItem(LS_SESSION_KEY);
    };

    const value = useMemo(() => ({ user, login, logout }), [user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider/>");
    return ctx;
}