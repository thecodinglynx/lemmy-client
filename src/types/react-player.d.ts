declare module 'react-player' {
  import { Component, ReactNode } from 'react';

  export interface ReactPlayerProps {
    url?: string | string[] | MediaStream | File;
    playing?: boolean;
    loop?: boolean;
    controls?: boolean;
    volume?: number;
    muted?: boolean;
    playbackRate?: number;
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
    progressInterval?: number;
    playsinline?: boolean;
    pip?: boolean;
    onReady?: () => void;
    onStart?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onEnded?: () => void;
    onError?: (error: any) => void;
    onBuffer?: () => void;
    onBufferEnd?: () => void;
    onSeek?: (seconds: number) => void;
    onProgress?: (state: any) => void;
    onDuration?: (duration: number) => void;
    onPlaybackRateChange?: (rate: number) => void;
    onPlaybackQualityChange?: (quality: string) => void;
    config?: any;
  }

  export default class ReactPlayer extends Component<ReactPlayerProps> {
    seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
    getCurrentTime(): number;
    getSecondsLoaded(): number;
    getDuration(): number;
    getInternalPlayer(): any;
    showPreview(): void;
  }
}
