import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./index.scss";
import api from "../../../config/api";

const StationManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [editingStation, setEditingStation] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    longitude: "",
    latitude: "",
    status: "active",
    address: "",
    provider: "",
    ports: [
      {
        type: "DC",
        status: "available",
        powerKw: 120,
        speed: "fast",
        price: 3858,
      },
    ],
  });

  // Thêm state cho modal xem chi tiết
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStation, setViewStation] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // GET - Lấy danh sách trạm sạc
  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/stations");
      // Xử lý nhiều cấu trúc response khác nhau
      let stationsData = [];
      if (response.data.items && Array.isArray(response.data.items)) {
        stationsData = response.data.items;
      } else if (Array.isArray(response.data.data)) {
        stationsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        stationsData = response.data;
      }

      console.log("Processed stations data:", stationsData);
      setStations(stationsData);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching stations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // POST - Thêm trạm sạc mới
  const handleAddStation = async (e) => {
    e.preventDefault();
    try {
      console.log("Sending station data:", formData);
      const response = await api.post("/stations", formData);
      console.log("Add station response:", response);

      // Xử lý response data
      const newStation = response.data.data || response.data;
      setStations((prev) => [...prev, newStation]);
      setShowAddModal(false);
      resetForm();
      alert("Thêm trạm sạc thành công!");

      // Refresh danh sách để đảm bảo đồng bộ
      await fetchStations();
    } catch (err) {
      console.error("Error adding station:", err);

      if (err.response?.status === 400) {
        const errorMessage =
          err.response?.data?.message || "Dữ liệu không hợp lệ";
        alert(`Lỗi: ${errorMessage}`);
      } else if (err.response?.status === 422) {
        alert("Dữ liệu nhập vào không đúng định dạng. Vui lòng kiểm tra lại!");
      } else {
        alert("Có lỗi xảy ra khi thêm trạm sạc. Vui lòng thử lại!");
      }
    }
  };

  // PUT - Cập nhật trạm sạc
  const handleEditStation = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(
        `/stations/${editingStation.id}`,
        formData
      );
      setStations((prev) =>
        prev.map((station) =>
          station.id === editingStation.id ? response.data : station
        )
      );
      setShowEditModal(false);
      setEditingStation(null);
      resetForm();
      alert("Cập nhật trạm sạc thành công!");
    } catch (err) {
      console.error("Error updating station:", err);
      alert("Có lỗi xảy ra khi cập nhật trạm sạc");
    }
  };

  // DELETE - Cập nhật trạng thái trạm sạc thành inactive
  const handleDeleteStation = async (stationId) => {
    if (!window.confirm("Bạn có chắc chắn muốn vô hiệu hóa trạm sạc này?")) {
      return;
    }

    try {
      // Thay vì xóa, chúng ta sẽ cập nhật status thành inactive
      const response = await api.put(`/stations/${stationId}`, {
        status: "inactive",
      });
      console.log("Update status response:", response);

      // Cập nhật state local
      setStations((prev) =>
        prev.map((station) =>
          station.id === stationId
            ? { ...station, status: "inactive" }
            : station
        )
      );
      alert("Vô hiệu hóa trạm sạc thành công!");

      // Refresh lại danh sách để đảm bảo đồng bộ với server
      await fetchStations();
    } catch (err) {
      console.error("Error updating station status:", err);

      // Xử lý các loại lỗi khác nhau
      if (err.response?.status === 404) {
        alert("Trạm sạc không tồn tại!");
        await fetchStations();
      } else if (err.response?.status === 403) {
        alert("Bạn không có quyền vô hiệu hóa trạm sạc này!");
      } else {
        alert("Có lỗi xảy ra khi vô hiệu hóa trạm sạc. Vui lòng thử lại!");
      }
    }
  };

  // Utility functions
  const resetForm = () => {
    setFormData({
      name: "",
      longitude: "",
      latitude: "",
      status: "active",
      address: "",
      provider: "",
      ports: [
        {
          type: "DC",
          status: "available",
          powerKw: 120,
          speed: "fast",
          price: 3858,
        },
      ],
    });
  };

  // Đóng modal Thêm + reset form
  const closeAddModal = () => {
    resetForm();
    setShowAddModal(false);
  };

  const openEditModal = (station) => {
    setEditingStation(station);
    setFormData({
      name: station.name || "",
      longitude: station.longitude ?? "",
      latitude: station.latitude ?? "",
      status: station.status || "active",
      address: station.address || "",
      provider: station.provider || "",
      ports:
        Array.isArray(station.ports) && station.ports.length > 0
          ? station.ports
          : [
              {
                type: "DC",
                status: "available",
                powerKw: 120,
                speed: "fast",
                price: 3858,
              },
            ],
    });
    setShowEditModal(true);
  };

  // Hàm mở modal xem chi tiết
  const openViewModal = (station) => {
    setViewStation(station);
    setShowViewModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "ports" ||
        name === "price" ||
        name === "longitude" ||
        name === "latitude"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handlePortChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      ports: prev.ports.map((port, i) =>
        i === index
          ? {
              ...port,
              [field]:
                field === "powerKw" || field === "price"
                  ? parseInt(value) || 0
                  : value,
            }
          : port
      ),
    }));
  };

  const addPort = () => {
    setFormData((prev) => ({
      ...prev,
      ports: [
        ...prev.ports,
        {
          type: "DC",
          status: "available",
          powerKw: 120,
          speed: "fast",
          price: 3858,
        },
      ],
    }));
  };

  const removePort = (index) => {
    if (formData.ports.length > 1) {
      setFormData((prev) => ({
        ...prev,
        ports: prev.ports.filter((_, i) => i !== index),
      }));
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, locationFilter]);

  // Tính toán thống kê từ data - đảm bảo stations là array
  const safeStations = Array.isArray(stations) ? stations : [];
  const totalStations = safeStations.length;
  const activeStations = safeStations.filter(
    (s) => s.status === "active"
  ).length;
  const maintenanceStations = safeStations.filter(
    (s) => s.status === "maintenance"
  ).length;
  const inactiveStations = safeStations.filter(
    (s) => s.status === "inactive"
  ).length;

  // Danh sách quận tại TP.HCM
  const hcmDistricts = [
    "Quận 1",
    "Quận 3",
    "Quận 4",
    "Quận 5",
    "Quận 6",
    "Quận 7",
    "Quận 8",
    "Quận 10",
    "Quận 11",
    "Quận 12",
    "Quận Bình Thạnh",
    "Quận Gò Vấp",
    "Quận Phú Nhuận",
    "Quận Tân Bình",
    "Quận Tân Phú",
    "Thủ Đức",
    "Huyện Bình Chánh",
    "Huyện Cần Giờ",
    "Huyện Củ Chi",
    "Huyện Hóc Môn",
    "Huyện Nhà Bè",
  ];

  const filteredStations = safeStations.filter((station) => {
    const matchesSearch =
      station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || station.status === statusFilter;
    const matchesLocation =
      locationFilter === "all" ||
      station.address?.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStations.length / pageSize));
  const paginatedStations = filteredStations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Clamp current page if data shrinks
  useEffect(() => {
    const newTotal = Math.max(1, Math.ceil(filteredStations.length / pageSize));
    if (currentPage > newTotal) setCurrentPage(newTotal);
  }, [filteredStations.length]);

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "🟢 Hoạt động";
      case "maintenance":
        return "🔧 Bảo trì";
      case "inactive":
        return "🔴 Vô hiệu hóa";
      default:
        return status;
    }
  };

  // Kiểm tra quyền admin
  useEffect(() => {
    const checkAdminRole = () => {
      // Lấy thông tin user từ localStorage hoặc context
      const userStr = localStorage.getItem("user");

      if (!userStr) {
        setAuthError("Vui lòng đăng nhập để tiếp tục");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        const user = JSON.parse(userStr);

        // Kiểm tra role (có thể là 'admin', 'role', hoặc key khác tùy API)
        if (user.role !== "ADMIN" && user.userRole !== "ADMIN") {
          setAuthError("Bạn không có quyền truy cập trang này");
          setTimeout(() => navigate("/"), 2000);
          return;
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        setAuthError("Lỗi xác thực. Vui lòng đăng nhập lại");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    checkAdminRole();
  }, [navigate]);

  // Hiển thị lỗi authentication trước khi load data
  if (authError) {
    return (
      <div className="station-management">
        <div className="error-container">
          <p>🚫 {authError}</p>
          <p>Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="station-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách trạm sạc...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="station-management">
        <div className="error-container">
          <p>❌ Lỗi: {error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="station-management">
      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm trạm sạc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="maintenance">Bảo trì</option>
            <option value="inactive">Vô hiệu hóa</option>
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="location-filter"
          >
            <option value="all">Tất cả quận</option>
            {hcmDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <span>➕</span> Thêm trạm sạc
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-overview">
        <div className="stat-mini">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <span className="stat-number">{totalStations}</span>
            <span className="stat-label">Tổng trạm</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <span className="stat-number">{activeStations}</span>
            <span className="stat-label">Hoạt động</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <span className="stat-number">{maintenanceStations}</span>
            <span className="stat-label">Bảo trì</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <span className="stat-number">{inactiveStations}</span>
            <span className="stat-label">Vô hiệu hóa</span>
          </div>
        </div>
      </div>

      {/* Stations Table */}
      <div className="table-container">
        <table className="stations-table">
          <thead>
            <tr>
              <th>Tên trạm</th>
              <th>Địa điểm</th>
              <th>Trạng thái</th>
              <th>Số trụ</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStations.length > 0 ? (
              paginatedStations.map((station) => (
                <tr key={station.id}>
                  <td className="station-name">
                    <div className="name-with-icon">
                      <span className="station-icon">⚡</span>
                      {station.name}
                    </div>
                  </td>
                  <td>{station.address}</td>
                  <td>
                    <span className={`status-badge ${station.status}`}>
                      {getStatusText(station.status)}
                    </span>
                  </td>
                  <td>
                    {station.ports && Array.isArray(station.ports)
                      ? station.ports.length
                      : station.connectors || 0}{" "}
                    trụ
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon view"
                        title="Xem chi tiết"
                        onClick={() => openViewModal(station)}
                      >
                        👁️
                      </button>
                      <button
                        className="btn-icon edit"
                        title="Chỉnh sửa"
                        onClick={() => openEditModal(station)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon delete"
                        title="Vô hiệu hóa"
                        onClick={() => handleDeleteStation(station.id)}
                      >
                        🚫
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  Không tìm thấy trạm sạc nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="page-btn"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ‹ Trước
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`page-btn ${p === currentPage ? "active" : ""}`}
            onClick={() => setCurrentPage(p)}
          >
            {p}
          </button>
        ))}

        <button
          className="page-btn"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Sau ›
        </button>
      </div>

      {/* Add Station Modal */}
      {showAddModal && (
        // Loại bỏ onClick đóng modal khi bấm ra ngoài
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm trạm sạc mới</h3>
              <button className="close-btn" onClick={closeAddModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form className="station-form" onSubmit={handleAddStation}>
                <div className="form-group">
                  <label>Tên trạm sạc</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên trạm sạc"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Kinh độ</label>
                    <input
                      type="number"
                      step="0.000001"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      placeholder="106.700981"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Vĩ độ</label>
                    <input
                      type="number"
                      step="0.000001"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      placeholder="10.776889"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="active">Hoạt động</option>
                      <option value="maintenance">Bảo trì</option>
                      <option value="inactive">Vô hiệu hóa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nhà cung cấp</label>
                    <input
                      type="text"
                      name="provider"
                      value={formData.provider}
                      onChange={handleInputChange}
                      placeholder="VinFast, EVOne, ..."
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Nhập địa chỉ đầy đủ"
                    required
                  />
                </div>

                <div className="chargers-section">
                  <div className="chargers-header">
                    <label>Trụ sạc</label>
                  </div>

                  {formData.ports.map((port, index) => (
                    <div key={index} className="charger-item">
                      <div className="charger-header">
                        <h4>Trụ sạc {index + 1}</h4>
                        {formData.ports.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-charger"
                            onClick={() => removePort(index)}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Loại</label>
                          <select
                            value={port.type}
                            onChange={(e) =>
                              handlePortChange(index, "type", e.target.value)
                            }
                            required
                          >
                            <option value="AC">AC</option>
                            <option value="DC">DC</option>
                            <option value="Ultra">Ultra</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Trạng thái</label>
                          <select
                            value={port.status}
                            onChange={(e) =>
                              handlePortChange(index, "status", e.target.value)
                            }
                            required
                          >
                            <option value="available">Có sẵn</option>
                            <option value="in_use">Đang sử dụng</option>
                            <option value="inactive">Không hoạt động</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Công suất (kW)</label>
                          <input
                            type="number"
                            value={port.powerKw}
                            onChange={(e) =>
                              handlePortChange(index, "powerKw", e.target.value)
                            }
                            min="1"
                            max="350"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Tốc độ</label>
                          <select
                            value={port.speed}
                            onChange={(e) =>
                              handlePortChange(index, "speed", e.target.value)
                            }
                            required
                          >
                            <option value="slow">Chậm</option>
                            <option value="fast">Nhanh</option>
                            <option value="super_fast">Siêu nhanh</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Giá tiền (VNĐ/kWh)</label>
                        <input
                          type="number"
                          value={port.price}
                          onChange={(e) =>
                            handlePortChange(index, "price", e.target.value)
                          }
                          min="1000"
                          max="10000"
                          required
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn-add-charger"
                    onClick={addPort}
                  >
                    + Thêm trụ sạc
                  </button>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeAddModal}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Thêm trạm sạc
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Station Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa trạm sạc</h3>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form className="station-form" onSubmit={handleEditStation}>
                <div className="form-group">
                  <label>Tên trạm sạc</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên trạm sạc"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Kinh độ</label>
                    <input
                      type="number"
                      step="0.000001"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      placeholder="106.700981"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Vĩ độ</label>
                    <input
                      type="number"
                      step="0.000001"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      placeholder="10.776889"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="active">Hoạt động</option>
                      <option value="maintenance">Bảo trì</option>
                      <option value="inactive">Vô hiệu hóa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nhà cung cấp</label>
                    <input
                      type="text"
                      name="provider"
                      value={formData.provider}
                      onChange={handleInputChange}
                      placeholder="VinFast, EVOne, ..."
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Nhập địa chỉ đầy đủ"
                    required
                  />
                </div>

                <div className="chargers-section">
                  <div className="chargers-header">
                    <label>Trụ sạc</label>
                  </div>

                  {formData.ports.map((port, index) => (
                    <div key={index} className="charger-item">
                      <div className="charger-header">
                        <h4>Trụ sạc {index + 1}</h4>
                        {formData.ports.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-charger"
                            onClick={() => removePort(index)}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Loại</label>
                          <select
                            value={port.type}
                            onChange={(e) =>
                              handlePortChange(index, "type", e.target.value)
                            }
                            required
                          >
                            <option value="AC">AC</option>
                            <option value="DC">DC</option>
                            <option value="Ultra">Ultra</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Trạng thái</label>
                          <select
                            value={port.status}
                            onChange={(e) =>
                              handlePortChange(index, "status", e.target.value)
                            }
                            required
                          >
                            <option value="available">Có sẵn</option>
                            <option value="in_use">Đang sử dụng</option>
                            <option value="inactive">Không hoạt động</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Công suất (kW)</label>
                          <input
                            type="number"
                            value={port.powerKw}
                            onChange={(e) =>
                              handlePortChange(index, "powerKw", e.target.value)
                            }
                            min="1"
                            max="350"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Tốc độ</label>
                          <select
                            value={port.speed}
                            onChange={(e) =>
                              handlePortChange(index, "speed", e.target.value)
                            }
                            required
                          >
                            <option value="slow">Chậm</option>
                            <option value="fast">Nhanh</option>
                            <option value="super_fast">Siêu nhanh</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Giá tiền (VNĐ/kWh)</label>
                        <input
                          type="number"
                          value={port.price}
                          onChange={(e) =>
                            handlePortChange(index, "price", e.target.value)
                          }
                          min="1000"
                          max="10000"
                          required
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn-add-charger"
                    onClick={addPort}
                  >
                    + Thêm trụ sạc
                  </button>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Cập nhật trạm sạc
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Station Modal - chỉ xem (read-only) */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết trạm sạc</h3>
              <button
                className="close-btn"
                onClick={() => setShowViewModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form className="station-form">
                <div className="form-group">
                  <label>Tên trạm sạc</label>
                  <input
                    type="text"
                    value={viewStation?.name || ""}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    value={viewStation?.address || ""}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Kinh độ</label>
                    <input
                      type="number"
                      value={viewStation?.longitude ?? ""}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Vĩ độ</label>
                    <input
                      type="number"
                      value={viewStation?.latitude ?? ""}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select value={viewStation?.status || ""} disabled>
                      <option value="active">Hoạt động</option>
                      <option value="maintenance">Bảo trì</option>
                      <option value="inactive">Vô hiệu hóa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nhà cung cấp</label>
                    <input
                      type="text"
                      value={viewStation?.provider || ""}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Số trụ</label>
                  <input
                    type="number"
                    value={
                      Array.isArray(viewStation?.ports)
                        ? viewStation.ports.length
                        : viewStation?.connectors || 0
                    }
                    readOnly
                    disabled
                  />
                </div>

                {Array.isArray(viewStation?.ports) &&
                  viewStation.ports.length > 0 && (
                    <div className="chargers-section">
                      <div className="chargers-header">
                        <label>Danh sách trụ sạc</label>
                      </div>

                      {viewStation.ports.map((port, index) => (
                        <div key={index} className="charger-item">
                          <div className="charger-header">
                            <h4>Trụ sạc {index + 1}</h4>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Loại</label>
                              <select value={port.type} disabled>
                                <option value="AC">AC</option>
                                <option value="DC">DC</option>
                                <option value="Ultra">Ultra</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Trạng thái</label>
                              <select value={port.status} disabled>
                                <option value="available">Có sẵn</option>
                                <option value="in_use">Đang sử dụng</option>
                                <option value="inactive">
                                  Không hoạt động
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Công suất (kW)</label>
                              <input
                                type="number"
                                value={port.powerKw}
                                readOnly
                                disabled
                              />
                            </div>
                            <div className="form-group">
                              <label>Tốc độ</label>
                              <select value={port.speed} disabled>
                                <option value="slow">Chậm</option>
                                <option value="fast">Nhanh</option>
                                <option value="super_fast">Siêu nhanh</option>
                              </select>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Giá tiền (VNĐ/kWh)</label>
                            <input
                              type="number"
                              value={port.price}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowViewModal(false)}
                  >
                    Đóng
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationManagement;
