import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Save,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  Minus,
  Sun,
  Sunset,
  GraduationCap,
  Users,
  FileText,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { AlunoCalculado } from '../types';
import { getRiscoBadgeInfo, getPesoTurno } from '../lib/schoolCalculations';

interface FaltasAcumuladasProps {
  preselectedAlunoId?: string | null;
  onLimparPreselecao?: () => void;
  onAbrirRelatorio?: (aluno: AlunoCalculado) => void;
}

export const FaltasAcumuladas: React.FC<FaltasAcumuladasProps> = ({
  preselectedAlunoId,
  onLimparPreselecao,
  onAbrirRelatorio,
}) => {
  const {
    turmas,
    alunosCalculados,
    atualizarFaltasAtestadosAcumulados,
  } = useSchool();

  // Selected turma for the form
  const [formTurmaId, setFormTurmaId] = useState<string>('');
  // Selected aluno for the form
  const [formAlunoId, setFormAlunoId] = useState<string>('');
  // Form accumulated values
  const [faltasInput, setFaltasInput] = useState<number>(0);
  const [atestadosInput, setAtestadosInput] = useState<number>(0);

  // Table filter and search
  const [tableTurmaFiltro, setTableTurmaFiltro] = useState<string>('TODAS');
  const [filtroTurno, setFiltroTurno] = useState<'TODOS' | 'MATUTINO' | 'VESPERTINO'>('TODOS');
  const [buscaAluno, setBuscaAluno] = useState<string>('');

  // Inline row edits: maps alunoId -> { faltas: number, atestados: number, modified: boolean, saving?: boolean }
  const [rowEdits, setRowEdits] = useState<Record<string, { faltas: number; atestados: number; modified: boolean }>>({});

  // Success message feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Sort turmas: Matutino first, then Vespertino
  const turmasOrdenadas = useMemo(() => {
    return [...turmas].sort((a, b) => {
      const pesoA = getPesoTurno(a.turno);
      const pesoB = getPesoTurno(b.turno);
      if (pesoA !== pesoB) return pesoA - pesoB;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [turmas]);

  // Handle preselection when passed as prop
  useEffect(() => {
    if (preselectedAlunoId) {
      const target = alunosCalculados.find((a) => a.id === preselectedAlunoId);
      if (target) {
        setFormTurmaId(target.turmaId);
        setFormAlunoId(target.id);
        setFaltasInput(target.totalFaltasAcumuladas);
        setAtestadosInput(target.totalAtestadosAcumulados);
        setTableTurmaFiltro(target.turmaId);
      }
    } else if (!formTurmaId && turmasOrdenadas.length > 0) {
      setFormTurmaId(turmasOrdenadas[0].id);
    }
  }, [preselectedAlunoId, alunosCalculados, turmasOrdenadas, formTurmaId]);

  // When formTurmaId changes, auto-select first student of that turma if current student is not in it
  const alunosDaTurmaDoForm = useMemo(() => {
    if (!formTurmaId) return [];
    return alunosCalculados.filter((a) => a.turmaId === formTurmaId);
  }, [alunosCalculados, formTurmaId]);

  useEffect(() => {
    if (alunosDaTurmaDoForm.length > 0) {
      const currentSelectedExists = alunosDaTurmaDoForm.some((a) => a.id === formAlunoId);
      if (!currentSelectedExists) {
        const primeiro = alunosDaTurmaDoForm[0];
        setFormAlunoId(primeiro.id);
        setFaltasInput(primeiro.totalFaltasAcumuladas);
        setAtestadosInput(primeiro.totalAtestadosAcumulados);
      }
    } else {
      setFormAlunoId('');
      setFaltasInput(0);
      setAtestadosInput(0);
    }
  }, [formTurmaId, alunosDaTurmaDoForm, formAlunoId]);

  // When user selects a different student in the form
  const handleSelectAlunoForm = (alunoId: string) => {
    setFormAlunoId(alunoId);
    const target = alunosCalculados.find((a) => a.id === alunoId);
    if (target) {
      setFaltasInput(target.totalFaltasAcumuladas);
      setAtestadosInput(target.totalAtestadosAcumulados);
    }
  };

  // Currently selected student object in the form
  const alunoSelecionadoObj = useMemo(() => {
    return alunosCalculados.find((a) => a.id === formAlunoId);
  }, [alunosCalculados, formAlunoId]);

  // Projected metrics preview for the form
  const projectedMetrics = useMemo(() => {
    if (!alunoSelecionadoObj) return null;
    const cargaTotal = alunoSelecionadoObj.totalHorasLetivas || 800;
    const faltas = Math.max(0, Number(faltasInput) || 0);
    const atestados = Math.max(0, Number(atestadosInput) || 0);
    const perdidas = Math.max(0, faltas - atestados);
    const percentualPerda = Math.min(100, Math.round((perdidas / cargaTotal) * 1000) / 10);
    const freq = Math.max(0, Math.round((100 - percentualPerda) * 10) / 10);

    let nivel: 'BAIXO' | 'ATENCAO' | 'ALTO' | 'CRITICO' = 'BAIXO';
    if (percentualPerda >= 25) nivel = 'CRITICO';
    else if (percentualPerda >= 20) nivel = 'ALTO';
    else if (percentualPerda >= 10) nivel = 'ATENCAO';

    return {
      perdidas,
      percentualPerda,
      freq,
      nivel,
      badge: getRiscoBadgeInfo(nivel),
    };
  }, [alunoSelecionadoObj, faltasInput, atestadosInput]);

  // Save changes from top form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAlunoId) {
      setFeedbackMsg({ text: 'Por favor, selecione a turma e o estudante.', type: 'info' });
      return;
    }

    try {
      await atualizarFaltasAtestadosAcumulados(formAlunoId, faltasInput, atestadosInput);
      setFeedbackMsg({
        text: `Alteração salva com sucesso para ${alunoSelecionadoObj?.nome || 'o estudante'}! Faltas: ${faltasInput} | Atestados: ${atestadosInput}`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      if (onLimparPreselecao) onLimparPreselecao();
    } catch (err) {
      console.error(err);
      setFeedbackMsg({ text: 'Erro ao salvar alterações no banco de dados.', type: 'info' });
    }
  };

  // Quick increment/decrement buttons for form
  const adjustFormFaltas = (delta: number) => {
    setFaltasInput((prev) => Math.max(0, prev + delta));
  };

  const adjustFormAtestados = (delta: number) => {
    setAtestadosInput((prev) => Math.max(0, prev + delta));
  };

  // Initialize or get row edit state
  const getRowValues = (aluno: AlunoCalculado) => {
    if (rowEdits[aluno.id]) {
      return rowEdits[aluno.id];
    }
    return {
      faltas: aluno.totalFaltasAcumuladas,
      atestados: aluno.totalAtestadosAcumulados,
      modified: false,
    };
  };

  const updateRowFaltas = (alunoId: string, currentVal: number, novoVal: number) => {
    const val = Math.max(0, Number(novoVal) || 0);
    setRowEdits((prev) => {
      const existing = prev[alunoId] || {
        faltas: currentVal,
        atestados: alunosCalculados.find((a) => a.id === alunoId)?.totalAtestadosAcumulados || 0,
        modified: false,
      };
      return {
        ...prev,
        [alunoId]: {
          ...existing,
          faltas: val,
          modified: true,
        },
      };
    });
  };

  const updateRowAtestados = (alunoId: string, currentVal: number, novoVal: number) => {
    const val = Math.max(0, Number(novoVal) || 0);
    setRowEdits((prev) => {
      const existing = prev[alunoId] || {
        faltas: alunosCalculados.find((a) => a.id === alunoId)?.totalFaltasAcumuladas || 0,
        atestados: currentVal,
        modified: false,
      };
      return {
        ...prev,
        [alunoId]: {
          ...existing,
          atestados: val,
          modified: true,
        },
      };
    });
  };

  // Quick adjust for a row (+1, -1)
  const adjustRowValue = (alunoId: string, field: 'faltas' | 'atestados', delta: number) => {
    const aluno = alunosCalculados.find((a) => a.id === alunoId);
    if (!aluno) return;
    const current = getRowValues(aluno);
    if (field === 'faltas') {
      updateRowFaltas(alunoId, aluno.totalFaltasAcumuladas, current.faltas + delta);
    } else {
      updateRowAtestados(alunoId, aluno.totalAtestadosAcumulados, current.atestados + delta);
    }
  };

  // Save individual row changes directly in the table
  const handleSaveRow = async (aluno: AlunoCalculado) => {
    const edit = rowEdits[aluno.id];
    if (!edit) return;

    try {
      await atualizarFaltasAtestadosAcumulados(aluno.id, edit.faltas, edit.atestados);
      setRowEdits((prev) => {
        const copy = { ...prev };
        delete copy[aluno.id];
        return copy;
      });
      setFeedbackMsg({
        text: `Valores acumulados de ${aluno.nome} atualizados com sucesso!`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMsg(null), 3500);

      // If this was the student currently open in the form, sync form inputs
      if (formAlunoId === aluno.id) {
        setFaltasInput(edit.faltas);
        setAtestadosInput(edit.atestados);
      }
    } catch (err) {
      console.error(err);
      setFeedbackMsg({ text: 'Erro ao salvar alterações da linha.', type: 'info' });
    }
  };

  // Load a row student into the top form for detailed adjustment
  const handleCarregarNoForm = (aluno: AlunoCalculado) => {
    setFormTurmaId(aluno.turmaId);
    setFormAlunoId(aluno.id);
    setFaltasInput(aluno.totalFaltasAcumuladas);
    setAtestadosInput(aluno.totalAtestadosAcumulados);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter students for the table
  const alunosFiltradosTabela = useMemo(() => {
    return alunosCalculados.filter((aluno) => {
      // Turma filter
      if (tableTurmaFiltro !== 'TODAS' && aluno.turmaId !== tableTurmaFiltro) {
        return false;
      }
      // Turno filter
      if (filtroTurno !== 'TODOS') {
        const turma = turmas.find((t) => t.id === aluno.turmaId);
        const turnoNorm = (turma?.turno || '').toLowerCase();
        if (filtroTurno === 'MATUTINO' && !turnoNorm.includes('matutino') && !turnoNorm.includes('manha') && !turnoNorm.includes('manhã')) {
          return false;
        }
        if (filtroTurno === 'VESPERTINO' && !turnoNorm.includes('vespertino') && !turnoNorm.includes('tarde')) {
          return false;
        }
      }
      // Search filter
      if (buscaAluno.trim() !== '') {
        const q = buscaAluno.toLowerCase();
        const matchNome = aluno.nome.toLowerCase().includes(q);
        const matchMatricula = aluno.matricula?.toLowerCase().includes(q);
        const matchTurma = aluno.turmaNome?.toLowerCase().includes(q);
        if (!matchNome && !matchMatricula && !matchTurma) return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort Matutino first, then Vespertino, then student name
      const turmaA = turmas.find((t) => t.id === a.turmaId);
      const turmaB = turmas.find((t) => t.id === b.turmaId);
      const pesoA = getPesoTurno(turmaA?.turno);
      const pesoB = getPesoTurno(turmaB?.turno);
      if (pesoA !== pesoB) return pesoA - pesoB;
      const turmaComp = (turmaA?.nome || '').localeCompare(turmaB?.nome || '', 'pt-BR');
      if (turmaComp !== 0) return turmaComp;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [alunosCalculados, turmas, tableTurmaFiltro, filtroTurno, buscaAluno]);

  // Overall KPIs
  const totalFaltasGeral = useMemo(() => {
    return alunosCalculados.reduce((sum, a) => sum + a.totalFaltasAcumuladas, 0);
  }, [alunosCalculados]);

  const totalAtestadosGeral = useMemo(() => {
    return alunosCalculados.reduce((sum, a) => sum + a.totalAtestadosAcumulados, 0);
  }, [alunosCalculados]);

  const totalCriticos = useMemo(() => {
    return alunosCalculados.filter((a) => a.nivelRisco === 'CRITICO').length;
  }, [alunosCalculados]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-900/20 flex-shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Faltas e Atestados Acumulados
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Lançamento Consolidado
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Cadastre e altere os totais de faltas acumuladas e atestados acumulados por turma e estudante sempre que ocorrer um evento de ausência ou justificativa médica.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
            <div className="px-2">
              <p className="text-[11px] font-medium text-slate-500">Total Faltas</p>
              <p className="text-lg font-bold text-blue-700">{totalFaltasGeral}</p>
            </div>
            <div className="px-2 border-x border-slate-200">
              <p className="text-[11px] font-medium text-slate-500">Total Atestados</p>
              <p className="text-lg font-bold text-indigo-700">{totalAtestadosGeral}</p>
            </div>
            <div className="px-2">
              <p className="text-[11px] font-medium text-slate-500">Risco FICAI (≥25%)</p>
              <p className={`text-lg font-bold ${totalCriticos > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {totalCriticos}
              </p>
            </div>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* SECTION 1: Cadastro / Alteração Rápida por Evento (Formulário) */}
      <div className="bg-white rounded-2xl border-2 border-blue-500/30 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cadastrar / Alterar Faltas e Atestados do Estudante
              </h3>
              <p className="text-xs text-slate-500">
                Selecione a turma e o aluno para alterar os totais acumulados sempre que ocorrer um evento
              </p>
            </div>
          </div>
          {alunoSelecionadoObj && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              Estudante Ativo: {alunoSelecionadoObj.nome}
            </span>
          )}
        </div>

        {turmasOrdenadas.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700">Nenhuma turma cadastrada</h4>
            <p className="text-xs text-slate-500 mt-1">
              Cadastre primeiro as turmas na aba "Turmas" para poder registrar faltas e atestados.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveForm} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CAMPO 1: Turma (com seleção ordenada matutino primeiro) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  1. Turma <span className="text-red-500">*</span>
                </label>
                <select
                  value={formTurmaId}
                  onChange={(e) => setFormTurmaId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
                  required
                >
                  <option value="" disabled>Selecione a turma...</option>
                  {turmasOrdenadas.map((t) => {
                    const isMatutino = (t.turno || '').toLowerCase().includes('matutino') || (t.turno || '').toLowerCase().includes('manh');
                    const isVespertino = (t.turno || '').toLowerCase().includes('vespertino') || (t.turno || '').toLowerCase().includes('tarde');
                    const icon = isMatutino ? '☀️' : isVespertino ? '🌤️' : '🏫';
                    return (
                      <option key={t.id} value={t.id}>
                        {icon} {t.nome} — {t.turno || 'Geral'}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Turmas matutinas são exibidas primeiro
                </p>
              </div>

              {/* CAMPO 2: Aluno dentro da turma selecionada */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  2. Nome do Aluno <span className="text-red-500">*</span>
                </label>
                <select
                  value={formAlunoId}
                  onChange={(e) => handleSelectAlunoForm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
                  required
                  disabled={alunosDaTurmaDoForm.length === 0}
                >
                  {alunosDaTurmaDoForm.length === 0 ? (
                    <option value="">Nenhum aluno nesta turma</option>
                  ) : (
                    alunosDaTurmaDoForm.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome} ({a.totalFaltasAcumuladas} faltas / {a.totalAtestadosAcumulados} atestados)
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {alunosDaTurmaDoForm.length} estudante(s) na turma
                </p>
              </div>

              {/* CAMPO 3: Total de Faltas Acumuladas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    3. Total Faltas Acumuladas <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-blue-600 font-semibold">Alterar por evento</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustFormFaltas(-1)}
                    className="w-9 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition border border-slate-300"
                    title="Diminuir 1 falta"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={faltasInput}
                    onChange={(e) => setFaltasInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-center bg-blue-50/60 border border-blue-300 rounded-xl py-2 text-base font-extrabold text-blue-950 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => adjustFormFaltas(1)}
                    className="w-9 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center transition shadow-xs"
                    title="Adicionar 1 falta (+1)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => adjustFormFaltas(1)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium transition"
                  >
                    +1 Falta
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustFormFaltas(4)}
                    className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-semibold transition"
                    title="Adicionar 4 horas (1 dia completo)"
                  >
                    +4h (1 Dia)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaltasInput(0)}
                    className="text-[10px] bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-500 px-2 py-0.5 rounded font-medium transition ml-auto"
                  >
                    Zerar
                  </button>
                </div>
              </div>

              {/* CAMPO 4: Total de Atestados Acumulados */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    4. Total Atestados Acumulados
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">Horas abonadas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustFormAtestados(-1)}
                    className="w-9 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition border border-slate-300"
                    title="Diminuir 1 atestado/hora"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={atestadosInput}
                    onChange={(e) => setAtestadosInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-center bg-indigo-50/60 border border-indigo-300 rounded-xl py-2 text-base font-extrabold text-indigo-950 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => adjustFormAtestados(1)}
                    className="w-9 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center transition shadow-xs"
                    title="Adicionar 1 atestado (+1)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => adjustFormAtestados(1)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium transition"
                  >
                    +1 Atestado
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustFormAtestados(4)}
                    className="text-[10px] bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-semibold transition"
                    title="Adicionar 4 horas abonadas de 1 dia"
                  >
                    +4h Abonadas
                  </button>
                  <button
                    type="button"
                    onClick={() => setAtestadosInput(0)}
                    className="text-[10px] bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-500 px-2 py-0.5 rounded font-medium transition ml-auto"
                  >
                    Zerar
                  </button>
                </div>
              </div>
            </div>

            {/* Impact Calculation Preview Bar & Submit Button */}
            {projectedMetrics && alunoSelecionadoObj && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap text-xs w-full sm:w-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Resultado Projetado:</span>
                    <span className="font-bold text-slate-900">
                      {projectedMetrics.perdidas} horas perdidas líquidas ({projectedMetrics.percentualPerda}%)
                    </span>
                  </div>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Frequência:</span>
                    <span className="font-bold text-slate-800">{projectedMetrics.freq}%</span>
                  </div>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${projectedMetrics.badge.colorClass}`}
                    >
                      {projectedMetrics.badge.label}
                    </span>
                  </div>
                  {projectedMetrics.percentualPerda >= 25 && (
                    <span className="text-red-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      Limite de 25% da LDB atingido!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (alunoSelecionadoObj) {
                        setFaltasInput(alunoSelecionadoObj.totalFaltasAcumuladas);
                        setAtestadosInput(alunoSelecionadoObj.totalAtestadosAcumulados);
                      }
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition"
                    title="Restaurar valores anteriores"
                  >
                    Desfazer
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-md shadow-blue-900/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações do Estudante</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {/* SECTION 2: Tabela de Faltas e Atestados Acumulados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Tabela de Faltas e Atestados Acumulados</span>
                <span className="text-xs font-normal text-slate-500">
                  ({alunosFiltradosTabela.length} {alunosFiltradosTabela.length === 1 ? 'estudante' : 'estudantes'})
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Altere diretamente na tabela ou use os botões rápidos (+1 / -1) para lançar eventos em tempo real
              </p>
            </div>

            {/* Quick Turno Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
              <button
                onClick={() => setFiltroTurno('TODOS')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filtroTurno === 'TODOS'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroTurno('MATUTINO')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  filtroTurno === 'MATUTINO'
                    ? 'bg-amber-100 text-amber-900 shadow-xs font-bold border border-amber-300'
                    : 'text-slate-600 hover:text-amber-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Matutino</span>
              </button>
              <button
                onClick={() => setFiltroTurno('VESPERTINO')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  filtroTurno === 'VESPERTINO'
                    ? 'bg-orange-100 text-orange-900 shadow-xs font-bold border border-orange-300'
                    : 'text-slate-600 hover:text-orange-800'
                }`}
              >
                <Sunset className="w-3.5 h-3.5 text-orange-500" />
                <span>Vespertino</span>
              </button>
            </div>
          </div>

          {/* Search and Turma selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            {/* Turma filter dropdown */}
            <div className="w-full sm:w-72">
              <select
                value={tableTurmaFiltro}
                onChange={(e) => setTableTurmaFiltro(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODAS">Todas as Turmas (Matutino primeiro)</option>
                {turmasOrdenadas.map((t) => {
                  const isMatutino = (t.turno || '').toLowerCase().includes('matutino') || (t.turno || '').toLowerCase().includes('manh');
                  const isVespertino = (t.turno || '').toLowerCase().includes('vespertino') || (t.turno || '').toLowerCase().includes('tarde');
                  const icon = isMatutino ? '☀️' : isVespertino ? '🌤️' : '🏫';
                  return (
                    <option key={t.id} value={t.id}>
                      {icon} {t.nome} ({t.turno || 'Geral'})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Student Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome do estudante ou matrícula..."
                value={buscaAluno}
                onChange={(e) => setBuscaAluno(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* The Table */}
        {alunosFiltradosTabela.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Nenhum estudante encontrado com os filtros selecionados.</p>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre estudantes na aba "Alunos" ou ajuste a busca acima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Turma</th>
                  <th className="py-3.5 px-4">Nome do Aluno</th>
                  <th className="py-3.5 px-4 text-center">Total Faltas Acumuladas</th>
                  <th className="py-3.5 px-4 text-center">Total Atestados Acumulados</th>
                  <th className="py-3.5 px-4">Infrequência & Risco</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alunosFiltradosTabela.map((aluno) => {
                  const turma = turmas.find((t) => t.id === aluno.turmaId);
                  const isMatutino = (turma?.turno || '').toLowerCase().includes('matutino') || (turma?.turno || '').toLowerCase().includes('manh');
                  const isVespertino = (turma?.turno || '').toLowerCase().includes('vespertino') || (turma?.turno || '').toLowerCase().includes('tarde');

                  const rowState = getRowValues(aluno);
                  const isModified = rowState.modified;
                  const badge = getRiscoBadgeInfo(aluno.nivelRisco);

                  return (
                    <tr
                      key={aluno.id}
                      className={`hover:bg-blue-50/30 transition ${isModified ? 'bg-amber-50/40' : ''}`}
                    >
                      {/* 1. TURMA */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{aluno.turmaNome}</div>
                        <div className="flex items-center gap-1 text-[11px] mt-0.5">
                          {isMatutino ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              <Sun className="w-3 h-3 text-amber-500" />
                              Matutino
                            </span>
                          ) : isVespertino ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                              <Sunset className="w-3 h-3 text-orange-500" />
                              Vespertino
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">{turma?.turno || 'Geral'}</span>
                          )}
                        </div>
                      </td>

                      {/* 2. NOME DO ALUNO */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{aluno.nome}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {aluno.matricula && <span>Matr: {aluno.matricula}</span>}
                          {aluno.responsavelNome && <span>Resp: {aluno.responsavelNome}</span>}
                        </div>
                      </td>

                      {/* 3. TOTAL DE FALTAS ACUMULADAS */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustRowValue(aluno.id, 'faltas', -1)}
                            className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition border border-slate-300"
                            title="Subtrair 1 falta"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={rowState.faltas}
                            onChange={(e) =>
                              updateRowFaltas(aluno.id, aluno.totalFaltasAcumuladas, parseInt(e.target.value, 10) || 0)
                            }
                            className={`w-16 text-center py-1 rounded-lg text-sm font-extrabold border transition ${
                              isModified
                                ? 'bg-amber-100 border-amber-400 text-amber-950 font-black ring-1 ring-amber-400'
                                : 'bg-blue-50/70 border-blue-200 text-blue-950'
                            }`}
                            title="Total de Faltas Acumuladas"
                          />

                          <button
                            type="button"
                            onClick={() => adjustRowValue(aluno.id, 'faltas', 1)}
                            className="w-7 h-7 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center transition shadow-2xs"
                            title="Adicionar 1 falta (+1)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {isModified && (
                          <div className="text-center text-[10px] text-amber-700 font-bold mt-1">
                            Alterado (não salvo)
                          </div>
                        )}
                      </td>

                      {/* 4. TOTAL DE ATESTADOS ACUMULADOS */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustRowValue(aluno.id, 'atestados', -1)}
                            className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition border border-slate-300"
                            title="Subtrair 1 atestado"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={rowState.atestados}
                            onChange={(e) =>
                              updateRowAtestados(
                                aluno.id,
                                aluno.totalAtestadosAcumulados,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className={`w-16 text-center py-1 rounded-lg text-sm font-extrabold border transition ${
                              isModified
                                ? 'bg-amber-100 border-amber-400 text-amber-950 font-black ring-1 ring-amber-400'
                                : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                            }`}
                            title="Total de Atestados Acumulados"
                          />

                          <button
                            type="button"
                            onClick={() => adjustRowValue(aluno.id, 'atestados', 1)}
                            className="w-7 h-7 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center transition shadow-2xs"
                            title="Adicionar 1 atestado (+1)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 5. INFREQUÊNCIA & RISCO */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.colorClass}`}
                          >
                            {badge.label} ({aluno.percentualPerda}%)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Líquidas: <strong>{aluno.totalHorasEfetivasPerdidas}h</strong> / {aluno.totalHorasLetivas}h
                        </div>
                      </td>

                      {/* 6. AÇÕES */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {isModified && (
                            <button
                              type="button"
                              onClick={() => handleSaveRow(aluno)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs animate-pulse"
                              title="Salvar alterações desta linha"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Salvar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCarregarNoForm(aluno)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition border border-transparent hover:border-blue-200"
                            title="Carregar no formulário superior para ajuste detalhado"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          {onAbrirRelatorio && (
                            <button
                              type="button"
                              onClick={() => onAbrirRelatorio(aluno)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200"
                              title="Ver ficha FICAI do estudante"
                            >
                              FICAI
                            </button>
                          )}
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
    </div>
  );
};
