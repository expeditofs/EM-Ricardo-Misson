import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  db,
  auth,
  signInWithPopup,
  signOut,
  googleProvider,
  handleFirestoreError,
  OperationType,
  User,
} from '../lib/firebase';
import {
  Turma,
  Aluno,
  Falta,
  Atestado,
  Intervencao,
  AlunoCalculado,
  NivelRisco,
} from '../types';
import {
  calcularEstatisticasAluno,
  DADOS_EXEMPLO,
  IDS_EXEMPLO,
  ordenarTurmasPorTurno,
} from '../lib/schoolCalculations';

interface SchoolContextType {
  user: User | null;
  authLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isSyncing: boolean;
  syncError: string | null;

  // Data
  turmas: Turma[];
  alunos: Aluno[];
  faltas: Falta[];
  atestados: Atestado[];
  intervencoes: Intervencao[];
  alunosCalculados: AlunoCalculado[];

  // Filters
  selectedTurmaId: string;
  setSelectedTurmaId: (id: string) => void;
  selectedRisco: 'TODOS' | NivelRisco;
  setSelectedRisco: (risco: 'TODOS' | NivelRisco) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Modals and Active items
  activeAlunoId: string | null;
  setActiveAlunoId: (id: string | null) => void;
  activeAlunoCalculado: AlunoCalculado | null;

  // Actions
  addTurma: (turma: Omit<Turma, 'id'>) => Promise<string>;
  updateTurma: (id: string, turma: Partial<Turma>) => Promise<void>;
  deleteTurma: (id: string) => Promise<void>;

  addAluno: (aluno: Omit<Aluno, 'id'>) => Promise<string>;
  updateAluno: (id: string, aluno: Partial<Aluno>) => Promise<void>;
  atualizarFaltasAtestadosAcumulados: (
    alunoId: string,
    totalFaltasAcumuladas: number,
    totalAtestadosAcumulados: number
  ) => Promise<void>;
  deleteAluno: (id: string) => Promise<void>;

  addFalta: (falta: Omit<Falta, 'id'>) => Promise<string>;
  deleteFalta: (id: string) => Promise<void>;

  addAtestado: (atestado: Omit<Atestado, 'id'>) => Promise<string>;
  deleteAtestado: (id: string) => Promise<void>;

  addIntervencao: (intervencao: Omit<Intervencao, 'id'>) => Promise<string>;
  updateIntervencao: (id: string, intervencao: Partial<Intervencao>) => Promise<void>;
  deleteIntervencao: (id: string) => Promise<void>;

