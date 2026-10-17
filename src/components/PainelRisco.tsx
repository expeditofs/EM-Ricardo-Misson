import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  PlusCircle,
  FileText,
  Phone,
  Stethoscope,
  HeartHandshake,
  Calendar,
  ChevronRight,
  TrendingDown,
  Users,
  ShieldAlert,
  FileSpreadsheet,
  ClipboardList,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { AlunoCalculado, NivelRisco } from '../types';
import { getRiscoBadgeInfo } from '../lib/schoolCalculations';

interface PainelRiscoProps {
  onAbrirFaltasAcumuladas?: (aluno: AlunoCalculado) => void;
  onAbrirFalta?: (aluno: AlunoCalculado) => void;
  onAbrirAtestado?: (aluno: AlunoCalculado) => void;
  onAbrirIntervencao: (aluno: AlunoCalculado) => void;
  onAbrirRelatorio: (aluno: AlunoCalculado) => void;
  onNovaTurma: () => void;
  onNovoAluno: () => void;
  onOpenExportModal?: () => void;
}

export const PainelRisco: React.FC<PainelRiscoProps> = ({
  onAbrirFaltasAcumuladas,
  onAbrirFalta,
  onAbrirAtestado,
  onAbrirIntervencao,
  onAbrirRelatorio,
  onNovoAluno,
  onOpenExportModal,
}) => {
  const {
    turmas,
    alunosCalculados,
    selectedTurmaId,
    setSelectedTurmaId,
    selectedRisco,
    setSelectedRisco,
    searchQuery,
    setSearchQuery,
    faltas,
    atestados,
    intervencoes,
  } = useSchool();

  const [visualMode, setVisualMode] = useState<'cards' | 'tabela'>('cards');

  // Filter students
  const alunosFiltrados = alunosCalculados.filter((aluno) => {
    // Turma filter
    if (selectedTurmaId !== 'TODAS' && aluno.turmaId !== selectedTurmaId) {
      return false;
    }
    // Risk filter
    if (selectedRisco !== 'TODOS' && aluno.nivelRisco !== selectedRisco) {
      return false;
    }
    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchNome = aluno.nome.toLowerCase().includes(q);
      const matchMatricula = aluno.matricula?.toLowerCase().includes(q);
      const matchResp = aluno.responsavelNome?.toLowerCase().includes(q);
      if (!matchNome && !matchMatricula && !matchResp) return false;
    }
    return true;
  });

  // KPI calculations
  const totalAlunos = alunosCalculados.length;
  const criticos = alunosCalculados.filter((a) => a.nivelRisco === 'CRITICO');
  const altos = alunosCalculados.filter((a) => a.nivelRisco === 'ALTO');
  const atencoes = alunosCalculados.filter((a) => a.nivelRisco === 'ATENCAO');
  const regulares = alunosCalculados.filter((a) => a.nivelRisco === 'BAIXO');

  const totalHorasPerdidasGeral = alunosCalculados.reduce(
    (acc, a) => acc + a.totalHorasEfetivasPerdidas,
    0
  );

  const handleOpenFaltasAcumuladas = (aluno: AlunoCalculado) => {
    if (onAbrirFaltasAcumuladas) {
      onAbrirFaltasAcumuladas(aluno);
    } else if (onAbrirFalta) {
      onAbrirFalta(aluno);
    }
  };

  return (
    <div className="space-y-6">
      {/* Critical Alert Warning Banner if there are students in critical risk */}
      {criticos.length > 0 && (
        <div className="bg-red-500/10 border-l-4 border-red-600 p-4 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm sm:text-base font-bold text-red-900">
                  ALERTA DE EVASÃO: {criticos.length}{' '}
                  {criticos.length === 1 ? 'estudante ultrapassou' : 'estudantes ultrapassaram'} o limite
                  legal de 25% de infrequência (LDB Lei 9.394/96)
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-red-600 text-white rounded-md uppercase tracking-wider">
                  Ação FICAI Imediata
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-800 mt-1">
                As professoras de referência e equipe gestora devem protocolar a Ficha FICAI e convocar os
                responsáveis para evitar a perda do ano letivo e abandono escolar.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {criticos.map((aluno) => (
                  <button
                    key={aluno.id}
                    onClick={() => onAbrirRelatorio(aluno)}
                    className="inline-flex items-center gap-1.5 text-xs bg-white text-red-900 border border-red-300 font-medium px-2.5 py-1 rounded-lg hover:bg-red-50 transition shadow-xs"
                  >
                    <span>{aluno.nome}</span>
                    <span className="text-red-600 font-bold">({aluno.percentualPerda}%)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Alunos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Estudantes</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalAlunos}</p>
            <p className="text-[11px] text-slate-500 mt-1">E.M. Ricardo Misson</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Risco Crítico */}
        <button
          onClick={() => setSelectedRisco(selectedRisco === 'CRITICO' ? 'TODOS' : 'CRITICO')}
          className={`p-4 rounded-xl border text-left transition shadow-xs flex items-center justify-between ${
            selectedRisco === 'CRITICO'
              ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400'
              : 'bg-white border-red-200 hover:border-red-300'
          }`}
        >
          <div>
            <p className={`text-xs font-medium ${selectedRisco === 'CRITICO' ? 'text-red-100' : 'text-red-600'}`}>
              Risco Crítico (≥25%)
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${selectedRisco === 'CRITICO' ? 'text-white' : 'text-red-700'}`}>
              {criticos.length}
            </p>
            <p className={`text-[11px] mt-1 ${selectedRisco === 'CRITICO' ? 'text-red-100' : 'text-slate-500'}`}>
              Alerta FICAI Conselho
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedRisco === 'CRITICO' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </button>

        {/* Risco Alto */}
        <button
          onClick={() => setSelectedRisco(selectedRisco === 'ALTO' ? 'TODOS' : 'ALTO')}
          className={`p-4 rounded-xl border text-left transition shadow-xs flex items-center justify-between ${
            selectedRisco === 'ALTO'
              ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400'
              : 'bg-white border-amber-200 hover:border-amber-300'
          }`}
        >
          <div>
            <p className={`text-xs font-medium ${selectedRisco === 'ALTO' ? 'text-amber-100' : 'text-amber-600'}`}>
              Risco Alto (20-24.9%)
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${selectedRisco === 'ALTO' ? 'text-white' : 'text-amber-700'}`}>
              {altos.length}
            </p>
            <p className={`text-[11px] mt-1 ${selectedRisco === 'ALTO' ? 'text-amber-100' : 'text-slate-500'}`}>
              Busca Ativa Urgente
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedRisco === 'ALTO' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-600'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
        </button>

        {/* Atenção */}
        <button
          onClick={() => setSelectedRisco(selectedRisco === 'ATENCAO' ? 'TODOS' : 'ATENCAO')}
          className={`p-4 rounded-xl border text-left transition shadow-xs flex items-center justify-between ${
            selectedRisco === 'ATENCAO'
              ? 'bg-yellow-600 text-white border-yellow-700 ring-2 ring-yellow-400'
              : 'bg-white border-yellow-200 hover:border-yellow-300'
          }`}
        >
          <div>
            <p className={`text-xs font-medium ${selectedRisco === 'ATENCAO' ? 'text-yellow-100' : 'text-yellow-700'}`}>
              Em Atenção (10-19.9%)
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${selectedRisco === 'ATENCAO' ? 'text-white' : 'text-yellow-800'}`}>
              {atencoes.length}
            </p>
            <p className={`text-[11px] mt-1 ${selectedRisco === 'ATENCAO' ? 'text-yellow-100' : 'text-slate-500'}`}>
              Contato Preventivo
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedRisco === 'ATENCAO' ? 'bg-yellow-700 text-white' : 'bg-yellow-50 text-yellow-700'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
        </button>

        {/* Intervenções Realizadas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-medium text-slate-500">Ações Pedagógicas</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{intervencoes.length}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Intervenções registradas</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar aluno por nome, matrícula ou responsável..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Turma filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 hidden sm:inline" />
            <select
              value={selectedTurmaId}
              onChange={(e) => setSelectedTurmaId(e.target.value)}
              className="text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODAS">Todas as Turmas ({turmas.length})</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} {t.turno ? `(${t.turno})` : ''}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex border border-slate-300 rounded-lg overflow-hidden bg-slate-100 p-0.5">
              <button
                onClick={() => setVisualMode('cards')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  visualMode === 'cards' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cards Visuais
              </button>
              <button
                onClick={() => setVisualMode('tabela')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  visualMode === 'tabela' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tabela
              </button>
            </div>

            {/* Export SEMED button */}
            {onOpenExportModal && (
              <button
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-xs whitespace-nowrap"
                title="Exportar dados de infrequência em formato CSV ou Excel para a SEMED"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Planilhas</span>
              </button>
            )}

            {/* Quick add student */}
            <button
              onClick={onNovoAluno}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-xs whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Novo Aluno</span>
            </button>
          </div>
        </div>

        {/* Risk Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
          <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
            Filtrar Risco:
          </span>
          <button
            onClick={() => setSelectedRisco('TODOS')}
            className={`px-2.5 py-1 rounded-full font-medium transition ${
              selectedRisco === 'TODOS'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({alunosCalculados.length})
          </button>
          <button
            onClick={() => setSelectedRisco('CRITICO')}
            className={`px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1 ${
              selectedRisco === 'CRITICO'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
            Crítico ≥25% ({criticos.length})
          </button>
          <button
            onClick={() => setSelectedRisco('ALTO')}
            className={`px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1 ${
              selectedRisco === 'ALTO'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Alto 20-24.9% ({altos.length})
          </button>
          <button
            onClick={() => setSelectedRisco('ATENCAO')}
            className={`px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1 ${
              selectedRisco === 'ATENCAO'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
            Atenção 10-19.9% ({atencoes.length})
          </button>
          <button
            onClick={() => setSelectedRisco('BAIXO')}
            className={`px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1 ${
              selectedRisco === 'BAIXO'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Regular &lt;10% ({regulares.length})
          </button>
        </div>
      </div>

      {/* Student List View */}
      {alunosFiltrados.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Nenhum estudante encontrado</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || selectedTurmaId !== 'TODAS' || selectedRisco !== 'TODOS'
              ? 'Tente ajustar os filtros ou o termo de busca para visualizar outros alunos.'
              : 'Comece cadastrando sua primeira turma e adicionando alunos à E.M. Ricardo Misson.'}
          </p>
          <button
            onClick={onNovoAluno}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Cadastrar Aluno
          </button>
        </div>
      ) : visualMode === 'cards' ? (
        /* Visual Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alunosFiltrados.map((aluno) => {
            const badge = getRiscoBadgeInfo(aluno.nivelRisco);
            const isCritical = aluno.nivelRisco === 'CRITICO';

            return (
              <div
                key={aluno.id}
                className={`bg-white rounded-xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden ${
                  isCritical
                    ? 'border-red-300 ring-1 ring-red-200 shadow-red-100/50'
                    : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {aluno.turmaNome}
                        </span>
                        {aluno.matricula && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            #{aluno.matricula}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">
                        {aluno.nome}
                      </h4>
                      {aluno.responsavelNome && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Resp: <span className="text-slate-700 font-medium">{aluno.responsavelNome}</span>
                        </p>
                      )}
                    </div>

                    {/* Risk Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shadow-xs whitespace-nowrap ${badge.colorClass}`}
                      title={badge.sublabel}
                    >
                      {aluno.nivelRisco === 'CRITICO' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {aluno.nivelRisco === 'ALTO' && <AlertCircle className="w-3.5 h-3.5" />}
                      {aluno.nivelRisco === 'ATENCAO' && <Clock className="w-3.5 h-3.5" />}
                      {aluno.nivelRisco === 'BAIXO' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{aluno.percentualPerda}%</span>
                    </div>
                  </div>

                  {/* Workload Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Perda de Carga Horária:</span>
                      <span className="font-bold text-slate-800">
                        {aluno.totalHorasEfetivasPerdidas}h / {aluno.totalHorasLetivas}h
                      </span>
                    </div>

                    {/* Multi-tier progress bar */}
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex relative">
                      <div
                        className={`h-full transition-all duration-500 ${badge.barColor}`}
                        style={{ width: `${Math.min(100, (aluno.totalHorasEfetivasPerdidas / aluno.totalHorasLetivas) * 100)}%` }}
                      />
                      {/* Legal 25% threshold mark */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10"
                        style={{ left: '25%' }}
                        title="Limite legal LDB (25% = 200h)"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Frequência: <strong className="text-slate-700">{aluno.percentualFrequencia}%</strong></span>
                      {aluno.percentualPerda >= 25 ? (
                        <span className="text-red-600 font-bold">Limite de 25% excedido</span>
                      ) : (
                        <span className="text-slate-500">
                          Margem restante: <strong>{aluno.diasLimiteRestantesPara25Porcento} dias</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recommended Pedagogical Action */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Intervenção Pedagógica Sugerida:
                    </p>
                    <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">
                      {badge.acaoRecomendada}
                    </p>
                  </div>

                  {/* Counters */}
                  <div className="grid grid-cols-3 gap-1 pt-1 text-center text-xs">
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                      <p className="text-[10px] text-slate-500">Faltas</p>
                      <p className="font-bold text-slate-800">{aluno.quantidadeFaltas}</p>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                      <p className="text-[10px] text-slate-500">Atestados</p>
                      <p className="font-bold text-slate-800">{aluno.quantidadeAtestados}</p>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                      <p className="text-[10px] text-slate-500">Ações Feitas</p>
                      <p className="font-bold text-emerald-700">{aluno.quantidadeIntervencoes}</p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenFaltasAcumuladas(aluno)}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
                      title="Cadastrar ou alterar faltas acumuladas e atestados acumulados"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                      <span>Faltas e Atestados</span>
                    </button>
                    <button
                      onClick={() => onAbrirIntervencao(aluno)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium transition flex items-center gap-1"
                      title="Registrar intervenção pedagógica preventiva"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ação</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onAbrirRelatorio(aluno)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition flex items-center gap-1 ml-auto"
                    title="Ver Ficha Individual e Relatório FICAI"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>FICAI / Ficha</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Data Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Estudante (Obrigatório)</th>
                <th className="py-3 px-3">Turma</th>
                <th className="py-3 px-3">Nível de Risco</th>
                <th className="py-3 px-3">Perda Carga Horária</th>
                <th className="py-3 px-3">% Freq.</th>
                <th className="py-3 px-3">Ações Feitas</th>
                <th className="py-3 px-4 text-right">Intervenções Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alunosFiltrados.map((aluno) => {
                const badge = getRiscoBadgeInfo(aluno.nivelRisco);
                return (
                  <tr key={aluno.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{aluno.nome}</div>
                      {aluno.responsavelNome && (
                        <div className="text-xs text-slate-500">
                          Resp: {aluno.responsavelNome}{' '}
                          {aluno.responsavelTelefone && `• ${aluno.responsavelTelefone}`}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-700 font-medium">
                      {aluno.turmaNome}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.colorClass}`}
                      >
                        {badge.label} ({aluno.percentualPerda}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs">
                      <div className="font-semibold text-slate-800">
                        {aluno.totalHorasEfetivasPerdidas}h / {aluno.totalHorasLetivas}h
                      </div>
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${badge.barColor}`}
                          style={{
                            width: `${Math.min(
                              100,
                              (aluno.totalHorasEfetivasPerdidas / aluno.totalHorasLetivas) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-xs text-slate-700">
                      {aluno.percentualFrequencia}%
                    </td>
                    <td className="py-3 px-3 text-xs font-bold text-emerald-700">
                      {aluno.quantidadeIntervencoes} ações
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleOpenFaltasAcumuladas(aluno)}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 hover:text-blue-800"
                          title="Cadastrar / Alterar Faltas e Atestados Acumulados"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAbrirIntervencao(aluno)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-emerald-600 hover:text-emerald-800"
                          title="Registrar Intervenção Pedagógica"
                        >
                          <HeartHandshake className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAbrirRelatorio(aluno)}
                          className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                          title="Ver Relatório e FICAI"
                        >
                          FICAI
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
