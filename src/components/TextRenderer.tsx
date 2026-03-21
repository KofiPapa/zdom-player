import type { TextStyle } from "@shared/types/firestore-schema.ts";

interface TextRendererProps {
  text: string;
  style: TextStyle;
}

export function TextRenderer({ text, style }: TextRendererProps) {
  const containerStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    color: style.color,
    backgroundColor: style.backgroundColor ?? "transparent",
    textAlign: style.textAlign,
    padding: `${style.padding}px`,
    lineHeight: style.lineHeight,
    letterSpacing: `${style.letterSpacing}px`,
    textTransform: style.textTransform ?? "none",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    alignItems:
      style.verticalAlign === "top"
        ? "flex-start"
        : style.verticalAlign === "bottom"
          ? "flex-end"
          : "center",
    justifyContent:
      style.textAlign === "left"
        ? "flex-start"
        : style.textAlign === "right"
          ? "flex-end"
          : "center",
  };

  if (style.scrolling?.enabled) {
    const direction = style.scrolling.direction ?? "left";
    const speed = style.scrolling.speed ?? 50;
    const duration = Math.max(5, 200 / speed);

    const animationName = `ticker-scroll-${direction}`;

    return (
      <div style={containerStyle} className="relative">
        <div
          style={{
            whiteSpace: direction === "left" || direction === "right" ? "nowrap" : "normal",
            animation: `${animationName} ${duration}s linear infinite`,
          }}
        >
          {text}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <span>{text}</span>
    </div>
  );
}
