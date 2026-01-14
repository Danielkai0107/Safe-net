import React from 'react';
import Dialog from '@mui/material/Dialog';
import CloseIcon from '@mui/icons-material/Close';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) => {
  const modalClass = size ? `modal modal--${size}` : 'modal';

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={size === 'fullscreen' ? false : size}
      fullWidth={size !== 'fullscreen'}
      fullScreen={size === 'fullscreen'}
      className={modalClass}
      disableEnforceFocus
    >
      <div className="modal__header">
        <h2 className="modal__title">{title}</h2>
        <button
          className="modal__close"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="modal__content">
        {children}
      </div>
      {footer && (
        <div className="modal__footer">
          {footer}
        </div>
      )}
    </Dialog>
  );
};
