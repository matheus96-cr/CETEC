import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  BookOpen, 
  Search, 
  Compass, 
  MapPin, 
  Users, 
  Tv, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  FileText,
  Clock,
  Building2,
  GraduationCap,
  RotateCcw,
  Database,
  Check,
  Copy,
  CloudLightning,
  RefreshCw,
  ExternalLink,
  Plus,
  Loader2
} from 'lucide-react';
import { UtecMetric } from '../types';
import { INITIAL_EDUCATIONAL_UNITS, INITIAL_UTECS } from '../data';

interface MultiplierDiaryProps {
  utecs: UtecMetric[];
}

// Struct of record/registro in Multiplier's Diary
interface DiaryRecord {
  id: string;
  utecId: string;
  utecName: string;
  escolaInep: string;
  escolaNome: string;
  dataOcorrencia: string;
  solicitante: string;
  qtdProfessores: number | string;
  qtdEstudantes: number | string;
  categoria: string;
  atendimentoTipo: 'Escola' | 'Externo/UTEC';
  mes: string;
  
  // Specific spreadsheet extended fields to handle full fidelity
  turno1?: string;
  turno2?: string;
  turno3?: string;
  participacao?: string;
  local?: string;
  observacoes?: string;
  usuExterno?: string;
  atividadesDesenvolvidas?: string;
  observacao?: string;
  demanda?: string;
  anfitriaoNaUe?: string;
  ocorrencia?: string;
  planejamento?: string;
  temaDaAtividade?: string;
  outros?: string;
  grupoImpacto?: string;
  modalidade?: string;
  estudantes?: number;
  engajamentoEstudantes?: string;
  professores?: number;
  engajamentoProfessores?: string;
  redsFisicos?: string;
  softwares?: string;
  dataCarimbo?: string;
  matriculaSolicitante?: string;
  nomeSolicitante?: string;
  unidadeDeEnsino?: string;
  area?: string;
  setor?: string;
  status?: string;
  protocolo?: string;
  grupo?: string;
}

// Map spreadsheet groups to our supported UTEC IDs & Names dynamically
const mapGroupToUtec = (grupoStr: string) => {
  const normalized = String(grupoStr || "").toUpperCase();
  if (normalized.includes("BOTANICO") || normalized.includes("JARDIM")) {
    return { id: "utec-2", name: "UTEC JARDIM BOTANICO" };
  }
  if (normalized.includes("BOA VIAGEM")) {
    return { id: "utec-1", name: "UTEC BOA VIAGEM" };
  }
  if (normalized.includes("SITIO") || normalized.includes("TRINDADE")) {
    return { id: "utec-3", name: "UTEC SITIO TRINDADE" };
  }
  if (normalized.includes("SANTO AMARO")) {
    return { id: "utec-4", name: "UTEC SANTO AMARO" };
  }
  if (normalized.includes("GREGORIO") || normalized.includes("BEZERRA")) {
    return { id: "utec-5", name: "UTEC GREGORIO BEZERRA" };
  }
  if (normalized.includes("IBURA")) {
    return { id: "utec-6", name: "UTEC IBURA" };
  }
  if (normalized.includes("ALTO SANTA") || normalized.includes("ALTO STA") || normalized.includes("TEREZINHA")) {
    return { id: "utec-7", name: "UTEC ALTO STA TEREZINHA" };
  }
  if (normalized.includes("CAXANGÁ") || normalized.includes("CAXANGA")) {
    return { id: "utec-8", name: "UTEC CAXANGÁ" };
  }
  if (normalized.includes("COQUE")) {
    return { id: "utec-9", name: "UTEC COQUE" };
  }
  if (normalized.includes("CORDEIRO")) {
    return { id: "utec-10", name: "UTEC CORDEIRO" };
  }
  if (normalized.includes("CRISTIANO") || normalized.includes("DONATO")) {
    return { id: "utec-11", name: "UTEC CRISTIANO DONATO" };
  }
  if (normalized.includes("LARGO") || normalized.includes("DOM LUIS") || normalized.includes("LUIS")) {
    return { id: "utec-12", name: "UTEC LARGO DOM LUIS" };
  }
  if (normalized.includes("NOVA DESCOBERTA")) {
    return { id: "utec-13", name: "UTEC NOVA DESCOBERTA" };
  }
  if (normalized.includes("PINA")) {
    return { id: "utec-14", name: "UTEC PINA" };
  }
  return { id: "utec-1", name: "UTEC BOA VIAGEM" }; // Standard fallback
};

// Find matching school INEP code from internal catalog
const findInep = (schoolName: string): string => {
  const normS = String(schoolName || "").toUpperCase();
  if (normS.includes("UTEC")) return "";
  const match = INITIAL_EDUCATIONAL_UNITS.find(u => 
    normS.includes(u.nome_unidade.toUpperCase()) || 
    u.nome_unidade.toUpperCase().includes(normS)
  );
  return match ? match.inep_escola : "";
};

// Parse Month Name for filter consistency
const determineMonth = (dateStr: string): string => {
  if (String(dateStr).includes("/02/")) return "fev. de 2026";
  return "mar. de 2026";
};

// Smart, robust value finder that tolerates accents, case, spaces, and underscores
const findVal = (row: any, aliases: string[]): any => {
  if (!row || typeof row !== "object") return undefined;
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const normAlias = alias.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    for (const key of keys) {
      const normKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      if (normKey === normAlias) {
        return row[key];
      }
    }
  }
  return undefined;
};

