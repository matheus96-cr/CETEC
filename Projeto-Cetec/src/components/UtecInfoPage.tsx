/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  X,
  HelpCircle,
  AlertCircle,
  Building,
  Check,
  ChevronRight,
  Sparkles,
  Layers,
  Sliders,
  GraduationCap,
  Cpu,
  Film
} from 'lucide-react';
import { UtecMetric, EducationalUnit } from '../types';
import { REGIONALS, INITIAL_EDUCATIONAL_UNITS } from '../data';

interface UtecInfoPageProps {
  utecs: UtecMetric[];
}

// Recife Administrative Architecture Mapping Helpers
export function getUtecPhysicalRpa(utecId: string): string {
  const mapping: Record<string, string> = {
    'utec-1': 'RPA 1',
    'utec-2': 'RPA 3', // Physically in RPA 3, supports schools in Regional 1 (which are in RPA 2)
    'utec-3': 'RPA 3',
    'utec-4': 'RPA 4',
    'utec-5': 'RPA 5',
    'utec-6': 'RPA 2',
    'utec-7': 'RPA 3',
    'utec-8': 'RPA 4',
    'utec-9': 'RPA 5',
    'utec-10': 'RPA 1',
    'utec-11': 'RPA 2',
    'utec-12': 'RPA 3',
    'utec-13': 'RPA 4',
    'utec-14': 'RPA 5',
  };
  return mapping[utecId] || 'RPA 1';
}

export function getUtecViceCoordinator(utecId: string): string {
  const mapping: Record<string, string> = {
    'utec-1': 'Juliana Costa',
    'utec-2': 'Renato Silva',
    'utec-3': 'Fernanda Oliveira',
    'utec-4': 'Luiz Ramos',
    'utec-5': 'Roberto Cavalcanti',
    'utec-6': 'Beatriz Souza',
    'utec-7': 'Guilherme Santos',
    'utec-8': 'Isabela Moreira',
    'utec-9': 'Sandro Pontes',
    'utec-10': 'Camila Vasconcelos',
    'utec-11': 'Felipe Albuquerque',
    'utec-12': 'Larissa Mendes',
    'utec-13': 'Daniel Rocha',
    'utec-14': 'Sofia Ferreira',
  };
  return mapping[utecId] || 'Não cadastrado';
}

export function getRegionalComposition(regional: string): string {
  const mapping: Record<string, string> = {
    'Regional 1': 'RPA 1 e RPA 2',
    'Regional 2': 'RPA 3',
    'Regional 3': 'RPA 4',
    'Regional 4': 'RPA 5',
    'Regional 5': 'RPA 6',
  };
  return mapping[regional] || regional;
}

export function getRegionalByRpa(rpa: string): string {
  const mapping: Record<string, string> = {
    'RPA 1': 'Regional 1',
    'RPA 2': 'Regional 1',
    'RPA 3': 'Regional 2',
    'RPA 4': 'Regional 3',
    'RPA 5': 'Regional 4',
    'RPA 6': 'Regional 5',
    'RPA1': 'Regional 1',
    'RPA2': 'Regional 1',
    'RPA3': 'Regional 2',
    'RPA4': 'Regional 3',
    'RPA5': 'Regional 4',
    'RPA6': 'Regional 5',
  };
  const normalized = rpa.toUpperCase().trim();
  return mapping[normalized] || 'Regional 1';
}

