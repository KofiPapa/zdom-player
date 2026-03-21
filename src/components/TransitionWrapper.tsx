import { useEffect, useState, type ReactNode } from "react";
import type { TransitionType } from "@shared/types/firestore-schema.ts";

interface TransitionWrapperProps {
  transitionType: TransitionType;
  itemKey: string;
  children: ReactNode;
}

const DURATION = 500;

function getTransitionStyles(type: TransitionType, entering: boolean) {
  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transition: `all ${DURATION}ms ease-in-out`,
  };

  if (type === "none") {
    return { ...base, opacity: 1 };
  }

  if (type === "fade") {
    return { ...base, opacity: entering ? 1 : 0 };
  }

  if (type === "slide-left") {
    return {
      ...base,
      opacity: entering ? 1 : 0,
      transform: entering ? "translateX(0)" : "translateX(-100%)",
    };
  }

  if (type === "slide-right") {
    return {
      ...base,
      opacity: entering ? 1 : 0,
      transform: entering ? "translateX(0)" : "translateX(100%)",
    };
  }

  if (type === "slide-up") {
    return {
      ...base,
      opacity: entering ? 1 : 0,
      transform: entering ? "translateY(0)" : "translateY(-100%)",
    };
  }

  if (type === "slide-down") {
    return {
      ...base,
      opacity: entering ? 1 : 0,
      transform: entering ? "translateY(0)" : "translateY(100%)",
    };
  }

  if (type === "zoom-in") {
    return {
      ...base,
      opacity: entering ? 1 : 0,
      transform: entering ? "scale(1)" : "scale(0.5)",
    };
  }

  return { ...base, opacity: entering ? 1 : 0 };
}

function getInitialStyles(type: TransitionType) {
  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transition: `all ${DURATION}ms ease-in-out`,
  };

  if (type === "none") return { ...base, opacity: 1 };
  if (type === "fade") return { ...base, opacity: 0 };
  if (type === "slide-left")
    return { ...base, opacity: 0, transform: "translateX(100%)" };
  if (type === "slide-right")
    return { ...base, opacity: 0, transform: "translateX(-100%)" };
  if (type === "slide-up")
    return { ...base, opacity: 0, transform: "translateY(100%)" };
  if (type === "slide-down")
    return { ...base, opacity: 0, transform: "translateY(-100%)" };
  if (type === "zoom-in")
    return { ...base, opacity: 0, transform: "scale(1.5)" };
  return { ...base, opacity: 0 };
}

export function TransitionWrapper({
  transitionType,
  itemKey,
  children,
}: TransitionWrapperProps) {
  const [entering, setEntering] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>(
    getInitialStyles(transitionType)
  );

  useEffect(() => {
    setEntering(false);
    setStyle(getInitialStyles(transitionType));

    // Trigger enter on next frame
    const raf = requestAnimationFrame(() => {
      setEntering(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [itemKey, transitionType]);

  useEffect(() => {
    setStyle(getTransitionStyles(transitionType, entering));
  }, [entering, transitionType]);

  return <div style={style}>{children}</div>;
}
