
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Role, GameStatus, GameState } from './types';
import AdminPanel from './components/AdminPanel';
import PlayerView from './components/PlayerView';
import JoinScreen from './components/JoinScreen';
import { generateEmergencyMessage } from './services/geminiService';
import Peer, { DataConnection } from 'peerjs';

const LOCAL_STORAGE_KEY = 'hidden_roles_v5_p2p';

// Helper to get random ID
const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'players' | 'admin' | 'join'>('home');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [copied, setCopied] = useState(false);

  // Refs for P2P to avoid re-renders or stale closures
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);

  // -- P2P: Broadcast State (Host Only) --
  const broadcastState = useCallback((newState: GameState) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send(newState);
      }
    });
  }, []);

  // -- P2P: Initialization --
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hostIdFromUrl = params.get('host');

    // Clean up previous peer if any (mostly for hot-reload safety)
    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  // -- HOST: Create Game --
  const createNewGame = () => {
    setIsHost(true);
    setConnectionStatus('connecting');

    const newPeer = new Peer();
    peerRef.current = newPeer;

    newPeer.on('open', (id) => {
      setPeerId(id);
      setConnectionStatus('connected');

      const newState: GameState = {
        players: [],
        status: GameStatus.LOBBY,
        matchId: id, // Using PeerID as MatchID for simplicity
        isEmergency: false
      };
      setGameState(newState);
      setView('admin');
    });

    newPeer.on('connection', (conn) => {
      connectionsRef.current.push(conn);

      conn.on('open', () => {
        // Send current state immediately to new player
        setGameState(current => {
          if (current) conn.send(current);
          return current;
        });
      });

      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
      });
    });

    newPeer.on('error', (err) => {
      console.error("Peer Error:", err);
      alert("Erro de conexão P2P. Tente recarregar.");
    });
  };

  // -- GUEST: Join Game --
  const joinGame = (targetHostId: string) => {
    setIsHost(false);
    setConnectionStatus('connecting');
    setView('players'); // Force player view immediately

    const newPeer = new Peer();
    peerRef.current = newPeer;

    newPeer.on('open', () => {
      const conn = newPeer.connect(targetHostId);

      conn.on('open', () => {
        setConnectionStatus('connected');
      });

      conn.on('data', (data: any) => {
        // Receive GameState from Host
        setGameState(data as GameState);
      });

      conn.on('close', () => {
        alert("O Host desconectou ou a partida encerrou.");
        resetGame();
      });

      conn.on('error', (err) => {
        console.error("Connection Error:", err);
        alert("Não foi possível conectar ao Host.");
        setView('home');
      });
    });
  };

  const handleJoinInput = (input: string) => {
    // Extract ID if it's a full URL
    console.log("Joining:", input);
    let id = input.trim();
    if (input.includes('host=')) {
      id = input.split('host=')[1].split('&')[0];
    }
    joinGame(id);
  };

  // -- Check URL for auto-join --
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hostId = params.get('host');
    if (hostId && !peerRef.current) {
      joinGame(hostId);
    }
  }, []);


  // -- Game Actions (Host Only wrapper) --
  // We wrap state updates to also broadcast them
  const updateGame = (updater: (prev: GameState | null) => GameState | null) => {
    if (!isHost) return; // Guests can't trigger state changes directly

    setGameState(prev => {
      const newState = updater(prev);
      if (newState) {
        broadcastState(newState); // SYNC WITH PLAYERS
      }
      return newState;
    });
  };

  const resetGame = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    connectionsRef.current = [];
    setGameState(null);
    setIsHost(false);
    setConnectionStatus('disconnected');
    setView('home');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const addPlayer = (name: string) => {
    updateGame(prev => prev ? ({
      ...prev,
      players: [...prev.players, {
        id: generateId(),
        name,
        role: Role.INNOCENT,
        isAlive: true
      }]
    }) : null);
  };

  const removePlayer = (id: string) => {
    updateGame(prev => prev ? ({
      ...prev,
      players: prev.players.filter(p => p.id !== id)
    }) : null);
  };

  const startGame = (missions: Record<string, string>) => {
    updateGame(prev => {
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
  };

  const triggerEmergency = async () => {
    const msg = await generateEmergencyMessage();
    updateGame(prev => prev ? ({ ...prev, isEmergency: true, emergencyMessage: msg }) : null);
  };

  const clearEmergency = () => updateGame(prev => prev ? ({ ...prev, isEmergency: false }) : null);
  const endGame = () => updateGame(prev => prev ? ({ ...prev, status: GameStatus.ENDED, isEmergency: false }) : null);

  const shareMatch = () => {
    if (!peerId) return;
    const url = `${window.location.origin}${window.location.pathname}?host=${peerId}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (navigator.share) {
        navigator.share({ title: 'Papéis Ocultos', text: 'Entre na partida!', url }).catch(() => { });
      }
    });
  };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col relative bg-stone-950 text-stone-200 overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header - Only visible if Game is Active and NOT on Home/Join */}
      {view !== 'home' && view !== 'join' && gameState && (
        <header className="p-5 flex items-center justify-between z-30 border-b border-white/5 bg-stone-950/80 backdrop-blur-xl">
          <div onClick={resetGame} className="cursor-pointer group flex flex-col">
            <h1 className="text-xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-700 group-hover:from-rose-400 group-hover:scale-105 transition-all">
              PAPÉIS OCULTOS
            </h1>
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-stone-600 group-hover:text-rose-500 transition-colors">
              {isHost ? 'ENCERRAR SESSÃO' : 'SAIR DA PARTIDA'}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'} animate-pulse`}></span>
              <span className="text-[10px] font-mono text-stone-500 font-bold uppercase">{connectionStatus === 'connected' ? 'ONLINE' : 'CONECTANDO...'}</span>
            </div>
            {isHost && (
              <span className="text-[8px] font-mono text-stone-600 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">HOST</span>
            )}
          </div>
        </header>
      )}

      {copied && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl animate-in slide-in-from-top-4">
          Link Copiado!
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
              <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase italic leading-none">Terminal<br /><span className="text-rose-600">Oculto</span></h1>
            </div>

            <div className="w-full space-y-4">
              <button onClick={createNewGame} className="w-full py-5 rounded-2xl bg-rose-600 text-white font-display font-black text-lg shadow-xl shadow-rose-900/40 active:scale-95 transition-all flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                CRIAR PARTIDA
              </button>
              <button onClick={() => setView('join')} className="w-full py-5 rounded-2xl bg-stone-900 text-stone-300 font-display font-black text-lg border border-stone-800 active:scale-95 transition-all flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                ENTRAR EM SALA
              </button>
            </div>

            <p className="text-[10px] text-stone-600 font-black uppercase tracking-[0.4em]">Online v6.0 • P2P Sync</p>
          </div>
        )}

        {view === 'join' && <JoinScreen onJoin={handleJoinInput} onBack={() => setView('home')} />}

        {gameState && view === 'players' && (
          <PlayerView
            players={gameState.players}
            gameStatus={gameState.status}
            isEmergency={gameState.isEmergency}
            emergencyMessage={gameState.emergencyMessage}
            onClearEmergency={clearEmergency} // Only works if we passed it through PeerJS back to host? No, simple players can't clear.
          />
        )}

        {gameState && view === 'admin' && isHost && (
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

        {/* Waiting Screen for Guests if they somehow get to a state with no data yet */}
        {connectionStatus === 'connecting' && view !== 'home' && !gameState && (
          <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
            <div className="text-rose-500 font-display font-black text-xl">Sincronizando...</div>
          </div>
        )}

      </main>

      {/* Tabs - Only for HOST. Guests don't see Admin tab. */}
      {gameState && isHost && (view === 'players' || view === 'admin') && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
          <div className="max-w-xs mx-auto glass bg-stone-900/95 border-stone-800 rounded-2xl p-1.5 flex items-center gap-1.5 shadow-2xl pointer-events-auto shadow-black">
            <button
              onClick={() => setView('players')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black transition-all active:scale-95 ${view === 'players' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <span className="text-[10px] uppercase tracking-widest">Ver Jogo</span>
            </button>
            <button
              onClick={() => setView('admin')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black transition-all active:scale-95 ${view === 'admin' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <span className="text-[10px] uppercase tracking-widest">Admin</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
