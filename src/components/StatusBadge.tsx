import React from 'react';
import Chip from '@mui/material/Chip';
import type { ElderStatus, AlertStatus, AlertSeverity } from '../types';

interface StatusBadgeProps {
  status: ElderStatus | AlertStatus | AlertSeverity | string;
  lastSeen?: string;
}

type StatusConfig = {
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  text: string;
  icon?: string;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, lastSeen }) => {
  const getElderStatusFromTime = (lastSeenTime: string): StatusConfig => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeenTime);
    const hoursDiff = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      return { color: 'success', text: '正常', icon: '🟢' };
    } else if (hoursDiff < 6) {
      return { color: 'warning', text: '注意', icon: '🟡' };
    } else if (hoursDiff < 12) {
      return { color: 'warning', text: '警告', icon: '🟠' };
    } else {
      return { color: 'error', text: '異常', icon: '🔴' };
    }
  };

  const getStatusConfig = (): StatusConfig => {
    if (lastSeen) {
      return getElderStatusFromTime(lastSeen);
    }

    // Elder status
    if (status === 'active') return { color: 'success', text: '活躍', icon: '🟢' };
    if (status === 'inactive') return { color: 'default', text: '未啟用' };
    if (status === 'offline') return { color: 'error', text: '離線', icon: '🔴' };

    // Alert status
    if (status === 'pending') return { color: 'warning', text: '待處理' };
    if (status === 'acknowledged') return { color: 'info', text: '已確認' };
    if (status === 'resolved') return { color: 'success', text: '已解決' };

    // Alert severity
    if (status === 'low') return { color: 'info', text: '低' };
    if (status === 'medium') return { color: 'warning', text: '中' };
    if (status === 'high') return { color: 'warning', text: '高' };
    if (status === 'critical') return { color: 'error', text: '嚴重' };

    return { color: 'default', text: status };
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={
        <>
          {config.icon && <span style={{ marginRight: 4 }}>{config.icon}</span>}
          {config.text}
        </>
      }
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};
