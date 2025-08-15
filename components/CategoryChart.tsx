'use client'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

export default function CategoryChart() {
  const options: Highcharts.Options = {
    chart: { type: 'pie', backgroundColor: 'transparent', style: { fontFamily: 'Inter, sans-serif' } },
    title: { text: undefined },
    credits: { enabled: false },
    tooltip: { pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>' },
    accessibility: { point: { valueSuffix: '%' } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        showInLegend: false,
        borderWidth: 0,
        innerSize: '60%',
      },
    },
    series: [
      {
        name: 'Categorias',
        type: 'pie',
        data: [
          { name: 'Moradia',     y: 40, color: '#38bdf8' },
          { name: 'Alimentação', y: 20, color: '#e879f9' },
          { name: 'Transporte',  y: 15, color: '#10b981' },
          { name: 'Compras',     y: 15, color: '#f59e0b' },
          { name: 'Lazer',       y: 10, color: '#ef4444' },
        ],
      },
    ],
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />
}
