import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface CarouselProps<T> {
    items: T[];
    renderCard: (item: T, index: number) => React.ReactNode;
    onCardClick?: (item: T) => void;
    className?: string;
    itemClassName?: string;
}

export function Carousel<T>({ items, renderCard, onCardClick, className, itemClassName }: CarouselProps<T>) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const checkScrollButtons = () => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            const maxScroll = Math.max(0, scrollWidth - clientWidth);
            const overflow = maxScroll > 15;

            setHasOverflow(overflow);
            setCanScrollLeft(overflow && scrollLeft > 10);
            setCanScrollRight(overflow && scrollLeft < maxScroll - 10);

            if (overflow) {
                const pages = Math.max(2, Math.ceil(scrollWidth / clientWidth));
                setTotalPages(pages);

                let activePage = 0;
                if (scrollLeft >= maxScroll - 15) {
                    activePage = pages - 1;
                } else if (scrollLeft <= 15) {
                    activePage = 0;
                } else {
                    activePage = Math.min(
                        pages - 1,
                        Math.max(0, Math.round((scrollLeft / maxScroll) * (pages - 1)))
                    );
                }
                setCurrentIndex(activePage);
            } else {
                setTotalPages(1);
                setCurrentIndex(0);
            }
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollButtons);
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
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const scrollToPage = (pageIndex: number) => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollWidth, clientWidth } = container;
            const maxScroll = Math.max(0, scrollWidth - clientWidth);
            if (maxScroll <= 0 || totalPages <= 1) return;

            const targetScroll = (pageIndex / (totalPages - 1)) * maxScroll;
            container.scrollTo({
                left: targetScroll,
                behavior: 'smooth',
            });
            setCurrentIndex(pageIndex);
        }
    };

    return (
        <div className={cn("relative w-full group/carousel py-2", className)}>
            {/* Left Button */}
            {canScrollLeft && (
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full w-10 h-10 bg-background/90 backdrop-blur-sm border-primary/20 shadow-lg hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 duration-300"
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
                        className={cn(
                            "flex-none snap-start transition-all duration-300 transform-gpu hover:-translate-y-1",
                            itemClassName || "w-[280px] sm:w-[300px] md:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] max-w-[420px]"
                        )}
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full w-10 h-10 bg-background/90 backdrop-blur-sm border-primary/20 shadow-lg hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 duration-300"
                    onClick={() => scroll('right')}
                    aria-label="Siguiente"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            )}

            {/* Page Indicators / Dots */}
            {hasOverflow && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-2">
                    {Array.from({ length: totalPages }).map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            className={cn(
                                "h-2 rounded-full transition-all duration-300 border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                currentIndex === index 
                                    ? "w-6 bg-primary shadow-sm" 
                                    : "w-2 bg-primary/20 hover:bg-primary/50"
                            )}
                            onClick={() => scrollToPage(index)}
                            aria-label={`Ir a la página ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
