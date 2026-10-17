import { Aluno, Turma, Falta, Atestado, Intervencao, AlunoCalculado, NivelRisco } from '../types';

export const PADRAO_CARGA_HORARIA_ANUAL = 800; // 800 horas anuais conforme LDB Lei 9.394/96

export function calcularEstatisticasAluno(
  aluno: Aluno,
  turma: Turma | undefined,
  faltas: Falta[],
  atestados: Atestado[],
  intervencoes: Intervencao[]
): AlunoCalculado {
  const cargaTotal = turma?.cargaHorariaTotal && turma.cargaHorariaTotal > 0
    ? turma.cargaHorariaTotal
    : PADRAO_CARGA_HORARIA_ANUAL;

  const faltasDoAluno = faltas.filter((f) => f.alunoId === aluno.id);
  const atestadosDoAluno = atestados.filter((a) => a.alunoId === aluno.id);
  const intervencoesDoAluno = intervencoes.filter((i) => i.alunoId === aluno.id);

  let totalHorasFaltas = 0;
  let totalHorasJustificadas = 0;

  if (aluno.totalFaltasAcumuladas !== undefined && aluno.totalFaltasAcumuladas !== null) {
    totalHorasFaltas = Math.max(0, Number(aluno.totalFaltasAcumuladas) || 0);
  } else {
    faltasDoAluno.forEach((f) => {
      const horas = Number(f.horasFalta) || 0;
      totalHorasFaltas += horas;
      if (f.justificada) {
        totalHorasJustificadas += horas;
      }
    });
  }

  let totalHorasAtestado = 0;
  if (aluno.totalAtestadosAcumulados !== undefined && aluno.totalAtestadosAcumulados !== null) {
    totalHorasAtestado = Math.max(0, Number(aluno.totalAtestadosAcumulados) || 0);
  } else {
    atestadosDoAluno.forEach((a) => {
      totalHorasAtestado += Number(a.horasAbonadas) || (Number(a.diasAfastamento || 0) * 4);
    });
  }

  // Perda efetiva para cômputo da infrequência não abonada
  // (Faltas injustificadas têm impacto direto no risco de evasão)
  const totalHorasEfetivasPerdidas = Math.max(0, totalHorasFaltas - totalHorasAtestado);
  const percentualPerda = cargaTotal > 0
    ? Math.min(100, Math.round((totalHorasEfetivasPerdidas / cargaTotal) * 1000) / 10)
    : 0;

  const percentualFrequencia = Math.max(0, Math.round((100 - percentualPerda) * 10) / 10);

  // Determinação do Nível de Risco de Evasão
  let nivelRisco: NivelRisco = 'BAIXO';
  if (percentualPerda >= 25) {
    nivelRisco = 'CRITICO';
  } else if (percentualPerda >= 20) {
    nivelRisco = 'ALTO';
  } else if (percentualPerda >= 10) {
    nivelRisco = 'ATENCAO';
  } else {
    nivelRisco = 'BAIXO';
  }

  // Faltas restantes até o limite de 25% (200 horas em 800h)
  const limiteHoras25 = cargaTotal * 0.25;
  const horasRestantesPara25 = Math.max(0, limiteHoras25 - totalHorasEfetivasPerdidas);
  const diasRestantesPara25 = Math.ceil(horasRestantesPara25 / 4); // Supondo 4h/dia

  // Última data de falta
  const datasFaltas = faltasDoAluno.map((f) => f.data).filter(Boolean).sort();
  const ultimaFalta = datasFaltas.length > 0 ? datasFaltas[datasFaltas.length - 1] : undefined;

  return {
    ...aluno,
    turmaNome: turma?.nome || 'Turma não atribuída',
    totalFaltasAcumuladas: aluno.totalFaltasAcumuladas !== undefined ? Number(aluno.totalFaltasAcumuladas) || 0 : totalHorasFaltas,
    totalAtestadosAcumulados: aluno.totalAtestadosAcumulados !== undefined ? Number(aluno.totalAtestadosAcumulados) || 0 : totalHorasAtestado,
    totalHorasLetivas: cargaTotal,
    totalHorasFaltas,
    totalHorasJustificadas,
    totalHorasAtestado,
    totalHorasEfetivasPerdidas,
    percentualPerda,
    percentualFrequencia,
    nivelRisco,
    quantidadeFaltas: aluno.totalFaltasAcumuladas !== undefined ? Number(aluno.totalFaltasAcumuladas) || 0 : faltasDoAluno.length,
    quantidadeAtestados: aluno.totalAtestadosAcumulados !== undefined ? Number(aluno.totalAtestadosAcumulados) || 0 : atestadosDoAluno.length,
    quantidadeIntervencoes: intervencoesDoAluno.length,
    ultimaFalta,
    diasLimiteRestantesPara25Porcento: diasRestantesPara25,
  };
}

