/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Building, 
  MapPin, 
  Search, 
  GraduationCap, 
  RotateCcw,
  Cpu,
  Video,
  Database,
  Users,
  ChevronRight,
  Layers,
  HelpCircle
} from 'lucide-react';
import { EducationalUnit, UtecMetric } from '../types';
import { INITIAL_EDUCATIONAL_UNITS } from '../data';

interface EducationalUnitsDashboardProps {
  utecs: UtecMetric[];
}

export default function EducationalUnitsDashboard({ utecs }: EducationalUnitsDashboardProps) {
  // Filters state
  const [selectedUtecId, setSelectedUtecId] = useState<string>('all');
  const [selectedRegional, setSelectedRegional] = useState<string>('all');
  const [selectedRpa, setSelectedRpa] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract all RPAs and Regionals for filter dropdowns automatically
  const rpaOptions = useMemo(() => {
    // Collect unique RPAs from units
    const rpas = new Set<string>();
    INITIAL_EDUCATIONAL_UNITS.forEach(u => {
      if (u.rpa_escola) rpas.add(u.rpa_escola);
    });
    return Array.from(rpas).sort();
  }, []);

  const regionalOptions = useMemo(() => {
    // Collect unique regionals from UTECs
    const regionals = new Set<string>();
    utecs.forEach(u => {
      if (u.regional) regionals.add(u.regional);
    });
    return Array.from(regionals).sort();
  }, [utecs]);

  // Clean values for lookup
  const utecLookup = useMemo(() => {
    const map = new Map<string, UtecMetric>();
    utecs.forEach(u => map.set(u.id, u));
    return map;
  }, [utecs]);

  // Filter educational units dynamically
  const filteredUnits = useMemo(() => {
    return INITIAL_EDUCATIONAL_UNITS.filter(unit => {
      // 1. Filter by Support UTEC
      if (selectedUtecId !== 'all' && unit.id_utec_suporte !== selectedUtecId) {
        return false;
      }

      // 2. Filter by RPA
      if (selectedRpa !== 'all' && unit.rpa_escola !== selectedRpa) {
        return false;
      }

      // 3. Filter by Regional (needs looking up the support UTEC regional)
      if (selectedRegional !== 'all') {
        const matchingUtec = utecLookup.get(unit.id_utec_suporte);
        if (!matchingUtec || matchingUtec.regional !== selectedRegional) {
          return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = unit.nome_unidade.toLowerCase().includes(query);
        const matchesInep = unit.inep_escola.includes(query);
        const matchesAddress = unit.endereco.toLowerCase().includes(query);
        if (!matchesName && !matchesInep && !matchesAddress) {
          return false;
        }
      }

      return true;
    });
  }, [selectedUtecId, selectedRegional, selectedRpa, searchQuery, utecLookup]);

  // Computed summary metric totals for current filtered selection
  const totals = useMemo(() => {
    let students = 0;
    let lct = 0;
    let cineclube = 0;
    let robotica = 0;

    filteredUnits.forEach(u => {
      students += u.qtd_estudantes || 0;
      lct += u.qtd_lct || 0;
      cineclube += u.qtd_cineclube || 0;
      robotica += u.qtd_robotica || 0;
    });

    return {
      schoolCount: filteredUnits.length,
      students,
      lct,
      cineclube,
      robotica
    };
  }, [filteredUnits]);

  // Reset all filters easily
  const handleResetFilters = () => {
    setSelectedUtecId('all');
    setSelectedRegional('all');
    setSelectedRpa('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6" id="educational-units-dashboard-view">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-[#1E40AF] dark:text-blue-400" />
            Indicadores por Unidade de Ensino
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Monitoramento de laboratórios, robótica e cineclubes diretamente nas escolas e creches do Recife
          </p>
        </div>

        {/* Quick action or guide */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 self-start md:self-auto">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span>Filtros Cruzados Acoplados</span>
        </div>
      </div>

      {/* Modern Filter Control Bar Component */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 shadow-xs border border-slate-100 dark:border-slate-800/80">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2.5 pl-0.5">
          Filtros de Pesquisa e Agrupamento
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* UTEC Filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block pl-1">UTEC de Suporte</span>
            <select
              value={selectedUtecId}
              onChange={(e) => setSelectedUtecId(e.target.value)}
              className="w-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-[#1E40AF] focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all cursor-pointer"
              id="filter-select-utec"
            >
              <option value="all">Todas as UTECs ({utecs.length})</option>
              {utecs.map(u => (
                <option key={u.id} value={u.id}>{u.name} - Coor. {u.coordinator.split(' ')[0]}</option>
              ))}
            </select>
          </div>

          {/* Regional Filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block pl-1">Região Administrativa</span>
            <select
              value={selectedRegional}
              onChange={(e) => setSelectedRegional(e.target.value)}
              className="w-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-[#1E40AF] focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all cursor-pointer"
              id="filter-select-regional"
            >
              <option value="all">Todas as Regionais ({regionalOptions.length})</option>
              {regionalOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* RPA Filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block pl-1">RPA Escola</span>
            <select
              value={selectedRpa}
              onChange={(e) => setSelectedRpa(e.target.value)}
              className="w-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-[#1E40AF] focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all cursor-pointer"
              id="filter-select-rpa"
            >
              <option value="all">Todas as RPAs ({rpaOptions.length})</option>
              {rpaOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Text Search Input */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block pl-1">Pesquisar por Nome/Inep</span>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Severina Lira ou INEP..."
                className="w-full text-xs font-bold text-slate-700 dark:text-slate-250 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:border-[#1E40AF] focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                id="filter-input-search"
              />
              <Search className="w-3.5 h-3.5 text-slate-450 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        {/* Clear and filter status info footer */}
        <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-slate-50 dark:border-slate-800/60 text-[11px] font-bold text-slate-400">
          <span>
            Exibindo <strong className="text-slate-700 dark:text-blue-400">{filteredUnits.length}</strong> de <strong className="text-slate-600 dark:text-slate-500">{INITIAL_EDUCATIONAL_UNITS.length}</strong> unidades de ensino
          </span>

          {(selectedUtecId !== 'all' || selectedRegional !== 'all' || selectedRpa !== 'all' || searchQuery.trim() !== '') && (
            <button
              onClick={handleResetFilters}
              id="btn-reset-filters"
              className="flex items-center gap-1 text-[#1E40AF] dark:text-blue-400 hover:underline transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats cards dynamically calculated and updated according to active filter selection */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" id="units-kpis-grid">
        {/* Total Schools */}
        <div className="p-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80">
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Escolas Encontradas</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-850 dark:text-slate-100">{totals.schoolCount}</span>
            <span className="text-[10px] text-slate-450">unidades</span>
          </div>
        </div>

        {/* Total Students */}
        <div className="p-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80">
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Alunos Beneficiados</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-850 dark:text-slate-100">
              {totals.students.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-slate-450">total</span>
          </div>
        </div>

        {/* Total LCT Labs */}
        <div className="p-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80">
          <span className="text-[8px] font-black text-[#10B981] dark:text-emerald-400 uppercase tracking-widest block mb-1">Salas ou Lab. LCT</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-850 dark:text-slate-100">{totals.lct}</span>
            <span className="text-[10px] text-emerald-500 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded">Instalados</span>
          </div>
        </div>

        {/* Total Robotics Groups */}
        <div className="p-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80">
          <span className="text-[8px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest block mb-1">Cineclubes Ativos</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-850 dark:text-slate-100">{totals.cineclube}</span>
            <span className="text-[10px] text-pink-650 font-extrabold bg-pink-50 dark:bg-pink-950/20 px-1 rounded">Grupos</span>
          </div>
        </div>

        {/* Total Robotics */}
        <div className="p-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80 col-span-2 md:col-span-1">
          <span className="text-[8px] font-black text-[#F59E0B] dark:text-amber-400 uppercase tracking-widest block mb-1">Clubes de Robótica</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-850 dark:text-slate-100">{totals.robotica}</span>
            <span className="text-[10px] text-amber-650 font-extrabold bg-amber-50 dark:bg-amber-950/20 px-1 rounded">Equipes</span>
          </div>
        </div>
      </div>

      {/* Main interactive grid and details */}
      {filteredUnits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="educational-units-cards-grid">
          {filteredUnits.map((unit) => {
            const supportUtec = utecLookup.get(unit.id_utec_suporte);
            return (
              <div 
                key={unit.inep_escola}
                className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-150 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200 relative group overflow-hidden"
              >
                {/* Tech bar accent on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E40AF] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-3.5">
                  {/* Top line with support UTEC and regional info */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-55 dark:border-slate-800/60 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-950/40 text-[#1E40AF] dark:text-blue-400 px-2.5 py-0.75 rounded-full uppercase">
                        {supportUtec ? supportUtec.name : 'Sem Utec'}
                      </span>
                      <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.75 rounded-full uppercase">
                        {unit.rpa_escola}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                      INEP: {unit.inep_escola}
                    </span>
                  </div>

                  {/* School name & type details */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-[#1E40AF] dark:group-hover:text-blue-400 transition-colors line-clamp-1 leading-snug">
                      {unit.nome_unidade}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{unit.tipo_unidade}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{unit.modalidade_ensino}</span>
                    </div>
                  </div>

                  {/* Metadata fields (Alunos e Endereço) */}
                  <div className="space-y-2 border-t border-b border-slate-50 dark:border-slate-800/40 py-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550">Alunos Matriculados:</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-extrabold text-slate-700 dark:text-slate-350">{unit.qtd_estudantes}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start gap-3">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 flex-shrink-0 mt-0.5">Endereço:</span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-right leading-tight max-w-[190px] truncate-3-lines" title={unit.endereco}>
                        {unit.endereco}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550">Regional de Atuação:</span>
                      <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                        {supportUtec ? supportUtec.regional : 'Não Definido'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Resources Indicator row - Highly polished */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-1">
                  {/* LCT Resource Item */}
                  <div className="py-2.5 px-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 rounded-xl text-center space-y-0.5">
                    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">LCT Lab</span>
                    <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 font-mono block">
                      {unit.qtd_lct}
                    </span>
                    <span className="text-[8px] text-emerald-550 dark:text-emerald-500 font-bold block leading-none">
                      {unit.qtd_lct === 0 ? 'Nenhum' : unit.qtd_lct === 1 ? 'Instalado' : 'Instalados'}
                    </span>
                  </div>

                  {/* Cineclube Resource Item */}
                  <div className="py-2.5 px-2 bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100/60 dark:border-pink-900/30 rounded-xl text-center space-y-0.5">
                    <span className="text-[8px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-wider block">Cineclube</span>
                    <span className="text-sm font-black text-pink-800 dark:text-pink-300 font-mono block">
                      {unit.qtd_cineclube}
                    </span>
                    <span className="text-[8px] text-pink-550 dark:text-pink-500 font-bold block leading-none">
                      {unit.qtd_cineclube === 0 ? 'Inativo' : unit.qtd_cineclube === 1 ? 'Ativo' : 'Ativos'}
                    </span>
                  </div>

                  {/* Robótica Resource Item */}
                  <div className="py-2.5 px-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/60 dark:border-amber-900/30 rounded-xl text-center space-y-0.5">
                    <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Robótica</span>
                    <span className="text-sm font-black text-amber-800 dark:text-amber-300 font-mono block">
                      {unit.qtd_robotica}
                    </span>
                    <span className="text-[8px] text-amber-550 dark:text-amber-500 font-bold block leading-none">
                      {unit.qtd_robotica === 0 ? 'Sem grupo' : unit.qtd_robotica === 1 ? 'Grupo' : 'Grupos'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3" id="units-no-data-card">
          <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto animate-bounce" />
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">Nenhuma Unidade de Ensino Encontrada</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed max-w-sm mx-auto">
              Nenhuma escola ou creche municipal atende aos filtros cruzados selecionados no momento. Tente expandir ou redefinir seus filtros.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-black text-[#1E40AF] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 px-4 py-2 rounded-xl hover:bg-blue-100/60 transition-colors"
          >
            Redefinir Filtros
          </button>
        </div>
      )}
    </div>
  );
}
