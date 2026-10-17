import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Building,
  Calendar,
  Clock,
  BookOpen,
  Sun,
  Sunset,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Turma } from '../types';

export const GestaoTurmas: React.FC = () => {
  const { turmas, alunosCalculados, addTurma, updateTurma, deleteTurma } = useSchool();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [filtroTurno, setFiltroTurno] = useState<'TODOS' | 'MATUTINO' | 'VESPERTINO' | 'OUTROS'>('TODOS');

  // Form state
  const [nome, setNome] = useState('');
  const [turno, setTurno] = useState('Matutino');
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());
  const [cargaHorariaTotal, setCargaHorariaTotal] = useState<number>(800);
  const [professorReferencia, setProfessorReferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Agrupamento por Turno para apresentação prioritária: Matutino primeiro, depois Vespertino
  const turmasMatutino = useMemo(
    () => turmas.filter((t) => t.turno?.toLowerCase().includes('mat') || t.turno?.toLowerCase().includes('manh')),
    [turmas]
  );

  const turmasVespertino = useMemo(
    () => turmas.filter((t) => t.turno?.toLowerCase().includes('vesp') || t.turno?.toLowerCase().includes('tard')),
    [turmas]
  );

  const turmasOutros = useMemo(
    () =>
      turmas.filter(
        (t) =>
          !t.turno?.toLowerCase().includes('mat') &&
          !t.turno?.toLowerCase().includes('manh') &&
          !t.turno?.toLowerCase().includes('vesp') &&
          !t.turno?.toLowerCase().includes('tard')
      ),
    [turmas]
  );

  const openNewModal = () => {
    setEditingTurma(null);
    setNome('');
    setTurno('Matutino');
    setAnoLetivo(new Date().getFullYear().toString());
    setCargaHorariaTotal(800);
    setProfessorReferencia('');
    setObservacoes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (turma: Turma) => {
    setEditingTurma(turma);
    setNome(turma.nome);
    setTurno(turma.turno || 'Matutino');
    setAnoLetivo(turma.anoLetivo || new Date().getFullYear().toString());
    setCargaHorariaTotal(turma.cargaHorariaTotal || 800);
    setProfessorReferencia(turma.professorReferencia || '');
    setObservacoes(turma.observacoes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('O Nome da Turma é obrigatório. Todos os demais campos são facultativos.');
      return;
    }

    try {
      if (editingTurma) {
        await updateTurma(editingTurma.id, {
          nome: nome.trim(),
          turno: turno || undefined,
          anoLetivo: anoLetivo || undefined,
          cargaHorariaTotal: Number(cargaHorariaTotal) || 800,
          professorReferencia: professorReferencia || undefined,
          observacoes: observacoes || undefined,
        });
      } else {
        await addTurma({
          nome: nome.trim(),
          turno: turno || undefined,
          anoLetivo: anoLetivo || undefined,
          cargaHorariaTotal: Number(cargaHorariaTotal) || 800,
          professorReferencia: professorReferencia || undefined,
          observacoes: observacoes || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Erro ao salvar turma. Tente novamente.');
    }
  };

  const handleDelete = async (id: string, nomeTurma: string) => {
    if (confirm(`Atenção: Deseja realmente excluir a turma "${nomeTurma}"? Os alunos vinculados também serão removidos.`)) {
      await deleteTurma(id);
    }
  };

  const renderTurmaCard = (turma: Turma) => {
    const alunosDaTurma = alunosCalculados.filter((a) => a.turmaId === turma.id);
    const alunosCriticos = alunosDaTurma.filter((a) => a.nivelRisco === 'CRITICO');
    const alunosAltos = alunosDaTurma.filter((a) => a.nivelRisco === 'ALTO');

    const isMatutino = turma.turno?.toLowerCase().includes('mat') || turma.turno?.toLowerCase().includes('manh');
    const isVespertino = turma.turno?.toLowerCase().includes('vesp') || turma.turno?.toLowerCase().includes('tard');

    return (
      <div
        key={turma.id}
        className={`bg-white rounded-xl border shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between ${
          isMatutino
            ? 'border-amber-200 hover:border-amber-400'
            : isVespertino
            ? 'border-sky-200 hover:border-sky-400'
            : 'border-slate-200 hover:border-blue-300'
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isMatutino
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : isVespertino
                    ? 'bg-sky-50 text-sky-900 border-sky-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {isMatutino && <Sun className="w-3.5 h-3.5 text-amber-600" />}
                {isVespertino && <Sunset className="w-3.5 h-3.5 text-sky-600" />}
                <span>{turma.turno ? `Turno ${turma.turno}` : 'Turno Facultativo'}</span>
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">{turma.nome}</h3>
              {turma.anoLetivo && (
                <p className="text-xs text-slate-500">Ano Letivo: {turma.anoLetivo}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEditModal(turma)}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                title="Editar turma"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(turma.id, turma.nome)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition"
                title="Excluir turma"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Atributos Facultativos */}
          <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
            {turma.professorReferencia && (
              <p className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Profª. Referência: <strong>{turma.professorReferencia}</strong>
                </span>
              </p>
            )}
            <p className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Carga Horária Total: {turma.cargaHorariaTotal || 800} horas letivas</span>
            </p>
          </div>

          {/* Indicadores de Risco para esta Turma */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <strong>{alunosDaTurma.length}</strong> alunos matriculados
            </span>
            {alunosCriticos.length > 0 ? (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {alunosCriticos.length} em risco FICAI
              </span>
            ) : alunosAltos.length > 0 ? (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {alunosAltos.length} em risco alto
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 font-medium">Frequência regular</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Add Button */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span>Gestão de Turmas — E.M. Ricardo Misson</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre as turmas escolares organizadas por turno (Matutino e Vespertino). Conforme diretriz,{' '}
            <strong className="text-blue-700">apenas o Nome da Turma é de preenchimento obrigatório</strong>;
            todos os outros campos são facultativos.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Turma</span>
        </button>
      </div>

      {/* Turno Navigation and Quick Filter Tabs */}
      {turmas.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Filtrar Turno:
            </span>

            <button
              onClick={() => setFiltroTurno('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroTurno === 'TODOS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas as Turmas ({turmas.length})
            </button>

            <button
              onClick={() => setFiltroTurno('MATUTINO')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroTurno === 'MATUTINO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>1º Turno Matutino ({turmasMatutino.length})</span>
            </button>

            <button
              onClick={() => setFiltroTurno('VESPERTINO')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroTurno === 'VESPERTINO'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
              <span>2º Turno Vespertino ({turmasVespertino.length})</span>
            </button>

            {turmasOutros.length > 0 && (
              <button
                onClick={() => setFiltroTurno('OUTROS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filtroTurno === 'OUTROS'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Demais Turnos ({turmasOutros.length})
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium hidden md:block">
            Ordem de apresentação: <span className="text-amber-700 font-bold">Matutino</span> ➔{' '}
            <span className="text-sky-700 font-bold">Vespertino</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {turmas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nenhuma turma cadastrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Cadastre as turmas da Escola Municipal Ricardo Misson para registrar estudantes e acompanhar a frequência escolar.
          </p>
          <button
            onClick={openNewModal}
            className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Turma</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. SEÇÃO TURNO MATUTINO (Apresentado Primeiramente) */}
          {(filtroTurno === 'TODOS' || filtroTurno === 'MATUTINO') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl border-y border-r border-amber-200 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                      Turmas do Turno Matutino (Manhã)
                    </h3>
                    <p className="text-[11px] text-amber-800">
                      Apresentadas prioritariamente no início do expediente escolar
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full">
                    {turmasMatutino.length} {turmasMatutino.length === 1 ? 'Turma' : 'Turmas'}
                  </span>
                </div>
              </div>

              {turmasMatutino.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                  Nenhuma turma cadastrada no turno matutino.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {turmasMatutino.map(renderTurmaCard)}
                </div>
              )}
            </section>
          )}

          {/* 2. SEÇÃO TURNO VESPERTINO (Apresentado em Seguida) */}
          {(filtroTurno === 'TODOS' || filtroTurno === 'VESPERTINO') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between bg-gradient-to-r from-sky-50 to-blue-50 border-l-4 border-sky-500 p-3.5 rounded-r-xl border-y border-r border-sky-200 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
                    <Sunset className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-sky-950 uppercase tracking-wide">
                      Turmas do Turno Vespertino (Tarde)
                    </h3>
                    <p className="text-[11px] text-sky-800">
                      Apresentadas em seguida para o período vespertino de aulas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-900 bg-sky-100/90 border border-sky-300 px-3 py-1 rounded-full">
                    {turmasVespertino.length} {turmasVespertino.length === 1 ? 'Turma' : 'Turmas'}
                  </span>
                </div>
              </div>

              {turmasVespertino.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                  Nenhuma turma cadastrada no turno vespertino.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {turmasVespertino.map(renderTurmaCard)}
                </div>
              )}
            </section>
          )}

          {/* 3. DEMAIS TURNOS OU NÃO ESPECIFICADOS (Se houver) */}
          {(filtroTurno === 'TODOS' || filtroTurno === 'OUTROS') && turmasOutros.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 border-l-4 border-slate-500 p-3.5 rounded-r-xl border-y border-r border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-600 text-white flex items-center justify-center shadow-xs">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Demais Turnos / Não Especificado
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Turmas integrais, noturnas ou com turno facultativo não informado
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-800 bg-white border border-slate-300 px-3 py-1 rounded-full">
                  {turmasOutros.length} {turmasOutros.length === 1 ? 'Turma' : 'Turmas'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turmasOutros.map(renderTurmaCard)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal Add / Edit Class */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingTurma ? 'Editar Turma' : 'Cadastrar Nova Turma'}
                </h3>
                <p className="text-xs text-slate-400">Escola Municipal Ricardo Misson</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Nome da Turma - OBRIGATÓRIO */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Nome da Turma <span className="text-red-500">* (Obrigatório)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 5º Ano A, 7º Ano B, 1º Período..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Turno - FACULTATIVO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Turno <span className="text-slate-400 text-[11px] font-normal">(Facultativo)</span>
                  </label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Matutino">Matutino (Manhã)</option>
                    <option value="Vespertino">Vespertino (Tarde)</option>
                    <option value="Integral">Integral</option>
                    <option value="Noturno">Noturno</option>
                    <option value="">Não informado</option>
                  </select>
                </div>

                {/* Ano Letivo - FACULTATIVO */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ano Letivo <span className="text-slate-400 text-[11px] font-normal">(Facultativo)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="2026"
                    value={anoLetivo}
                    onChange={(e) => setAnoLetivo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Professora de Referência - FACULTATIVO */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Professora de Referência <span className="text-slate-400 text-[11px] font-normal">(Facultativo)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Profª. Maria Aparecida"
                  value={professorReferencia}
                  onChange={(e) => setProfessorReferencia(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Carga Horária Anual - FACULTATIVO */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Carga Horária Anual (Horas) <span className="text-slate-400 text-[11px] font-normal">(Facultativo)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="800 (padrão LDB)"
                  value={cargaHorariaTotal}
                  onChange={(e) => setCargaHorariaTotal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Observações - FACULTATIVO */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Observações Pedagógicas <span className="text-slate-400 text-[11px] font-normal">(Facultativo)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Anotações gerais sobre a turma, projetos ou perfil..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
                >
                  {editingTurma ? 'Salvar Alterações' : 'Cadastrar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
