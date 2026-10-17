import React, { useState } from 'react';
import {
  HeartHandshake,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  Phone,
  Home,
  Users,
  FileWarning,
  BookCheck,
  Search,
  Filter,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Intervencao, TipoIntervencao, StatusIntervencao, AlunoCalculado } from '../types';
import { getRiscoBadgeInfo } from '../lib/schoolCalculations';

interface IntervencoesPedagogicasProps {
  preselectedAlunoId?: string | null;
  onLimparPreselecao?: () => void;
  onAbrirRelatorio?: (aluno: AlunoCalculado) => void;
}

const TIPOS_INTERVENCAO: TipoIntervencao[] = [
  'Contato telefônico com responsável',
  'Mensagem WhatsApp / Notificação',
  'Reunião pedagógica presencial',
  'Busca ativa escolar / Visita domiciliar',
  'Encaminhamento à Orientação Educacional',
  'Encaminhamento ao CRAS / Rede Socioassistencial',
  'Notificação formal FICAI / Conselho Tutelar',
  'Plano individual de reposição de aprendizagem',
  'Outra intervenção pedagógica',
];

export const IntervencoesPedagogicas: React.FC<IntervencoesPedagogicasProps> = ({
  preselectedAlunoId,
  onLimparPreselecao,
  onAbrirRelatorio,
}) => {
  const {
    turmas,
    alunosCalculados,
    intervencoes,
    addIntervencao,
    updateIntervencao,
    deleteIntervencao,
    user,
  } = useSchool();

  const [alunoId, setAlunoId] = useState<string>(preselectedAlunoId || '');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tipo, setTipo] = useState<string>(TIPOS_INTERVENCAO[0]);
  const [descricao, setDescricao] = useState<string>('');
  const [responsavelAcao, setResponsavelAcao] = useState<string>(
    user?.displayName || 'Professora de Referência'
  );
  const [status, setStatus] = useState<StatusIntervencao>('Concluída');
  const [resultado, setResultado] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [editingId, setEditingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (preselectedAlunoId) {
      setAlunoId(preselectedAlunoId);
    }
  }, [preselectedAlunoId]);

  const selectedAluno = alunosCalculados.find((a) => a.id === alunoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoId) {
      alert('Selecione o estudante para registrar a intervenção.');
      return;
    }
    const aluno = alunosCalculados.find((a) => a.id === alunoId);
    if (!aluno) return;

    try {
      if (editingId) {
        await updateIntervencao(editingId, {
          data,
          tipo,
          descricao: descricao.trim() || undefined,
          responsavelAcao: responsavelAcao.trim() || undefined,
          status,
          resultado: resultado.trim() || undefined,
        });
        setFeedbackMsg('Intervenção atualizada com sucesso!');
        setEditingId(null);
      } else {
        await addIntervencao({
          alunoId: aluno.id,
          turmaId: aluno.turmaId,
          data,
          tipo,
          descricao: descricao.trim() || undefined,
          responsavelAcao: responsavelAcao.trim() || undefined,
          status,
          resultado: resultado.trim() || undefined,
        });
        setFeedbackMsg(`Ação pedagógica registrada com sucesso para ${aluno.nome}!`);
      }

      setDescricao('');
      setResultado('');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar intervenção.');
    }
  };

  const handleEdit = (interv: Intervencao) => {
    setEditingId(interv.id);
    setAlunoId(interv.alunoId);
    setData(interv.data);
    setTipo(interv.tipo);
    setDescricao(interv.descricao || '');
    setResponsavelAcao(interv.responsavelAcao || '');
    setStatus((interv.status as StatusIntervencao) || 'Concluída');
    setResultado(interv.resultado || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDescricao('');
    setResultado('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este registro de intervenção?')) {
      await deleteIntervencao(id);
    }
  };

  const intervencoesFiltradas = intervencoes.filter((i) => {
    if (filtroStatus !== 'TODOS' && i.status !== filtroStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-600" />
            <span>Intervenções Pedagógicas e Prevenção à Evasão Escolar</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro de ações ativas das professoras de referência da E.M. Ricardo Misson em tempo hábil para resgatar o estudante.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>{editingId ? 'Editar Intervenção' : 'Registrar Ação Pedagógica'}</span>
            </h3>
            {editingId && (
              <button onClick={handleCancelEdit} className="text-xs text-slate-500 hover:underline">
                Cancelar Edição
              </button>
            )}
          </div>

          {feedbackMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Student selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Aluno Alvo da Intervenção <span className="text-red-500">* (Obrigatório)</span>
              </label>
              <select
                required
                disabled={!!editingId}
                value={alunoId}
                onChange={(e) => setAlunoId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="" disabled>
                  Selecione o estudante...
                </option>
                {alunosCalculados.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} — {a.turmaNome} ({a.percentualPerda}% falta - {a.nivelRisco})
                  </option>
                ))}
              </select>
            </div>

            {/* Student context box */}
            {selectedAluno && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{selectedAluno.nome}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      selectedAluno.nivelRisco === 'CRITICO'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : selectedAluno.nivelRisco === 'ALTO'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : selectedAluno.nivelRisco === 'ATENCAO'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {selectedAluno.nivelRisco} ({selectedAluno.percentualPerda}%)
                  </span>
                </div>
                {selectedAluno.responsavelTelefone && (
                  <p className="text-slate-600">
                    Contato Responsável: <strong>{selectedAluno.responsavelTelefone}</strong> ({selectedAluno.responsavelNome})
                  </p>
                )}
                {onAbrirRelatorio && (
                  <button
                    type="button"
                    onClick={() => onAbrirRelatorio(selectedAluno)}
                    className="text-blue-600 hover:underline pt-0.5 block font-medium"
                  >
                    Abrir Ficha FICAI deste estudante &rarr;
                  </button>
                )}
              </div>
            )}

            {/* Date and Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data da Ação *
                </label>
                <input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status da Ação *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusIntervencao)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Concluída">Concluída</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </div>
            </div>

            {/* Tipo de Intervencao */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Tipo de Intervenção Pedagógica *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {TIPOS_INTERVENCAO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Responsável pela ação */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Professora de Referência / Responsável <span className="text-slate-400 text-[11px]">(Facultativo)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Profª. Maria Aparecida / Coordenação"
                value={responsavelAcao}
                onChange={(e) => setResponsavelAcao(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Descricao */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Descrição da Ação Realizada <span className="text-slate-400 text-[11px]">(Facultativo)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Descreva o contato, assunto tratado, orientações pedagógicas dadas..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Resultado / Compromissos */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Resultado / Acordo com a Família <span className="text-slate-400 text-[11px]">(Facultativo)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Mãe compareceu e assinou termo; aluno retornou às aulas; protocolo FICAI nº..."
                value={resultado}
                onChange={(e) => setResultado(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition shadow-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingId ? 'Salvar Alterações' : 'Gravar Intervenção'}</span>
            </button>
          </form>
        </div>

        {/* History and log of interventions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Ações Pedagógicas Registradas
              </h3>
              <p className="text-xs text-slate-500">
                {intervencoes.length} intervenções documentadas para prevenção à evasão
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1 bg-slate-50"
              >
                <option value="TODOS">Todos</option>
                <option value="Concluída">Concluídas</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Pendente">Pendentes</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto space-y-1">
            {intervencoesFiltradas.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Nenhuma ação pedagógica encontrada.
              </div>
            ) : (
              intervencoesFiltradas.map((interv) => {
                const aluno = alunosCalculados.find((a) => a.id === interv.alunoId);

                return (
                  <div
                    key={interv.id}
                    className="py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg transition"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {aluno?.nome || 'Aluno'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {aluno?.turmaNome}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            interv.status === 'Concluída'
                              ? 'bg-emerald-100 text-emerald-800'
                              : interv.status === 'Em Andamento'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {interv.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {interv.tipo}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(interv.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {interv.descricao && (
                        <p className="text-xs text-slate-700">
                          <strong>Descrição:</strong> {interv.descricao}
                        </p>
                      )}

                      {interv.resultado && (
                        <p className="text-xs text-emerald-900 bg-emerald-50/60 p-2 rounded border border-emerald-100">
                          <strong>Resultado/Encaminhamento:</strong> {interv.resultado}
                        </p>
                      )}

                      {interv.responsavelAcao && (
                        <p className="text-[11px] text-slate-400">
                          Responsável pela intervenção: <strong>{interv.responsavelAcao}</strong>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(interv)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                        title="Editar intervenção"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(interv.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                        title="Excluir intervenção"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
