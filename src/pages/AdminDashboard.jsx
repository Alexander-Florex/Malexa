import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import "./Dashboard.css";

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("productos");

    // Estados para Usuarios
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        username: "",
        password: "",
        name: "",
        role: "staff"
    });

    // Estados para Productos
    const [products, setProducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        nombre: "",
        cantidad: "",
        precioUnidad: "",
        precioCombo: "",
        foto: ""
    });
    const [imagePreview, setImagePreview] = useState(null);

    // Cargar datos del localStorage al montar
    useEffect(() => {
        const storedUsers = localStorage.getItem("malexa.users.v1");
        const storedProducts = localStorage.getItem("malexa.products.v1");

        if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
        }

        if (storedProducts) {
            setProducts(JSON.parse(storedProducts));
        }
    }, []);

    // ========================================
    // FUNCIONES DE USUARIOS
    // ========================================
    const handleUserSubmit = (e) => {
        e.preventDefault();

        if (editingUser) {
            const updatedUsers = users.map(u =>
                u.id === editingUser.id ? { ...u, ...userForm } : u
            );
            setUsers(updatedUsers);
            localStorage.setItem("malexa.users.v1", JSON.stringify(updatedUsers));
        } else {
            const newUser = {
                id: Date.now(),
                ...userForm,
                createdAt: new Date().toISOString()
            };
            const updatedUsers = [...users, newUser];
            setUsers(updatedUsers);
            localStorage.setItem("malexa.users.v1", JSON.stringify(updatedUsers));
        }

        closeUserModal();
    };

    const openUserModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setUserForm({
                username: user.username,
                password: "",
                name: user.name,
                role: user.role
            });
        } else {
            setEditingUser(null);
            setUserForm({
                username: "",
                password: "",
                name: "",
                role: "staff"
            });
        }
        setShowUserModal(true);
    };

    const closeUserModal = () => {
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({
            username: "",
            password: "",
            name: "",
            role: "staff"
        });
    };

    const deleteUser = (id) => {
        if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
            const updatedUsers = users.filter(u => u.id !== id);
            setUsers(updatedUsers);
            localStorage.setItem("malexa.users.v1", JSON.stringify(updatedUsers));
        }
    };

    // ========================================
    // FUNCIONES DE PRODUCTOS
    // ========================================
    const handleProductSubmit = (e) => {
        e.preventDefault();

        if (editingProduct) {
            const updatedProducts = products.map(p =>
                p.id === editingProduct.id ? { ...p, ...productForm } : p
            );
            setProducts(updatedProducts);
            localStorage.setItem("malexa.products.v1", JSON.stringify(updatedProducts));
        } else {
            const newProduct = {
                id: Date.now(),
                ...productForm,
                createdAt: new Date().toISOString()
            };
            const updatedProducts = [...products, newProduct];
            setProducts(updatedProducts);
            localStorage.setItem("malexa.products.v1", JSON.stringify(updatedProducts));
        }

        closeProductModal();
    };

    const openProductModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setProductForm({
                nombre: product.nombre,
                cantidad: product.cantidad,
                precioUnidad: product.precioUnidad,
                precioCombo: product.precioCombo,
                foto: product.foto
            });
            setImagePreview(product.foto);
        } else {
            setEditingProduct(null);
            setProductForm({
                nombre: "",
                cantidad: "",
                precioUnidad: "",
                precioCombo: "",
                foto: ""
            });
            setImagePreview(null);
        }
        setShowProductModal(true);
    };

    const closeProductModal = () => {
        setShowProductModal(false);
        setEditingProduct(null);
        setProductForm({
            nombre: "",
            cantidad: "",
            precioUnidad: "",
            precioCombo: "",
            foto: ""
        });
        setImagePreview(null);
    };

    const deleteProduct = (id) => {
        if (window.confirm("¿Estás seguro de eliminar este producto?")) {
            const updatedProducts = products.filter(p => p.id !== id);
            setProducts(updatedProducts);
            localStorage.setItem("malexa.products.v1", JSON.stringify(updatedProducts));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProductForm({ ...productForm, foto: reader.result });
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="dashboard-wrapper">
            {/* Navbar Superior */}
            <nav className="navbar navbar-expand-lg navbar-dark dashboard-navbar">
                <div className="container-fluid px-4">
                    <a className="navbar-brand d-flex align-items-center" href="#">
                        <div className="brand-icon me-3">
                            <i className="bi bi-gem"></i>
                        </div>
                        <div>
                            <h5 className="mb-0 fw-bold">MALEXA</h5>
                            <small className="text-white-50">Panel Administrador</small>
                        </div>
                    </a>

                    <div className="d-flex align-items-center">
                        <div className="user-info me-3 d-none d-md-block">
                            <div className="text-end">
                                <div className="fw-semibold">{user?.name || "Administrador"}</div>
                                <small className="text-white-50">{user?.username}</small>
                            </div>
                        </div>
                        <div className="user-avatar me-3">
                            <i className="bi bi-person-circle"></i>
                        </div>
                        <button
                            className="btn btn-outline-light btn-sm"
                            onClick={logout}
                        >
                            <i className="bi bi-box-arrow-right me-2"></i>
                            Salir
                        </button>
                    </div>
                </div>
            </nav>

            {/* Estadísticas */}
            <div className="stats-section">
                <div className="container-fluid px-4 py-4">
                    <div className="row g-3">
                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="stat-card stat-card-primary">
                                <div className="stat-icon">
                                    <i className="bi bi-box-seam"></i>
                                </div>
                                <div className="stat-content">
                                    <div className="stat-label">Total Productos</div>
                                    <div className="stat-value">{products.length}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="stat-card stat-card-success">
                                <div className="stat-icon">
                                    <i className="bi bi-check-circle"></i>
                                </div>
                                <div className="stat-content">
                                    <div className="stat-label">Stock Disponible</div>
                                    <div className="stat-value">
                                        {products.reduce((sum, p) => sum + parseInt(p.cantidad || 0), 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="stat-card stat-card-warning">
                                <div className="stat-icon">
                                    <i className="bi bi-people"></i>
                                </div>
                                <div className="stat-content">
                                    <div className="stat-label">Usuarios</div>
                                    <div className="stat-value">{users.length}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="stat-card stat-card-info">
                                <div className="stat-icon">
                                    <i className="bi bi-currency-dollar"></i>
                                </div>
                                <div className="stat-content">
                                    <div className="stat-label">Valor Inventario</div>
                                    <div className="stat-value">
                                        ${products.reduce((sum, p) => sum + (parseFloat(p.precioUnidad || 0) * parseInt(p.cantidad || 0)), 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navegación por Tabs */}
            <div className="tabs-navigation">
                <div className="container-fluid px-4">
                    <ul className="nav nav-tabs border-0">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "productos" ? "active" : ""}`}
                                onClick={() => setActiveTab("productos")}
                            >
                                <i className="bi bi-box-seam me-2"></i>
                                Productos
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "usuarios" ? "active" : ""}`}
                                onClick={() => setActiveTab("usuarios")}
                            >
                                <i className="bi bi-people me-2"></i>
                                Usuarios
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="main-content">
                <div className="container-fluid px-4 py-4">
                    {activeTab === "productos" && (
                        <div className="content-card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <div>
                                        <h4 className="mb-1 fw-bold">
                                            <i className="bi bi-box-seam me-2 text-primary"></i>
                                            Gestión de Productos
                                        </h4>
                                        <p className="text-muted mb-0 small">
                                            Administrá tu inventario de productos
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => openProductModal()}
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Nuevo Producto
                                    </button>
                                </div>
                            </div>

                            <div className="card-body p-0">
                                {products.length === 0 ? (
                                    <div className="empty-state py-5">
                                        <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                                        <h5 className="text-muted">No hay productos registrados</h5>
                                        <p className="text-muted">Comenzá agregando tu primer producto</p>
                                        <button
                                            className="btn btn-primary mt-3"
                                            onClick={() => openProductModal()}
                                        >
                                            <i className="bi bi-plus-circle me-2"></i>
                                            Crear Producto
                                        </button>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead>
                                            <tr>
                                                <th className="ps-4">Producto</th>
                                                <th className="text-center">Cantidad</th>
                                                <th className="text-end">Precio Unidad</th>
                                                <th className="text-end">Precio Combo</th>
                                                <th className="text-center pe-4">Acciones</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {products.map((product) => (
                                                <tr key={product.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            {product.foto ? (
                                                                <img
                                                                    src={product.foto}
                                                                    alt={product.nombre}
                                                                    className="product-img me-3"
                                                                />
                                                            ) : (
                                                                <div className="product-img-placeholder me-3">
                                                                    <i className="bi bi-image"></i>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="fw-semibold">{product.nombre}</div>
                                                                <small className="text-muted">ID: {product.id}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                            <span className={`badge ${parseInt(product.cantidad) > 10 ? 'bg-success' : 'bg-warning'}`}>
                                                                {product.cantidad} unidades
                                                            </span>
                                                    </td>
                                                    <td className="text-end fw-semibold text-success">
                                                        ${parseFloat(product.precioUnidad).toFixed(2)}
                                                    </td>
                                                    <td className="text-end fw-semibold text-info">
                                                        ${parseFloat(product.precioCombo).toFixed(2)}
                                                    </td>
                                                    <td className="text-center pe-4">
                                                        <div className="btn-group" role="group">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => openProductModal(product)}
                                                                title="Editar"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => deleteProduct(product.id)}
                                                                title="Eliminar"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "usuarios" && (
                        <div className="content-card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <div>
                                        <h4 className="mb-1 fw-bold">
                                            <i className="bi bi-people me-2 text-warning"></i>
                                            Gestión de Usuarios
                                        </h4>
                                        <p className="text-muted mb-0 small">
                                            Administrá los usuarios del sistema
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-warning text-white"
                                        onClick={() => openUserModal()}
                                    >
                                        <i className="bi bi-person-plus me-2"></i>
                                        Nuevo Usuario
                                    </button>
                                </div>
                            </div>

                            <div className="card-body p-0">
                                {users.length === 0 ? (
                                    <div className="empty-state py-5">
                                        <i className="bi bi-people display-1 text-muted mb-3"></i>
                                        <h5 className="text-muted">No hay usuarios registrados</h5>
                                        <p className="text-muted">Comenzá agregando tu primer usuario</p>
                                        <button
                                            className="btn btn-warning text-white mt-3"
                                            onClick={() => openUserModal()}
                                        >
                                            <i className="bi bi-person-plus me-2"></i>
                                            Crear Usuario
                                        </button>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead>
                                            <tr>
                                                <th className="ps-4">Nombre</th>
                                                <th>Usuario</th>
                                                <th>Rol</th>
                                                <th className="text-center pe-4">Acciones</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <div className="user-avatar-sm me-3">
                                                                <i className="bi bi-person-circle"></i>
                                                            </div>
                                                            <div>
                                                                <div className="fw-semibold">{user.name}</div>
                                                                <small className="text-muted">ID: {user.id}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <code className="text-primary">{user.username}</code>
                                                    </td>
                                                    <td>
                                                            <span className={`badge ${user.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                                                                {user.role === 'admin' ? 'Administrador' : 'Personal'}
                                                            </span>
                                                    </td>
                                                    <td className="text-center pe-4">
                                                        <div className="btn-group" role="group">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => openUserModal(user)}
                                                                title="Editar"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => deleteUser(user.id)}
                                                                title="Eliminar"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Producto */}
            {showProductModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-box-seam me-2"></i>
                                    {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeProductModal}></button>
                            </div>
                            <form onSubmit={handleProductSubmit}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Nombre del Producto <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg"
                                                value={productForm.nombre}
                                                onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                                                required
                                                placeholder="Ej: Remera básica"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">
                                                Cantidad <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control form-control-lg"
                                                value={productForm.cantidad}
                                                onChange={(e) => setProductForm({ ...productForm, cantidad: e.target.value })}
                                                required
                                                min="0"
                                                placeholder="0"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">
                                                Precio Unidad <span className="text-danger">*</span>
                                            </label>
                                            <div className="input-group input-group-lg">
                                                <span className="input-group-text">$</span>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={productForm.precioUnidad}
                                                    onChange={(e) => setProductForm({ ...productForm, precioUnidad: e.target.value })}
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">
                                                Precio Combo <span className="text-danger">*</span>
                                            </label>
                                            <div className="input-group input-group-lg">
                                                <span className="input-group-text">$</span>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={productForm.precioCombo}
                                                    onChange={(e) => setProductForm({ ...productForm, precioCombo: e.target.value })}
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Foto del Producto</label>
                                            <input
                                                type="file"
                                                className="form-control form-control-lg"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                            {imagePreview && (
                                                <div className="mt-3 text-center">
                                                    <img src={imagePreview} alt="Preview" className="img-thumbnail" style={{maxHeight: '200px'}} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeProductModal}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className="bi bi-check-circle me-2"></i>
                                        {editingProduct ? "Actualizar" : "Crear"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Usuario */}
            {showUserModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-person-plus me-2"></i>
                                    {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeUserModal}></button>
                            </div>
                            <form onSubmit={handleUserSubmit}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Nombre Completo <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg"
                                                value={userForm.name}
                                                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                                required
                                                placeholder="Ej: Juan Pérez"
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Usuario <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg"
                                                value={userForm.username}
                                                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                                required
                                                placeholder="Ej: jperez"
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Contraseña {editingUser && <small className="text-muted">(dejar vacío para no cambiar)</small>}
                                                {!editingUser && <span className="text-danger">*</span>}
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control form-control-lg"
                                                value={userForm.password}
                                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                                required={!editingUser}
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Rol <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select form-select-lg"
                                                value={userForm.role}
                                                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                                required
                                            >
                                                <option value="staff">Personal</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeUserModal}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-warning text-white">
                                        <i className="bi bi-check-circle me-2"></i>
                                        {editingUser ? "Actualizar" : "Crear"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}