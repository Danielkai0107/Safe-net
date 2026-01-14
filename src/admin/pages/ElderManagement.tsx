import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAppStore } from '../../store/store';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Modal } from '../../components/Modal';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import type { Elder, CreateElderRequest, Device } from '../../types';

export const ElderManagement: React.FC = () => {
  const navigate = useNavigate();
  const { tenants, elders, fetchTenants, fetchElders, isLoading } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingElder, setEditingElder] = useState<Elder | null>(null);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('');
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateElderRequest>>({
    tenantId: '',
    name: '',
    age: undefined,
    gender: undefined,
    address: '',
    contactPhone: '',
    emergencyContact: '',
    emergencyPhone: '',
    macAddress: '',
    deviceId: '',
    notes: '',
  });

  useEffect(() => {
    fetchTenants();
    fetchElders();
  }, [fetchTenants, fetchElders]);

  // 當選擇社區時，獲取該社區的可用裝置
  useEffect(() => {
    if (formData.tenantId) {
      fetchAvailableDevices(formData.tenantId);
    } else {
      setAvailableDevices([]);
    }
  }, [formData.tenantId]);

  const fetchAvailableDevices = async (tenantId: string) => {
    setLoadingDevices(true);
    try {
      const devicesRef = collection(db, 'devices');
      const q = query(
        devicesRef,
        where('tenantId', '==', tenantId),
        where('status', 'in', ['available', 'assigned'])
      );
      const snapshot = await getDocs(q);
      
      const devices = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Device[];

      setAvailableDevices(devices);
    } catch (error: any) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const filteredElders = selectedTenantFilter
    ? elders.filter((e) => e.tenantId === selectedTenantFilter)
    : elders;

  const handleOpenModal = (elder?: Elder) => {
    if (elder) {
      setEditingElder(elder);
      setFormData({
        tenantId: elder.tenantId,
        name: elder.name,
        age: elder.age,
        gender: elder.gender,
        address: elder.address,
        contactPhone: elder.contactPhone,
        emergencyContact: elder.emergencyContact,
        emergencyPhone: elder.emergencyPhone,
        macAddress: elder.macAddress,
        deviceId: (elder as any).deviceId || '',
        notes: elder.notes,
      });
    } else {
      setEditingElder(null);
      setFormData({
        tenantId: selectedTenantFilter || '',
        name: '',
        age: undefined,
        gender: undefined,
        address: '',
        contactPhone: '',
        emergencyContact: '',
        emergencyPhone: '',
        macAddress: '',
        deviceId: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingElder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.name || !formData.tenantId) {
        alert('請填寫必填欄位');
        return;
      }

      // 如果選擇了裝置，則使用裝置的 MAC Address
      let macAddress = formData.macAddress;
      let deviceId = formData.deviceId;

      if (deviceId) {
        const selectedDevice = availableDevices.find(d => d.id === deviceId);
        if (selectedDevice) {
          macAddress = selectedDevice.macAddress;
        }
      }

      if (!macAddress) {
        alert('請選擇裝置或輸入 MAC Address');
        return;
      }

      const now = new Date().toISOString();

      // 清理 undefined 值
      const cleanedData = Object.entries({
        ...formData,
        macAddress,
        deviceId,
      }).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      if (editingElder) {
        // 如果改變了裝置配發，需要更新裝置狀態
        const oldDeviceId = (editingElder as any).deviceId;
        
        await updateDoc(doc(db, 'elders', editingElder.id), {
          ...cleanedData,
          updatedAt: now,
        });

        // 更新裝置狀態
        if (deviceId && deviceId !== oldDeviceId) {
          const device = availableDevices.find(d => d.id === deviceId);
          if (device) {
            await updateDoc(doc(db, 'devices', deviceId), {
              status: 'assigned',
              assignedElderId: editingElder.id,
              assignedElderName: formData.name,
              updatedAt: now,
            });
          }
        }

        // 如果取消了裝置配發
        if (oldDeviceId && oldDeviceId !== deviceId) {
          await updateDoc(doc(db, 'devices', oldDeviceId), {
            status: 'available',
            assignedElderId: null,
            assignedElderName: null,
            updatedAt: now,
          });
        }

        alert('更新成功！');
      } else {
        const elderRef = await addDoc(collection(db, 'elders'), {
          ...cleanedData,
          status: 'inactive',
          lastSeen: now,
          createdAt: now,
          updatedAt: now,
        });

        // 更新裝置狀態為已配發
        if (deviceId) {
          await updateDoc(doc(db, 'devices', deviceId), {
            status: 'assigned',
            assignedElderId: elderRef.id,
            assignedElderName: formData.name,
            updatedAt: now,
          });
        }

        alert('建立成功！');
      }

      fetchElders();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error:', error);
      alert('操作失敗：' + error.message);
    }
  };

  const handleDelete = async (elder: Elder) => {
    if (!confirm(`確定要刪除長者「${elder.name}」嗎？`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'elders', elder.id), {
        status: 'inactive',
        updatedAt: new Date().toISOString(),
      });
      alert('刪除成功！');
      fetchElders();
    } catch (error: any) {
      console.error('Error:', error);
      alert('刪除失敗：' + error.message);
    }
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant?.name || tenantId;
  };

  const columns = [
    {
      key: 'name',
      header: '姓名',
      render: (elder: Elder) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {elder.name}
          </Typography>
          {elder.age && (
            <Typography variant="caption" color="text.secondary">
              {elder.age} 歲
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'tenant',
      header: '所屬社區',
      render: (elder: Elder) => (
        <Typography variant="body2">{getTenantName(elder.tenantId)}</Typography>
      ),
    },
    {
      key: 'macAddress',
      header: 'MAC Address',
      render: (elder: Elder) => (
        <Typography variant="body2" fontFamily="monospace" fontSize="0.875rem">
          {elder.macAddress}
        </Typography>
      ),
    },
    {
      key: 'status',
      header: '狀態',
      render: (elder: Elder) => <StatusBadge status={elder.status} lastSeen={elder.lastSeen} />,
    },
    {
      key: 'lastSeen',
      header: '最後出現',
      render: (elder: Elder) => (
        <Typography variant="body2">
          {new Date(elder.lastSeen).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
        </Typography>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (elder: Elder) => (
        <Box display="flex" gap={1}>
          <IconButton size="small" color="primary" onClick={() => handleOpenModal(elder)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(elder)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (isLoading) {
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
              長者管理
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
              新增長者
            </Button>
          </Box>
        </Box>

        <Table data={filteredElders} columns={columns} emptyMessage="暫無長者資料" />

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingElder ? '編輯長者' : '新增長者'}
          size="lg"
        >
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="所屬社區"
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              required
              fullWidth
            >
              <MenuItem value="">請選擇社區</MenuItem>
              {tenants.map((tenant) => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <TextField
                  type="number"
                  label="年齡"
                  value={formData.age || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value ? Number(e.target.value) : undefined })
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <TextField
                  select
                  label="性別"
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                  fullWidth
                >
                  <MenuItem value="">請選擇</MenuItem>
                  <MenuItem value="male">男</MenuItem>
                  <MenuItem value="female">女</MenuItem>
                  <MenuItem value="other">其他</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              select
              label="選擇裝置（推薦）"
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              fullWidth
              disabled={!formData.tenantId || loadingDevices}
              helperText={
                !formData.tenantId 
                  ? '請先選擇所屬社區' 
                  : loadingDevices 
                  ? '載入裝置中...' 
                  : availableDevices.length === 0
                  ? '此社區暫無可用裝置，請先在裝置管理新增'
                  : '從此社區配發的裝置中選擇'
              }
            >
              <MenuItem value="">不選擇（手動輸入MAC）</MenuItem>
              {availableDevices
                .filter(d => d.status === 'available' || (editingElder && d.assignedElderId === editingElder.id))
                .map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.deviceNumber} - {device.macAddress}
                    {device.status === 'assigned' && device.assignedElderId === editingElder?.id && ' (目前使用)'}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              label="或手動輸入 MAC Address (格式：AA:BB:CC:DD:EE:FF)"
              value={formData.macAddress}
              onChange={(e) => setFormData({ ...formData, macAddress: e.target.value.toUpperCase(), deviceId: '' })}
              placeholder="AA:BB:CC:DD:EE:FF"
              inputProps={{ pattern: '([0-9A-Fa-f]{2}[:\\-]){5}([0-9A-Fa-f]{2})' }}
              fullWidth
              disabled={!!formData.deviceId}
              helperText={formData.deviceId ? '已選擇裝置，無需手動輸入' : '如果不從上方選擇裝置，請手動輸入'}
            />

            <TextField
              label="居住地址"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="聯絡電話"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="緊急聯絡人"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>

            <TextField
              label="緊急聯絡人電話"
              value={formData.emergencyPhone}
              onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
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
                {editingElder ? '更新' : '建立'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Container>
    </Box>
  );
};
