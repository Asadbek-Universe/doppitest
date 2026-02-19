import { FC, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderColor?: string;
  wrapperClassName?: string;
}

export const LazyImage: FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholderColor = "bg-muted",
  wrapperClassName,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px",
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", wrapperClassName)}>
      {/* Blur placeholder */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          placeholderColor,
          isLoaded ? "opacity-0" : "opacity-100"
        )}
      >
        {/* Shimmer effect */}
        <div
          className={cn(
            "absolute inset-0 -translate-x-full",
            "bg-gradient-to-r from-transparent via-white/20 to-transparent",
            !isLoaded && "animate-shimmer"
          )}
        />
      </div>

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          className={cn(
            "transition-all duration-500",
            isLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
            className
          )}
          {...props}
        />
      )}
    </div>
  );
};
