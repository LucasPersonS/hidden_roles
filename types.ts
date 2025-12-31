
export enum Role {
  IMPOSTOR = 'IMPOSTOR',
  DETECTIVE = 'DETETIVE',
  INNOCENT = 'INOCENTE'
}

export enum GameStatus {
  LOBBY = 'SALA',
  ACTIVE = 'EM JOGO',
  ENDED = 'ENCERRADO'
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  mission?: string;
  isAlive: boolean;
}

export interface GameState {
  players: Player[];
  status: GameStatus;
  matchId: string;
  startTime?: number;
  isEmergency: boolean;
  emergencyMessage?: string;
  lastEmergencyTime?: number;
}
