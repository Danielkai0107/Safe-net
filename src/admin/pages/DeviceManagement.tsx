import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAppStore } from '../../store/store';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
// import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import Battery20Icon from '@mui/icons-material/Battery20';
import Battery50Icon from '@mui/icons-material/Battery50';
import Battery80Icon from '@mui/icons-material/Battery80';
import { FileText } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { Device, CreateDeviceRequest } from '../../types';

export const DeviceManagement: React.FC = () => {
  const navigate = useNavigate();
  const { tenants, fetchTenants, isLoading } = useAppStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('');
  const [formData, setFormData] = useState<Partial<CreateDeviceRequest>>({
    tenantId: '',
    macAddress: '',
    notes: '',
  });

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const devicesRef = collection(db, 'devices');
      const q = query(devicesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const devicesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Device[];

      setDevices(devicesData);
    } catch (error: any) {
      console.error('Failed to fetch devices:', error);
      alert('獲取裝置列表失敗：' + error.message);
    } finally {
      setLoadingDevices(false);
    }
  };

  const filteredDevices = selectedTenantFilter
    ? devices.filter((d) => d.tenantId === selectedTenantFilter)
    : devices;

  const generateDeviceNumber = (tenantId: string, existingDevices: Device[]) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return '';
    
    // 取社區名稱的前3個字作為代碼
    const tenantCode = tenant.name.substring(0, 3);
    
    // 計算該社區已有的裝置數量
    const tenantDevices = existingDevices.filter(d => d.tenantId === tenantId);
    const nextNumber = tenantDevices.length + 1;
    
    // 格式化為 001, 002, ...
    const numberStr = nextNumber.toString().padStart(3, '0');
    
    return `${tenantCode}${numberStr}`;
  };

  const handleOpenModal = (device?: Device) => {
    if (device) {
      setEditingDevice(device);
      setFormData({
        tenantId: device.tenantId,
        macAddress: device.macAddress,
        notes: device.notes,
      });
    } else {
      setEditingDevice(null);
      setFormData({
        tenantId: selectedTenantFilter || '',
        macAddress: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.tenantId || !formData.macAddress) {
        alert('請填寫必填欄位');
        return;
      }

      const now = new Date().toISOString();

      if (editingDevice) {
        await updateDoc(doc(db, 'devices', editingDevice.id), {
          macAddress: formData.macAddress,
          notes: formData.notes || '',
          updatedAt: now,
        });
        alert('更新成功！');
      } else {
        // 生成裝置編號
        const deviceNumber = generateDeviceNumber(formData.tenantId, devices);
        
        await addDoc(collection(db, 'devices'), {
          tenantId: formData.tenantId,
          macAddress: formData.macAddress,
          deviceNumber,
          status: 'available',
          notes: formData.notes || '',
          createdAt: now,
          updatedAt: now,
        });
        alert('建立成功！');
      }

      fetchDevices();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error:', error);
      alert('操作失敗：' + error.message);
    }
  };

  const handleToggleStatus = async (device: Device) => {
    if (device.status === 'assigned') {
      alert('此裝置已配發給長者，無法停用。請先解除配發。');
      return;
    }

    const newStatus = device.status === 'maintenance' ? 'available' : 'maintenance';
    const action = newStatus === 'maintenance' ? '停用' : '啟用';

    if (!confirm(`確定要${action}裝置「${device.deviceNumber}」嗎？`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'devices', device.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      alert(`${action}成功！`);
      fetchDevices();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`${action}失敗：` + error.message);
    }
  };

  const handleDelete = async (device: Device) => {
    if (device.status === 'assigned') {
      alert('此裝置已配發給長者，無法刪除。請先解除配發。');
      return;
    }

    if (!confirm(`確定要刪除裝置「${device.deviceNumber}」嗎？此操作將標記為已退役。`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'devices', device.id), {
        status: 'retired',
        updatedAt: new Date().toISOString(),
      });
      alert('刪除成功！');
      fetchDevices();
    } catch (error: any) {
      console.error('Error:', error);
      alert('刪除失敗：' + error.message);
    }
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant?.name || tenantId;
  };

  const getStatusLabel = (status: string) => {
    const statusMap = {
      available: '可用',
      assigned: '已配發',
      maintenance: '維護中',
      retired: '已退役',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      available: 'success',
      assigned: 'primary',
      maintenance: 'warning',
      retired: 'default',
    };
    return colorMap[status as keyof typeof colorMap] || 'default';
  };

  const columns = [
    {
      key: 'deviceNumber',
      header: '裝置編號',
      render: (device: Device) => (
        <Typography variant="body2" fontWeight={500}>
          {device.deviceNumber}
        </Typography>
      ),
    },
    {
      key: 'tenant',
      header: '所屬社區',
      render: (device: Device) => (
        <Typography variant="body2">{getTenantName(device.tenantId)}</Typography>
      ),
    },
    {
      key: 'macAddress',
      header: 'MAC Address',
      render: (device: Device) => (
        <Typography variant="body2" fontFamily="monospace" fontSize="0.875rem">
          {device.macAddress}
        </Typography>
      ),
    },
    {
      key: 'status',
      header: '狀態',
      render: (device: Device) => (
        <Chip
          label={getStatusLabel(device.status)}
          color={getStatusColor(device.status) as any}
          size="small"
        />
      ),
    },
    {
      key: 'battery',
      header: '電量',
      render: (device: Device) => {
        if (device.lastBatteryLevel === undefined) {
          return (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          );
        }

        const batteryLevel = device.lastBatteryLevel;
        let icon;
        let color: 'success' | 'warning' | 'error' | 'default' = 'default';
        
        if (batteryLevel >= 80) {
          icon = <BatteryFullIcon />;
          color = 'success';
        } else if (batteryLevel >= 50) {
          icon = <Battery80Icon />;
          color = 'success';
        } else if (batteryLevel >= 20) {
          icon = <Battery50Icon />;
          color = 'warning';
        } else if (batteryLevel >= 5) {
          icon = <Battery20Icon />;
          color = 'warning';
        } else {
          icon = <BatteryAlertIcon />;
          color = 'error';
        }

        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Box color={`${color}.main`} display="flex" alignItems="center">
              {icon}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {batteryLevel}%
              </Typography>
              {device.lastBatteryUpdate && (
                <Typography variant="caption" color="text.secondary">
                  {new Date(device.lastBatteryUpdate).toLocaleString('zh-TW', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      key: 'assignedElderName',
      header: '配發對象',
      render: (device: Device) => (
        <Typography variant="body2">
          {device.assignedElderName || '-'}
        </Typography>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (device: Device) => (
        <Box display="flex" gap={1}>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => handleOpenModal(device)}
            title="編輯"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          {device.status !== 'retired' && (
            <IconButton 
              size="small" 
              color={device.status === 'maintenance' ? 'success' : 'warning'}
              onClick={() => handleToggleStatus(device)}
              disabled={device.status === 'assigned'}
              title={device.status === 'maintenance' ? '啟用' : '停用'}
            >
              {device.status === 'maintenance' ? (
                <CheckCircleIcon fontSize="small" />
              ) : (
                <BlockIcon fontSize="small" />
              )}
            </IconButton>
          )}
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => handleDelete(device)}
            disabled={device.status === 'assigned' || device.status === 'retired'}
            title="刪除（退役）"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (isLoading || loadingDevices) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/admin')} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={600}>
              訊號裝置管理
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <TextField
              select
              value={selectedTenantFilter}
              onChange={(e) => setSelectedTenantFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">全部社區</MenuItem>
              {tenants.map((tenant) => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
            >
              新增裝置
            </Button>
          </Box>
        </Box>

        <Table data={filteredDevices} columns={columns} emptyMessage="暫無裝置資料" />

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingDevice ? '編輯裝置' : '新增裝置'}
          size="md"
        >
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="所屬社區"
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              required
              fullWidth
              disabled={!!editingDevice}
              helperText={editingDevice ? '所屬社區不可修改' : '裝置編號將自動生成為：社區名稱前3字+001'}
            >
              <MenuItem value="">請選擇社區</MenuItem>
              {tenants.map((tenant) => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </MenuItem>
              ))}
            </TextField>

            {formData.tenantId && !editingDevice && (
              <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileText size={16} color="#0288d1" />
                <Typography variant="body2" color="info.main">
                  預覽裝置編號：{generateDeviceNumber(formData.tenantId, devices)}
                </Typography>
              </Box>
            )}

            <TextField
              label="MAC Address (格式：AA:BB:CC:DD:EE:FF)"
              value={formData.macAddress}
              onChange={(e) => setFormData({ ...formData, macAddress: e.target.value.toUpperCase() })}
              placeholder="AA:BB:CC:DD:EE:FF"
              inputProps={{ pattern: '([0-9A-Fa-f]{2}[:\\-]){5}([0-9A-Fa-f]{2})' }}
              required
              fullWidth
            />

            <TextField
              label="備註"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Button variant="outlined" onClick={handleCloseModal}>
                取消
              </Button>
              <Button type="submit" variant="contained">
                {editingDevice ? '更新' : '建立'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Container>
    </Box>
  );
};
