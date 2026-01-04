import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./Dashboard.css";

// Importar Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * StaffDashboard (Personal)
 * - Ve listado de productos sin cantidad
 * - Puede registrar ventas
 * - No puede crear/editar usuarios ni productos
 */
export default function StaffDashboard() {
    const { user, logout } = useAuth();
    const [products, setProducts] = useState([]);
    const [query, setQuery] = useState("");
    const [sales, setSales] = useState([]);
    const [dateFilter, setDateFilter] = useState("");
    const [activeTab, setActiveTab] = useState("productos");

    // Estado para modal de visualización de producto
    const [showProductDetailModal, setShowProductDetailModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Formulario de venta
    const [saleForm, setSaleForm] = useState({
        productId: "",
        cantidad: "",
        montoCobrado: "",
        metodoCobro: "Efectivo"
    });

    // Cargar productos y ventas del localStorage
    useEffect(() => {
        const storedProducts = localStorage.getItem("malexa.products.v1");
        const storedSales = localStorage.getItem("malexa.sales.v1");

        if (storedProducts) setProducts(JSON.parse(storedProducts));
        if (storedSales) setSales(JSON.parse(storedSales));
    }, []);

    // Filtrar productos por búsqueda
    const filteredProducts = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return products;
        return products.filter((p) =>
            String(p?.nombre ?? "").toLowerCase().includes(q)
        );
    }, [products, query]);

    // Filtrar ventas por fecha
    const filteredSales = useMemo(() => {
        if (!dateFilter) return sales;

        const filterDate = new Date(dateFilter);
        filterDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);

        return sales.filter(sale => {
            const saleDate = new Date(sale.fecha);
            return saleDate >= filterDate && saleDate < nextDay;
        });
    }, [sales, dateFilter]);

    // Calcular total de ventas del día
    const totalVentasDia = useMemo(() => {
        if (!dateFilter) return 0;
        return filteredSales.reduce((acc, sale) => acc + parseFloat(sale.montoCobrado || 0), 0);
    }, [filteredSales, dateFilter]);

    // Obtener producto por ID
    const getProductById = (id) => {
        return products.find(p => p.id === id);
    };

    // Manejar registro de venta
    const handleSaleSubmit = (e) => {
        e.preventDefault();

        const product = getProductById(parseInt(saleForm.productId));
        if (!product) {
            alert("Seleccione un producto válido");
            return;
        }

        const newSale = {
            id: Date.now(),
            productId: parseInt(saleForm.productId),
            productName: product.nombre,
            cantidad: parseInt(saleForm.cantidad),
            montoCobrado: parseFloat(saleForm.montoCobrado),
            metodoCobro: saleForm.metodoCobro,
            fecha: new Date().toISOString(),
            registradoPor: user?.name || "Personal"
        };

        const updatedSales = [...sales, newSale];
        setSales(updatedSales);
        localStorage.setItem("malexa.sales.v1", JSON.stringify(updatedSales));

        // Reset form
        setSaleForm({
            productId: "",
            cantidad: "",
            montoCobrado: "",
            metodoCobro: "Efectivo"
        });

        alert("Venta registrada exitosamente!");
    };

    // Ver detalles de producto en modal mejorado
    const viewProductDetails = (product) => {
        setSelectedProduct(product);
        setShowProductDetailModal(true);
    };

    const closeProductDetailModal = () => {
        setShowProductDetailModal(false);
        setSelectedProduct(null);
    };

    return (
        <div className="dashboard-wrapper">
            <nav className="dashboard-navbar">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <div className="brand-icon">
                                <i className="bi bi-gem"></i>
                            </div>
                            <div className="navbar-brand mb-0">
                                <h5 className="mb-0 text-white">MALEXA</h5>
                                <small className="text-white opacity-75">
                                    Panel de Personal
                                </small>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            <div className="text-end d-none d-md-block">
                                <div className="text-white fw-semibold">{user?.name || "Personal"}</div>
                                <small className="text-white opacity-75">
                                    Rol: {user?.role}
                                </small>
                            </div>

                            <button className="btn btn-outline-light" onClick={logout}>
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Navegación por tabs */}
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
                                className={`nav-link ${activeTab === "ventas" ? "active" : ""}`}
                                onClick={() => setActiveTab("ventas")}
                            >
                                <i className="bi bi-cart-check me-2"></i>
                                Registrar Venta
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Contenido principal */}
            <main className="main-content">
                <div className="container-fluid">
                    {activeTab === "productos" && (
                        <div className="content-card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <div>
                                        <h4 className="mb-1">Catálogo de Productos</h4>
                                        <div className="text-muted">
                                            Total de productos: {products.length}
                                        </div>
                                    </div>

                                    <div className="search-box">
                                        <i className="bi bi-search"></i>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Buscar productos..."
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                        />
                                    </div>
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
                                            <th className="text-end">Precio Unidad</th>
                                            <th className="text-end">Precio Combo</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center text-muted py-5">
                                                    {query ?
                                                        "No se encontraron productos con ese nombre" :
                                                        "No hay productos disponibles"}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map((product) => (
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
                                                    <td className="text-end fw-bold">${parseFloat(product.precioUnidad).toFixed(2)}</td>
                                                    <td className="text-end fw-bold">${parseFloat(product.precioCombo).toFixed(2)}</td>
                                                    <td className="text-center">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => viewProductDetails(product)}
                                                        >
                                                            <i className="bi bi-eye me-1"></i>
                                                            Ver
                                                        </button>
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

                    {activeTab === "ventas" && (
                        <>
                            {dateFilter && (
                                <div className="content-card mb-4">
                                    <div className="card-body">
                                        <div className="row g-4">
                                            <div className="col-md-12">
                                                <div className="stat-card stat-card-success">
                                                    <div className="stat-icon">
                                                        <i className="bi bi-cash-coin"></i>
                                                    </div>
                                                    <div className="stat-content">
                                                        <div className="stat-label">Total Ventas del Día</div>
                                                        <div className="stat-value">${totalVentasDia.toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="row g-4">
                                {/* Formulario de venta */}
                                <div className="col-12 col-lg-5">
                                    <div className="content-card">
                                        <div className="card-header">
                                            <h4 className="mb-1">Nueva Venta</h4>
                                            <div className="text-muted">
                                                Registre las ventas realizadas
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <form onSubmit={handleSaleSubmit}>
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">
                                                        Producto <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        value={saleForm.productId}
                                                        onChange={(e) => setSaleForm({...saleForm, productId: e.target.value})}
                                                        required
                                                    >
                                                        <option value="">Seleccionar producto</option>
                                                        {products.map(product => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.nombre} - ${product.precioUnidad}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">
                                                        Cantidad (unidades) <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        min="1"
                                                        value={saleForm.cantidad}
                                                        onChange={(e) => setSaleForm({...saleForm, cantidad: e.target.value})}
                                                        required
                                                    />
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">
                                                        Monto cobrado ($) <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        step="0.01"
                                                        min="0"
                                                        value={saleForm.montoCobrado}
                                                        onChange={(e) => setSaleForm({...saleForm, montoCobrado: e.target.value})}
                                                        required
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label className="form-label fw-semibold">
                                                        Método de cobro <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        value={saleForm.metodoCobro}
                                                        onChange={(e) => setSaleForm({...saleForm, metodoCobro: e.target.value})}
                                                        required
                                                    >
                                                        <option value="Efectivo">Efectivo</option>
                                                        <option value="Mercado Pago">Mercado Pago</option>
                                                    </select>
                                                </div>

                                                <button type="submit" className="btn btn-success w-100">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Registrar Venta
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>

                                {/* Lista de ventas */}
                                <div className="col-12 col-lg-7">
                                    <div className="content-card">
                                        <div className="card-header">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h4 className="mb-1">Historial de Ventas</h4>
                                                    <div className="text-muted">
                                                        Ventas registradas por el personal
                                                    </div>
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={dateFilter}
                                                        onChange={(e) => setDateFilter(e.target.value)}
                                                    />
                                                    {dateFilter && (
                                                        <button
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => setDateFilter("")}
                                                        >
                                                            <i className="bi bi-x"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-body">
                                            <div className="table-responsive">
                                                <table className="table table-hover align-middle">
                                                    <thead>
                                                    <tr>
                                                        <th>Fecha</th>
                                                        <th>Producto</th>
                                                        <th className="text-end">Cantidad</th>
                                                        <th className="text-end">Monto</th>
                                                        <th>Método</th>
                                                        <th>Registrado por</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {filteredSales.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="text-center text-muted py-5">
                                                                {dateFilter ?
                                                                    "No hay ventas en esta fecha" :
                                                                    "No hay ventas registradas"}
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredSales.map((sale) => (
                                                            <tr key={sale.id}>
                                                                <td>
                                                                    {new Date(sale.fecha).toLocaleDateString('es-AR')}
                                                                    <br />
                                                                    <small className="text-muted">
                                                                        {new Date(sale.fecha).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}
                                                                    </small>
                                                                </td>
                                                                <td className="fw-semibold">{sale.productName}</td>
                                                                <td className="text-end">{sale.cantidad} un.</td>
                                                                <td className="text-end fw-bold">${sale.montoCobrado.toFixed(2)}</td>
                                                                <td>
                                  <span className={`badge ${sale.metodoCobro === 'Efectivo' ? 'bg-success' : 'bg-primary'}`}>
                                    {sale.metodoCobro}
                                  </span>
                                                                </td>
                                                                <td>
                                                                    <small>{sale.registradoPor}</small>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Modal de Detalles del Producto */}
            {showProductDetailModal && selectedProduct && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-box-seam me-2"></i>
                                    Detalles del Producto
                                </h5>
                                <button type="button" className="btn-close" onClick={closeProductDetailModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-4">
                                    {/* Imagen del producto - Prioridad visual */}
                                    <div className="col-md-6">
                                        <div className="text-center">
                                            {selectedProduct.foto ? (
                                                <img
                                                    src={selectedProduct.foto}
                                                    alt={selectedProduct.nombre}
                                                    className="img-fluid rounded-3 shadow-sm"
                                                    style={{maxHeight: '400px', width: '100%', objectFit: 'contain', border: '3px solid #e9ecef'}}
                                                />
                                            ) : (
                                                <div className="d-flex align-items-center justify-content-center bg-light rounded-3"
                                                     style={{height: '400px', border: '3px dashed #dee2e6'}}>
                                                    <div className="text-center">
                                                        <i className="bi bi-image display-1 text-muted mb-3"></i>
                                                        <p className="text-muted mb-0">Sin imagen disponible</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Información del producto */}
                                    <div className="col-md-6">
                                        <div className="d-flex flex-column h-100">
                                            <div className="mb-4">
                                                <label className="form-label fw-bold text-muted text-uppercase"
                                                       style={{fontSize: '0.85rem', letterSpacing: '0.5px'}}>
                                                    Nombre del Producto
                                                </label>
                                                <h4 className="mb-0 fw-bold">{selectedProduct.nombre}</h4>
                                            </div>

                                            <div className="mb-4">
                                                <label className="form-label fw-bold text-muted text-uppercase"
                                                       style={{fontSize: '0.85rem', letterSpacing: '0.5px'}}>
                                                    Talles y/o Colores
                                                </label>
                                                <p className="mb-0 fs-5">
                                                    {selectedProduct.tallesColores || (
                                                        <span className="text-muted fst-italic">No especificado</span>
                                                    )}
                                                </p>
                                            </div>

                                            <div className="mb-4">
                                                <div className="row g-3">
                                                    <div className="col-6">
                                                        <div className="p-3 bg-light rounded-3">
                                                            <label className="form-label fw-bold text-muted text-uppercase mb-2"
                                                                   style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
                                                                Precio Unidad
                                                            </label>
                                                            <div className="fs-3 fw-bold text-primary">
                                                                ${parseFloat(selectedProduct.precioUnidad).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="p-3 bg-light rounded-3">
                                                            <label className="form-label fw-bold text-muted text-uppercase mb-2"
                                                                   style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
                                                                Precio Combo
                                                            </label>
                                                            <div className="fs-3 fw-bold text-success">
                                                                ${parseFloat(selectedProduct.precioCombo).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <div className="p-3 bg-light rounded-3">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="bi bi-info-circle text-muted"></i>
                                                        <small className="text-muted">
                                                            ID del producto: <strong>{selectedProduct.id}</strong>
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeProductDetailModal}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}