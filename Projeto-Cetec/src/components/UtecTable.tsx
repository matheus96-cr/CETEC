import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  AlertCircle,
  Building2,
  Users
} from 'lucide-react';
import { UtecMetric } from '../types';
import { REGIONALS, INITIAL_EDUCATIONAL_UNITS } from '../data';

interface UtecTableProps {
  utecs: UtecMetric[];
}

export default function UtecTable({ utecs }: UtecTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegional, setSelectedRegional] = useState('Todas');

  // Map each educational unit to its supporting UTEC's regional and name
  const unitsWithUtec = useMemo(() => {
    const uLookup = new Map<string, UtecMetric>();
    utecs.forEach(u => uLookup.set(u.id, u));

    return INITIAL_EDUCATIONAL_UNITS.map(unit => {
      const utec = uLookup.get(unit.id_utec_suporte);
      return {
        ...unit,
        utecName: utec ? utec.name : unit.id_utec_suporte.toUpperCase(),
        regional: utec ? utec.regional : 'Não Definida',
      };
    });
  }, [utecs]);

  // Filtered educational units
  const filteredUnits = useMemo(() => {
    return unitsWithUtec.filter((unit) => {
      const query = searchQuery.toLowerCase();
      
      const matchesSearch = 
        unit.nome_unidade.toLowerCase().includes(query) ||
        unit.utecName.toLowerCase().includes(query) ||
        unit.regional.toLowerCase().includes(query) ||
        unit.inep_escola.includes(query) ||
        unit.endereco.toLowerCase().includes(query);
      
      const matchesRegional = selectedRegional === 'Todas' || unit.regional === selectedRegional;

      return matchesSearch && matchesRegional;
    });
  }, [unitsWithUtec, searchQuery, selectedRegional]);

  return (
    <div id="table-system-section" className="w-full">
      {/* Table Container Block */}
      <div id="table-block-container" className="w-full bg-white dark:bg-[#111827] rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Table Title and Subtitle Header instead of tabs */}
        <div id="table-tab-header" className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex flex-col">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Unidades Educacionais / Escolas</h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">Lista de unidades de ensino suportadas e os recursos instalados</p>
          </div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
            {filteredUnits.length} Escolas
          </span>
        </div>

        {/* Searching & Filter Controls Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/5 flex flex-col sm:flex-row gap-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="utec-search-input"
              type="text"
              placeholder="Pesquisar por unidade, utec, regional..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-[#1E40AF] dark:focus:border-blue-500 focus:outline-hidden transition-all text-slate-700 dark:text-slate-200"
            />
          </div>

          {/* Regional selector */}
          <div className="w-full sm:w-[150px]">
            <select
              id="regional-filter-select"
              value={selectedRegional}
              onChange={(e) => setSelectedRegional(e.target.value)}
              className="w-full text-xs font-bold px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-[#1E40AF] focus:outline-hidden transition-all text-slate-600 dark:text-slate-300"
            >
              <option value="Todas">Todas Regionais</option>
              {REGIONALS.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto" id="data-table-container">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Figma Styled Light Blue Header row */}
              <tr className="bg-[#EBF3FF] dark:bg-slate-800" id="table-headers">
                <th className="px-5 py-2.5 text-[10px] font-black text-blue-950 dark:text-slate-200 tracking-wider">ESCOLA / UNIDADE</th>
                <th className="px-4 py-2.5 text-[10px] font-black text-blue-950 dark:text-slate-200 tracking-wider">UTEC SUPORTE</th>
                <th className="px-4 py-2.5 text-[10px] font-black text-blue-950 dark:text-slate-200 tracking-wider">REGIONAL</th>
                <th className="px-4 py-2.5 text-[10px] font-black text-blue-950 dark:text-slate-200 tracking-wider text-center">ESTUDANTES</th>
                <th className="px-4 py-2.5 text-[10px] font-black text-blue-950 dark:text-slate-200 tracking-wider text-center">LCT</th>
                <th className="px-4 py-2.5 text-[10px] font-black text-blue-950 dark:text-slate-200 tracking-wider text-center">ROB.</th>
                <th className="px-4 py-2.5 text-[10px] font-black text-blue-950 dark:text-slate-200 tracking-wider text-center">CINE</th>
                <th className="px-5 py-2.5 text-[10px] font-black text-blue-950 dark:text-slate-200 tracking-wider text-center">DEMANDA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800" id="table-body">
              {filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => {
                  return (
                    <tr
                      id={`table-row-${unit.inep_escola}`}
                      key={unit.inep_escola}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name of Unit */}
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col max-w-[280px]">
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 transition-colors group-hover:text-[#1E40AF] dark:group-hover:text-blue-400 line-clamp-2">
                            {unit.nome_unidade}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                            INEP: {unit.inep_escola} | {unit.tipo_unidade}
                          </span>
                        </div>
                      </td>

                      {/* Support UTEC */}
                      <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 text-xs">
                        <span className="bg-blue-50 dark:bg-blue-950/20 text-[#1E40AF] dark:text-blue-350 px-2 py-0.5 rounded text-[10px] font-extrabold">
                          {unit.utecName}
                        </span>
                      </td>

                      {/* Regional */}
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all px-2 py-0.5 rounded-md">
                          {unit.regional}
                        </span>
                      </td>

                      {/* Estudantes */}
                      <td className="px-4 py-2.5 text-center font-black text-slate-800 dark:text-slate-200 text-xs font-mono">
                        {unit.qtd_estudantes.toLocaleString('pt-BR')}
                      </td>

                      {/* Equipped indicators */}
                      {/* LCT */}
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex justify-center">
                          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold border transition-all ${
                            unit.qtd_lct > 0 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 dark:border-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-600'
                          }`}>
                            {unit.qtd_lct}
                          </span>
                        </div>
                      </td>

                      {/* Rob (Robótica) */}
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex justify-center">
                          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold border transition-all ${
                            unit.qtd_robotica > 0 
                              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500/30 dark:border-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs' 
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-600'
                          }`}>
                            {unit.qtd_robotica}
                          </span>
                        </div>
                      </td>

                      {/* Cineclube */}
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex justify-center">
                          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold border transition-all ${
                            unit.qtd_cineclube > 0 
                              ? 'bg-pink-50 dark:bg-pink-950/20 border-pink-500/30 dark:border-pink-500/10 text-pink-600 dark:text-pink-400 shadow-xs' 
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-600'
                          }`}>
                            {unit.qtd_cineclube}
                          </span>
                        </div>
                      </td>

                      {/* Por Demanda status badge */}
                      <td className="px-5 py-2.5 text-center">
                        <div className="flex justify-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide inline-block ${
                            unit.por_demanda === 'Sim'
                              ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-850 dark:text-orange-400 border border-orange-200 dark:border-orange-950/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-755'
                          }`}>
                            {unit.por_demanda}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                      <AlertCircle className="w-7 h-7 text-slate-350 dark:text-slate-600" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nenhum resultado encontrado</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Tente ajustar seus termos de pesquisa (unidade, utec ou regional) ou filtros regionais.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination / Helper footer stats panel */}
        <div className="p-2.5 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-semibold flex-wrap gap-2">
          <span>Mostrando {filteredUnits.length} de {unitsWithUtec.length} unidades de ensino cadastradas</span>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Unidades Ativas
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-400 dark:text-slate-500 uppercase font-bold text-[10px]">Secretaria Executiva de Tecnologia</span>
          </div>
        </div>
      </div>
    </div>
  );
}
