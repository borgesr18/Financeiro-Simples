'use client'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

export default function SpendingChart() {
  const options: Highcharts.Options = {
    chart: { type: 'areaspline', backgroundColor: 'transparent', style: { fontFamily: 'Inter, sans-serif' } },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      labels: { style: { color: '#6b7280' } },
      lineColor: '#e5e7eb',
      tickColor: '#e5e7eb',
    },
    yAxis: {
      title: { text: undefined },
      gridLineColor: '#e5e7eb',
      labels: { style: { color: '#6b7280' }, formatter: function () { return 'R$ ' + this.value } },
    },
    tooltip: {
      shared: true,
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderRadius: 8,
      shadow: false,
      valuePrefix: 'R$ ',
    },
    legend: { enabled: false },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.1,
        marker: { enabled: false, symbol: 'circle', radius: 4, states: { hover: { enabled: true } } },
      },
    },
    series: [
      { name: 'Receitas', type: 'areaspline', color: '#10b981', data: [3200, 3500, 3700, 3800, 4100, 4250] },
      { name: 'Despesas', type: 'areaspline', color: '#ef4444', data: [1800, 1900, 2100, 1950, 2300, 2150] },
    ],
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />
}
