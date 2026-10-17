import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  ShieldAlert,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building,
  HeartHandshake,
  Stethoscope,
  FileSpreadsheet,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { AlunoCalculado } from '../types';
import { getRiscoBadgeInfo } from '../lib/schoolCalculations';

interface RelatoriosFICAIProps {
  initialAlunoId?: string | null;
  onOpenExportModal?: () => void;
}

export const RelatoriosFICAI: React.FC<RelatoriosFICAIProps> = ({
  initialAlunoId,
  onOpenExportModal,
}) => {
  const {
    turmas,
    alunosCalculados,
    faltas,
    atestados,
    intervencoes,
  } = useSchool();

  const [tipoRelatorio, setTipoRelatorio] = useState<'individual' | 'ficai' | 'turma'>('ficai');
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>(
    initialAlunoId || alunosCalculados[0]?.id || ''
  );
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(
    turmas[0]?.id || ''
  );

  React.useEffect(() => {
    if (initialAlunoId) {
      setSelectedAlunoId(initialAlunoId);
    }
  }, [initialAlunoId]);

  const aluno = alunosCalculados.find((a) => a.id === selectedAlunoId);
  const turmaSelecionada = turmas.find((t) => t.id === selectedTurmaId);
  const alunosDaTurma = alunosCalculados.filter((a) => a.turmaId === selectedTurmaId);

  const faltasDoAluno = aluno ? faltas.filter((f) => f.alunoId === aluno.id) : [];
  const atestadosDoAluno = aluno ? atestados.filter((a) => a.alunoId === aluno.id) : [];
  const intervencoesDoAluno = aluno ? intervencoes.filter((i) => i.alunoId === aluno.id) : [];

  const badge = aluno ? getRiscoBadgeInfo(aluno.nivelRisco) : null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (alunosCalculados.length === 0) return;
    const headers = [
      'Turma',
      'Nome do Aluno',
      'Matrícula',
      'Responsável',
      'Telefone',
      'Total Faltas (Horas)',
      'Horas Abonadas (Atestado)',
      'Horas Perdidas Efetivas',
      '% Perda Carga Horaria',
      '% Frequencia',
      'Nivel de Risco',
      'Intervencoes Realizadas',
    ];

    const rows = alunosCalculados.map((a) => [
      `"${a.turmaNome}"`,
      `"${a.nome}"`,
      `"${a.matricula || ''}"`,
      `"${a.responsavelNome || ''}"`,
      `"${a.responsavelTelefone || ''}"`,
      a.totalHorasFaltas,
      a.totalHorasAtestado,
      a.totalHorasEfetivasPerdidas,
      `${a.percentualPerda}%`,
      `${a.percentualFrequencia}%`,
      `"${a.nivelRisco}"`,
      a.quantidadeIntervencoes,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_infrequencia_em_ricardo_misson_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Selector and Actions Bar (Hidden during printing) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase">Tipo de Documento:</span>
          <button
            onClick={() => setTipoRelatorio('ficai')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              tipoRelatorio === 'ficai'
                ? 'bg-red-600 text-white border-red-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Ficha FICAI / Conselho Tutelar
          </button>
          <button
            onClick={() => setTipoRelatorio('individual')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              tipoRelatorio === 'individual'
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Ficha Pedagógica Individual
          </button>
          <button
            onClick={() => setTipoRelatorio('turma')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              tipoRelatorio === 'turma'
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Relatório Geral por Turma
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {tipoRelatorio !== 'turma' ? (
            <select
              value={selectedAlunoId}
              onChange={(e) => setSelectedAlunoId(e.target.value)}
              className="text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
            >
              {alunosCalculados.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} — {a.turmaNome} ({a.percentualPerda}% falta)
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedTurmaId}
              onChange={(e) => setSelectedTurmaId(e.target.value)}
              className="text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} {t.turno ? `(${t.turno})` : ''}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onOpenExportModal || handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            title="Exportar relatórios em formato CSV ou Excel para a SEMED e análises da coordenação"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Planilhas (CSV/Excel)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Gerar PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW AREA (Formatted for screen and printing) */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none text-slate-800">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Prefeitura Municipal de Uberaba • Estado de Minas Gerais
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Secretaria Municipal de Educação — SEMED
          </p>
          <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-slate-950 pt-1">
            Escola Municipal Ricardo Misson
          </h1>
          <p className="text-[11px] text-slate-500">
            Sistema Integrado de Prevenção à Evasão e Monitoramento de Carga Horária Escolar
          </p>
        </div>

        {/* 1. DOCUMENTO: FICHA FICAI (Encaminhamento ao Conselho Tutelar) */}
        {tipoRelatorio === 'ficai' && aluno && (
          <div className="mt-6 space-y-6">
            {/* Title */}
            <div className="bg-red-50 border border-red-300 p-3 rounded-lg text-center">
              <h2 className="text-sm sm:text-base font-extrabold text-red-950 uppercase tracking-wide">
                FICAI — FICHA DE COMUNICAÇÃO DE ALUNO INFREQUENTE
              </h2>
              <p className="text-xs text-red-800 mt-0.5">
                Instrumento de Notificação Intersetorial para Combate à Evasão Escolar
              </p>
              <p className="text-[10px] text-red-700 italic mt-0.5">
                Fundamentação Legal: LDB Lei Federal nº 9.394/1996 (Art. 12, VII) e Estatuto da Criança e do Adolescente — ECA Lei nº 8.069/1990 (Art. 56, II)
              </p>
            </div>

            {/* Protocol and Date */}
            <div className="grid grid-cols-2 text-xs border border-slate-300 rounded-lg p-3 bg-slate-50">
              <div>
                <span className="font-semibold text-slate-600">Destinatário:</span>
                <p className="font-bold text-slate-900">Conselho Tutelar de Uberaba / MG</p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-600">Data de Emissão:</span>
                <p className="font-bold text-slate-900">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Student Data */}
            <div className="border border-slate-300 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                1. Identificação do(a) Estudante e Responsável
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Nome do Aluno:</span>
                  <p className="font-bold text-slate-900 text-sm">{aluno.nome}</p>
                </div>
                <div>
                  <span className="text-slate-500">Turma e Turno:</span>
                  <p className="font-bold text-slate-900">{aluno.turmaNome}</p>
                </div>
                <div>
                  <span className="text-slate-500">Matrícula Escolar:</span>
                  <p className="font-medium text-slate-800">{aluno.matricula || 'Não informada'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Filiação / Responsável Legal:</span>
                  <p className="font-bold text-slate-900">{aluno.responsavelNome || 'Não informado'}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Telefone / Contato:</span>
                  <p className="font-medium text-slate-800">{aluno.responsavelTelefone || 'Não informado'}</p>
                </div>
              </div>
            </div>

            {/* Workload and Absence Summary */}
            <div className="border border-slate-300 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                2. Quadro Demonstrativo de Infrequência e Carga Horária
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <p className="text-slate-500 text-[10px]">Carga Horária Total</p>
                  <p className="font-bold text-slate-800 text-sm">{aluno.totalHorasLetivas}h</p>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <p className="text-slate-500 text-[10px]">Horas Perdidas</p>
                  <p className="font-bold text-red-600 text-sm">{aluno.totalHorasEfetivasPerdidas}h</p>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <p className="text-slate-500 text-[10px]">% de Infrequência</p>
                  <p className="font-extrabold text-red-700 text-sm">{aluno.percentualPerda}%</p>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <p className="text-slate-500 text-[10px]">Limite Legal LDB</p>
                  <p className="font-bold text-slate-800 text-sm">25% (200h)</p>
                </div>
              </div>

              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-900">
                <strong>Parecer Técnico:</strong> O(a) estudante atingiu{' '}
                <strong>{aluno.percentualPerda}%</strong> de faltas em relação à carga horária total prevista
                para o ano letivo ({aluno.totalHorasEfetivasPerdidas} horas perdidas de {aluno.totalHorasLetivas}h).
                {aluno.percentualPerda >= 25 &&
                  ' O percentual máximo estipulado pela LDB foi superado, configurando risco iminente de reprovação por infrequência e evasão escolar definitiva sem a tutela dos órgãos de proteção à infância.'}
              </div>
            </div>

            {/* Pedagogical Interventions previously attempted by the school */}
            <div className="border border-slate-300 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                3. Intervenções Pedagógicas e Busca Ativa Previamente Executadas pela Escola
              </h3>
              {intervencoesDoAluno.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Nenhuma intervenção formal anterior registrada antes desta notificação.
                </p>
              ) : (
                <div className="space-y-2">
                  {intervencoesDoAluno.map((i, idx) => (
                    <div key={i.id} className="text-xs p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>
                          {idx + 1}. {i.tipo}
                        </span>
                        <span className="text-slate-500 font-normal">
                          {new Date(i.data + 'T00:00:00').toLocaleDateString('pt-BR')} • {i.status}
                        </span>
                      </div>
                      {i.descricao && (
                        <p className="text-slate-600">
                          <strong>Ação:</strong> {i.descricao}
                        </p>
                      )}
                      {i.resultado && (
                        <p className="text-slate-700">
                          <strong>Resultado:</strong> {i.resultado}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-900">Professora de Referência</p>
                <p className="text-slate-500 text-[11px]">E.M. Ricardo Misson — Uberaba/MG</p>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-900">Direção / Coordenação Pedagógica</p>
                <p className="text-slate-500 text-[11px]">Secretaria Municipal de Educação</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. DOCUMENTO: FICHA PEDAGÓGICA INDIVIDUAL COMPLETA */}
        {tipoRelatorio === 'individual' && aluno && (
          <div className="mt-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
              <h2 className="text-sm sm:text-base font-extrabold text-blue-950 uppercase tracking-wide">
                FICHA PEDAGÓGICA INDIVIDUAL DE FREQUÊNCIA E INTERVENÇÕES
              </h2>
              <p className="text-xs text-blue-800 mt-0.5">
                Prontuário de Acompanhamento Longitudinal da Professora de Referência
              </p>
            </div>

            {/* Student info */}
            <div className="border border-slate-300 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50">
              <div>
                <span className="text-slate-500">Estudante:</span>
                <p className="font-bold text-slate-900">{aluno.nome}</p>
              </div>
              <div>
                <span className="text-slate-500">Turma:</span>
                <p className="font-bold text-slate-900">{aluno.turmaNome}</p>
              </div>
              <div>
                <span className="text-slate-500">Nível de Risco:</span>
                <p className="font-bold text-slate-900">{aluno.nivelRisco} ({aluno.percentualPerda}%)</p>
              </div>
              <div>
                <span className="text-slate-500">Frequência Global:</span>
                <p className="font-bold text-slate-900">{aluno.percentualFrequencia}%</p>
              </div>
            </div>

            {/* Absences Log */}
            <div className="border border-slate-300 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Registro Discriminado de Ausências ({faltasDoAluno.length} lançamentos)
              </h3>
              {faltasDoAluno.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma falta registrada no sistema.</p>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-1">Data</th>
                      <th className="py-1">Horas</th>
                      <th className="py-1">Tipo</th>
                      <th className="py-1">Motivo</th>
                      <th className="py-1">Registrado por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {faltasDoAluno.map((f) => (
                      <tr key={f.id}>
                        <td className="py-1.5 font-medium">
                          {new Date(f.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-1.5 font-bold">{f.horasFalta}h</td>
                        <td className="py-1.5">{f.justificada ? 'Justificada' : 'Injustificada'}</td>
                        <td className="py-1.5 text-slate-600">{f.motivo || '—'}</td>
                        <td className="py-1.5 text-slate-500">{f.registradoPor || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Medical Certificates */}
            <div className="border border-slate-300 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Atestados Médicos e Abonos ({atestadosDoAluno.length})
              </h3>
              {atestadosDoAluno.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum atestado médico registrado.</p>
              ) : (
                <div className="space-y-2">
                  {atestadosDoAluno.map((at) => (
                    <div key={at.id} className="text-xs p-2 bg-indigo-50/50 rounded border border-indigo-100">
                      <p className="font-semibold text-slate-800">
                        {new Date(at.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até{' '}
                        {new Date(at.dataTermino + 'T00:00:00').toLocaleDateString('pt-BR')} ({at.horasAbonadas || 0}h abonadas)
                      </p>
                      {at.medicoNome && <p className="text-slate-600">Médico: {at.medicoNome} {at.crm && `(${at.crm})`}</p>}
                      {at.cid && <p className="text-slate-600">CID: {at.cid}</p>}
                      {at.motivo && <p className="text-slate-600">Motivo: {at.motivo}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interventions Log */}
            <div className="border border-slate-300 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Intervenções e Busca Ativa Realizadas ({intervencoesDoAluno.length})
              </h3>
              {intervencoesDoAluno.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma intervenção registrada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {intervencoesDoAluno.map((i) => (
                    <div key={i.id} className="text-xs p-2 bg-emerald-50/50 rounded border border-emerald-100">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{i.tipo}</span>
                        <span className="font-normal text-slate-500">{new Date(i.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                      {i.descricao && <p className="text-slate-600 mt-0.5">{i.descricao}</p>}
                      {i.resultado && <p className="text-emerald-800 font-medium mt-0.5">Encaminhamento: {i.resultado}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. DOCUMENTO: RELATÓRIO GERAL POR TURMA */}
        {tipoRelatorio === 'turma' && turmaSelecionada && (
          <div className="mt-6 space-y-6">
            <div className="bg-slate-100 border border-slate-300 p-3 rounded-lg text-center">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 uppercase tracking-wide">
                RELATÓRIO CONSOLIDADO DE INFREQUÊNCIA DA TURMA
              </h2>
              <p className="text-xs text-slate-700 mt-0.5">
                Turma: <strong>{turmaSelecionada.nome}</strong> • Turno: {turmaSelecionada.turno || 'Não informado'} • Carga Horária: {turmaSelecionada.cargaHorariaTotal || 800}h
              </p>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <th className="p-2 border-r border-slate-200">#</th>
                  <th className="p-2 border-r border-slate-200">Estudante</th>
                  <th className="p-2 border-r border-slate-200 text-center">Horas Perdidas</th>
                  <th className="p-2 border-r border-slate-200 text-center">% Infrequência</th>
                  <th className="p-2 border-r border-slate-200 text-center">% Frequência</th>
                  <th className="p-2 border-r border-slate-200 text-center">Nível de Risco</th>
                  <th className="p-2 text-center">Ações Feitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {alunosDaTurma.map((a, idx) => (
                  <tr key={a.id} className={a.nivelRisco === 'CRITICO' ? 'bg-red-50/70 font-semibold' : ''}>
                    <td className="p-2 border-r border-slate-200 text-slate-400">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{a.nome}</div>
                      {a.responsavelNome && <div className="text-[10px] text-slate-500">Resp: {a.responsavelNome}</div>}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">
                      {a.totalHorasEfetivasPerdidas}h
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      <span className={a.percentualPerda >= 25 ? 'text-red-700 font-extrabold' : ''}>
                        {a.percentualPerda}%
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center">{a.percentualFrequencia}%</td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.nivelRisco === 'CRITICO'
                            ? 'bg-red-100 text-red-800'
                            : a.nivelRisco === 'ALTO'
                            ? 'bg-amber-100 text-amber-800'
                            : a.nivelRisco === 'ATENCAO'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {a.nivelRisco}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold">{a.quantidadeIntervencoes}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary info */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <p>
                Total de Alunos Matriculados:{' '}
                <strong>{alunosDaTurma.length}</strong> | Em Risco Crítico (≥25%):{' '}
                <strong className="text-red-600">
                  {alunosDaTurma.filter((a) => a.nivelRisco === 'CRITICO').length}
                </strong>{' '}
                | Em Risco Alto (20-24.9%):{' '}
                <strong className="text-amber-600">
                  {alunosDaTurma.filter((a) => a.nivelRisco === 'ALTO').length}
                </strong>
              </p>
              <p className="text-slate-500 text-[11px]">
                Escola Municipal Ricardo Misson — Relatório gerado para análise pedagógica da Professora de Referência e Conselho de Classe.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
