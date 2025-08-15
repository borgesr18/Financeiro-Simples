'use client'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import Accessibility from 'highcharts/modules/accessibility'
import { useMemo } from 'react'
Accessibility(Highcharts)

export default function CategoryChart({ data }: { data: { name: string; y: number }[] }) {
  const options = useMemo(() => ({
    chart: { type: 'pie', backgroundColor: 'transparent', style: { fontFamily: 'Inter, sans-serif' } },
    title: { text: null },
    credits: { enabled: false },
    tooltip: { pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>' },
    accessibility: { point: { valueSuffix: '%' }, enabled: true },
    plotOptions: {
      pie: {
        innerSize: '60%',
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        showInLegend: false,
        borderWidth: 0,
      }
    },
    series: [{
      name: 'Categorias',
      type: 'pie' as const,
      data,
    }],
  }), [data])

  return <HighchartsReact highcharts={Highcharts} options={options} />
}

