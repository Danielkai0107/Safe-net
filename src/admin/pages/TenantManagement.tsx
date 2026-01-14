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
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { 
  AlertTriangle, 
  Lock, 
  Megaphone, 
  User, 
  Smartphone,
  Info
} from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { Tenant, CreateTenantRequest, LineUser } from '../../types';

export const TenantManagement: React.FC = () => {
  const navigate = useNavigate();
  const { tenants, fetchTenants, isLoading } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiffLinkModalOpen, setIsLiffLinkModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [selectedTenantForLink, setSelectedTenantForLink] = useState<Tenant | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [lineUsers, setLineUsers] = useState<LineUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [adminLineUsers, setAdminLineUsers] = useState<Map<string, LineUser>>(new Map());
  const [formData, setFormData] = useState<Partial<CreateTenantRequest>>({
    name: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    lineConfig: {
      channelAccessToken: '',
      channelSecret: '',
      liffId: '',
    },
    adminLineIds: [],
  });
  const [adminLineIdInput, setAdminLineIdInput] = useState('');

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleOpenModal = async (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        address: tenant.address,
        contactPerson: tenant.contactPerson,
        contactPhone: tenant.contactPhone,
        lineConfig: tenant.lineConfig,
        adminLineIds: tenant.adminLineIds,
      });
      
      // 獲取管理員的詳細資訊
      if (tenant.adminLineIds && tenant.adminLineIds.length > 0) {
        try {
          const usersRef = collection(db, 'lineUsers');
          const q = query(usersRef, where('tenantId', '==', tenant.id));
          const snapshot = await getDocs(q);
          
          const usersMap = new Map<string, LineUser>();
          snapshot.docs.forEach(doc => {
            const userData = { ...doc.data(), id: doc.id } as LineUser;
            usersMap.set(userData.id, userData);
          });
          
          setAdminLineUsers(usersMap);
        } catch (error) {
          console.error('Failed to fetch admin users:', error);
        }
      }
    } else {
      setEditingTenant(null);
      setAdminLineUsers(new Map());
      setFormData({
        name: '',
        address: '',
        contactPerson: '',
        contactPhone: '',
        lineConfig: {
          channelAccessToken: '',
          channelSecret: '',
          liffId: '',
        },
        adminLineIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTenant(null);
    setAdminLineIdInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.name || !formData.lineConfig) {
        alert('請填寫必填欄位');
        return;
      }

      const now = new Date().toISOString();

      if (editingTenant) {
        await updateDoc(doc(db, 'tenants', editingTenant.id), {
          ...formData,
          updatedAt: now,
        });
        alert('更新成功！');
      } else {
        await addDoc(collection(db, 'tenants'), {
          ...formData,
          subscription: {
            plan: 'basic',
            startDate: now,
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
          },
          settings: {
            alertThresholdHours: 12,
            enableEmergencyAlert: true,
            enableInactivityAlert: true,
          },
          createdAt: now,
          updatedAt: now,
        });
        alert('建立成功！');
      }

      fetchTenants();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error:', error);
      alert('操作失敗：' + error.message);
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    if (!confirm(`確定要刪除社區「${tenant.name}」嗎？`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'tenants', tenant.id), {
        'subscription.status': 'expired',
        updatedAt: new Date().toISOString(),
      });
      alert('刪除成功！');
      fetchTenants();
    } catch (error: any) {
      console.error('Error:', error);
      alert('刪除失敗：' + error.message);
    }
  };

  const handleAddAdminLineId = () => {
    if (!adminLineIdInput.trim()) return;
    setFormData({
      ...formData,
      adminLineIds: [...(formData.adminLineIds || []), adminLineIdInput.trim()],
    });
    setAdminLineIdInput('');
  };

  const handleRemoveAdminLineId = (index: number) => {
    setFormData({
      ...formData,
      adminLineIds: formData.adminLineIds?.filter((_, i) => i !== index) || [],
    });
  };

  const handleShowLiffLink = (tenant: Tenant) => {
    setSelectedTenantForLink(tenant);
    setIsLiffLinkModalOpen(true);
  };

  const getLiffUrl = (tenant: Tenant) => {
    if (!tenant.lineConfig?.liffId) return '';
    return `https://liff.line.me/${tenant.lineConfig.liffId}`;
  };

  const handleCopyLiffLink = async (tenant: Tenant) => {
    const url = getLiffUrl(tenant);
    if (!url) {
      alert('此社區尚未設定 LIFF ID');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('連結已複製到剪貼簿！');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('複製失敗，請手動複製');
    }
  };

  const handleShowUsers = async (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsUsersModalOpen(true);
    setLoadingUsers(true);

    try {
      const usersRef = collection(db, 'lineUsers');
      const q = query(usersRef, where('tenantId', '==', tenant.id));
      const snapshot = await getDocs(q);
      
      const users = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as LineUser[];

      setLineUsers(users);
    } catch (error: any) {
      console.error('Failed to fetch LINE users:', error);
      alert('獲取用戶列表失敗：' + error.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (!editingTenant) return;

    try {
      const updatedAdminIds = isCurrentlyAdmin
        ? editingTenant.adminLineIds.filter(id => id !== userId)
        : [...editingTenant.adminLineIds, userId];

      await updateDoc(doc(db, 'tenants', editingTenant.id), {
        adminLineIds: updatedAdminIds,
        updatedAt: new Date().toISOString(),
      });

      setEditingTenant({
        ...editingTenant,
        adminLineIds: updatedAdminIds,
      });

      fetchTenants();
    } catch (error: any) {
      console.error('Failed to update admin:', error);
      alert('更新管理員失敗：' + error.message);
    }
  };

  const columns = [
    {
      key: 'name',
      header: '社區名稱',
      render: (tenant: Tenant) => (
        <Typography variant="body2" fontWeight={500}>
          {tenant.name}
        </Typography>
      ),
    },
    {
      key: 'contactPerson',
      header: '聯絡人',
      render: (tenant: Tenant) => (
        <Typography variant="body2">{tenant.contactPerson || '-'}</Typography>
      ),
    },
    {
      key: 'status',
      header: '訂閱狀態',
      render: (tenant: Tenant) => (
        <Chip
          label={tenant.subscription.status === 'active' ? '啟用' : '停用'}
          color={tenant.subscription.status === 'active' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      key: 'adminCount',
      header: '管理權限',
      render: (tenant: Tenant) => (
        <Typography variant="body2">
          {tenant.adminLineIds && tenant.adminLineIds.length > 0
            ? `${tenant.adminLineIds.length} 位管理員`
            : '所有 OA 用戶'}
        </Typography>
      ),
    },
    {
      key: 'liffLink',
      header: 'LINE LIFF',
      render: (tenant: Tenant) => (
        <Box display="flex" gap={1}>
          {tenant.lineConfig?.liffId ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={() => handleShowLiffLink(tenant)}
            >
              查看連結
            </Button>
          ) : (
            <Typography variant="caption" color="text.secondary">
              未設定
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (tenant: Tenant) => (
        <Box display="flex" gap={1} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleShowUsers(tenant)}
          >
            管理用戶
          </Button>
          <IconButton size="small" color="primary" onClick={() => handleOpenModal(tenant)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(tenant)}>
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
              社區管理
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
          >
            新增社區
          </Button>
        </Box>

        <Table data={tenants} columns={columns} emptyMessage="暫無社區資料" />

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingTenant ? '編輯社區' : '新增社區'}
          size="lg"
        >
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="社區名稱"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="地址"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="聯絡人"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="聯絡電話"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight={600} mt={2}>
              LINE 設定
            </Typography>
            
            <Box display="flex" gap={1} alignItems="flex-start" mb={2}>
              <AlertTriangle size={18} style={{ marginTop: 2, color: '#ed6c02', flexShrink: 0 }} />
              <Typography variant="caption" color="warning.main">
                <strong>重要：</strong>根據 LINE 新政策，您需要建立兩個 Channels：
                <br />1. <strong>Messaging API Channel</strong>（用於發送通知）
                <br />2. <strong>LINE Login Channel</strong>（用於 LIFF App）
              </Typography>
            </Box>

            <Box display="flex" gap={1} alignItems="center" mt={2} mb={1}>
              <Megaphone size={18} color="#1976d2" />
              <Typography variant="body2" fontWeight={500} color="primary">
                Messaging API Channel（用於發送通知）
              </Typography>
            </Box>

            <TextField
              label="Channel Access Token"
              value={formData.lineConfig?.channelAccessToken}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lineConfig: { ...formData.lineConfig!, channelAccessToken: e.target.value },
                })
              }
              helperText="從 Messaging API Channel 的 Messaging API 分頁取得"
              required
              fullWidth
            />

            <TextField
              label="Channel Secret"
              value={formData.lineConfig?.channelSecret}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lineConfig: { ...formData.lineConfig!, channelSecret: e.target.value },
                })
              }
              helperText="從 Messaging API Channel 的 Basic settings 分頁取得"
              required
              fullWidth
            />

            <Box display="flex" gap={1} alignItems="center" mt={3} mb={1}>
              <Lock size={18} color="#1976d2" />
              <Typography variant="body2" fontWeight={500} color="primary">
                LINE Login Channel（用於 LIFF App）
              </Typography>
            </Box>

            <TextField
              label="LIFF ID"
              value={formData.lineConfig?.liffId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lineConfig: { ...formData.lineConfig!, liffId: e.target.value },
                })
              }
              helperText="從 LINE Login Channel 的 LIFF 分頁建立 LIFF App 後取得"
              required
              fullWidth
            />

            <Typography variant="subtitle1" fontWeight={600} mt={2}>
              授權管理員 LINE IDs（選填）
            </Typography>
            
            <Box display="flex" gap={1} alignItems="flex-start" sx={{ mb: 1 }}>
              <Info size={16} style={{ marginTop: 2, color: '#757575', flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary">
                提示：所有加入此 LINE OA 的用戶都會收到通知。此處可選填特定管理員 ID 以便在 LIFF 中進行權限控制。
              </Typography>
            </Box>

            <Box display="flex" gap={1}>
              <TextField
                value={adminLineIdInput}
                onChange={(e) => setAdminLineIdInput(e.target.value)}
                placeholder="輸入 LINE User ID（選填）"
                size="small"
                fullWidth
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAdminLineId();
                  }
                }}
              />
              <Button variant="outlined" onClick={handleAddAdminLineId}>
                新增
              </Button>
            </Box>

            <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
              {formData.adminLineIds && formData.adminLineIds.length > 0 ? (
                formData.adminLineIds.map((id, index) => {
                  const user = adminLineUsers.get(id);
                  return (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        bgcolor: 'primary.50',
                      }}
                    >
                      {user?.pictureUrl ? (
                        <Box
                          component="img"
                          src={user.pictureUrl}
                          alt={user.displayName}
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: 'grey.300',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <User size={28} color="#666" />
                        </Box>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight={500}>
                          {user?.displayName || '未知用戶'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          LINE ID: {id}
                        </Typography>
                        {user?.firstSeenAt && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            首次使用：{new Date(user.firstSeenAt).toLocaleString('zh-TW')}
                          </Typography>
                        )}
                        {user?.lastSeenAt && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            最後使用：{new Date(user.lastSeenAt).toLocaleString('zh-TW')}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label="管理員"
                        color="primary"
                        size="small"
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveAdminLineId(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  );
                })
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'grey.50',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    尚未添加特定管理員
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    輸入 LINE User ID 並點擊「新增」來添加管理員
                  </Typography>
                </Paper>
              )}
            </Box>

            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Button variant="outlined" onClick={handleCloseModal}>
                取消
              </Button>
              <Button type="submit" variant="contained">
                {editingTenant ? '更新' : '建立'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* LIFF Link Modal */}
        <Modal
          isOpen={isLiffLinkModalOpen}
          onClose={() => setIsLiffLinkModalOpen(false)}
          title="LINE LIFF 管理連結"
          size="md"
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                社區名稱
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {selectedTenantForLink?.name}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                LINE LIFF URL
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                }}
              >
                {selectedTenantForLink && getLiffUrl(selectedTenantForLink)}
              </Paper>
            </Box>

            <Box>
              <Box display="flex" gap={1} alignItems="center" mb={1}>
                <Smartphone size={18} color="#1976d2" />
                <Typography variant="subtitle2" color="primary" fontWeight={600}>
                  使用說明
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" component="div">
                <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li>點擊下方「複製連結」按鈕</li>
                  <li>將連結分享給需要管理權限的人員</li>
                  <li>任何加入此 LINE OA 的用戶都可以使用此 LIFF 管理長者資料</li>
                  <li>所有加入 OA 的用戶都會收到警報通知</li>
                </ol>
              </Typography>
            </Box>

            <Box display="flex" gap={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ContentCopyIcon />}
                onClick={() => selectedTenantForLink && handleCopyLiffLink(selectedTenantForLink)}
              >
                複製連結
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setIsLiffLinkModalOpen(false)}
              >
                關閉
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* LINE Users Management Modal */}
        <Modal
          isOpen={isUsersModalOpen}
          onClose={() => setIsUsersModalOpen(false)}
          title={`管理 LINE 用戶 - ${editingTenant?.name || ''}`}
          size="lg"
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              選擇哪些用戶可以擁有管理權限。所有用戶都會收到通知，但只有被選為管理員的用戶可以編輯資料。
            </Typography>

            {loadingUsers ? (
              <LoadingSpinner />
            ) : lineUsers.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  尚無用戶使用過此社區的 LIFF
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  請先分享 LIFF 連結給用戶，他們首次登入後會顯示在這裡
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                {lineUsers.map((user) => {
                  const isAdmin = editingTenant?.adminLineIds?.includes(user.id) || false;
                  return (
                    <Paper
                      key={user.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        bgcolor: isAdmin ? 'primary.50' : 'background.paper',
                      }}
                    >
                      {user.pictureUrl && (
                        <Box
                          component="img"
                          src={user.pictureUrl}
                          alt={user.displayName}
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight={500}>
                          {user.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          首次使用：{new Date(user.firstSeenAt).toLocaleString('zh-TW')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          最後使用：{new Date(user.lastSeenAt).toLocaleString('zh-TW')}
                        </Typography>
                      </Box>
                      <Chip
                        label={isAdmin ? '管理員' : '一般用戶'}
                        color={isAdmin ? 'primary' : 'default'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Button
                        variant={isAdmin ? 'outlined' : 'contained'}
                        color={isAdmin ? 'error' : 'primary'}
                        size="small"
                        onClick={() => handleToggleAdmin(user.id, isAdmin)}
                      >
                        {isAdmin ? '移除管理員' : '設為管理員'}
                      </Button>
                    </Paper>
                  );
                })}
              </Box>
            )}

            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button variant="contained" onClick={() => setIsUsersModalOpen(false)}>
                完成
              </Button>
            </Box>
          </Box>
        </Modal>
      </Container>
    </Box>
  );
};
