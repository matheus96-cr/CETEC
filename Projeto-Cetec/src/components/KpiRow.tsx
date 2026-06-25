/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Users, 
  Cpu, 
  Film, 
  BookOpen, 
  Trophy, 
  GraduationCap 
} from 'lucide-react';
import { UtecMetric } from '../types';

interface KpiRowProps {
  utecs: UtecMetric[];
}

export default function KpiRow({ utecs }: KpiRowProps) {
  // Compute totals from our current list
  const activeListCount = utecs.length;
  const totalUnidadesList = utecs.reduce((sum, item) => sum + item.unidades, 0);
  const totalEstudantesList = utecs.reduce((sum, item) => sum + item.estudantes, 0);
  const totalLctList = utecs.reduce((sum, item) => sum + item.lct, 0);
  const totalRobList = utecs.reduce((sum, item) => sum + item.rob, 0);
  const totalCineList = utecs.reduce((sum, item) => sum + item.cine, 0);
  const totalFcdList = utecs.reduce((sum, item) => sum + item.fcd, 0);
  const totalRevList = utecs.reduce((sum, item) => sum + item.rev, 0);

  // Baselines computed to match the exact Figma metrics initially
  // Initial UTECs: UNIDADES=10, ESTUDANTES=8048, LCT=9, ROB=5, CINE=5, FCD=9, REV=4
  // Target initial KPI metrics: UNIDADES=256, ESTUDANTES=84.5k (84531), LCT=198, ROB=142, CINE=89, FCD=167, PREMIADOS=23
  const baseUnidades = 246; // 246 + 10 = 256
  const baseEstudantes = 76483; // 76483 + 8048 = 84531
  const baseLct = 189; // 189 + 9 = 198
  const baseRob = 137; // 137 + 5 = 142
  const baseCine = 84; // 84 + 5 = 89
  const baseFcd = 158; // 158 + 9 = 167
  const baseRev = 19; // 19 + 4 = 23

  const kpis = [
    {
      title: 'UNIDADES',
      value: (baseUnidades + totalUnidadesList).toString(),
      subtext: `${83 + activeListCount} Ativas`, // Starts at 88 (83 + 5 initial)
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50',
      icon: Building2,
    },
    {
      title: 'ESTUDANTES',
      value: `${((baseEstudantes + totalEstudantesList) / 1000).toFixed(1)}k`, // Starts at 84.5k
      subtext: 'registros ativos',
      textColor: 'text-violet-600',
      borderColor: 'border-violet-500',
      bgColor: 'bg-violet-50',
      icon: Users,
    },
    {
      title: 'LAB LCT',
      value: (baseLct + totalLctList).toString(),
      subtext: `${Math.round(((baseLct + totalLctList) / 264) * 100)}% cap.`, // Starts at 75%
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-500',
      bgColor: 'bg-emerald-50',
      icon: GraduationCap,
    },
    {
      title: 'ROBÓTICA',
      value: (baseRob + totalRobList).toString(),
      subtext: `${Math.round(((baseRob + totalRobList) / 222) * 100)}% cap.`, // Starts at 64%
      textColor: 'text-amber-500',
      borderColor: 'border-amber-500',
      bgColor: 'bg-amber-50',
      icon: Cpu,
    },
    {
      title: 'CINECLUBE',
      value: (baseCine + totalCineList).toString(),
      subtext: `${Math.round(((baseCine + totalCineList) / 234) * 100)}% cap.`, // Starts at 38%
      textColor: 'text-pink-600',
      borderColor: 'border-pink-500',
      bgColor: 'bg-pink-50',
      icon: Film,
    },
    {
      title: 'FORMAÇÃO EFEC. DIG.',
      value: (baseFcd + totalFcdList).toString(),
      subtext: `${Math.round(((baseFcd + totalFcdList) / 298) * 100)}% cap.`, // Starts at 56%
      textColor: 'text-teal-600',
      borderColor: 'border-teal-500',
      bgColor: 'bg-teal-50',
      icon: BookOpen,
    },
    {
      title: 'PREMIADOS',
      value: (baseRev + totalRevList).toString(),
      subtext: `${(((baseRev + totalRevList) / (baseUnidades + totalUnidadesList)) * 100).toFixed(1)}% taxa`, // Starts at 8.5%
      textColor: 'text-amber-600',
      borderColor: 'border-amber-400',
      bgColor: 'bg-amber-50/70',
      icon: Trophy,
    },
  ];

  return (
    <div id="kpi-row-grid" className="grid grid-cols-2 lg:grid-cols-7 gap-2.5">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            id={`kpi-card-${index}`}
            key={kpi.title}
            style={{ borderBottomColor: kpi.borderColor.includes('-') ? undefined : kpi.borderColor }}
            className={`flex flex-col justify-between p-3 bg-white dark:bg-[#111827] rounded-xl shadow-xs border-b-2 ${kpi.borderColor} dark:border-b-blue-650 hover:shadow-xs transition-all duration-300 transform hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between gap-1 animate-fade-in">
              <span className="text-[9px] font-black tracking-wide text-slate-400 dark:text-slate-500 uppercase truncate">
                {kpi.title}
              </span>
              <div className={`p-1 rounded-md ${kpi.bgColor} dark:bg-slate-800/80 ${kpi.textColor} dark:text-slate-300 flex-shrink-0`}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              </div>
            </div>
            
            <div className="mt-1.5">
              <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                {kpi.value}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 whitespace-nowrap">
                {kpi.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
