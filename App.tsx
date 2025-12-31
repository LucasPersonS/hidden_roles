
import React, { useState, useEffect, useCallback } from 'react';
import { Player, Role, GameStatus, GameState } from './types';
import AdminPanel from './components/AdminPanel';
import PlayerView from './components/PlayerView';
import JoinScreen from './components/JoinScreen';
import { generateEmergencyMessage } from './services/geminiService';

const LOCAL_STORAGE_KEY = 'hidden_roles_v5_final';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'players' | 'admin' | 'join'>('home');
  const [copied, setCopied] = useState(false);

  // Inicialização do estado - Prioridade: URL > LocalStorage > null
  const [gameState, setGameState] = useState<GameState | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('match');
    
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        return { ...decoded, isEmergency: decoded.isEmergency || false };
      } catch (e) {
        console.warn("Falha ao decodificar dados da URL.");
      }
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Função central de Reset/Voltar ao Início
  const resetGame = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.history.replaceState({}, '', window.location.origin + window.location.pathname);
    setGameState(null);
    setView('home');
  }, []);

  // Sincronização e Navegação Automática baseada no Estado
  useEffect(() => {
    if (gameState) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
      // Se estamos na home mas temos um jogo ativo, pula para a view correta
      if (view === 'home') {
        setView(gameState.status === GameStatus.LOBBY ? 'admin' : 'players');
      }
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      if (view !== 'join') setView('home');
    }
  }, [gameState, view]);

  const handleJoin = (dataBlob: string) => {
    try {
      const blob = dataBlob.includes('match=') ? dataBlob.split('match=')[1].split('&')[0] : dataBlob;
      const decoded = JSON.parse(atob(blob.trim()));
      setGameState(decoded);
      setView('players');
    } catch (e) {
      alert("Código ou Link Inválido. Certifique-se de colar o link completo ou o código criptografado.");
    }
  };

  const createNewGame = () => {
    const newState: GameState = {
      players: [],
      status: GameStatus.LOBBY,
      matchId: Math.random().toString(36).substring(2, 8).toUpperCase(),
      isEmergency: false
    };
    setGameState(newState);
    setView('admin');
  };

  const addPlayer = useCallback((name: string) => {
    setGameState(prev => prev ? ({
      ...prev,
      players: [...prev.players, {
        id: Math.random().toString(36).substring(2, 9),
        name,
        role: Role.INNOCENT,
        isAlive: true
      }]
    }) : null);
  }, []);

  const removePlayer = useCallback((id: string) => {
    setGameState(prev => prev ? ({
      ...prev,
      players: prev.players.filter(p => p.id !== id)
    }) : null);
  }, []);

  const startGame = useCallback((missions: Record<string, string>) => {
    setGameState(prev => {
      if (!prev) return null;
      const playersCount = prev.players.length;
      const numImpostors = playersCount >= 9 ? 3 : playersCount >= 6 ? 2 : 1;
      const numDetectives = playersCount >= 9 ? 2 : 1;

      const roles: Role[] = [];
      for (let i = 0; i < numImpostors; i++) roles.push(Role.IMPOSTOR);
      for (let i = 0; i < numDetectives; i++) roles.push(Role.DETECTIVE);
      while (roles.length < playersCount) roles.push(Role.INNOCENT);
      
      const shuffledRoles = roles.sort(() => Math.random() - 0.5);
      const shuffledPlayers = [...prev.players].sort(() => Math.random() - 0.5);

      return {
        ...prev,
        players: shuffledPlayers.map((p, idx) => ({
          ...p,
          role: shuffledRoles[idx],
          mission: missions[p.name] || "Sua missão é secreta."
        })),
        status: GameStatus.ACTIVE,
        startTime: Date.now(),
        isEmergency: false
      };
    });
  }, []);

  const triggerEmergency = async () => {
    const msg = await generateEmergencyMessage();
    setGameState(prev => prev ? ({ ...prev, isEmergency: true, emergencyMessage: msg }) : null);
  };

  const clearEmergency = () => setGameState(prev => prev ? ({ ...prev, isEmergency: false }) : null);
  const endGame = () => setGameState(prev => prev ? ({ ...prev, status: GameStatus.ENDED, isEmergency: false }) : null);

  const shareMatch = () => {
    if (!gameState) return;
    const data = btoa(JSON.stringify(gameState));
    const url = `${window.location.origin}${window.location.pathname}?match=${data}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (navigator.share) {
        navigator.share({ title: 'Papéis Ocultos', text: `Entre na partida ${gameState.matchId}`, url }).catch(() => {});
      }
    });
  };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col relative bg-stone-950 text-stone-200 overflow-hidden">
      {/* Elementos de Decoração de Fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header visível apenas fora da Home/Join */}
      {view !== 'home' && view !== 'join' && (
        <header className="p-5 flex items-center justify-between z-30 border-b border-white/5 bg-stone-950/80 backdrop-blur-xl">
          <div onClick={resetGame} className="cursor-pointer group flex flex-col">
            <h1 className="text-xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-700 group-hover:from-rose-400 group-hover:scale-105 transition-all">
              PAPÉIS OCULTOS
            </h1>
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-stone-600 group-hover:text-rose-500 transition-colors">Voltar ao Início</span>
          </div>
          {gameState && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-mono text-rose-500 font-black bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                #{gameState.matchId}
              </span>
            </div>
          )}
        </header>
      )}

      {copied && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl animate-in slide-in-from-top-4">
          Link de Acesso Copiado
        </div>
      )}

      <main className="flex-1 p-6 z-20 overflow-y-auto pb-32 flex flex-col">
        {view === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700">
            <div className="text-center space-y-4">
               <div className="w-24 h-24 bg-rose-600/20 rounded-3xl rotate-12 mx-auto flex items-center justify-center border border-rose-500/30 shadow-2xl shadow-rose-900/20">
                  <svg className="w-12 h-12 text-rose-500 -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
               </div>
               <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase italic leading-none">Terminal<br/><span className="text-rose-600">Oculto</span></h1>
            </div>
            <div className="w-full space-y-4">
              <button onClick={createNewGame} className="w-full py-5 rounded-2xl bg-rose-600 text-white font-display font-black text-lg shadow-xl shadow-rose-900/40 active:scale-95 transition-all">
                CRIAR PARTIDA
              </button>
              <button onClick={() => setView('join')} className="w-full py-5 rounded-2xl bg-stone-900 text-stone-300 font-display font-black text-lg border border-stone-800 active:scale-95 transition-all">
                INSERIR CÓDIGO
              </button>
            </div>
            <p className="text-[10px] text-stone-600 font-black uppercase tracking-[0.4em]">v5.2 Protocolo de Sincronia</p>
          </div>
        )}

        {view === 'join' && <JoinScreen onJoin={handleJoin} onBack={() => setView('home')} />}

        {gameState && view === 'players' && (
          <PlayerView 
            players={gameState.players} 
            gameStatus={gameState.status}
            isEmergency={gameState.isEmergency}
            emergencyMessage={gameState.emergencyMessage}
            onClearEmergency={clearEmergency}
          />
        )}

        {gameState && view === 'admin' && (
          <AdminPanel 
            players={gameState.players}
            status={gameState.status}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            onStartGame={startGame}
            onEndGame={endGame}
            onReset={resetGame}
            onEmergency={triggerEmergency}
            onShare={shareMatch}
          />
        )}
      </main>

      {/* Navegação de Tabs */}
      {gameState && (view === 'players' || view === 'admin') && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
          <div className="max-w-xs mx-auto glass bg-stone-900/95 border-stone-800 rounded-2xl p-1.5 flex items-center gap-1.5 shadow-2xl pointer-events-auto shadow-black">
            <button 
              onClick={() => setView('players')} 
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black transition-all active:scale-95 ${view === 'players' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <span className="text-[10px] uppercase tracking-widest">Agente</span>
            </button>
            <button 
              onClick={() => setView('admin')} 
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black transition-all active:scale-95 ${view === 'admin' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <span className="text-[10px] uppercase tracking-widest">Mestre</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
