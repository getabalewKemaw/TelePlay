import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
export const useWaveSurfer = (containerRef: React.RefObject<HTMLDivElement | null>, options: any, enabled: boolean = true) => {
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        if (!enabled) {
            if (wavesurfer.current) {
                wavesurfer.current.destroy();
                wavesurfer.current = null;
            }
            setIsReady(false);
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            return;
        }
        let rafId: number | null = null;
        let ws: WaveSurfer | null = null;

        const init = () => {
            if (!containerRef.current) {
                rafId = requestAnimationFrame(init);
                return;
            }
            if (wavesurfer.current) {
                setIsReady(true);
                return;
            }

            ws = WaveSurfer.create({
                container: containerRef.current,
                ...options,
            });

            wavesurfer.current = ws;
            setIsReady(true);

            ws.on('play', () => setIsPlaying(true));
            ws.on('pause', () => setIsPlaying(false));
            ws.on('timeupdate', (time) => setCurrentTime(time));
            ws.on('ready', () => setDuration(ws.getDuration()));
        };

        init();

        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            setIsReady(false);
            ws?.destroy();
            wavesurfer.current = null;
        };
    }, [containerRef, options, enabled]);
    return {
        wavesurferRef: wavesurfer,
        isWaveformReady: isReady,
        isPlaying,
        currentTime,
        duration,
        playPause: () => wavesurfer.current && wavesurfer.current.playPause(),
        setTime: (time: number) => wavesurfer.current && wavesurfer.current.setTime(time),
    };
};
