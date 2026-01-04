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
        tallesColores: "",
        foto: ""
    });
    const [imagePreview, setImagePreview] = useState(null);

    // Estados para el wizard de productos
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4; // Total de pasos en el proceso

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

        if (currentStep < totalSteps) {
            nextStep();
            return;
        }

        // Último paso: Enviar el formulario
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
                tallesColores: product.tallesColores || "",
                foto: product.foto
            });
            setImagePreview(product.foto);
            // Si estamos editando, mostramos todos los campos en un solo paso
            setCurrentStep(totalSteps);
        } else {
            setEditingProduct(null);
            setProductForm({
                nombre: "",
                cantidad: "",
                precioUnidad: "",
                precioCombo: "",
                tallesColores: "",
                foto: ""
            });
            setImagePreview(null);
            setCurrentStep(1); // Comenzar desde el primer paso
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
            tallesColores: "",
            foto: ""
        });
        setImagePreview(null);
        setCurrentStep(1); // Resetear al primer paso
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

    // Funciones para el wizard
    const nextStep = () => {
        // Validaciones antes de avanzar
        if (currentStep === 1 && !productForm.nombre.trim()) {
            alert("Por favor, ingresa el nombre del producto");
            return;
        }
        if (currentStep === 2 && (!productForm.cantidad || productForm.cantidad < 0)) {
            alert("Por favor, ingresa una cantidad válida");
            return;
        }
        if (currentStep === 3 && (!productForm.precioUnidad || !productForm.precioCombo)) {
            alert("Por favor, ingresa ambos precios");
            return;
        }

        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Renderizar el paso actual
    const renderStep = () => {
        switch(currentStep) {
            case 1:
                return (
                    <>
                        <div className="step-header">
                            <div className="step-number">Paso 1 de 4</div>
                            <h6 className="step-title">Información Básica</h6>
                            <p className="step-description">Comienza ingresando los datos principales del producto</p>
                        </div>

                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label fw-semibold">
                                    Nombre del Producto <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={productForm.nombre}
                                    onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                                    required
                                    placeholder="Ej: Cartera de Cuero"
                                />
                                <div className="form-text">Ingresa un nombre descriptivo para tu producto</div>
                            </div>

                            <div className="col-12">
                                <label className="form-label fw-semibold">
                                    Talles y/o Colores
                                </label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={productForm.tallesColores}
                                    onChange={(e) => setProductForm({ ...productForm, tallesColores: e.target.value })}
                                    placeholder="Ej: Talles: S, M, L, XL - Colores: Rojo, Negro, Azul"
                                />
                                <div className="form-text small">
                                    Especifica los talles disponibles y/o colores del producto (opcional)
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 2:
                return (
                    <>
                        <div className="step-header">
                            <div className="step-number">Paso 2 de 4</div>
                            <h6 className="step-title">Cantidad en Stock</h6>
                            <p className="step-description">Define cuántas unidades tienes disponibles</p>
                        </div>

                        <div className="row g-3">
                            <div className="col-12">
                                <div className="text-center mb-4">
                                    <div className="quantity-display">
                                        <span className="quantity-label">Cantidad disponible</span>
                                        <div className="quantity-input-wrapper">
                                            <input
                                                type="number"
                                                className="form-control form-control-lg text-center"
                                                value={productForm.cantidad}
                                                onChange={(e) => setProductForm({ ...productForm, cantidad: e.target.value })}
                                                required
                                                min="0"
                                                placeholder="0"
                                                style={{fontSize: '2rem', height: '70px'}}
                                            />
                                            <div className="quantity-unit">unidades</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-text text-center">
                                    Ingresa la cantidad de productos que tienes en inventario
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 3:
                return (
                    <>
                        <div className="step-header">
                            <div className="step-number">Paso 3 de 4</div>
                            <h6 className="step-title">Precios del Producto</h6>
                            <p className="step-description">Establece los precios para venta individual y en combo</p>
                        </div>

                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <div className="price-card">
                                    <div className="price-header">
                                        <i className="bi bi-tag"></i>
                                        <h6>Precio Unitario</h6>
                                    </div>
                                    <div className="price-input-wrapper">
                                        <span className="price-symbol">$</span>
                                        <input
                                            type="number"
                                            className="form-control form-control-lg"
                                            value={productForm.precioUnidad}
                                            onChange={(e) => setProductForm({ ...productForm, precioUnidad: e.target.value })}
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="form-text">Precio por una sola unidad del producto</div>
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <div className="price-card">
                                    <div className="price-header">
                                        <i className="bi bi-box2"></i>
                                        <h6>Precio en Combo</h6>
                                    </div>
                                    <div className="price-input-wrapper">
                                        <span className="price-symbol">$</span>
                                        <input
                                            type="number"
                                            className="form-control form-control-lg"
                                            value={productForm.precioCombo}
                                            onChange={(e) => setProductForm({ ...productForm, precioCombo: e.target.value })}
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="form-text">Precio especial por compra múltiple</div>
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 4:
                return (
                    <>
                        <div className="step-header">
                            <div className="step-number">Paso 4 de 4</div>
                            <h6 className="step-title">Imagen del Producto</h6>
                            <p className="step-description">Añade una foto que muestre tu producto (opcional)</p>
                        </div>

                        <div className="row g-3">
                            <div className="col-12">
                                <div className="image-upload-area">
                                    <div className="upload-placeholder text-center p-5">
                                        <i className="bi bi-cloud-upload display-4 text-muted mb-3"></i>
                                        <p className="mb-3">Arrastra una imagen o haz clic para seleccionar</p>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            id="productImageUpload"
                                        />
                                        <label htmlFor="productImageUpload" className="btn btn-outline-primary mt-3">
                                            <i className="bi bi-image me-2"></i>
                                            Seleccionar Imagen
                                        </label>
                                    </div>

                                    {imagePreview && (
                                        <div className="mt-4">
                                            <h6 className="fw-semibold mb-3">Vista previa:</h6>
                                            <div className="text-center">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="img-fluid rounded"
                                                    style={{maxHeight: '200px', maxWidth: '100%'}}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger mt-3"
                                                    onClick={() => {
                                                        setProductForm({...productForm, foto: ""});
                                                        setImagePreview(null);
                                                    }}
                                                >
                                                    <i className="bi bi-trash me-1"></i>
                                                    Eliminar imagen
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!imagePreview && editingProduct?.foto && (
                                        <div className="mt-4">
                                            <h6 className="fw-semibold mb-3">Imagen actual:</h6>
                                            <div className="text-center">
                                                <img
                                                    src={editingProduct.foto}
                                                    alt="Actual"
                                                    className="img-fluid rounded"
                                                    style={{maxHeight: '200px', maxWidth: '100%'}}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    // Función para mostrar detalles del producto
    const viewProductDetails = (product) => {
        setEditingProduct(product);
        setProductForm({
            nombre: product.nombre,
            cantidad: product.cantidad,
            precioUnidad: product.precioUnidad,
            precioCombo: product.precioCombo,
            tallesColores: product.tallesColores || "",
            foto: product.foto
        });
        setImagePreview(product.foto);
        setShowProductModal(true);
        setCurrentStep(totalSteps); // Mostrar todos los campos
    };

    // Renderizar todos los campos del producto para edición/visualización
    const renderAllProductFields = () => {
        return (
            <div className="row g-3">
                <div className="col-12">
                    <label className="form-label fw-semibold">
                        Nombre del Producto <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        value={productForm.nombre}
                        onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                        required
                        disabled={!editingProduct}
                        placeholder="Ej: Cartera de Cuero"
                    />
                </div>

                <div className="col-12">
                    <label className="form-label fw-semibold">
                        Talles y/o Colores
                    </label>
                    <textarea
                        className="form-control"
                        rows="3"
                        value={productForm.tallesColores}
                        onChange={(e) => setProductForm({ ...productForm, tallesColores: e.target.value })}
                        disabled={!editingProduct}
                        placeholder="Ej: Talles: S, M, L, XL - Colores: Rojo, Negro, Azul"
                    />
                </div>

                <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">
                        Cantidad <span className="text-danger">*</span>
                    </label>
                    <input
                        type="number"
                        className="form-control"
                        value={productForm.cantidad}
                        onChange={(e) => setProductForm({ ...productForm, cantidad: e.target.value })}
                        required
                        min="0"
                        disabled={!editingProduct}
                        placeholder="0"
                    />
                </div>

                <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">
                        Precio Unitario <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                            type="number"
                            className="form-control"
                            value={productForm.precioUnidad}
                            onChange={(e) => setProductForm({ ...productForm, precioUnidad: e.target.value })}
                            required
                            min="0"
                            step="0.01"
                            disabled={!editingProduct}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">
                        Precio en Combo <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                            type="number"
                            className="form-control"
                            value={productForm.precioCombo}
                            onChange={(e) => setProductForm({ ...productForm, precioCombo: e.target.value })}
                            required
                            min="0"
                            step="0.01"
                            disabled={!editingProduct}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="col-12">
                    <label className="form-label fw-semibold">
                        Imagen del Producto
                    </label>

                    {editingProduct ? (
                        <div className="image-upload-area">
                            <div className="upload-placeholder text-center p-5">
                                <i className="bi bi-cloud-upload display-4 text-muted mb-3"></i>
                                <p className="mb-3">Arrastra una imagen o haz clic para seleccionar</p>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    id="productImageUploadEdit"
                                />
                                <label htmlFor="productImageUploadEdit" className="btn btn-outline-primary mt-3">
                                    <i className="bi bi-image me-2"></i>
                                    Seleccionar Imagen
                                </label>
                            </div>

                            {imagePreview && (
                                <div className="mt-4">
                                    <h6 className="fw-semibold mb-3">Vista previa:</h6>
                                    <div className="text-center">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="img-fluid rounded"
                                            style={{maxHeight: '200px', maxWidth: '100%'}}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger mt-3"
                                            onClick={() => {
                                                setProductForm({...productForm, foto: ""});
                                                setImagePreview(null);
                                            }}
                                        >
                                            <i className="bi bi-trash me-1"></i>
                                            Eliminar imagen
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!imagePreview && editingProduct?.foto && (
                                <div className="mt-4">
                                    <h6 className="fw-semibold mb-3">Imagen actual:</h6>
                                    <div className="text-center">
                                        <img
                                            src={editingProduct.foto}
                                            alt="Actual"
                                            className="img-fluid rounded"
                                            style={{maxHeight: '200px', maxWidth: '100%'}}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center">
                            {productForm.foto ? (
                                <img
                                    src={productForm.foto}
                                    alt={productForm.nombre}
                                    className="img-fluid rounded"
                                    style={{maxHeight: '300px', maxWidth: '100%'}}
                                />
                            ) : (
                                <div className="text-muted p-5 border rounded">
                                    <i className="bi bi-image display-4"></i>
                                    <p className="mt-3">No hay imagen disponible</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-wrapper">
            {/* Navbar */}
            <nav className="dashboard-navbar">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <div className="brand-icon">
                                <i className="bi bi-gem"></i>
                            </div>
                            <div className="navbar-brand mb-0">
                                <h5 className="mb-0 text-white">MALEXA</h5>
                                <small className="text-white opacity-75">Panel de Administración</small>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            <div className="text-end d-none d-md-block">
                                <div className="text-white fw-semibold">{user?.name || "Administrador"}</div>
                                <small className="text-white opacity-75">Rol: {user?.role}</small>
                            </div>

                            <button className="btn btn-outline-light" onClick={logout}>
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Tabs Navigation */}
            <div className="tabs-navigation">
                <div className="container-fluid">
                    <ul className="nav nav-tabs">
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

            {/* Main Content */}
            <main className="main-content">
                <div className="container-fluid">
                    {/* Tab Productos */}
                    {activeTab === "productos" && (
                        <div className="content-card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h4 className="mb-1">Gestión de Productos</h4>
                                        <div className="text-muted">Administre el inventario de productos</div>
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

                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead>
                                        <tr>
                                            <th>Foto</th>
                                            <th>Nombre</th>
                                            <th>Talles y/o Colores</th>
                                            <th className="text-center">Cantidad</th>
                                            <th className="text-end">Precio Unidad</th>
                                            <th className="text-end">Precio Combo</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center text-muted py-5">
                                                    No hay productos registrados
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((product) => (
                                                <tr key={product.id}>
                                                    <td>
                                                        {product.foto ? (
                                                            <img
                                                                src={product.foto}
                                                                alt={product.nombre}
                                                                className="product-img-sm"
                                                            />
                                                        ) : (
                                                            <div className="product-img-placeholder-sm">
                                                                <i className="bi bi-image"></i>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="fw-semibold">{product.nombre}</td>
                                                    <td>
                                                        <span className="text-muted" style={{fontSize: '0.95rem'}}>
                                                            {product.tallesColores || "No especificado"}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-info text-dark">
                                                            {product.cantidad} un.
                                                        </span>
                                                    </td>
                                                    <td className="text-end fw-bold">${parseFloat(product.precioUnidad).toFixed(2)}</td>
                                                    <td className="text-end fw-bold">${parseFloat(product.precioCombo).toFixed(2)}</td>
                                                    <td className="text-center">
                                                        <div className="btn-group" role="group">
                                                            <button
                                                                className="btn btn-sm btn-outline-info"
                                                                onClick={() => viewProductDetails(product)}
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => openProductModal(product)}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => deleteProduct(product.id)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Usuarios */}
                    {activeTab === "usuarios" && (
                        <div className="content-card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h4 className="mb-1">Gestión de Usuarios</h4>
                                        <div className="text-muted">Administre los usuarios del sistema</div>
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

                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Usuario</th>
                                            <th>Rol</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center text-muted py-5">
                                                    No hay usuarios registrados
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((u) => (
                                                <tr key={u.id}>
                                                    <td className="fw-semibold">{u.name}</td>
                                                    <td>{u.username}</td>
                                                    <td>
                                                        <span className={`badge ${u.role === 'admin' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                                                            {u.role === 'admin' ? 'Administrador' : 'Personal'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="btn-group" role="group">
                                                            <button
                                                                className="btn btn-sm btn-outline-warning"
                                                                onClick={() => openUserModal(u)}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => deleteUser(u.id)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de Producto */}
            {showProductModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white sticky-top">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-box-seam me-2"></i>
                                    {editingProduct ? (currentStep === totalSteps ? "Editar Producto" : "Ver Detalles") : "Nuevo Producto"}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeProductModal}></button>
                            </div>
                            <form onSubmit={handleProductSubmit}>
                                <div className="modal-body" style={{maxHeight: 'calc(100vh - 180px)', overflowY: 'auto'}}>
                                    {/* Para creación: mostrar wizard, para edición/visualización: mostrar todos los campos */}
                                    {editingProduct ? (
                                        renderAllProductFields()
                                    ) : (
                                        <>
                                            {/* Indicador de progreso simplificado */}
                                            <div className="progress-wizard mb-4">
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                            {renderStep()}
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer bg-light sticky-bottom">
                                    <div className="d-flex justify-content-between w-100">
                                        {/* Botón Anterior para wizard */}
                                        {currentStep > 1 && !editingProduct && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={prevStep}
                                            >
                                                <i className="bi bi-arrow-left me-2"></i>
                                                Anterior
                                            </button>
                                        )}

                                        {currentStep === 1 && !editingProduct && (
                                            <div></div>
                                        )}

                                        {/* Botón Cancelar para edición/visualización */}
                                        {editingProduct && (
                                            <button type="button" className="btn btn-outline-secondary" onClick={closeProductModal}>
                                                <i className="bi bi-x-circle me-2"></i>
                                                {currentStep === totalSteps ? "Cancelar" : "Cerrar"}
                                            </button>
                                        )}

                                        {/* Botones Siguiente/Finalizar/Actualizar */}
                                        <div className="d-flex gap-2">
                                            {currentStep < totalSteps && !editingProduct ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={nextStep}
                                                >
                                                    Siguiente
                                                    <i className="bi bi-arrow-right ms-2"></i>
                                                </button>
                                            ) : editingProduct && currentStep === totalSteps ? (
                                                <button type="submit" className="btn btn-success">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Actualizar
                                                </button>
                                            ) : !editingProduct ? (
                                                <button type="submit" className="btn btn-success">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Finalizar
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Usuario */}
            {showUserModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header bg-warning text-white">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-person-plus me-2"></i>
                                    {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeUserModal}></button>
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
                                                className="form-control"
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
                                                className="form-control"
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
                                                className="form-control"
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
                                                className="form-select"
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
                                    <button type="button" className="btn btn-outline-secondary" onClick={closeUserModal}>
                                        <i className="bi bi-x-circle me-2"></i>
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