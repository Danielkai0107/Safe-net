import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import SendIcon from "@mui/icons-material/Send";
import { 
  Smartphone, 
  AlertCircle, 
  Clock, 
  Battery, 
  PhoneOff, 
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';
import { useAppStore } from "../../store/store";

interface NotificationHistory {
  id: string;
  timestamp: string;
  tenantName: string;
  elderName: string;
  alertType: string;
  success: boolean;
  message: string;
}

export const LineNotificationTester: React.FC = () => {
  const {
    selectedTenant,
    setSelectedTenant,
    selectedElder,
    setSelectedElder,
    tenants,
    elders,
    fetchTenants,
    fetchElders,
  } = useAppStore();

  const [alertType, setAlertType] = useState<
    "emergency" | "inactivity" | "low_battery" | "device_offline" | "first_signal"
  >("emergency");
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [responseMessage, setResponseMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    if (selectedTenant) {
      fetchElders(selectedTenant.id);
    }
  }, [selectedTenant, fetchElders]);

  const filteredElders = useMemo(() => {
    if (!selectedTenant) return [];
    return elders.filter((elder) => elder.tenantId === selectedTenant.id);
  }, [selectedTenant, elders]);

  const handleSendNotification = async () => {
    if (!selectedTenant || !selectedElder) {
      alert("請選擇社區和長者");
      return;
    }

    setIsSending(true);
    setResponseMessage(null);

    try {
      // 調用 sendTestNotification Cloud Function
      // 優先使用環境變數，如果有設定則替換 endpoint，否則使用生產環境
      let apiEndpoint = "https://us-central1-safe-net-test.cloudfunctions.net/sendTestNotification";
      
      if (import.meta.env.VITE_API_ENDPOINT) {
        apiEndpoint = import.meta.env.VITE_API_ENDPOINT.replace(
          "receiveSignal",
          "sendTestNotification"
        );
      }

      console.log("發送測試通知：", {
        tenantId: selectedTenant.id,
        elderId: selectedElder.id,
        alertType,
        apiEndpoint,
      });

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: selectedTenant.id,
          elderId: selectedElder.id,
          alertType: alertType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResponseMessage({
          type: "success",
          text: "LINE 通知已發送！請檢查手機 LINE 是否收到通知。",
        });

        const historyItem: NotificationHistory = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          tenantName: selectedTenant.name,
          elderName: selectedElder.name,
          alertType: alertType,
          success: true,
          message: data.message || "通知已發送",
        };

        setHistory((prev) => [historyItem, ...prev].slice(0, 10));
      } else {
        setResponseMessage({
          type: "error",
          text: `發送失敗：${data.error || data.message}`,
        });

        const historyItem: NotificationHistory = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          tenantName: selectedTenant.name,
          elderName: selectedElder.name,
          alertType: alertType,
          success: false,
          message: data.error || data.message,
        };

        setHistory((prev) => [historyItem, ...prev].slice(0, 10));
      }
    } catch (error: any) {
      console.error("Error:", error);
      setResponseMessage({
        type: "error",
        text: `網路錯誤：${error.message}`,
      });

      const historyItem: NotificationHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        tenantName: selectedTenant.name,
        elderName: selectedElder.name,
        alertType: alertType,
        success: false,
        message: error.message,
      };

      setHistory((prev) => [historyItem, ...prev].slice(0, 10));
    } finally {
      setIsSending(false);
    }
  };

  const alertTypeLabels = {
    emergency: "緊急求救",
    inactivity: "長時間未活動",
    low_battery: "裝置電量不足",
    device_offline: "裝置離線",
    first_signal: "當日首次活動",
  };

  const getAlertIcon = (type: string) => {
    const iconProps = { size: 16, style: { marginRight: '4px' } };
    switch (type) {
      case 'emergency':
        return <AlertCircle {...iconProps} color="#d32f2f" />;
      case 'inactivity':
        return <Clock {...iconProps} color="#ed6c02" />;
      case 'low_battery':
        return <Battery {...iconProps} color="#ed6c02" />;
      case 'device_offline':
        return <PhoneOff {...iconProps} color="#757575" />;
      case 'first_signal':
        return <CheckCircle {...iconProps} color="#2e7d32" />;
      default:
        return null;
    }
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Smartphone size={24} color="#1976d2" />
          <Typography variant="h5" fontWeight={600}>
            LINE 通知測試
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          測試發送 LINE 通知給社區內的所有用戶
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Left Column: Form */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                select
                label="選擇社區 (Tenant)"
                value={selectedTenant?.id || ""}
                onChange={(e) => {
                  const tenant = tenants.find((t) => t.id === e.target.value);
                  setSelectedTenant(tenant || null);
                  setSelectedElder(null);
                }}
                fullWidth
              >
                <MenuItem value="">請選擇社區...</MenuItem>
                {tenants.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="選擇長者 (Elder)"
                value={selectedElder?.id || ""}
                onChange={(e) => {
                  const elder = filteredElders.find(
                    (el) => el.id === e.target.value
                  );
                  setSelectedElder(elder || null);
                }}
                disabled={!selectedTenant}
                fullWidth
              >
                <MenuItem value="">請選擇長者...</MenuItem>
                {filteredElders.map((elder) => (
                  <MenuItem key={elder.id} value={elder.id}>
                    {elder.name} {elder.age ? `(${elder.age}歲)` : ""}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="警報類型"
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as any)}
                fullWidth
              >
                {Object.entries(alertTypeLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    <Box display="flex" alignItems="center">
                      {getAlertIcon(key)}
                      {label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="contained"
                size="large"
                color="primary"
                startIcon={<SendIcon />}
                onClick={handleSendNotification}
                disabled={!selectedTenant || !selectedElder || isSending}
                fullWidth
              >
                {isSending ? "發送中..." : "發送測試通知"}
              </Button>

              {responseMessage && (
                <Alert severity={responseMessage.type}>
                  {responseMessage.text}
                </Alert>
              )}
            </Box>
          </Grid>

          {/* Right Column: Info & History */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Instructions */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Info size={18} color="#1976d2" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    測試說明
                  </Typography>
                </Box>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    1. 選擇要測試的社區和長者
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    2. 選擇警報類型
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    3. 點擊「發送測試通知」按鈕
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    4. 檢查手機 LINE 是否收到通知
                  </Typography>
                </Box>

                {selectedTenant && (
                  <Box mt={2}>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      fontWeight={600}
                    >
                      當前選擇：
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>社區：</strong> {selectedTenant.name}
                    </Typography>
                    {selectedElder && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>長者：</strong> {selectedElder.name}
                        {selectedElder.age && ` (${selectedElder.age}歲)`}
                      </Typography>
                    )}
                  </Box>
                )}

                <Box mt={2}>
                  <Alert severity="warning" sx={{ fontSize: "0.875rem" }}>
                    注意：通知會發送給所有加入該社區 LINE OA 的用戶
                  </Alert>
                </Box>
              </Paper>

              {/* History */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  歷史發送紀錄 (最近 10 次)
                </Typography>
                {history.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    暫無紀錄
                  </Typography>
                ) : (
                  <Box
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    mt={1}
                    maxHeight={400}
                    overflow="auto"
                  >
                    {history.map((item) => (
                      <Alert
                        key={item.id}
                        severity={item.success ? "success" : "error"}
                        sx={{ py: 0.5 }}
                      >
                        <Box display="flex" alignItems="center">
                          {item.success ? (
                            <CheckCircle size={14} color="#2e7d32" style={{ marginRight: '4px' }} />
                          ) : (
                            <XCircle size={14} color="#d32f2f" style={{ marginRight: '4px' }} />
                          )}
                          <Typography variant="caption" fontWeight={600}>
                            {item.elderName} - {alertTypeLabels[item.alertType as keyof typeof alertTypeLabels]}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          {new Date(item.timestamp).toLocaleString("zh-TW")}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {item.message}
                        </Typography>
                      </Alert>
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