  limparDadosExemplo: () => Promise<void>;
  limparTodosOsDados: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | null>(null);

const STORAGE_KEYS = {
  TURMAS: 'em_ricardo_misson_turmas_v1',
  ALUNOS: 'em_ricardo_misson_alunos_v1',
  FALTAS: 'em_ricardo_misson_faltas_v1',
  ATESTADOS: 'em_ricardo_misson_atestados_v1',
  INTERVENCOES: 'em_ricardo_misson_intervencoes_v1',
};

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Core state with local storage fallback for immediate offline/pwa access
  const [turmas, setTurmas] = useState<Turma[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TURMAS);
      if (!saved) return [];
      const parsed: Turma[] = JSON.parse(saved);
      return ordenarTurmasPorTurno(parsed.filter((t) => !IDS_EXEMPLO.turmas.includes(t.id)));
    } catch {
      return [];
    }
  });

  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALUNOS);
      if (!saved) return [];
      const parsed: Aluno[] = JSON.parse(saved);
      return parsed.filter((a) => !IDS_EXEMPLO.alunos.includes(a.id));
    } catch {
      return [];
    }
  });

  const [faltas, setFaltas] = useState<Falta[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FALTAS);
      if (!saved) return [];
      const parsed: Falta[] = JSON.parse(saved);
      return parsed.filter((f) => !IDS_EXEMPLO.faltas.includes(f.id));
    } catch {
      return [];
    }
  });

  const [atestados, setAtestados] = useState<Atestado[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATESTADOS);
      if (!saved) return [];
      const parsed: Atestado[] = JSON.parse(saved);
      return parsed.filter((at) => !IDS_EXEMPLO.atestados.includes(at.id));
    } catch {
      return [];
    }
  });

  const [intervencoes, setIntervencoes] = useState<Intervencao[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTERVENCOES);
      if (!saved) return [];
      const parsed: Intervencao[] = JSON.parse(saved);
      return parsed.filter((i) => !IDS_EXEMPLO.intervencoes.includes(i.id));
    } catch {
      return [];
    }
  });

  // UI Filters
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('TODAS');
  const [selectedRisco, setSelectedRisco] = useState<'TODOS' | NivelRisco>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAlunoId, setActiveAlunoId] = useState<string | null>(null);

  // Sync state to local storage for multi-device offline resilience
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TURMAS, JSON.stringify(turmas));
  }, [turmas]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALUNOS, JSON.stringify(alunos));
  }, [alunos]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FALTAS, JSON.stringify(faltas));
  }, [faltas]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATESTADOS, JSON.stringify(atestados));
  }, [atestados]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INTERVENCOES, JSON.stringify(intervencoes));
  }, [intervencoes]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync when authenticated
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    setSyncError(null);

    const unsubTurmas = onSnapshot(
      collection(db, 'turmas'),
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Turma))
          .filter((t) => !IDS_EXEMPLO.turmas.includes(t.id));
        setTurmas(ordenarTurmasPorTurno(items));
        setIsSyncing(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'turmas');
      }
    );

    const unsubAlunos = onSnapshot(
      collection(db, 'alunos'),
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Aluno))
          .filter((a) => !IDS_EXEMPLO.alunos.includes(a.id));
        setAlunos(items);
        setIsSyncing(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'alunos');
      }
    );

    const unsubFaltas = onSnapshot(
      collection(db, 'faltas'),
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Falta))
          .filter((f) => !IDS_EXEMPLO.faltas.includes(f.id));
        setFaltas(items);
        setIsSyncing(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'faltas');
      }
    );

    const unsubAtestados = onSnapshot(
      collection(db, 'atestados'),
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Atestado))
          .filter((at) => !IDS_EXEMPLO.atestados.includes(at.id));
        setAtestados(items);
        setIsSyncing(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'atestados');
      }
    );

    const unsubIntervencoes = onSnapshot(
      collection(db, 'intervencoes'),
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Intervencao))
          .filter((i) => !IDS_EXEMPLO.intervencoes.includes(i.id));
        setIntervencoes(items);
        setIsSyncing(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'intervencoes');
      }
    );

    // Auto-clean example IDs from Firestore when connected
    for (const id of IDS_EXEMPLO.turmas) deleteDoc(doc(db, 'turmas', id)).catch(() => {});
    for (const id of IDS_EXEMPLO.alunos) deleteDoc(doc(db, 'alunos', id)).catch(() => {});
    for (const id of IDS_EXEMPLO.faltas) deleteDoc(doc(db, 'faltas', id)).catch(() => {});
    for (const id of IDS_EXEMPLO.atestados) deleteDoc(doc(db, 'atestados', id)).catch(() => {});
    for (const id of IDS_EXEMPLO.intervencoes) deleteDoc(doc(db, 'intervencoes', id)).catch(() => {});

    return () => {
      unsubTurmas();
      unsubAlunos();
      unsubFaltas();
      unsubAtestados();
      unsubIntervencoes();
    };
  }, [user]);

  // Clean local state and localStorage on mount
  useEffect(() => {
    setTurmas((prev) => ordenarTurmasPorTurno(prev.filter((t) => !IDS_EXEMPLO.turmas.includes(t.id))));
    setAlunos((prev) => prev.filter((a) => !IDS_EXEMPLO.alunos.includes(a.id)));
    setFaltas((prev) => prev.filter((f) => !IDS_EXEMPLO.faltas.includes(f.id)));
    setAtestados((prev) => prev.filter((at) => !IDS_EXEMPLO.atestados.includes(at.id)));
    setIntervencoes((prev) => prev.filter((i) => !IDS_EXEMPLO.intervencoes.includes(i.id)));
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google Sign-in failed', err);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Excluir todos os dados de exemplo (tanto local quanto em nuvem)
  const limparDadosExemplo = async () => {
    setIsSyncing(true);
    try {
      // Local state clean
      setTurmas((prev) => prev.filter((t) => !IDS_EXEMPLO.turmas.includes(t.id)));
      setAlunos((prev) => prev.filter((a) => !IDS_EXEMPLO.alunos.includes(a.id)));
      setFaltas((prev) => prev.filter((f) => !IDS_EXEMPLO.faltas.includes(f.id)));
      setAtestados((prev) => prev.filter((at) => !IDS_EXEMPLO.atestados.includes(at.id)));
      setIntervencoes((prev) => prev.filter((i) => !IDS_EXEMPLO.intervencoes.includes(i.id)));

      // Cloud clean if user is authenticated
      if (user) {
        for (const id of IDS_EXEMPLO.turmas) await deleteDoc(doc(db, 'turmas', id)).catch(() => {});
        for (const id of IDS_EXEMPLO.alunos) await deleteDoc(doc(db, 'alunos', id)).catch(() => {});
        for (const id of IDS_EXEMPLO.faltas) await deleteDoc(doc(db, 'faltas', id)).catch(() => {});
        for (const id of IDS_EXEMPLO.atestados) await deleteDoc(doc(db, 'atestados', id)).catch(() => {});
        for (const id of IDS_EXEMPLO.intervencoes) await deleteDoc(doc(db, 'intervencoes', id)).catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao excluir dados de exemplo', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Limpar todos os dados do sistema para iniciar do zero
  const limparTodosOsDados = async () => {
    setIsSyncing(true);
    try {
      if (user) {
        for (const t of turmas) await deleteDoc(doc(db, 'turmas', t.id)).catch(() => {});
        for (const a of alunos) await deleteDoc(doc(db, 'alunos', a.id)).catch(() => {});
        for (const f of faltas) await deleteDoc(doc(db, 'faltas', f.id)).catch(() => {});
        for (const at of atestados) await deleteDoc(doc(db, 'atestados', at.id)).catch(() => {});
        for (const i of intervencoes) await deleteDoc(doc(db, 'intervencoes', i.id)).catch(() => {});
      }
      setTurmas([]);
      setAlunos([]);
      setFaltas([]);
      setAtestados([]);
      setIntervencoes([]);
      localStorage.removeItem(STORAGE_KEYS.TURMAS);
      localStorage.removeItem(STORAGE_KEYS.ALUNOS);
      localStorage.removeItem(STORAGE_KEYS.FALTAS);
      localStorage.removeItem(STORAGE_KEYS.ATESTADOS);
      localStorage.removeItem(STORAGE_KEYS.INTERVENCOES);
    } catch (err) {
      console.error('Erro ao limpar dados', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Turmas sempre organizadas com Matutino primeiramente e Vespertino depois
  const turmasOrdenadas = useMemo(() => {
    return ordenarTurmasPorTurno(turmas);
  }, [turmas]);

  // Calculated Students with Risk Indicators
  const alunosCalculados = useMemo(() => {
    return alunos.map((aluno) => {
      const turma = turmasOrdenadas.find((t) => t.id === aluno.turmaId);
      return calcularEstatisticasAluno(aluno, turma, faltas, atestados, intervencoes);
    });
  }, [alunos, turmasOrdenadas, faltas, atestados, intervencoes]);

  const activeAlunoCalculado = useMemo(() => {
    if (!activeAlunoId) return null;
    return alunosCalculados.find((a) => a.id === activeAlunoId) || null;
  }, [activeAlunoId, alunosCalculados]);

  // Helper to remove undefined properties before writing to Firestore
  const cleanUndefined = <T extends Record<string, any>>(obj: T): T => {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    }
    return cleaned as T;
  };

  // CRUD Actions
  const addTurma = async (turmaData: Omit<Turma, 'id'>): Promise<string> => {
    const id = `turma-${Date.now()}`;
    const newTurma: Turma = {
      ...turmaData,
      id,
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || 'offline-user',
    };

    if (user) {
      try {
        await setDoc(doc(db, 'turmas', id), cleanUndefined(newTurma));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `turmas/${id}`);
      }
    } else {
      setTurmas((prev) => [...prev, newTurma]);
    }
    return id;
  };

  const updateTurma = async (id: string, turmaData: Partial<Turma>) => {
    if (user) {
      try {
        await updateDoc(
          doc(db, 'turmas', id),
          cleanUndefined({
            ...turmaData,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `turmas/${id}`);
      }
    } else {
      setTurmas((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...turmaData, updatedAt: new Date().toISOString() } : t))
      );
    }
  };

  const deleteTurma = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'turmas', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `turmas/${id}`);
      }
    } else {
      setTurmas((prev) => prev.filter((t) => t.id !== id));
      setAlunos((prev) => prev.filter((a) => a.turmaId !== id));
    }
  };

  const addAluno = async (alunoData: Omit<Aluno, 'id'>): Promise<string> => {
    const id = `aluno-${Date.now()}`;
    const newAluno: Aluno = {
      ...alunoData,
      id,
      ativo: alunoData.ativo !== false,
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || 'offline-user',
    };

    if (user) {
      try {
        await setDoc(doc(db, 'alunos', id), cleanUndefined(newAluno));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `alunos/${id}`);
      }
    } else {
      setAlunos((prev) => [...prev, newAluno]);
    }
    return id;
  };

  const updateAluno = async (id: string, alunoData: Partial<Aluno>) => {
    if (user) {
      try {
        await updateDoc(
          doc(db, 'alunos', id),
          cleanUndefined({
            ...alunoData,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `alunos/${id}`);
      }
    } else {
      setAlunos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...alunoData, updatedAt: new Date().toISOString() } : a))
      );
    }
  };

  const atualizarFaltasAtestadosAcumulados = async (
    alunoId: string,
    totalFaltasAcumuladas: number,
    totalAtestadosAcumulados: number
  ) => {
    const faltasNorm = Math.max(0, Number(totalFaltasAcumuladas) || 0);
    const atestadosNorm = Math.max(0, Number(totalAtestadosAcumulados) || 0);
    await updateAluno(alunoId, {
      totalFaltasAcumuladas: faltasNorm,
      totalAtestadosAcumulados: atestadosNorm,
    });
  };

  const deleteAluno = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'alunos', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `alunos/${id}`);
      }
    } else {
      setAlunos((prev) => prev.filter((a) => a.id !== id));
      setFaltas((prev) => prev.filter((f) => f.alunoId !== id));
      setAtestados((prev) => prev.filter((at) => at.alunoId !== id));
      setIntervencoes((prev) => prev.filter((i) => i.alunoId !== id));
    }
    if (activeAlunoId === id) setActiveAlunoId(null);
  };

  const addFalta = async (faltaData: Omit<Falta, 'id'>): Promise<string> => {
    const id = `falta-${Date.now()}`;
    const newFalta: Falta = {
      ...faltaData,
      id,
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || 'offline-user',
    };

    if (user) {
      try {
        await setDoc(doc(db, 'faltas', id), cleanUndefined(newFalta));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `faltas/${id}`);
      }
    } else {
      setFaltas((prev) => [newFalta, ...prev]);
    }
    return id;
  };

  const deleteFalta = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'faltas', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `faltas/${id}`);
      }
    } else {
      setFaltas((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const addAtestado = async (atestadoData: Omit<Atestado, 'id'>): Promise<string> => {
    const id = `atestado-${Date.now()}`;
    const newAtestado: Atestado = {
      ...atestadoData,
      id,
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || 'offline-user',
    };

    if (user) {
      try {
        await setDoc(doc(db, 'atestados', id), cleanUndefined(newAtestado));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `atestados/${id}`);
      }
    } else {
      setAtestados((prev) => [newAtestado, ...prev]);
    }
    return id;
  };

  const deleteAtestado = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'atestados', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `atestados/${id}`);
      }
    } else {
      setAtestados((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const addIntervencao = async (intervencaoData: Omit<Intervencao, 'id'>): Promise<string> => {
    const id = `interv-${Date.now()}`;
    const newIntervencao: Intervencao = {
      ...intervencaoData,
      id,
      status: intervencaoData.status || 'Concluída',
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || 'offline-user',
    };

    if (user) {
      try {
        await setDoc(doc(db, 'intervencoes', id), cleanUndefined(newIntervencao));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `intervencoes/${id}`);
      }
    } else {
      setIntervencoes((prev) => [newIntervencao, ...prev]);
    }
    return id;
  };

  const updateIntervencao = async (id: string, intervencaoData: Partial<Intervencao>) => {
    if (user) {
      try {
        await updateDoc(
          doc(db, 'intervencoes', id),
          cleanUndefined({
            ...intervencaoData,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `intervencoes/${id}`);
      }
    } else {
      setIntervencoes((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...intervencaoData, updatedAt: new Date().toISOString() } : i))
      );
    }
  };

  const deleteIntervencao = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'intervencoes', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `intervencoes/${id}`);
      }
    } else {
      setIntervencoes((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <SchoolContext.Provider
      value={{
        user,
        authLoading,
        loginWithGoogle,
        logout,
        isSyncing,
        syncError,
        turmas: turmasOrdenadas,
        alunos,
        faltas,
        atestados,
        intervencoes,
        alunosCalculados,
        selectedTurmaId,
        setSelectedTurmaId,
        selectedRisco,
        setSelectedRisco,
        searchQuery,
        setSearchQuery,
        activeAlunoId,
        setActiveAlunoId,
        activeAlunoCalculado,
        addTurma,
        updateTurma,
        deleteTurma,
        addAluno,
        updateAluno,
        atualizarFaltasAtestadosAcumulados,
        deleteAluno,
        addFalta,
        deleteFalta,
        addAtestado,
        deleteAtestado,
        addIntervencao,
        updateIntervencao,
        deleteIntervencao,
        limparDadosExemplo,
        limparTodosOsDados,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
