"use client";

interface TrendSparklineProps {
  data: number[];
  color: string;
  height?: number;
  width?: number;
}

export default function TrendSparkline({
  data,
  color,
  height = 32,
  width = 100,
}: TrendSparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 1;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * plotWidth;
      const y = padding + plotHeight - ((value - min) / range) * plotHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline
        points={points}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
