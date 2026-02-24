import type { StreamingSession } from '../../types/streaming/StreamingTypes.js';

const sessions = new Map<string, StreamingSession>();

export const saveSession = (session: StreamingSession): void => {
  sessions.set(session.sessionId, session);
};

export const getSession = (sessionId: string): StreamingSession | undefined => (
  sessions.get(sessionId)
);

export const streamingSessionRepository = {
  saveSession,
  getSession
};

export type StreamingSessionRepository = typeof streamingSessionRepository;
