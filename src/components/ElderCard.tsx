import React from 'react';
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

  const handleClick = () => {
    if (onClick) {
      onClick(elder);
    }
  };

  return (
    <div 
      className={`elder-card ${onClick ? 'elder-card--clickable' : ''}`}
      onClick={handleClick}
    >
      <div className="elder-card__header">
        <div className="elder-card__name">{elder.name}</div>
        {elder.age && (
          <div className="elder-card__info">{elder.age} 歲</div>
        )}
      </div>

      <div className="elder-card__content">
        <div className="elder-card__row">
          <span className="elder-card__label">最後出現</span>
          <span className="elder-card__value">{formatLastSeen(elder.lastSeen)}</span>
        </div>

        {elder.address && (
          <div className="elder-card__row">
            <span className="elder-card__label">地址</span>
            <span className="elder-card__value">{elder.address}</span>
          </div>
        )}

        {elder.emergencyContact && (
          <div className="elder-card__row">
            <span className="elder-card__label">緊急聯絡人</span>
            <span className="elder-card__value">{elder.emergencyContact}</span>
          </div>
        )}

        <div className="elder-card__status">
          <StatusBadge status={elder.status} lastSeen={elder.lastSeen} />
        </div>
      </div>
    </div>
  );
};
