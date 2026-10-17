export interface Turma {
  id: string;
  nome: string; // Obrigatório
  turno?: string; // Facultativo
  anoLetivo?: string; // Facultativo
  sala?: string; // Facultativo
  cargaHorariaTotal?: number; // Facultativo (padrão 800 horas letivas)
  professorReferencia?: string; // Facultativo
  observacoes?: string; // Facultativo
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Aluno {
  id: string;
  turmaId: string; // ID da turma
  nome: string; // Obrigatório
  matricula?: string; // Facultativo
  dataNascimento?: string; // Facultativo
  responsavelNome?: string; // Facultativo
  responsavelTelefone?: string; // Facultativo
  responsavelEmail?: string; // Facultativo
  endereco?: string; // Facultativo
  observacoes?: string; // Facultativo
  ativo?: boolean; // Facultativo (padrão true)
  totalFaltasAcumuladas?: number; // Total de Faltas Acumuladas
  totalAtestadosAcumulados?: number; // Total de Atestados Acumulados
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Falta {
  id: string;
  alunoId: string;
  turmaId: string;
  data: string; // YYYY-MM-DD
  horasFalta: number; // Quantidade de horas letivas da ausência
  motivo?: string; // Facultativo
  justificada?: boolean; // Facultativo
  observacoes?: string; // Facultativo
  registradoPor?: string; // Facultativo
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Atestado {
  id: string;
  alunoId: string;
  turmaId: string;
  dataInicio: string; // YYYY-MM-DD
  dataTermino: string; // YYYY-MM-DD
  diasAfastamento?: number; // Facultativo
  horasAbonadas?: number; // Facultativo
  cid?: string; // Facultativo
  crm?: string; // Facultativo
  medicoNome?: string; // Facultativo
  motivo?: string; // Facultativo
  observacoes?: string; // Facultativo
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export type TipoIntervencao =
  | 'Contato telefônico com responsável'
  | 'Mensagem WhatsApp / Notificação'
  | 'Reunião pedagógica presencial'
  | 'Busca ativa escolar / Visita domiciliar'
  | 'Encaminhamento à Orientação Educacional'
  | 'Encaminhamento ao CRAS / Rede Socioassistencial'
  | 'Notificação formal FICAI / Conselho Tutelar'
  | 'Plano individual de reposição de aprendizagem'
  | 'Outra intervenção pedagógica';

export type StatusIntervencao = 'Pendente' | 'Em Andamento' | 'Concluída' | 'Cancelada';

export interface Intervencao {
  id: string;
  alunoId: string;
  turmaId: string;
  data: string; // YYYY-MM-DD
  tipo: TipoIntervencao | string;
  descricao?: string; // Facultativo
  responsavelAcao?: string; // Facultativo
  status?: StatusIntervencao | string; // Facultativo
  resultado?: string; // Facultativo
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export type NivelRisco = 'BAIXO' | 'ATENCAO' | 'ALTO' | 'CRITICO';

export interface AlunoCalculado extends Aluno {
  turmaNome: string;
  totalFaltasAcumuladas: number;
  totalAtestadosAcumulados: number;
  totalHorasLetivas: number;
  totalHorasFaltas: number;
  totalHorasJustificadas: number;
  totalHorasAtestado: number;
  totalHorasEfetivasPerdidas: number;
  percentualPerda: number;
  percentualFrequencia: number;
  nivelRisco: NivelRisco;
  quantidadeFaltas: number;
  quantidadeAtestados: number;
  quantidadeIntervencoes: number;
  ultimaFalta?: string;
  diasLimiteRestantesPara25Porcento: number;
}
