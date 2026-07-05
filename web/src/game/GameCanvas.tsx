import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

import { DawnScene, VIEW_HEIGHT, VIEW_WIDTH } from './scenes/DawnScene';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      parent: containerRef.current,
      backgroundColor: '#68ab3c',
      scene: [DawnScene],
      fps: { target: 60, forceSetTimeOut: false },
      render: { pixelArt: true, antialias: false, roundPixels: true },
      scale: { mode: Phaser.Scale.NONE },
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div className="game-canvas" ref={containerRef} />;
}
