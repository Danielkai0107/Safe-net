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
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import GroupIcon from "@mui/icons-material/Group";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Chip from "@mui/material/Chip";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ElderList } from "./ElderList";
import { ElderDetail } from "./ElderDetail";
import { AlertList } from "./AlertList";
import type { Tenant } from "../../types";

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
            console.log(`✅ Found tenant with LIFF ID: ${tryLiffId}`);
            break;
          } else {
            console.log(`❌ No tenant found with LIFF ID: ${tryLiffId}`);
          }
        }

        if (!tenantsSnapshot || tenantsSnapshot.empty) {
          // Additional debugging: List all tenants to help diagnose
          console.log("📋 Debugging: Fetching all active tenants...");
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

        console.log("✅ 找到社區:", tenant.name);
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
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
        p={2}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 600 }}>
          <Typography variant="h5" color="error" gutterBottom>
            ❌ 錯誤
          </Typography>
          <Typography
            variant="body1"
            color="text.primary"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {error}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={2}
          >
            如果此訊息不正確，請通知管理員以更新您的權限。
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!isAuthorized) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
        p={2}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400 }}>
          <Typography variant="h5" color="warning.main" gutterBottom>
            ⚠️ 無法載入
          </Typography>
          <Typography variant="body1" color="text.primary">
            找不到社區設定
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={2}
          >
            請確認 LIFF 設定是否正確，或聯絡系統管理員。
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <AppBar position="sticky">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            fontWeight={600}
            sx={{ flexGrow: 1 }}
          >
            🏘️ {currentTenant?.name || "Community Guardian"}
          </Typography>
          {isAdmin && (
            <Chip
              icon={<AdminPanelSettingsIcon />}
              label="管理員"
              color="secondary"
              size="small"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "& .MuiChip-icon": {
                  color: "white",
                },
              }}
            />
          )}
        </Toolbar>
      </AppBar>

      {/* Navigation Tabs */}
      <Paper square elevation={1}>
        <Container maxWidth="lg">
          <Tabs value={currentTab} variant="fullWidth">
            <Tab
              icon={<GroupIcon />}
              label="長者列表"
              component={Link}
              to="/liff"
              iconPosition="start"
            />
            <Tab
              icon={<NotificationsIcon />}
              label="警報記錄"
              component={Link}
              to="/liff/alerts"
              iconPosition="start"
            />
          </Tabs>
        </Container>
      </Paper>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<ElderList />} />
          <Route path="/elder/:id" element={<ElderDetail />} />
          <Route path="/alerts" element={<AlertList />} />
          <Route path="*" element={<Navigate to="/liff" replace />} />
        </Routes>
      </Container>
    </Box>
  );
};
