import { useState } from "react";

export default function LogoImage({ src, alt, emoji, className, style }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.3rem",
          filter: "none",
          ...style,
        }}
      >
        {emoji || "🏆"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
