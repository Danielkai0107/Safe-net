import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import type { Elder } from '../types';
import { StatusBadge } from './StatusBadge';

interface ElderCardProps {
  elder: Elder;
  onClick?: (elder: Elder) => void;
}

export const ElderCard: React.FC<ElderCardProps> = ({ elder, onClick }) => {
  const formatLastSeen = (lastSeen: string): string => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    return date.toLocaleDateString('zh-TW');
  };

  const CardWrapper: React.ComponentType<any> = onClick ? CardActionArea : Box;

  return (
    <Card elevation={2}>
      <CardWrapper onClick={() => onClick && onClick(elder)}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.light',
                  fontSize: '2rem',
                }}
              >
                👴
              </Avatar>
              <Box>
                <Typography variant="h6" component="div" gutterBottom sx={{ mb: 0.5 }}>
                  {elder.name}
                </Typography>
                {elder.age && (
                  <Typography variant="body2" color="text.secondary">
                    {elder.age} 歲
                  </Typography>
                )}
              </Box>
            </Box>
            <StatusBadge status={elder.status} lastSeen={elder.lastSeen} />
          </Box>

          <Stack spacing={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                最後出現：{formatLastSeen(elder.lastSeen)}
              </Typography>
            </Box>

            {elder.address && (
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {elder.address}
                </Typography>
              </Box>
            )}

            {elder.emergencyContact && (
              <Box display="flex" alignItems="center" gap={1}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  緊急聯絡人：{elder.emergencyContact}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </CardWrapper>
    </Card>
  );
};
