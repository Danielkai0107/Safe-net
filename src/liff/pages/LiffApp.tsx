import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import liff from "@line/liff";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAppStore } from "../../store/store";
import { XCircle, AlertTriangle, Users, Bell, ShieldCheck } from "lucide-react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ElderList } from "./ElderList";
import { ElderDetail } from "./ElderDetail";
import { AlertList } from "./AlertList";
import type { Tenant } from "../../types";

// 🎨 開發模式：設為 true 以跳過 LIFF 登入，方便樣式切版
const DEV_MODE_SKIP_AUTH = false;

export const LiffApp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    setLineUserId,
    setCurrentTenantId,
    setCurrentTenant,
    setIsAdmin,
    isAdmin,
    currentTenant,
    fetchElders,
    subscribeToAlerts,
  } = useAppStore();

  // Determine current tab based on route
  const currentTab = location.pathname === "/liff/alerts" ? 1 : 0;

  useEffect(() => {
    const initializeLiff = async () => {
      // 🎨 開發模式：跳過 LIFF 登入驗證
      if (DEV_MODE_SKIP_AUTH) {
        console.log("🎨 開發模式：跳過 LIFF 登入驗證");

        // 設定模擬的社區資料
        const mockTenant: Tenant = {
          id: "mock-tenant-id",
          name: "測試社區",
          contactPerson: "測試管理員",
          address: "台北市大安區",
          contactPhone: "0912-345-678",
          lineConfig: {
            channelAccessToken: "mock-token",
            channelSecret: "mock-secret",
            liffId: "mock-liff-id",
          },
          adminLineIds: ["mock-line-user-id"],
          subscription: {
            plan: "basic",
            status: "active",
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          settings: {
            alertThresholdHours: 12,
            enableEmergencyAlert: true,
            enableInactivityAlert: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setCurrentTenantId(mockTenant.id);
        setCurrentTenant(mockTenant);
        setIsAdmin(true); // 設為管理員以查看所有功能
        setLineUserId("mock-line-user-id");

        // 設定模擬的長者資料
        const mockElders = [
          {
            id: "elder-1",
            tenantId: mockTenant.id,
            name: "王大明",
            age: 75,
            gender: "male" as const,
            address: "台北市大安區復興南路一段123號",
            contactPhone: "0912-345-678",
            emergencyContact: "王小明",
            emergencyPhone: "0923-456-789",
            macAddress: "AA:BB:CC:DD:EE:01",
            deviceId: "device-1",
            status: "active" as const,
            lastSeen: new Date().toISOString(),
            notes: "每日需要量測血壓",
            createdAt: "2024-01-15T08:00:00.000Z",
            updatedAt: new Date().toISOString(),
          },
          {
            id: "elder-2",
            tenantId: mockTenant.id,
            name: "李美華",
            age: 82,
            gender: "female" as const,
            address: "台北市中山區南京東路二段456號",
            contactPhone: "0934-567-890",
            emergencyContact: "李家豪",
            emergencyPhone: "0945-678-901",
            macAddress: "AA:BB:CC:DD:EE:02",
            deviceId: "device-2",
            status: "offline" as const,
            batteryLevel: 45,
            lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小時前
            notes: "行動不便，需使用輪椅",
            createdAt: "2024-01-20T10:30:00.000Z",
            updatedAt: new Date().toISOString(),
          },
          {
            id: "elder-3",
            tenantId: mockTenant.id,
            name: "陳志強",
            age: 78,
            gender: "male" as const,
            address: "台北市信義區松仁路789號",
            contactPhone: "0956-789-012",
            emergencyContact: "陳美玲",
            emergencyPhone: "0967-890-123",
            macAddress: "AA:BB:CC:DD:EE:03",
            deviceId: "device-3",
            status: "inactive" as const,
            lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10分鐘前
            notes: "患有糖尿病，需定期服藥",
            createdAt: "2024-02-01T14:15:00.000Z",
            updatedAt: new Date().toISOString(),
          },
          {
            id: "elder-4",
            tenantId: mockTenant.id,
            name: "張秀英",
            age: 85,
            gender: "female" as const,
            address: "台北市松山區民生東路321號",
            contactPhone: "0978-901-234",
            emergencyContact: "張大偉",
            emergencyPhone: "0989-012-345",
            macAddress: "AA:BB:CC:DD:EE:04",
            deviceId: "device-4",
            status: "active" as const,
            lastSeen: new Date().toISOString(),
            notes: "聽力較差，需大聲說話",
            createdAt: "2024-02-10T09:45:00.000Z",
            updatedAt: new Date().toISOString(),
          },
        ];

        // 設定模擬的警報資料
        const mockAlerts = [
          {
            id: "alert-1",
            tenantId: mockTenant.id,
            elderId: "elder-3",
            elderName: "陳志強",
            alertType: "low_battery" as const,
            severity: "medium" as const,
            message: "裝置電量過低（20%）",
            status: "pending" as const,
            notificationSent: true,
            notificationSentAt: new Date(
              Date.now() - 30 * 60 * 1000
            ).toISOString(),
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
          {
            id: "alert-2",
            tenantId: mockTenant.id,
            elderId: "elder-2",
            elderName: "李美華",
            alertType: "inactivity" as const,
            severity: "high" as const,
            message: "超過2小時未活動",
            status: "acknowledged" as const,
            notificationSent: true,
            notificationSentAt: new Date(
              Date.now() - 2 * 60 * 60 * 1000
            ).toISOString(),
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小時前
            updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            acknowledgedAt: new Date(
              Date.now() - 1 * 60 * 60 * 1000
            ).toISOString(),
            acknowledgedBy: "管理員",
          },
          {
            id: "alert-3",
            tenantId: mockTenant.id,
            elderId: "elder-1",
            elderName: "王大明",
            alertType: "device_offline" as const,
            severity: "low" as const,
            message: "裝置暫時離線",
            status: "resolved" as const,
            notificationSent: true,
            notificationSentAt: new Date(
              Date.now() - 24 * 60 * 60 * 1000
            ).toISOString(),
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1天前
            updatedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            resolvedAt: new Date(
              Date.now() - 23 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "alert-4",
            tenantId: mockTenant.id,
            elderId: "elder-3",
            elderName: "陳志強",
            alertType: "emergency" as const,
            severity: "critical" as const,
            message: "緊急求救信號",
            status: "pending" as const,
            notificationSent: true,
            notificationSentAt: new Date(
              Date.now() - 5 * 60 * 1000
            ).toISOString(),
            createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5分鐘前
            updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          },
        ];

        // 直接設定到 store，不呼叫 Firebase
        useAppStore.setState({
          elders: mockElders,
          alerts: mockAlerts,
          isLoading: false,
        });

        setIsAuthorized(true);
        setIsInitialized(true);

        console.log("🎨 開發模式資料已載入：", {
          elders: mockElders.length,
          alerts: mockAlerts.length,
        });

        // 返回空的取消訂閱函數
        return () => {
          console.log("🎨 開發模式：清理訂閱");
        };
      }

      // 正式環境的 LIFF 初始化流程
      try {
        // Extract LIFF ID and state from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const liffStateParam = urlParams.get("liff.state"); // This is the route path, not LIFF ID

        // Try to get LIFF ID from multiple sources
        // 1. From URL query parameter (for testing)
        // 2. From environment variable (fallback)
        let liffId = urlParams.get("liffId") || import.meta.env.VITE_LIFF_ID;

        // If still no LIFF ID, try to extract from the referrer or context
        if (!liffId && window.location.pathname.includes("/liff")) {
          // Try to get from liff context after init with any ID
          // This is a workaround - in production, each tenant should have separate LIFF URLs
          console.log(
            "No LIFF ID found, attempting to initialize with context"
          );
        }

        if (!liffId) {
          setError("無法取得 LIFF ID。請確保您是從正確的 LINE LIFF 連結進入。");
          setIsInitialized(true);
          return;
        }

        console.log("Initializing LIFF with ID:", liffId);
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        // After successful login, get the actual LIFF ID from context
        const actualLiffId = liff.id || liffId;
        console.log("LIFF initialized successfully. LIFF ID:", actualLiffId);
        console.log("Original LIFF ID from param/env:", liffId);

        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        setLineUserId(lineUserId);

        console.log("LINE User ID:", lineUserId);

        // Find tenant by LIFF ID from database
        // Each tenant has their own LIFF ID configured in their LINE Channel
        console.log("Looking for tenant with LIFF ID:", actualLiffId);

        // Try multiple LIFF ID formats to match
        const liffIdsToTry = [
          actualLiffId, // Full LIFF ID from liff.id (e.g., "2000000000-abcdefgh")
          liffId, // Original from URL/env
        ];

        // Remove duplicates
        const uniqueLiffIds = [...new Set(liffIdsToTry.filter((id) => id))];
        console.log("Trying LIFF IDs:", uniqueLiffIds);

        const tenantsRef = collection(db, "tenants");
        let tenantsSnapshot;
        let matchedLiffId = "";

        // Try each LIFF ID format
        for (const tryLiffId of uniqueLiffIds) {
          console.log(`Querying with LIFF ID: ${tryLiffId}`);
          const q = query(
            tenantsRef,
            where("lineConfig.liffId", "==", tryLiffId),
            where("subscription.status", "==", "active")
          );

          tenantsSnapshot = await getDocs(q);

          if (!tenantsSnapshot.empty) {
            matchedLiffId = tryLiffId;
            console.log(`Found tenant with LIFF ID: ${tryLiffId}`);
            break;
          } else {
            console.log(`No tenant found with LIFF ID: ${tryLiffId}`);
          }
        }

        if (!tenantsSnapshot || tenantsSnapshot.empty) {
          // Additional debugging: List all tenants to help diagnose
          console.log("Debugging: Fetching all active tenants...");
          const allTenantsQuery = query(
            tenantsRef,
            where("subscription.status", "==", "active")
          );
          const allTenantsSnapshot = await getDocs(allTenantsQuery);

          if (!allTenantsSnapshot.empty) {
            console.log("Active tenants found:");
            allTenantsSnapshot.forEach((doc) => {
              const tenant = doc.data();
              console.log(
                `- ${tenant.name}: LIFF ID = ${
                  tenant.lineConfig?.liffId || "NOT SET"
                }`
              );
            });
          } else {
            console.log("No active tenants found in database");
          }

          setError(
            `找不到對應的社區設定。\n\n` +
              `嘗試的 LIFF ID：\n${uniqueLiffIds.join("\n")}\n\n` +
              `請確保管理員已在後台正確設定社區的 LIFF ID。`
          );
          setIsInitialized(true);
          return;
        }

        const tenantDoc = tenantsSnapshot.docs[0];
        const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;

        console.log("找到社區:", tenant.name);
        console.log("社區 ID:", tenant.id);
        console.log("匹配的 LIFF ID:", matchedLiffId);
        console.log("資料庫中的 LIFF ID:", tenant.lineConfig.liffId);

        // Check if user is admin
        const isUserAdmin =
          tenant.adminLineIds && tenant.adminLineIds.length > 0
            ? tenant.adminLineIds.includes(lineUserId)
            : false; // If no specific admins set, no one has admin rights

        console.log("管理員 LINE IDs:", tenant.adminLineIds);
        console.log("是否為管理員:", isUserAdmin);

        setIsAdmin(isUserAdmin);

        // Record LINE user information
        try {
          const userRef = doc(db, "lineUsers", lineUserId);
          const now = new Date().toISOString();

          await setDoc(
            userRef,
            {
              id: lineUserId,
              tenantId: tenant.id,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl || null,
              statusMessage: profile.statusMessage || null,
              lastSeenAt: now,
              updatedAt: now,
            },
            { merge: true }
          );

          // Check if this is a new user (firstSeenAt not set)
          const userDoc = await getDocs(
            query(collection(db, "lineUsers"), where("id", "==", lineUserId))
          );
          if (userDoc.empty || !userDoc.docs[0].data().firstSeenAt) {
            await setDoc(
              userRef,
              {
                firstSeenAt: now,
                createdAt: now,
              },
              { merge: true }
            );
          }

          console.log("LINE user info recorded:", lineUserId);
        } catch (error) {
          console.error("Failed to record LINE user info:", error);
        }

        setCurrentTenantId(tenant.id);
        setCurrentTenant(tenant);
        setIsAuthorized(true);
        setIsInitialized(true);

        await fetchElders(tenant.id);
        const unsubscribe = subscribeToAlerts(tenant.id);

        // Handle liff.state parameter to navigate to specific page
        if (liffStateParam) {
          console.log("Navigating to liff.state path:", liffStateParam);
          // liff.state contains the path relative to /liff (e.g., "/elder/123")
          // We need to prepend /liff to match our routing structure
          navigate(`/liff${liffStateParam}`, { replace: true });
        }

        return () => {
          unsubscribe();
        };
      } catch (err: any) {
        console.error("LIFF initialization failed:", err);
        setError("LIFF 初始化失敗：" + err.message);
        setIsInitialized(true);
      }
    };

    initializeLiff();
  }, [
    setLineUserId,
    setCurrentTenantId,
    setCurrentTenant,
    setIsAdmin,
    fetchElders,
    subscribeToAlerts,
  ]);

  if (!isInitialized) {
    return <LoadingSpinner text="載入中..." />;
  }

  if (error) {
    return (
      <div
        className="flex flex--center flex--align-center"
        style={{ minHeight: "100vh", padding: "2rem" }}
      >
        <div
          className="paper paper--elevated p-8"
          style={{ maxWidth: "600px" }}
        >
          <div className="flex flex--align-center gap-2 mb-4">
            <XCircle size={28} color="#d32f2f" />
            <h2 className="h5 text-error">錯誤</h2>
          </div>
          <p
            className="text-body-1"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {error}
          </p>
          <p className="text-caption text-secondary mt-4">
            如果此訊息不正確，請通知管理員以更新您的權限。
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div
        className="flex flex--center flex--align-center"
        style={{ minHeight: "100vh", padding: "2rem" }}
      >
        <div
          className="paper paper--elevated p-8"
          style={{ maxWidth: "400px" }}
        >
          <div className="flex flex--align-center gap-2 mb-4">
            <AlertTriangle size={28} color="#ed6c02" />
            <h2 className="h5 text-warning">無法載入</h2>
          </div>
          <p className="text-body-1">找不到社區設定</p>
          <p className="text-caption text-secondary mt-4">
            請確認 LIFF 設定是否正確，或聯絡系統管理員。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header className="liff-appbar">
        <div className="liff-appbar__toolbar">
          <h1 className="liff-appbar__title">
            {currentTenant?.name || "Community Guardian"}
          </h1>
          {isAdmin && (
            <span className="liff-appbar__badge">
              <ShieldCheck />
              管理員
            </span>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="liff-navigation">
        <div className="liff-navigation__tabs">
          <Link
            to="/liff"
            className={`liff-navigation__tab ${
              currentTab === 0 ? "liff-navigation__tab--active" : ""
            }`}
          >
            <Users className="liff-navigation__icon" />
            <span className="liff-navigation__label">長者列表</span>
          </Link>
          <Link
            to="/liff/alerts"
            className={`liff-navigation__tab ${
              currentTab === 1 ? "liff-navigation__tab--active" : ""
            }`}
          >
            <Bell className="liff-navigation__icon" />
            <span className="liff-navigation__label">警報記錄</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div>
        <Routes>
          <Route path="/" element={<ElderList />} />
          <Route path="/elder/:id" element={<ElderDetail />} />
          <Route path="/alerts" element={<AlertList />} />
          <Route path="*" element={<Navigate to="/liff" replace />} />
        </Routes>
      </div>
    </div>
  );
};
