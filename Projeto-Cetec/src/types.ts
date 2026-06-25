/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UtecMetric {
  id: string;
  name: string;
  regional: string;
  unidades: number;
  estudantes: number;
  lct: number; // Laboratório LCT
  rob: number; // Robótica
  cine: number; // Cineclube
  fcd: number; // Formação Cidadã Digital
  rev: number; // Relevância / Premiados
  coordinator: string;
  email: string;
  phone: string;
  status: 'Ativa' | 'Inativa';
  creationDate: string;
}

export interface EducationalUnit {
  inep_escola: string;
  id_utec_suporte: string;
  rpa_escola: string;
  endereco: string;
  modalidade_ensino: string;
  nome_unidade: string;
  tipo_unidade: string;
  qtd_estudantes: number;
  por_demanda: string; // 'Sim' | 'Não'
  qtd_lct: number;
  qtd_cineclube: number;
  qtd_robotica: number;
  gestor?: string;
  vice_gestor?: string;
}

export interface KpiCard {
  title: string;
  value: string;
  subtext: string;
  color: string;
  borderColor: string;
}

export type ActiveTab = 'Dashboards' | 'Diário' | 'Informações' | 'Relatórios' | 'Config';
export type TableTab = 'Todas Unidades' | 'Lista Detalhada';
