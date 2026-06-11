"use client";
import { useReveal } from "@/hooks/useReveal";
import React from "react";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  variant?: "up" | "scale" | "left";
  // Change 'as' to ElementType for better React compatibility
  as?: React.ElementType;
}

const variantClass = {
  up: "reveal",
  scale: "reveal-scale",
  left: "reveal-left",
};

const delayClass: Record<number, string> = {
  0: "",
  1: "delay-1",
  2: "delay-2",
  3: "delay-3",
  4: "delay-4",
  5: "delay-5",
  6: "delay-6",
};

export function FadeIn({
  children,
  className = "",
  delay = 0,
  variant = "up",
  as: Tag = "div",
}: FadeInProps) {
  // Use a generic ref type that accommodates the dynamic tag
  const ref = useReveal<any>();

  return (
    <Tag
      ref={ref}
      className={`${variantClass[variant]} ${delayClass[delay]} ${className}`}
    >
      {children}
    </Tag>
  );
}
