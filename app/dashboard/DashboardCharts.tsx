// app/dashboard/DashboardCharts.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function FinancialChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#71717a' }} 
          dy={10} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#71717a' }} 
          tickFormatter={(value) => `R$ ${value}`} 
        />
        <Tooltip 
          cursor={{ fill: '#f4f4f5' }} 
          contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
          formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} 
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
        <Bar dataKey="receitas" name="Receitas (Entradas)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="despesas" name="Despesas (Saídas)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OSStatusChart({ data }: { data: any[] }) {
  // Se não houver dados, mostramos um gráfico vazio e cinza
  const isEmpty = data.every(item => item.value === 0);
  const chartData = isEmpty ? [{ name: "Sem Dados", value: 1, fill: "#e4e4e7" }] : data;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie 
          data={chartData} 
          cx="50%" 
          cy="50%" 
          innerRadius={70} 
          outerRadius={90} 
          paddingAngle={5} 
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        {!isEmpty && (
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            formatter={(value: number) => [`${value} OS`, 'Quantidade']}
          />
        )}
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}