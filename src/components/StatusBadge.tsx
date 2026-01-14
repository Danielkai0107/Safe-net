import React from 'react';
import type { ElderStatus, AlertStatus, AlertSeverity } from '../types';

interface StatusBadgeProps {
  status: ElderStatus | AlertStatus | AlertSeverity | string;
  lastSeen?: string;
  size?: 'sm' | 'md' | 'lg';
}

type StatusConfig = {
  variant: 'active' | 'inactive' | 'warning' | 'error' | 'info' | 'success';
  text: string;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  lastSeen,
  size = 'md' 
}) => {
  const getElderStatusFromTime = (lastSeenTime: string): StatusConfig => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeenTime);
    const hoursDiff = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      return { variant: 'success', text: '正常' };
    } else if (hoursDiff < 6) {
      return { variant: 'warning', text: '注意' };
    } else if (hoursDiff < 12) {
      return { variant: 'warning', text: '警告' };
    } else {
      return { variant: 'error', text: '異常' };
    }
  };

  const getStatusConfig = (): StatusConfig => {
    if (lastSeen) {
      return getElderStatusFromTime(lastSeen);
    }

    // Elder status
    if (status === 'active') return { variant: 'active', text: '活躍' };
    if (status === 'inactive') return { variant: 'inactive', text: '未啟用' };
    if (status === 'offline') return { variant: 'error', text: '離線' };

    // Alert status
    if (status === 'pending') return { variant: 'warning', text: '待處理' };
    if (status === 'acknowledged') return { variant: 'info', text: '已確認' };
    if (status === 'resolved') return { variant: 'success', text: '已解決' };

    // Alert severity
    if (status === 'low') return { variant: 'info', text: '低' };
    if (status === 'medium') return { variant: 'warning', text: '中' };
    if (status === 'high') return { variant: 'warning', text: '高' };
    if (status === 'critical') return { variant: 'error', text: '嚴重' };

    return { variant: 'inactive', text: status };
  };

  const config = getStatusConfig();
  
  const classNames = [
    'status-badge',
    `status-badge--${config.variant}`,
    size !== 'md' && `status-badge--${size}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames}>
      {config.text}
    </span>
  );
};
