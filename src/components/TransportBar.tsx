import { Download, Pause, Play, RefreshCw } from "lucide-react";

type TransportBarProps = {
  isPlaying: boolean;
  loopEnabled: boolean;
  onTogglePlayback: () => void;
  onLoopToggle: () => void;
  onExportWav: () => void;
};

export function TransportBar({
  isPlaying,
  loopEnabled,
  onTogglePlayback,
  onLoopToggle,
  onExportWav,
}: TransportBarProps) {
  return (
    <div className="transport">
      <button className="icon-button" title={isPlaying ? "Stop" : "Play"} onClick={onTogglePlayback}>
        {isPlaying ? <Pause size={19} /> : <Play size={19} />}
      </button>
      <button className={`toggle ${loopEnabled ? "enabled" : ""}`} onClick={onLoopToggle}>
        <RefreshCw size={16} />
        Loop
      </button>
      <button className="ghost" onClick={onExportWav}>
        <Download size={16} />
        WAV
      </button>
    </div>
  );
}
