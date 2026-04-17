/**
 * Retro Cassette Player - Main Application Component
 *
 * Thin shell that provides global styles and renders the TapePlayer.
 */

import { TapePlayer } from './components/TapePlayer';
import './App.css';

function App() {
  return <TapePlayer />;
}

export default App;
