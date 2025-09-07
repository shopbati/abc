import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface TransferStatusPieChartProps {
  data: {
    completed: number;
    pending: number;
    failed: number;
  };
}

declare global {
  interface Window {
    Chart: any;
  }
}

const TransferStatusPieChart: React.FC<TransferStatusPieChartProps> = ({ data }) => {
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

    const total = data.completed + data.pending + data.failed;
    if (total === 0) return;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#E5E7EB' : '#374151';

    chartInstance.current = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Terminés', 'En Attente', 'Échoués'],
        datasets: [{
          data: [data.completed, data.pending, data.failed],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(249, 115, 22)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              color: textColor
            }
          },
          title: {
            display: true,
            text: 'Statut des Virements',
            color: textColor
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const value = context.parsed;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
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

export default TransferStatusPieChart;