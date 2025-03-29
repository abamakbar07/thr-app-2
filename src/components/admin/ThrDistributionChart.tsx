'use client';

import { useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';

interface DailyDistribution {
  date: string;
  total: number;
  count: number;
}

interface ThrDistributionChartProps {
  dailyData: DailyDistribution[];
}

export default function ThrDistributionChart({ dailyData }: ThrDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || dailyData.length === 0) return;

    // Get maximum values for scaling
    const maxTotal = Math.max(...dailyData.map(d => d.total));
    const chartHeight = 150; // Fixed height for the chart

    // Clear any existing chart
    const chartContainer = chartRef.current;
    chartContainer.innerHTML = '';

    // Create chart container
    const chart = document.createElement('div');
    chart.className = 'flex items-end justify-between h-[150px] w-full';
    
    // Create bars and labels for each day
    dailyData.forEach((day) => {
      const barHeight = Math.max(20, (day.total / maxTotal) * chartHeight);
      
      // Create container for each day
      const dayContainer = document.createElement('div');
      dayContainer.className = 'flex flex-col items-center';
      
      // Format date
      const formattedDate = new Date(day.date).toLocaleDateString('default', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      // Create tooltip content
      const tooltipContent = `${day.count} redemptions: ${formatCurrency(day.total)}`;
      
      // Create bar
      const bar = document.createElement('div');
      bar.className = 'bg-[#128C7E] w-8 hover:bg-[#0e6b5e] transition-colors cursor-default rounded-t-sm';
      bar.style.height = `${barHeight}px`;
      bar.title = tooltipContent;
      
      // Add hover effect tooltip
      bar.setAttribute('data-tooltip', tooltipContent);
      
      // Create date label
      const dateLabel = document.createElement('div');
      dateLabel.className = 'text-xs text-gray-500 mt-1';
      dateLabel.textContent = formattedDate;
      
      // Assemble
      dayContainer.appendChild(bar);
      dayContainer.appendChild(dateLabel);
      chart.appendChild(dayContainer);
    });
    
    // Add the chart to the container
    chartContainer.appendChild(chart);
  }, [dailyData]);

  if (dailyData.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No distribution data available for the selected time period.
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm font-medium text-gray-500 mb-3">Daily Distribution (Last 7 Days)</div>
      <div ref={chartRef} className="w-full"></div>
    </div>
  );
} 