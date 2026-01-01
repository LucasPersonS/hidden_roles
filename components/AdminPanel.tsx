
import React, { useState } from 'react';
import { Player, Role, GameStatus } from '../types';
import { generateMissions } from '../services/geminiService';

interface AdminPanelProps {
  players: Player[];
  status: GameStatus;
  matchId: string;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (id: string) => void;
  onStartGame: (missions: Record<string, string>) => void;
  onEndGame: () => void;
  onReset: () => void;
  onEmergency: () => void;
  onShare: () => void;
  onUnlockAudio?: () => void;
  numImpostors: number;
  numDetectives: number;
  manualRoleAssignments: Record<string, Role>;
  onSetNumImpostors: (n: number) => void;
  onSetNumDetectives: (n: number) => void;
  onSetPlayerRole: (playerId: string, role: Role | null) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  players,
  status,
  matchId,
  onAddPlayer,
  onRemovePlayer,
  onStartGame,
  onEndGame,
  onReset,
  onEmergency,
  onShare,
  onUnlockAudio,
  numImpostors,
  numDetectives,
  manualRoleAssignments,
  onSetNumImpostors,
  onSetNumDetectives,
  onSetPlayerRole
}) => {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  // ... (handlers remain unchanged)
  const handleAdd = () => {
    if (newName.trim()) {
      onAddPlayer(newName.trim());
      setNewName('');
    }
  };

  const handleStart = async () => {
    if (onUnlockAudio) onUnlockAudio();
    if (players.length < 3) {
      alert("Operação negada: Mínimo de 3 agentes necessários.");
      return;
    }
    setLoading(true);
    try {
      const missions = await generateMissions(players.map(p => ({ name: p.name, role: p.role })));
      onStartGame(missions);
    } catch (e) {
      alert("Falha na rede de satélite. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center space-y-2 py-4">
        <p className="text-[10px] text-stone-500 font-black uppercase tracking-[0.3em]">CÓDIGO DA SALA</p>
        <div
          onClick={onShare}
          className="text-5xl font-display font-black text-white tracking-widest bg-stone-900 px-8 py-4 rounded-3xl border border-stone-800 shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all text-center select-all"
        >
          {matchId}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h2 className="text-lg font-display font-black text-rose-500 italic uppercase">Terminal Mestre</h2>
        <div className="flex gap-2">
          <button
            onClick={onShare}
            className="p-2 rounded-xl bg-stone-900 text-rose-500 border border-rose-500/20 active:scale-90 transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {status === GameStatus.LOBBY && (
        <div className="space-y-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Codinome do Agente"
              className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 text-white font-bold"
            />
            <button
              onClick={handleAdd}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-rose-600/20"
            >
              ADD
            </button>
          </div>

          {/* Role Configuration */}
          <div className="glass bg-stone-950/60 rounded-2xl p-4 border-stone-800">
            <p className="text-[10px] text-stone-500 font-black uppercase tracking-[0.3em] mb-3">Configuração de Papéis</p>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[9px] text-stone-600 font-black uppercase block mb-1">Impostores</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => onSetNumImpostors(Math.max(1, numImpostors - 1))} className="bg-stone-800 hover:bg-stone-700 text-white font-black px-3 py-2 rounded-lg">-</button>
                  <span className="text-white font-black text-lg w-8 text-center">{numImpostors}</span>
                  <button onClick={() => onSetNumImpostors(Math.min(players.length - 1, numImpostors + 1))} className="bg-stone-800 hover:bg-stone-700 text-white font-black px-3 py-2 rounded-lg">+</button>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-stone-600 font-black uppercase block mb-1">Detetives</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => onSetNumDetectives(Math.max(1, numDetectives - 1))} className="bg-stone-800 hover:bg-stone-700 text-white font-black px-3 py-2 rounded-lg">-</button>
                  <span className="text-white font-black text-lg w-8 text-center">{numDetectives}</span>
                  <button onClick={() => onSetNumDetectives(Math.min(players.length - 1, numDetectives + 1))} className="bg-stone-800 hover:bg-stone-700 text-white font-black px-3 py-2 rounded-lg">+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass bg-stone-950/40 rounded-2xl overflow-hidden border-stone-800 shadow-inner">
            <div className="max-h-56 overflow-y-auto">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-rose-500/5 transition-colors">
                  <div className="flex-1">
                    <span className="font-bold text-stone-300 tracking-tight">{p.name}</span>
                    {manualRoleAssignments[p.id] && (
                      <span className={`ml-2 text-[8px] font-black px-2 py-0.5 rounded-md ${manualRoleAssignments[p.id] === Role.IMPOSTOR ? 'bg-rose-500/20 text-rose-400' :
                          manualRoleAssignments[p.id] === Role.DETECTIVE ? 'bg-blue-500/20 text-blue-400' :
                            'bg-emerald-500/20 text-emerald-400'
                        }`}>
                        {manualRoleAssignments[p.id]}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onSetPlayerRole(p.id, Role.IMPOSTOR)} className={`p-1.5 text-[8px] font-black rounded ${manualRoleAssignments[p.id] === Role.IMPOSTOR ? 'bg-rose-600 text-white' : 'bg-stone-800 text-stone-500 hover:bg-stone-700'
                      }`} title="Impostor">IMP</button>
                    <button onClick={() => onSetPlayerRole(p.id, Role.DETECTIVE)} className={`p-1.5 text-[8px] font-black rounded ${manualRoleAssignments[p.id] === Role.DETECTIVE ? 'bg-blue-600 text-white' : 'bg-stone-800 text-stone-500 hover:bg-stone-700'
                      }`} title="Detetive">DET</button>
                    <button onClick={() => onSetPlayerRole(p.id, Role.INNOCENT)} className={`p-1.5 text-[8px] font-black rounded ${manualRoleAssignments[p.id] === Role.INNOCENT ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-500 hover:bg-stone-700'
                      }`} title="Inocente">INO</button>
                    <button onClick={() => onSetPlayerRole(p.id, null)} className="p-1.5 text-[8px] font-black rounded bg-stone-800 text-stone-500 hover:bg-stone-700" title="Limpar">✕</button>
                    <button
                      onClick={() => onRemovePlayer(p.id)}
                      className="p-1.5 text-stone-600 hover:text-rose-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <div className="p-10 text-center space-y-2">
                  <p className="text-stone-600 text-xs font-black uppercase tracking-[0.2em]">Sala de Espera Vazia</p>
                  <p className="text-[10px] text-stone-700">Adicione jogadores para iniciar o protocolo.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={players.length < 3 || loading}
            className={`w-full py-5 rounded-2xl font-display font-black text-lg transition-all shadow-2xl relative overflow-hidden ${players.length < 3 || loading
              ? 'bg-stone-900 text-stone-700 cursor-not-allowed border border-stone-800'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 active:scale-[0.98]'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                CRIPTOGRAFANDO...
              </span>
            ) : 'GERAR PROTOCOLO'}
          </button>
        </div>
      )}

      {status === GameStatus.ACTIVE && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => { if (onUnlockAudio) onUnlockAudio(); onEmergency(); }}
            className="w-full py-6 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 font-display font-black text-xl shadow-2xl shadow-rose-900/50 border border-white/10 active:scale-95 pulse-red"
          >
            SINAL DE EMERGÊNCIA
          </button>

          <div className="glass bg-stone-950/60 rounded-2xl p-5 space-y-4 border-stone-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Dossiê de Campo</h3>
              <button onClick={onShare} className="text-[9px] text-rose-500 font-black uppercase tracking-tighter border-b border-rose-500/30">Atualizar Link</button>
            </div>
            <div className="space-y-2">
              {players.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="font-bold text-stone-300 text-sm">{p.name}</span>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-md border uppercase tracking-tighter ${p.role === Role.IMPOSTOR ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                    p.role === Role.DETECTIVE ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                    {p.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onEndGame}
            className="w-full py-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-500 font-black text-xs uppercase tracking-widest transition-all border border-stone-800 active:scale-95"
          >
            Encerrar Protocolo
          </button>
        </div>
      )}

      {status === GameStatus.ENDED && (
        <div className="text-center space-y-8 py-12 animate-in zoom-in duration-500">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-rose-600/10 rounded-full flex items-center justify-center border border-rose-500/30">
              <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-display font-black text-rose-500 tracking-tighter italic">MISSÃO CONCLUÍDA</h3>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-widest leading-relaxed px-10">O sistema está pronto para uma nova reinicialização.</p>
          </div>
          <button
            onClick={onReset}
            className="w-full py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-display font-black text-lg transition-all shadow-2xl shadow-rose-600/30 active:scale-95"
          >
            REINICIAR SISTEMA
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
