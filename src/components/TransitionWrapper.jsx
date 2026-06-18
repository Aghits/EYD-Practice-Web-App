import React, { useState, useEffect } from 'react';

export default function TransitionWrapper({ show, children, animationType = 'slide' }) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setIsExiting(false);
    } else {
      setIsExiting(true);
    }
  }, [show]);

  const handleAnimationEnd = () => {
    if (isExiting) {
      setShouldRender(false);
      setIsExiting(false);
    }
  };

  if (!shouldRender) return null;

  const animationClass = isExiting
    ? `animate-exit-${animationType}`
    : `animate-enter-${animationType}`;

  return (
    <div 
      className={`transition-item ${animationClass}`} 
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
}
