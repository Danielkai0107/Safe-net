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
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Modal } from '../../components/Modal';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { Gateway, CreateGatewayRequest } from '../../types';

export const GatewayManagement: React.FC = () => {
  const navigate = useNavigate();
  const { tenants, fetchTenants, isLoading } = useAppStore();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loadingGateways, setLoadingGateways] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('');
  const [formData, setFormData] = useState<Partial<CreateGatewayRequest>>({
    tenantId: '',
    serialNumber: '',
    location: '',
    address: '',
    isBoundary: false,
    notes: '',
  });

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoadingGateways(true);
    try {
      const gatewaysRef = collection(db, 'gateways');
      const q = query(gatewaysRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const gatewaysData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Gateway[];

      setGateways(gatewaysData);
    } catch (error: any) {
      console.error('Failed to fetch gateways:', error);
      alert('獲取接收點列表失敗：' + error.message);
    } finally {
      setLoadingGateways(false);
    }
  };

  const filteredGateways = selectedTenantFilter
    ? gateways.filter((g) => g.tenantId === selectedTenantFilter)
    : gateways;

  const generateGatewayNumber = (tenantId: string, existingGateways: Gateway[]) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return '';
    
    // 取社區名稱的前3個字作為代碼
    const tenantCode = tenant.name.substring(0, 3);
    
    // 計算該社區已有的接收點數量
    const tenantGateways = existingGateways.filter(g => g.tenantId === tenantId);
    const nextNumber = tenantGateways.length + 1;
    
    // 格式化為 001, 002, ...
    const numberStr = nextNumber.toString().padStart(3, '0');
    
    return `${tenantCode}${numberStr}`;
  };

  const handleOpenModal = (gateway?: Gateway) => {
    if (gateway) {
      setEditingGateway(gateway);
      setFormData({
        tenantId: gateway.tenantId,
        serialNumber: gateway.serialNumber,
        location: gateway.location,
        address: gateway.address,
        isBoundary: gateway.isBoundary,
        notes: gateway.notes,
      });
    } else {
      setEditingGateway(null);
      setFormData({
        tenantId: selectedTenantFilter || '',
        serialNumber: '',
        location: '',
        address: '',
        isBoundary: false,
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGateway(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.tenantId || !formData.serialNumber || !formData.location) {
        alert('請填寫必填欄位');
        return;
      }

      const now = new Date().toISOString();

      if (editingGateway) {
        await updateDoc(doc(db, 'gateways', editingGateway.id), {
          serialNumber: formData.serialNumber,
          location: formData.location,
          address: formData.address || '',
          isBoundary: formData.isBoundary,
          notes: formData.notes || '',
          updatedAt: now,
        });
        alert('更新成功！');
      } else {
        // 生成接收點編號
        const gatewayNumber = generateGatewayNumber(formData.tenantId, gateways);
        
        await addDoc(collection(db, 'gateways'), {
          tenantId: formData.tenantId,
          gatewayNumber,
          serialNumber: formData.serialNumber,
          location: formData.location,
          address: formData.address || '',
          isBoundary: formData.isBoundary ?? false,
          status: 'active',
          notes: formData.notes || '',
          createdAt: now,
          updatedAt: now,
        });
        alert('建立成功！');
      }

      fetchGateways();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error:', error);
      alert('操作失敗：' + error.message);
    }
  };

  const handleToggleStatus = async (gateway: Gateway) => {
    const newStatus = gateway.status === 'inactive' ? 'active' : 'inactive';
    const action = newStatus === 'inactive' ? '停用' : '啟用';

    if (!confirm(`確定要${action}接收點「${gateway.location}」嗎？`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'gateways', gateway.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      alert(`${action}成功！`);
      fetchGateways();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`${action}失敗：` + error.message);
    }
  };

  // Maintenance function (currently unused, kept for future use)
  // const handleSetMaintenance = async (gateway: Gateway) => {
  //   const newStatus = gateway.status === 'maintenance' ? 'active' : 'maintenance';
  //   const action = newStatus === 'maintenance' ? '設為維護中' : '恢復運作';

  //   if (!confirm(`確定要${action}接收點「${gateway.location}」嗎？`)) {
  //     return;
  //   }

  //   try {
  //     await updateDoc(doc(db, 'gateways', gateway.id), {
  //       status: newStatus,
  //       updatedAt: new Date().toISOString(),
  //     });
  //     alert(`${action}成功！`);
  //     fetchGateways();
  //   } catch (error: any) {
  //     console.error('Error:', error);
  //     alert(`${action}失敗：` + error.message);
  //   }
  // };

  const handleDelete = async (gateway: Gateway) => {
    if (!confirm(`確定要永久刪除接收點「${gateway.location}」嗎？此操作無法復原。`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'gateways', gateway.id), {
        status: 'inactive',
        updatedAt: new Date().toISOString(),
      });
      alert('刪除成功！');
      fetchGateways();
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
      active: '運作中',
      inactive: '停用',
      maintenance: '維護中',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      active: 'success',
      inactive: 'default',
      maintenance: 'warning',
    };
    return colorMap[status as keyof typeof colorMap] || 'default';
  };

  const columns = [
    {
      key: 'gatewayNumber',
      header: '接收點編號',
      render: (gateway: Gateway) => (
        <Typography variant="body2" fontWeight={500}>
          {gateway.gatewayNumber}
        </Typography>
      ),
    },
    {
      key: 'tenant',
      header: '所屬社區',
      render: (gateway: Gateway) => (
        <Typography variant="body2">{getTenantName(gateway.tenantId)}</Typography>
      ),
    },
    {
      key: 'location',
      header: '地點',
      render: (gateway: Gateway) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {gateway.location}
          </Typography>
          {gateway.address && (
            <Typography variant="caption" color="text.secondary">
              {gateway.address}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'serialNumber',
      header: '接收裝置序號',
      render: (gateway: Gateway) => (
        <Typography variant="body2" fontFamily="monospace" fontSize="0.875rem">
          {gateway.serialNumber}
        </Typography>
      ),
    },
    {
      key: 'isBoundary',
      header: '類型',
      render: (gateway: Gateway) => (
        <Chip
          label={gateway.isBoundary ? '邊界點' : '一般接收點'}
          color={gateway.isBoundary ? 'warning' : 'default'}
          size="small"
          icon={gateway.isBoundary ? <LocationOnIcon /> : undefined}
        />
      ),
    },
    {
      key: 'status',
      header: '狀態',
      render: (gateway: Gateway) => (
        <Chip
          label={getStatusLabel(gateway.status)}
          color={getStatusColor(gateway.status) as any}
          size="small"
        />
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (gateway: Gateway) => (
        <Box display="flex" gap={1}>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => handleOpenModal(gateway)}
            title="編輯"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color={gateway.status === 'inactive' ? 'success' : 'warning'}
            onClick={() => handleToggleStatus(gateway)}
            title={gateway.status === 'inactive' ? '啟用' : '停用'}
          >
            {gateway.status === 'inactive' ? (
              <CheckCircleIcon fontSize="small" />
            ) : (
              <BlockIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => handleDelete(gateway)}
            disabled={gateway.status === 'inactive'}
            title="刪除"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (isLoading || loadingGateways) {
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
              接收點管理
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
              新增接收點
            </Button>
          </Box>
        </Box>

        <Table data={filteredGateways} columns={columns} emptyMessage="暫無接收點資料" />

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingGateway ? '編輯接收點' : '新增接收點'}
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
              disabled={!!editingGateway}
              helperText={editingGateway ? '所屬社區不可修改' : '接收點編號將自動生成為：社區名稱前3字+001'}
            >
              <MenuItem value="">請選擇社區</MenuItem>
              {tenants.map((tenant) => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </MenuItem>
              ))}
            </TextField>

            {formData.tenantId && !editingGateway && (
              <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                <Typography variant="body2" color="info.main">
                  📋 預覽接收點編號：{generateGatewayNumber(formData.tenantId, gateways)}
                </Typography>
              </Box>
            )}

            <TextField
              label="接收裝置序號"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value.toUpperCase() })}
              placeholder="SIM-001"
              required
              fullWidth
            />

            <TextField
              label="地點名稱"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="例如：社區大門、後門、活動中心"
              required
              fullWidth
            />

            <TextField
              label="詳細地址（選填）"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="例如：台北市大安區信義路..."
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isBoundary ?? false}
                  onChange={(e) => setFormData({ ...formData, isBoundary: e.target.checked })}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    設為邊界點
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    長輩經過邊界點時會立即發送 LINE 通知
                  </Typography>
                </Box>
              }
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
                {editingGateway ? '更新' : '建立'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Container>
    </Box>
  );
};
