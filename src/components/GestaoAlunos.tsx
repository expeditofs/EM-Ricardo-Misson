import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Search,
  Filter,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Aluno, AlunoCalculado } from '../types';
import { getRiscoBadgeInfo } from '../lib/schoolCalculations';

interface GestaoAlunosProps {
  onAbrirRelatorio: (aluno: AlunoCalculado) => void;
}

export const GestaoAlunos: React.FC<GestaoAlunosProps> = ({ onAbrirRelatorio }) => {
  const {
    turmas,
    alunos,
    alunosCalculados,
    addAluno,
    updateAluno,
    deleteAluno,
    selectedTurmaId,
    setSelectedTurmaId,
  } = useSchool();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [nome, setNome] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [matricula, setMatricula] = useState('');
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelTelefone, setResponsavelTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const openNewModal = () => {
    setEditingAluno(null);
    setNome('');
    setTurmaId(turmas[0]?.id || '');
    setMatricula('');
    setResponsavelNome('');
    setResponsavelTelefone('');
    setObservacoes('');
    setAtivo(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setNome(aluno.nome);
    setTurmaId(aluno.turmaId);
    setMatricula(aluno.matricula || '');
    setResponsavelNome(aluno.responsavelNome || '');
    setResponsavelTelefone(aluno.responsavelTelefone || '');
    setObservacoes(aluno.observacoes || '');
    setAtivo(aluno.ativo !== false);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('O Nome do Estudante é obrigatório. Todos os outros campos são facultativos.');
      return;
    }
    if (!turmaId) {
      setErrorMsg('Selecione uma turma para vincular o estudante.');
      return;
    }

    try {
      if (editingAluno) {
        await updateAluno(editingAluno.id, {
          nome: nome.trim(),
          turmaId,
          matricula: matricula.trim() || undefined,
          responsavelNome: responsavelNome.trim() || undefined,
          responsavelTelefone: responsavelTelefone.trim() || undefined,
          observacoes: observacoes.trim() || undefined,
          ativo,
        });
      } else {
        await addAluno({
          nome: nome.trim(),
          turmaId,
          matricula: matricula.trim() || undefined,
          responsavelNome: responsavelNome.trim() || undefined,
          responsavelTelefone: responsavelTelefone.trim() || undefined,
          observacoes: observacoes.trim() || undefined,
          ativo,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Erro ao salvar estudante. Tente novamente.');
    }
  };

  const handleDelete = async (id: string, nomeAluno: string) => {
    if (confirm(`Atenção: Deseja realmente excluir o estudante "${nomeAluno}" e seu histórico?`)) {
      await deleteAluno(id);
    }
  };

  // Filter students
  const filteredAlunos = alunosCalculados.filter((aluno) => {
    if (selectedTurmaId !== 'TODAS' && aluno.turmaId !== selectedTurmaId) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchNome = aluno.nome.toLowerCase().includes(q);
      const matchMatricula = aluno.matricula?.toLowerCase().includes(q);
      const matchResp = aluno.responsavelNome?.toLowerCase().includes(q);
      if (!matchNome && !matchMatricula && !matchResp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Matrículas e Cadastro de Alunos</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre os alunos por turma na E.M. Ricardo Misson.{' '}
            <strong className="text-blue-700">Apenas o Nome do Aluno é obrigatório</strong>;
            todos os dados complementares de contato e filiação são facultativos.
          </p>
        </div>

        <button
          onClick={openNewModal}
          disabled={turmas.length === 0}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Aluno</span>
        </button>
      </div>

      {turmas.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>É necessário cadastrar ao menos uma Turma antes de cadastrar alunos.</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do aluno, matrícula ou responsável..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedTurmaId}
            onChange={(e) => setSelectedTurmaId(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODAS">Todas as Turmas ({alunos.length} alunos)</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Students */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4">Nome do Aluno (Obrigatório)</th>
              <th className="py-3.5 px-3">Turma</th>
              <th className="py-3.5 px-3">Responsável / Contato (Facultativo)</th>
              <th className="py-3.5 px-3">Infrequência</th>
              <th className="py-3.5 px-3">Status Risco</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAlunos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                  Nenhum aluno encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredAlunos.map((aluno) => {
                const badge = getRiscoBadgeInfo(aluno.nivelRisco);
                const telClean = aluno.responsavelTelefone?.replace(/\D/g, '');

                return (
                  <tr key={aluno.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{aluno.nome}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        {aluno.matricula && <span>Matrícula: #{aluno.matricula}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-xs font-medium text-slate-700">
                      {aluno.turmaNome}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-slate-600">
                      {aluno.responsavelNome ? (
                        <div>
                          <p className="font-medium text-slate-800">{aluno.responsavelNome}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {aluno.responsavelTelefone && (
                              <a
                                href={`tel:${telClean}`}
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {aluno.responsavelTelefone}
                              </a>
                            )}
                            {telClean && (
                              <a
                                href={`https://wa.me/55${telClean}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5"
                                title="Enviar WhatsApp para o responsável"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Não informado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-xs">
                      <div className="font-semibold text-slate-800">
                        {aluno.totalHorasEfetivasPerdidas}h perdidas ({aluno.percentualPerda}%)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {aluno.quantidadeFaltas} registros • {aluno.quantidadeAtestados} atestados
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${badge.colorClass}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <button
                          onClick={() => onAbrirRelatorio(aluno)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver Ficha / FICAI"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(aluno)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                          title="Editar aluno"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(aluno.id, aluno.nome)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                          title="Excluir aluno"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-base">
                  {editingAluno ? 'Editar Dados do Estudante' : 'Cadastrar Novo Estudante'}
                </h3>
                <p className="text-xs text-slate-400">E.M. Ricardo Misson — Uberaba/MG</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Nome do Aluno - OBRIGATÓRIO */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Nome Completo do Aluno <span className="text-red-500">* (Obrigatório)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gabriel Lucas dos Santos..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Turma - OBRIGATÓRIO */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Turma de Matrícula <span className="text-red-500">* (Obrigatório)</span>
                </label>
                <select
                  required
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione a Turma...
                  </option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} {t.turno ? `(${t.turno})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtitle explaining optional fields */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Campos de Preenchimento Facultativo:
                </span>
              </div>

              {/* Matrícula - FACULTATIVO */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Matrícula / Código Escolar <span className="text-slate-400 text-[11px] font-normal">(Facultativo)</span>
                </label>
                <input
                  type="text"
                  placeholder="RM-2026-..."
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Responsável Nome e Telefone - FACULTATIVOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nome do Responsável <span className="text-slate-400 text-[11px] font-normal">(Facultativo)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Mãe, pai ou tutor legal"
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Telefone / WhatsApp <span className="text-slate-400 text-[11px] font-normal">(Facultativo)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="(34) 99999-9999"
                    value={responsavelTelefone}
                    onChange={(e) => setResponsavelTelefone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Observações - FACULTATIVO */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Observações Pedagógicas / Histórico <span className="text-slate-400 text-[11px] font-normal">(Facultativo)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Histórico pedagógico, atendimento especializado ou vulnerabilidade..."
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
                  {editingAluno ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
