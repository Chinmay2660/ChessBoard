/**
 * WebRTC peer-to-peer multiplayer client (fallback)
 * 
 * Note: This is a simplified implementation. For production,
 * you would want to use a signaling server (WebSocket/HTTP)
 * to exchange SDP offers/answers and ICE candidates.
 */

export interface WebRTCMessage {
  type: 'move' | 'state' | 'offer' | 'answer' | 'ice-candidate';
  data?: any;
}

export class WebRTCClient {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onMessageCallback?: (message: WebRTCMessage) => void;
  private onErrorCallback?: (error: Error) => void;

  constructor() {
    // Initialize peer connection with STUN servers
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
    this.peerConnection = new RTCPeerConnection(configuration);
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    // Create data channel for game data
    this.dataChannel = this.peerConnection.createDataChannel('game', {
      ordered: true,
    });

    this.dataChannel.onmessage = (event) => {
      try {
        const message: WebRTCMessage = JSON.parse(event.data);
        this.onMessageCallback?.(message);
      } catch (error) {
        console.error('Failed to parse WebRTC message:', error);
      }
    };

    this.dataChannel.onerror = (error) => {
      this.onErrorCallback?.(new Error('Data channel error'));
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this to the other peer via signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.setRemoteDescription(description);
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    await this.setRemoteDescription(offer);

    // Set up data channel listener (for answerer)
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.dataChannel.onmessage = (msgEvent) => {
        try {
          const message: WebRTCMessage = JSON.parse(msgEvent.data);
          this.onMessageCallback?.(message);
        } catch (error) {
          console.error('Failed to parse WebRTC message:', error);
        }
      };
    };

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  sendMessage(message: WebRTCMessage): void {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    }
  }

  onMessage(callback: (message: WebRTCMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  isConnected(): boolean {
    return this.dataChannel?.readyState === 'open' || false;
  }
}

