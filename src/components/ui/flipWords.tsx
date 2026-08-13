import { useEffect, useState, useCallback } from "react";
import { cn } from "../../lib/cn";

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

export function FlipWords({ words, duration = 2500, className = "" }: FlipWordsProps) {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentWord((prev) => {
        const currentIndex = words.indexOf(prev);
        const nextIndex = (currentIndex + 1) % words.length;
        return words[nextIndex];
      });
      setIsAnimating(false);
    }, 350);
  }, [words]);

  useEffect(() => {
    const interval = setInterval(() => {
      startAnimation();
    }, duration);
    return () => clearInterval(interval);
  }, [startAnimation, duration]);

  return (
    <span className={cn("inline-block", className)}>
      {currentWord.split(" ").map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap mr-1.5">
          {word.split("").map((letter, letterIndex) => {
            // Absolute index for staggered delay
            const globalIndex = currentWord.substring(0, currentWord.indexOf(word)).length + letterIndex;
            return (
              <span
                key={letterIndex}
                style={{
                  animationDelay: `${globalIndex * 35}ms`,
                  transitionDelay: isAnimating ? `${letterIndex * 15}ms` : "0ms"
                }}
                className={cn(
                  "inline-block transition-all duration-300 transform ease-out",
                  isAnimating
                    ? "opacity-0 -translate-y-2.5 blur-[2px] scale-95"
                    : "opacity-100 translate-y-0 blur-0 scale-100"
                )}
              >
                {letter}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
