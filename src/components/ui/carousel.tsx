import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface CarouselProps<T> {
    items: T[];
    renderCard: (item: T, index: number) => React.ReactNode;
    onCardClick?: (item: T) => void;
    className?: string;
}

export function Carousel<T>({ items, renderCard, onCardClick, className }: CarouselProps<T>) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const checkScrollButtons = () => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setCanScrollLeft(scrollLeft > 5);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);

            // Estimate current active item index based on scroll position
            const itemWidth = items.length > 0 ? scrollWidth / items.length : 0;
            const newIndex = itemWidth > 0 ? Math.round(scrollLeft / itemWidth) : 0;
            setCurrentIndex(Math.min(Math.max(newIndex, 0), items.length - 1));
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollButtons);
            // Handle resize
            const resizeObserver = new ResizeObserver(() => checkScrollButtons());
            resizeObserver.observe(container);

            checkScrollButtons();

            return () => {
                container.removeEventListener('scroll', checkScrollButtons);
                resizeObserver.disconnect();
            };
        }
    }, [items]);

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = container.clientWidth * 0.75;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const scrollToItem = (index: number) => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollWidth = container.scrollWidth;
            const targetScrollLeft = (scrollWidth / items.length) * index;
            container.scrollTo({
                left: targetScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className={cn("relative w-full group/carousel py-4", className)}>
            {/* Left Button */}
            {canScrollLeft && (
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full w-10 h-10 bg-background/80 backdrop-blur-sm border-primary/20 shadow-md hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 duration-300"
                    onClick={() => scroll('left')}
                    aria-label="Anterior"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
            )}

            {/* Scrollable Container */}
            <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 px-2"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="flex-none w-[280px] md:w-[320px] snap-start transition-all duration-300 transform-gpu hover:-translate-y-1"
                        onClick={() => onCardClick?.(item)}
                    >
                        {renderCard(item, index)}
                    </div>
                ))}
            </div>

            {/* Right Button */}
            {canScrollRight && (
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full w-10 h-10 bg-background/80 backdrop-blur-sm border-primary/20 shadow-md hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 duration-300"
                    onClick={() => scroll('right')}
                    aria-label="Siguiente"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            )}

            {/* Page Indicators / Dots */}
            {items.length > 1 && (
                <div className="flex justify-center gap-2 mt-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            className={cn(
                                "h-2 rounded-full transition-all duration-300 border-none cursor-pointer",
                                currentIndex === index 
                                    ? "w-6 bg-primary" 
                                    : "w-2 bg-primary/20 hover:bg-primary/45"
                            )}
                            onClick={() => scrollToItem(index)}
                            aria-label={`Ir al elemento ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
