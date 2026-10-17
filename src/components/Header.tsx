import React, { useState } from 'react';
import {
  GraduationCap,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  Smartphone,
  Monitor,
  Sparkles,
  Info,
  FileSpreadsheet,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenInstallModal: () => void;
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenInstallModal,
  onOpenExportModal,
}) => {
  const {
    user,
    authLoading,
    loginWithGoogle,
    logout,
    isSyncing,
    alunosCalculados,
  } = useSchool();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const totalCriticos = alunosCalculados.filter((a) => a.nivelRisco === 'CRITICO').length;

  const navItems = [
    { id: 'painel', label: 'Painel de Risco', badge: totalCriticos > 0 ? totalCriticos : null },
    { id: 'faltas-acumuladas', label: 'Faltas e Atestados Acumulados' },
    { id: 'intervencoes', label: 'Intervenções Pedagógicas' },
    { id: 'turmas', label: 'Turmas' },
    { id: 'alunos', label: 'Alunos' },
    { id: 'relatorios', label: 'Relatórios & FICAI' },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 print:hidden">
      {/* Top institution bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-1.5 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-400">PREFEITURA MUNICIPAL DE UBERABA</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline text-slate-400">Secretaria Municipal de Educação (SEMED)</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* Real-time synchronization status */}
          <div className="flex items-center gap-1.5" title="Sincronização em nuvem ativa para múltiplos dispositivos">
            {isSyncing ? (
              <span className="flex items-center gap-1 text-cyan-400 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sincronizando...</span>
              </span>
            ) : user ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tempo Real Ativo</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <CloudOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modo Local (PWA)</span>
              </span>
            )}
          </div>

          {/* Android & Windows Desktop badge */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition text-[11px]"
            title="Como usar no Android ou Windows Desktop"
          >
            <Smartphone className="w-3 h-3 text-cyan-400" />
            <Monitor className="w-3 h-3 text-emerald-400" />
            <span className="hidden md:inline">Android / Windows</span>
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-900/50 flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              E.M. Ricardo Misson
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Uberaba / MG
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Gestão de Infrequência e Intervenções Preventivas contra Evasão
            </p>
          </div>
        </div>

        {/* User Auth & Actions */}
        <div className="flex items-center gap-2">
          {/* SEMED / Excel Export Button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white font-medium transition border border-emerald-500/50 shadow-xs"
            title="Exportar relatórios em formato CSV ou Excel para a SEMED e análises da coordenação"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">Exportar Planilhas (SEMED)</span>
            <span className="sm:hidden">Exportar</span>
          </button>

          {authLoading ? (
            <div className="w-24 h-8 bg-slate-800 animate-pulse rounded-lg" />
          ) : user ? (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 py-1 px-2 rounded-lg">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuário'}
                  className="w-7 h-7 rounded-full border border-slate-600"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="text-left hidden sm:block max-w-[120px] truncate">
                <p className="text-xs font-medium text-white truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-emerald-400">Sincronizado</p>
              </div>
              <button
                onClick={logout}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md transition"
              title="Entrar com Google para sincronizar em tempo real em múltiplos dispositivos"
            >
              <span>Entrar / Sincronizar</span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            aria-label="Abrir menu"
          >
            <span className="sr-only">Menu</span>
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-current rounded" />
              <span className="w-full h-0.5 bg-current rounded" />
              <span className="w-full h-0.5 bg-current rounded" />
            </div>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="bg-slate-950 border-t border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMenuOpen(false);
                }}
                className={`relative px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile drop menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{item.label}</span>
              {item.badge !== null && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                  {item.badge} em alerta
                </span>
              )}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenExportModal();
                setIsMenuOpen(false);
              }}
              className="text-left text-xs text-emerald-400 py-1 flex items-center gap-2 font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Planilhas (CSV / Excel para SEMED)
            </button>
            <button
              onClick={() => {
                onOpenInstallModal();
                setIsMenuOpen(false);
              }}
              className="text-left text-xs text-cyan-400 py-1 flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              Instruções Android & Windows Desktop
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
