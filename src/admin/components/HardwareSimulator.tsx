import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
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
    <div className="card card--elevated">
      <div className="card__content">
        <div className="flex flex--align-center gap-2 mb-4">
          <Wrench size={24} color="#1976d2" />
          <h2 className="h5">硬體訊號模擬器</h2>
        </div>

        <div className="grid grid--cols-2 grid--gap-6 mt-6">
          {/* Left Column: Form */}
          <div className="grid__col">
            <div className="flex flex-column gap-4">
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
                  <div className="flex flex--align-center gap-2">
                    <Radio size={16} />
                    <span>一般訊號</span>
                  </div>
                </MenuItem>
                <MenuItem value="emergency">
                  <div className="flex flex--align-center gap-2">
                    <AlertCircle size={16} color="#d32f2f" />
                    <span>緊急求救</span>
                  </div>
                </MenuItem>
                <MenuItem value="health">
                  <div className="flex flex--align-center gap-2">
                    <Heart size={16} color="#d32f2f" />
                    <span>健康數據</span>
                  </div>
                </MenuItem>
                <MenuItem value="other">
                  <div className="flex flex--align-center gap-2">
                    <FileText size={16} />
                    <span>其他訊號</span>
                  </div>
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
                    <div className="flex flex--align-center gap-2">
                      <span>{gateway.gatewayNumber} - {gateway.location}</span>
                      {gateway.isBoundary && (
                        <div className="flex flex--align-center gap-1">
                          <AlertCircle size={14} color="#d32f2f" />
                          <span className="text-caption text-error">邊界點</span>
                        </div>
                      )}
                    </div>
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
                <div className={`alert alert--${responseMessage.type}`}>
                  {responseMessage.text}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Info & History */}
          <div className="grid__col">
            <div className="flex flex-column gap-4">
              {/* Current Selection */}
              {(selectedTenant || selectedElder || selectedGateway) && (
                <div className="paper paper--bordered p-4">
                  <h3 className="h6 mb-3">當前選擇：</h3>
                  <div className="flex flex-column gap-2">
                    {selectedTenant && (
                      <p className="text-body-2 text-secondary">
                        <strong>社區：</strong> {selectedTenant.name}
                      </p>
                    )}
                    {selectedElder && (
                      <>
                        <p className="text-body-2 text-secondary">
                          <strong>長者：</strong> {selectedElder.name}
                          {selectedElder.age && ` (${selectedElder.age}歲)`}
                        </p>
                        <p className="text-body-2 text-secondary">
                          <strong>MAC Address：</strong> {selectedElder.macAddress}
                        </p>
                      </>
                    )}
                    {selectedGateway && (
                      <>
                        <p className="text-body-2 text-secondary">
                          <strong>接收點：</strong> {selectedGateway.location} ({selectedGateway.gatewayNumber})
                        </p>
                        {selectedGateway.isBoundary && (
                          <div className="flex flex--align-center gap-1">
                            <AlertCircle size={16} color="#ed6c02" />
                            <p className="text-body-2 text-warning">
                              此為邊界點，長輩經過會發送 LINE 通知
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* History */}
              <div className="paper paper--bordered p-4">
                <h3 className="h6 mb-3">歷史發送紀錄 (最近 10 次)</h3>
                {history.length === 0 ? (
                  <p className="text-body-2 text-secondary">暫無紀錄</p>
                ) : (
                  <div className="flex flex-column gap-2 mt-2" style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {history.map((item) => (
                      <div key={item.id} className={`alert alert--${item.success ? 'success' : 'error'}`}>
                        <div className="flex flex--align-center gap-1">
                          {item.success ? (
                            <CheckCircle size={14} color="#2e7d32" />
                          ) : (
                            <XCircle size={14} color="#d32f2f" />
                          )}
                          <span className="text-caption font-weight-600">
                            {item.elderName} - {item.signalType}
                          </span>
                        </div>
                        <p className="text-caption text-secondary mt-1">
                          {new Date(item.timestamp).toLocaleString('zh-TW')}
                        </p>
                        {item.gatewayLocation && (
                          <div className="flex flex--align-center gap-1 mt-1">
                            <MapPin size={12} color="#757575" />
                            <span className="text-caption text-secondary">
                              {item.gatewayLocation}
                            </span>
                          </div>
                        )}
                        <p className="text-caption mt-1">
                          {item.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
