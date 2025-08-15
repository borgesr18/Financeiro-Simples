'use client'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

type CategoryDatum = { name: string; y: number; color?: string }

type Props = {
  data?: CategoryDatum[]
  title?: string
}

const fallbackData: CategoryDatum[] = [
  { name: 'Moradia', y: 40, color: '#38bdf8' },
  { name: 'Alimentação', y: 20, color: '#e879f9' },
  { name: 'Transporte', y: 15, color: '#10b981' },
  { name: 'Compras', y: 15, color: '#f59e0b' },
  { name: 'Lazer', y: 10, color: '#ef4444' },
]

export default function CategoryChart({ data, title }: Props) {
  const seriesData = (data && data.length ? data : fallbackData) as Highcharts.PointOptionsObject[]

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      style: { fontFamily: 'Inter, sans-serif' },
    },
    title: { text: title ?? '' }, // <- nada de null aqui
    credits: { enabled: false },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
    },
    accessibility: {
      // Evita o warning no console sem precisar importar o módulo de accessibility
      enabled: false,
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        showInLegend: false,
        borderWidth: 0,
        innerSize: '60%', // donut
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Categorias',
        data: seriesData,
      },
    ],
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />
}
