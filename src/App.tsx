/**
 * Retro Cassette Player - Main Application Component
 *
 * Thin shell that provides global styles and renders the TapePlayer.
 */

import { useCallback } from 'react';
import { TapePlayer } from './components/TapePlayer';
import { DateTimeWeather } from './components/DateTimeWeather';
import { AIChat } from './components/AIChat';
import { usePlayerStore } from './stores/playerStore';
import { getMusicSearchService } from './services/musicSearchService';
import './App.css';

function App() {
  // 获取当前播放歌曲信息
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const playlist = usePlayerStore((state) => state.playlist);
  const setPlaylist = usePlayerStore((state) => state.setPlaylist);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const play = usePlayerStore((state) => state.play);

  // 播放指定歌曲
  const handlePlaySong = useCallback(async (songName: string, artist?: string): Promise<boolean> => {
    try {
      const service = getMusicSearchService();
      // 构建搜索关键词
      const keyword = artist ? `${songName} ${artist}` : songName;
      const results = await service.search(keyword, 10);

      if (results.length === 0) {
        return false;
      }

      // 过滤掉VIP歌曲
      const playableResults = results.filter(r => r.fee !== 1);
      if (playableResults.length === 0) {
        return false;
      }

      // 获取第一个可播放的歌曲
      const result = playableResults[0];
      const track = await service.searchResultToTrack(result);
      const trackWithCover = await service.ensureTrackAlbumCover(track, result.id);

      // 添加到播放列表并播放
      const newPlaylist = [...playlist, trackWithCover];
      const newIndex = newPlaylist.length - 1;
      setPlaylist(newPlaylist);
      setCurrentTrack(trackWithCover, newIndex);

      setTimeout(() => {
        play();
      }, 100);

      return true;
    } catch (error) {
      console.error('AI play song error:', error);
      return false;
    }
  }, [playlist, setPlaylist, setCurrentTrack, play]);

  // 随机播放
  const handleRandomPlay = useCallback(async (): Promise<boolean> => {
    try {
      const service = getMusicSearchService();
      const track = await service.getRandomSong();

      const newPlaylist = [...playlist, track];
      const newIndex = newPlaylist.length - 1;
      setPlaylist(newPlaylist);
      setCurrentTrack(track, newIndex);

      setTimeout(() => {
        play();
      }, 100);

      return true;
    } catch (error) {
      console.error('AI random play error:', error);
      return false;
    }
  }, [playlist, setPlaylist, setCurrentTrack, play]);

  return (
    <>
      <DateTimeWeather />
      <TapePlayer />
      <AIChat
        currentTrackName={currentTrack?.name}
        currentArtist={currentTrack?.artist}
        onPlaySong={handlePlaySong}
        onRandomPlay={handleRandomPlay}
      />
    </>
  );
}

export default App;
