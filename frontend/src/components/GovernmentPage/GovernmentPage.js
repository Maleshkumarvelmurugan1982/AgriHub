import React, { useState, useEffect } from "react";
import axios from "axios";
import "./GovernmentPage.css";
import Navbar from "../Navbar/Navbar";
import FooterNew from "../Footer/FooterNew";
import { useNavigate } from "react-router-dom";

function GovernmentPage() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem("govLoggedIn") === "true");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [schemes, setSchemes] = useState([]);
  const [newScheme, setNewScheme] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editScheme, setEditScheme] = useState("");

  const [deliveryMen, setDeliveryMen] = useState([]);
  const [showDeliveryMen, setShowDeliveryMen] = useState(false);
  const [salaryInputs, setSalaryInputs] = useState({});

  const [applicants, setApplicants] = useState([]);
  const [showApplicantsFor, setShowApplicantsFor] = useState(null);

  const [selectedDeliverymanId, setSelectedDeliverymanId] = useState(null);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  // Export menu
  const [showExportMenu, setShowExportMenu] = useState(false);

  // New UI-only states (client-side features; do not change backend)
  const [schemeSearch, setSchemeSearch] = useState("");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliverySortBy, setDeliverySortBy] = useState("name"); // 'name' | 'salary'
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");

  const BASE_URL = "https://agrihub-2.onrender.com";

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return 'https://via.placeholder.com/150?text=No+Image';
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return ${BASE_URL}${imagePath};
  };

  // Helper: safe date parse
  const parseDateSafe = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
  };

  // Client-side filtered lists
  const filteredSchemes = schemes.filter((s) =>
    s.name?.toLowerCase().includes(schemeSearch.trim().toLowerCase())
  );

  const filteredSortedDeliveryMen = deliveryMen
    .filter((dm) => {
      const q = deliverySearch.trim().toLowerCase();
      if (!q) return true;
      return (
        ${dm.fname || ""} ${dm.lname || ""}.toLowerCase().includes(q) ||
        (dm.email || "").toLowerCase().includes(q) ||
        (dm.district || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (deliverySortBy === "salary") {
        const sa = a.salary ?? -Infinity;
        const sb = b.salary ?? -Infinity;
        return sb - sa; // descending salary
      }
      // default: sort by name asc
      const na = ${a.fname || ""} ${a.lname || ""}.toLowerCase();
      const nb = ${b.fname || ""} ${b.lname || ""}.toLowerCase();
      return na.localeCompare(nb);
    });

  // NEW: export only currently-visible delivery history to CSV
  const exportVisibleHistoryToCSV = async () => {
    try {
      if (!selectedDeliverymanId) {
        alert("No deliveryman selected for history export.");
        return;
      }

      const dm = deliveryMen.find((d) => d._id === selectedDeliverymanId);
      if (!dm) {
        alert("Selected deliveryman not found.");
        return;
      }

      // Filter deliveryHistory by date range if provided (client-side)
      const filtered = deliveryHistory.filter((order) => {
        const d = parseDateSafe(order.updatedAt || order.createdAt);
        if (!d) return false;
        if (historyStartDate) {
          const start = new Date(historyStartDate + "T00:00:00");
          if (d < start) return false;
        }
        if (historyEndDate) {
          const end = new Date(historyEndDate + "T23:59:59");
          if (d > end) return false;
        }
        return true;
      });

      let csv = Delivery History - ${dm.fname} ${dm.lname}\n\n;
      csv += "Item,Quantity (kg),Price (Rs.),Delivery Date,From (Farmer),To (Seller),District,Status\n";

      filtered.forEach((order) => {
        const hasFarmerInfo = order.farmerId && typeof order.farmerId === "object";
        const farmerName = hasFarmerInfo ? ${order.farmerId.fname || ""} ${order.farmerId.lname || ""}.trim() : "Unknown";
        const hasSellerInfo = order.sellerId && typeof order.sellerId === "object";
        const sellerName = hasSellerInfo ? ${order.sellerId.fname || ""} ${order.sellerId.lname || ""}.trim() : "Unknown";
        const date = formatDate(order.updatedAt || order.createdAt);
        csv += "${order.item || ""}","${order.quantity || ""}","${order.price || ""}","${date}","${farmerName}","${sellerName}","${order.district || "N/A"}","DELIVERED"\n;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = delivery_history_${dm.fname}_${dm.lname}_${new Date().toISOString().split("T")[0]}.csv;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      alert("✅ Visible delivery history exported as CSV");
    } catch (err) {
      console.error("Error exporting visible history:", err);
      alert("Failed to export visible history. Please try again.");
    }
  };

  // NEW: copy visible history CSV to clipboard
  const copyVisibleHistoryToClipboard = async () => {
    try {
      if (!selectedDeliverymanId) {
        alert("No deliveryman selected.");
        return;
      }
      const dm = deliveryMen.find((d) => d._id === selectedDeliverymanId);
      if (!dm) {
        alert("Selected deliveryman not found.");
        return;
      }

      const filtered = deliveryHistory.filter((order) => {
        const d = parseDateSafe(order.updatedAt || order.createdAt);
        if (!d) return false;
        if (historyStartDate) {
          const start = new Date(historyStartDate + "T00:00:00");
          if (d < start) return false;
        }
        if (historyEndDate) {
          const end = new Date(historyEndDate + "T23:59:59");
          if (d > end) return false;
        }
        return true;
      });

      let csv = Delivery History - ${dm.fname} ${dm.lname}\n\n;
      csv += "Item,Quantity (kg),Price (Rs.),Delivery Date,From (Farmer),To (Seller),District,Status\n";
      filtered.forEach((order) => {
        const hasFarmerInfo = order.farmerId && typeof order.farmerId === "object";
        const farmerName = hasFarmerInfo ? ${order.farmerId.fname || ""} ${order.farmerId.lname || ""}.trim() : "Unknown";
        const hasSellerInfo = order.sellerId && typeof order.sellerId === "object";
        const sellerName = hasSellerInfo ? ${order.sellerId.fname || ""} ${order.sellerId.lname || ""}.trim() : "Unknown";
        const date = formatDate(order.updatedAt || order.createdAt);
        csv += "${order.item || ""}","${order.quantity || ""}","${order.price || ""}","${date}","${farmerName}","${sellerName}","${order.district || "N/A"}","DELIVERED"\n;
      });

      await navigator.clipboard.writeText(csv);
      alert("✅ Visible delivery history copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard. Your browser may block clipboard access.");
    }
  };

  // Keep previous full CSV export (unchanged, still only sellerorder)
  const exportToCSV = async () => {
    try {
      if (!showDeliveryMen) {
        await fetchDeliveryMen();
      }

      const allApplicantsData = {};
      for (const scheme of schemes) {
        try {
          const res = await axios.get(${BASE_URL}/schemes/${scheme._id}/applicants);
          allApplicantsData[scheme.name] = res.data;
        } catch (err) {
          allApplicantsData[scheme.name] = [];
        }
      }

      const allDeliveryHistory = {};
      for (const dm of deliveryMen) {
        try {
          const sellerOrdersRes = await axios.get(${BASE_URL}/sellerorder/deliveryman/${dm._id});
          const sellerOrders = Array.isArray(sellerOrdersRes.data) ? sellerOrdersRes.data : [];

          const allOrders = sellerOrders.filter(
            (order) => order.deliveryStatus === "delivered" || order.deliveryStatus === "approved"
          );

          allDeliveryHistory[${dm.fname} ${dm.lname}] = allOrders;
        } catch (err) {
          allDeliveryHistory[${dm.fname} ${dm.lname}] = [];
        }
      }

      let csvContent = "Government AgriHub Complete Report\n\n";

      csvContent += "=== GOVERNMENT SCHEMES ===\n";
      csvContent += "Scheme Name\n";
      schemes.forEach((scheme) => {
        csvContent += "${scheme.name}"\n;
      });
      csvContent += \nTotal Schemes: ${schemes.length}\n\n;

      csvContent += "=== SCHEME APPLICANTS ===\n";
      for (const [schemeName, applicantsList] of Object.entries(allApplicantsData)) {
        csvContent += \nScheme: "${schemeName}"\n;
        csvContent += "Username,Role\n";
        applicantsList.forEach((app) => {
          csvContent += "${app.username}","${app.role}"\n;
        });
        csvContent += Total Applicants: ${applicantsList.length}\n;
      }
      csvContent += "\n";

      csvContent += "=== DELIVERY MEN ===\n";
      csvContent += "Name,Email,District,Current Salary (Rs.)\n";
      deliveryMen.forEach((dm) => {
        const salary = dm.salary !== null && dm.salary !== undefined ? dm.salary : "Not set";
        csvContent += "${dm.fname} ${dm.lname}","${dm.email}","${dm.district}",${salary}\n;
      });
      csvContent += \nTotal Delivery Men: ${deliveryMen.length}\n\n;

      csvContent += "=== DELIVERY HISTORY ===\n";
      for (const [dmName, orders] of Object.entries(allDeliveryHistory)) {
        csvContent += \nDeliveryman: "${dmName}"\n;
        csvContent += "Item,Quantity,Price (Rs.),Delivery Date,From (Farmer),To (Seller),District,Status\n";
        orders.forEach((order) => {
          const hasFarmerInfo = order.farmerId && typeof order.farmerId === "object";
          const farmerName = hasFarmerInfo ? ${order.farmerId.fname || ""} ${order.farmerId.lname || ""}.trim() : "Unknown";
          const hasSellerInfo = order.sellerId && typeof order.sellerId === "object";
          const sellerName = hasSellerInfo ? ${order.sellerId.fname || ""} ${order.sellerId.lname || ""}.trim() : "Unknown";
          csvContent += "${order.item}","${order.quantity} kg",${order.price},"${formatDate(order.updatedAt || order.createdAt)}","${farmerName}","${sellerName}","${order.district || "N/A"}","DELIVERED"\n;
        });
        csvContent += Total Deliveries: ${orders.length}\n;
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", government_report_${new Date().toISOString().split("T")[0]}.csv);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      alert("✅ Government report exported as CSV");
      setShowExportMenu(false);
    } catch (err) {
      console.error("Error exporting CSV:", err);
      alert("Failed to export CSV. Please try again.");
    }
  };

  // Export to PDF preserves blob fallback approach (no farmerorder)
  const exportToPDF = async () => {
    try {
      if (!showDeliveryMen) {
        await fetchDeliveryMen();
      }

      const allApplicantsData = {};
      for (const scheme of schemes) {
        try {
          const res = await axios.get(${BASE_URL}/schemes/${scheme._id}/applicants);
          allApplicantsData[scheme.name] = res.data;
        } catch (err) {
          allApplicantsData[scheme.name] = [];
        }
      }

      const allDeliveryHistory = {};
      for (const dm of deliveryMen) {
        try {
          const sellerOrdersRes = await axios.get(${BASE_URL}/sellerorder/deliveryman/${dm._id});
          const sellerOrders = Array.isArray(sellerOrdersRes.data) ? sellerOrdersRes.data : [];

          const allOrders = sellerOrders.filter(
            (order) => order.deliveryStatus === "delivered" || order.deliveryStatus === "approved"
          );

          allDeliveryHistory[dm._id] = { name: ${dm.fname} ${dm.lname}, orders: allOrders };
        } catch (err) {
          allDeliveryHistory[dm._id] = { name: ${dm.fname} ${dm.lname}, orders: [] };
        }
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Government AgriHub Report</title>
            <style>
              @media print {
                body { margin: 0; padding: 20px; }
                .no-print { display: none; }
                .page-break { page-break-before: always; }
              }
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #4CAF50;
                padding-bottom: 20px;
              }
              .header h1 {
                margin: 0;
                color: #4CAF50;
                font-size: 32px;
              }
              .header p {
                margin: 5px 0;
                color: #666;
                font-size: 14px;
              }
              .section {
                margin: 30px 0;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 8px;
                page-break-inside: avoid;
              }
              .section h2 {
                margin-top: 0;
                color: #4CAF50;
                border-bottom: 2px solid #4CAF50;
                padding-bottom: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                background-color: white;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #4CAF50;
                color: white;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f2f2f2;
              }
              .summary-box {
                background-color: #e8f5e9;
                padding: 15px;
                border-radius: 5px;
                margin: 10px 0;
                border-left: 4px solid #4CAF50;
              }
              .delivery-item {
                margin: 15px 0;
                padding: 15px;
                background-color: white;
                border-radius: 5px;
                border: 1px solid #ddd;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🏛 Government AgriHub Complete Report</h1>
              <p>Generated on: ${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
            </div>

            <div class="section">
              <h2>📋 Government Schemes</h2>
              <table>
                <thead><tr><th>#</th><th>Scheme Name</th></tr></thead>
                <tbody>
                  ${schemes
                    .map(
                      (scheme, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${scheme.name}</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
              <div class="summary-box"><strong>Total Schemes:</strong> ${schemes.length}</div>
            </div>

            <div class="section page-break">
              <h2>👥 Scheme Applicants</h2>
              ${Object.entries(allApplicantsData)
                .map(
                  ([schemeName, applicantsList]) => `
                <div style="margin:20px 0;">
                  <h3 style="color:#333; margin-bottom:10px;">Scheme: ${schemeName}</h3>
                  ${
                    applicantsList.length > 0
                      ? `<table><thead><tr><th>#</th><th>Username</th><th>Role</th></tr></thead><tbody>${applicantsList
                          .map(
                            (app, idx) => <tr><td>${idx + 1}</td><td>${app.username}</td><td>${app.role}</td></tr>
                          )
                          .join("")}</tbody></table><div class="summary-box"><strong>Total Applicants:</strong> ${applicantsList.length}</div>`
                      : <p style="color:#666; font-style:italic;">No applicants yet for this scheme.</p>
                  }
                </div>`
                )
                .join("")}
            </div>

            <div class="section page-break">
              <h2>🚚 Delivery Men & Salaries</h2>
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Email</th><th>District</th><th>Current Salary (Rs.)</th></tr></thead>
                <tbody>
                  ${deliveryMen
                    .map(
                      (dm, index) => `<tr>
                      <td>${index + 1}</td>
                      <td>${dm.fname} ${dm.lname}</td>
                      <td>${dm.email}</td>
                      <td>${dm.district}</td>
                      <td>${dm.salary !== null && dm.salary !== undefined ? dm.salary : "Not set"}</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
              <div class="summary-box"><strong>Total Delivery Men:</strong> ${deliveryMen.length}</div>
            </div>

            <div class="section page-break">
              <h2>📦 Delivery History by Deliveryman</h2>
              ${Object.entries(allDeliveryHistory)
                .map(
                  ([dmId, data]) => `
                <div style="margin:30px 0;">
                  <h3 style="color:#333; background-color:#e8f5e9; padding:10px; border-radius:5px;">Deliveryman: ${data.name}</h3>
                  ${
                    data.orders.length > 0
                      ? data.orders
                          .map((order, idx) => {
                            const farmerName = (order.farmerId && typeof order.farmerId === "object") ? ${order.farmerId.fname || ""} ${order.farmerId.lname || ""}.trim() : "Unknown Farmer";
                            const sellerName = (order.sellerId && typeof order.sellerId === "object") ? ${order.sellerId.fname || ""} ${order.sellerId.lname || ""}.trim() : "Unknown Seller";
                            return `<div class="delivery-item">
                            <h4 style="margin:0 0 10px 0;">Delivery #${idx + 1}: ${order.item}</h4>
                            <table>
                              <tr><td><strong>Quantity:</strong></td><td>${order.quantity} kg</td><td><strong>Price:</strong></td><td>Rs.${order.price}</td></tr>
                              <tr><td><strong>Status:</strong></td><td style="color:green; font-weight:bold;">✓ DELIVERED</td><td><strong>Delivery Date:</strong></td><td>${formatDate(order.updatedAt || order.createdAt)}</td></tr>
                              <tr><td><strong>From (Farmer):</strong></td><td>${farmerName}</td><td><strong>To (Seller):</strong></td><td>${sellerName}</td></tr>
                              ${order.district ? <tr><td><strong>District:</strong></td><td colspan="3">${order.district}</td></tr> : ""}
                            </table>
                          </div>`;
                          })
                          .join("")
                      : <p style="color:#666; font-style:italic;">No delivery history found for this deliveryman.</p>
                  }
                  <div class="summary-box"><strong>Total Deliveries by ${data.name}:</strong> ${data.orders.length}</div>
                </div>`
                )
                .join("")}
            </div>

            <div class="footer">
              <p>This is an automatically generated government report</p>
              <p>AgriHub - Government Agricultural Management System</p>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      let newWindow = null;
      try {
        newWindow = window.open(url, "_blank");
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
        } catch (err) {
          // ignore
        }
      }, 10000);

      alert("✅ PDF preview opened (or download started). Click Print to save as PDF");
      setShowExportMenu(false);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Failed to export PDF. Please try again.");
    }
  };

  useEffect(() => {
    const preventNavigation = () => {
      try {
        window.history.pushState(null, "", window.location.href);
      } catch (err) {
        // ignore
      }
    };

    try {
      window.history.pushState(null, "", window.location.href);
    } catch (err) {
      // ignore
    }

    const onPopState = () => {
      preventNavigation();
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    if (loggedIn) {
      fetchSchemes();
    } else {
      setSchemes([]);
    }
  }, [loggedIn]);

  const fetchSchemes = async () => {
    try {
      const res = await axios.get(${BASE_URL}/schemes);
      setSchemes(res.data);
    } catch (err) {
      console.error("Failed to fetch schemes:", err);
      alert("Failed to load schemes. Please try again later.");
    }
  };

  const fetchDeliveryMen = async () => {
    try {
      const res = await axios.get(${BASE_URL}/deliverymen);
      setDeliveryMen(res.data);
    } catch (err) {
      console.error("Failed to fetch delivery men:", err);
      alert("Failed to load delivery men. Please try again later.");
    }
  };

  // fetchDeliveryHistory uses only sellerorder endpoint (no farmerorder)
  const fetchDeliveryHistory = async (deliverymanId) => {
    try {
      const sellerOrdersRes = await axios.get(${BASE_URL}/sellerorder/deliveryman/${deliverymanId});
      const sellerOrders = Array.isArray(sellerOrdersRes.data) ? sellerOrdersRes.data : [];

      const allOrders = sellerOrders.filter(
        (order) => order.deliveryStatus === "delivered" || order.deliveryStatus === "approved"
      );

      allOrders.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });

      setDeliveryHistory(allOrders);
      calculateMonthlyStats(allOrders);
      setSelectedDeliverymanId(deliverymanId);
      setShowHistory(true);
    } catch (err) {
      console.error("Failed to fetch delivery history:", err);
      alert("Failed to fetch delivery history. Please try again.");
    }
  };

  const calculateMonthlyStats = (orders) => {
    const stats = {};
    orders.forEach((order) => {
      const date = new Date(order.updatedAt || order.createdAt || 0);
      if (isNaN(date.getTime())) return;
      const monthYear = ${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()};
      if (!stats[monthYear]) stats[monthYear] = 0;
      stats[monthYear]++;
    });
    setMonthlyStats(stats);
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

  const handleAddScheme = async () => {
    if (!newScheme.trim()) {
      alert("Please enter a scheme name");
      return;
    }
    try {
      const res = await axios.post(${BASE_URL}/schemes, { name: newScheme.trim() });
      setSchemes((prev) => [...prev, res.data]);
      setNewScheme("");
    } catch (err) {
      console.error("Error adding scheme:", err);
      alert("Failed to add scheme. Please try again.");
    }
  };

  const handleEditScheme = (index) => {
    setEditIndex(index);
    setEditScheme(schemes[index].name);
  };

  const handleSaveEdit = async (index) => {
    if (!editScheme.trim()) {
      alert("Scheme name cannot be empty");
      return;
    }
    const scheme = schemes[index];
    try {
      const res = await axios.put(${BASE_URL}/schemes/${scheme._id}, { name: editScheme.trim() });
      const updatedSchemes = [...schemes];
      updatedSchemes[index] = res.data;
      setSchemes(updatedSchemes);
      setEditIndex(null);
    } catch (err) {
      console.error("Error updating scheme:", err);
      alert("Failed to update scheme. Please try again.");
    }
  };

  const handleDeleteScheme = async (index) => {
    const scheme = schemes[index];
    try {
      await axios.delete(${BASE_URL}/schemes/${scheme._id});
      setSchemes((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Error deleting scheme:", err);
      alert("Failed to delete scheme. Please try again.");
    }
  };

  const handleSalaryChange = (id, value) => {
    setSalaryInputs((prev) => ({ ...prev, [id]: value }));
  };

  const provideSalary = async (id) => {
    if (!salaryInputs[id]) {
      alert("Please enter a salary amount");
      return;
    }
    const numericSalary = Number(salaryInputs[id]);
    if (isNaN(numericSalary)) {
      alert("Salary must be a valid number");
      return;
    }
    try {
      await axios.put(${BASE_URL}/deliverymen/${id}/salary, { salary: numericSalary });
      alert("Salary updated successfully!");
      fetchDeliveryMen();
    } catch (err) {
      console.error("Failed to update salary:", err);
      alert("Failed to update salary. Please try again.");
    }
  };

  const fetchApplicants = async (schemeId) => {
    try {
      const res = await axios.get(${BASE_URL}/schemes/${schemeId}/applicants);
      setApplicants(res.data);
      setShowApplicantsFor(schemeId);
    } catch (err) {
      console.error("Failed to fetch applicants:", err);
      alert("Failed to fetch applicants. Please try again.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      setLoggedIn(true);
      localStorage.setItem("govLoggedIn", "true");
      setLoginError("");
      setUsername("");
      setPassword("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.removeItem("govLoggedIn");
    setSchemes([]);
    setDeliveryMen([]);
    setShowDeliveryMen(false);
    setSalaryInputs({});
    setApplicants([]);
    setShowApplicantsFor(null);
    setShowHistory(false);
    setDeliveryHistory([]);
    setSelectedDeliverymanId(null);
    navigate("/");
  };

  // Filtered deliveryHistory for display (applies date filters)
  const visibleDeliveryHistory = deliveryHistory.filter((order) => {
    const d = parseDateSafe(order.updatedAt || order.createdAt);
    if (!d) return false;
    if (historyStartDate) {
      const start = new Date(historyStartDate + "T00:00:00");
      if (d < start) return false;
    }
    if (historyEndDate) {
      const end = new Date(historyEndDate + "T23:59:59");
      if (d > end) return false;
    }
    return true;
  });

  return (
    <div className="container">
      <button
        style={{
          backgroundColor: "black",
          color: "white",
          padding: "10px 20px",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
          borderRadius: "4px",
        }}
        onClick={() => navigate("/")}
      >
        Back to Home Page
      </button>

      <Navbar />

      {loggedIn && (
        <>
          <button
            onClick={handleLogout}
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              padding: "10px 20px",
              backgroundColor: "#c00",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              zIndex: 9999,
            }}
          >
            Logout
          </button>

          <div style={{ position: "fixed", bottom: "70px", right: "20px", zIndex: 9999 }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              📥 Export Report
            </button>

            {showExportMenu && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  right: 0,
                  marginBottom: "5px",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                  minWidth: "220px",
                }}
              >
                <button
                  onClick={exportToPDF}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "14px",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  📄 Export as PDF
                </button>

                <div style={{ height: "1px", backgroundColor: "#eee", margin: "0 10px" }} />

                <button
                  onClick={exportToCSV}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "14px",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  📊 Export as CSV
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {!loggedIn ? (
        <div style={{ maxWidth: "400px", margin: "100px auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Government Login</h2>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              autoFocus
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
            {loginError && <p style={{ color: "red", textAlign: "center" }}>{loginError}</p>}
            <button type="submit" className="add-button">
              Login
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              style={{
                backgroundColor: "black",
                color: "white",
                padding: "10px 20px",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px",
              }}
              onClick={() => navigate("/")}
            >
              Back to Home Page
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="government-banner">
            <h1 className="government-title">Government Schemes Management</h1>
          </div>

          <div className="input-section" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Enter new scheme"
              value={newScheme}
              onChange={(e) => setNewScheme(e.target.value)}
              className="input-field"
              style={{ flex: "1 1 300px" }}
            />
            <button className="add-button" onClick={handleAddScheme}>
              Add Scheme
            </button>
            <input
              type="text"
              placeholder="Search schemes..."
              value={schemeSearch}
              onChange={(e) => setSchemeSearch(e.target.value)}
              className="input-field"
              style={{ maxWidth: 300 }}
            />
          </div>

          <table className="schemes-table">
            <thead>
              <tr>
                <th>Scheme Name</th>
                <th>Actions</th>
                <th>Applicants</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemes.map((scheme, index) => (
                <tr key={scheme._id}>
                  <td>
                    {editIndex === index ? (
                      <input type="text" value={editScheme} onChange={(e) => setEditScheme(e.target.value)} className="edit-input" />
                    ) : (
                      scheme.name
                    )}
                  </td>
                  <td>
                    {editIndex === index ? (
                      <>
                        <button className="save-btn" onClick={() => handleSaveEdit(index)}>
                          Save
                        </button>
                        <button className="cancel-btn" onClick={() => setEditIndex(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="edit-btn" onClick={() => handleEditScheme(index)}>
                          Edit
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteScheme(index)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                  <td>
                    <button onClick={() => fetchApplicants(scheme._id)} style={{ padding: "5px 10px", cursor: "pointer" }}>
                      View Applicants
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSchemes.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No schemes match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {showApplicantsFor && (
            <div className="applicants-section" style={{ marginTop: "20px" }}>
              <h3>Applicants:</h3>
              {applicants.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((app, idx) => (
                      <tr key={idx}>
                        <td>{app.username}</td>
                        <td>{app.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No applicants yet for this scheme.</p>
              )}
            </div>
          )}

          <div style={{ marginTop: "30px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="toggle-deliverymen-btn"
              onClick={() => {
                if (!showDeliveryMen) fetchDeliveryMen();
                setShowDeliveryMen(!showDeliveryMen);
              }}
            >
              {showDeliveryMen ? "Hide Delivery Men" : "View Delivery Men"}
            </button>

            {showDeliveryMen && (
              <>
                <input
                  type="text"
                  placeholder="Search delivery men by name/email/district"
                  value={deliverySearch}
                  onChange={(e) => setDeliverySearch(e.target.value)}
                  className="input-field"
                  style={{ maxWidth: 350 }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Sort by:
                  <select value={deliverySortBy} onChange={(e) => setDeliverySortBy(e.target.value)}>
                    <option value="name">Name (A-Z)</option>
                    <option value="salary">Salary (High → Low)</option>
                  </select>
                </label>
              </>
            )}
          </div>

          {showDeliveryMen && (
            <table className="deliverymen-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>District</th>
                  <th>Current Salary</th>
                  <th>Set New Salary</th>
                  <th>Action</th>
                  <th>View History</th>
                </tr>
              </thead>
              <tbody>
                {filteredSortedDeliveryMen.map((dm) => (
                  <tr key={dm._id}>
                    <td>
                      {dm.fname} {dm.lname}
                    </td>
                    <td>{dm.email}</td>
                    <td>{dm.district}</td>
                    <td>{dm.salary !== null && dm.salary !== undefined ? dm.salary : "Not set"}</td>
                    <td>
                      <input
                        type="number"
                        value={salaryInputs[dm._id] || ""}
                        onChange={(e) => handleSalaryChange(dm._id, e.target.value)}
                        placeholder="Enter salary"
                        className="salary-input"
                      />
                    </td>
                    <td>
                      <button onClick={() => provideSalary(dm._id)}>Provide Salary</button>
                    </td>
                    <td>
                      <button
                        onClick={() => fetchDeliveryHistory(dm._id)}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "#4CAF50",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredSortedDeliveryMen.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      No delivery men found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {showHistory && (
            <div
              style={{
                margin: "30px auto",
                maxWidth: "1400px",
                padding: "30px",
                backgroundColor: "#f5f5f5",
                borderRadius: "10px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: "#333" }}>
                  Delivery History - {deliveryMen.find((dm) => dm._id === selectedDeliverymanId)?.fname}{" "}
                  {deliveryMen.find((dm) => dm._id === selectedDeliverymanId)?.lname}
                </h2>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setShowHistory(false)}
                    style={{
                      padding: "8px 15px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <h3 style={{ marginTop: 0, color: "#333" }}>Monthly Delivery Statistics</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
                  {Object.entries(monthlyStats).map(([month, count]) => (
                    <div
                      key={month}
                      style={{
                        padding: "15px",
                        backgroundColor: "#e3f2fd",
                        borderRadius: "5px",
                        textAlign: "center",
                        borderLeft: "4px solid #2196f3",
                      }}
                    >
                      <div style={{ fontSize: "14px", color: "#666", marginBottom: "5px" }}>{month}</div>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2196f3" }}>{count} deliveries</div>
                    </div>
                  ))}
                </div>
                {Object.keys(monthlyStats).length === 0 && <p style={{ textAlign: "center", color: "#666" }}>No delivery statistics available</p>}
              </div>

              <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  From:
                  <input type="date" value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} />
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  To:
                  <input type="date" value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} />
                </label>

                <button
                  onClick={() => {
                    setHistoryStartDate("");
                    setHistoryEndDate("");
                  }}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#ddd",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Clear Dates
                </button>

                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button
                    onClick={exportVisibleHistoryToCSV}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Export Visible History CSV
                  </button>
                  <button
                    onClick={copyVisibleHistoryToClipboard}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#2196f3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Copy Visible History
                  </button>
                </div>
              </div>

              <div>
                <h3 style={{ color: "#333" }}>Detailed Delivery History ({visibleDeliveryHistory.length} total deliveries)</h3>
                {visibleDeliveryHistory.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "16px", color: "#666" }}>
                    No delivery history found for this deliveryman (or date filters excluded all entries).
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {visibleDeliveryHistory.map((order) => {
                      const hasFarmerInfo = order.farmerId && typeof order.farmerId === "object";
                      const farmerName = hasFarmerInfo ? ${order.farmerId.fname || ""} ${order.farmerId.lname || ""}.trim() || "Unknown Farmer" : "Unknown Farmer";

                      const hasSellerInfo = order.sellerId && typeof order.sellerId === "object";
                      const sellerName = hasSellerInfo ? ${order.sellerId.fname || ""} ${order.sellerId.lname || ""}.trim() || "Unknown Seller" : "Unknown Seller";

                      return (
                        <div
                          key={order._id}
                          style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: "20px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            display: "grid",
                            gridTemplateColumns: "150px 1fr",
                            gap: "20px",
                          }}
                        >
                          <img
                            src={getImageUrl(order.productImage)}
                            alt={order.item}
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/150?text=No+Image";
                            }}
                          />
                          <div>
                            <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>{order.item}</h4>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "15px" }}>
                              <div>
                                <strong>Quantity:</strong> {order.quantity} kg
                              </div>
                              <div>
                                <strong>Price:</strong> Rs.{order.price}
                              </div>
                              <div>
                                <strong>Status:</strong> <span style={{ color: "green", fontWeight: "bold" }}>✓ DELIVERED</span>
                              </div>
                              <div>
                                <strong>Delivery Date:</strong> {formatDate(order.updatedAt || order.createdAt)}
                              </div>
                              {order.district && (
                                <div>
                                  <strong>District:</strong> {order.district}
                                </div>
                              )}
                            </div>

                            <div
                              style={{
                                padding: "15px",
                                backgroundColor: "#e8f5e9",
                                borderRadius: "5px",
                                borderLeft: "4px solid #4caf50",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                                <div style={{ flex: 1, minWidth: "200px" }}>
                                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                                    <strong>FROM (Farmer):</strong>
                                  </div>
                                  <div style={{ fontSize: "16px", color: "#333", fontWeight: "bold" }}>👨‍🌾 {farmerName}</div>
                                  {hasFarmerInfo && order.farmerId.mobile && <div style={{ fontSize: "14px", color: "#666", marginTop: "3px" }}>📞 {order.farmerId.mobile}</div>}
                                  {hasFarmerInfo && order.farmerId.district && <div style={{ fontSize: "14px", color: "#666", marginTop: "3px" }}>📍 {order.farmerId.district}</div>}
                                </div>

                                <div style={{ fontSize: "24px", color: "#4caf50" }}>🚚 ➔</div>

                                <div style={{ flex: 1, minWidth: "200px" }}>
                                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                                    <strong>TO (Seller):</strong>
                                  </div>
                                  <div style={{ fontSize: "16px", color: "#333", fontWeight: "bold" }}>🏪 {sellerName}</div>
                                  {hasSellerInfo && order.sellerId.mobile && <div style={{ fontSize: "14px", color: "#666", marginTop: "3px" }}>📞 {order.sellerId.mobile}</div>}
                                  {hasSellerInfo && order.sellerId.district && <div style={{ fontSize: "14px", color: "#666", marginTop: "3px" }}>📍 {order.sellerId.district}</div>}
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
          )}

          <FooterNew />
        </>
      )}
    </div>
  );
}

export default GovernmentPage;
