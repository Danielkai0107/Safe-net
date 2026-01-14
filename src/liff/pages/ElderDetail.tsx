import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAppStore } from '../../store/store';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import type { Elder, SignalLog } from '../../types';

export const ElderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchElderById } = useAppStore();
  const [elder, setElder] = useState<Elder | null>(null);
  const [logs, setLogs] = useState<SignalLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const elderData = await fetchElderById(id);
        if (!elderData) {
          alert('找不到此長者');
          navigate('/liff');
          return;
        }
        setElder(elderData);

        const logsRef = collection(db, 'logs');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const q = query(
          logsRef,
          where('elderId', '==', id),
          where('timestamp', '>=', twentyFourHoursAgo),
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        const logsSnapshot = await getDocs(q);
        const logsData: SignalLog[] = logsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as SignalLog));

        setLogs(logsData);
      } catch (error: any) {
        console.error('Error loading elder detail:', error);
        alert('載入失敗：' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, fetchElderById, navigate]);

  if (isLoading) {
    return <LoadingSpinner text="載入資料..." />;
  }

  if (!elder) {
    return null;
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/liff')}
        sx={{ mb: 2 }}
      >
        返回列表
      </Button>

      {/* Elder Info Card */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'primary.light',
                  fontSize: '2rem',
                }}
              >
                👴
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {elder.name}
                </Typography>
                {elder.age && (
                  <Typography variant="body1" color="text.secondary">
                    {elder.age} 歲
                  </Typography>
                )}
              </Box>
            </Box>
            <StatusBadge status={elder.status} lastSeen={elder.lastSeen} />
          </Box>

          <Grid container spacing={2}>
            {elder.address && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  居住地址
                </Typography>
                <Typography variant="body2">{elder.address}</Typography>
              </Grid>
            )}
            {elder.contactPhone && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  聯絡電話
                </Typography>
                <Typography variant="body2">{elder.contactPhone}</Typography>
              </Grid>
            )}
            {elder.emergencyContact && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  緊急聯絡人
                </Typography>
                <Typography variant="body2">
                  {elder.emergencyContact}
                  {elder.emergencyPhone && ` (${elder.emergencyPhone})`}
                </Typography>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">
                最後出現時間
              </Typography>
              <Typography variant="body2">{formatTime(elder.lastSeen)}</Typography>
            </Grid>
            {elder.lastSignalRssi && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  訊號強度 (RSSI)
                </Typography>
                <Typography variant="body2">{elder.lastSignalRssi} dBm</Typography>
              </Grid>
            )}
            {elder.lastGatewayId && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Gateway
                </Typography>
                <Typography variant="body2">{elder.lastGatewayId}</Typography>
              </Grid>
            )}
          </Grid>

          {elder.notes && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'warning.light' }}>
              <Typography variant="body2">
                <strong>備註：</strong> {elder.notes}
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            最近 24 小時活動紀錄 ({logs.length})
          </Typography>

          {logs.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                暫無活動紀錄
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              {logs.map((log) => (
                <Paper key={log.id} variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" gap={2}>
                    <Avatar
                      sx={{
                        bgcolor: log.signalType === 'emergency' ? 'error.light' : 'primary.light',
                      }}
                    >
                      {log.signalType === 'emergency' ? '🚨' : '📡'}
                    </Avatar>
                    <Box flex={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {log.signalType === 'emergency' && '緊急求救'}
                          {log.signalType === 'normal' && '一般訊號'}
                          {log.signalType === 'health' && '健康數據'}
                          {log.signalType === 'other' && '其他訊號'}
                        </Typography>
                        <Chip
                          label={log.signalType}
                          color={log.signalType === 'emergency' ? 'error' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(log.timestamp)}
                      </Typography>
                      <Box display="flex" gap={2} mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          RSSI: {log.rssi} dBm
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Gateway: {log.gatewayId}
                        </Typography>
                        {log.metadata?.batteryLevel !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            電量: {log.metadata.batteryLevel}%
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
