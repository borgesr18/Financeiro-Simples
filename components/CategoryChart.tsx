'use client'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
// Módulo de acessibilidade p/ remover o warning do Highcharts
import accessibility from 'highcharts/modules/accessibility'

// Ativa o módulo apenas no cliente
if (typeof window !== 'undefined') {
  accessibility(Highcharts)
}

type Slice = { name: string; y: number; color?: string }

type Props = {
  /**
   * Dados do gráfico. Se não informado, usa um mock simpático
   * (mesmas cores do seu design).
   */
  data?: Slice[]
  /**
   * Título opcional para a legenda/tooltip.
   */
  seriesName?: string
}

export default function CategoryChart({
  data,
  seriesName = 'Categorias',
}: Props) {
  const fallback: Slice[] = [
    { name: 'Housing',         y: 40, color: '#38bdf8' }, // primary-400
    { name: 'Food',            y: 20, color: '#e879f9' }, // secondary-400
    { name: 'Transportation',  y: 15, color: '#10b981' }, // success
    { name: 'Shopping',        y: 15, color: '#f59e0b' }, // warning
    { name: 'Entertainment',   y: 10, color: '#ef4444' }, // danger
  ]

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      style: { fontFamily: 'Inter, sans-serif' },
    },
    title: { text: null },
    credits: { enabled: false },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
    },
    accessibility: {
      enabled: true, // módulo carregado acima
      point: { valueSuffix: '%' },
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
        // Tipar a série como 'pie' para o TS aceitar opções específicas
        type: 'pie',
        name: seriesName,
        data: (data && data.length ? data : fallback) as Highcharts.PointOptionsObject[],
      },
    ],
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />
}

