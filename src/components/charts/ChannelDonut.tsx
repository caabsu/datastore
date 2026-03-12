"use client";

import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";

interface ChannelDataPoint {
  name: string;
  value: number;
  color: string;
}

interface ChannelDonutProps {
  data: ChannelDataPoint[];
}

interface LabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

const RADIAN = Math.PI / 180;

function renderLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  outerRadius = 0,
  percent = 0,
}: LabelProps) {
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.04) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#71717A"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function ChannelDonut({ data }: ChannelDonutProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius="60%"
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={renderLabel}
          labelLine={false}
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>

        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span style={{ color: "#71717A", fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
