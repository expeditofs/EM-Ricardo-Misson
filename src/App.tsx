import React, { useState } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Header } from './components/Header';
import { PainelRisco } from './components/PainelRisco';
import { GestaoTurmas } from './components/GestaoTurmas';
import { GestaoAlunos } from './components/GestaoAlunos';
import { FaltasAcumuladas } from './components/FaltasAcumuladas';
import { IntervencoesPedagogicas } from './components/IntervencoesPedagogicas';
import { RelatoriosFICAI } from './components/RelatoriosFICAI';
import { InstalacaoApp } from './components/InstalacaoApp';
import { ExportacaoModal } from './components/ExportacaoModal';
import { AlunoCalculado } from './types';

function MainApp() {
  const [activeTab, setActiveTab] = useState('painel');
  const [selectedAlunoForAction, setSelectedAlunoForAction] = useState<string | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Quick navigation handlers from Dashboard
  const handleAbrirFaltasAcumuladas = (aluno: AlunoCalculado) => {
    setSelectedAlunoForAction(aluno.id);
    setActiveTab('faltas-acumuladas');
  };

  const handleAbrirIntervencao = (aluno: AlunoCalculado) => {
    setSelectedAlunoForAction(aluno.id);
    setActiveTab('intervencoes');
  };

  const handleAbrirRelatorio = (aluno: AlunoCalculado) => {
    setSelectedAlunoForAction(aluno.id);
    setActiveTab('relatorios');
  };

  const handleNovaTurma = () => {
    setActiveTab('turmas');
  };

  const handleNovoAluno = () => {
    setActiveTab('alunos');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Institutional and Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'painel' && (
          <PainelRisco
            onAbrirFaltasAcumuladas={handleAbrirFaltasAcumuladas}
            onAbrirIntervencao={handleAbrirIntervencao}
            onAbrirRelatorio={handleAbrirRelatorio}
            onNovaTurma={handleNovaTurma}
            onNovoAluno={handleNovoAluno}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}

        {activeTab === 'faltas-acumuladas' && (
          <FaltasAcumuladas
            preselectedAlunoId={selectedAlunoForAction}
            onLimparPreselecao={() => setSelectedAlunoForAction(null)}
            onAbrirRelatorio={handleAbrirRelatorio}
          />
        )}

        {activeTab === 'intervencoes' && (
          <IntervencoesPedagogicas
            preselectedAlunoId={selectedAlunoForAction}
            onLimparPreselecao={() => setSelectedAlunoForAction(null)}
            onAbrirRelatorio={handleAbrirRelatorio}
          />
        )}

        {activeTab === 'turmas' && <GestaoTurmas />}

        {activeTab === 'alunos' && (
          <GestaoAlunos onAbrirRelatorio={handleAbrirRelatorio} />
        )}

        {activeTab === 'relatorios' && (
          <RelatoriosFICAI
            initialAlunoId={selectedAlunoForAction}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}
      </main>

      {/* Modal for CSV / Excel Exports to SEMED */}
      <ExportacaoModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Modal for Android / Windows Installation Guide */}
      <InstalacaoApp
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} E.M. Ricardo Misson • Prefeitura Municipal de Uberaba / SEMED
          </p>
          <p className="text-[11px] text-slate-400">
            Monitoramento preventivo em conformidade com a LDB 9.394/96 e ECA 8.069/90 (FICAI)
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SchoolProvider>
      <MainApp />
    </SchoolProvider>
  );
}
