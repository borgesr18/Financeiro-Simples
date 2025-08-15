'use client'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import Accessibility from 'highcharts/modules/accessibility'
import { useMemo } from 'react'
Accessibility(Highcharts)

export default function SpendingChart({
  categories,
  income,
  expense,
}: { categories: string[]; income: number[]; expense: number[] }) {
  const options = useMemo(() => ({
    chart: { type: 'areaspline', backgroundColor: 'transparent', style: { fontFamily: 'Inter, sans-serif' } },
    title: { text: null },
    credits: { enabled: false },
    xAxis: { categories, labels: { style: { color: '#6b7280' } }, lineColor: '#e5e7eb', tickColor: '#e5e7eb' },
    yAxis: { title: { text: null }, gridLineColor: '#e5e7eb', labels: { style: { color: '#6b7280' } } },
    tooltip: { shared: true, backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#e5e7eb', borderRadius: 8, shadow: false, valuePrefix: 'R$ ' },
    legend: { enabled: false },
    plotOptions: { areaspline: { fillOpacity: 0.1, marker: { enabled: false, radius: 4, states: { hover: { enabled: true } } } } },
    series: [
      { name: 'Entradas', data: income, color: '#10b981', type: 'areaspline' as const },
      { name: 'Saídas', data: expense, color: '#ef4444', type: 'areaspline' as const },
    ],
    accessibility: { enabled: true },
  }), [categories, income, expense])

  return <HighchartsReact highcharts={Highcharts} options={options} />
}
