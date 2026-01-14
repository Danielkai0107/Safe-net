import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAppStore } from "../../store/store";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { StatusBadge } from "../../components/StatusBadge";
import type { Alert as AlertType } from "../../types";

export const AlertList: React.FC = () => {
  const { alerts, isLoading, lineUserId } = useAppStore();
  const [filter, setFilter] = useState<
    "all" | "pending" | "acknowledged" | "resolved"
  >("all");

  const filteredAlerts =
    filter === "all" ? alerts : alerts.filter((a) => a.status === filter);

  const handleAcknowledge = async (alertItem: AlertType) => {
    if (!lineUserId) {
      alert("無法取得 LINE User ID");
      return;
    }

    try {
      await updateDoc(doc(db, "alerts", alertItem.id), {
        status: "acknowledged",
        acknowledgedBy: lineUserId,
        acknowledgedAt: new Date().toISOString(),
      });
      alert("已確認此警報");
    } catch (error: any) {
      console.error("Error acknowledging alert:", error);
      alert("操作失敗：" + error.message);
    }
  };

  const handleResolve = async (alertItem: AlertType) => {
    try {
      await updateDoc(doc(db, "alerts", alertItem.id), {
        status: "resolved",
        resolvedAt: new Date().toISOString(),
      });
      alert("已解決此警報");
    } catch (error: any) {
      console.error("Error resolving alert:", error);
      alert("操作失敗：" + error.message);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });
  };

  if (isLoading) {
    return <LoadingSpinner text="載入警報資料..." fullPage />;
  }

  return (
    <div className="liff-alert-list">
      {/* Header */}
      <div className="liff-alert-list__header">
        <TextField
          select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">全部</MenuItem>
          <MenuItem value="pending">待處理</MenuItem>
          <MenuItem value="acknowledged">已確認</MenuItem>
          <MenuItem value="resolved">已解決</MenuItem>
        </TextField>
        <div>
          {/* <h1 className="liff-alert-list__title">警報記錄</h1> */}
          <p className="text-body-2 text-secondary ">
            共 {filteredAlerts.length} 筆警報
          </p>
        </div>
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <div className="liff-alert-list__empty">
          <p className="text-body-1 text-secondary">暫無警報記錄</p>
        </div>
      ) : (
        <div className="liff-alert-list__list">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`liff-alert-list__alert-item ${
                alert.severity === "critical"
                  ? "liff-alert-list__alert-item--critical"
                  : alert.status === "resolved"
                  ? "liff-alert-list__alert-item--resolved"
                  : ""
              }`}
            >
              <div className="liff-alert-list__alert-item-header">
                <div className="liff-alert-list__alert-item-header-content">
                  <h3>{alert.elderName}</h3>
                  <p>{formatTime(alert.createdAt)}</p>
                </div>
                <StatusBadge status={alert.status} />
              </div>

              {alert.elderName && (
                <p className="liff-alert-list__alert-item-message">
                  <strong>警報：</strong>
                  {alert.message}
                </p>
              )}

              {alert.status === "pending" && (
                <div className="liff-alert-list__alert-item-actions">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAcknowledge(alert)}
                  >
                    確認
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleResolve(alert)}
                  >
                    解決
                  </Button>
                </div>
              )}

              {alert.status === "acknowledged" && (
                <div className="liff-alert-list__alert-item-actions">
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleResolve(alert)}
                    className="mt-3"
                  >
                    標記為已解決
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
