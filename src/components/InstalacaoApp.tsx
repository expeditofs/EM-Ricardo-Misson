import React from 'react';
import {
  Smartphone,
  Monitor,
  Cloud,
  CheckCircle,
  Share2,
  Download,
  X,
  Lock,
  Wifi,
  Sparkles,
} from 'lucide-react';

interface InstalacaoAppProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstalacaoApp: React.FC<InstalacaoAppProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Como Usar no Android e Windows Desktop
              </h3>
              <p className="text-xs text-slate-400">
                Sincronização em Tempo Real • E.M. Ricardo Misson
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-slate-700">
          {/* Real-time synchronization note */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
            <Cloud className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-blue-900 text-sm">
                Sincronização em Tempo Real entre Múltiplos Dispositivos
              </h4>
              <p className="text-xs text-blue-800 mt-1">
                Todas as alterações feitas em um celular Android ou computador Windows são
                sincronizadas instantaneamente via banco de dados na nuvem (Firestore). Qualquer
                professora ou coordenador autorizado visualiza as atualizações em tempo real sem perda de dados.
              </p>
            </div>
          </div>

          {/* Instructions for Android and Windows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Android */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span>No Celular / Tablet Android</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                <li>
                  Abra este link no navegador <strong>Google Chrome</strong> do seu Android.
                </li>
                <li>
                  Toque no ícone de <strong>3 pontinhos (⋮)</strong> no canto superior direito.
                </li>
                <li>
                  Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.
                </li>
                <li>
                  O ícone da <strong>E.M. Ricardo Misson</strong> aparecerá na sua tela de aplicativos como um app nativo, abrindo em tela cheia!
                </li>
              </ol>
              <div className="pt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Funciona com cache e sincronização contínua.</span>
              </div>
            </div>

            {/* Windows Desktop */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Monitor className="w-5 h-5 text-indigo-600" />
                <span>No Computador Windows</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                <li>
                  Abra este sistema no <strong>Microsoft Edge</strong> ou <strong>Google Chrome</strong> no Windows.
                </li>
                <li>
                  Observe o ícone de instalação (computador com setinha) na barra de endereços (ao lado da estrela de favoritos).
                </li>
                <li>
                  Clique em <strong>"Instalar aplicativo"</strong>.
                </li>
                <li>
                  O aplicativo será fixado na sua <strong>Barra de Tarefas</strong> e no menu Iniciar do Windows com janela própria e impressão direta de relatórios.
                </li>
              </ol>
              <div className="pt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Exportação para PDF, impressora da escola e planilha CSV.</span>
              </div>
            </div>
          </div>

          {/* Offline resilience */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
            <Wifi className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-xs">
                Proteção Contra Quedas de Conexão na Escola
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                O aplicativo possui armazenamento local resiliente (IndexedDB e LocalStorage). Se a internet da escola oscilar, você pode continuar registrando faltas e intervenções normalmente; assim que o dispositivo reconectar, os dados são sincronizados automaticamente com os demais aparelhos.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
          >
            Entendi, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