export function getRiscoBadgeInfo(nivel: NivelRisco) {
  switch (nivel) {
    case 'CRITICO':
      return {
        label: 'Risco Crítico / Alerta FICAI',
        sublabel: 'Limite legal de 25% atingido ou superado',
        colorClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-200 dark:border-red-800',
        barColor: 'bg-red-600',
        iconName: 'AlertTriangle',
        acaoRecomendada: 'Encaminhamento urgente ao Conselho Tutelar e notificação formal da FICAI.',
      };
    case 'ALTO':
      return {
        label: 'Risco Alto',
        sublabel: 'Entre 20% e 24.9% de ausência',
        colorClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
        barColor: 'bg-amber-500',
        iconName: 'AlertCircle',
        acaoRecomendada: 'Busca ativa presencial e convocação urgente dos responsáveis na escola.',
      };
    case 'ATENCAO':
      return {
        label: 'Atenção',
        sublabel: 'Entre 10% e 19.9% de ausência',
        colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-200 dark:border-yellow-800',
        barColor: 'bg-yellow-500',
        iconName: 'Clock',
        acaoRecomendada: 'Contato telefônico/WhatsApp da professora de referência para apurar motivos.',
      };
    case 'BAIXO':
    default:
      return {
        label: 'Frequência Regular',
        sublabel: 'Abaixo de 10% de ausência',
        colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
        barColor: 'bg-emerald-500',
        iconName: 'CheckCircle2',
        acaoRecomendada: 'Manter acompanhamento de rotina em sala de aula.',
      };
  }
}

export const IDS_EXEMPLO = {
  turmas: ['turma-5a-2026', 'turma-7b-2026', 'turma-3c-2026'],
  alunos: ['aluno-01', 'aluno-02', 'aluno-03', 'aluno-04', 'aluno-05'],
  faltas: ['falta-01', 'falta-02', 'falta-03', 'falta-04', 'falta-05', 'falta-06', 'falta-07'],
  atestados: ['atestado-01'],
  intervencoes: ['interv-01', 'interv-02', 'interv-03'],
};

export const DADOS_EXEMPLO = {
  turmas: [] as Turma[],
  alunos: [] as Aluno[],
  faltas: [] as Falta[],
  atestados: [] as Atestado[],
  intervencoes: [] as Intervencao[],
};

/**
 * Retorna o peso numérico do turno para ordenar prioritariamente o turno Matutino,
 * seguido do turno Vespertino, e posteriormente os demais turnos.
 */
export function getPesoTurno(turno?: string): number {
  if (!turno) return 99;
  const t = turno.toLowerCase().trim();
  if (t.includes('mat') || t.includes('manh')) return 1; // 1º Turno Matutino
  if (t.includes('vesp') || t.includes('tard')) return 2; // 2º Turno Vespertino
  if (t.includes('integ')) return 3; // 3º Turno Integral
  if (t.includes('not')) return 4; // 4º Turno Noturno
  return 10; // Outros
}

/**
 * Ordena turmas garantindo que o turno Matutino venha primeiro,
 * seguido do turno Vespertino, e secundariamente ordenado alfabeticamente por nome.
 */
export function ordenarTurmasPorTurno(turmas: Turma[]): Turma[] {
  return [...turmas].sort((a, b) => {
    const pesoA = getPesoTurno(a.turno);
    const pesoB = getPesoTurno(b.turno);
    if (pesoA !== pesoB) {
      return pesoA - pesoB;
    }
    return a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' });
  });
}