export default function UtecInfoPage({ utecs }: UtecInfoPageProps) {
  const [selectedUtecId, setSelectedUtecId] = useState<string>(utecs[0]?.id || 'utec-1');
  const [utecSearchQuery, setUtecSearchQuery] = useState('');
  const [selectedRegionalFilter, setSelectedRegionalFilter] = useState('Todas');
  
  // School search and filter inside the details panel
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<EducationalUnit | null>(null);

  const selectedUtec = useMemo(() => {
    return utecs.find(u => u.id === selectedUtecId) || utecs[0] || null;
  }, [utecs, selectedUtecId]);

  // Dynamically calculate what RPAs and Regionals each UTEC actually supports based on the school list
  const utecsWithDynamicScopes = useMemo(() => {
    return utecs.map((utec) => {
      const supportedSchools = INITIAL_EDUCATIONAL_UNITS.filter(
        (unit) => unit.id_utec_suporte === utec.id
      );
      const rpas = Array.from(new Set(supportedSchools.map((s) => s.rpa_escola))).sort();
      const regionals = Array.from(new Set(rpas.map((rpa) => getRegionalByRpa(rpa)))).sort();
      
      // Fallback to internal regional property if no schools exist
      if (regionals.length === 0) {
        regionals.push(utec.regional);
      }
      return {
        ...utec,
        dynamicRpas: rpas,
        dynamicRegionals: regionals,
      };
    });
  }, [utecs]);

  const selectedUtecDynamicScope = useMemo(() => {
    if (!selectedUtec) return { rpas: [], regionals: [] };
    const match = utecsWithDynamicScopes.find((u) => u.id === selectedUtec.id);
    return {
      rpas: match?.dynamicRpas || [],
      regionals: match?.dynamicRegionals || [selectedUtec.regional],
    };
  }, [selectedUtec, utecsWithDynamicScopes]);

  // Filtered list of UTECs for the selection sidebar
  const filteredUtecs = useMemo(() => {
    return utecsWithDynamicScopes.filter((utec) => {
      const vice = getUtecViceCoordinator(utec.id).toLowerCase();
      const matchesSearch = 
        utec.name.toLowerCase().includes(utecSearchQuery.toLowerCase()) ||
        utec.coordinator.toLowerCase().includes(utecSearchQuery.toLowerCase()) ||
        vice.includes(utecSearchQuery.toLowerCase());
      
      const matchesRegional = selectedRegionalFilter === 'Todas' || utec.dynamicRegionals.includes(selectedRegionalFilter);
      return matchesSearch && matchesRegional;
    });
  }, [utecsWithDynamicScopes, utecSearchQuery, selectedRegionalFilter]);

  // Map of UTEC ID to object for fast lookup
  const utecLookup = useMemo(() => {
    const map = new Map<string, UtecMetric>();
    utecs.forEach(u => map.set(u.id, u));
    return map;
  }, [utecs]);

  // Schools for display (only supported by active UTEC)
  const schoolsToDisplay = useMemo(() => {
    if (!selectedUtec) return [];
    return INITIAL_EDUCATIONAL_UNITS.filter(u => u.id_utec_suporte === selectedUtec.id);
  }, [selectedUtec]);

  // Filtered schools according to input
  const filteredSchools = useMemo(() => {
    return schoolsToDisplay.filter(school => {
      if (schoolSearchQuery.trim() === '') return true;
      const query = schoolSearchQuery.toLowerCase();
      return (
        school.nome_unidade.toLowerCase().includes(query) ||
        school.inep_escola.includes(query) ||
        school.endereco.toLowerCase().includes(query) ||
        school.rpa_escola.toLowerCase().includes(query)
      );
    });
  }, [schoolsToDisplay, schoolSearchQuery]);

  const handleSelectUtec = (utec: UtecMetric) => {
    setSelectedUtecId(utec.id);
    setSchoolSearchQuery('');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="info-tab-wrapper">
      
      {/* 2. Main Two-Column Panel */}
      <div id="utec-info-view-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (1/3 Width) - Center selector sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          
          {/* Header query panel */}
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#1E40AF]" />
              Painel de Busca de Centros
            </h3>
            
            {/* Search text inputs */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por UTEC, gestor ou vice-gestor..."
                value={utecSearchQuery}
                onChange={(e) => setUtecSearchQuery(e.target.value)}
                className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-[#1E40AF] focus:outline-hidden transition-all text-slate-700 dark:text-slate-100"
              />
            </div>

            {/* Regional drop filter */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block pl-1">Filtrar por Regional</label>
              <select
                value={selectedRegionalFilter}
                onChange={(e) => setSelectedRegionalFilter(e.target.value)}
                className="w-full text-xs font-bold px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-[#1E40AF] focus:outline-hidden text-slate-600 dark:text-slate-300"
              >
                <option value="Todas">Todas as Regionais ({REGIONALS.length})</option>
                {REGIONALS.map((reg) => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Centers */}
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 overflow-hidden flex-1 max-h-[580px] overflow-y-auto">
            {filteredUtecs.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUtecs.map((utec) => {
                  const isSelected = selectedUtec?.id === utec.id;
                  return (
                    <button
                      key={utec.id}
                      onClick={() => handleSelectUtec(utec)}
                      className={`w-full text-left py-2.5 px-3 transition-all duration-150 flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-blue-50/70 dark:bg-blue-950/20 border-l-4 border-l-[#1E40AF]' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex flex-col overflow-hidden pr-2 py-0.5">
                        <span className={`text-[11px] font-extrabold transition-colors ${
                          isSelected ? 'text-[#1E40AF] dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {utec.name}
                        </span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-300 dark:text-slate-500 transition-transform group-hover:translate-x-0.5 ${
                        isSelected ? 'text-[#1E40AF] dark:text-blue-400 translate-x-0.5' : ''
                      }`} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2 dark:text-slate-600" />
                <p className="text-xs font-bold">Nenhum Centro Cadastrado</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Refine ou limpe os termos de busca.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (2/3 Width) - Rich read-only profile dashboard */}
        <div className="lg:col-span-2">
          {selectedUtec ? (
            <div className="bg-white dark:bg-[#111827] rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 overflow-hidden">
              
              {/* Profile header with location context and regional architecture */}
              <div className="bg-[#EBF3FF] dark:bg-slate-800/40 p-4 px-5 border-b border-blue-200/60 dark:border-slate-800 relative">
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-100/45 dark:bg-slate-700/10 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 text-[9px] font-black text-[#1E40AF] dark:text-blue-300 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-800 rounded uppercase tracking-wider">
                        UTEC Sede Sênior
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-black bg-[#10B981]/10 text-emerald-800 dark:text-emerald-400 rounded uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                        Apenas Leitura
                      </span>
                    </div>
                    
                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{selectedUtec.name}</h2>
                    
                    {/* Compact representation of Sede Physical RPA and Dynamic Regionals & RPAs */}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/45 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        <div>
                          <span className="text-[7.5px] font-black text-slate-400 uppercase block leading-none">Sede</span>
                          <span className="font-extrabold text-[11px]">{getUtecPhysicalRpa(selectedUtec.id)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/45 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                        <Building className="w-3.5 h-3.5 text-[#1E40AF] flex-shrink-0" />
                        <div>
                          <span className="text-[7.5px] font-black text-slate-400 uppercase block leading-none">Atendimento</span>
                          <span className="font-extrabold text-[11px]">
                            {selectedUtecDynamicScope.regionals.join(', ')}
                            {selectedUtecDynamicScope.rpas.length > 0 && (
                              <span className="text-[9.5px] text-slate-400 dark:text-slate-550 font-semibold ml-1">
                                (RPAs: {selectedUtecDynamicScope.rpas.join(', ')})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Read-Only Profile Details */}
              <div className="p-4 space-y-4">
                               {/* Gestão e Atendimento Info Blocks - Compact rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Gestão Responsável */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-slate-800 text-[#1E40AF] dark:text-blue-400 flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
                        {selectedUtec.coordinator[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <span className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block leading-none">Gestor Responsável</span>
                        <h4 className="text-[11.5px] font-black text-slate-800 dark:text-slate-100 truncate leading-tight mt-0.5">{selectedUtec.coordinator}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 border-t border-slate-200/50 dark:border-slate-800 pt-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
                        {getUtecViceCoordinator(selectedUtec.id)[0]?.toUpperCase() || 'V'}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <span className="text-[7.5px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest block leading-none">Vice-Gestor</span>
                        <h4 className="text-[11.5px] font-black text-slate-800 dark:text-slate-100 truncate leading-tight mt-0.5">{getUtecViceCoordinator(selectedUtec.id)}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 border-t border-slate-200/50 dark:border-slate-800 pt-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-sans">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{selectedUtec.email}</span>
                    </div>
                  </div>

                  {/* Escopo de Contigência */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                    <span className="text-[8px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block font-sans">Indicadores Coletivos</span>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <div className="bg-white dark:bg-slate-900/70 p-1.5 px-2 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Escolas</span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono">{selectedUtec.unidades}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900/70 p-1.5 px-2 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Estudantes</span>
                        <span className="text-xs font-black text-[#1E40AF] dark:text-blue-400 font-mono">{selectedUtec.estudantes.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aggregate Technological indicators - Compact Inline Badges */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-850 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    Indicadores Tecnológicos Ativos (Totais Consolidados)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* LCT */}
                    <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg flex items-center justify-between">
                      <span className="text-[9px] font-black text-emerald-800 dark:text-emerald-400 uppercase font-sans">Lab. LCT</span>
                      <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 font-mono">{selectedUtec.lct}</span>
                    </div>

                    {/* Robótica */}
                    <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-lg flex items-center justify-between">
                      <span className="text-[9px] font-black text-amber-800 dark:text-amber-400 uppercase font-sans">Robótica</span>
                      <span className="text-xs font-black text-amber-900 dark:text-amber-300 font-mono">{selectedUtec.rob}</span>
                    </div>

                    {/* Cineclube */}
                    <div className="p-2 bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/40 rounded-lg flex items-center justify-between">
                      <span className="text-[9px] font-black text-pink-800 dark:text-pink-400 uppercase font-sans">Cineclube</span>
                      <span className="text-xs font-black text-pink-900 dark:text-pink-300 font-mono">{selectedUtec.cine}</span>
                    </div>

                    {/* Formacao Cidada Digital */}
                    <div className="p-2 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/60 dark:border-teal-900/40 rounded-lg flex items-center justify-between">
                      <span className="text-[9px] font-black text-teal-800 dark:text-teal-400 uppercase font-sans">Form. FCD</span>
                      <span className="text-xs font-black text-teal-900 dark:text-teal-300 font-mono">{selectedUtec.fcd}</span>
                    </div>
                  </div>
                </div>
              {/* Section header for linked Educational school units - CONSOLIDATED METRIC VIEW */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Unidades de Ensino em Atendimento ({schoolsToDisplay.length})
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-sans">
                        Escolas e creches municipais suportadas por esta UTEC e seus indicadores em tempo real
                      </p>
                    </div>
                  </div>

                  {/* Micro search bar for filtering school units list */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 animate-pulse" />
                    <input
                      type="text"
                      placeholder={`Procurar nas escolas vinculadas a ${selectedUtec.name} (ex: Inep, Nome)...`}
                      value={schoolSearchQuery}
                      onChange={(e) => setSchoolSearchQuery(e.target.value)}
                      className="w-full text-xs font-bold pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-hidden transition-all text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {/* School collection cards grid layout */}
                  {filteredSchools.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      {filteredSchools.map((unit) => {
                        return (
                          <div 
                            key={unit.inep_escola}
                            className="bg-slate-50/50 dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs hover:border-[#1E40AF] dark:hover:border-blue-500/50 transition-all flex flex-col justify-between group relative overflow-hidden"
                          >
                            <span className="absolute top-0 right-0 h-1 w-0 group-hover:w-full bg-[#1E40AF] dark:bg-blue-500 transition-all duration-305 bg-blue-600" />
                            
                            <div className="space-y-2">
                              {/* school header row */}
                              <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-black bg-blue-50 dark:bg-blue-950/50 text-[#1E40AF] dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">
                                    {unit.rpa_escola}
                                  </span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono">INEP {unit.inep_escola}</span>
                              </div>

                              {/* school info */}
                              <div>
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-[#1E40AF] dark:group-hover:text-blue-400 transition-all" title={unit.nome_unidade}>
                                  {unit.nome_unidade}
                                </h4>
                                <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 leading-relaxed block truncate mt-0.5">
                                  {unit.tipo_unidade} • {unit.modalidade_ensino}
                                </p>
                              </div>

                              {/* Capacity breakdown */}
                              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800 pt-2">
                                <span>Capacidade: <strong className="text-slate-700 dark:text-slate-300 font-extrabold">{unit.qtd_estudantes} Alunos</strong></span>
                                <span className="text-[9px] text-[#1E40AF] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 px-1 rounded">Via Demanda: {unit.por_demanda}</span>
                              </div>
                            </div>

                            {/* Resource indicators inside the card */}
                            <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-[9px] font-black">
                              <div className={`py-1 rounded-md border ${unit.qtd_lct > 0 ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/40 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'}`}>
                                LCT: {unit.qtd_lct}
                              </div>
                              <div className={`py-1 rounded-md border ${unit.qtd_cineclube > 0 ? 'bg-pink-50/40 dark:bg-pink-950/10 border-pink-200/40 text-pink-600 dark:text-pink-400' : 'bg-slate-100/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'}`}>
                                Cine: {unit.qtd_cineclube}
                              </div>
                              <div className={`py-1 rounded-md border ${unit.qtd_robotica > 0 ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/40 text-amber-600 dark:text-amber-400' : 'bg-slate-100/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'}`}>
                                Rob: {unit.qtd_robotica}
                              </div>
                            </div>

                            {/* View details button inside card */}
                            <button
                              type="button"
                              onClick={() => setSelectedUnit(unit)}
                              className="mt-3 w-full py-1.5 px-3 text-[10px] font-black uppercase text-indigo-700 hover:text-white bg-indigo-50 hover:bg-[#1E40AF] dark:bg-slate-800 dark:hover:bg-blue-600 dark:text-indigo-400 dark:hover:text-white border-transparent hover:border-transparent rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer font-sans"
                            >
                              Exibir Ficha Detalhada
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <HelpCircle className="w-6 h-6 mx-auto mb-1.5 text-slate-350 animate-bounce" />
                      <p className="text-xs font-bold">Nenhuma Unidade Encontrada</p>
                      <p className="text-[10px] text-slate-400">Tente buscar por outro termo.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111827] rounded-xl p-8 shadow-xs border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center py-16">
              <Building className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum Centro Selecionado</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm font-sans leading-relaxed">
                Utilize o menu à esquerda para selecionar uma UTEC e exibir todos os seus dados estruturais, contatos oficiais e escolas em atendimento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Beautiful Modal for Educational Unit Details */}
      {selectedUnit && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedUnit(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-3 px-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-wider">{selectedUnit.tipo_unidade}</h3>
                  <span className="text-[8px] text-blue-200 font-bold tracking-wide block leading-none">Código Inep: {selectedUnit.inep_escola}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUnit(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
                title="Fechar Detalhes"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Scrollable Content Container - Compact padding */}
            <div className="p-4 overflow-y-auto space-y-3">
              <div>
                <span className="text-[8px] font-black text-indigo-600 dark:text-blue-400 uppercase tracking-widest block font-sans">Nome da Unidade</span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 leading-snug">{selectedUnit.nome_unidade}</h4>
              </div>

              {/* Grid with key characteristics - Compacted */}
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 col-span-2">
                  <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase block">Endereço Completo</span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-normal block">{selectedUnit.endereco}</span>
                </div>

                <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase block">Modalidade de Ensino</span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">{selectedUnit.modalidade_ensino}</span>
                </div>

                <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase block">RPA Unidade</span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">{selectedUnit.rpa_escola}</span>
                </div>

                <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase block">UTEC de Suporte</span>
                  <span className="text-[11px] font-black text-[#1E40AF] dark:text-blue-400 uppercase block">
                    {utecLookup.get(selectedUnit.id_utec_suporte)?.name || selectedUnit.id_utec_suporte.toUpperCase()}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase block">Código Inep</span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block font-mono">{selectedUnit.inep_escola}</span>
                </div>
              </div>

              {/* Attendance capacity details */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <h5 className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Capacidade e Governança Local</h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-center">
                    <span className="text-[8px] font-bold text-blue-700 dark:text-blue-400 uppercase">Qtd Estudantes</span>
                    <span className="text-base font-black text-[#1E40AF] dark:text-blue-300 block font-mono">{selectedUnit.qtd_estudantes.toLocaleString('pt-BR')}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 text-center flex flex-col justify-center">
                    <span className="text-[8px] font-bold text-orange-700 dark:text-orange-400 uppercase leading-none">Por Demanda</span>
                    <span className={`text-[9px] font-black block mt-1 px-1.5 py-0.5 rounded uppercase tracking-wide inline-block mx-auto ${
                      selectedUnit.por_demanda === 'Sim' ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {selectedUnit.por_demanda}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-center flex flex-col justify-center">
                    <span className="text-[8px] font-bold text-indigo-700 dark:text-indigo-400 uppercase block truncate leading-none">Status Monitor</span>
                    <span className="text-[9px] font-black text-indigo-900 dark:text-indigo-300 block mt-1 uppercase tracking-wider">Ativo</span>
                  </div>
                </div>

                {/* Recursos Tecnológicos Activos */}
                <h5 className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block pt-1">Recursos Tecnológicos Ativos</h5>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[8px] font-black text-[#1E40AF] dark:text-blue-400 uppercase block">LCT</span>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 block font-mono">
                      {selectedUnit.qtd_lct}
                    </span>
                    <span className="text-[7.5px] text-slate-400 dark:text-slate-500 block font-semibold leading-none">Laboratório</span>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[8px] font-black text-pink-600 dark:text-pink-400 uppercase block">Cineclube</span>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 block font-mono">
                      {selectedUnit.qtd_cineclube}
                    </span>
                    <span className="text-[7.5px] text-slate-400 dark:text-slate-500 block font-semibold leading-none">Ativos</span>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[8px] font-black text-teal-600 dark:text-teal-450 uppercase block">Robótica</span>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 block font-mono">
                      {selectedUnit.qtd_robotica}
                    </span>
                    <span className="text-[7.5px] text-slate-400 dark:text-slate-500 block font-semibold leading-none">Clubes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 px-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUnit(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                Voltar ao Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
