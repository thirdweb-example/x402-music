export interface Track {
  _id?: string;
  trackId: string;
  title: string;
  artist: string;
  description?: string;
  coverUrl: string;
  audioUrl: string;
  price: number;
  createdAt: Date;
}

export interface Stream {
  _id?: string;
  streamId: string;
  trackId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Transaction {
  _id?: string;
  trackId: string;
  streamId: string;
  amount: number;
  createdAt: Date;
}

