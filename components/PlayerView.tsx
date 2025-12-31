
import React, { useState, useEffect } from 'react';
import { Player, Role, GameStatus } from '../types';

const IDENTITY_KEY = 'hidden_roles_identity';

interface PlayerViewProps {
  players: Player[];
  gameStatus: GameStatus;
  isEmergency: boolean;
  emergencyMessage?: string;
  onClearEmergency?: () => void;
}

const PlayerView: React.FC<PlayerViewProps> = ({
  players,
  gameStatus,
  isEmergency,
  emergencyMessage,
  onClearEmergency
}) => {
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(localStorage.getItem(IDENTITY_KEY));
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (isEmergency) {
      const timer = setTimeout(() => setShowOverlay(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowOverlay(false);
    }
  }, [isEmergency]);

  const handleClaimIdentity = (id: string) => {
    localStorage.setItem(IDENTITY_KEY, id);
    setLocalPlayerId(id);
  };

  const handleSwitchIdentity = () => {
    if (confirm("Deseja trocar de identidade? Isso permitirá que você assuma outro codinome.")) {
      localStorage.removeItem(IDENTITY_KEY);
      setLocalPlayerId(null);
    }
  };

  const handleReveal = (player: Player) => {
    if (player.id !== localPlayerId) return;
    setSelectedPlayer(player);
    setIsRevealing(true);
  };

  const closeReveal = () => {
    setIsRevealing(false);
    setSelectedPlayer(null);
  };

  // Se o jogo não começou, mostra tela de espera
  if (gameStatus !== GameStatus.ACTIVE) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center space-y-10 py-10">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 bg-rose-600/20 blur-3xl rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <p className="text-rose-500 font-display font-black text-2xl tracking-widest italic uppercase">SISTEMA OFFLINE</p>
          <p className="text-stone-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Aguardando mestre iniciar protocolos...</p>
        </div>
        {players.length > 0 && (
          <div className="glass p-5 rounded-2xl border-stone-800 w-full max-w-xs shadow-2xl">
            <p className="text-[10px] text-stone-600 uppercase font-black tracking-[0.3em] mb-4">Agentes Conectados</p>
            <div className="flex flex-wrap justify-center gap-2">
              {players.map(p => (
                <span key={p.id} className="px-3 py-1.5 bg-stone-950 rounded-lg text-[10px] font-bold text-stone-400 border border-stone-800/50">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Se o jogador ainda não disse quem ele é, obriga a escolher
  if (!localPlayerId) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-black text-white italic uppercase italic">Identificação</h2>
          <p className="text-[10px] text-stone-500 font-black uppercase tracking-[0.3em]">Selecione seu codinome para prosseguir</p>
        </div>
        <div className="grid gap-3">
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => handleClaimIdentity(p.id)}
              className="glass p-5 rounded-2xl text-left border border-stone-800 hover:border-rose-500/50 transition-all active:scale-95 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-lg text-stone-300 group-hover:text-white">{p.name}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-600">Reivindicar</span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-[9px] text-stone-700 font-bold uppercase tracking-widest">Aviso: Você só poderá ver a missão deste agente.</p>
      </div>
    );
  }

  const currentPlayer = players.find(p => p.id === localPlayerId);

  return (
    <div className={`space-y-6 relative transition-colors duration-500 min-h-full ${isEmergency ? 'siren-bg' : ''}`}>
      {isEmergency && <div className="scanline" />}

      {/* Overlay de Emergência (Mantido igual) */}
      {isEmergency && showOverlay && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 bg-red-600 animate-in fade-in zoom-in duration-500">
          <div className="relative z-10 text-center space-y-8 max-w-sm">
            <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center pulse-red">
              <svg className="w-16 h-16 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-4xl font-display font-black text-white italic tracking-tighter uppercase leading-none">Protocolo de Emergência!</h2>
            <div className="p-7 bg-black/40 rounded-[2rem] border border-white/20 backdrop-blur-xl">
              <p className="text-xl font-bold text-white italic">"{emergencyMessage || "Reunião imediata!"}"</p>
            </div>
            <button onClick={onClearEmergency} className="w-full py-5 rounded-2xl bg-white text-red-600 font-display font-black text-lg">CONFIRMAR</button>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-stone-100 uppercase italic">Painel do Agente</h2>
          <button onClick={handleSwitchIdentity} className="text-[8px] font-black uppercase tracking-widest text-stone-600 border border-stone-800 px-2 py-1 rounded hover:text-rose-500">Trocar Agente</button>
        </div>

        {currentPlayer && (
          <button
            onClick={() => handleReveal(currentPlayer)}
            className="w-full glass p-8 rounded-[2.5rem] border-rose-500/30 bg-rose-500/5 shadow-2xl shadow-rose-900/10 text-center space-y-4 relative overflow-hidden group active:scale-95 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500">Seu Papel</p>
            <h3 className="text-4xl font-display font-black text-white tracking-tighter italic">{currentPlayer.name}</h3>
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest">
              Ver Minha Missão
            </div>
          </button>
        )}

        <div className="pt-6 space-y-3">
          <p className="text-[10px] text-stone-600 font-black uppercase tracking-[0.3em]">Outros Agentes na Missão</p>
          <div className="grid grid-cols-2 gap-2">
            {players.filter(p => p.id !== localPlayerId).map(p => (
              <div key={p.id} className="p-3 bg-stone-900/40 border border-stone-800/50 rounded-xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-700"></div>
                <span className="text-xs font-bold text-stone-500">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Revelação (Apenas para o dono) */}
      {isRevealing && selectedPlayer && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-stone-950/98 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-[3rem] p-10 text-center space-y-10 border shadow-2xl relative ${selectedPlayer.role === Role.IMPOSTOR ? 'impostor-gradient pulse-red border-rose-500/50' :
              selectedPlayer.role === Role.DETECTIVE ? 'detective-gradient border-blue-500/50' : 'innocent-gradient border-emerald-500/50'
            }`}>
            <div className="space-y-2">
              <h3 className="text-[10px] uppercase font-black tracking-[0.5em] text-white/50">Terminal Autorizado</h3>
              <p className="text-4xl font-display font-black tracking-tighter text-white italic">{selectedPlayer.name}</p>
            </div>

            <p className="text-5xl font-display font-black tracking-widest drop-shadow-2xl italic text-white leading-none uppercase">
              {selectedPlayer.role}
            </p>

            <div className="bg-black/40 backdrop-blur-xl p-6 rounded-[2rem] text-left border border-white/10 space-y-2">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">Diretriz de Campo</p>
              <p className="text-sm font-bold leading-relaxed italic text-white/95">
                "{selectedPlayer.mission || "Aguarde ordens."}"
              </p>
            </div>

            <button
              onClick={closeReveal}
              className="w-full py-5 rounded-[2rem] bg-white text-stone-950 font-display font-black text-lg active:scale-95"
            >
              FECHAR E OCULTAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerView;