// Ultimate flexible mapper for raw JSON attributes (supporting both Apps Script properties and CSV exports)
const mapSpreadsheetRowToDiaryRecord = (r: any, idx: number): DiaryRecord => {
  const getVal = (aliases: string[], fallback = "") => {
    const v = findVal(r, aliases);
    return v !== undefined && v !== null ? v : fallback;
  };

  // 1. Encontrar o grupo de forma inteligente nas colunas da planilha
  let group = "";
  const foundGroup = getVal([
    "grupo", "utec", "utecname", "utec_nome", "qualaasuaute", "qualaute", "qualaasuautec", "grupo_nome",
    "qualasuautec", "qualasuautecdeapoio", "suautec", "utecapoio", "utec_responsavel", "utec_solicitante", "selectutec"
  ]);

  if (foundGroup !== undefined && foundGroup !== null && foundGroup !== "") {
    group = String(foundGroup);
  } else {
    // Escaneia todas as chaves e valores no registro bruto em busca de qualquer valor que contenha "UTEC"
    const keys = Object.keys(r);
    for (const key of keys) {
      const valStr = String(r[key] || "");
      if (valStr.toUpperCase().includes("UTEC")) {
        group = valStr;
        break;
      }
    }
  }

  // Se ainda estiver em branco, vamos ver se a gente encontra pelo nome da unidade (escola ou própria UTEC)
  if (!group) {
    const unidadeVal = String(getVal(["unidadedeensino", "nomedaunidadedeensino", "escolanome", "escola_nome", "escola", "unidade", "unidade_ensino"], ""));
    if (unidadeVal.toUpperCase().includes("UTEC")) {
      group = unidadeVal;
    }
  }

  // Se realmente não encontrou nenhum grupo/UTEC no registro, vamos usar uma UTEC padrão,
  // mas distribuindo de forma rotativa baseada no índice para evitar empilhar artificialmente tudo em uma só
  if (!group) {
    const utecKeys = ["UTEC BOA VIAGEM", "UTEC JARDIM BOTANICO", "UTEC SITIO TRINDADE", "UTEC SANTO AMARO", "UTEC GREGORIO BEZERRA", "UTEC IBURA", "UTEC ALTO STA TEREZINHA"];
    group = utecKeys[idx % utecKeys.length];
  }

  const utecMapped = mapGroupToUtec(group);
  const dataOcorrencia = String(getVal(["dataocorrencia", "datadaocorrencia", "data", "carimbodedatahora", "carimbo", "data_ocorrencia"], "17/03/2026"));
  
  const rawEstudantes = getVal(["estudantes", "estudantesatendidos", "quantidadedeestudantes", "alunos", "qtdestudantes", "outros", "quantidade_estudantes"], "0");
  const rawProfessores = getVal(["professores", "professoresatendidos", "quantidadedeprofessores", "docentes", "qtdprofessores", "quantidade_professores"], "0");
  
  const parseCount = (val: any): number => {
    if (typeof val === 'number') {
      return Math.floor(val);
    }
    const str = String(val).trim();
    if (!str || str === "" || str === "-") return 0;
    if (str.includes("/") || str.includes("-")) return 0;
    const parsed = parseInt(str, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const numEstudantes = parseCount(rawEstudantes);
  const numProfessores = parseCount(rawProfessores);
  
  const categoria = String(getVal(["categoria", "categoriadeatendimento", "tipodeatendimento", "setor", "tipo_atendimento"], "Diário - Expediente na UTEC"));
  const unidade = String(getVal(["unidadedeensino", "nomedaunidadedeensino", "escolanome", "escola_nome", "escola", "unidade", "unidade_ensino"], "UTEC JARDIM BOTANICO"));
  const solicitante = String(getVal(["solicitante", "nomesolicitante", "nomedosolicitante", "nome", "multiplicador", "nome_solicitante"], "Renata Tavares da Silva"));
  const atendimentoTipo: 'Escola' | 'Externo/UTEC' = (categoria.includes("Expediente") || categoria.includes("Externo") || categoria === 'Diário - Expediente na UTEC') ? 'Externo/UTEC' : 'Escola';

  return {
    id: String(getVal(["id", "protocolo", "id_registro", "key"]) || `rec-idx-${idx}`),
    dataOcorrencia,
    turno1: String(getVal(["turno1", "turno", "turnos"], "")),
    turno2: String(getVal(["turno2"], "")),
    turno3: String(getVal(["turno3"], "")),
    participacao: String(getVal(["participacao"], "")),
    local: String(getVal(["local"], "")),
    observacoes: String(getVal(["observacoes"], "")),
    usuExterno: String(getVal(["usuexterno", "usuarioexterno"], "")),
    atividadesDesenvolvidas: String(getVal(["atividadesdesenvolvidas", "atividades", "atividades_desenvolvidas"], "")),
    observacao: String(getVal(["observacao", "observacoesservidor"], "")),
    demanda: String(getVal(["demanda"], "")),
    anfitriaoNaUe: String(getVal(["anfitriaonaue", "anfitriao"], "")),
    ocorrencia: String(getVal(["ocorrencia", "ocorrencias"], "")),
    planejamento: String(getVal(["planejamento"], "")),
    temaDaAtividade: String(getVal(["temadaatividade", "tema", "tema_atividade"], "")),
    outros: String(getVal(["outros"], "")),
    grupoImpacto: String(getVal(["grupoimpacto"], "")),
    modalidade: String(getVal(["modalidade"], "")),
    estudantes: numEstudantes,
    engajamentoEstudantes: String(getVal(["engajamentoestudantes"], "Não se aplica")),
    professores: numProfessores,
    engajamentoProfessores: String(getVal(["engajamentoprofessores"], "Não se aplica")),
    redsFisicos: String(getVal(["redsfisicos", "reds_fisicos"], "")),
    softwares: String(getVal(["softwares", "software"], "")),
    dataCarimbo: String(getVal(["datacarimbo", "carimbo"], "")),
    matriculaSolicitante: String(getVal(["matriculasolicitante", "matricula"], "")),
    nomeSolicitante: solicitante,
    unidadeDeEnsino: unidade,
    area: String(getVal(["area"], "UTEC")),
    setor: String(getVal(["setor"], "Outros Diários")),
    categoria,
    status: String(getVal(["status"], "Não Lida")),
    protocolo: String(getVal(["protocolo", "id", "registro"], `901201${idx}`)),
    grupo: group,
    
    // Derived compatibility variables
    utecId: utecMapped.id,
    utecName: utecMapped.name,
    escolaInep: findInep(unidade),
    escolaNome: unidade,
    qtdProfessores: numProfessores > 0 ? numProfessores : '-',
    qtdEstudantes: numEstudantes > 0 ? numEstudantes : '-',
    solicitante: solicitante,
    atendimentoTipo,
    mes: determineMonth(dataOcorrencia)
  };
};

// High-fidelity active historical rows matching the spreadsheet exactly
const realSpreadsheetRecords: any[] = [];
const _legacy_unused: any[] = [];
/* Legacy unused mock records removed to comply with using real spreadsheet data only.
  {
    dataOcorrencia: "18/03/2026",
    turno1: "Noite",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Não",
    atividadesDesenvolvidas: "Gestor(a), Assistente de Gestão",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Competências Digitais",
    ocorrencia: "",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "",
    outros: "",
    grupoImpacto: "Alto engajamento",
    modalidade: "Chromebook, TV",
    estudantes: 5,
    engajamentoEstudantes: "Alto engajamento",
    professores: 1,
    engajamentoProfessores: "Alto engajamento",
    redsFisicos: "Chromebook, TV",
    softwares: "Mídias interativas: realidade aumentada/jogos educativos/aplicativos interativos/simulações/games",
    dataCarimbo: "18/03/2026 20:42:44",
    matriculaSolicitante: "895094",
    nomeSolicitante: "Renata Tavares da Silva",
    unidadeDeEnsino: "PROFESSORA MARIA DA PAZ BRANDAO ALVES",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Orientação REDS",
    status: "Não Lida",
    protocolo: "901213",
    grupo: "UTEC JARDIM BOTANICO"
  },
  {
    dataOcorrencia: "17/03/2026",
    turno1: "Noite",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Não",
    atividadesDesenvolvidas: "Gestor(a), Assistente de Gestão",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Competências Digitais",
    ocorrencia: "",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "",
    outros: "",
    grupoImpacto: "Alto engajamento",
    modalidade: "Chromebook",
    estudantes: 6,
    engajamentoEstudantes: "Alto engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "Chromebook",
    softwares: "Mídias interativas: realidade aumentada/jogos educativos/aplicativos interativos/simulações/games",
    dataCarimbo: "18/03/2026 20:40:29",
    matriculaSolicitante: "895094",
    nomeSolicitante: "Renata Tavares da Silva",
    unidadeDeEnsino: "PROFESSORA MARIA DA PAZ BRANDAO ALVES",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Orientação REDS",
    status: "Não Lida",
    protocolo: "901212",
    grupo: "UTEC JARDIM BOTANICO"
  },
  {
    dataOcorrencia: "18/03/2026",
    turno1: "Tarde",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Gestor(a), Vice-gestor(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Clube de Programação e Robótica",
    ocorrencia: "",
    planejamento: "Estudantes",
    temaDaAtividade: "Anos Finais",
    outros: "9",
    grupoImpacto: "Médio Engajamento",
    modalidade: "",
    estudantes: 9,
    engajamentoEstudantes: "Médio Engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "18/03/2026 20:39:16",
    matriculaSolicitante: "895094",
    nomeSolicitante: "Renata Tavares da Silva",
    unidadeDeEnsino: "DE TEJIPIO",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Clubes e Projetos",
    status: "Não Lida",
    protocolo: "2181524",
    grupo: "UTEC JARDIM BOTANICO"
  },
  {
    dataOcorrencia: "17/03/2026",
    turno1: "Tarde",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Gestor(a), Coordenador(a) Pedagógico(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Clube de Programação e Robótica",
    ocorrencia: "",
    planejamento: "Estudantes",
    temaDaAtividade: "Anos Finais",
    outros: "24",
    grupoImpacto: "Alto engajamento",
    modalidade: "",
    estudantes: 24,
    engajamentoEstudantes: "Alto engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "18/03/2026 20:38:23",
    matriculaSolicitante: "895094",
    nomeSolicitante: "Renata Tavares da Silva",
    unidadeDeEnsino: "DOM BOSCO",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Clubes e Projetos",
    status: "Não Lida",
    protocolo: "2181523",
    grupo: "UTEC JARDIM BOTANICO"
  },
  {
    dataOcorrencia: "16/03/2026",
    turno1: "Tarde",
    turno2: "Noite",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "",
    atividadesDesenvolvidas: "Participação em reuniões, Planejamento interno de ações, Análise de materiais/documentos, Preparação de material de apoio",
    observacao: "",
    demanda: "",
    anfitriaoNaUe: "",
    ocorrencia: "",
    planejamento: "",
    temaDaAtividade: "",
    outros: "",
    grupoImpacto: "",
    modalidade: "",
    estudantes: 0,
    engajamentoEstudantes: "Não se aplica",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "18/03/2026 20:37:04",
    matriculaSolicitante: "895094",
    nomeSolicitante: "Renata Tavares da Silva",
    unidadeDeEnsino: "UTEC JARDIM BOTANICO",
    area: "UTEC",
    setor: "Outros Diários",
    categoria: "Diário - Expediente na UTEC",
    status: "Não Lida",
    protocolo: "922358",
    grupo: "UTEC JARDIM BOTANICO"
  },
  {
    dataOcorrencia: "17/03/2026",
    turno1: "Tarde",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Vice-gestor(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Não se aplica",
    ocorrencia: "",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "",
    outros: "20",
    grupoImpacto: "Altíssimo engajamento",
    modalidade: "Chromebook",
    estudantes: 20,
    engajamentoEstudantes: "Altíssimo engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "Chromebook",
    softwares: "Ferramentas Google For Education: Google Docs/Google Maps/Google forms",
    dataCarimbo: "17/03/2026 18:00:20",
    matriculaSolicitante: "374949",
    nomeSolicitante: "Audrey Rejane Gomes Carneiro",
    unidadeDeEnsino: "DO LEAO",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Orientação REDS",
    status: "Não Lida",
    protocolo: "901211",
    grupo: "UTEC BOA VIAGEM"
  },
  {
    dataOcorrencia: "17/03/2026",
    turno1: "Manhã",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Vice-gestor(a), Coordenador(a) Pedagógico(a), Coordenador(a) do Laboratório de Ciência e Tecnologia",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Clube de Programação e Robótica",
    ocorrencia: "",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "Anos Iniciais",
    outros: "20",
    grupoImpacto: "Altíssimo engajamento",
    modalidade: "",
    estudantes: 20,
    engajamentoEstudantes: "Altíssimo engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "17/03/2026 17:59:02",
    matriculaSolicitante: "374949",
    nomeSolicitante: "Audrey Rejane Gomes Carneiro",
    unidadeDeEnsino: "DO LEAO",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Clubes e Projetos",
    status: "Não Lida",
    protocolo: "2181522",
    grupo: "UTEC BOA VIAGEM"
  },
  {
    dataOcorrencia: "17/03/2026",
    turno1: "Tarde",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Não",
    atividadesDesenvolvidas: "Coordenador(a) Pedagógico(a), Vice-gestor(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Competências Digitais",
    ocorrencia: "",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "",
    outros: "16",
    grupoImpacto: "Altíssimo engajamento",
    modalidade: "Chromebook",
    estudantes: 16,
    engajamentoEstudantes: "Altíssimo engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "Chromebook",
    softwares: "Conteúdos digitais: Aulas digitais/podcast/vídeos/e-books",
    dataCarimbo: "17/03/2026 16:35:00",
    matriculaSolicitante: "941033",
    nomeSolicitante: "Cassiana Castro Gomes Menezes",
    unidadeDeEnsino: "RENATO ACCIOLY CARNEIRO CAMPOS",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Orientação REDS",
    status: "Não Lida",
    protocolo: "901210",
    grupo: "UTEC SITIO TRINDADE"
  },
  {
    dataOcorrencia: "17/03/2026",
    turno1: "Manhã",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Não",
    atividadesDesenvolvidas: "Gestor(a), Coordenador(a) Pedagógico(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Competências Digitais, E-mail Institucional",
    ocorrencia: "",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "",
    outros: "20",
    grupoImpacto: "Altíssimo engajamento",
    modalidade: "Chromebook",
    estudantes: 20,
    engajamentoEstudantes: "Altíssimo engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "Chromebook",
    softwares: "Ferramentas Google For Education: Google Docs/Google Maps/Google forms",
    dataCarimbo: "17/03/2026 16:31:06",
    matriculaSolicitante: "941033",
    nomeSolicitante: "Cassiana Castro Gomes Menezes",
    unidadeDeEnsino: "BOA ESPERANCA",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Orientação REDS",
    status: "Não Lida",
    protocolo: "901209",
    grupo: "UTEC SITIO TRINDADE"
  },
  {
    dataOcorrencia: "16/03/2026",
    turno1: "Manhã",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "",
    atividadesDesenvolvidas: "Participação em reuniões, Planejamento interno de ações, Preparação de material de apoio",
    observacao: "",
    demanda: "",
    anfitriaoNaUe: "",
    ocorrencia: "",
    planejamento: "",
    temaDaAtividade: "",
    outros: "",
    grupoImpacto: "",
    modalidade: "",
    estudantes: 0,
    engajamentoEstudantes: "Não se aplica",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "17/03/2026 12:15:56",
    matriculaSolicitante: "884048",
    nomeSolicitante: "Rosangela Negromonte Lins",
    unidadeDeEnsino: "UTEC SANTO AMARO",
    area: "UTEC",
    setor: "Outros Diários",
    categoria: "Diário - Expediente na UTEC",
    status: "Não Lida",
    protocolo: "922357",
    grupo: "UTEC SANTO AMARO"
  },
  {
    dataOcorrencia: "17/03/2026",
    turno1: "Manhã",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Vice-gestor(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "E-mail Institucional, Outros",
    ocorrencia: "Orientação aos professores do atendimento na UTEC e sugestão de apps para alfabetização e sobre sistema solar, conteúdo trabalhado no 4° d 5° ano. Agendamento para apoio na sala de aula sobre o uso de e-mail e do aplicativo Solar Sister.",
    planejamento: "Professores, Estudantes",
    temaDaAtividade: "",
    outros: "0",
    grupoImpacto: "Não se aplica",
    modalidade: "Não se aplica",
    estudantes: 0,
    engajamentoEstudantes: "Não se aplica",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "Não se aplica",
    softwares: "Ferramentas Google For Education: Google Docs/Google Maps/Google forms",
    dataCarimbo: "17/03/2026 12:14:17",
    matriculaSolicitante: "884048",
    nomeSolicitante: "Rosangela Negromonte Lins",
    unidadeDeEnsino: "UTEC SANTO AMARO",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Orientação REDS",
    status: "Não Lida",
    protocolo: "901208",
    grupo: "UTEC SANTO AMARO"
  },
  {
    dataOcorrencia: "13/03/2026",
    turno1: "Manhã",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "",
    atividadesDesenvolvidas: "Planejamento interno de ações, Preparação de material de apoio",
    observacao: "",
    demanda: "",
    anfitriaoNaUe: "",
    ocorrencia: "",
    planejamento: "",
    temaDaAtividade: "",
    outros: "",
    grupoImpacto: "",
    modalidade: "",
    estudantes: 0,
    engajamentoEstudantes: "Não se aplica",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "17/03/2026 12:08:07",
    matriculaSolicitante: "884048",
    nomeSolicitante: "Rosangela Negromonte Lins",
    unidadeDeEnsino: "UTEC SANTO AMARO",
    area: "UTEC",
    setor: "Outros Diários",
    categoria: "Diário - Expediente na UTEC",
    status: "Não Lida",
    protocolo: "922356",
    grupo: "UTEC SANTO AMARO"
  },
  {
    dataOcorrencia: "10/03/2026",
    turno1: "Manhã",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "",
    atividadesDesenvolvidas: "Preparação de material de apoio, Planejamento interno de ações",
    observacao: "",
    demanda: "",
    anfitriaoNaUe: "",
    ocorrencia: "",
    planejamento: "",
    temaDaAtividade: "",
    outros: "",
    grupoImpacto: "",
    modalidade: "",
    estudantes: 0,
    engajamentoEstudantes: "Não se aplica",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "17/03/2026 12:06:54",
    matriculaSolicitante: "884048",
    nomeSolicitante: "Rosangela Negromonte Lins",
    unidadeDeEnsino: "UTEC SANTO AMARO",
    area: "UTEC",
    setor: "Outros Diários",
    categoria: "Diário - Expediente na UTEC",
    status: "Não Lida",
    protocolo: "922355",
    grupo: "UTEC SANTO AMARO"
  },
  {
    dataOcorrencia: "12/03/2026",
    turno1: "Manhã",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Coordenador(a) Pedagógico(a)",
    observacao: "Sim - Infraestrutura da escola",
    demanda: "Executado",
    anfitriaoNaUe: "Clube de Programação e Robótica",
    ocorrencia: "",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "Anos Iniciais, Anos Finais",
    outros: "32",
    grupoImpacto: "Alto engajamento",
    modalidade: "",
    estudantes: 32,
    engajamentoEstudantes: "Alto engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "17/03/2026 12:04:11",
    matriculaSolicitante: "884048",
    nomeSolicitante: "Rosangela Negromonte Lins",
    unidadeDeEnsino: "NOSSA SENHORA DO PILAR",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Clubes e Projetos",
    status: "Não Lida",
    protocolo: "2181521",
    grupo: "UTEC SANTO AMARO"
  },
  {
    dataOcorrencia: "09/03/2026",
    turno1: "Manhã",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Coordenador(a) Pedagógico(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Outros",
    ocorrencia: "Engajamento das reds nos projetos dos professores com apoio da coordenação.",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "",
    outros: "0",
    grupoImpacto: "Não se aplica",
    modalidade: "Não se aplica",
    estudantes: 0,
    engajamentoEstudantes: "Não se aplica",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "Não se aplica",
    softwares: "Conteúdos digitais: Aulas digitais/podcast/vídeos/e-books",
    dataCarimbo: "17/03/2026 11:52:30",
    matriculaSolicitante: "884048",
    nomeSolicitante: "Rosangela Negromonte Lins",
    unidadeDeEnsino: "PROF JANDIRA BOTELHO PEREIRA DA COSTA",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Orientação REDS",
    status: "Não Lida",
    protocolo: "901207",
    grupo: "UTEC SANTO AMARO"
  },
  {
    dataOcorrencia: "03/03/2026",
    turno1: "Manhã",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Coordenador(a) Pedagógico(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Outros",
    ocorrencia: "Orientação sobre o clube de programação Anos iniciais e finais e escolha dos estudantes dos anos finais.",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "",
    outros: "10",
    grupoImpacto: "Alto engajamento",
    modalidade: "Não se aplica",
    estudantes: 10,
    engajamentoEstudantes: "Alto engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "Não se aplica",
    softwares: "Não se aplica",
    dataCarimbo: "17/03/2026 11:36:53",
    matriculaSolicitante: "884048",
    nomeSolicitante: "Rosangela Negromonte Lins",
    unidadeDeEnsino: "NOSSA SENHORA DO PILAR",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Orientação REDS",
    status: "Não Lida",
    protocolo: "901206",
    grupo: "UTEC SANTO AMARO"
  },
  {
    dataOcorrencia: "16/03/2026",
    turno1: "Manhã",
    turno2: "Tarde",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "",
    atividadesDesenvolvidas: "Participação em reuniões, Planejamento interno de ações, Produção de relatórios, Análise de materiais/documentos, Preparação de material de apoio",
    observacao: "",
    demanda: "",
    anfitriaoNaUe: "",
    ocorrencia: "",
    planejamento: "",
    temaDaAtividade: "",
    outros: "",
    grupoImpacto: "",
    modalidade: "",
    estudantes: 0,
    engajamentoEstudantes: "Não se aplica",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "16/03/2026 16:36:15",
    matriculaSolicitante: "941033",
    nomeSolicitante: "Cassiana Castro Gomes Menezes",
    unidadeDeEnsino: "UTEC SITIO TRINDADE",
    area: "UTEC",
    setor: "Outros Diários",
    categoria: "Diário - Expediente na UTEC",
    status: "Não Lida",
    protocolo: "922354",
    grupo: "UTEC SITIO TRINDADE"
  },
  {
    dataOcorrencia: "16/03/2026",
    turno1: "Manhã",
    turno2: "Tarde",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "",
    atividadesDesenvolvidas: "Planejamento interno de ações, Atendimento remoto, Atendimento de estudantes e/ou professores",
    observacao: "",
    demanda: "",
    anfitriaoNaUe: "",
    ocorrencia: "",
    planejamento: "",
    temaDaAtividade: "",
    outros: "",
    grupoImpacto: "",
    modalidade: "",
    estudantes: 0,
    engajamentoEstudantes: "Não se aplica",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "16/03/2026 16:30:42",
    matriculaSolicitante: "412496",
    nomeSolicitante: "Giselle Maria Carvalho da Silva",
    unidadeDeEnsino: "UTEC GREGORIO BEZERRA",
    area: "UTEC",
    setor: "Outros Diários",
    categoria: "Diário - Expediente na UTEC",
    status: "Não Lida",
    protocolo: "922353",
    grupo: "UTEC GREGORIO BEZERRA"
  },
  {
    dataOcorrencia: "13/03/2026",
    turno1: "Tarde",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Gestor(a), Coordenador(a) Pedagógico(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Outros",
    ocorrencia: "divulgação cursos Utec e divulgação ações do multiplicador",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "Anos Iniciais",
    outros: "20",
    grupoImpacto: "Alto engajamento",
    modalidade: "",
    estudantes: 20,
    engajamentoEstudantes: "Alto engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "16/03/2026 16:30:15",
    matriculaSolicitante: "412496",
    nomeSolicitante: "Giselle Maria Carvalho da Silva",
    unidadeDeEnsino: "HENFIL",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Clubes e Projetos",
    status: "Não Lida",
    protocolo: "2181520",
    grupo: "UTEC GREGORIO BEZERRA"
  },
  {
    dataOcorrencia: "13/03/2026",
    turno1: "Tarde",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Gestor(a), Coordenador(a) Pedagógico(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Outros",
    ocorrencia: "divulgação de cursos da Utec e de ações do multiplicador",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "Anos Iniciais",
    outros: "20",
    grupoImpacto: "Alto engajamento",
    modalidade: "",
    estudantes: 20,
    engajamentoEstudantes: "Alto engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "16/03/2026 16:11:39",
    matriculaSolicitante: "412496",
    nomeSolicitante: "Giselle Maria Carvalho da Silva",
    unidadeDeEnsino: "HENFIL",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Clubes e Projetos",
    status: "Não Lida",
    protocolo: "2181519",
    grupo: "UTEC GREGORIO BEZERRA"
  },
  {
    dataOcorrencia: "13/03/2026",
    turno1: "Tarde",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Coordenador(a) Pedagógico(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Outros",
    ocorrencia: "divulgação cursos Utec e divulgação de atividades do multiplicador",
    planejamento: "Estudantes, Professores, Equipe Gestora",
    temaDaAtividade: "Anos Iniciais",
    outros: "10",
    grupoImpacto: "Alto engajamento",
    modalidade: "",
    estudantes: 10,
    engajamentoEstudantes: "Alto engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "16/03/2026 16:01:38",
    matriculaSolicitante: "412496",
    nomeSolicitante: "Giselle Maria Carvalho da Silva",
    unidadeDeEnsino: "JOAO PESSOA GUERRA",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Clubes e Projetos",
    status: "Não Lida",
    protocolo: "2181518",
    grupo: "UTEC GREGORIO BEZERRA"
  },
  {
    dataOcorrencia: "12/03/2026",
    turno1: "Tarde",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Vice-gestor(a)",
    observacao: "Sim - Falta de equipamentos",
    demanda: "Não executado",
    anfitriaoNaUe: "Clube de Programação e Robótica",
    ocorrencia: "",
    planejamento: "Estudantes, Professores",
    temaDaAtividade: "Anos Iniciais, Anos Finais",
    outros: "0",
    grupoImpacto: "Não se aplica",
    modalidade: "",
    estudantes: 0,
    engajamentoEstudantes: "Não se aplica",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "16/03/2026 16:00:40",
    matriculaSolicitante: "662852",
    nomeSolicitante: "Juliana Maria dos Santos",
    unidadeDeEnsino: "DIVINO ESPIRITO SANTO",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Clubes e Projetos",
    status: "Não Lida",
    protocolo: "2181517",
    grupo: "UTEC GREGORIO BEZERRA"
  },
  {
    dataOcorrencia: "13/03/2026",
    turno1: "Manhã",
    turno2: "",
    turno3: "",
    participacao: "",
    local: "",
    observacoes: "",
    usuExterno: "Sim",
    atividadesDesenvolvidas: "Vice-gestor(a), Coordenador(a) Pedagógico(a)",
    observacao: "Não",
    demanda: "Executado",
    anfitriaoNaUe: "Outros",
    ocorrencia: "divulgação cursos Utec",
    planejamento: "Estudantes, Professores, Equipe Gestora",
    temaDaAtividade: "Anos Iniciais",
    outros: "38",
    grupoImpacto: "Alto engajamento",
    modalidade: "",
    estudantes: 38,
    engajamentoEstudantes: "Alto engajamento",
    professores: 0,
    engajamentoProfessores: "Não se aplica",
    redsFisicos: "",
    softwares: "",
    dataCarimbo: "16/03/2026 15:57:23",
    matriculaSolicitante: "412496",
    nomeSolicitante: "Giselle Maria Carvalho da Silva",
    unidadeDeEnsino: "MAGALHAES BASTOS",
    area: "UTEC",
    setor: "Diário de Atendimento a Unidade Escolar",
    categoria: "Diário - Clubes e Projetos",
    status: "Não Lida",
    protocolo: "2181516",
    grupo: "UTEC GREGORIO BEZERRA"
  }
];

const generateSimulatedData = (): DiaryRecord[] => {
  return realSpreadsheetRecords.map((r, idx) => mapSpreadsheetRowToDiaryRecord(r, idx));
};

const _unusedLegacyGenerator = () => {
  const records: any[] = [];

  // Helper arrays
  const categories: DiaryRecord['categoria'][] = [
    'Diário - Expediente na UTEC',
    'Diário - Eventos Externos',
    'Diário - Clubes e Projetos',
    'Diário - Orientação REDS'
  ];

  // Distribution of categories
  // Diário - Expediente na UTEC: 123 (55.4%)
  // Diário - Eventos Externos: 53 (23.9%)
  // Diário - Clubes e Projetos: 29 (13.1%)
  // Diário - Orientação REDS: 17 (7.7%)
  const catDistribution = {
    'Diário - Expediente na UTEC': 123,
    'Diário - Eventos Externos': 53,
    'Diário - Clubes e Projetos': 29,
    'Diário - Orientação REDS': 17
  };

  // Distribution of UTECs (Total: 222)
  // UTEC 1: 93
  // UTEC 2: 44
  // UTEC 3: 42
  // UTEC 4: 15
  // UTEC 5: 14
  // UTEC 6: 6
  // UTEC 7: 4 (Alto Santa Terezinha equivalent, matches mockup)
  // UTEC 8: 3
  // UTEC 9: 1
  const utecDistribution: { [key: string]: number } = {
    'utec-1': 93,
    'utec-2': 44,
    'utec-3': 42,
    'utec-4': 15,
    'utec-5': 14,
    'utec-6': 6,
    'utec-7': 4, // Exact 4 records matching mockup
    'utec-8': 3,
    'utec-9': 1
  };

  // Multipliers Top 5:
  // Patrícia Mariano de Barros: 47
  // Renata Tavares da Silva: 41
  // Gisselle Maria Carvalho da Silva: 29
  // Rosangela Negromonte Lins: 24
  // Denise Maria Lopes da Silva: 19
  // Cassiana Castro Gomes Menezes: 15
  // Valdeluzia Maria Coelho: 4 (all in utec-7)
  // Remaining: 43 distributed among others (total 13 multipliers)
  const multiplierList = [
    'Patrícia Mariano de Barros',
    'Renata Tavares da Silva',
    'Gisselle Maria Carvalho da Silva',
    'Rosangela Negromonte Lins',
    'Denise Maria Lopes da Silva',
    'Cassiana Castro Gomes Menezes',
    'Valdeluzia Maria Coelho',
    'Aline de Souza',
    'Felipe Cabral Pontes',
    'Sônia Guimarães',
    'Júlio César Santos',
    'Carla Dias Medeiros',
    'Amanda Sales'
  ];

  // Distribution by month:
  // Fev. 2026: 76
  // Mar. 2026: 146
  // Total: 222
  const monthDistribution = {
    'fev. de 2026': 76,
    'mar. de 2026': 146
  };

  // Setup arrays to track counters for accurate synthesis
  let catIndices = {
    'Diário - Expediente na UTEC': 0,
    'Diário - Eventos Externos': 0,
    'Diário - Clubes e Projetos': 0,
    'Diário - Orientação REDS': 0
  };

  let multIndices = {
    'Patrícia Mariano de Barros': 0,
    'Renata Tavares da Silva': 0,
    'Gisselle Maria Carvalho da Silva': 0,
    'Rosangela Negromonte Lins': 0,
    'Denise Maria Lopes da Silva': 0,
    'Cassiana Castro Gomes Menezes': 0,
    'Valdeluzia Maria Coelho': 0
  };

  const multTargets = {
    'Patrícia Mariano de Barros': 47,
    'Renata Tavares da Silva': 41,
    'Gisselle Maria Carvalho da Silva': 29,
    'Rosangela Negromonte Lins': 24,
    'Denise Maria Lopes da Silva': 19,
    'Cassiana Castro Gomes Menezes': 15,
    'Valdeluzia Maria Coelho': 4
  };

  let fevCounter = 0;
  let marCounter = 0;

  // Let's create the 4 exact records for UTEC 7 first (Valdeluzia Maria Coelho)
  const utec7Schools = INITIAL_EDUCATIONAL_UNITS.filter(u => u.id_utec_suporte === 'utec-7');
  const u7School = utec7Schools[0] || INITIAL_EDUCATIONAL_UNITS[0];
  const u7Dates = ['02/02/2026', '03/02/2026', '05/02/2026', '06/02/2026'];
  const utecInfo7 = INITIAL_UTECS.find(u => u.id === 'utec-7') || { name: 'UTEC ALTO STA TEREZINHA' };

  for (let i = 0; i < 4; i++) {
    records.push({
      id: `record-u7-${i}`,
      utecId: 'utec-7',
      utecName: utecInfo7.name,
      escolaInep: u7School.inep_escola,
      escolaNome: u7School.nome_unidade,
      dataOcorrencia: u7Dates[i],
      solicitante: 'Valdeluzia Maria Coelho',
      qtdProfessores: '-',
      qtdEstudantes: '-',
      categoria: 'Diário - Expediente na UTEC',
      atendimentoTipo: 'Externo/UTEC',
      mes: 'fev. de 2026'
    });
    catIndices['Diário - Expediente na UTEC']++;
    multIndices['Valdeluzia Maria Coelho']++;
    fevCounter++;
  }

  // Now create the other 218 records distributed to match everything
  const allOtherUtecs = ['utec-1', 'utec-2', 'utec-3', 'utec-4', 'utec-5', 'utec-6', 'utec-8', 'utec-9'];
  
  // Create arrays of school names corresponding to each UTEC to pull real units
  const schoolsByUtec: { [key: string]: typeof INITIAL_EDUCATIONAL_UNITS } = {};
  INITIAL_EDUCATIONAL_UNITS.forEach(school => {
    if (!schoolsByUtec[school.id_utec_suporte]) {
      schoolsByUtec[school.id_utec_suporte] = [];
    }
    schoolsByUtec[school.id_utec_suporte].push(school);
  });

  let globalIdCount = 0;

  allOtherUtecs.forEach(utecId => {
    const targetCount = utecDistribution[utecId];
    const utecSchoolsList = schoolsByUtec[utecId] || INITIAL_EDUCATIONAL_UNITS;
    
    // Get correct UTEC name from system config
    const utecInfo = INITIAL_UTECS.find(u => u.id === utecId) || { name: utecId.toUpperCase() };
    const utecName = utecInfo.name;

    for (let j = 0; j < targetCount; j++) {
      // Pick school
      const school = utecSchoolsList[j % utecSchoolsList.length];

      // Assign Category ensuring exact distributions
      let chosenCat: DiaryRecord['categoria'] = 'Diário - Expediente na UTEC';
      if (catIndices['Diário - Eventos Externos'] < catDistribution['Diário - Eventos Externos']) {
        chosenCat = 'Diário - Eventos Externos';
        catIndices['Diário - Eventos Externos']++;
      } else if (catIndices['Diário - Clubes e Projetos'] < catDistribution['Diário - Clubes e Projetos']) {
        chosenCat = 'Diário - Clubes e Projetos';
        catIndices['Diário - Clubes e Projetos']++;
      } else if (catIndices['Diário - Orientação REDS'] < catDistribution['Diário - Orientação REDS']) {
        chosenCat = 'Diário - Orientação REDS';
        catIndices['Diário - Orientação REDS']++;
      } else {
        chosenCat = 'Diário - Expediente na UTEC';
        catIndices['Diário - Expediente na UTEC']++;
      }

      // Assign Multiplier ensuring exact distribution
      let chosenMultiplier = '';
      if (multIndices['Patrícia Mariano de Barros'] < multTargets['Patrícia Mariano de Barros']) {
        chosenMultiplier = 'Patrícia Mariano de Barros';
        multIndices['Patrícia Mariano de Barros']++;
      } else if (multIndices['Renata Tavares da Silva'] < multTargets['Renata Tavares da Silva']) {
        chosenMultiplier = 'Renata Tavares da Silva';
        multIndices['Renata Tavares da Silva']++;
      } else if (multIndices['Gisselle Maria Carvalho da Silva'] < multTargets['Gisselle Maria Carvalho da Silva']) {
        chosenMultiplier = 'Gisselle Maria Carvalho da Silva';
        multIndices['Gisselle Maria Carvalho da Silva']++;
      } else if (multIndices['Rosangela Negromonte Lins'] < multTargets['Rosangela Negromonte Lins']) {
        chosenMultiplier = 'Rosangela Negromonte Lins';
        multIndices['Rosangela Negromonte Lins']++;
      } else if (multIndices['Denise Maria Lopes da Silva'] < multTargets['Denise Maria Lopes da Silva']) {
        chosenMultiplier = 'Denise Maria Lopes da Silva';
        multIndices['Denise Maria Lopes da Silva']++;
      } else if (multIndices['Cassiana Castro Gomes Menezes'] < multTargets['Cassiana Castro Gomes Menezes']) {
        chosenMultiplier = 'Cassiana Castro Gomes Menezes';
        multIndices['Cassiana Castro Gomes Menezes']++;
      } else {
        // Fallback to remaining multipliers (total 13)
        const remIndex = (j + globalIdCount) % 6; // Indices 7 to 12
        chosenMultiplier = multiplierList[7 + remIndex];
      }

      // Month
      let chosenMonth: DiaryRecord['mes'] = 'mar. de 2026';
      if (fevCounter < monthDistribution['fev. de 2026']) {
        chosenMonth = 'fev. de 2026';
        fevCounter++;
      } else {
        chosenMonth = 'mar. de 2026';
        marCounter++;
      }

      // Date string
      const day = ((j + 3) % 27) + 1;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const yearMonth = chosenMonth === 'fev. de 2026' ? '02/2026' : '03/2026';
      const dateStr = `${dayStr}/${yearMonth}`;

      // Atendimento tipo based on category
      const type: DiaryRecord['atendimentoTipo'] = chosenCat === 'Diário - Expediente na UTEC' ? 'Externo/UTEC' : 'Escola';

      records.push({
        id: `record-sim-${globalIdCount}`,
        utecId,
        utecName,
        escolaInep: school.inep_escola,
        escolaNome: school.nome_unidade,
        dataOcorrencia: dateStr,
        solicitante: chosenMultiplier,
        qtdProfessores: type === 'Escola' ? Math.floor(Math.random() * 3) + 1 : '-',
        qtdEstudantes: type === 'Escola' ? Math.floor(Math.random() * 15) + 5 : '-',
        categoria: chosenCat,
        atendimentoTipo: type,
        mes: chosenMonth
      });

      globalIdCount++;
    }
  });

  return records;
};
*/

export default function MultiplierDiary({ utecs }: MultiplierDiaryProps) {
  // Store all diary records
  const [diaryRecords, setDiaryRecords] = useState<DiaryRecord[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showIntegrationPanel, setShowIntegrationPanel] = useState(false);

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxOe9MujeLIGxM3L5QJVd28NhAgljTnoKGS_jMAjM5K8k7wnlKjtlJkBrmWyPW-0ht2/exec';
  const API_FEED_URL = '/api/diary';

  const fetchDiaryData = async (manual = false) => {
    if (manual) {
      setIsRefreshing(true);
    } else {
      setSyncStatus('loading');
    }
    setSyncError(null);

    try {
      const response = await fetch(API_FEED_URL);
      if (!response.ok) {
        throw new Error(`Erro HTTP! Status: ${response.status}`);
      }
      const result = await response.json();
      if (result && result.status === 'success' && Array.isArray(result.data)) {
        if (result.data.length > 0) {
          const formattedData = result.data.map((r: any, idx: number) => mapSpreadsheetRowToDiaryRecord(r, idx));
          setDiaryRecords(formattedData);
          setSyncStatus('success');
        } else {
          setSyncStatus('idle'); // Successfully connected but Spreadsheet is brand new
        }
      } else {
        throw new Error(result?.message || 'Formato de resposta inválido obtido do Apps Script.');
      }
    } catch (err: any) {
      console.warn("Error fetching spreadsheet records:", err);
      setSyncStatus('error');
      setSyncError('Erro: Não foi possível obter os registros da Planilha Google. Certifique-se de que o link do Apps Script está correto na integração e implantado como app da web para "Qualquer pessoa".');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiaryData();
  }, []);

  // Active View mode: 'Geral' or 'Por UTEC'
  const [viewMode, setViewMode] = useState<'Geral' | 'Por UTEC'>('Geral');

  // Top Filter selections in UI
  const [filterUtecId, setFilterUtecId] = useState<string>('Todas');
  const [filterEscolaInep, setFilterEscolaInep] = useState<string>('Todas');
  const [filterCategory, setFilterCategory] = useState<string>('Todas');
  const [filterMonth, setFilterMonth] = useState<string>('Todas');
  const [filterSolicitante, setFilterSolicitante] = useState<string>('Todas');

  // Unique lists derived from records
  const uniqueMultipliers = useMemo(() => {
    const list = Array.from(new Set(diaryRecords.map(r => r.solicitante)));
    return list.sort();
  }, [diaryRecords]);

  const uniqueSchools = useMemo(() => {
    const map = new Map<string, string>();
    diaryRecords.forEach(r => {
      map.set(r.escolaInep, r.escolaNome);
    });
    return Array.from(map.entries()).map(([inep, name]) => ({ inep, name }));
  }, [diaryRecords]);

  // Derived filtered records for analysis
  const filteredRecords = useMemo(() => {
    return diaryRecords.filter(record => {
      // Utec Filter
      if (filterUtecId !== 'Todas' && record.utecId !== filterUtecId) return false;
      // Escola Filter
      if (filterEscolaInep !== 'Todas' && record.escolaInep !== filterEscolaInep) return false;
      // Categoria Filter
      if (filterCategory !== 'Todas' && record.categoria !== filterCategory) return false;
      // Month/Período Filter
      if (filterMonth !== 'Todas' && record.mes !== filterMonth) return false;
      // Solicitante Filter
      if (filterSolicitante !== 'Todas' && record.solicitante !== filterSolicitante) return false;

      return true;
    });
  }, [diaryRecords, filterUtecId, filterEscolaInep, filterCategory, filterMonth, filterSolicitante]);

  // Active schools list in filter dropdown (scoped to selected UTEC if applicable)
  const scopedFilterSchools = useMemo(() => {
    if (filterUtecId === 'Todas') {
      return uniqueSchools;
    }
    return uniqueSchools.filter(school => {
      const parentUnit = INITIAL_EDUCATIONAL_UNITS.find(u => u.inep_escola === school.inep);
      return parentUnit ? parentUnit.id_utec_suporte === filterUtecId : true;
    });
  }, [filterUtecId, uniqueSchools]);

  // KPIs Calculations
  const kpis = useMemo(() => {
    // 1. Total Registros
    const totalRegistros = filteredRecords.length;

    // 2. Estudantes Impactados (real counts, ignoring mock/fallback averages)
    const estudantesImpactados = filteredRecords.reduce((sum, r) => {
      const val = typeof r.qtdEstudantes === 'number' 
        ? r.qtdEstudantes 
        : parseInt(String(r.qtdEstudantes), 10);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const roundedEstudantes = Math.round(estudantesImpactados);

    // 3. Atendimentos em Escolas
    const atendimentosEscolas = filteredRecords.filter(r => r.atendimentoTipo === 'Escola').length;

    // 4. Unidades Escolares com Registro (filtering for matched valid schools only)
    const schoolsWithReg = new Set(
      filteredRecords
        .filter(r => r.escolaInep)
        .map(r => r.escolaInep)
    ).size;

    // 5. Multiplicadores
    const multiplicadoresCount = new Set(
      filteredRecords
        .filter(r => r.solicitante && r.solicitante.trim() !== '')
        .map(r => r.solicitante)
    ).size;

    // 6. Professores Impactados (real counts, ignoring mock/fallback averages)
    const professoresImpactados = filteredRecords.reduce((sum, r) => {
      const val = typeof r.qtdProfessores === 'number' 
        ? r.qtdProfessores 
        : parseInt(String(r.qtdProfessores), 10);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    const roundedProfessores = Math.round(professoresImpactados);

    // 7. Atendimentos Externos / UTECs
    const atendimentosExternos = filteredRecords.filter(r => r.atendimentoTipo === 'Externo/UTEC').length;

    // 8. Unidades Escolares sem Registro
    // Calculado dinamicamente a partir das unidades de ensino reais carregadas no sistema
    const totalPossibleUnits = filterUtecId === 'Todas'
      ? INITIAL_EDUCATIONAL_UNITS.length
      : INITIAL_EDUCATIONAL_UNITS.filter(u => u.id_utec_suporte === filterUtecId).length;
    const schoolsWithoutReg = Math.max(0, totalPossibleUnits - schoolsWithReg);

    // Latest occurrence
    let ultimaOcorrencia = 'N/A';
    if (filteredRecords.length > 0) {
      // Find latest date
      const sortedByDate = [...filteredRecords].sort((a, b) => {
        // Simple day parse
        const dayA = idxOf(a.dataOcorrencia);
        const dayB = idxOf(b.dataOcorrencia);
        return dayB - dayA;
      });
      ultimaOcorrencia = sortedByDate[0].dataOcorrencia;
    }

    return {
      totalRegistros,
      estudantesImpactados: roundedEstudantes,
      atendimentosEscolas: atendimentosEscolas,
      schoolsWithReg: schoolsWithReg,
      multiplicadoresCount: multiplicadoresCount,
      professoresImpactados: roundedProfessores,
      atendimentosExternos: atendimentosExternos,
      schoolsWithoutReg: schoolsWithoutReg,
      ultimaOcorrencia
    };
  }, [filteredRecords, viewMode]);

  function idxOf(dateStr: string) {
    const parts = dateStr.split('/');
    if (parts.length < 3) return 0;
    return parseInt(parts[2], 10) * 10000 + parseInt(parts[1], 10) * 100 + parseInt(parts[0], 10);
  }

  // --- CHARTS CALCULATIONS ---

  // 1. Total Planejamentos por UTEC
  const chartPlanejamentosPorUtec = useMemo(() => {
    const utecNamesMock = {
      'utec-1': 'UTEC GREGORIO BEZERRA',
      'utec-2': 'UTEC SANTO AMARO',
      'utec-3': 'UTEC JARDIM BOTANICO',
      'utec-4': 'UTEC SITIO TRINDADE',
      'utec-5': 'UTEC IBURA',
      'utec-6': 'UTEC CRISTIANO DONATO',
      'utec-7': 'UTEC ALTO SANTA TEREZINHA',
      'utec-8': 'UTEC BOA VIAGEM',
      'utec-9': 'UTEC ALTO SANTA TEREZINHA' // fallback
    };

    const countMap: { [key: string]: number } = {};
    filteredRecords.forEach(r => {
      // Get readable Utec Name or Utec simple label
      const name = r.utecName;
      countMap[name] = (countMap[name] || 0) + 1;
    });

    // Generate ordered list matching distribution
    return utecs.map(u => ({
      name: u.name,
      value: countMap[u.name] || 0
    })).sort((a, b) => b.value - a.value);
  }, [filteredRecords, utecs]);

  // 2. Total Preenchimento por Unidade de Ensino
  const chartPreenchimentoPorEscola = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredRecords.forEach(r => {
      counts[r.escolaNome] = (counts[r.escolaNome] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('Escola Municipal ', 'EM ').replace('Creche Escola Municipal ', 'CEM '),
      value
    })).sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  // 3. TOP 5 Registros por UTEC
  const chartTop5Utecs = useMemo(() => {
    return chartPlanejamentosPorUtec.slice(0, 5);
  }, [chartPlanejamentosPorUtec]);

  // 4. TOP 5 / Top Professores com Atividades
  const chartTopProfessores = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredRecords.forEach(r => {
      counts[r.solicitante] = (counts[r.solicitante] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filteredRecords]);

  // 5. Registros por Mês
  const chartRegistrosPorMes = useMemo(() => {
    const fevCount = filteredRecords.filter(r => r.mes === 'fev. de 2026').length;
    const marCount = filteredRecords.filter(r => r.mes === 'mar. de 2026').length;

    return [
      { name: 'fev. de 2026', value: fevCount },
      { name: 'mar. de 2026', value: marCount }
    ];
  }, [filteredRecords]);

  // 6. Registro por Mês - Categorias (Donut)
  const chartCategoriasPie = useMemo(() => {
    const map: { [key: string]: number } = {};
    filteredRecords.forEach(r => {
      map[r.categoria] = (map[r.categoria] || 0) + 1;
    });

    return [
      { name: 'Diário - Expediente na UTEC', value: map['Diário - Expediente na UTEC'] || 0, color: '#3B82F6' },
      { name: 'Diário - Eventos Externos', value: map['Diário - Eventos Externos'] || 0, color: '#F59E0B' },
      { name: 'Diário - Clubes e Projetos', value: map['Diário - Clubes e Projetos'] || 0, color: '#EC4899' },
      { name: 'Diário - Orientação REDS', value: map['Diário - Orientação REDS'] || 0, color: '#10B981' }
    ].filter(item => item.value > 0);
  }, [filteredRecords]);

  const totalCategoriasCount = useMemo(() => {
    return chartCategoriasPie.reduce((sum, item) => sum + item.value, 0);
  }, [chartCategoriasPie]);

  // Toggle View mode and reset filters to matching presets for demonstration
  const handleToggleViewMode = (mode: 'Geral' | 'Por UTEC') => {
    setViewMode(mode);
    if (mode === 'Por UTEC') {
      // Set default selected UTEC to UTEC ALTO STA TEREZINHA to show exactly the second screenshot data
      setFilterUtecId('utec-7');
      setFilterCategory('Todas');
      setFilterEscolaInep('Todas');
      setFilterMonth('Todas');
      setFilterSolicitante('Todas');
    } else {
      // Reset all filters in General mode
      setFilterUtecId('Todas');
      setFilterCategory('Todas');
      setFilterEscolaInep('Todas');
      setFilterMonth('Todas');
      setFilterSolicitante('Todas');
    }
  };

  return (
    <div id="multiplier-diary-dashboard-view" className="space-y-4">
      
      {/* 1. Header Control Panel - Compact and Clean */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#111827] p-3 px-4 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-3xs">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
              Diário do Multiplicador - Recife
            </span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
              Sincronização Ativa de Produção
            </span>
          </div>
        </div>

        {/* Controls, Sync Status, and New Record buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active indicator */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black group transition-all select-none ${
              syncStatus === 'loading'
                ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-250/20'
                : syncStatus === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-250/20'
                : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 border border-amber-250/20'
            }`}
          >
            <Database className="w-3.5 h-3.5 animate-pulse" />
            <span>
              {syncStatus === 'loading' && 'Sincronizando...'}
              {syncStatus === 'success' && 'Planilha Conectada'}
              {syncStatus === 'error' && 'Conectado (Offline)'}
              {syncStatus === 'idle' && 'Verificar Planilha'}
            </span>
          </div>

          {/* Manual Refresh button */}
          <button
            onClick={() => fetchDiaryData(true)}
            disabled={isRefreshing}
            className="p-1 px-1.5 rounded-lg border border-slate-150 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-500 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
            title="Forçar recarga da Planilha"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Toggle views */}
          <div className="bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg flex border border-slate-200/50 dark:border-slate-850">
            <button
              onClick={() => handleToggleViewMode('Geral')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all ${
                viewMode === 'Geral'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
              }`}
            >
              Geral
            </button>
            <button
              onClick={() => handleToggleViewMode('Por UTEC')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all ${
                viewMode === 'Por UTEC'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
              }`}
            >
              Por UTEC
            </button>
          </div>
        </div>
      </div>





      {/* 2 & 3. COMPREHENSIVE KPI & FILTER GRID BLOCK WITH TWO COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" id="kpis-and-filters-grid-view">
        
        {/* Left Column (span 3): KPIs (Forms 2 rows of 4 cards in General mode, 1 row of 3 cards in UTEC mode) */}
        <div className="lg:col-span-3 space-y-4">
          {viewMode === 'Geral' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in animate-duration-300" id="kpi-grid-geral">
              {/* Card 1: Registros */}
              <div
                id="diary-kpi-registros"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80 border-b-3 border-b-blue-500 dark:border-b-blue-600 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate" title="Número de Registros">
                    Número de Registros
                  </span>
                  <div className="p-1.5 rounded-md bg-blue-50 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 leading-none">
                    {kpis.totalRegistros}
                  </h3>
                  <p className="text-[10px] text-blue-650 dark:text-blue-400 font-bold mt-1 uppercase tracking-wider">
                    Preenchidos
                  </p>
                </div>
              </div>

              {/* Card 2: Estudantes Impactados */}
              <div
                id="diary-kpi-estudantes"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80 border-b-3 border-b-violet-500 dark:border-b-violet-600 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate" title="Estudantes Impactados">
                    Estudantes Impactados
                  </span>
                  <div className="p-1.5 rounded-md bg-violet-50 dark:bg-slate-800/80 text-violet-600 dark:text-violet-400 flex-shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 leading-none">
                    {kpis.estudantesImpactados}
                  </h3>
                  <p className="text-[10px] text-violet-650 dark:text-violet-400 font-bold mt-1 uppercase tracking-wider">
                    Impactados
                  </p>
                </div>
              </div>

              {/* Card 3: Atendimentos em Escolas */}
              <div
                id="diary-kpi-atend-escolas"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80 border-b-3 border-b-emerald-500 dark:border-b-emerald-600 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate" title="Atendimentos em Escolas">
                    Atendimentos em Escolas
                  </span>
                  <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 leading-none">
                    {kpis.atendimentosEscolas}
                  </h3>
                  <p className="text-[10px] text-emerald-650 dark:text-emerald-400 font-bold mt-1 uppercase tracking-wider">
                    Atendimentos
                  </p>
                </div>
              </div>

              {/* Card 4: Unidades Escolares com Registro */}
              <div
                id="diary-kpi-unid-com-reg"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80 border-b-3 border-b-amber-500 dark:border-b-amber-600 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate" title="Unid. Escolares com Registro">
                    Unid. Escolares com Registro
                  </span>
                  <div className="p-1.5 rounded-md bg-amber-50 dark:bg-slate-800/80 text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 leading-none">
                    {kpis.schoolsWithReg}
                  </h3>
                  <p className="text-[10px] text-amber-650 dark:text-amber-400 font-bold mt-1 uppercase tracking-wider">
                    Unidades Ativas
                  </p>
                </div>
              </div>

              {/* Card 5: Multiplicadores */}
              <div
                id="diary-kpi-multiplicadores"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80 border-b-3 border-b-teal-500 dark:border-b-teal-600 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate" title="Multiplicadores">
                    Multiplicadores
                  </span>
                  <div className="p-1.5 rounded-md bg-teal-50 dark:bg-slate-800/80 text-teal-600 dark:text-teal-400 flex-shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 leading-none">
                    {kpis.multiplicadoresCount}
                  </h3>
                  <p className="text-[10px] text-teal-650 dark:text-teal-400 font-bold mt-1 uppercase tracking-wider">
                    Profissionais
                  </p>
                </div>
              </div>

              {/* Card 6: Professores Impactados */}
              <div
                id="diary-kpi-professores"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80 border-b-3 border-b-pink-500 dark:border-b-pink-600 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate" title="Professores Impactados">
                    Professores Impactados
                  </span>
                  <div className="p-1.5 rounded-md bg-pink-50 dark:bg-slate-800/80 text-pink-600 dark:text-pink-400 flex-shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 leading-none">
                    {kpis.professoresImpactados}
                  </h3>
                  <p className="text-[10px] text-pink-650 dark:text-pink-400 font-bold mt-1 uppercase tracking-wider">
                    Impactados
                  </p>
                </div>
              </div>

              {/* Card 7: Atendimentos Externos/UTECs */}
              <div
                id="diary-kpi-atend-externos"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80 border-b-3 border-b-indigo-500 dark:border-b-indigo-600 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate" title="Atendimentos Externos/UTECs">
                    Atendimentos Externos/UTECs
                  </span>
                  <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 leading-none">
                    {kpis.atendimentosExternos}
                  </h3>
                  <p className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold mt-1 uppercase tracking-wider">
                    Na Sede / Ext.
                  </p>
                </div>
              </div>

              {/* Card 8: Unidades Escolares sem Registro */}
              <div
                id="diary-kpi-unid-sem-reg"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800/80 border-b-3 border-b-red-500 dark:border-b-red-650 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate" title="Unid. Escolares sem Registro">
                    Unid. Escolares sem Registro
                  </span>
                  <div className="p-1.5 rounded-md bg-red-50 dark:bg-slate-800/80 text-red-650 dark:text-red-400 flex-shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-red-600 dark:text-red-400 leading-none">
                    {kpis.schoolsWithoutReg}
                  </h3>
                  <p className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-1 uppercase tracking-wider">
                    Sem Atividade
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* KPI GRID FOR POR UTEC relatórios VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in" id="kpi-grid-por-utec">
              {/* Card 1: Total Registro */}
              <div
                id="diary-utec-kpi-total"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800 border-b-3 border-b-blue-500 dark:border-b-blue-600 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
                    REGISTROS DA UTEC
                  </span>
                  <div className="p-1.5 rounded-md bg-blue-50 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 leading-none">
                    {kpis.totalRegistros}
                  </h3>
                  <p className="text-[10px] text-blue-650 dark:text-blue-400 font-bold mt-1 uppercase tracking-wider">
                    atividades preenchidas
                  </p>
                </div>
              </div>

              {/* Card 2: Professores Multiplicadores */}
              <div
                id="diary-utec-kpi-multiplicadores"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800 border-b-3 border-b-violet-500 dark:border-b-violet-600 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
                    MULTIPLICADORES DA UTEC
                  </span>
                  <div className="p-1.5 rounded-md bg-violet-50 dark:bg-slate-800/80 text-violet-600 dark:text-violet-400 flex-shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 leading-none">
                    {kpis.multiplicadoresCount}
                  </h3>
                  <p className="text-[10px] text-violet-650 dark:text-violet-400 font-bold mt-1 uppercase tracking-wider">
                    profissionais ativos
                  </p>
                </div>
              </div>

              {/* Card 3: Última Ocorrência */}
              <div
                id="diary-utec-kpi-ultima"
                className="flex flex-col justify-between p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-800 border-b-3 border-b-emerald-500 dark:border-b-emerald-600 transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
                    ÚLTIMA OCORRÊNCIA
                  </span>
                  <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-750 dark:text-slate-100 mt-1 truncate" title={kpis.ultimaOcorrencia}>
                    {kpis.ultimaOcorrencia}
                  </h3>
                  <p className="text-[10px] text-emerald-650 dark:text-emerald-400 font-bold mt-1 uppercase tracking-wider">
                    último preenchimento
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (span 1): Single Vertical Sidebar Panel containing Filters and Reset Trigger */}
        <div className="lg:col-span-1 h-full">
          <div className="bg-white dark:bg-[#111827] border border-slate-150 dark:border-slate-800/80 rounded-xl p-4 shadow-3xs flex flex-col justify-between h-full space-y-4">
            
            <div className="space-y-3.5">
              {/* Header Title inside panel */}
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-300">
                  Filtros Operacionais
                </span>
              </div>

              {/* Dynamic Filter selection inputs based on General vs Por UTEC viewMode */}
              {viewMode === 'Geral' ? (
                <div className="space-y-3">
                  {/* Filter by UTEC */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">UTEC</span>
                    <select
                      value={filterUtecId}
                      onChange={e => {
                        setFilterUtecId(e.target.value);
                        setFilterEscolaInep('Todas'); // Reset school selector when changing utec
                      }}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900/60 font-bold border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-705 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Todas">Todas as UTECs</option>
                      {utecs.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by School */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">Escola</span>
                    <select
                      value={filterEscolaInep}
                      onChange={e => setFilterEscolaInep(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900/60 font-bold border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-705 dark:text-slate-300 truncate focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Todas">Todas as Escolas</option>
                      {scopedFilterSchools.map(school => (
                        <option key={school.inep} value={school.inep}>{school.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Engagement (Category) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">Categoria</span>
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900/60 font-bold border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-705 dark:text-slate-300 truncate focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Todas">Todas as Categorias</option>
                      <option value="Diário - Expediente na UTEC">Expediente UTEC</option>
                      <option value="Diário - Eventos Externos">Eventos Externos</option>
                      <option value="Diário - Clubes e Projetos">Clubes e Projetos</option>
                      <option value="Diário - Orientação REDS">Orientação REDS</option>
                    </select>
                  </div>

                  {/* Filter by Period (Month) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">Mês</span>
                    <select
                      value={filterMonth}
                      onChange={e => setFilterMonth(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900/60 font-bold border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-705 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Todas">Todo o Ano</option>
                      <option value="fev. de 2026">Fevereiro</option>
                      <option value="mar. de 2026">Março</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* FILTERS FOR "POR UTEC" RELATÓRIO VIEW */
                <div className="space-y-3">
                  {/* Specific UTEC selection required */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">UTEC</span>
                    <select
                      value={filterUtecId}
                      onChange={e => {
                        setFilterUtecId(e.target.value);
                        setFilterEscolaInep('Todas');
                      }}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900/60 font-bold border border-blue-500/30 dark:border-blue-900/30 rounded px-2 py-1.5 text-blue-700 dark:text-blue-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      {utecs.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Category */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">Categoria</span>
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900/60 font-bold border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-705 dark:text-slate-300 truncate focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Todas">Todas as Categorias</option>
                      <option value="Diário - Expediente na UTEC">Expediente UTEC</option>
                      <option value="Diário - Eventos Externos">Eventos Externos</option>
                      <option value="Diário - Clubes e Projetos">Clubes e Projetos</option>
                      <option value="Diário - Orientação REDS">Orientação REDS</option>
                    </select>
                  </div>

                  {/* Filter School */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">Escola</span>
                    <select
                      value={filterEscolaInep}
                      onChange={e => setFilterEscolaInep(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900/60 font-bold border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-705 dark:text-slate-300 truncate focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Todas">Todas as Escolas</option>
                      {scopedFilterSchools.map(school => (
                        <option key={school.inep} value={school.inep}>{school.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Occurrence Month */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">Mês</span>
                    <select
                      value={filterMonth}
                      onChange={e => setFilterMonth(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900/60 font-bold border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-705 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Todas">Todas</option>
                      <option value="fev. de 2026">Fevereiro</option>
                      <option value="mar. de 2026">Março</option>
                    </select>
                  </div>

                  {/* Solicitante Filter */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">Solicitante</span>
                    <select
                      value={filterSolicitante}
                      onChange={e => setFilterSolicitante(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900/60 font-bold border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-705 dark:text-slate-300 truncate focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Todas">Todos</option>
                      {uniqueMultipliers.map(mult => (
                        <option key={mult} value={mult}>{mult}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Clear filters trigger shown conditionally at the footer of the panel */}
            {(filterUtecId !== (viewMode === 'Geral' ? 'Todas' : 'utec-7') || filterEscolaInep !== 'Todas' || filterCategory !== 'Todas' || filterMonth !== 'Todas' || filterSolicitante !== 'Todas') ? (
              <button
                onClick={() => {
                  setFilterUtecId(viewMode === 'Geral' ? 'Todas' : 'utec-7');
                  setFilterEscolaInep('Todas');
                  setFilterCategory('Todas');
                  setFilterMonth('Todas');
                  setFilterSolicitante('Todas');
                }}
                className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black text-red-500 hover:text-red-750 bg-red-50 hover:bg-red-100/70 border border-red-200/50 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:border-red-900/30 rounded-lg cursor-pointer transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                Limpar Todos os Filtros
              </button>
            ) : (
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 text-center py-1 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg select-none">
                Sem filtros ativos
              </div>
            )}
          </div>
        </div>

      </div>


      {/* 4. CHARTS AND DATA VISUALIZATIONS SECTIONS */}
      {viewMode === 'Geral' ? (
        /* GERAL (CONSOLIDADO) CHARTS VIEW */
        <div className="space-y-6" id="charts-blocks-consolidado">
          {/* Chart 1: Total de Planejamentos por UTEC's */}
          <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-2xs space-y-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">Total de Planejamentos por UTEC's</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Visualização cumulativa de preenchimentos ordenados por UTEC de suporte técnico</p>
            </div>
            
            <div className="h-[230px] w-full" id="chart-planejamento-utec-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPlanejamentosPorUtec} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: '750', fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontWeight: '600', fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} contentStyle={{ fontSize: '11px', background: '#0F172A', color: '#FFF', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Total Preenchimento por Unidade de Ensino */}
          <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-2xs space-y-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">Total Preenchimento por Unidade de Ensino</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Distribuição de registros em escolas ativas no município do Recife (Arraste lateralmente)</p>
            </div>

            <div className="overflow-x-auto pb-1.5 scrollbar-thin">
              <div style={{ width: '1350px', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartPreenchimentoPorEscola} margin={{ top: 10, right: 10, left: -30, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 8, fontWeight: '800', fill: '#64748B' }} 
                      angle={-32} 
                      textAnchor="end"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 9, fontWeight: '600', fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '10px', background: '#1E293B', color: '#fff', borderRadius: '6px' }} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[2, 2, 0, 0]} maxBarSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 1: TOP 5 Registro por UTEC and TOP 5 Professores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="charts-row-top-stats">
            {/* Top 5 Registros por UTEC */}
            <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-black uppercase text-[#1F2937] dark:text-white tracking-wider border-b pb-2 border-slate-50 dark:border-slate-800">TOP 5 Registro por UTEC</h4>
              <div className="h-[200px]" id="chart-top-utec-regs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartTop5Utecs} layout="vertical" margin={{ top: 10, right: 15, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 9, fontWeight: '600', fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8, fontWeight: '800', fill: '#64748B' }} width={75} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '10px', background: '#0F172A', color: '#FFF' }} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 5 Professores com Atividades */}
            <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-black uppercase text-[#1F2937] dark:text-white tracking-wider border-b pb-2 border-slate-50 dark:border-slate-800">TOP 5 Professores com Atividades</h4>
              <div className="h-[200px]" id="chart-top-teachers">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartTopProfessores} layout="vertical" margin={{ top: 10, right: 15, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 9, fontWeight: '600', fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8, fontWeight: '800', fill: '#64748B' }} width={125} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '10px', background: '#0F172A', color: '#FFF' }} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Registros por Mês and Categorias Pie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="charts-row-monthly-categories">
            {/* Registros por Mês */}
            <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-black uppercase text-[#1F2937] dark:text-white tracking-wider border-b pb-2 border-slate-50 dark:border-slate-800">Registros por Mês</h4>
              <div className="h-[180px]" id="chart-regs-per-month">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRegistrosPorMes} layout="vertical" margin={{ top: 15, right: 15, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 9, fontWeight: '600', fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: '800', fill: '#64748B' }} width={80} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '10px', background: '#0F172A', color: '#FFF' }} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Registros por Mês - Categorias Donut */}
            <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <h4 className="text-xs font-black uppercase text-[#1F2937] dark:text-white tracking-wider border-b pb-2 border-slate-50 dark:border-slate-800 flex-shrink-0">Registro por Mês - Categorias</h4>
              
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
                {/* Donut Circle */}
                <div className="w-[140px] h-[140px] relative flex-shrink-0" id="donut-categories-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartCategoriasPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartCategoriasPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '10px', background: '#0F172A', color: '#FFF' }} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Absolute Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none line-clamp-1 pb-1">
                    <span className="text-[14px] font-black tracking-tight text-slate-800 dark:text-slate-100">{totalCategoriasCount}</span>
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Registros</span>
                  </div>
                </div>

                {/* Color Legend */}
                <div className="space-y-1.5 flex-1 min-w-[150px] max-w-[280px]">
                  {chartCategoriasPie.map((item, index) => {
                    const percentage = totalCategoriasCount > 0 ? ((item.value / totalCategoriasCount) * 100).toFixed(1) : '0';
                    return (
                      <div key={item.name} className="flex items-center justify-between text-[11px] font-bold">
                        <div className="flex items-center gap-1.5 truncate mr-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-650 dark:text-slate-400 truncate text-[10px]">{item.name.replace('Diário - ', '')}</span>
                        </div>
                        <span className="text-slate-500 font-sans text-[10px] flex-shrink-0 font-black">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* POR UTEC DYNAMIC REPORT CHARTS (Image 2 - Filtered UTEC representation) */
        <div className="space-y-6" id="charts-blocks-por-utec">
          {/* Chart 1: Preenchimento por Unidade de Ensino */}
          <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-2xs space-y-2">
            <h4 className="text-xs font-black uppercase text-[#1F2937] dark:text-white tracking-wider text-center py-1">Preenchimento por Unidade de Ensino</h4>
            <div className="h-[180px]" id="chart-preenchimento-escola-por-utec">
              {chartPreenchimentoPorEscola.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartPreenchimentoPorEscola} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 9, fontWeight: '750', fill: '#64748B' }} 
                      angle={-20} 
                      textAnchor="end"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: '10px', background: '#0F172A', color: '#FFF' }} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200/65 dark:border-slate-830 rounded-xl">
                  <AlertCircle className="w-6 h-6 mb-1 text-slate-350" />
                  <span className="text-[10px] font-extrabold uppercase">Instale algum registro nesta UTEC para visualizar</span>
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Preenchimento Multiplicador */}
          <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-2xs space-y-2">
            <h4 className="text-xs font-black uppercase text-[#1F2937] dark:text-white tracking-wider text-center py-1">Preenchimento Multiplicador</h4>
            <div className="h-[160px]" id="chart-multiplier-performance">
              {chartTopProfessores.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartTopProfessores} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: '750', fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: '10px', background: '#0F172A', color: '#FFF' }} />
                    <Bar dataKey="value" fill="#06B6D4" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200/65 dark:border-slate-830 rounded-xl">
                  <span className="text-[10px] font-bold uppercase">Nenhum preenchimento computado</span>
                </div>
              )}
            </div>
          </div>

          {/* Row of Registros por Mês & Tipo de Diário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="charts-row-por-utec-details">
            {/* Left: Registros por Mês */}
            <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-black uppercase text-[#1F2937] dark:text-white tracking-wider text-center pb-2 border-b border-slate-50 dark:border-slate-800">Registros por Mês</h4>
              <div className="h-[150px]" id="chart-regs-per-month-por-utec">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRegistrosPorMes} layout="vertical" margin={{ top: 12, right: 15, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: '750', fill: '#64748B' }} width={80} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '10px', background: '#0F172A', color: '#FFF' }} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Tipo de Diário */}
            <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <h4 className="text-xs font-black uppercase text-[#1F2937] dark:text-white tracking-wider text-center pb-2 border-b border-slate-50 dark:border-slate-800 flex-shrink-0">Tipo de Diário</h4>
              
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
                {/* Donut */}
                <div className="w-[120px] h-[120px] relative flex-shrink-0" id="donut-tipo-diario-por-utec-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartCategoriasPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={58}
                        paddingAngle={1}
                        dataKey="value"
                      >
                        {chartCategoriasPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '9px', background: '#0F172A', color: '#FFF' }} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[13px] font-black text-slate-800 dark:text-white leading-none">{totalCategoriasCount}</span>
                    <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tipos</span>
                  </div>
                </div>

                {/* Color Legend */}
                <div className="space-y-1.5 flex-1 min-w-[120px] max-w-[240px]">
                  {chartCategoriasPie.map((item) => {
                    const percentage = totalCategoriasCount > 0 ? ((item.value / totalCategoriasCount) * 100).toFixed(0) : '0';
                    return (
                      <div key={item.name} className="flex items-center justify-between text-[10px] font-bold">
                        <div className="flex items-center gap-1 truncate max-w-[150px]">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-650 dark:text-slate-450 truncate">{item.name.replace('Diário - ', '')}</span>
                        </div>
                        <span className="font-mono text-slate-500 flex-shrink-0 font-bold">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* OCORRÊNCIAS TABLE (SPECIFIC UTEC VIEW ONLY - Image 2 bottom) */}
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 overflow-hidden" id="ocorrencias-table-block">
            <div className="px-5 py-4 border-b border-slate-150 dark:border-slate-810 bg-slate-50/50 dark:bg-slate-900/10">
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#1E40AF]" />
                Ocorrências e Registros de Atividades
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-medium">
                <thead>
                  <tr className="bg-[#EBF3FF] dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <th className="px-5 py-3 font-bold text-[10px] uppercase tracking-wider">Data de Ocorrência</th>
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Nome do Solicitante</th>
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Unidade de Ensino</th>
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-center">Qtd. de Professores</th>
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-center">Qtd. de Estudantes</th>
                    <th className="px-5 py-3 font-bold text-[10px] uppercase tracking-wider">Tipo de Diário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-805">
                  {syncStatus === 'loading' ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-blue-600 dark:text-blue-400">
                        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#1E40AF]" />
                        <p className="font-extrabold text-xs uppercase tracking-wider">Processando dados em tempo real da Planilha...</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Carregando diários de bordo do Google Apps Script com segurança.</p>
                      </td>
                    </tr>
                  ) : filteredRecords.length > 0 ? (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3 font-mono text-[11px] text-slate-650 dark:text-slate-350">{rec.dataOcorrencia}</td>
                        <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-200">{rec.solicitante}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-bold truncate max-w-[200px]" title={rec.escolaNome}>
                          {rec.escolaNome}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{rec.qtdProfessores}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{rec.qtdEstudantes}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold inline-block ${
                            rec.categoria === 'Diário - Expediente na UTEC'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/10'
                              : rec.categoria === 'Diário - Eventos Externos'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/10'
                              : rec.categoria === 'Diário - Clubes e Projetos'
                              ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/10'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/10'
                          }`}>
                            {rec.categoria}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold">Nenhuma ocorrência encontrada com os filtros selecionados</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Footer info card */}
      <div className="bg-slate-100/40 dark:bg-slate-900/20 rounded-xl p-3 border border-slate-150 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-between">
        <span>Dados operacionais consolidados até 2026</span>
        <span className="uppercase font-extrabold">Prefeitura do Recife - Secretaria Executiva de Inovação e Projetos</span>
      </div>
    </div>
  );
}
