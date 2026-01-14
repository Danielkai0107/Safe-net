import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAppStore } from '../../store/store';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import type { Alert as AlertType } from '../../types';

export const AlertList: React.FC = () => {
  const { alerts, isLoading, lineUserId, isAdmin } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'acknowledged' | 'resolved'>('all');

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter);

  const handleAcknowledge = async (alertItem: AlertType) => {
    if (!lineUserId) {
      alert('無法取得 LINE User ID');
      return;
    }

    try {
      await updateDoc(doc(db, 'alerts', alertItem.id), {
        status: 'acknowledged',
        acknowledgedBy: lineUserId,
        acknowledgedAt: new Date().toISOString(),
      });
      alert('已確認此警報');
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
      alert('操作失敗：' + error.message);
    }
  };

  const handleResolve = async (alertItem: AlertType) => {
    try {
      await updateDoc(doc(db, 'alerts', alertItem.id), {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      });
      alert('已解決此警報');
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      alert('操作失敗：' + error.message);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'emergency':
        return '🚨';
      case 'inactivity':
        return '⏰';
      case 'low_battery':
        return '🔋';
      case 'device_offline':
        return '📴';
      default:
        return '⚠️';
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="載入警報資料..." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            警報記錄
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            共 {filteredAlerts.length} 筆警報
          </Typography>
        </Box>

        <TextField
          select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">全部</MenuItem>
          <MenuItem value="pending">待處理</MenuItem>
          <MenuItem value="acknowledged">已確認</MenuItem>
          <MenuItem value="resolved">已解決</MenuItem>
        </TextField>
      </Box>

      {filteredAlerts.length === 0 ? (
        <Card elevation={2}>
          <CardContent>
            <Box textAlign="center" py={6}>
              <Typography variant="h6" color="text.secondary">
                暫無警報記錄
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredAlerts.map((alertItem) => (
            <Card key={alertItem.id} elevation={2}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" gap={2}>
                    <Avatar
                      sx={{
                        bgcolor:
                          alertItem.severity === 'critical'
                            ? 'error.light'
                            : alertItem.severity === 'high'
                            ? 'warning.light'
                            : 'info.light',
                        fontSize: '2rem',
                      }}
                    >
                      {getAlertIcon(alertItem.alertType)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {alertItem.elderName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {alertItem.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(alertItem.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                  <Stack spacing={1} alignItems="flex-end">
                    <StatusBadge status={alertItem.status} />
                    <StatusBadge status={alertItem.severity} />
                  </Stack>
                </Box>

                {alertItem.status === 'acknowledged' && alertItem.acknowledgedAt && (
                  <Paper sx={{ mt: 2, p: 2, bgcolor: 'info.lighter' }}>
                    <Typography variant="body2" color="info.dark">
                      已確認於 {formatTime(alertItem.acknowledgedAt)}
                    </Typography>
                  </Paper>
                )}

                {alertItem.status === 'resolved' && alertItem.resolvedAt && (
                  <Paper sx={{ mt: 2, p: 2, bgcolor: 'success.lighter' }}>
                    <Typography variant="body2" color="success.dark">
                      已解決於 {formatTime(alertItem.resolvedAt)}
                    </Typography>
                  </Paper>
                )}

                {/* Actions - Only for Admin */}
                {isAdmin && (
                  <Box display="flex" gap={1} mt={2}>
                    {alertItem.status === 'pending' && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAcknowledge(alertItem)}
                      >
                        確認
                      </Button>
                    )}
                    {alertItem.status === 'acknowledged' && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleResolve(alertItem)}
                      >
                        標記為已解決
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};
