/**
 * Retro Cassette Player - Main Application Component
 *
 * Thin shell that provides global styles and renders the TapePlayer.
 */

import { TapePlayer } from './components/TapePlayer';
import { DateTimeWeather } from './components/DateTimeWeather';
import { AIChat } from './components/AIChat';
import { usePlayerStore } from './stores/playerStore';
import './App.css';

function App() {
  // 获取当前播放歌曲信息
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  return (
    <>
      <DateTimeWeather />
      <TapePlayer />
      <AIChat
        currentTrackName={currentTrack?.name}
        currentArtist={currentTrack?.artist}
      />
    </>
  );
}

export default App;
