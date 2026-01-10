import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./Dashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * StaffDashboard (Personal)
 * - Ve catálogo SIN cantidad (stock oculto)
 * - Ve combos 2x..5x (con precios en tabla del catálogo)
 * - Registrar venta con carrito
 * - En registrar venta NO se muestran precios por producto/combos (solo etiquetas)
 * - Se muestra Total a cobrar
 * - Historial SIN total y SIN filtro por fecha
 * - Descuenta stock automáticamente al registrar venta
 * - Muestra resumen de stock: 54 (celeste) - 25↓ (rojo) = 29 (verde)
 * - Guarda ventas completas en localStorage malexa.sales.v1 para que el admin las vea
 */
export default function StaffDashboard() {
    const { user, logout } = useAuth();

    const LS_PRODUCTS = "malexa.products.v1";
    const LS_SALES = "malexa.sales.v1";

    const [products, setProducts] = useState([]);
    const [query, setQuery] = useState("");

    const [sales, setSales] = useState([]);
    const [activeTab, setActiveTab] = useState("productos");

    // Modal detalle producto
    const [showProductDetailModal, setShowProductDetailModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Carrito
    const [cartItems, setCartItems] = useState([]);

    // Form para agregar item al carrito
    const [cartForm, setCartForm] = useState({
        productId: "",
        pricingType: "unit", // unit | combo2 | combo3 | combo4 | combo5
        qty: 1
    });

    // Método de cobro (checkout)
    const [metodoCobro, setMetodoCobro] = useState("Efectivo");

    // Resumen stock (última venta)
    const [lastStockMovements, setLastStockMovements] = useState([]);

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

    const getProductById = (id) => products.find((p) => p.id === id);

    const getComboPrice = (product, n) => {
        if (!product) return null;
        // compat: si existe precioCombo viejo, lo tratamos como combo2
        if (n === 2) return toNumberOrNull(product.combo2 ?? product.precioCombo ?? null);
        return toNumberOrNull(product[`combo${n}`] ?? null);
    };

    const getUnitPrice = (product) => toNumberOrNull(product?.precioUnidad ?? null);

    const buildPricingOptions = (product) => {
        if (!product) return [];
        const opts = [];

        const unitPrice = getUnitPrice(product);
        if (unitPrice !== null) {
            opts.push({
                value: "unit",
                label: "Unidad",
                packSize: 1,
                pricePerPack: unitPrice
            });
        }

        for (let n = 2; n <= 5; n++) {
            const p = getComboPrice(product, n);
            if (p !== null) {
                opts.push({
                    value: `combo${n}`,
                    label: `Combo ${n}x`,
                    packSize: n,
                    pricePerPack: p
                });
            }
        }

        return opts;
    };

    const buildProductTypesLabel = (product) => {
        // muestra tipos disponibles pero SIN montos
        const types = [];
        if (getUnitPrice(product) !== null) types.push("U");
        for (let n = 2; n <= 5; n++) {
            if (getComboPrice(product, n) !== null) types.push(`${n}x`);
        }
        if (types.length === 0) return "";
        return ` | ${types.join(", ")}`;
    };

    const selectedProductForCart = useMemo(() => {
        const id = Number(cartForm.productId);
        if (!Number.isFinite(id)) return null;
        return getProductById(id) || null;
    }, [cartForm.productId, products]);

    const pricingOptions = useMemo(() => {
        return buildPricingOptions(selectedProductForCart);
    }, [selectedProductForCart]);

    // Cargar productos y ventas del localStorage
    useEffect(() => {
        setProducts(readLS(LS_PRODUCTS, []));
        setSales(readLS(LS_SALES, []));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync entre tabs
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === LS_PRODUCTS) setProducts(readLS(LS_PRODUCTS, []));
            if (e.key === LS_SALES) setSales(readLS(LS_SALES, []));
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filtrar productos por búsqueda
    const filteredProducts = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return products;
        return products.filter((p) => String(p?.nombre ?? "").toLowerCase().includes(q));
    }, [products, query]);

    // Ventas visibles: SOLO las registradas por este usuario
    const visibleSales = useMemo(() => {
        const myName = user?.name || "Personal";
        return (sales || []).filter((s) => (s?.registradoPor || "Personal") === myName);
    }, [sales, user]);

    // Total del carrito (solo de la venta actual)
    const cartTotal = useMemo(() => {
        return cartItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
    }, [cartItems]);

    // Si cambia el producto del carrito, seteo pricingType a algo válido
    useEffect(() => {
        if (!selectedProductForCart) return;
        const opts = buildPricingOptions(selectedProductForCart);
        if (opts.length === 0) return;

        const exists = opts.some((o) => o.value === cartForm.pricingType);
        if (!exists) {
            setCartForm((prev) => ({ ...prev, pricingType: opts[0].value }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProductForCart]);

    const getCurrentPricing = () => {
        if (!selectedProductForCart) return null;
        const opts = buildPricingOptions(selectedProductForCart);
        return opts.find((o) => o.value === cartForm.pricingType) || null;
    };

    const addToCart = () => {
        const product = selectedProductForCart;
        if (!product) {
            alert("Seleccioná un producto válido.");
            return;
        }

        const qty = Math.floor(Number(cartForm.qty));
        if (!Number.isFinite(qty) || qty < 1) {
            alert("Ingresá una cantidad válida (mínimo 1).");
            return;
        }

        const pricing = getCurrentPricing();
        if (!pricing) {
            alert("Seleccioná un tipo de precio (unidad o combo).");
            return;
        }

        const subtotal = pricing.pricePerPack * qty;

        const newItem = {
            id: Date.now(),
            productId: product.id,
            productName: product.nombre,
            pricingType: pricing.value, // unit | combo2..5
            packSize: pricing.packSize, // 1 | 2..5
            qtyPacks: qty, // cantidad de unidades o cantidad de combos
            pricePerPack: pricing.pricePerPack,
            subtotal
        };

        // Merge si es el mismo producto + mismo tipo + mismo precio
        setCartItems((prev) => {
            const idx = prev.findIndex(
                (x) =>
                    x.productId === newItem.productId &&
                    x.pricingType === newItem.pricingType &&
                    Number(x.pricePerPack) === Number(newItem.pricePerPack)
            );

            if (idx === -1) return [...prev, newItem];

            const copy = [...prev];
            const old = copy[idx];
            const mergedQty = Number(old.qtyPacks) + Number(newItem.qtyPacks);
            copy[idx] = {
                ...old,
                qtyPacks: mergedQty,
                subtotal: mergedQty * Number(old.pricePerPack)
            };
            return copy;
        });

        // Reset qty (mantengo producto y tipo seleccionado)
        setCartForm((prev) => ({ ...prev, qty: 1 }));
    };

    const removeCartItem = (itemId) => {
        setCartItems((prev) => prev.filter((x) => x.id !== itemId));
    };

    const changeCartItemQty = (itemId, delta) => {
        setCartItems((prev) =>
            prev.map((x) => {
                if (x.id !== itemId) return x;
                const nextQty = Math.max(1, Math.floor(Number(x.qtyPacks) + delta));
                return {
                    ...x,
                    qtyPacks: nextQty,
                    subtotal: nextQty * Number(x.pricePerPack)
                };
            })
        );
    };

    const clearCart = () => setCartItems([]);

    const renderPricingTypeLabel = (pricingType) => {
        if (pricingType === "unit") return "Unidad";
        if (String(pricingType).startsWith("combo")) {
            const n = Number(String(pricingType).replace("combo", ""));
            if (Number.isFinite(n)) return `Combo ${n}x`;
        }
        return String(pricingType);
    };

    const buildSalePrimaryProduct = (sale) => {
        if (Array.isArray(sale?.items) && sale.items.length > 0) {
            return sale.items[0]?.productName || "Producto";
        }
        if (sale?.productName) return sale.productName;
        return "Producto";
    };

    const buildSaleDetailLines = (sale) => {
        if (Array.isArray(sale?.items) && sale.items.length > 0) {
            const primary = buildSalePrimaryProduct(sale);

            return sale.items.map((it) => {
                const labelForLine = it.packSize === 1 ? `Unidad` : `Combo ${it.packSize}x`;

                if (it.productName === primary) {
                    return `${it.qtyPacks} -> ${labelForLine}`;
                }

                return `${it.qtyPacks} -> ${it.productName} ${labelForLine}`;
            });
        }

        return ["-"];
    };

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

        // Validación stock suficiente
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

            movements.push({
                productId: pid,
                productName: p.nombre,
                before,
                sold: soldUnits,
                after
            });
        }

        // Aplicar descuento
        const updatedProducts = products.map((p) => {
            const pid = Number(p.id);
            const soldUnits = unitsMap.get(pid);
            if (!soldUnits) return p;
            const before = Number(p.cantidad) || 0;
            const after = before - soldUnits;
            return { ...p, cantidad: after };
        });

        return { ok: true, updatedProducts, movements };
    };

    const checkout = () => {
        if (cartItems.length === 0) {
            alert("El carrito está vacío.");
            return;
        }

        // Descontar stock
        const stockResult = applyStockDiscountOrFail(cartItems);
        if (!stockResult.ok) return;

        setProducts(stockResult.updatedProducts);
        writeLS(LS_PRODUCTS, stockResult.updatedProducts);

        const total = Number(cartTotal);

        const newSale = {
            id: Date.now(),
            items: cartItems,
            totalCobrado: total,
            montoCobrado: total, // alias
            metodoCobro,
            fecha: new Date().toISOString(),
            registradoPor: user?.name || "Personal",
            registradoPorRol: user?.role || "staff",
            stockMovements: stockResult.movements
        };

        const updatedSales = [...(sales || []), newSale];
        setSales(updatedSales);
        writeLS(LS_SALES, updatedSales);

        setLastStockMovements(stockResult.movements);
        clearCart();
        alert("Venta registrada y stock actualizado ✅");
    };

    // Detalle producto
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
                                <small className="text-white opacity-75">Panel de Personal</small>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            <div className="text-end d-none d-md-block">
                                <div className="text-white fw-semibold">{user?.name || "Personal"}</div>
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

            {/* Tabs */}
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

            {/* Contenido */}
            <main className="main-content">
                <div className="container-fluid">
                    {/* TAB PRODUCTOS */}
                    {activeTab === "productos" && (
                        <div className="content-card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <div>
                                        <h4 className="mb-1">Catálogo de Productos</h4>
                                        <div className="text-muted">Total de productos: {products.length}</div>
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
                                            <th>Producto</th>
                                            <th className="text-end">Precio Unidad</th>
                                            <th className="text-end">Combo 2x</th>
                                            <th className="text-end">Combo 3x</th>
                                            <th className="text-end">Combo 4x</th>
                                            <th className="text-end">Combo 5x</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center text-muted py-5">
                                                    {query ? "No se encontraron productos con ese nombre" : "No hay productos disponibles"}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map((product) => {
                                                const c2 = getComboPrice(product, 2);
                                                const c3 = getComboPrice(product, 3);
                                                const c4 = getComboPrice(product, 4);
                                                const c5 = getComboPrice(product, 5);

                                                return (
                                                    <tr key={product.id}>
                                                        <td className="fw-semibold">{product.nombre}</td>
                                                        <td className="text-end fw-bold">{formatMoneyOrDash(getUnitPrice(product))}</td>
                                                        <td className="text-end fw-bold">{formatMoneyOrDash(c2)}</td>
                                                        <td className="text-end fw-bold">{formatMoneyOrDash(c3)}</td>
                                                        <td className="text-end fw-bold">{formatMoneyOrDash(c4)}</td>
                                                        <td className="text-end fw-bold">{formatMoneyOrDash(c5)}</td>
                                                        <td className="text-center">
                                                            <button className="btn btn-sm btn-outline-primary" onClick={() => viewProductDetails(product)}>
                                                                <i className="bi bi-eye me-1"></i>
                                                                Ver
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB VENTAS */}
                    {activeTab === "ventas" && (
                        <div className="row g-4">
                            {/* CARRITO / REGISTRAR */}
                            <div className="col-12 col-lg-5">
                                <div className="content-card">
                                    <div className="card-header">
                                        <h4 className="mb-1">Nueva Venta</h4>
                                        <div className="text-muted">Agregá productos al carrito y registrá la venta</div>
                                    </div>

                                    <div className="card-body">
                                        {/* Agregar item */}
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
                                                        {buildProductTypesLabel(p)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Selección de precio (radios) - SIN VALORES */}
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Tipo de precio</label>

                                            {!selectedProductForCart ? (
                                                <div className="text-muted small">Seleccioná un producto para ver sus opciones.</div>
                                            ) : (
                                                <div className="d-flex flex-wrap gap-2">
                                                    {pricingOptions.map((opt) => (
                                                        <div key={opt.value}>
                                                            <input
                                                                className="btn-check"
                                                                type="radio"
                                                                name="pricingType"
                                                                id={`pricing-${opt.value}`}
                                                                checked={cartForm.pricingType === opt.value}
                                                                onChange={() => setCartForm((prev) => ({ ...prev, pricingType: opt.value }))}
                                                            />
                                                            <label className="btn btn-outline-primary" htmlFor={`pricing-${opt.value}`}>
                                                                {opt.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Cantidad */}
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                {(() => {
                                                    const p = getCurrentPricing();
                                                    if (!p) return "Cantidad";
                                                    if (p.packSize === 1) return "Cantidad (unidades)";
                                                    return `Cantidad (combos ${p.packSize}x)`;
                                                })()}{" "}
                                                <span className="text-danger">*</span>
                                            </label>

                                            <input
                                                type="number"
                                                className="form-control"
                                                min="1"
                                                value={cartForm.qty}
                                                onChange={(e) => setCartForm((prev) => ({ ...prev, qty: e.target.value }))}
                                            />

                                            {(() => {
                                                const p = getCurrentPricing();
                                                if (!p) return null;
                                                const qty = Math.floor(Number(cartForm.qty));
                                                if (!Number.isFinite(qty) || qty < 1) return null;

                                                if (p.packSize === 1) {
                                                    return <div className="form-text">Seleccionaste <b>{qty}</b> unidad(es).</div>;
                                                }

                                                return (
                                                    <div className="form-text">
                                                        Equivale a <b>{qty * p.packSize} unidades</b>.
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-primary w-100 mb-4"
                                            onClick={addToCart}
                                            disabled={!cartForm.productId}
                                        >
                                            <i className="bi bi-plus-circle me-2"></i>
                                            Agregar al carrito
                                        </button>

                                        {/* Resumen stock última venta */}
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
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => setLastStockMovements([])}
                                                    >
                                                        <i className="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Carrito */}
                                        <div className="border rounded-3 p-3 bg-light">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="mb-0 fw-bold">
                                                    <i className="bi bi-cart3 me-2"></i>
                                                    Carrito
                                                </h6>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={clearCart}
                                                    disabled={cartItems.length === 0}
                                                >
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
                                                                    {it.packSize === 1
                                                                        ? `${it.qtyPacks} un.`
                                                                        : `${it.qtyPacks} combo(s) → ${it.qtyPacks * it.packSize} un.`}
                                                                </div>
                                                            </div>

                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="btn-group" role="group">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => changeCartItemQty(it.id, -1)}
                                                                    >
                                                                        <i className="bi bi-dash"></i>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => changeCartItemQty(it.id, +1)}
                                                                    >
                                                                        <i className="bi bi-plus"></i>
                                                                    </button>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => removeCartItem(it.id)}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <hr />

                                            {/* SOLO TOTAL A COBRAR */}
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div className="fw-semibold">Total a cobrar</div>
                                                <div className="fs-5 fw-bold text-success">{formatMoneyOrDash(cartTotal)}</div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">
                                                    Método de cobro <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={metodoCobro}
                                                    onChange={(e) => setMetodoCobro(e.target.value)}
                                                >
                                                    <option value="Efectivo">Efectivo</option>
                                                    <option value="Mercado Pago">Mercado Pago</option>
                                                </select>
                                            </div>

                                            <button
                                                type="button"
                                                className="btn btn-success w-100"
                                                onClick={checkout}
                                                disabled={cartItems.length === 0}
                                            >
                                                <i className="bi bi-check-circle me-2"></i>
                                                Registrar Venta
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* HISTORIAL (sin total) */}
                            <div className="col-12 col-lg-7">
                                <div className="content-card">
                                    <div className="card-header">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h4 className="mb-1">Historial</h4>
                                                <div className="text-muted">Solo muestra lo que registraste vos</div>
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
                                                    <th>Detalle</th>
                                                    <th>Método</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {visibleSales.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="text-center text-muted py-5">
                                                            No hay ventas registradas por vos todavía
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    [...visibleSales]
                                                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                                                        .map((sale) => {
                                                            const primaryProduct = buildSalePrimaryProduct(sale);
                                                            const lines = buildSaleDetailLines(sale);

                                                            return (
                                                                <tr key={sale.id}>
                                                                    <td>{new Date(sale.fecha).toLocaleDateString("es-AR")}</td>
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
                                                                </tr>
                                                            );
                                                        })
                                                )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de Detalles del Producto */}
            {showProductDetailModal && selectedProduct && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
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
                                {(() => {
                                    const unit = getUnitPrice(selectedProduct);
                                    const c2 = getComboPrice(selectedProduct, 2);
                                    const c3 = getComboPrice(selectedProduct, 3);
                                    const c4 = getComboPrice(selectedProduct, 4);
                                    const c5 = getComboPrice(selectedProduct, 5);

                                    return (
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <div className="fw-bold fs-4">{selectedProduct.nombre}</div>
                                                <div className="text-muted small">Precios disponibles</div>
                                            </div>

                                            <div className="col-12 col-md-4">
                                                <div className="p-3 bg-light rounded-3 h-100">
                                                    <div className="text-muted small fw-semibold">Unidad</div>
                                                    <div className="fs-4 fw-bold text-primary">{formatMoneyOrDash(unit)}</div>
                                                </div>
                                            </div>

                                            <div className="col-12 col-md-4">
                                                <div className="p-3 bg-light rounded-3 h-100">
                                                    <div className="text-muted small fw-semibold">Combo 2x</div>
                                                    <div className="fs-5 fw-bold text-success">{formatMoneyOrDash(c2)}</div>
                                                </div>
                                            </div>

                                            <div className="col-12 col-md-4">
                                                <div className="p-3 bg-light rounded-3 h-100">
                                                    <div className="text-muted small fw-semibold">Combo 3x</div>
                                                    <div className="fs-5 fw-bold text-success">{formatMoneyOrDash(c3)}</div>
                                                </div>
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <div className="p-3 bg-light rounded-3 h-100">
                                                    <div className="text-muted small fw-semibold">Combo 4x</div>
                                                    <div className="fs-5 fw-bold text-success">{formatMoneyOrDash(c4)}</div>
                                                </div>
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <div className="p-3 bg-light rounded-3 h-100">
                                                    <div className="text-muted small fw-semibold">Combo 5x</div>
                                                    <div className="fs-5 fw-bold text-success">{formatMoneyOrDash(c5)}</div>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="p-2 bg-light rounded-3 text-muted small">
                                                    ID del producto: <b>{selectedProduct.id}</b>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
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
