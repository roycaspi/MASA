import React from 'react';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl',
    xl: 'w-16 h-16 text-2xl'
  };

  return (
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      <div className={`logo ${sizeClasses[size]}`}>
        <i className="fas fa-calendar-check"></i>
      </div>
      {showText && (
        <span className="navbar-brand mb-0 d-flex flex-column align-items-start" style={{ lineHeight: 1.1 }}>
          <span style={{ fontWeight: 700, fontSize: '1.5em', letterSpacing: '0.02em' }}>MASA</span>
          <span className="text-muted" style={{ fontSize: '0.85em', fontWeight: 400, marginTop: '-2px' }}>
            Medical Analyzer Scheduling Assistant
          </span>
        </span>
      )}
    </div>
  );
};

export default Logo; 