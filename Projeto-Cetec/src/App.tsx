/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Plus, 
  MapPin, 
  Users, 
  Cpu, 
  BookOpen, 
  RefreshCw, 
  TrendingUp, 
  Sliders, 
  Layers, 
  Printer, 
  FileDown, 
  HelpCircle,
  Building,
  Info,
  SlidersHorizontal,
  LogOut,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import KpiRow from './components/KpiRow';
import UtecCharts from './components/UtecCharts';
import UtecTable from './components/UtecTable';
import UtecInfoPage from './components/UtecInfoPage';
import EducationalUnitsDashboard from './components/EducationalUnitsDashboard';
import MultiplierDiary from './components/MultiplierDiary';
import { UtecMetric, ActiveTab } from './types';
import { INITIAL_UTECS } from './data';

export default function App() {
  const [utecs, setUtecs] = useState<UtecMetric[]>(INITIAL_UTECS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Dashboards');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Current dynamic datetime state updating in real-time
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('portal-user-cpf');
  });
  const [cpfValue, setCpfValue] = useState('000.000.000-00');
  const [loginError, setLoginError] = useState('');

  // Theme states for light/dark layout overrides
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('utec-theme');
    return saved === 'dark';
  });

  const handleToggleTheme = (dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem('utec-theme', dark ? 'dark' : 'light');
  };

  // Statistics for UTEC indexing
  const nextUtecNum = utecs.length + 1;

  // Handlers for data persistence and syncing
  const handleAddUtec = (newUtec: UtecMetric) => {
    setUtecs((prev) => [...prev, newUtec]);
  };

  const handleEditUtec = (updated: UtecMetric) => {
    setUtecs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleDeleteUtec = (id: string) => {
    setUtecs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetData = () => {
    if (confirm('Deseja realmente restaurar os dados originais do Figma?')) {
      setUtecs(INITIAL_UTECS);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only numbers allow
    const cleanNum = e.target.value.replace(/\D/g, '').slice(0, 11);
    
    // Format to 000.000.000-00
    let formatted = '';
    if (cleanNum.length <= 3) {
      formatted = cleanNum;
    } else if (cleanNum.length <= 6) {
      formatted = `${cleanNum.slice(0, 3)}.${cleanNum.slice(3)}`;
    } else if (cleanNum.length <= 9) {
      formatted = `${cleanNum.slice(0, 3)}.${cleanNum.slice(3, 6)}.${cleanNum.slice(6)}`;
    } else {
      formatted = `${cleanNum.slice(0, 3)}.${cleanNum.slice(3, 6)}.${cleanNum.slice(6, 9)}-${cleanNum.slice(9, 11)}`;
    }
    
    setCpfValue(formatted);
    if (loginError) setLoginError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cpfValue.replace(/\D/g, '');
    if (cleanNum.length !== 11) {
      setLoginError('O CPF deve conter exatamente 11 dígitos.');
      return;
    }
    localStorage.setItem('portal-user-cpf', cpfValue);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('portal-user-cpf');
    setIsLoggedIn(false);
    setCpfValue('000.000.000-00');
  };

  // Render descriptive tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Dashboards':
        return (
          <>
            {/* 1. Dynamic KPI Metrics Grid */}
            <KpiRow utecs={utecs} />

            {/* 2. Recharts Analytics Visualizer Panel */}
            <UtecCharts utecs={utecs} />

            {/* 3. Interactive Data List & Detailed UTEC Profiles card columns */}
            <UtecTable 
              utecs={utecs} 
            />
          </>
        );

      case 'Diário':
        return (
          <MultiplierDiary 
            utecs={utecs}
          />
        );

      case 'Informações':
        return (
          <UtecInfoPage 
            utecs={utecs}
          />
        );

      case 'Relatórios':
        return (
          <div id="relatorios-tab-view" className="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-xs border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="pb-4 border-b border-slate-150 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Geração de Relatórios Oficiais</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Exporte os dados das UTECs e métricas operacionais para prestação de conta</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-150 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Exportar Planilha Completa (CSV)</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-semibold">Gere uma planilha compacta contendo todas as UTECs registradas e seus indicadores numéricos.</p>
                </div>
                <button
                  id="btn-export-csv"
                  onClick={() => {
                    const headers = 'UTEC,Regional,Unidades,Estudantes,LCT,Rob,Cine,FCD,Rev,Coordenador\r\n';
                    const rows = utecs.map(u => `"${u.name}","${u.regional}",${u.unidades},${u.estudantes},${u.lct},${u.rob},${u.cine},${u.fcd},${u.rev},"${u.coordinator}"`).join('\r\n');
                    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `UTEC-Relatorio-Executivo-${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-slate-900 hover:bg-black dark:bg-[#1E40AF] dark:hover:bg-blue-800 px-4 py-3 rounded-xl transition-colors shadow-xs"
                >
                  <FileDown className="w-4 h-4 flex-shrink-0" />
                  Baixar Planilha CSV
                </button>
              </div>

              <div className="border border-slate-150 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Imprimir Relatório Técnico (PDF)</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-semibold font-sans">Abra as configurações de impressão nativas do navegador formatadas para folhas tamanho A4.</p>
                </div>
                <button
                  id="btn-print-dashboard"
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#4B39EF] hover:bg-[#3b2bca] px-4 py-3 rounded-xl transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4 flex-shrink-0" />
                  Imprimir Painel Executivo
                </button>
              </div>
            </div>
          </div>
        );

      case 'Config':
        return (
          <div id="config-tab-view" className="bg-white dark:bg-[#111827] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 max-w-xl">
            <div className="pb-3 border-b border-slate-150 dark:border-slate-800">
              <h2 className="text-sm font-extrabold text-slate-850 dark:text-white">Aparência e Configurações</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-sans">Escolha o tema visual de exibição do portal de monitoramento UTEC.</p>
            </div>

            {/* Tema Switcher Visual Selection */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pl-0.5">
                <Sparkles className="w-4 h-4 text-[#1E40AF]" /> Tema do Sistema
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Light Theme Option Card */}
                <button
                  type="button"
                  onClick={() => handleToggleTheme(false)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    !isDarkMode 
                      ? 'border-[#1E40AF] bg-blue-50/40 ring-1 ring-blue-100/30' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-orange-55/10 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 rounded-lg">
                      <Sun className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tema Claro</h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 leading-none">Original do Recife</p>
                    </div>
                  </div>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    !isDarkMode 
                      ? 'border-[#1E40AF] bg-[#1E40AF]' 
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {!isDarkMode && <span className="w-1.2 h-1.2 rounded-full bg-white" />}
                  </span>
                </button>

                {/* Dark Theme Option Card */}
                <button
                  type="button"
                  onClick={() => handleToggleTheme(true)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isDarkMode 
                      ? 'border-[#1E40AF] bg-blue-950/20 ring-1 ring-blue-900/40 dark:bg-slate-800/40 dark:border-blue-500' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 text-[#1E40AF] dark:bg-slate-950 dark:text-blue-400 rounded-lg">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tema Escuro</h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 leading-none">Agradável para leitura</p>
                    </div>
                  </div>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    isDarkMode 
                      ? 'border-[#1E40AF] bg-[#1E40AF]' 
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isDarkMode && <span className="w-1.2 h-1.2 rounded-full bg-white" />}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex flex-col justify-between bg-[#F8FAFC] dark:bg-[#090D1A] overflow-y-auto font-sans text-slate-800 dark:text-slate-100 transition-all ${isDarkMode ? 'dark' : ''}`}>
        {/* Quick Top Bar */}
        <div className="w-full max-w-7xl mx-auto flex items-center justify-end p-5">
          <button
            type="button"
            onClick={() => handleToggleTheme(!isDarkMode)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400"
            title="Alternar Tema"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Centered Login Card */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] max-w-md w-full rounded-3xl p-8 border border-slate-100/80 dark:border-slate-800/80 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300">
            {/* Tech Aesthetic Accent Lines */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E40AF] via-[#4B39EF] to-pink-500" />
            
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#1E40AF] dark:text-blue-400 mb-2">
                <SlidersHorizontal className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Sistema de Monitoramento</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Insira o seu CPF de acesso para visualizar o painel operacional de monitoramento tecnológico.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">CPF de Acesso</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cpfValue}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`w-full text-sm font-bold tracking-widest text-center px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border ${
                      loginError 
                        ? 'border-red-500 ring-1 ring-red-150/40' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-[#1E40AF] focus:ring-2 focus:ring-blue-100/50 dark:focus:ring-blue-900/40'
                    } rounded-2xl focus:outline-hidden transition-all text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-700`}
                    id="cpf-login-input"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-600">
                    <span className="text-xs font-mono select-none">CPF</span>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center pl-1 font-semibold leading-normal">
                  Insira apenas números. Mascaramento e formatação são aplicados automaticamente sobre a digitação.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl text-center">
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400 block">{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-submit-login"
                className="w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-white bg-[#1E40AF] hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 py-4 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                Acessar Portal
              </button>
            </form>

          </div>
        </div>

        {/* Footer info lockups */}
        <div className="p-6 text-center text-[10px] text-slate-450 dark:text-slate-600 font-bold tracking-wide">
          <span>&copy; Prefeitura do Recife - PE</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-[#F8FAFC] dark:bg-[#090D1A] overflow-hidden font-sans ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar (left-side columns panel) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      {/* Main content viewport block */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Dynamic header row (visible on mobile / desktop context) */}
        <header id="app-workspace-header" className="bg-white dark:bg-[#111827] border-b border-slate-100 dark:border-slate-800 px-5 py-2.5 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger mobile menu triggers sidebar */}
            <button
              id="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Menu className="w-5 h-5 flex-shrink-0" />
            </button>
            
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">Portal Executivo</span>
              <h1 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                {activeTab === 'Dashboards' ? 'Visão Geral' : activeTab === 'Config' ? 'Configurações' : activeTab === 'Diário' ? 'Diário do Multiplicador' : activeTab}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulation reset quick control */}
            <button
              id="quick-reset-button"
              onClick={handleResetData}
              className="p-1.5 text-slate-400 hover:text-[#4B39EF] dark:hover:text-blue-400 hover:bg-indigo-50/50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 rounded-xl transition-all hidden sm:block"
              title="Restaurar dados iniciais"
            >
              <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
            </button>

            {/* Current formatted UTC date */}
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wide flex items-center gap-1.5 shadow-2xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse flex-shrink-0" />
              <span>
                {currentDateTime.toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }).replace(/^\w/, (c) => c.toUpperCase())}
              </span>
              <span className="text-slate-200 dark:text-slate-800 flex-shrink-0">|</span>
              <span className="text-[#1E40AF] dark:text-blue-400 font-black flex-shrink-0">
                {currentDateTime.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable main workspace block container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
