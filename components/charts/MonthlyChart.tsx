// components/charts/MonthlyChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function MonthlyChart({ data }: { data: { month: string; income: number; expense: number; balance: number }[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" />
          <Line type="monotone" dataKey="expense" />
          <Line type="monotone" dataKey="balance" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
