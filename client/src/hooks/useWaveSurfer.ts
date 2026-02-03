import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
export const useWaveSurfer = (containerRef: React.RefObject<HTMLDivElement | null>, options: any) => {
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    useEffect(() => {
        if (!containerRef.current) return;
        const ws = WaveSurfer.create({
            container: containerRef.current,
            ...options,
        });

        wavesurfer.current = ws;

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('timeupdate', (time) => setCurrentTime(time));
        ws.on('ready', () => setDuration(ws.getDuration()));
        return () => {
            ws.destroy();
        };
    }, [containerRef, options]);
    return {
        wavesurfer: wavesurfer.current,
        isPlaying,
        currentTime,
        duration,
        playPause: () => wavesurfer.current?.playPause(),
        setTime: (time: number) => wavesurfer.current?.setTime(time),
    };
};
