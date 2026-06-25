/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  BarChart2, 
  FileSpreadsheet, 
  Settings, 
  ChevronDown, 
  X, 
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info,
  LogOut,
  User,
  BookOpen
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'Dashboards' as ActiveTab, label: 'Dashboards', icon: LayoutDashboard, hasDropdown: false },
    { id: 'Diário' as ActiveTab, label: 'Diário do Multiplicador', icon: BookOpen, hasDropdown: false },
    { id: 'Informações' as ActiveTab, label: 'Informações da UTEC', icon: Info, hasDropdown: false },
    { id: 'Relatórios' as ActiveTab, label: 'Relatórios', icon: FileSpreadsheet, hasDropdown: false },
    { id: 'Config' as ActiveTab, label: 'Configurações', icon: Settings, hasDropdown: false },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-full text-white bg-[#1E40AF] dark:bg-[#111827] border-r border-[#1D4ED8] dark:border-slate-800/60 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:w-[250px] lg:static overflow-hidden`}
      >
        {/* Sidebar Header branding */}
        <div className="flex items-center justify-between p-5 border-b border-[#1D4ED8] dark:border-slate-800/60 h-[72px] overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 dark:bg-slate-800 flex-shrink-0 border border-white/10">
              <User className="w-4 h-4 text-white dark:text-blue-400" />
            </div>
            <div className="flex flex-col overflow-hidden whitespace-nowrap">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-white dark:text-slate-100">Administrador Geral</span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            id="mobile-sidebar-close"
            className="p-1 rounded-md hover:bg-white/10 lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="flex flex-col">
                <button
                  id={`nav-item-${item.id}`}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-250 ${
                    isActive 
                      ? 'bg-white dark:bg-slate-800 text-[#1E40AF] dark:text-blue-400 shadow-xs' 
                      : 'text-blue-105 hover:bg-white/10 hover:text-white dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                  }`}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) {
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </nav>

        {/* Exit Button optionally if onLogout is provided */}
        {onLogout && (
          <div className="px-3 py-2 border-t border-[#1D4ED8] dark:border-slate-800/60 bg-black/5 dark:bg-slate-950/20">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-xs font-bold rounded-xl text-red-200 hover:bg-red-600/20 hover:text-red-100 transition-all duration-250 font-sans"
            >
              <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
              <span>Sair do Painel</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-[#1D4ED8] dark:border-slate-800/65 bg-black/10 dark:bg-slate-900/40 flex flex-col items-center justify-center flex-shrink-0">
          <p className="text-[9px] leading-relaxed text-blue-200 dark:text-slate-500 font-extrabold tracking-wide uppercase text-center whitespace-nowrap">
            Secretaria de Tecnologia
          </p>
        </div>
      </aside>
    </>
  );
}
