/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { UtecMetric } from '../types';

interface UtecChartsProps {
  utecs: UtecMetric[];
}

export default function UtecCharts({ utecs }: UtecChartsProps) {
  // 1. Map data for the Grouped Bar Chart
  const barChartData = utecs.map((utec) => ({
    name: utec.name,
    'Lab. LCT': utec.lct,
    'Robótica': utec.rob,
    'Cineclube': utec.cine,
    'Form. Digital': utec.fcd,
  }));

  // 2. Map data for the Donut Chart (Distribuição Regional)
  // Calculate students by regional to output realistic ratios
  const regionalGroups: { [key: string]: number } = {};
  utecs.forEach((utec) => {
    regionalGroups[utec.regional] = (regionalGroups[utec.regional] || 0) + utec.estudantes;
  });

  // Baselines for unlisted other regional units to perfectly sum up to the Figma numbers initially
  // Figma target initial percentages: Regional 1 (23%), Regional 2 (24%), Regional 3 (18%), Regional 4 (20%), Regional 5 (15%)
  // Sum = 100%. Total students is around 84.5k.
  const baselineRegionalStudents: { [key: string]: number } = {
    'Regional 1': 17947,
    'Regional 2': 18322,
    'Regional 3': 13725,
    'Regional 4': 15365,
    'Regional 5': 11093,
  };

  const donutData = Object.keys(baselineRegionalStudents).map((reg) => {
    const listEstudantes = regionalGroups[reg] || 0;
    const totalEstudantes = baselineRegionalStudents[reg] + listEstudantes;
    return {
      name: reg,
      value: totalEstudantes,
    };
  });

  const totalAllStudents = donutData.reduce((sum, item) => sum + item.value, 0);

  // Colors mapping strictly from Figma schema:
  // Regional 1: Blue, Regional 2: Violet, Regional 3: Green, Regional 4: Orange, Regional 5: Deep Pink
  const regionalColors = [
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EC4899', // Deep Pink
  ];

  const barColors = {
    'Lab. LCT': '#10B981',     // Green
    'Robótica': '#F59E0B',     // Orange
    'Cineclube': '#EC4899',    // Pink
    'Form. Digital': '#14B8A6' // Teal
  };

  // State to support chart highlighting / animations
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);

  // Custom tooltips for elegant dark styling matching high-quality craftsmanship
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div id="chart-tooltip" className="bg-slate-900/95 text-white p-3 rounded-lg border border-slate-800 shadow-xl text-xs backdrop-blur-xs">
          <p className="font-bold border-b border-slate-700/50 pb-1 mb-2 text-slate-300">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-slate-400 font-medium">{entry.name}:</span>
                <span className="font-extrabold text-white ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalAllStudents) * 100).toFixed(1);
      return (
        <div id="donut-tooltip" className="bg-slate-900/95 text-white p-3 rounded-lg border border-slate-800 shadow-xl text-xs backdrop-blur-xs">
          <p className="font-bold text-slate-300 mb-1">{data.name}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill || '#4B39EF' }} />
            <span className="text-slate-400">Estudantes:</span>
            <span className="font-extrabold text-white">{data.value.toLocaleString('pt-BR')}</span>
          </div>
          <p className="text-emerald-400 font-bold border-t border-slate-700/50 mt-1.5 pt-1 text-right text-[11px]">
            {percentage}% de participação
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="charts-layout-grid" className="grid grid-cols-1 lg:grid-cols-7 gap-4">
      {/* 1. Bar Chart: Indicadores por UTEC (5 Columns on Desktop) */}
      <div id="bar-chart-card" className="col-span-1 lg:col-span-5 bg-white dark:bg-[#111827] rounded-xl p-4.5 shadow-xs border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Indicadores por UTEC</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium font-sans">Arraste para os lados para visualizar todos as 14 UTECs cadastradas</p>
          </div>
          {/* Custom Legend to mimic Figma styling perfectly */}
          <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex-wrap">
            {Object.entries(barColors).map(([lab, color]) => (
              <div key={lab} className="flex items-center gap-1">
                <span className="w-2 rounded-full h-2 flex-shrink-0" style={{ backgroundColor: color }} />
                <span>{lab}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full overflow-x-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent animate-fade-in" id="bar-chart-container-scroll-area">
          <div style={{ width: '1350px', height: '240px' }} id="bar-chart-container-horizontal-scroll">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 12, right: 10, left: -25, bottom: 5 }}
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 10, fontWeight: '700' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 10, fontWeight: '600' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F59E0B', opacity: 0.05 }} />
                <Bar dataKey="Lab. LCT" fill={barColors['Lab. LCT']} radius={[3, 3, 0, 0]} maxBarSize={11} />
                <Bar dataKey="Robótica" fill={barColors['Robótica']} radius={[3, 3, 0, 0]} maxBarSize={11} />
                <Bar dataKey="Cineclube" fill={barColors['Cineclube']} radius={[3, 3, 0, 0]} maxBarSize={11} />
                <Bar dataKey="Form. Digital" fill={barColors['Form. Digital']} radius={[3, 3, 0, 0]} maxBarSize={11} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Donut Chart: Distribuição Regional (2 Columns on Desktop) */}
      <div id="donut-chart-card" className="col-span-1 lg:col-span-2 bg-white dark:bg-[#111827] rounded-xl p-4.5 shadow-xs border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Distribuição Regional</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-450 font-medium font-sans">Adesão de estudantes por macrorregional</p>
        </div>

        <div className="relative flex flex-col items-center justify-center flex-1 py-1">
          <div className="h-[155px] w-full relative" id="donut-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, idx) => setActiveDonutIndex(idx)}
                  onMouseLeave={() => setActiveDonutIndex(null)}
                >
                  {donutData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={regionalColors[index % regionalColors.length]} 
                      opacity={activeDonutIndex === null || activeDonutIndex === index ? 1 : 0.45}
                      stroke={activeDonutIndex === index ? 'rgba(255, 255, 255, 0.8)' : 'transparent'}
                      strokeWidth={activeDonutIndex === index ? 2 : 0}
                      style={{
                        transition: 'all 0.25s ease-in-out',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomDonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total / Indicator */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-4px] transition-all duration-200 origin-center ${activeDonutIndex !== null ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">ESTUDANTES</span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                {((totalAllStudents) / 1000).toFixed(1)}k
              </span>
              <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.25 mt-0.5 rounded-full">
                Ativos
              </span>
            </div>
          </div>

          {/* Color Indicators Grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full mt-2 border-t border-slate-50 dark:border-slate-800 pt-2">
            {donutData.map((item, index) => {
              const pct = ((item.value / totalAllStudents) * 100).toFixed(0);
              const color = regionalColors[index % regionalColors.length];
              const isHovered = activeDonutIndex === index;
              return (
                <div 
                  id={`donut-indicator-${index}`}
                  key={item.name} 
                  className={`flex items-center justify-between p-1 rounded-md transition-all duration-200 cursor-pointer ${isHovered ? 'bg-slate-100 dark:bg-slate-800 shadow-xs scale-[1.01]' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/40'}`}
                  onMouseEnter={() => setActiveDonutIndex(index)}
                  onMouseLeave={() => setActiveDonutIndex(null)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-350 font-mono ml-1.5 flex-shrink-0">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
