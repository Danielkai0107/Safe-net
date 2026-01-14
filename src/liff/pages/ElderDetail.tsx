import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAppStore } from "../../store/store";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { UserCircle } from "lucide-react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { StatusBadge } from "../../components/StatusBadge";
import type { Elder, SignalLog } from "../../types";

// 🎨 開發模式：設為 true 以使用模擬資料
const DEV_MODE = false;

export const ElderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchElderById, elders } = useAppStore();
  const [elder, setElder] = useState<Elder | null>(null);
  const [logs, setLogs] = useState<SignalLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // 🎨 開發模式：從 store 中直接讀取長者資料
        if (DEV_MODE) {
          console.log("🎨 開發模式：從 store 讀取長者資料", id);
          const elderData = elders.find((e) => e.id === id);

          if (!elderData) {
            alert("找不到此長者");
            navigate("/liff");
            return;
          }

          setElder(elderData);

          // 生成模擬的活動記錄
          const mockLogs: SignalLog[] = [];
          const now = Date.now();

          // 根據不同長者生成不同數量的記錄
          const logCount =
            elderData.status === "active"
              ? 10
              : elderData.status === "inactive"
              ? 5
              : 2;

          for (let i = 0; i < logCount; i++) {
            const timestamp = new Date(
              now - i * 2 * 60 * 60 * 1000
            ).toISOString(); // 每2小時一筆
            mockLogs.push({
              id: `log-${id}-${i}`,
              elderId: id,
              elderName: elderData.name,
              tenantId: elderData.tenantId,
              macAddress: elderData.macAddress,
              gatewayId: `gateway-${(i % 3) + 1}`,
              signalType:
                i === 0 && elderData.status === "inactive"
                  ? "emergency"
                  : i % 5 === 0
                  ? "health"
                  : "normal",
              rssi: -50 - Math.floor(Math.random() * 30), // -50 到 -80 dBm
              timestamp,
              createdAt: timestamp,
            } as SignalLog);
          }

          setLogs(mockLogs);
          console.log("🎨 生成模擬活動記錄：", mockLogs.length, "筆");
          setIsLoading(false);
          return;
        }

        // 正式環境：從 Firebase 讀取
        const elderData = await fetchElderById(id);
        if (!elderData) {
          alert("找不到此長者");
          navigate("/liff");
          return;
        }
        setElder(elderData);

        const logsRef = collection(db, "logs");
        const twentyFourHoursAgo = new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ).toISOString();
        const q = query(
          logsRef,
          where("elderId", "==", id),
          where("timestamp", ">=", twentyFourHoursAgo),
          orderBy("timestamp", "desc"),
          limit(50)
        );

        const logsSnapshot = await getDocs(q);
        const logsData: SignalLog[] = logsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as SignalLog)
        );

        setLogs(logsData);
      } catch (error: any) {
        console.error("Error loading elder detail:", error);
        alert("載入失敗：" + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, fetchElderById, navigate, elders]);

  if (isLoading) {
    return <LoadingSpinner text="載入資料..." fullPage />;
  }

  if (!elder) {
    return null;
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });
  };

  return (
    <div className="liff-elder-detail">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/liff")}
        className="mb-4"
      >
        返回列表
      </Button>

      {/* Elder Info Card */}
      <div className="liff-elder-detail__header">
        <div className="flex flex-between flex--align-start ">
          <div className="flex flex--align-center gap-4">
            <div className="liff-elder-detail__avatar">
              <UserCircle size={64} strokeWidth={1.5} color="#1976d2" />
            </div>
            <div>
              <h1 className="liff-elder-detail__name">{elder.name}</h1>
              {elder.age && (
                <p className="liff-elder-detail__meta">{elder.age} 歲</p>
              )}
            </div>
          </div>
          <StatusBadge status={elder.status} lastSeen={elder.lastSeen} />
        </div>
      </div>

      {/* Basic Info Section */}
      <div className="liff-elder-detail__sections">
        <div className="liff-elder-detail__section">
          <h2 className="liff-elder-detail__section-title">基本資料</h2>
          <div className="liff-elder-detail__info-grid">
            {elder.gender && (
              <div className="liff-elder-detail__info-item">
                <div className="liff-elder-detail__info-item-label">性別</div>
                <div className="liff-elder-detail__info-item-value">
                  {elder.gender === "male"
                    ? "男"
                    : elder.gender === "female"
                    ? "女"
                    : "其他"}
                </div>
              </div>
            )}
            {elder.address && (
              <div className="liff-elder-detail__info-item">
                <div className="liff-elder-detail__info-item-label">地址</div>
                <div className="liff-elder-detail__info-item-value">
                  {elder.address}
                </div>
              </div>
            )}
            {elder.contactPhone && (
              <div className="liff-elder-detail__info-item">
                <div className="liff-elder-detail__info-item-label">
                  聯絡電話
                </div>
                <div className="liff-elder-detail__info-item-value">
                  {elder.contactPhone}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contact Section */}
        {(elder.emergencyContact || elder.emergencyPhone) && (
          <div className="liff-elder-detail__section">
            <h2 className="liff-elder-detail__section-title">緊急聯絡人</h2>
            <div className="liff-elder-detail__info-grid">
              {elder.emergencyContact && (
                <div className="liff-elder-detail__info-item">
                  <div className="liff-elder-detail__info-item-label">
                    聯絡人
                  </div>
                  <div className="liff-elder-detail__info-item-value">
                    {elder.emergencyContact}
                  </div>
                </div>
              )}
              {elder.emergencyPhone && (
                <div className="liff-elder-detail__info-item">
                  <div className="liff-elder-detail__info-item-label">電話</div>
                  <div className="liff-elder-detail__info-item-value">
                    {elder.emergencyPhone}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Device Info Section */}
        <div className="liff-elder-detail__section">
          <h2 className="liff-elder-detail__section-title">裝置資訊</h2>
          <div className="liff-elder-detail__info-grid">
            <div className="liff-elder-detail__info-item">
              <div className="liff-elder-detail__info-item-label">
                MAC Address
              </div>
              <div className="liff-elder-detail__info-item-value font-monospace">
                {elder.macAddress}
              </div>
            </div>
            <div className="liff-elder-detail__info-item">
              <div className="liff-elder-detail__info-item-label">最後出現</div>
              <div className="liff-elder-detail__info-item-value">
                {formatTime(elder.lastSeen)}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs Section */}
        <div className="liff-elder-detail__section">
          <h2 className="liff-elder-detail__section-title">24小時活動記錄</h2>
          {logs.length === 0 ? (
            <p className="text-center text-secondary p-8">暫無活動記錄</p>
          ) : (
            <div className="flex flex-column gap-3">
              {logs.map((log) => (
                <div key={log.id} className="paper paper--bordered p-4">
                  <div className="flex flex-between flex--align-center mb-2">
                    <span
                      className={`badge badge--${
                        log.signalType === "emergency"
                          ? "error"
                          : log.signalType === "health"
                          ? "warning"
                          : "success"
                      }`}
                    >
                      {log.signalType === "emergency"
                        ? "緊急"
                        : log.signalType === "health"
                        ? "健康"
                        : "正常"}
                    </span>
                    <span className="text-caption">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  {log.gatewayId && (
                    <p className="text-body-2">網關：{log.gatewayId}</p>
                  )}
                  <p className="text-caption text-secondary">
                    信號強度：{log.rssi} dBm
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
