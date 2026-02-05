'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Music, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const STORAGE_KEYS = {
  enabled: 'dd_music_enabled',
  volume: 'dd_music_volume',
  trackIndex: 'dd_music_track_index',
};

const DEFAULT_VOLUME = 0.35;

type Track = {
  title: string;
  src: string;
};

const PLAYLIST: Track[] = [
  { title: 'Gaming Track', src: '/audio/gaming-track.mp3' },
  { title: 'Ambient Background', src: '/audio/ambient-background.mp3' },
  { title: 'Creeping Trap Gaming Track', src: '/audio/creeping-trap-gaming-track.mp3' },
  { title: 'Need For Guidance', src: '/audio/need-for-guidance.mp3' },
  { title: 'Rap Violin Freedom', src: '/audio/rap-violin-freedom.mp3' },
  { title: 'My Suga', src: '/audio/my-suga.mp3' },
  { title: 'Afro Type Vee Jayy', src: '/audio/afro-type-vee-jayy.mp3' },
  { title: 'Trap Hype Beat', src: '/audio/trap-hype-beat.mp3' },
  { title: 'New Age Nature', src: '/audio/new-age-nature.mp3' },
  { title: 'GBE Body', src: '/audio/gbe-body.mp3' },
  { title: 'Dream Catcher', src: '/audio/dream-catcher.mp3' },
];

function getRandomIndex(max: number, excludeIndex: number) {
  if (max <= 1) return excludeIndex;
  let next = excludeIndex;
  let guard = 0;
  while (next === excludeIndex && guard < 10) {
    next = Math.floor(Math.random() * max);
    guard += 1;
  }
  return next;
}

export default function BackgroundMusicControls({ className = '' }: { className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [trackIndex, setTrackIndex] = useState(0);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentTrack = useMemo(() => PLAYLIST[trackIndex], [trackIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedEnabled = localStorage.getItem(STORAGE_KEYS.enabled);
    const storedVolume = localStorage.getItem(STORAGE_KEYS.volume);
    const storedTrackIndex = localStorage.getItem(STORAGE_KEYS.trackIndex);

    if (storedEnabled !== null) {
      setEnabled(storedEnabled === 'true');
    }
    if (storedVolume) {
      const value = Number(storedVolume);
      if (!Number.isNaN(value)) {
        setVolume(Math.min(1, Math.max(0, value)));
      }
    }
    if (storedTrackIndex) {
      const value = Number(storedTrackIndex);
      if (!Number.isNaN(value) && value >= 0 && value < PLAYLIST.length) {
        setTrackIndex(value);
      }
    }

    setHasLoadedPrefs(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPrefs || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.enabled, String(enabled));
  }, [enabled, hasLoadedPrefs]);

  useEffect(() => {
    if (!hasLoadedPrefs || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.volume, String(volume));
  }, [volume, hasLoadedPrefs]);

  useEffect(() => {
    if (!hasLoadedPrefs || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.trackIndex, String(trackIndex));
  }, [trackIndex, hasLoadedPrefs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }

    const audio = audioRef.current;
    audio.src = currentTrack?.src ?? '';
    audio.loop = false;

    const handleEnded = () => {
      if (PLAYLIST.length > 1) {
        setTrackIndex((prev) => getRandomIndex(PLAYLIST.length, prev));
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
      if (PLAYLIST.length > 1) {
        setTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const attemptPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setNeedsInteraction(false);
    } catch (error) {
      setNeedsInteraction(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedPrefs) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (!enabled) {
      audio.pause();
      return;
    }

    attemptPlay();
  }, [enabled, trackIndex, attemptPlay, hasLoadedPrefs]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      setNeedsInteraction(false);
    }
  };

  const handlePlayClick = async () => {
    if (!enabled) {
      setEnabled(true);
    }
    await attemptPlay();
  };

  if (PLAYLIST.length === 0) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border bg-muted/30 p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Music className="h-4 w-4 text-primary" />
          Background Music
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Off</span>
          <Switch checked={enabled} onCheckedChange={handleToggle} />
          <span className="text-xs text-muted-foreground">On</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="h-4 w-4" />
          Volume
        </div>
        <div className="flex-1 min-w-[160px]">
          <Slider
            value={[Math.round(volume * 100)]}
            onValueChange={(values) => setVolume(values[0] / 100)}
            min={0}
            max={100}
            step={1}
          />
        </div>
        <Button size="sm" variant="secondary" onClick={handlePlayClick} disabled={isPlaying}>
          {isPlaying ? 'Music Playing' : 'Play Music'}
        </Button>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Now playing: {currentTrack?.title ?? 'Unknown Track'}
        {needsInteraction ? ' · Tap Play Music to start audio.' : ''}
      </div>
    </div>
  );
}
