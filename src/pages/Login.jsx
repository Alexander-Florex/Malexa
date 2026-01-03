import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Login.css";

const ROLE_META = {
    admin: {
        title: "Administrador",
        hint: "Acceso completo al sistema",
        icon: "bi bi-shield-lock-fill",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#667eea"
    },
    staff: {
        title: "Personal",
        hint: "Acceso limitado a funciones básicas",
        icon: "bi bi-person-badge-fill",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        color: "#f093fb"
    },
};

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState(1);
    const [role, setRole] = useState("admin");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const meta = ROLE_META[role];

    const handleQuickFill = (selectedRole) => {
        setRole(selectedRole);
        if (selectedRole === "admin") {
            setIdentifier("admin@malexa.com");
            setPassword("admin123");
        } else {
            setIdentifier("personal01");
            setPassword("staff123");
        }
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!identifier.trim() || !password) {
            setError("Por favor, completá todos los campos");
            return;
        }

        if (role === "admin") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(identifier.trim())) {
                setError("Formato de email inválido");
                return;
            }
        }

        try {
            setLoading(true);
            await login({ identifier, password, role, rememberMe: true });
            navigate("/");
        } catch (err) {
            setError(err.message || "Credenciales incorrectas");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToRoleSelection = () => {
        setStep(1);
        setError("");
        setIdentifier("");
        setPassword("");
        setShowPassword(false);
    };

    return (
        <div className="login-page">
            {/* Partículas de fondo animadas */}
            <div className="particles">
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
            </div>

            <div className="container-fluid h-100">
                <div className="row h-100 align-items-center justify-content-center">
                    <div className="col-12 col-xl-10">
                        <div className="login-card shadow-lg">
                            <div className="row g-0 h-100">
                                {/* Panel Izquierdo - Branding */}
                                <div className="col-lg-5 d-none d-lg-block">
                                    <div className="brand-panel h-100 d-flex flex-column justify-content-between p-5">
                                        <div className="brand-header">
                                            <div className="brand-logo mb-4">
                                                <div className="logo-hexagon">
                                                    <i className="bi bi-gem"></i>
                                                </div>
                                            </div>
                                            <h1 className="brand-title mb-3">MALEXA</h1>
                                            <p className="brand-subtitle mb-0">
                                                Sistema de gestión empresarial
                                            </p>
                                        </div>

                                        <div className="features-grid">
                                            <div className="feature-card">
                                                <i className="bi bi-speedometer2"></i>
                                                <span>Dashboard en tiempo real</span>
                                            </div>
                                            <div className="feature-card">
                                                <i className="bi bi-shield-check"></i>
                                                <span>Seguridad avanzada</span>
                                            </div>
                                            <div className="feature-card">
                                                <i className="bi bi-graph-up-arrow"></i>
                                                <span>Análisis inteligente</span>
                                            </div>
                                            <div className="feature-card">
                                                <i className="bi bi-cloud-check"></i>
                                                <span>Cloud & Sincronización</span>
                                            </div>
                                        </div>

                                        <div className="demo-credentials">
                                            <div className="demo-badge">
                                                <i className="bi bi-info-circle me-2"></i>
                                                <span>Demo: admin@malexa.com / admin123</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Panel Derecho - Formulario */}
                                <div className="col-lg-7">
                                    <div className="form-panel p-4 p-md-5">
                                        {step === 1 ? (
                                            /* PASO 1: Selección de Rol */
                                            <div className="role-selection-container">
                                                <div className="text-center mb-5">
                                                    <div className="step-badge mb-3">
                                                        <span>Paso 1 de 2</span>
                                                    </div>
                                                    <h2 className="form-title mb-2">Seleccioná tu rol</h2>
                                                    <p className="form-subtitle text-muted">
                                                        Elegí cómo vas a acceder al sistema
                                                    </p>
                                                </div>

                                                <div className="row g-4 mb-5">
                                                    {Object.entries(ROLE_META).map(([key, data]) => (
                                                        <div key={key} className="col-12">
                                                            <div
                                                                className={`role-card ${role === key ? 'active' : ''}`}
                                                                onClick={() => setRole(key)}
                                                                style={{
                                                                    '--role-gradient': data.gradient,
                                                                    '--role-color': data.color
                                                                }}
                                                            >
                                                                <div className="role-icon">
                                                                    <i className={data.icon}></i>
                                                                </div>
                                                                <div className="role-info">
                                                                    <h4 className="role-title mb-1">{data.title}</h4>
                                                                    <p className="role-description mb-0">{data.hint}</p>
                                                                </div>
                                                                <div className="role-check">
                                                                    <i className="bi bi-check-circle-fill"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    className="btn btn-primary btn-lg w-100 mb-4"
                                                    onClick={() => setStep(2)}
                                                    disabled={!role}
                                                >
                                                    Continuar
                                                    <i className="bi bi-arrow-right ms-2"></i>
                                                </button>

                                                <div className="quick-access-section">
                                                    <div className="divider mb-3">
                                                        <span>Acceso rápido para testing</span>
                                                    </div>
                                                    <div className="row g-2">
                                                        <div className="col-6">
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm w-100"
                                                                onClick={() => handleQuickFill("admin")}
                                                            >
                                                                <i className="bi bi-shield-lock me-2"></i>
                                                                Admin
                                                            </button>
                                                        </div>
                                                        <div className="col-6">
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm w-100"
                                                                onClick={() => handleQuickFill("staff")}
                                                            >
                                                                <i className="bi bi-person-badge me-2"></i>
                                                                Personal
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* PASO 2: Formulario de Login */
                                            <div className="login-form-container">
                                                <button
                                                    className="btn btn-link back-button mb-4 p-0"
                                                    onClick={handleBackToRoleSelection}
                                                    type="button"
                                                >
                                                    <i className="bi bi-arrow-left me-2"></i>
                                                    Volver
                                                </button>

                                                <div className="text-center mb-5">
                                                    <div className="selected-role-badge mb-3" style={{ background: meta.gradient }}>
                                                        <i className={meta.icon}></i>
                                                    </div>
                                                    <h2 className="form-title mb-2">Iniciar sesión</h2>
                                                    <p className="form-subtitle text-muted">
                                                        Ingresando como <strong>{meta.title}</strong>
                                                    </p>
                                                </div>

                                                <form onSubmit={handleSubmit} noValidate>
                                                    <div className="mb-4">
                                                        <label className="form-label fw-semibold">
                                                            {role === "admin" ? "Correo electrónico" : "Usuario"}
                                                        </label>
                                                        <div className="input-group input-group-lg">
                                                            <span className="input-group-text">
                                                                <i className={role === "admin" ? "bi bi-envelope" : "bi bi-person"}></i>
                                                            </span>
                                                            <input
                                                                type={role === "admin" ? "email" : "text"}
                                                                className={`form-control ${error ? 'is-invalid' : ''}`}
                                                                placeholder={role === "admin" ? "admin@malexa.com" : "usuario01"}
                                                                value={identifier}
                                                                onChange={(e) => {
                                                                    setIdentifier(e.target.value);
                                                                    setError("");
                                                                }}
                                                                disabled={loading}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <label className="form-label fw-semibold">
                                                            Contraseña
                                                        </label>
                                                        <div className="input-group input-group-lg">
                                                            <span className="input-group-text">
                                                                <i className="bi bi-lock"></i>
                                                            </span>
                                                            <input
                                                                type={showPassword ? "text" : "password"}
                                                                className={`form-control ${error ? 'is-invalid' : ''}`}
                                                                placeholder="••••••••"
                                                                value={password}
                                                                onChange={(e) => {
                                                                    setPassword(e.target.value);
                                                                    setError("");
                                                                }}
                                                                disabled={loading}
                                                            />
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                            >
                                                                <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {error && (
                                                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                                            <div>{error}</div>
                                                        </div>
                                                    )}

                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary btn-lg w-100 mb-3"
                                                        disabled={loading}
                                                        style={{ background: meta.gradient, border: 'none' }}
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                Ingresando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Iniciar sesión
                                                                <i className="bi bi-box-arrow-in-right ms-2"></i>
                                                            </>
                                                        )}
                                                    </button>

                                                    <div className="text-center">
                                                        <small className="text-muted">
                                                            ¿Problemas para ingresar?
                                                            <a href="#" className="text-decoration-none ms-1">Contactá al administrador</a>
                                                        </small>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}