import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTruck,
  faMoneyBillWave,
  faCheckCircle,
  faTimesCircle,
  faHistory,
  faTimes,
  faUser,
  faShoppingCart,
  faDownload,
  faFileCsv,
  faSearch,
  faThLarge,
  faList,
  faChevronLeft,
  faChevronRight,
  faMoon,
  faSun,
  faClock,
  faEye,
  faStar as faStarSolid
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";

const BASE_URL = "https://agrihub-2.onrender.com";

function RegDeliverymanPage() {
  // original states
  const [deliverymanId, setDeliverymanId] = useState("");
  const [availableSellerOrders, setAvailableSellerOrders] = useState([]);
  const [mySellerOrders, setMySellerOrders] = useState([]);
  const [salary, setSalary] = useState(0);
  const [showSalary, setShowSalary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acceptingOrder, setAcceptingOrder] = useState(null);

  // new UI states
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("delivery_dashboard_theme") === "dark";
    } catch {
      return false;
    }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [viewMode, setViewMode] = useState("grid");
  const [selectedOrderForTimeline, setSelectedOrderForTimeline] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // NEW features (frontend-only)
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("fav_orders") || "[]");
      return new Set(Array.isArray(raw) ? raw : []);
    } catch {
      return new Set();
    }
  });
  const [toasts, setToasts] = useState([]);
  const [highValueOnly, setHighValueOnly] = useState(false);
  const [highValueThreshold, setHighValueThreshold] = useState(5000);
  const searchInputRef = useRef(null);

  const navigate = useNavigate();

  // apply/persist theme
  useEffect(() => {
    try {
      localStorage.setItem("delivery_dashboard_theme", darkMode ? "dark" : "light");
      if (darkMode) document.body.classList.add("delivery-dark");
      else document.body.classList.remove("delivery-dark");
    } catch {}
  }, [darkMode]);

  // Toast helpers
  const showToast = (message, type = "info", timeout = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    if (timeout > 0) {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, timeout);
    }
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150?text=No+Image";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date not available";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeliveryHistory = () => {
    const sellerDeliveries = mySellerOrders.filter(
      (order) => order.deliveryStatus === "delivered" || order.deliveryStatus === "approved"
    );
    return sellerDeliveries.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  };

  // derive all districts from session cache + fetched data
  const allDistricts = useMemo(() => {
    const all = [...availableSellerOrders, ...mySellerOrders];
    const setDistricts = new Set(all.map((o) => o.district).filter(Boolean));
    return Array.from(setDistricts).sort();
  }, [availableSellerOrders, mySellerOrders]);

  // Client-side filter & sorting with new highValueOnly toggle and favorites filter in UI
  const filterAndSort = (orders) => {
    let filtered = [...orders];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          (o.item && o.item.toLowerCase().includes(q)) ||
          (o.district && o.district.toLowerCase().includes(q)) ||
          (o.sellerName && o.sellerName.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") filtered = filtered.filter((o) => o.deliveryStatus === filterStatus);
    if (filterDistrict !== "all") filtered = filtered.filter((o) => o.district === filterDistrict);
    if (highValueOnly) filtered = filtered.filter((o) => (o.price || 0) >= Number(highValueThreshold || 0));

    switch (sortBy) {
      case "date-desc":
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case "date-asc":
        filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case "price-desc":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "price-asc":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "quantity-desc":
        filtered.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
        break;
      case "quantity-asc":
        filtered.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
        break;
      case "district":
        filtered.sort((a, b) => (a.district || "").localeCompare(b.district || ""));
        break;
      default:
        break;
    }
    return filtered;
  };

  const paginate = (orders) => {
    const start = (currentPage - 1) * itemsPerPage;
    return orders.slice(start, start + itemsPerPage);
  };

  // Keyboard shortcuts: d = toggle dark, h = toggle history, s = view salary, f = focus search
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === "d") setDarkMode((d) => !d);
      if (e.key === "h") setShowHistory((s) => !s);
      if (e.key === "s") fetchSalaryAndShow();
      if (e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SESSION caching keys
  const SESSION_AVAILABLE_KEY = "session_available_orders";
  const SESSION_MY_KEY = "session_my_orders";

  useEffect(() => {
    const fetchDeliverymanData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${BASE_URL}/deliveryman/userdata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (data.status === "ok" && data.data && data.data._id) {
          setDeliverymanId(data.data._id);
        }
      } catch (err) {
        console.error("Error fetching deliveryman data:", err);
        showToast("Failed to fetch user data", "error");
      } finally {
        setLoading(false);
      }
    };

    // load session cache first (improves UX offline/slow)
    try {
      const av = sessionStorage.getItem(SESSION_AVAILABLE_KEY);
      if (av) setAvailableSellerOrders(JSON.parse(av));
      const my = sessionStorage.getItem(SESSION_MY_KEY);
      if (my) setMySellerOrders(JSON.parse(my));
    } catch {}

    fetchDeliverymanData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!deliverymanId) return;
    let mounted = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const availableSellerResponse = await axios.get(`${BASE_URL}/sellerorder/deliveryman/available`);
        if (mounted) {
          const arr = Array.isArray(availableSellerResponse.data) ? availableSellerResponse.data : [];
          setAvailableSellerOrders(arr);
          try { sessionStorage.setItem(SESSION_AVAILABLE_KEY, JSON.stringify(arr)); } catch {}
        }

        const mySellerResponse = await axios.get(`${BASE_URL}/sellerorder/deliveryman/${deliverymanId}`);
        if (mounted) {
          const arr = Array.isArray(mySellerResponse.data) ? mySellerResponse.data : [];
          setMySellerOrders(arr);
          try { sessionStorage.setItem(SESSION_MY_KEY, JSON.stringify(arr)); } catch {}
        }

        try {
          const salaryResponse = await axios.get(`${BASE_URL}/salary/${deliverymanId}`);
          if (mounted) setSalary(salaryResponse.data.salary ?? 0);
        } catch (err) {
          console.warn("salary fetch failed:", err?.message);
          if (mounted) setSalary(0);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        showToast("Failed to fetch orders", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deliverymanId]);

  // preserved actions (use toasts instead of raw alert)
  const handleAcceptDelivery = async (orderId) => {
    if (!deliverymanId) {
      showToast("Please log in to accept orders", "error");
      return;
    }
    if (!orderId) {
      showToast("Invalid order id", "error");
      return;
    }
    if (acceptingOrder === orderId) return;

    try {
      setAcceptingOrder(orderId);
      const endpoint = `${BASE_URL}/sellerorder/${orderId}/accept`;
      const response = await axios.put(endpoint, { deliverymanId }, { headers: { "Content-Type": "application/json" }, timeout: 10000 });

      const acceptedOrder = availableSellerOrders.find((o) => o._id === orderId);
      if (acceptedOrder) {
        const updatedOrder = { ...acceptedOrder, deliverymanId, acceptedByDeliveryman: true, deliveryStatus: response.data.deliveryStatus || "in-transit" };
        setMySellerOrders((prev) => [...prev, updatedOrder]);
        setAvailableSellerOrders((prev) => prev.filter((o) => o._id !== orderId));
        try {
          // update session cache
          sessionStorage.setItem(SESSION_MY_KEY, JSON.stringify([...mySellerOrders, updatedOrder]));
          sessionStorage.setItem(SESSION_AVAILABLE_KEY, JSON.stringify(availableSellerOrders.filter((o) => o._id !== orderId)));
        } catch {}
      }

      showToast("Order accepted successfully!", "success");
    } catch (err) {
      console.error("Error accepting:", err);
      let msg = "Failed to accept order.";
      if (err.response) msg += ` ${err.response.data?.message || ""}`;
      else msg += ` ${err.message}`;
      showToast(msg, "error");
    } finally {
      setAcceptingOrder(null);
    }
  };

  const handleDeliveryStatus = async (orderId, status) => {
    if (!orderId || !status) {
      showToast("Invalid order or status", "error");
      return;
    }
    try {
      const url = `${BASE_URL}/sellerorder/${orderId}/status`;
      await axios.put(url, { status }, { headers: { "Content-Type": "application/json" }, timeout: 10000 });
      setMySellerOrders((prev) => {
        const updated = prev.map((o) => (o._id === orderId ? { ...o, deliveryStatus: status } : o));
        try { sessionStorage.setItem(SESSION_MY_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
      showToast(`Order status updated to "${status}" successfully!`, "success");
    } catch (err) {
      console.error("Error updating status:", err);
      let msg = "Failed to update status.";
      if (err.response) msg += ` ${err.response.data?.message || ""}`; else msg += ` ${err.message}`;
      showToast(msg, "error");
    }
  };

  // NEW: logout (frontend-only)
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("govLoggedIn");
    } catch (e) {
      console.warn("Error clearing storage:", e);
    }
    navigate("/login", { replace: true });
  };

  // NEW: view salary (unchanged endpoints, but toasts used)
  const fetchSalaryAndShow = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Please login to view salary.", "error");
        return;
      }

      const userRes = await fetch(`${BASE_URL}/user/userdata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      const userData = await userRes.json();
      const role = (userData.data?.role || userData.data?.userRole || "").toString().toLowerCase();

      if (role === "deliveryman" || role === "delivery") {
        const dmRes = await fetch(`${BASE_URL}/deliveryman/userdata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const dmData = await dmRes.json();
        if (dmData.status === "ok" && dmData.data) {
          setSalary(dmData.data.salary ?? 0);
          setDeliverymanId((prev) => prev || dmData.data._id || dmData.data.id || "");
          setShowSalary(true);
          showToast("Salary loaded", "success");
          return;
        }
      }

      showToast("You are not a deliveryman or salary not available.", "error");
    } catch (err) {
      console.error("Error fetching salary:", err);
      showToast("Failed to fetch salary. Please try again later.", "error");
    }
  };

  const openTimeline = (order) => {
    setSelectedOrderForTimeline(order);
    setShowTimeline(true);
  };

  // Favorites (client-side only)
  const toggleFavorite = (orderId) => {
    setFavorites((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      try {
        localStorage.setItem("fav_orders", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    showToast("Updated favorites", "info");
  };

  // EXPORT: CSV (unchanged core logic, improved quoting) but use toasts not alerts
  const exportHistoryToCSV = () => {
    const history = getDeliveryHistory();
    if (!history.length) {
      showToast("No delivery history to export.", "info");
      return;
    }

    const headers = ["Item", "Quantity", "Price (Rs.)", "Order Date", "Delivery Date", "From (Farmer)", "Farmer Contact", "To (Seller)", "Seller Contact", "District", "Status", "Salary"];
    const rows = [headers.join(",")];

    history.forEach((order) => {
      const hasFarmer = order.farmerId && typeof order.farmerId === "object";
      const farmerName = hasFarmer ? `${order.farmerId.fname || ""} ${order.farmerId.lname || ""}`.trim() : (order.farmerName || "Unknown");
      const farmerContact = hasFarmer && order.farmerId.mobile ? order.farmerId.mobile : "N/A";

      const hasSeller = order.sellerId && typeof order.sellerId === "object";
      const sellerName = hasSeller ? `${order.sellerId.fname || ""} ${order.sellerId.lname || ""}`.trim() : (order.sellerName || "Unknown");
      const sellerContact = hasSeller && order.sellerId.mobile ? order.sellerId.mobile : "N/A";

      const row = [
        `"${(order.item || "").replace(/"/g, '""')}"`,
        `"${order.quantity || ""}"`,
        order.price ?? "",
        `"${formatDate(order.createdAt)}"`,
        `"${formatDate(order.updatedAt)}"`,
        `"${(farmerName || "").replace(/"/g, '""')}"`,
        `"${(farmerContact || "").replace(/"/g, '""')}"`,
        `"${(sellerName || "").replace(/"/g, '""')}"`,
        `"${(sellerContact || "").replace(/"/g, '""')}"`,
        `"${(order.district || "N/A").replace(/"/g, '""')}"`,
        `"${order.deliveryStatus || "delivered"}"`,
        `"${salary}"`
      ].join(",");

      rows.push(row);
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delivery_history_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setShowExportMenu(false);
    showToast("Delivery history exported as CSV", "success");
  };

  // EXPORT: PDF using browser print (open a printable window and call print) - preserved but use blob fallback if popup blocked
  const exportHistoryToPDF = () => {
    const history = getDeliveryHistory();
    if (!history.length) {
      showToast("No delivery history to export.", "info");
      return;
    }

    const title = `Delivery History - ${new Date().toLocaleDateString()}`;
    let rowsHtml = "";
    history.forEach((order) => {
      const hasFarmer = order.farmerId && typeof order.farmerId === "object";
      const farmerName = hasFarmer ? `${order.farmerId.fname || ""} ${order.farmerId.lname || ""}`.trim() : (order.farmerName || "Unknown");
      const farmerContact = hasFarmer && order.farmerId.mobile ? order.farmerId.mobile : "N/A";

      const hasSeller = order.sellerId && typeof order.sellerId === "object";
      const sellerName = hasSeller ? `${order.sellerId.fname || ""} ${order.sellerId.lname || ""}`.trim() : (order.sellerName || "Unknown");
      const sellerContact = hasSeller && order.sellerId.mobile ? order.sellerId.mobile : "N/A";

      rowsHtml += `<tr>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(order.item || "")}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${order.quantity || ""}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${order.price ?? ""}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(formatDate(order.createdAt))}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(formatDate(order.updatedAt))}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(farmerName)}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(farmerContact)}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(sellerName)}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(sellerContact)}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(order.district || "N/A")}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(order.deliveryStatus || "delivered")}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${salary ?? 0}</td>
      </tr>`;
    });

    const html = `
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 20px; }
            h1 { font-size: 20px; margin-bottom: 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f3f4f6; font-weight: 700; text-align: left; }
            @media print {
              body { margin: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(title)}</h1>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty (kg)</th>
                <th>Price (Rs.)</th>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>From (Farmer)</th>
                <th>Farmer Contact</th>
                <th>To (Seller)</th>
                <th>Seller Contact</th>
                <th>District</th>
                <th>Status</th>
                <th>Salary (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Open via blob to avoid "document" null when popup blocked
    try {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      let newWindow = null;
      try {
        newWindow = window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        newWindow = null;
      }

      if (!newWindow) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        try {
          newWindow.focus();
        } catch (err) {
          // ignore
        }
      }

      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {}
      }, 10000);

      setShowExportMenu(false);
      showToast("PDF preview opened (or download started).", "success");
    } catch (err) {
      console.error("Error creating print view:", err);
      showToast("Unable to open print view. Please allow popups.", "error");
    }
  };

  // Export visible orders (client-side only) -> CSV
  const exportVisibleOrdersCSV = (orders, name = "orders") => {
    const filtered = filterAndSort(orders);
    if (!filtered.length) {
      showToast("No orders to export.", "info");
      return;
    }

    const headers = ["Item", "Quantity", "Price (Rs.)", "District", "Status", "Order Date"];
    const rows = [headers.join(",")];

    filtered.forEach((order) => {
      const row = [
        `"${(order.item || "").replace(/"/g, '""')}"`,
        `"${order.quantity || ""}"`,
        order.price ?? "",
        `"${(order.district || "N/A").replace(/"/g, '""')}"`,
        `"${order.deliveryStatus || ""}"`,
        `"${formatDate(order.createdAt)}"`
      ].join(",");
      rows.push(row);
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast("Visible orders exported as CSV", "success");
  };

  // escape HTML to avoid injection
  const escapeHtml = (str) => {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  // UI helpers
  const DeliveryStatusBadge = ({ status }) => {
    const base = {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 20,
      color: "white",
      fontWeight: 700,
    };
    if (status === "delivered") return <span style={{ ...base, backgroundColor: "#28a745" }}><FontAwesomeIcon icon={faCheckCircle} /> Delivered</span>;
    if (status === "not-delivered") return <span style={{ ...base, backgroundColor: "#dc3545" }}><FontAwesomeIcon icon={faTimesCircle} /> Not Delivered</span>;
    if (status === "in-transit") return <span style={{ ...base, backgroundColor: "#ff9800" }}><FontAwesomeIcon icon={faTruck} /> In Transit</span>;
    if (status === "approved") return <span style={{ ...base, backgroundColor: "#0ea5e9" }}><FontAwesomeIcon icon={faCheckCircle} /> Approved</span>;
    return null;
  };

  const OrderCard = ({ order, isAvailable = false }) => (
    <div style={{
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      overflow: "hidden",
      background: darkMode ? "#2d3748" : "white",
      color: darkMode ? "white" : "black",
      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      position: "relative"
    }}>
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 5 }}>
        <button title={favorites.has(order._id) ? "Unfavorite" : "Add to favorites"} onClick={() => toggleFavorite(order._id)} style={{ background: "transparent", border: "none", color: favorites.has(order._id) ? "#f59e0b" : (darkMode ? "white" : "#6b7280"), cursor: "pointer", fontSize: 18 }}>
          <FontAwesomeIcon icon={favorites.has(order._id) ? faStarSolid : faStarRegular} />
        </button>
      </div>

      <div style={{ position: "relative" }}>
        <img src={getImageUrl(order.productImage)} alt={order.item} style={{ width: "100%", height: 200, objectFit: "cover" }} onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/400x300?text=No+Image"; }} />
        {!isAvailable && <div style={{ position: "absolute", top: 12, right: 12 }}><DeliveryStatusBadge status={order.deliveryStatus} /></div>}
      </div>

      <div style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.item}</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ background: "#e3f2fd", padding: "6px 10px", borderRadius: 8 }}><strong>{order.quantity} kg</strong></div>
          <div style={{ background: "#e8f5e9", padding: "6px 10px", borderRadius: 8 }}><strong>Rs. {order.price}</strong></div>
          {order.district && <div style={{ background: "#fff3e0", padding: "6px 10px", borderRadius: 8 }}>{order.district}</div>}
        </div>
        <div style={{ fontSize: 13, color: darkMode ? "#cbd5e1" : "#6c757d", marginBottom: 12 }}><FontAwesomeIcon icon={faClock} /> {formatDate(order.createdAt)}</div>

        {isAvailable ? (
          <button onClick={() => handleAcceptDelivery(order._id)} disabled={acceptingOrder === order._id} style={{
            width: "100%",
            padding: 12,
            backgroundColor: acceptingOrder === order._id ? "#9ca3af" : "#20c997",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: acceptingOrder === order._id ? "not-allowed" : "pointer",
            fontWeight: 700
          }}>
            <FontAwesomeIcon icon={faTruck} /> {acceptingOrder === order._id ? "Accepting..." : "Accept Delivery"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => openTimeline(order)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#007bff", color: "white", fontWeight: 700 }}><FontAwesomeIcon icon={faEye} /> View Timeline</button>
            {(order.deliveryStatus === "in-transit" || order.deliveryStatus === "approved") && (
              <>
                <button onClick={() => handleDeliveryStatus(order._id, "delivered")} style={{ padding: 10, borderRadius: 8, border: "none", background: "#28a745", color: "white", fontWeight: 700 }}><FontAwesomeIcon icon={faCheckCircle} /> Delivered</button>
                <button onClick={() => handleDeliveryStatus(order._id, "not-delivered")} style={{ padding: 10, borderRadius: 8, border: "none", background: "#dc3545", color: "white", fontWeight: 700 }}><FontAwesomeIcon icon={faTimesCircle} /> Not Delivered</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const OrdersList = ({ orders, isAvailable }) => {
    const filtered = filterAndSort(orders);
    const paginated = paginate(filtered);

    if (!filtered.length) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: "#6c757d" }}>
          <FontAwesomeIcon icon={faShoppingCart} size="3x" />
          <div style={{ marginTop: 12 }}>No orders found</div>
        </div>
      );
    }

    return (
      <>
        <div style={{ marginBottom: 12, color: "#6c757d" }}>Showing {paginated.length} of {filtered.length} orders</div>

        <div style={viewMode === "grid" ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 } : { display: "flex", flexDirection: "column", gap: 12 }}>
          {paginated.map((o) => <div key={o._id} style={viewMode === "grid" ? {} : { border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, background: darkMode ? "#2d3748" : "white" }}><OrderCard order={o} isAvailable={isAvailable} /></div>)}
        </div>

        <Pagination totalItems={filtered.length} />
      </>
    );
  };

  const Pagination = ({ totalItems }) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);

    return (
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: 8, borderRadius: 8, border: "none", background: currentPage === 1 ? "#e9ecef" : "#007bff", color: currentPage === 1 ? "#6c757d" : "white" }}><FontAwesomeIcon icon={faChevronLeft} /></button>
        {pages.map((p) => <button key={p} onClick={() => setCurrentPage(p)} style={{ padding: 8, minWidth: 36, borderRadius: 8, border: "none", background: p === currentPage ? "#007bff" : (darkMode ? "#4a5568" : "#e9ecef"), color: p === currentPage ? "white" : (darkMode ? "white" : "black") }}>{p}</button>)}
        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: 8, borderRadius: 8, border: "none", background: currentPage === totalPages ? "#e9ecef" : "#007bff", color: currentPage === totalPages ? "#6c757d" : "white" }}><FontAwesomeIcon icon={faChevronRight} /></button>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, border: "6px solid #e9ecef", borderTopColor: "#007bff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <div>Loading deliveryman data...</div>
          </div>
        </div>
        <style>{`@keyframes spin { 0%{ transform: rotate(0deg) } 100%{ transform: rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (!deliverymanId) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ color: "crimson" }}>Please log in to access the deliveryman dashboard</h2>
        <p>Deliveryman ID not found. Use "View Salary" to validate your user role or login with a deliveryman account.</p>
        <div style={{ marginTop: 20 }}>
          <button onClick={() => window.location.href = "/login"} style={{ padding: "10px 20px", borderRadius: 8, background: "#007bff", color: "white", border: "none" }}>Go to Login</button>
        </div>
      </div>
    );
  }

  const deliveryHistory = getDeliveryHistory();

  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#0f1724" : "#f5f5f5", color: darkMode ? "#e6eef8" : "#111827", fontFamily: "Arial, sans-serif", paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ background: darkMode ? "#1f2937" : "white", padding: 24, borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 34, color: "#ff9800" }}><FontAwesomeIcon icon={faTruck} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Delivery Dashboard</h1>
            <div style={{ fontSize: 13, color: darkMode ? "#94a3b8" : "#6b7280" }}>Manage orders & deliveries</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button title={darkMode ? "Switch to Light" : "Switch to Dark"} onClick={() => setDarkMode((d) => !d)} style={{ padding: 10, borderRadius: 8, border: "none", background: darkMode ? "#374151" : "#f1f5f9", color: darkMode ? "white" : "black" }}>
            <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
          </button>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={fetchSalaryAndShow} style={{ padding: "10px 14px", background: "#28a745", color: "white", border: "none", borderRadius: 8, fontWeight: 700 }}>
              <FontAwesomeIcon icon={faMoneyBillWave} /> View Salary
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ maxWidth: 1200, margin: "20px auto", padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <FontAwesomeIcon icon={faSearch} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
              <input ref={searchInputRef} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Search by item, seller or district..." style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8, border: "1px solid #d1d5db", background: darkMode ? "#374151" : "white", color: darkMode ? "white" : "black" }} />
            </div>

            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db", background: darkMode ? "#374151" : "white", color: darkMode ? "white" : "black" }}>
              <option value="all">All Status</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="not-delivered">Not Delivered</option>
              <option value="approved">Approved</option>
            </select>

            <select value={filterDistrict} onChange={(e) => { setFilterDistrict(e.target.value); setCurrentPage(1); }} style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db", background: darkMode ? "#374151" : "white", color: darkMode ? "white" : "black" }}>
              <option value="all">All Districts</option>
              {allDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db", background: darkMode ? "#374151" : "white", color: darkMode ? "white" : "black" }}>
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="price-desc">Price (High → Low)</option>
              <option value="price-asc">Price (Low → High)</option>
              <option value="quantity-desc">Quantity (High → Low)</option>
              <option value="quantity-asc">Quantity (Low → High)</option>
              <option value="district">District (A → Z)</option>
            </select>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setViewMode("grid")} style={{ padding: 10, borderRadius: 8, border: "none", background: viewMode === "grid" ? "#007bff" : (darkMode ? "#374151" : "#f1f5f9"), color: viewMode === "grid" ? "white" : (darkMode ? "white" : "black") }}><FontAwesomeIcon icon={faThLarge} /></button>
              <button onClick={() => setViewMode("list")} style={{ padding: 10, borderRadius: 8, border: "none", background: viewMode === "list" ? "#007bff" : (darkMode ? "#374151" : "#f1f5f9"), color: viewMode === "list" ? "white" : (darkMode ? "white" : "black") }}><FontAwesomeIcon icon={faList} /></button>
            </div>
          </div>
        </div>

        {/* Quick filters row */}
        <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={highValueOnly} onChange={(e) => setHighValueOnly(e.target.checked)} />
            High value orders only
          </label>
          {highValueOnly && (
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              Threshold:
              <input type="number" value={highValueThreshold} onChange={(e) => setHighValueThreshold(Number(e.target.value || 0))} style={{ width: 120, padding: 6, borderRadius: 6 }} />
            </label>
          )}
          <button onClick={() => { setFavorites(new Set()); try { localStorage.removeItem("fav_orders"); } catch {} showToast("Cleared favorites", "info"); }} style={{ padding: "8px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: 8 }}>Clear Favorites</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => exportVisibleOrdersCSV(availableSellerOrders, "available_orders")} style={{ padding: "8px 12px", background: "#0ea5e9", color: "white", border: "none", borderRadius: 8 }}><FontAwesomeIcon icon={faFileCsv} /> Export Visible Available</button>
            <button onClick={() => exportVisibleOrdersCSV(mySellerOrders, "my_orders")} style={{ padding: "8px 12px", background: "#06b6d4", color: "white", border: "none", borderRadius: 8 }}><FontAwesomeIcon icon={faFileCsv} /> Export Visible My Orders</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ margin: "0 0 12px 0", color: darkMode ? "#e6eef8" : "#111827" }}>Available Seller Orders</h2>
          <div style={{ background: darkMode ? "#111827" : "white", borderRadius: 12, padding: 16, boxShadow: darkMode ? "none" : "0 4px 12px rgba(0,0,0,0.04)" }}>
            <OrdersList orders={availableSellerOrders} isAvailable={true} />
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ margin: "0 0 12px 0", color: darkMode ? "#e6eef8" : "#111827" }}>My Accepted Seller Orders</h2>
          <div style={{ background: darkMode ? "#111827" : "white", borderRadius: 12, padding: 16 }}>
            <OrdersList orders={mySellerOrders} isAvailable={false} />
          </div>
        </section>
      </div>

      {/* Salary modal */}
      {showSalary && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ width: "100%", maxWidth: 420, background: darkMode ? "#24303a" : "white", color: darkMode ? "#e6eef8" : "black", padding: 24, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>Government Provided Salary</h3>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#28a745" }}>Rs. {salary?.toLocaleString?.() ?? salary}</div>
            <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
              <button onClick={() => setShowSalary(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#007bff", color: "white" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline modal */}
      {showTimeline && selectedOrderForTimeline && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2100 }}>
          <div style={{ width: "100%", maxWidth: 760, background: darkMode ? "#24303a" : "white", color: darkMode ? "#e6eef8" : "black", padding: 24, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}><FontAwesomeIcon icon={faClock} /> Order Timeline - {selectedOrderForTimeline.item}</h3>
            <TimelineView order={selectedOrderForTimeline} darkMode={darkMode} />
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => { setShowTimeline(false); setSelectedOrderForTimeline(null); }} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#007bff", color: "white" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <div style={{ position: "fixed", inset: "8% 6% 8% 6%", zIndex: 2050 }}>
          <div style={{ height: "100%", background: darkMode ? "#0b1220" : "white", borderRadius: 12, overflow: "auto", padding: 20, boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h2 style={{ margin: 0 }}><FontAwesomeIcon icon={faHistory} /> Delivery History</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowExportMenu((s) => !s)} style={{ padding: 10, borderRadius: 8, border: "none", background: "#28a745", color: "white", fontWeight: 700 }}>
                    <FontAwesomeIcon icon={faDownload} /> Export
                  </button>
                  {showExportMenu && (
                    <div style={{ position: "absolute", right: 0, marginTop: 8, width: 260, background: darkMode ? "#1f2937" : "white", boxShadow: "0 6px 18px rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" }}>
                      <button onClick={exportHistoryToCSV} style={{ width: "100%", padding: 12, textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}><FontAwesomeIcon icon={faFileCsv} /> Export as CSV</button>
                      <button onClick={exportHistoryToPDF} style={{ width: "100%", padding: 12, textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}><FontAwesomeIcon icon={faDownload} /> Print / Save as PDF</button>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowHistory(false)} style={{ padding: 10, borderRadius: 8, border: "none", background: "#ef4444", color: "white" }}><FontAwesomeIcon icon={faTimes} /></button>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              {deliveryHistory.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>No delivery history yet</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {deliveryHistory.map((order) => {
                    const farmerName = order.farmerId && typeof order.farmerId === "object" ? `${order.farmerId.fname || ""} ${order.farmerId.lname || ""}`.trim() : (order.farmerName || "Unknown Farmer");
                    const sellerName = order.sellerId && typeof order.sellerId === "object" ? `${order.sellerId.fname || ""} ${order.sellerId.lname || ""}`.trim() : (order.sellerName || "Unknown Seller");
                    return (
                      <div key={order._id} style={{ background: darkMode ? "#111827" : "#f8fafc", borderRadius: 8, padding: 12 }}>
                        <div style={{ display: "flex", gap: 12 }}>
                          <img src={getImageUrl(order.productImage)} alt={order.item} style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 8 }} onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=No+Image"; }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <h4 style={{ margin: 0 }}>{order.item}</h4>
                              <DeliveryStatusBadge status="delivered" />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                              <div>Quantity: <strong>{order.quantity} kg</strong></div>
                              <div>Price: <strong>Rs.{order.price}</strong></div>
                              <div>District: <strong>{order.district || "N/A"}</strong></div>
                              <div>Delivered on: <strong>{formatDate(order.updatedAt || order.createdAt)}</strong></div>
                            </div>

                            <div style={{ marginTop: 12, background: darkMode ? "#0b1220" : "#fff", padding: 12, borderRadius: 8, borderLeft: "4px solid #3b82f6", display: "flex", gap: 12, alignItems: "center" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>FROM</div>
                                <div style={{ fontWeight: 700, marginTop: 4 }}><FontAwesomeIcon icon={faUser} /> {farmerName}</div>
                                {order.farmerId && order.farmerId.mobile && <div style={{ color: "#6b7280", marginTop: 6 }}>Contact: {order.farmerId.mobile}</div>}
                              </div>

                              <div style={{ textAlign: "center", color: "#fb923c" }}>
                                <FontAwesomeIcon icon={faTruck} style={{ fontSize: 24 }} />
                                <div style={{ marginTop: 6 }}>Delivered</div>
                              </div>

                              <div style={{ flex: 1, textAlign: "right" }}>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>TO</div>
                                <div style={{ fontWeight: 700, marginTop: 4 }}><FontAwesomeIcon icon={faShoppingCart} /> {sellerName}</div>
                                {order.sellerId && order.sellerId.mobile && <div style={{ color: "#6b7280", marginTop: 6 }}>Contact: {order.sellerId.mobile}</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating bottom-right buttons group: History (left), View Salary, Logout (right) */}
      <div style={{ position: "fixed", right: 20, bottom: 20, display: "flex", gap: 12, alignItems: "center", zIndex: 2200 }}>
        {/* History button (left-most) */}
        <button onClick={() => setShowHistory((s) => !s)} aria-label="View Delivery History" title="View Delivery History" style={{ background: "#ff9800", color: "white", padding: "12px 14px", borderRadius: 999, border: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <FontAwesomeIcon icon={faHistory} />
          <span className="hidden-mobile">History</span>
          <span style={{ background: "white", color: "#ff9800", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 800 }}>{deliveryHistory.length}</span>
        </button>

        {/* View Salary */}
        <button onClick={fetchSalaryAndShow} style={{ background: "#16a34a", color: "white", padding: "12px 16px", borderRadius: 999, border: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <FontAwesomeIcon icon={faMoneyBillWave} /> <span className="hidden-mobile">View Salary</span>
        </button>

        {/* Logout */}
        <button onClick={handleLogout} style={{ background: "#ef4444", color: "white", padding: "12px 16px", borderRadius: 999, border: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          Logout
        </button>
      </div>

      {/* Toasts */}
      <div style={{ position: "fixed", right: 20, bottom: 96, zIndex: 2300, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} role="status" aria-live="polite" style={{ background: t.type === "error" ? "#ef4444" : (t.type === "success" ? "#16a34a" : "#0ea5e9"), color: "white", padding: "10px 14px", borderRadius: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.12)", minWidth: 220, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1 }}>{t.message}</div>
            <button onClick={() => removeToast(t.id)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}><FontAwesomeIcon icon={faTimes} /></button>
          </div>
        ))}
      </div>

      <style>{`
        .delivery-dark { background: #0f1724 !important; color: #e6eef8 !important; }
        @media (max-width: 640px) { .hidden-mobile { display: none; } }
      `}</style>
    </div>
  );
}

/* Timeline view component */
function TimelineView({ order, darkMode }) {
  const steps = [
    { label: "Order Placed", date: order.createdAt, status: "completed" },
    { label: "Accepted by Deliveryman", date: order.acceptedByDeliveryman ? order.updatedAt : null, status: order.acceptedByDeliveryman ? "completed" : "pending" },
    { label: "In Transit", date: order.deliveryStatus === "in-transit" ? order.updatedAt : null, status: order.deliveryStatus === "in-transit" ? "active" : (order.deliveryStatus === "delivered" ? "completed" : "pending") },
    { label: "Delivered", date: order.deliveryStatus === "delivered" ? order.updatedAt : null, status: order.deliveryStatus === "delivered" ? "completed" : "pending" }
  ];

  const formatDateLocal = (d) => {
    if (!d) return null;
    const date = new Date(d);
    return date.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", background: s.status === "completed" ? "#16a34a" : (s.status === "active" ? "#0ea5e9" : "#6b7280"), color: "white" }}>
              {s.status === "completed" ? "✓" : (s.status === "active" ? "⏳" : (i+1))}
            </div>
            {i < steps.length - 1 && <div style={{ width: 2, height: 64, background: s.status === "completed" ? "#16a34a" : "#6b7280", marginTop: 8 }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: s.status === "active" ? "#0ea5e9" : (darkMode ? "#e6eef8" : "#111827") }}>{s.label}</div>
            <div style={{ color: "#6b7280", marginTop: 6 }}>{s.date ? formatDateLocal(s.date) : (s.status === "pending" ? "Pending" : "")}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RegDeliverymanPage;
