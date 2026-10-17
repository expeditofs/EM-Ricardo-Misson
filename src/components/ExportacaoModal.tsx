import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  X,
  CheckCircle,
  Filter,
  Calendar,
  Building,
  Users,
  ShieldAlert,
  HeartHandshake,
  Stethoscope,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import {
  exportarConsolidadoAlunos,
  exportarDetalhamentoFaltas,
  exportarAtestadosMedicos,
  exportarIntervencoesPedagogicas,
  exportarEstatisticoPorTurma,
} from '../lib/exportUtils';

interface ExportacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportacaoModal: React.FC<ExportacaoModalProps> = ({ isOpen, onClose }) => {
  const {
    turmas,
    alunosCalculados,
    faltas,
    atestados,
    intervencoes,
  } = useSchool();

  const [relatorioTipo, setRelatorioTipo] = useState<
    'consolidado' | 'faltas' | 'atestados' | 'intervencoes' | 'turmas'
  >('consolidado');

  const [turmaId, setTurmaId] = useState<string>('TODAS');
  const [mes, setMes] = useState<string>('TODOS');
  const [apenasCriticos, setApenasCriticos] = useState<boolean>(false);
  const [separador, setSeparador] = useState<';' | ','>(';');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const meses = [
    { valor: 'TODOS', rotulo: 'Ano Completo (Todos os Meses)' },
    { valor: '01', rotulo: 'Janeiro' },
    { valor: '02', rotulo: 'Fevereiro' },
    { valor: '03', rotulo: 'Março' },
    { valor: '04', rotulo: 'Abril' },
    { valor: '05', rotulo: 'Maio' },
    { valor: '06', rotulo: 'Junho' },
    { valor: '07', rotulo: 'Julho' },
    { valor: '08', rotulo: 'Agosto' },
    { valor: '09', rotulo: 'Setembro' },
    { valor: '10', rotulo: 'Outubro' },
    { valor: '11', rotulo: 'Novembro' },
    { valor: '12', rotulo: 'Dezembro' },
  ];

  const handleExport = () => {
    const opts = {
      turmaId,
      mes,
      apenasCriticos,
      separador,
    };

    switch (relatorioTipo) {
      case 'consolidado':
        exportarConsolidadoAlunos(alunosCalculados, turmas, opts);
        setDownloadSuccess('Planilha Consolidada da E.M. Ricardo Misson gerada com sucesso!');
        break;
      case 'faltas':
        exportarDetalhamentoFaltas(faltas, alunosCalculados, turmas, opts);
        setDownloadSuccess('Planilha Detalhada de Faltas gerada com sucesso!');
        break;
      case 'atestados':
        exportarAtestadosMedicos(atestados, alunosCalculados, turmas, opts);
        setDownloadSuccess('Planilha de Atestados Médicos gerada com sucesso!');
        break;
      case 'intervencoes':
        exportarIntervencoesPedagogicas(intervencoes, alunosCalculados, turmas, opts);
        setDownloadSuccess('Planilha de Intervenções Pedagógicas gerada com sucesso!');
        break;
      case 'turmas':
        exportarEstatisticoPorTurma(turmas, alunosCalculados, opts);
        setDownloadSuccess('Resumo Estatístico por Turma gerado com sucesso!');
        break;
    }

    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // Estimate records to be exported
  let contagemRegistros = 0;
  if (relatorioTipo === 'consolidado') {
    let filtrados = alunosCalculados;
    if (turmaId !== 'TODAS') filtrados = filtrados.filter((a) => a.turmaId === turmaId);
    if (apenasCriticos) filtrados = filtrados.filter((a) => a.nivelRisco === 'CRITICO' || a.nivelRisco === 'ALTO');
    contagemRegistros = filtrados.length;
  } else if (relatorioTipo === 'faltas') {
    let filtrados = faltas;
    if (turmaId !== 'TODAS') filtrados = filtrados.filter((f) => f.turmaId === turmaId);
    if (mes !== 'TODOS') filtrados = filtrados.filter((f) => f.data.split('-')[1] === mes);
    contagemRegistros = filtrados.length;
  } else if (relatorioTipo === 'atestados') {
    let filtrados = atestados;
    if (turmaId !== 'TODAS') filtrados = filtrados.filter((at) => at.turmaId === turmaId);
    contagemRegistros = filtrados.length;
  } else if (relatorioTipo === 'intervencoes') {
    let filtrados = intervencoes;
    if (turmaId !== 'TODAS') filtrados = filtrados.filter((i) => i.turmaId === turmaId);
    contagemRegistros = filtrados.length;
  } else if (relatorioTipo === 'turmas') {
    contagemRegistros = turmas.length;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Exportação de Relatórios em Planilha (CSV / Excel)
              </h3>
              <p className="text-xs text-slate-400">
                Compilações para a SEMED e Análises Externas da Coordenação • E.M. Ricardo Misson
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{downloadSuccess}</span>
            </div>
          )}

