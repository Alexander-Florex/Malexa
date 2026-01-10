import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import "./Dashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdminDashboard() {
    const { user, logout } = useAuth();

    const LS_USERS = "malexa.users.v1";
    const LS_PRODUCTS = "malexa.products.v1";
    const LS_SALES = "malexa.sales.v1";

    const [activeTab, setActiveTab] = useState("productos");

    // Usuarios
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        username: "",
        password: "",
        name: "",
        role: "staff"
    });

    // Productos
    const [products, setProducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        nombre: "",
        cantidad: "",
        precioUnidad: "",
        comboMax: "",
        combo2: "",
        combo3: "",
        combo4: "",
        combo5: ""
    });

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    // Ventas (registro admin)
    const [sales, setSales] = useState([]);
    const [salesFilterDate, setSalesFilterDate] = useState(""); // YYYY-MM-DD

    // Registrar venta (admin)
    const [cartItems, setCartItems] = useState([]);
    const [cartForm, setCartForm] = useState({
        productId: "",
        pricingType: "unit",
        qty: 1
    });
    const [metodoCobro, setMetodoCobro] = useState("Efectivo");

    // Resumen stock última venta (admin)
    const [lastStockMovements, setLastStockMovements] = useState([]);

    // Modal detalle venta
    const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);

    // Helpers
    const readLS = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    };

    const writeLS = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    const toNumberOrNull = (v) => {
        if (v === null || v === undefined || v === "") return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };

    const formatMoneyOrDash = (v) => {
        const n = toNumberOrNull(v);
        if (n === null) return "-";
        return `$${n.toFixed(2)}`;
    };

    const getLocalYMD = (dateValue) => {
        const d = new Date(dateValue);
        if (Number.isNaN(d.getTime())) return "";
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    // Load inicial
    useEffect(() => {
        setUsers(readLS(LS_USERS, []));
        setProducts(readLS(LS_PRODUCTS, []));
        setSales(readLS(LS_SALES, []));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync tabs
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === LS_USERS) setUsers(readLS(LS_USERS, []));
            if (e.key === LS_PRODUCTS) setProducts(readLS(LS_PRODUCTS, []));
            if (e.key === LS_SALES) setSales(readLS(LS_SALES, []));
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ========= Productos (combos) =========
    const parseMaxCombo = (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return null;
        const i = Math.floor(n);
        if (i < 2 || i > 5) return null;
        return i;
    };

    const inferComboMaxFromProduct = (p) => {
        if (p?.comboMax) {
            const m = parseMaxCombo(p.comboMax);
            if (m) return m;
        }
        const c5 = p?.combo5 ?? null;
        const c4 = p?.combo4 ?? null;
        const c3 = p?.combo3 ?? null;
        const c2 = p?.combo2 ?? p?.precioCombo ?? null;

        if (c5 !== null && c5 !== undefined && c5 !== "") return 5;
        if (c4 !== null && c4 !== undefined && c4 !== "") return 4;
        if (c3 !== null && c3 !== undefined && c3 !== "") return 3;
        if (c2 !== null && c2 !== undefined && c2 !== "") return 2;
        return 2;
    };

    const normalizeProductForSave = (form) => {
        const max = parseMaxCombo(form.comboMax) ?? 2;
        const combos = {};
        for (let i = 2; i <= 5; i++) {
            if (i <= max) combos[`combo${i}`] = form[`combo${i}`];
            else combos[`combo${i}`] = null;
        }

        return {
            nombre: form.nombre,
            cantidad: Number(form.cantidad) || 0,
            precioUnidad: form.precioUnidad,
            comboMax: max,
            ...combos
        };
    };

    // ========= Usuarios =========
    const handleUserSubmit = (e) => {
        e.preventDefault();

        if (editingUser) {
            const updated = users.map((u) => (u.id === editingUser.id ? { ...u, ...userForm } : u));
            setUsers(updated);
            writeLS(LS_USERS, updated);
        } else {
            const newUser = { id: Date.now(), ...userForm, createdAt: new Date().toISOString() };
            const updated = [...users, newUser];
            setUsers(updated);
            writeLS(LS_USERS, updated);
        }

        closeUserModal();
    };

    const openUserModal = (u = null) => {
        if (u) {
            setEditingUser(u);
            setUserForm({
                username: u.username,
                password: "",
                name: u.name,
                role: u.role
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
        if (!window.confirm("¿Eliminar este usuario?")) return;
        const updated = users.filter((u) => u.id !== id);
        setUsers(updated);
        writeLS(LS_USERS, updated);
    };

    // ========= Productos =========
    const openProductModal = (product = null) => {
        if (product) {
            const inferredMax = inferComboMaxFromProduct(product);
            setEditingProduct(product);
            setProductForm({
                nombre: product.nombre ?? "",
                cantidad: product.cantidad ?? 0,
                precioUnidad: product.precioUnidad ?? "",
                comboMax: inferredMax,
                combo2: (product.combo2 ?? product.precioCombo ?? "") ?? "",
                combo3: product.combo3 ?? "",
                combo4: product.combo4 ?? "",
                combo5: product.combo5 ?? ""
            });
            setCurrentStep(totalSteps);
        } else {
            setEditingProduct(null);
            setProductForm({
                nombre: "",
                cantidad: "",
                precioUnidad: "",
                comboMax: "",
                combo2: "",
                combo3: "",
                combo4: "",
                combo5: ""
            });
            setCurrentStep(1);
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
            comboMax: "",
            combo2: "",
            combo3: "",
            combo4: "",
            combo5: ""
        });
        setCurrentStep(1);
    };

    const deleteProduct = (id) => {
        if (!window.confirm("¿Eliminar este producto?")) return;
        const updated = products.filter((p) => p.id !== id);
        setProducts(updated);
        writeLS(LS_PRODUCTS, updated);
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!productForm.nombre.trim()) return alert("Ingresá el nombre del producto");
            const cant = Number(productForm.cantidad);
            if (productForm.cantidad === "" || !Number.isFinite(cant) || cant < 0) return alert("Ingresá una cantidad válida");
            const pu = Number(productForm.precioUnidad);
            if (productForm.precioUnidad === "" || !Number.isFinite(pu) || pu < 0) return alert("Ingresá un precio unitario válido");
        }
        if (currentStep === 2) {
            const max = parseMaxCombo(productForm.comboMax);
            if (!max) return alert("Seleccioná cantidad de combos válida (2 a 5)");
        }
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    };

    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    const handleProductSubmit = (e) => {
        e.preventDefault();

        if (!editingProduct && currentStep < totalSteps) {
            nextStep();
            return;
        }

        const normalized = normalizeProductForSave(productForm);

        if (editingProduct) {
            const updated = products.map((p) => (p.id === editingProduct.id ? { ...p, ...normalized } : p));
            setProducts(updated);
            writeLS(LS_PRODUCTS, updated);
        } else {
            const newProduct = { id: Date.now(), ...normalized, createdAt: new Date().toISOString() };
            const updated = [...products, newProduct];
            setProducts(updated);
            writeLS(LS_PRODUCTS, updated);
        }

        closeProductModal();
    };

    const renderStep = () => {
        const max = parseMaxCombo(productForm.comboMax);

        if (currentStep === 1) {
            return (
                <>
                    <div className="step-header">
                        <div className="step-number">Paso 1 de 3</div>
                        <h6 className="step-title">Datos del Producto</h6>
                        <p className="step-description">Nombre, cantidad y precio por unidad</p>
                    </div>

                    <div className="row g-3">
                        <div className="col-12">
                            <label className="form-label fw-semibold">
                                Nombre <span className="text-danger">*</span>
                            </label>
                            <input
                                className="form-control"
                                value={productForm.nombre}
                                onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                                required
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="form-label fw-semibold">
                                Cantidad <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                className="form-control"
                                min="0"
                                value={productForm.cantidad}
                                onChange={(e) => setProductForm({ ...productForm, cantidad: e.target.value })}
                                required
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="form-label fw-semibold">
                                Precio unidad <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text">$</span>
                                <input
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    step="0.01"
                                    value={productForm.precioUnidad}
                                    onChange={(e) => setProductForm({ ...productForm, precioUnidad: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if (currentStep === 2) {
            return (
                <>
                    <div className="step-header">
                        <div className="step-number">Paso 2 de 3</div>
                        <h6 className="step-title">Cantidad de combos</h6>
                        <p className="step-description">Hasta qué combo tendrá el producto (2x a 5x)</p>
                    </div>

                    <div className="row g-3">
                        <div className="col-12">
                            <label className="form-label fw-semibold">
                                Cantidad de combos (hasta) <span className="text-danger">*</span>
                            </label>
                            <select
                                className="form-select"
                                value={productForm.comboMax}
                                onChange={(e) => {
                                    const newMax = e.target.value;
                                    setProductForm((prev) => {
                                        const parsed = parseMaxCombo(newMax);
                                        const next = { ...prev, comboMax: newMax };
                                        if (parsed) for (let i = 2; i <= 5; i++) if (i > parsed) next[`combo${i}`] = "";
                                        return next;
                                    });
                                }}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                <option value={2}>2 (Combo 2x)</option>
                                <option value={3}>3 (Combo 2x y 3x)</option>
                                <option value={4}>4 (2x, 3x y 4x)</option>
                                <option value={5}>5 (2x, 3x, 4x y 5x)</option>
                            </select>
                        </div>

                        {max && (
                            <div className="col-12">
                                <div className="alert alert-info mb-0">
                                    Se pedirán precios de combos desde <b>2x</b> hasta <b>{max}x</b>.
                                </div>
                            </div>
                        )}
                    </div>
                </>
            );
        }

        return (
            <>
                <div className="step-header">
                    <div className="step-number">Paso 3 de 3</div>
                    <h6 className="step-title">Precios combos</h6>
                    <p className="step-description">Los combos no usados quedarán en “-”</p>
                </div>

                <div className="row g-3">
                    {!max ? (
                        <div className="col-12">
                            <div className="alert alert-warning mb-0">Volvé al paso anterior y elegí cantidad de combos.</div>
                        </div>
                    ) : (
                        [2, 3, 4, 5].map((n) => {
                            const enabled = n <= max;
                            return (
                                <div key={n} className="col-12 col-md-6">
                                    <label className="form-label fw-semibold">
                                        Precio Combo {n}x {enabled && <span className="text-danger">*</span>}
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">$</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            step="0.01"
                                            value={productForm[`combo${n}`]}
                                            onChange={(e) => setProductForm({ ...productForm, [`combo${n}`]: e.target.value })}
                                            required={enabled}
                                            disabled={!enabled}
                                            placeholder={enabled ? "0.00" : "-"}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </>
        );
    };

    // ========= Ventas (Admin) =========
    const getProductById = (id) => products.find((p) => p.id === id);

    const getUnitPrice = (product) => toNumberOrNull(product?.precioUnidad ?? null);

    const getComboPrice = (product, n) => {
        if (!product) return null;
        if (n === 2) return toNumberOrNull(product.combo2 ?? product.precioCombo ?? null);
        return toNumberOrNull(product[`combo${n}`] ?? null);
    };

    const buildPricingOptionsAdmin = (product) => {
        if (!product) return [];
        const opts = [];
        const unit = getUnitPrice(product);
        if (unit !== null) opts.push({ value: "unit", label: `Unidad (${formatMoneyOrDash(unit)})`, packSize: 1, pricePerPack: unit });
        for (let n = 2; n <= 5; n++) {
            const p = getComboPrice(product, n);
            if (p !== null) opts.push({ value: `combo${n}`, label: `Combo ${n}x (${formatMoneyOrDash(p)})`, packSize: n, pricePerPack: p });
        }
        return opts;
    };

    const selectedProductForCart = useMemo(() => {
        const id = Number(cartForm.productId);
        if (!Number.isFinite(id)) return null;
        return getProductById(id) || null;
    }, [cartForm.productId, products]);

    const pricingOptions = useMemo(() => buildPricingOptionsAdmin(selectedProductForCart), [selectedProductForCart]);

    useEffect(() => {
        if (!selectedProductForCart) return;
        const opts = buildPricingOptionsAdmin(selectedProductForCart);
        if (opts.length === 0) return;
        const exists = opts.some((o) => o.value === cartForm.pricingType);
        if (!exists) setCartForm((prev) => ({ ...prev, pricingType: opts[0].value }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProductForCart]);

    const getCurrentPricing = () => {
        if (!selectedProductForCart) return null;
        const opts = buildPricingOptionsAdmin(selectedProductForCart);
        return opts.find((o) => o.value === cartForm.pricingType) || null;
    };

    const cartTotal = useMemo(() => cartItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0), [cartItems]);

    const renderPricingTypeLabel = (pricingType) => {
        if (pricingType === "unit") return "Unidad";
        if (String(pricingType).startsWith("combo")) {
            const n = Number(String(pricingType).replace("combo", ""));
            if (Number.isFinite(n)) return `Combo ${n}x`;
        }
        return String(pricingType);
    };

    const addToCart = () => {
        const product = selectedProductForCart;
        if (!product) return alert("Seleccioná un producto");

        const qty = Math.floor(Number(cartForm.qty));
        if (!Number.isFinite(qty) || qty < 1) return alert("Cantidad inválida");

        const pricing = getCurrentPricing();
        if (!pricing) return alert("Elegí tipo de precio");

        const subtotal = pricing.pricePerPack * qty;

        const newItem = {
            id: Date.now(),
            productId: product.id,
            productName: product.nombre,
            pricingType: pricing.value,
            packSize: pricing.packSize,
            qtyPacks: qty,
            pricePerPack: pricing.pricePerPack,
            subtotal
        };

        setCartItems((prev) => {
            const idx = prev.findIndex(
                (x) => x.productId === newItem.productId && x.pricingType === newItem.pricingType && Number(x.pricePerPack) === Number(newItem.pricePerPack)
            );
            if (idx === -1) return [...prev, newItem];
            const copy = [...prev];
            const old = copy[idx];
            const mergedQty = Number(old.qtyPacks) + Number(newItem.qtyPacks);
            copy[idx] = { ...old, qtyPacks: mergedQty, subtotal: mergedQty * Number(old.pricePerPack) };
            return copy;
        });

        setCartForm((prev) => ({ ...prev, qty: 1 }));
    };

    const removeCartItem = (itemId) => setCartItems((prev) => prev.filter((x) => x.id !== itemId));

    const changeCartItemQty = (itemId, delta) => {
        setCartItems((prev) =>
            prev.map((x) => {
                if (x.id !== itemId) return x;
                const nextQty = Math.max(1, Math.floor(Number(x.qtyPacks) + delta));
                return { ...x, qtyPacks: nextQty, subtotal: nextQty * Number(x.pricePerPack) };
            })
        );
    };

    const clearCart = () => setCartItems([]);

    // ========= STOCK UPDATE =========
    const computeUnitsByProduct = (items) => {
        const map = new Map();
        for (const it of items) {
            const units = Number(it.packSize) * Number(it.qtyPacks);
            const pid = Number(it.productId);
            if (!Number.isFinite(pid) || !Number.isFinite(units)) continue;
            map.set(pid, (map.get(pid) || 0) + units);
        }
        return map;
    };

    const applyStockDiscountOrFail = (items) => {
        const unitsMap = computeUnitsByProduct(items);
        const movements = [];

        for (const [pid, soldUnits] of unitsMap.entries()) {
            const p = products.find((x) => Number(x.id) === pid);
            if (!p) {
                alert("No se encontró un producto para descontar stock. Recargá la página.");
                return { ok: false, updatedProducts: null, movements: [] };
            }
            const before = Number(p.cantidad) || 0;
            const after = before - soldUnits;

            if (after < 0) {
                alert(
                    `Stock insuficiente para "${p.nombre}".\nStock actual: ${before}\nNecesitás: ${soldUnits}\nFaltan: ${Math.abs(after)}`
                );
                return { ok: false, updatedProducts: null, movements: [] };
            }

            movements.push({ productId: pid, productName: p.nombre, before, sold: soldUnits, after });
        }

        const updatedProducts = products.map((p) => {
            const pid = Number(p.id);
            const soldUnits = unitsMap.get(pid);
            if (!soldUnits) return p;
            const before = Number(p.cantidad) || 0;
            return { ...p, cantidad: before - soldUnits };
        });

        return { ok: true, updatedProducts, movements };
    };

    const checkout = () => {
        if (cartItems.length === 0) return alert("Carrito vacío");

        const stockResult = applyStockDiscountOrFail(cartItems);
        if (!stockResult.ok) return;

        setProducts(stockResult.updatedProducts);
        writeLS(LS_PRODUCTS, stockResult.updatedProducts);

        const total = Number(cartTotal);

        const newSale = {
            id: Date.now(),
            items: cartItems,
            totalCobrado: total,
            montoCobrado: total,
            metodoCobro,
            fecha: new Date().toISOString(),
            registradoPor: user?.name || "Administrador",
            registradoPorRol: user?.role || "admin",
            stockMovements: stockResult.movements
        };

        const updatedSales = [...(sales || []), newSale];
        setSales(updatedSales);
        writeLS(LS_SALES, updatedSales);

        setLastStockMovements(stockResult.movements);
        clearCart();
        alert("Venta registrada y stock actualizado ✅");
    };

    // Tabla ventas + filtro
    const salesFiltered = useMemo(() => {
        if (!salesFilterDate) return sales || [];
        return (sales || []).filter((s) => getLocalYMD(s.fecha) === salesFilterDate);
    }, [sales, salesFilterDate]);

    const totalFiltrado = useMemo(() => {
        return salesFiltered.reduce((acc, s) => acc + (Number(s?.totalCobrado ?? s?.montoCobrado ?? 0) || 0), 0);
    }, [salesFiltered]);

    const buildSalePrimaryProduct = (sale) => {
        if (Array.isArray(sale?.items) && sale.items.length > 0) return sale.items[0]?.productName || "Producto";
        return sale?.productName || "Producto";
    };

    const buildSaleDetailLines = (sale) => {
        if (Array.isArray(sale?.items) && sale.items.length > 0) {
            const primary = buildSalePrimaryProduct(sale);
            return sale.items.map((it) => {
                const labelForLine = it.packSize === 1 ? `Unidad` : `Combo ${it.packSize}x`;
                if (it.productName === primary) return `${it.qtyPacks} -> ${labelForLine}`;
                return `${it.qtyPacks} -> ${it.productName} ${labelForLine}`;
            });
        }
        return ["-"];
    };

    const openSaleDetail = (sale) => {
        setSelectedSale(sale);
        setShowSaleDetailModal(true);
    };

    const closeSaleDetail = () => {
        setSelectedSale(null);
        setShowSaleDetailModal(false);
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

            <div className="tabs-navigation">
                <div className="container-fluid">
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === "productos" ? "active" : ""}`} onClick={() => setActiveTab("productos")}>
                                <i className="bi bi-box-seam me-2"></i>
                                Productos
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === "usuarios" ? "active" : ""}`} onClick={() => setActiveTab("usuarios")}>
                                <i className="bi bi-people me-2"></i>
                                Usuarios
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === "registroVentas" ? "active" : ""}`} onClick={() => setActiveTab("registroVentas")}>
                                <i className="bi bi-receipt-cutoff me-2"></i>
                                Registro de ventas
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <main className="main-content">
                <div className="container-fluid">
                    {/* Productos */}
                    {activeTab === "productos" && (
                        <div className="content-card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h4 className="mb-1">Gestión de Productos</h4>
                                        <div className="text-muted">Administre el inventario</div>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => openProductModal()}>
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
                                            <th>Producto</th>
                                            <th className="text-center">Cantidad</th>
                                            <th className="text-end">Precio Unidad</th>
                                            <th className="text-end">Combo 2x</th>
                                            <th className="text-end">Combo 3x</th>
                                            <th className="text-end">Combo 4x</th>
                                            <th className="text-end">Combo 5x</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center text-muted py-5">
                                                    No hay productos registrados
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((p) => (
                                                <tr key={p.id}>
                                                    <td className="fw-semibold">{p.nombre}</td>
                                                    <td className="text-center">
                                                        <span className="badge bg-info text-dark">{Number(p.cantidad) || 0} un.</span>
                                                    </td>
                                                    <td className="text-end fw-bold">{formatMoneyOrDash(p.precioUnidad)}</td>
                                                    <td className="text-end fw-bold">{formatMoneyOrDash(p.combo2 ?? p.precioCombo ?? null)}</td>
                                                    <td className="text-end fw-bold">{formatMoneyOrDash(p.combo3 ?? null)}</td>
                                                    <td className="text-end fw-bold">{formatMoneyOrDash(p.combo4 ?? null)}</td>
                                                    <td className="text-end fw-bold">{formatMoneyOrDash(p.combo5 ?? null)}</td>
                                                    <td className="text-center">
                                                        <div className="btn-group" role="group">
                                                            <button className="btn btn-sm btn-outline-primary" onClick={() => openProductModal(p)}>
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteProduct(p.id)}>
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

                    {/* Usuarios */}
                    {activeTab === "usuarios" && (
                        <div className="content-card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h4 className="mb-1">Gestión de Usuarios</h4>
                                        <div className="text-muted">Administre los usuarios</div>
                                    </div>
                                    <button className="btn btn-warning text-white" onClick={() => openUserModal()}>
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
                              <span className={`badge ${u.role === "admin" ? "bg-warning text-dark" : "bg-info text-dark"}`}>
                                {u.role === "admin" ? "Administrador" : "Personal"}
                              </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="btn-group" role="group">
                                                            <button className="btn btn-sm btn-outline-warning" onClick={() => openUserModal(u)}>
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(u.id)}>
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

                    {/* Registro ventas */}
                    {activeTab === "registroVentas" && (
                        <div className="row g-4">
                            <div className="col-12 col-lg-5">
                                <div className="content-card">
                                    <div className="card-header">
                                        <h4 className="mb-1">Registrar Venta</h4>
                                        <div className="text-muted">Carrito + total + descuento de stock</div>
                                    </div>

                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Producto <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                value={cartForm.productId}
                                                onChange={(e) => setCartForm((prev) => ({ ...prev, productId: e.target.value }))}
                                            >
                                                <option value="">Seleccionar producto</option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Tipo de precio</label>
                                            {!selectedProductForCart ? (
                                                <div className="text-muted small">Seleccioná un producto para ver precios.</div>
                                            ) : (
                                                <div className="d-flex flex-wrap gap-2">
                                                    {pricingOptions.map((opt) => (
                                                        <div key={opt.value}>
                                                            <input
                                                                className="btn-check"
                                                                type="radio"
                                                                name="pricingTypeAdmin"
                                                                id={`pricing-admin-${opt.value}`}
                                                                checked={cartForm.pricingType === opt.value}
                                                                onChange={() => setCartForm((prev) => ({ ...prev, pricingType: opt.value }))}
                                                            />
                                                            <label className="btn btn-outline-primary" htmlFor={`pricing-admin-${opt.value}`}>
                                                                {opt.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Cantidad <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="1"
                                                value={cartForm.qty}
                                                onChange={(e) => setCartForm((prev) => ({ ...prev, qty: e.target.value }))}
                                            />
                                        </div>

                                        <button type="button" className="btn btn-primary w-100 mb-3" onClick={addToCart} disabled={!cartForm.productId}>
                                            <i className="bi bi-plus-circle me-2"></i>
                                            Agregar al carrito
                                        </button>

                                        {lastStockMovements.length > 0 && (
                                            <div className="alert alert-light border rounded-3">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <div className="fw-bold mb-1">
                                                            <i className="bi bi-box-seam me-2"></i>
                                                            Stock (última venta)
                                                        </div>
                                                        {lastStockMovements.map((m) => (
                                                            <div key={m.productId} className="small">
                                                                <span className="fw-semibold">{m.productName}:</span>{" "}
                                                                <span className="text-info fw-bold">{m.before}</span>{" "}
                                                                -{" "}
                                                                <span className="text-danger fw-bold">
                                  {m.sold}↓
                                </span>{" "}
                                                                ={" "}
                                                                <span className="text-success fw-bold">{m.after}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setLastStockMovements([])}>
                                                        <i className="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="border rounded-3 p-3 bg-light">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="mb-0 fw-bold">
                                                    <i className="bi bi-cart3 me-2"></i>
                                                    Carrito
                                                </h6>
                                                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearCart} disabled={cartItems.length === 0}>
                                                    Vaciar
                                                </button>
                                            </div>

                                            {cartItems.length === 0 ? (
                                                <div className="text-muted small">No hay items en el carrito.</div>
                                            ) : (
                                                <div className="d-flex flex-column gap-2">
                                                    {cartItems.map((it) => (
                                                        <div key={it.id} className="d-flex justify-content-between align-items-center bg-white p-2 rounded-3">
                                                            <div className="me-2">
                                                                <div className="fw-semibold">{it.productName}</div>
                                                                <div className="small text-muted">
                                                                    {renderPricingTypeLabel(it.pricingType)} •{" "}
                                                                    {it.packSize === 1 ? `${it.qtyPacks} un.` : `${it.qtyPacks} combo(s) → ${it.qtyPacks * it.packSize} un.`} •{" "}
                                                                    {formatMoneyOrDash(it.pricePerPack)}
                                                                </div>
                                                            </div>

                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="text-end fw-bold">{formatMoneyOrDash(it.subtotal)}</div>

                                                                <div className="btn-group" role="group">
                                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => changeCartItemQty(it.id, -1)}>
                                                                        <i className="bi bi-dash"></i>
                                                                    </button>
                                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => changeCartItemQty(it.id, +1)}>
                                                                        <i className="bi bi-plus"></i>
                                                                    </button>
                                                                </div>

                                                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeCartItem(it.id)}>
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <hr />

                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div className="fw-semibold">Total cobrado</div>
                                                <div className="fs-5 fw-bold text-success">{formatMoneyOrDash(cartTotal)}</div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">
                                                    Método de cobro <span className="text-danger">*</span>
                                                </label>
                                                <select className="form-select" value={metodoCobro} onChange={(e) => setMetodoCobro(e.target.value)}>
                                                    <option value="Efectivo">Efectivo</option>
                                                    <option value="Mercado Pago">Mercado Pago</option>
                                                </select>
                                            </div>

                                            <button type="button" className="btn btn-success w-100" onClick={checkout} disabled={cartItems.length === 0}>
                                                <i className="bi bi-check-circle me-2"></i>
                                                Guardar venta
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-12 col-lg-7">
                                <div className="content-card">
                                    <div className="card-header">
                                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                                            <div>
                                                <h4 className="mb-1">Registro de ventas</h4>
                                                <div className="text-muted">Incluye ventas registradas por personal</div>
                                            </div>

                                            <div className="d-flex align-items-end gap-2">
                                                <div>
                                                    <label className="form-label fw-semibold mb-1">Filtrar por día</label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={salesFilterDate}
                                                        onChange={(e) => setSalesFilterDate(e.target.value)}
                                                    />
                                                </div>
                                                <button className="btn btn-outline-secondary" onClick={() => setSalesFilterDate("")}>
                                                    Limpiar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                      <span className="badge bg-dark">
                        Total {salesFilterDate ? "del día filtrado" : "de ventas mostradas"}: {formatMoneyOrDash(totalFiltrado)}
                      </span>
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle">
                                                <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Producto</th>
                                                    <th>Detalle</th>
                                                    <th>Método</th>
                                                    <th className="text-end">Total</th>
                                                    <th className="text-center">Acciones</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {salesFiltered.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="text-center text-muted py-5">
                                                            No hay ventas para mostrar
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    [...salesFiltered]
                                                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                                                        .map((sale) => {
                                                            const primaryProduct = buildSalePrimaryProduct(sale);
                                                            const lines = buildSaleDetailLines(sale);
                                                            const total = Number(sale?.totalCobrado ?? sale?.montoCobrado ?? 0) || 0;

                                                            return (
                                                                <tr key={sale.id}>
                                                                    <td>
                                                                        {new Date(sale.fecha).toLocaleDateString("es-AR")}
                                                                        <br />
                                                                        <small className="text-muted">
                                                                            {new Date(sale.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                                                        </small>
                                                                        <div className="text-muted small">
                                                                            Por: <b>{sale.registradoPor || "-"}</b>
                                                                        </div>
                                                                    </td>
                                                                    <td className="fw-semibold">{primaryProduct}</td>
                                                                    <td className="small">
                                                                        {lines.map((ln, idx) => (
                                                                            <div key={idx}>{ln}</div>
                                                                        ))}
                                                                    </td>
                                                                    <td>
                                      <span className={`badge ${sale.metodoCobro === "Efectivo" ? "bg-success" : "bg-primary"}`}>
                                        {sale.metodoCobro}
                                      </span>
                                                                    </td>
                                                                    <td className="text-end fw-bold">{formatMoneyOrDash(total)}</td>
                                                                    <td className="text-center">
                                                                        <button className="btn btn-sm btn-outline-info" onClick={() => openSaleDetail(sale)}>
                                                                            <i className="bi bi-eye"></i>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="text-muted small mt-2">
                                            * En “Ver” también se muestra el stock: <span className="text-info fw-bold">antes</span> -{" "}
                                            <span className="text-danger fw-bold">vendido↓</span> = <span className="text-success fw-bold">después</span>.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Producto */}
            {showProductModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white sticky-top">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-box-seam me-2"></i>
                                    {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeProductModal}></button>
                            </div>

                            <form onSubmit={handleProductSubmit}>
                                <div className="modal-body" style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
                                    {!editingProduct ? (
                                        <>
                                            <div className="progress-wizard mb-4">
                                                <div className="progress-bar">
                                                    <div className="progress-fill" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                            {renderStep()}
                                        </>
                                    ) : (
                                        <>
                                            {/* Edit simple (todo junto) */}
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    <label className="form-label fw-semibold">Nombre</label>
                                                    <input
                                                        className="form-control"
                                                        value={productForm.nombre}
                                                        onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label fw-semibold">Cantidad</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        min="0"
                                                        value={productForm.cantidad}
                                                        onChange={(e) => setProductForm({ ...productForm, cantidad: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label fw-semibold">Precio unidad</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text">$</span>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            min="0"
                                                            step="0.01"
                                                            value={productForm.precioUnidad}
                                                            onChange={(e) => setProductForm({ ...productForm, precioUnidad: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-12">
                                                    <label className="form-label fw-semibold">Cantidad de combos (hasta)</label>
                                                    <select
                                                        className="form-select"
                                                        value={productForm.comboMax}
                                                        onChange={(e) => {
                                                            const newMax = e.target.value;
                                                            setProductForm((prev) => {
                                                                const parsed = parseMaxCombo(newMax);
                                                                const next = { ...prev, comboMax: newMax };
                                                                if (parsed) for (let i = 2; i <= 5; i++) if (i > parsed) next[`combo${i}`] = "";
                                                                return next;
                                                            });
                                                        }}
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        <option value={2}>2</option>
                                                        <option value={3}>3</option>
                                                        <option value={4}>4</option>
                                                        <option value={5}>5</option>
                                                    </select>
                                                </div>

                                                {[2, 3, 4, 5].map((n) => {
                                                    const max = parseMaxCombo(productForm.comboMax) ?? 2;
                                                    const enabled = n <= max;
                                                    return (
                                                        <div key={n} className="col-12 col-md-6">
                                                            <label className="form-label fw-semibold">Precio Combo {n}x</label>
                                                            <div className="input-group">
                                                                <span className="input-group-text">$</span>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={productForm[`combo${n}`]}
                                                                    onChange={(e) => setProductForm({ ...productForm, [`combo${n}`]: e.target.value })}
                                                                    disabled={!enabled}
                                                                    placeholder={enabled ? "0.00" : "-"}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="modal-footer bg-light sticky-bottom">
                                    <div className="d-flex justify-content-between w-100">
                                        {!editingProduct && currentStep > 1 ? (
                                            <button type="button" className="btn btn-outline-secondary" onClick={prevStep}>
                                                <i className="bi bi-arrow-left me-2"></i>
                                                Anterior
                                            </button>
                                        ) : (
                                            <div></div>
                                        )}

                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-outline-secondary" onClick={closeProductModal}>
                                                Cancelar
                                            </button>

                                            {!editingProduct && currentStep < totalSteps ? (
                                                <button type="button" className="btn btn-primary" onClick={nextStep}>
                                                    Siguiente <i className="bi bi-arrow-right ms-2"></i>
                                                </button>
                                            ) : (
                                                <button type="submit" className="btn btn-success">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Guardar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Usuario */}
            {showUserModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
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
                                                Nombre <span className="text-danger">*</span>
                                            </label>
                                            <input className="form-control" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Usuario <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                value={userForm.username}
                                                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Contraseña {editingUser ? <small className="text-muted">(vacío para no cambiar)</small> : <span className="text-danger">*</span>}
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={userForm.password}
                                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                                required={!editingUser}
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Rol <span className="text-danger">*</span>
                                            </label>
                                            <select className="form-select" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} required>
                                                <option value="staff">Personal</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={closeUserModal}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-warning text-white">
                                        {editingUser ? "Actualizar" : "Crear"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detalle de Venta */}
            {showSaleDetailModal && selectedSale && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header bg-dark text-white">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-receipt me-2"></i>
                                    Detalle de venta
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeSaleDetail}></button>
                            </div>

                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <div className="p-3 bg-light rounded-3">
                                            <div className="text-muted small">Fecha</div>
                                            <div className="fw-bold">{new Date(selectedSale.fecha).toLocaleString("es-AR")}</div>
                                            <div className="text-muted small mt-2">
                                                Registrado por: <b>{selectedSale.registradoPor || "-"}</b>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <div className="p-3 bg-light rounded-3">
                                            <div className="text-muted small">Método</div>
                                            <div className="fw-bold">{selectedSale.metodoCobro}</div>
                                            <div className="text-muted small mt-2">Total cobrado</div>
                                            <div className="fs-4 fw-bold text-success">
                                                {formatMoneyOrDash(Number(selectedSale?.totalCobrado ?? selectedSale?.montoCobrado ?? 0) || 0)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* STOCK MOVEMENTS */}
                                    <div className="col-12">
                                        <div className="p-3 border rounded-3">
                                            <div className="fw-bold mb-2">
                                                <i className="bi bi-box-seam me-2"></i>
                                                Stock
                                            </div>

                                            {Array.isArray(selectedSale.stockMovements) && selectedSale.stockMovements.length > 0 ? (
                                                selectedSale.stockMovements.map((m) => (
                                                    <div key={m.productId} className="small">
                                                        <span className="fw-semibold">{m.productName}:</span>{" "}
                                                        <span className="text-info fw-bold">{m.before}</span>{" "}
                                                        -{" "}
                                                        <span className="text-danger fw-bold">
                              {m.sold}↓
                            </span>{" "}
                                                        ={" "}
                                                        <span className="text-success fw-bold">{m.after}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-muted small">Sin datos de stock (venta antigua)</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ITEMS */}
                                    <div className="col-12">
                                        <div className="table-responsive">
                                            <table className="table table-sm align-middle">
                                                <thead>
                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Tipo</th>
                                                    <th className="text-end">Packs</th>
                                                    <th className="text-end">Unidades</th>
                                                    <th className="text-end">Precio</th>
                                                    <th className="text-end">Subtotal</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {Array.isArray(selectedSale.items) && selectedSale.items.length > 0 ? (
                                                    selectedSale.items.map((it) => (
                                                        <tr key={it.id}>
                                                            <td className="fw-semibold">{it.productName}</td>
                                                            <td>{renderPricingTypeLabel(it.pricingType)}</td>
                                                            <td className="text-end">{it.qtyPacks}</td>
                                                            <td className="text-end">{Number(it.packSize) * Number(it.qtyPacks)}</td>
                                                            <td className="text-end">{formatMoneyOrDash(it.pricePerPack)}</td>
                                                            <td className="text-end fw-bold">{formatMoneyOrDash(it.subtotal)}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="text-center text-muted">
                                                            Sin items (registro antiguo)
                                                        </td>
                                                    </tr>
                                                )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeSaleDetail}>
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
