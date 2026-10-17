import React, { useState } from 'react';
import {
  Stethoscope,
  PlusCircle,
  Calendar,
  Clock,
  Trash2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { AlunoCalculado } from '../types';

interface AtestadosMedicosProps {
  preselectedAlunoId?: string | null;
  onLimparPreselecao?: () => void;
}

export const AtestadosMedicos: React.FC<AtestadosMedicosProps> = ({
  preselectedAlunoId,
  onLimparPreselecao,
}) => {
  const {
    turmas,
    alunosCalculados,
    atestados,
    addAtestado,
    deleteAtestado,
  } = useSchool();

  const [alunoId, setAlunoId] = useState<string>(preselectedAlunoId || '');
  const [dataInicio, setDataInicio] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dataTermino, setDataTermino] = useState<string>(new Date().toISOString().split('T')[0]);
  const [diasAfastamento, setDiasAfastamento] = useState<number>(1);
  const [horasAbonadas, setHorasAbonadas] = useState<number>(4);
  const [cid, setCid] = useState<string>('');
  const [crm, setCrm] = useState<string>('');
  const [medicoNome, setMedicoNome] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (preselectedAlunoId) {
      setAlunoId(preselectedAlunoId);
    }
  }, [preselectedAlunoId]);

  // Update hours abonadas when days change
  const handleDiasChange = (dias: number) => {
    setDiasAfastamento(dias);
    setHorasAbonadas(dias * 4); // 4h/dia padrão escolar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoId) {
      alert('Selecione o aluno para registrar o atestado médico.');
      return;
    }
    const aluno = alunosCalculados.find((a) => a.id === alunoId);
    if (!aluno) return;

    try {
      await addAtestado({
        alunoId: aluno.id,
        turmaId: aluno.turmaId,
        dataInicio,
        dataTermino,
        diasAfastamento: Number(diasAfastamento) || 1,
        horasAbonadas: Number(horasAbonadas) || 4,
        cid: cid.trim() || undefined,
        crm: crm.trim() || undefined,
        medicoNome: medicoNome.trim() || undefined,
        motivo: motivo.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      });

      setFeedbackMsg(`Atestado médico registrado com sucesso para ${aluno.nome}! Abono de ${horasAbonadas}h computado.`);
      setCid('');
      setCrm('');
      setMedicoNome('');
      setMotivo('');
      setObservacoes('');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar atestado médico.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este atestado médico?')) {
      await deleteAtestado(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-indigo-600" />
            <span>Controle de Atestados Médicos e Abono de Carga Horária</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro comprobatório de saúde para abono pedagógico e proteção da trajetória escolar na E.M. Ricardo Misson.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Lançar Atestado Médico</span>
            </h3>
            {preselectedAlunoId && (
              <button onClick={onLimparPreselecao} className="text-[11px] text-blue-600 hover:underline">
                Limpar
              </button>
            )}
          </div>

          {feedbackMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Student selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Aluno <span className="text-red-500">* (Obrigatório)</span>
              </label>
              <select
                required
                value={alunoId}
                onChange={(e) => setAlunoId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="" disabled>
                  Selecione o estudante...
                </option>
                {alunosCalculados.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.turmaNome})
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Início *
                </label>
                <input
                  type="date"
                  required
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Término *
                </label>
                <input
                  type="date"
                  required
                  value={dataTermino}
                  onChange={(e) => setDataTermino(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Days and Abonated Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Dias de Afastamento <span className="text-slate-400 text-[11px]">(Facultativo)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={diasAfastamento}
                  onChange={(e) => handleDiasChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Horas Abonadas <span className="text-slate-400 text-[11px]">(Facultativo)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={horasAbonadas}
                  onChange={(e) => setHorasAbonadas(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            {/* CID and CRM */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Código CID <span className="text-slate-400 text-[11px]">(Facultativo)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: J45, A09..."
                  value={cid}
                  onChange={(e) => setCid(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  CRM do Médico <span className="text-slate-400 text-[11px]">(Facultativo)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: MG-12345"
                  value={crm}
                  onChange={(e) => setCrm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Medico Nome */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nome do Profissional de Saúde <span className="text-slate-400 text-[11px]">(Facultativo)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Dr. Fulano de Tal - Pediatra UPA"
                value={medicoNome}
                onChange={(e) => setMedicoNome(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Motivo / Diagnóstico Resumido <span className="text-slate-400 text-[11px]">(Facultativo)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Crise respiratória, cirurgia, recuperação pós-trauma..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Observações <span className="text-slate-400 text-[11px]">(Facultativo)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Anotações pedagógicas sobre reposição de avaliações..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition shadow-xs flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Gravar Atestado</span>
            </button>
          </form>
        </div>

        {/* List of medical certificates */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Atestados Médicos Cadastrados
              </h3>
              <p className="text-xs text-slate-500">
                Total de {atestados.length} atestados no sistema
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
            {atestados.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Nenhum atestado médico registrado.
              </div>
            ) : (
              atestados.map((atestado) => {
                const aluno = alunosCalculados.find((a) => a.id === atestado.alunoId);

                return (
                  <div
                    key={atestado.id}
                    className="py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {aluno?.nome || 'Aluno'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Abono: {atestado.horasAbonadas || 0} horas
                        </span>
                        {atestado.cid && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            CID: {atestado.cid}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Período: {new Date(atestado.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até{' '}
                          {new Date(atestado.dataTermino + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        {atestado.diasAfastamento && (
                          <span>({atestado.diasAfastamento} dias)</span>
                        )}
                      </div>

                      {atestado.medicoNome && (
                        <p className="text-xs text-slate-600">
                          <strong>Profissional:</strong> {atestado.medicoNome}{' '}
                          {atestado.crm && `(${atestado.crm})`}
                        </p>
                      )}

                      {atestado.motivo && (
                        <p className="text-xs text-slate-600">
                          <strong>Diagnóstico/Motivo:</strong> {atestado.motivo}
                        </p>
                      )}

                      {atestado.observacoes && (
                        <p className="text-[11px] text-slate-400 italic">
                          Obs: {atestado.observacoes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(atestado.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition"
                      title="Excluir atestado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
