/**
 * Retro Cassette Player - Main Application Component
 *
 * Thin shell that provides global styles and renders the TapePlayer.
 */

import { TapePlayer } from './components/TapePlayer';
import { DateTimeWeather } from './components/DateTimeWeather';
import { AIChat } from './components/AIChat';
import './App.css';

function App() {
  return (
    <>
      <DateTimeWeather />
      <TapePlayer />
      <AIChat />
    </>
  );
}

export default App;
