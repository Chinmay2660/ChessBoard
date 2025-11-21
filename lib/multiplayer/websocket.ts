/**
 * WebSocket multiplayer client
 */

import type { Square } from 'chess.js';
import { GameState } from '../chess/gameState';

export interface WebSocketMessage {
  type: 'move' | 'state' | 'sync' | 'error' | 'ping' | 'pong';
  data?: any;
  timestamp?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private onMessageCallback?: (message: WebSocketMessage) => void;
  private onErrorCallback?: (error: Error) => void;
  private onConnectCallback?: () => void;

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.onConnectCallback?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.onMessageCallback?.(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          const err = new Error('WebSocket error');
          this.onErrorCallback?.(err);
          reject(err);
        };

        this.ws.onclose = () => {
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect().catch(() => {
          // Reconnection failed, will try again
        });
      }, 1000 * this.reconnectAttempts);
    }
  }

  sendMove(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n'): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'move',
          data: { from, to, promotion },
          timestamp: Date.now(),
        })
      );
    }
  }

  sendState(state: GameState): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'state',
          data: state,
          timestamp: Date.now(),
        })
      );
    }
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

