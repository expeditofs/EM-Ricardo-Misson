import { AlunoCalculado, Turma, Falta, Atestado, Intervencao } from '../types';
import { getPesoTurno, ordenarTurmasPorTurno } from './schoolCalculations';

export interface ExportFilterOptions {
  turmaId?: string;
  mes?: string; // '01', '02', etc., or 'TODOS'
  ano?: string;
  apenasCriticos?: boolean;
  separador?: ';' | ',';
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. Export Consolidado Alunos / SEMED
export function exportarConsolidadoAlunos(
  alunos: AlunoCalculado[],
  turmas: Turma[],
  options: ExportFilterOptions = {}
) {
  const sep = options.separador || ';';
  const dataHoje = new Date().toISOString().split('T')[0];

  let lista = [...alunos];
  if (options.turmaId && options.turmaId !== 'TODAS') {
    lista = lista.filter((a) => a.turmaId === options.turmaId);
  }
  if (options.apenasCriticos) {
    lista = lista.filter((a) => a.nivelRisco === 'CRITICO' || a.nivelRisco === 'ALTO');
  }

  // Ordenar prioritariamente por Turno Matutino, depois Vespertino, depois nome da turma e aluno
  lista.sort((a, b) => {
    const turmaA = turmas.find((t) => t.id === a.turmaId);
    const turmaB = turmas.find((t) => t.id === b.turmaId);
    const pesoA = getPesoTurno(turmaA?.turno);
    const pesoB = getPesoTurno(turmaB?.turno);
    if (pesoA !== pesoB) return pesoA - pesoB;
    const nomeTurmaA = turmaA?.nome || '';
    const nomeTurmaB = turmaB?.nome || '';
    const cmpTurma = nomeTurmaA.localeCompare(nomeTurmaB, 'pt-BR', { numeric: true });
    if (cmpTurma !== 0) return cmpTurma;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });

  const cabecalhos = [
    'Escola',
    'Município',
    'Turma',
    'Turno',
    'Nome do Estudante',
    'Matrícula',
    'Nome do Responsável',
    'Telefone / WhatsApp',
    'Carga Horária Total (Horas)',
    'Total Horas de Faltas',
    'Faltas Justificadas (Horas)',
    'Atestados Abonados (Horas)',
    'Perda Efetiva de Carga Horária (Horas)',
    '% Infrequência (Perda)',
    '% Frequência Escolar',
    'Classificação de Risco (LDB)',
    'Excedeu Limite Legal 25%',
    'Qtd Atestados',
    'Qtd Ações Pedagógicas / FICAI',
    'Última Ausência',
  ];

  const linhas = lista.map((aluno) => {
    const turma = turmas.find((t) => t.id === aluno.turmaId);
    return [
      'E.M. Ricardo Misson',
      'Uberaba - MG',
      `"${aluno.turmaNome}"`,
      `"${turma?.turno || 'Não informado'}"`,
      `"${aluno.nome}"`,
      `"${aluno.matricula || ''}"`,
      `"${aluno.responsavelNome || ''}"`,
      `"${aluno.responsavelTelefone || ''}"`,
      aluno.totalHorasLetivas,
      aluno.totalHorasFaltas,
      aluno.totalHorasJustificadas,
      aluno.totalHorasAtestado,
      aluno.totalHorasEfetivasPerdidas,
      `${aluno.percentualPerda}%`.replace('.', ','),
      `${aluno.percentualFrequencia}%`.replace('.', ','),
      `"${aluno.nivelRisco}"`,
      aluno.percentualPerda >= 25 ? 'SIM (Encaminhar FICAI)' : 'NÃO',
      aluno.quantidadeAtestados,
      aluno.quantidadeIntervencoes,
      aluno.ultimaFalta
        ? new Date(aluno.ultimaFalta + 'T00:00:00').toLocaleDateString('pt-BR')
        : 'Nenhuma',
    ].join(sep);
  });

  const csvContent = '\uFEFF' + [cabecalhos.join(sep), ...linhas].join('\r\n');
  const filename = `SEMED_Consolidado_Infrequencia_Ricardo_Misson_${dataHoje}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

// 2. Export Detalhamento Faltas (Dia a dia)
export function exportarDetalhamentoFaltas(
  faltas: Falta[],
  alunos: AlunoCalculado[],
  turmas: Turma[],
  options: ExportFilterOptions = {}
) {
  const sep = options.separador || ';';
  const dataHoje = new Date().toISOString().split('T')[0];

  let lista = [...faltas];
  if (options.turmaId && options.turmaId !== 'TODAS') {
    lista = lista.filter((f) => f.turmaId === options.turmaId);
  }
  if (options.mes && options.mes !== 'TODOS') {
    lista = lista.filter((f) => {
      const mesFalta = f.data.split('-')[1];
      return mesFalta === options.mes;
    });
  }

  // Ordenar por data decrescente
  lista.sort((a, b) => b.data.localeCompare(a.data));

  const cabecalhos = [
    'Data da Falta',
    'Escola',
    'Turma',
    'Nome do Estudante',
    'Matrícula',
    'Horas de Ausência',
    'Status Falta',
    'Motivo Declarado',
    'Registrado Por',
    'Observações',
    'Telefone do Responsável',
  ];

  const linhas = lista.map((f) => {
    const aluno = alunos.find((a) => a.id === f.alunoId);
    const turma = turmas.find((t) => t.id === f.turmaId);

    return [
      new Date(f.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      'E.M. Ricardo Misson',
      `"${turma?.nome || aluno?.turmaNome || ''}"`,
      `"${aluno?.nome || 'Aluno'}"`,
      `"${aluno?.matricula || ''}"`,
      f.horasFalta,
      f.justificada ? 'Justificada' : 'Injustificada',
      `"${f.motivo || ''}"`,
      `"${f.registradoPor || ''}"`,
      `"${f.observacoes || ''}"`,
      `"${aluno?.responsavelTelefone || ''}"`,
    ].join(sep);
  });

  const csvContent = '\uFEFF' + [cabecalhos.join(sep), ...linhas].join('\r\n');
  const filename = `SEMED_Registro_Faltas_Ricardo_Misson_${dataHoje}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

// 3. Export Atestados Médicos
export function exportarAtestadosMedicos(
  atestados: Atestado[],
  alunos: AlunoCalculado[],
  turmas: Turma[],
  options: ExportFilterOptions = {}
) {
  const sep = options.separador || ';';
  const dataHoje = new Date().toISOString().split('T')[0];

  let lista = [...atestados];
  if (options.turmaId && options.turmaId !== 'TODAS') {
    lista = lista.filter((at) => at.turmaId === options.turmaId);
  }

  const cabecalhos = [
    'Estudante',
    'Turma',
    'Data Início',
    'Data Término',
    'Dias Afastamento',
    'Horas Abonadas',
    'Código CID-10',
    'CRM Médico',
    'Nome do Médico',
    'Motivo / Diagnóstico',
    'Observações',
  ];

  const linhas = lista.map((at) => {
    const aluno = alunos.find((a) => a.id === at.alunoId);
    const turma = turmas.find((t) => t.id === at.turmaId);

    return [
      `"${aluno?.nome || ''}"`,
      `"${turma?.nome || ''}"`,
      new Date(at.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR'),
      new Date(at.dataTermino + 'T00:00:00').toLocaleDateString('pt-BR'),
      at.diasAfastamento || 1,
      at.horasAbonadas || 0,
      `"${at.cid || ''}"`,
      `"${at.crm || ''}"`,
      `"${at.medicoNome || ''}"`,
      `"${at.motivo || ''}"`,
      `"${at.observacoes || ''}"`,
    ].join(sep);
  });

  const csvContent = '\uFEFF' + [cabecalhos.join(sep), ...linhas].join('\r\n');
  const filename = `SEMED_Atestados_Medicos_Ricardo_Misson_${dataHoje}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

// 4. Export Intervenções Pedagógicas (Busca Ativa / Ações das Professoras)
export function exportarIntervencoesPedagogicas(
  intervencoes: Intervencao[],
  alunos: AlunoCalculado[],
  turmas: Turma[],
  options: ExportFilterOptions = {}
) {
  const sep = options.separador || ';';
  const dataHoje = new Date().toISOString().split('T')[0];

  let lista = [...intervencoes];
  if (options.turmaId && options.turmaId !== 'TODAS') {
    lista = lista.filter((i) => i.turmaId === options.turmaId);
  }

  lista.sort((a, b) => b.data.localeCompare(a.data));

  const cabecalhos = [
    'Data da Intervenção',
    'Estudante',
    'Turma',
    'Risco do Estudante',
    '% Faltas',
    'Tipo de Intervenção',
    'Status da Ação',
    'Professora de Referência / Responsável',
    'Descrição da Ação Pedagógica',
    'Resultado / Compromisso com a Família',
  ];

  const linhas = lista.map((i) => {
    const aluno = alunos.find((a) => a.id === i.alunoId);
    const turma = turmas.find((t) => t.id === i.turmaId);

    return [
      new Date(i.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      `"${aluno?.nome || ''}"`,
      `"${turma?.nome || ''}"`,
      `"${aluno?.nivelRisco || ''}"`,
      `${aluno?.percentualPerda || 0}%`.replace('.', ','),
      `"${i.tipo}"`,
      `"${i.status || 'Concluída'}"`,
      `"${i.responsavelAcao || ''}"`,
      `"${i.descricao || ''}"`,
      `"${i.resultado || ''}"`,
    ].join(sep);
  });

  const csvContent = '\uFEFF' + [cabecalhos.join(sep), ...linhas].join('\r\n');
  const filename = `SEMED_Intervencoes_Pedagogicas_Ricardo_Misson_${dataHoje}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

// 5. Export Resumo Estatístico Sintético por Turma para Reunião da SEMED
export function exportarEstatisticoPorTurma(
  turmas: Turma[],
  alunos: AlunoCalculado[],
  options: ExportFilterOptions = {}
) {
  const sep = options.separador || ';';
  const dataHoje = new Date().toISOString().split('T')[0];

  const cabecalhos = [
    'Turma',
    'Turno',
    'Ano Letivo',
    'Professora de Referência',
    'Total de Alunos',
    'Média Frequência Turma (%)',
    'Alunos Risco Crítico ≥25% (Alerta FICAI)',
    'Alunos Risco Alto 20-24.9%',
    'Alunos em Atenção 10-19.9%',
    'Alunos Regulares <10%',
    'Total Horas de Faltas Acumuladas',
    'Total Horas Abonadas por Atestado',
    'Total Ações de Busca Ativa / Intervenções',
  ];

  const turmasOrdenadas = ordenarTurmasPorTurno(turmas);
  const linhas = turmasOrdenadas.map((turma) => {
    const alunosDaTurma = alunos.filter((a) => a.turmaId === turma.id);
    const total = alunosDaTurma.length;

    const criticos = alunosDaTurma.filter((a) => a.nivelRisco === 'CRITICO').length;
    const altos = alunosDaTurma.filter((a) => a.nivelRisco === 'ALTO').length;
    const atencoes = alunosDaTurma.filter((a) => a.nivelRisco === 'ATENCAO').length;
    const regulares = alunosDaTurma.filter((a) => a.nivelRisco === 'BAIXO').length;

    const somaFreq = alunosDaTurma.reduce((acc, a) => acc + a.percentualFrequencia, 0);
    const mediaFreq = total > 0 ? (somaFreq / total).toFixed(1).replace('.', ',') : '100,0';

    const totalFaltasHoras = alunosDaTurma.reduce((acc, a) => acc + a.totalHorasFaltas, 0);
    const totalAtestadoHoras = alunosDaTurma.reduce((acc, a) => acc + a.totalHorasAtestado, 0);
    const totalIntervencoes = alunosDaTurma.reduce((acc, a) => acc + a.quantidadeIntervencoes, 0);

    return [
      `"${turma.nome}"`,
      `"${turma.turno || 'Não informado'}"`,
      `"${turma.anoLetivo || '2026'}"`,
      `"${turma.professorReferencia || 'Não informada'}"`,
      total,
      `${mediaFreq}%`,
      criticos,
      altos,
      atencoes,
      regulares,
      totalFaltasHoras,
      totalAtestadoHoras,
      totalIntervencoes,
    ].join(sep);
  });

  const csvContent = '\uFEFF' + [cabecalhos.join(sep), ...linhas].join('\r\n');
  const filename = `SEMED_Resumo_Turmas_Ricardo_Misson_${dataHoje}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}
