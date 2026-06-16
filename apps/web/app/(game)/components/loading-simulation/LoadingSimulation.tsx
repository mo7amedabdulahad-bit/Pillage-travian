import { useEffect, useRef, useState } from 'react';
import './LoadingSimulation.css';

const GAMING_MESSAGES = [
  { text: 'The village elders are gathering...', icon: 'elders' },
  { text: 'Scouts reporting from the frontier...', icon: 'scouts' },
  { text: 'Training grounds are bustling...', icon: 'training' },
  { text: 'The blacksmith hammers away...', icon: 'forge' },
  { text: 'Merchants loading their caravans...', icon: 'merchants' },
  { text: 'The watchtower keeps vigil...', icon: 'watchtower' },
  { text: 'Farmers harvesting the fields...', icon: 'harvest' },
  { text: 'Troops mustering at the gates...', icon: 'troops' },
  { text: 'Scribes recording the chronicles...', icon: 'scribes' },
  { text: 'The kingdom stirs to life...', icon: 'kingdom' },
];

interface LoadingSimulationProps {
  progress?: number;
}

export const LoadingSimulation = ({ progress = 0 }: LoadingSimulationProps) => {
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const progressRef = useRef(0);

  useEffect(() => {
    if (progress > 0) {
      return;
    }

    const interval = setInterval(() => {
      const current = progressRef.current;
      if (current >= 100) {
        clearInterval(interval);
        return;
      }

      const remaining = 100 - current;
      const increment = Math.max(0.3, remaining * 0.04);
      const next = Math.min(100, current + increment);
      progressRef.current = next;
      setSimulatedProgress(next);
    }, 50);

    return () => clearInterval(interval);
  }, [progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % GAMING_MESSAGES.length);
        setIsFading(false);
      }, 200);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const displayProgress = progress > 0 ? progress : simulatedProgress;
  const currentMessage = GAMING_MESSAGES[messageIndex];

  return (
    <div className="loading-simulation">
      <div className="loading-simulation__content">
        <div className="loading-simulation__emblem">
          <div className="loading-simulation__emblem-ring" />
          <div className="loading-simulation__emblem-icon">⚔</div>
        </div>

        <h2 className="loading-simulation__title">Pillage First!</h2>

        <p className="loading-simulation__subtitle">
          Preparing your adventure...
        </p>

        <div className="loading-simulation__bar-container">
          <div className="loading-simulation__bar-track">
            <div
              className="loading-simulation__bar-fill"
              style={{ width: `${Math.min(100, displayProgress)}%` }}
            />
            <div className="loading-simulation__bar-shine" />
          </div>
          <span className="loading-simulation__percentage">
            {Math.round(Math.min(100, displayProgress))}%
          </span>
        </div>

        <p
          className={`loading-simulation__message ${isFading ? 'loading-simulation__message--fading' : ''}`}
        >
          {currentMessage.text}
        </p>

        <div className="loading-simulation__hints">
          <span className="loading-simulation__hint">
            Tip: Pillage your neighbors before asking questions
          </span>
        </div>
      </div>
    </div>
  );
};
