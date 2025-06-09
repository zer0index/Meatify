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
import { mergeHistoryForChart, getChartData } from "@/lib/historyUtils"
import type { TemperatureReading } from "@/lib/types"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface TemperatureChartProps {
  data: number[] // Live sensor data from API (ephemeral)
  sessionHistory?: TemperatureReading[] // Persistent session history
  isCelsius: boolean
  targetTemp: number
  compact?: boolean
}

export function TemperatureChart({ 
  data, 
  sessionHistory = [], 
  isCelsius, 
  targetTemp, 
  compact = false 
}: TemperatureChartProps) {
  const chartRef = useRef<ChartJS<"line">>(null)

  // Merge live sensor data with persistent session history
  const mergedHistory = mergeHistoryForChart(data, sessionHistory)
  const { temperatures, labels } = getChartData(mergedHistory)

  // Convert temperature data if needed
  const displayData = isCelsius ? temperatures : temperatures.map((temp) => convertTemp(temp, false))
  const displayTargetTemp = isCelsius ? targetTemp : convertTemp(targetTemp, false)

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
        data: Array(displayData.length).fill(displayTargetTemp),
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
