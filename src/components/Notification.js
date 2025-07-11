import React from 'react';

const Notification = ({ message, type = 'info', onClose, show = false }) => {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-info-circle';
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-danger';
      case 'warning':
        return 'alert-warning';
      default:
        return 'alert-info';
    }
  };

  return (
    <div className={`alert ${getColorClass()} d-flex align-items-center justify-content-between`} role="alert">
      <div className="d-flex align-items-center">
        <i className={`${getIcon()} me-2`}></i>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
          aria-label="Close"
        ></button>
      )}
    </div>
  );
};

export default Notification;
