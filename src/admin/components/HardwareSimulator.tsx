import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import SendIcon from '@mui/icons-material/Send';
import { 
  Wrench, 
  Radio, 
  AlertCircle, 
  Heart, 
  FileText, 
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAppStore } from '../../store/store';
import type { ReceiveSignalRequest, ReceiveSignalResponse, Gateway } from '../../types';

interface SignalHistory {
  id: string;
  timestamp: string;
  tenantName: string;
  elderName: string;
  gatewayLocation: string;
  signalType: string;
  success: boolean;
  message: string;
}

export const HardwareSimulator: React.FC = () => {
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

  const [signalType, setSignalType] = useState<'normal' | 'emergency' | 'health' | 'other'>('normal');
  const [rssi, setRssi] = useState<number>(-70);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<SignalHistory[]>([]);
  const [responseMessage, setResponseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    if (selectedTenant) {
      fetchElders(selectedTenant.id);
      fetchGateways(selectedTenant.id);
    }
  }, [selectedTenant, fetchElders]);

  const fetchGateways = async (tenantId: string) => {
    try {
      const gatewaysRef = collection(db, 'gateways');
      const q = query(gatewaysRef, where('tenantId', '==', tenantId), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      const gatewaysData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Gateway[];

      setGateways(gatewaysData);
      
      // 自動選擇第一個接收點
      if (gatewaysData.length > 0) {
        setSelectedGateway(gatewaysData[0]);
      } else {
        setSelectedGateway(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch gateways:', error);
    }
  };

  const filteredElders = useMemo(() => {
    if (!selectedTenant) return [];
    return elders.filter((elder) => elder.tenantId === selectedTenant.id);
  }, [selectedTenant, elders]);

  const handleSendSignal = async () => {
    if (!selectedTenant || !selectedElder) {
      alert('請選擇社區和長者');
      return;
    }

    if (!selectedElder.macAddress) {
      alert('長者沒有綁定 MAC Address');
      return;
    }

    if (!selectedGateway) {
      alert('請選擇接收點');
      return;
    }

    setIsSending(true);
    setResponseMessage(null);

    const requestPayload: ReceiveSignalRequest = {
      macAddress: selectedElder.macAddress,
      rssi: rssi,
      gatewayId: selectedGateway.serialNumber, // 使用接收點的序號
      signalType: signalType,
      timestamp: new Date().toISOString(),
      metadata: {
        batteryLevel: batteryLevel,
      },
    };

    console.log('模擬硬體訊號發送：', requestPayload);

    try {
      const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || 'http://127.0.0.1:5001/safe-net-test/us-central1/receiveSignal';
      console.log('API Endpoint:', apiEndpoint);
      console.log('環境變數:', import.meta.env.VITE_API_ENDPOINT);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const data: ReceiveSignalResponse = await response.json();

      if (data.success) {
        setResponseMessage({
          type: 'success',
          text: `訊號已成功發送！${data.data?.alertTriggered ? ' 警報已觸發！' : ''}`,
        });

        const historyItem: SignalHistory = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          tenantName: selectedTenant.name,
          elderName: selectedElder.name,
          gatewayLocation: selectedGateway?.location || '',
          signalType: signalType,
          success: true,
          message: data.message,
        };

        setHistory((prev) => [historyItem, ...prev].slice(0, 10));
      } else {
        setResponseMessage({
          type: 'error',
          text: `發送失敗：${data.error || data.message}`,
        });

        const historyItem: SignalHistory = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          tenantName: selectedTenant.name,
          elderName: selectedElder.name,
          gatewayLocation: selectedGateway?.location || '',
          signalType: signalType,
          success: false,
          message: data.error || data.message,
        };

        setHistory((prev) => [historyItem, ...prev].slice(0, 10));
      }
    } catch (error: any) {
      console.error('Error:', error);
      setResponseMessage({
        type: 'error',
        text: `網路錯誤：${error.message}`,
      });

      const historyItem: SignalHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        tenantName: selectedTenant.name,
        elderName: selectedElder.name,
        gatewayLocation: selectedGateway?.location || '',
        signalType: signalType,
        success: false,
        message: error.message,
      };

      setHistory((prev) => [historyItem, ...prev].slice(0, 10));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Wrench size={24} color="#1976d2" />
          <Typography variant="h5" fontWeight={600}>
            硬體訊號模擬器
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Left Column: Form */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                select
                label="選擇社區 (Tenant)"
                value={selectedTenant?.id || ''}
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
                value={selectedElder?.id || ''}
                onChange={(e) => {
                  const elder = filteredElders.find((el) => el.id === e.target.value);
                  setSelectedElder(elder || null);
                }}
                disabled={!selectedTenant}
                fullWidth
              >
                <MenuItem value="">請選擇長者...</MenuItem>
                {filteredElders.map((elder) => (
                  <MenuItem key={elder.id} value={elder.id}>
                    {elder.name} {elder.age ? `(${elder.age}歲)` : ''} - {elder.macAddress}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="訊號類型"
                value={signalType}
                onChange={(e) => setSignalType(e.target.value as any)}
                fullWidth
              >
                <MenuItem value="normal">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Radio size={16} />
                    <span>一般訊號</span>
                  </Box>
                </MenuItem>
                <MenuItem value="emergency">
                  <Box display="flex" alignItems="center" gap={1}>
                    <AlertCircle size={16} color="#d32f2f" />
                    <span>緊急求救</span>
                  </Box>
                </MenuItem>
                <MenuItem value="health">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Heart size={16} color="#d32f2f" />
                    <span>健康數據</span>
                  </Box>
                </MenuItem>
                <MenuItem value="other">
                  <Box display="flex" alignItems="center" gap={1}>
                    <FileText size={16} />
                    <span>其他訊號</span>
                  </Box>
                </MenuItem>
              </TextField>

              <TextField
                select
                label="選擇接收點 (Gateway)"
                value={selectedGateway?.id || ''}
                onChange={(e) => {
                  const gateway = gateways.find((g) => g.id === e.target.value);
                  setSelectedGateway(gateway || null);
                }}
                disabled={!selectedTenant || gateways.length === 0}
                fullWidth
                helperText={gateways.length === 0 && selectedTenant ? '此社區尚無接收點，請先在接收點管理新增' : ''}
              >
                <MenuItem value="">請選擇接收點...</MenuItem>
                {gateways.map((gateway) => (
                  <MenuItem key={gateway.id} value={gateway.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{gateway.gatewayNumber} - {gateway.location}</span>
                      {gateway.isBoundary && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AlertCircle size={14} color="#d32f2f" />
                          <span style={{ color: '#d32f2f', fontSize: '0.875rem' }}>邊界點</span>
                        </Box>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="number"
                label="RSSI 訊號強度 (dBm)"
                value={rssi}
                onChange={(e) => setRssi(Number(e.target.value))}
                inputProps={{ min: -100, max: 0 }}
                helperText="範圍：-100 ~ 0"
                fullWidth
              />

              <TextField
                type="number"
                label="電池電量 (%)"
                value={batteryLevel}
                onChange={(e) => setBatteryLevel(Number(e.target.value))}
                inputProps={{ min: 0, max: 100 }}
                helperText="範圍：0 ~ 100"
                fullWidth
              />

              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleSendSignal}
                disabled={!selectedTenant || !selectedElder || !selectedGateway || isSending}
                fullWidth
              >
                {isSending ? '發送中...' : '發送訊號'}
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
              {/* Current Selection */}
              {(selectedTenant || selectedElder || selectedGateway) && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                    當前選擇：
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {selectedTenant && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>社區：</strong> {selectedTenant.name}
                      </Typography>
                    )}
                    {selectedElder && (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          <strong>長者：</strong> {selectedElder.name}
                          {selectedElder.age && ` (${selectedElder.age}歲)`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>MAC Address：</strong> {selectedElder.macAddress}
                        </Typography>
                      </>
                    )}
                    {selectedGateway && (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          <strong>接收點：</strong> {selectedGateway.location} ({selectedGateway.gatewayNumber})
                        </Typography>
                        {selectedGateway.isBoundary && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <AlertCircle size={16} color="#ed6c02" />
                            <Typography variant="body2" color="warning.main">
                              此為邊界點，長輩經過會發送 LINE 通知
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                </Paper>
              )}

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
                  <Box display="flex" flexDirection="column" gap={1} mt={1} maxHeight={400} overflow="auto">
                    {history.map((item) => (
                      <Alert key={item.id} severity={item.success ? 'success' : 'error'} sx={{ py: 0.5 }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {item.success ? (
                            <CheckCircle size={14} color="#2e7d32" />
                          ) : (
                            <XCircle size={14} color="#d32f2f" />
                          )}
                          <Typography variant="caption" fontWeight={600}>
                            {item.elderName} - {item.signalType}
                          </Typography>
                        </Box>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {new Date(item.timestamp).toLocaleString('zh-TW')}
                        </Typography>
                        {item.gatewayLocation && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <MapPin size={12} color="#757575" />
                            <Typography variant="caption" color="text.secondary">
                              {item.gatewayLocation}
                            </Typography>
                          </Box>
                        )}
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
