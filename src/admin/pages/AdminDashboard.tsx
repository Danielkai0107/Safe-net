import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsIcon from "@mui/icons-material/Notifications";
import GroupIcon from "@mui/icons-material/Group";
import DevicesIcon from "@mui/icons-material/Devices";
import RouterIcon from "@mui/icons-material/Router";
import LogoutIcon from "@mui/icons-material/Logout";
import ScienceIcon from "@mui/icons-material/Science";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useAppStore } from "../../store/store";
import { useAuth } from "../../contexts/AuthContext";

export const AdminDashboard: React.FC = () => {
  const { tenants, elders, alerts, fetchTenants, fetchElders } = useAppStore();
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
    fetchElders();
  }, [fetchTenants, fetchElders]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("登出失敗:", error);
    }
  };

  const userName = currentUser?.email?.split("@")[0] || "管理員";

  const stats = [
    {
      label: "總社區數",
      value: tenants.length,
      change: "+2.5%",
      trend: "up",
      subtitle: "本月數據",
      icon: <BusinessIcon />,
      variant: "primary" as const,
    },
    {
      label: "總長者數",
      value: elders.length,
      change: "+5.2%",
      trend: "up",
      subtitle: "本月活躍",
      icon: <PeopleIcon />,
      variant: "default" as const,
    },
    {
      label: "待處理警報",
      value: alerts.filter((a) => a.status === "pending").length,
      change: "-0.5%",
      trend: "up",
      subtitle: "需要關注",
      icon: <NotificationsIcon />,
      variant: "default" as const,
    },
  ];

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="admin-dashboard__header">
        <div className="admin-dashboard__greeting">
          <div>
            <h1 className="admin-dashboard__title">Hello, {userName}!</h1>
            <p className="admin-dashboard__subtitle">這是本月系統運作概覽</p>
          </div>
          <div className="admin-dashboard__actions">
            <IconButton onClick={handleSignOut} className="icon-btn-circle">
              <LogoutIcon />
            </IconButton>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="admin-dashboard__quick-actions">
          <Button
            component={Link}
            to="/admin/tenants"
            variant="contained"
            startIcon={<BusinessIcon />}
          >
            社區管理
          </Button>
          <Button
            component={Link}
            to="/admin/elders"
            variant="contained"
            color="success"
            startIcon={<GroupIcon />}
          >
            長者管理
          </Button>
          <Button
            component={Link}
            to="/admin/devices"
            variant="contained"
            color="warning"
            startIcon={<DevicesIcon />}
          >
            設備管理
          </Button>
          <Button
            component={Link}
            to="/admin/gateways"
            variant="contained"
            color="secondary"
            startIcon={<RouterIcon />}
          >
            網關管理
          </Button>
          <Button
            component={Link}
            to="/admin/testing"
            variant="outlined"
            startIcon={<ScienceIcon />}
          >
            測試工具
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-dashboard__stats">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`admin-dashboard__stat-card ${
              stat.variant === "primary"
                ? "admin-dashboard__stat-card--primary"
                : ""
            }`}
          >
            <div className="admin-dashboard__stat-header">
              <span className="admin-dashboard__stat-label">{stat.label}</span>
            </div>

            <div className="admin-dashboard__stat-value">{stat.value}</div>

            <div className="admin-dashboard__stat-change">
              <span
                className={`admin-dashboard__change-badge admin-dashboard__change-badge--positive`}
              >
                <TrendingUpIcon fontSize="small" />
                {stat.change}
              </span>
              <span style={{ marginLeft: "8px" }}>{stat.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access Grid */}
      <div className="admin-dashboard__charts">
        <div className="admin-dashboard__chart-card">
          <div className="admin-dashboard__chart-header">
            <div>
              <h2 className="admin-dashboard__chart-title">系統概覽</h2>
              <p className="admin-dashboard__chart-subtitle">
                快速訪問各功能模組
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
              marginTop: "24px",
            }}
          >
            <Link
              to="/admin/tenants"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="paper paper--elevated"
                style={{
                  padding: "24px",
                  cursor: "pointer",
                  transition: "transform 0.3s ease",
                }}
              >
                <BusinessIcon
                  style={{
                    fontSize: "32px",
                    color: "#667eea",
                    marginBottom: "12px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  社區管理
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  管理所有社區資訊
                </p>
              </div>
            </Link>
            <Link
              to="/admin/elders"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="paper paper--elevated"
                style={{
                  padding: "24px",
                  cursor: "pointer",
                  transition: "transform 0.3s ease",
                }}
              >
                <GroupIcon
                  style={{
                    fontSize: "32px",
                    color: "#10b981",
                    marginBottom: "12px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  長者管理
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  管理長者資料
                </p>
              </div>
            </Link>
            <Link
              to="/admin/devices"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="paper paper--elevated"
                style={{
                  padding: "24px",
                  cursor: "pointer",
                  transition: "transform 0.3s ease",
                }}
              >
                <DevicesIcon
                  style={{
                    fontSize: "32px",
                    color: "#f59e0b",
                    marginBottom: "12px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  設備管理
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  管理物聯網設備
                </p>
              </div>
            </Link>
            <Link
              to="/admin/gateways"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="paper paper--elevated"
                style={{
                  padding: "24px",
                  cursor: "pointer",
                  transition: "transform 0.3s ease",
                }}
              >
                <RouterIcon
                  style={{
                    fontSize: "32px",
                    color: "#f093fb",
                    marginBottom: "12px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  網關管理
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  管理網關設備
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div className="admin-dashboard__chart-card">
          <div className="admin-dashboard__chart-header">
            <div>
              <h2 className="admin-dashboard__chart-title">系統統計</h2>
              <p className="admin-dashboard__chart-subtitle">即時數據</p>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  社區總數
                </span>
                <span style={{ fontSize: "16px", fontWeight: 600 }}>
                  {tenants.length}
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "#e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    width: `${Math.min((tenants.length / 10) * 100, 100)}%`,
                    transition: "width 0.5s ease",
                  }}
                ></div>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  長者總數
                </span>
                <span style={{ fontSize: "16px", fontWeight: 600 }}>
                  {elders.length}
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "#e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background:
                      "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
                    width: `${Math.min((elders.length / 50) * 100, 100)}%`,
                    transition: "width 0.5s ease",
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  活躍警報
                </span>
                <span style={{ fontSize: "16px", fontWeight: 600 }}>
                  {alerts.filter((a) => a.status === "pending").length}
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "#e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background:
                      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    width: `${Math.min(
                      (alerts.filter((a) => a.status === "pending").length /
                        20) *
                        100,
                      100
                    )}%`,
                    transition: "width 0.5s ease",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
