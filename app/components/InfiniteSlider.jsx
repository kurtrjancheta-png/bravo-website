'use client';
import React, { useRef, useEffect, useState } from 'react';

export default function InfiniteSlider({ children, itemWidth = '85%', gap = '1rem' }) {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  const childrenArray = React.Children.toArray(children);
  const totalItems = childrenArray.length;
  // Duplicate children 3 times for infinite scrolling illusion
  const tripleChildren = [...childrenArray, ...childrenArray, ...childrenArray];

  useEffect(() => {
    // Scroll to the middle set initially
    if (containerRef.current && !isReady && totalItems > 0) {
      const container = containerRef.current;
      const childElements = container.children;
      if (childElements.length >= totalItems) {
        const targetElement = childElements[totalItems];
        if (targetElement) {
          const scrollLeft = targetElement.offsetLeft - container.offsetLeft - (container.clientWidth - targetElement.clientWidth) / 2;
          container.scrollTo({ left: scrollLeft, behavior: 'instant' });
          setIsReady(true);
        }
      }
    }
  }, [totalItems, isReady]);

  const handleScroll = () => {
    if (!containerRef.current || !isReady || totalItems === 0) return;
    const container = containerRef.current;
    
    const childElements = container.children;
    if (childElements.length < totalItems * 3) return;

    const firstSetEnd = childElements[totalItems].offsetLeft - container.offsetLeft;
    const thirdSetStart = childElements[totalItems * 2].offsetLeft - container.offsetLeft;

    if (container.scrollLeft < firstSetEnd - container.clientWidth) {
      const setWidth = thirdSetStart - firstSetEnd;
      container.scrollTo({ left: container.scrollLeft + setWidth, behavior: 'instant' });
    }
    else if (container.scrollLeft > thirdSetStart) {
      const setWidth = thirdSetStart - firstSetEnd;
      container.scrollTo({ left: container.scrollLeft - setWidth, behavior: 'instant' });
    }
  };

  if (totalItems === 0) return null;

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      style={{ 
        display: 'flex', 
        overflowX: 'auto', 
        gap: gap,
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        // Padding left/right to ensure items can be centered
        padding: '0 10vw',
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.2s',
        margin: '0 -1.5rem' // Negate parent padding
      }}
      className="hide-scrollbar"
    >
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
      {tripleChildren.map((child, index) => (
        <div 
          key={index} 
          style={{ 
            flex: `0 0 ${itemWidth}`, 
            scrollSnapAlign: 'center',
            minWidth: 0
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
