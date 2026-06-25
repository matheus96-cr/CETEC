/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, AlertTriangle, Building2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UtecMetric } from '../types';
import { REGIONALS } from '../data';

interface AddUtecModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newUtec: UtecMetric) => void;
  nextUtecNum: number;
}

export default function AddUtecModal({ isOpen, onClose, onAdd, nextUtecNum }: AddUtecModalProps) {
  const [name, setName] = useState(`UTEC ${nextUtecNum}`);
  const [regional, setRegional] = useState('Regional 1');
  const [unidades, setUnidades] = useState(2);
  const [estudantes, setEstudantes] = useState(1500);
  const [lct, setLct] = useState(2);
  const [rob, setRob] = useState(1);
  const [cine, setCine] = useState(1);
  const [fcd, setFcd] = useState(2);
  const [rev, setRev] = useState(1);
  const [coordinator, setCoordinator] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('(81) 99888-0000');
  const [error, setError] = useState('');

  // Auto increment suggestions when nextUtecNum changes
  useEffect(() => {
    setName(`UTEC ${nextUtecNum}`);
  }, [nextUtecNum]);

  // Auto-generate municipal email based on coordinator name
  useEffect(() => {
    if (coordinator.trim()) {
      const formattedName = coordinator
        .toLowerCase()
        .normalize('NFD') // remove accents
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, '.');
      setEmail(`${formattedName}@recife.pe.gov.br`);
    } else {
      setEmail('');
    }
  }, [coordinator]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!coordinator.trim()) {
      setError('Por favor, digite o nome do coordenador.');
      return;
    }

    if (unidades <= 0 || estudantes <= 0) {
      setError('Unidades e Estudantes contratados devem ser maiores que zero.');
      return;
    }

    const newUtec: UtecMetric = {
      id: `utec-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name,
      regional,
      unidades,
      estudantes,
      lct,
      rob,
      cine,
      fcd,
      rev,
      coordinator,
      email: email || 'contato@recife.pe.gov.br',
      phone,
      status: 'Ativa',
      creationDate: new Date().toISOString().split('T')[0],
    };

    onAdd(newUtec);
    
    // Reset defaults for next time
    setCoordinator('');
    setUnidades(2);
    setEstudantes(1500);
    setLct(2);
    setRob(1);
    setCine(1);
    setFcd(2);
    setRev(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="add-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with fade transition */}
          <motion.div
            id="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Card with slide-up zoom transition */}
          <motion.div
            id="add-modal-card"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white dark:bg-[#111827] w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10"
          >
            {/* Top branding ribbon banner */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-[#4B39EF] to-pink-500" />

            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 mt-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-slate-805 text-[#4B39EF] dark:text-blue-400">
                  <Building2 className="w-6 h-6 flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Cadastrar Nova UTEC</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-450 font-medium">Cadastre um novo centro tecnológico e lance os dados de atendimento no painel</p>
                </div>
              </div>
              <button 
                id="close-add-modal"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-350 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-r-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form id="add-utec-form-wrapper" onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Name and Regional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Identificação da UTEC</label>
                  <input
                    id="add-input-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#4B39EF] dark:focus:border-blue-500 focus:outline-hidden transition-all text-slate-700 dark:text-slate-200"
                    placeholder="Ex: UTEC COQUE"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Regional Responsável</label>
                  <select
                    id="add-input-regional"
                    value={regional}
                    onChange={(e) => setRegional(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#4B39EF] dark:focus:border-blue-500 focus:outline-hidden transition-all text-slate-600 dark:text-slate-300"
                  >
                    {REGIONALS.map((reg) => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Coordinator info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-800 pt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Coordenador
                  </label>
                  <input
                    id="add-input-coordinator"
                    type="text"
                    required
                    placeholder="Nome Completo do Gestor"
                    value={coordinator}
                    onChange={(e) => setCoordinator(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#4B39EF] dark:focus:border-blue-500 focus:outline-hidden transition-all dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">E-mail Institucional</label>
                  <input
                    id="add-input-email"
                    type="email"
                    placeholder="nome.coordenador@recife.pe.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 focus:outline-hidden cursor-not-allowed"
                    readOnly
                  />
                  <span className="text-[9px] text-slate-400 dark:text-slate-400 block pl-0.5">Gerado automaticamente para governança oficial.</span>
                </div>
              </div>

              {/* Row 3: Phone and baseline metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-50 dark:border-slate-800 pt-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Telefone</label>
                  <input
                    id="add-input-phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#4B39EF] dark:focus:border-blue-500 focus:outline-hidden dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Unidades Ativas</label>
                  <input
                    id="add-input-unidades"
                    type="number"
                    required
                    min={1}
                    value={unidades}
                    onChange={(e) => setUnidades(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#4B39EF] dark:focus:border-blue-500 focus:outline-hidden dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Qtd de Estudantes</label>
                  <input
                    id="add-input-estudantes"
                    type="number"
                    required
                    min={10}
                    value={estudantes}
                    onChange={(e) => setEstudantes(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#4B39EF] dark:focus:border-blue-500 focus:outline-hidden dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Row 4: Program Status values */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl space-y-3 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-extrabold text-indigo-900 dark:text-blue-300 uppercase tracking-wide">Status de Programas Cadastrados (Valores de Badge)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block uppercase text-center">Lab LCT</label>
                    <input
                      id="add-input-lct"
                      type="number"
                      required
                      min={0}
                      value={lct}
                      onChange={(e) => setLct(parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-bold text-center py-2 bg-white dark:bg-[#111827] border border-slate-202 dark:border-slate-800 rounded-xl dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block uppercase text-center">Robótica</label>
                    <input
                      id="add-input-rob"
                      type="number"
                      required
                      min={0}
                      value={rob}
                      onChange={(e) => setRob(parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-bold text-center py-2 bg-white dark:bg-[#111827] border border-slate-202 dark:border-slate-800 rounded-xl dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block uppercase text-center">Cineclube</label>
                    <input
                      id="add-input-cine"
                      type="number"
                      required
                      min={0}
                      value={cine}
                      onChange={(e) => setCine(parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-bold text-center py-2 bg-white dark:bg-[#111827] border border-slate-202 dark:border-slate-800 rounded-xl dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block uppercase text-center">Formações</label>
                    <input
                      id="add-input-fcd"
                      type="number"
                      required
                      min={0}
                      value={fcd}
                      onChange={(e) => setFcd(parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-bold text-center py-2 bg-white dark:bg-[#111827] border border-slate-202 dark:border-slate-800 rounded-xl dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block uppercase text-center">Premiados</label>
                    <input
                      id="add-input-rev"
                      type="number"
                      required
                      min={0}
                      value={rev}
                      onChange={(e) => setRev(parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-bold text-center py-2 bg-white dark:bg-[#111827] border border-slate-202 dark:border-slate-800 rounded-xl dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-5 mt-4">
                <button
                  id="btn-add-modal-cancel"
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-add-modal-submit"
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-[#4B39EF] hover:bg-[#3b2bca] rounded-xl transition-all shadow-sm shadow-[#4B39EF]/30"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Unidade
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
