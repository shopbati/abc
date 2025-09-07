import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface MonthlyActivityChartProps {
  data: {
    labels: string[];
    incoming: number[];
    outgoing: number[];
    commissions: number[];
  };
}

declare global {
  interface Window {
    Chart: any;
  }
}

const MonthlyActivityChart: React.FC<MonthlyActivityChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;

    const ctx = chartRef.current.getContext('2d');
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const isDark = theme === 'dark';
    const textColor = isDark ? '#E5E7EB' : '#374151';
    const gridColor = isDark ? '#374151' : '#E5E7EB';

    chartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Virements Reçus',
            data: data.incoming,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1
          },
          {
            label: 'Virements Envoyés',
            data: data.outgoing,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1
          },
          {
            label: 'Commissions',
            data: data.commissions,
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            borderColor: 'rgb(249, 115, 22)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              color: textColor
            }
          },
          title: {
            display: true,
            text: 'Activité Mensuelle',
            color: textColor
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColor
            },
            grid: {
              color: gridColor
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              callback: function(value: any) {
                return new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0
                }).format(value);
              }
            },
            grid: {
              color: gridColor
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, theme]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
      <div className="h-80">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default MonthlyActivityChart;