          {/* Select type of report */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              1. Selecione o Tipo de Relatório para Exportação
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRelatorioTipo('consolidado')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  relatorioTipo === 'consolidado'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Consolidado Geral de Alunos</p>
                  <p className="text-[11px] text-slate-500">
                    Frequência, faltas, perda de carga horária e indicadores LDB para a SEMED.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRelatorioTipo('faltas')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  relatorioTipo === 'faltas'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Detalhamento de Faltas</p>
                  <p className="text-[11px] text-slate-500">
                    Registro dia a dia com motivos, horas perdidas e justificativas.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRelatorioTipo('intervencoes')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  relatorioTipo === 'intervencoes'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Intervenções e Busca Ativa</p>
                  <p className="text-[11px] text-slate-500">
                    Histórico das ações pedagógicas, reuniões com pais e fichas FICAI.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRelatorioTipo('turmas')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  relatorioTipo === 'turmas'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Resumo Estatístico por Turma</p>
                  <p className="text-[11px] text-slate-500">
                    Média de frequência, contagem de risco crítico e indicadores comparativos.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRelatorioTipo('atestados')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 sm:col-span-2 ${
                  relatorioTipo === 'atestados'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Registro de Atestados Médicos e Abonos</p>
                  <p className="text-[11px] text-slate-500">
                    Período médico, CID-10, CRM, profissional e horas abonadas.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Parâmetros e Filtros do Relatório
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Turma */}
              <div>
                <span className="font-medium text-slate-600 mb-1 block">Filtrar Turma:</span>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="TODAS">Todas as Turmas ({turmas.length})</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} {t.turno ? `(${t.turno})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month (relevant for Faltas & Monthly Compilations) */}
              <div>
                <span className="font-medium text-slate-600 mb-1 block">
                  Período / Mês de Referência:
                </span>
                <select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {meses.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox only critical cases */}
            {relatorioTipo === 'consolidado' && (
              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="apenasCriticos"
                  checked={apenasCriticos}
                  onChange={(e) => setApenasCriticos(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label
                  htmlFor="apenasCriticos"
                  className="text-xs text-slate-700 font-medium cursor-pointer flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Filtrar apenas estudantes em Risco Alto e Crítico (≥20% de infrequência / Ficha FICAI)</span>
                </label>
              </div>
            )}

            {/* Separator / Excel Compatibility */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 font-medium">Formato do CSV:</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="separador"
                    checked={separador === ';'}
                    onChange={() => setSeparador(';')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Excel Brasil (Ponto e Vírgula ;) - <strong>Recomendado</strong></span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="separador"
                    checked={separador === ','}
                    onChange={() => setSeparador(',')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>CSV Padrão (Vírgula ,)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Record summary box */}
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            <span>
              Registros correspondentes aos filtros: <strong>{contagemRegistros} itens</strong>
            </span>
            <span className="text-[11px] text-emerald-700">
              Compatível com Microsoft Excel, Google Planilhas e LibreOffice
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Os arquivos são gerados com codificação UTF-8 com BOM para preservar acentuações no Excel.
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={contagemRegistros === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Planilha ({contagemRegistros})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
