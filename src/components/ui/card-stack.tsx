import React from 'react';
import { cn } from '@/lib/utils';

interface CardStackProps<T> {
    items: T[];
    renderCard: (item: T, index: number) => React.ReactNode;
    onCardClick?: (item: T) => void;
    className?: string;
}

/**
 * CardStack Component
 * Creates a premium "fan-out" effect for a set of cards.
 * Perfect for showing a deck of recent items.
 */
export function CardStack<T>({ items, renderCard, onCardClick, className }: CardStackProps<T>) {
    // Limit to 5 items for best visual effect
    const displayItems = items.slice(0, 5);
    const centerIndex = (displayItems.length - 1) / 2;

    return (
        <div className={cn("relative h-[350px] w-full flex items-center justify-center overflow-hidden", className)}>
            <div className="relative w-[220px] h-[300px] group">
                {displayItems.map((item, index) => {
                    const offset = index - centerIndex;
                    
                    return (
                        <div
                            key={index}
                            className="absolute inset-0 transition-all duration-500 ease-out transform-gpu origin-bottom"
                            style={{
                                zIndex: displayItems.length - Math.abs(offset) * 2,
                                // Initial stacked state (mobile/default)
                                transform: `translateY(${index * 6}px) scale(${1 - Math.abs(offset) * 0.04})`,
                            }}
                        >
                            {/* Inner wrapper for the fan animation on hover */}
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCardClick?.(item);
                                }}
                                className="w-full h-full transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) 
                                           group-hover:rotate-[var(--rotate)] 
                                           group-hover:translate-x-[var(--tx)] 
                                           group-hover:translate-y-[var(--ty)]
                                           hover:!scale-110 hover:!z-[100] hover:brightness-110
                                           active:scale-95 shadow-xl rounded-2xl cursor-pointer"
                                style={{
                                    // CSS Variables for the fan effect
                                    '--rotate': `${offset * 15}deg`,
                                    '--tx': `${offset * 85}px`,
                                    '--ty': `${Math.abs(offset) * 15 - 30}px`,
                                } as React.CSSProperties}
                            >
                                {renderCard(item, index)}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Background Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse" />
        </div>
    );
}
