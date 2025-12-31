
import React, { useState } from 'react';

interface JoinScreenProps {
  onJoin: (code: string) => void;
  onBack: () => void;
}

const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin, onBack }) => {
  const [code, setCode] = useState('');

  return (
    <div className="h-full flex flex-col space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 text-stone-500 hover:text-rose-500 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-display font-black text-white italic uppercase">Acesso à Partida</h2>
      </div>

      <div className="space-y-6">
        <div className="p-6 glass bg-rose-950/10 border-stone-800 rounded-[2rem] space-y-4">
          <p className="text-[10px] text-stone-500 font-black uppercase tracking-[0.2em]">Insira o Link ou Código de Acesso</p>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Cole aqui o link ou código enviado pelo mestre..."
            className="w-full h-32 bg-stone-900/50 border border-stone-800 rounded-2xl p-4 text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-mono placeholder:text-stone-700 resize-none"
          />
        </div>

        <button
          onClick={() => onJoin(code)}
          disabled={!code.trim()}
          className={`w-full py-5 rounded-2xl font-display font-black text-lg transition-all shadow-2xl ${
            !code.trim() ? 'bg-stone-900 text-stone-700 border border-stone-800' : 'bg-rose-600 text-white shadow-rose-900/30 active:scale-95'
          }`}
        >
          SINCRONIZAR TERMINAL
        </button>

        <div className="space-y-4 text-center">
          <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest leading-relaxed">
            Dica: Peça para o mestre clicar no ícone de partilha e copiar o link da partida para você.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinScreen;
