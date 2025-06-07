"use client"

import { useEffect, useRef } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { convertTemp } from "@/lib/utils"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface TemperatureChartProps {
  data: number[]
  isCelsius: boolean
  targetTemp: number
  compact?: boolean
}

export function TemperatureChart({ data, isCelsius, targetTemp, compact = false }: TemperatureChartProps) {
  const chartRef = useRef<ChartJS<"line">>(null)

  // Convert data if needed
  const displayData = isCelsius ? data : data.map((temp) => convertTemp(temp, false))

  // Create labels for the last 15 minutes (assuming data points are 1 minute apart)
  const labels = Array.from({ length: data.length }, (_, i) => {
    const minutesAgo = data.length - 1 - i
    return minutesAgo === 0 ? "now" : `-${minutesAgo}m`
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: "Temperature",
        data: displayData,
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Target",
        data: Array(data.length).fill(targetTemp),
        borderColor: "rgba(239, 68, 68, 0.7)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: !compact,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.5)",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: compact ? 3 : 5,
        },
      },
      y: {
        display: !compact,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.5)",
        },
      },
    },
    elements: {
      point: {
        radius: compact ? 0 : 2,
        hoverRadius: compact ? 3 : 5,
      },
    },
  }

  // Update chart when temperature unit changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update()
    }
  }, [isCelsius, targetTemp])

  return <Line ref={chartRef} data={chartData} options={options} />
}
