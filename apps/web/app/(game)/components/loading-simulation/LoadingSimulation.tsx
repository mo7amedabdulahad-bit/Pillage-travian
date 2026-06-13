import { useEffect, useState } from 'react';
import './LoadingSimulation.css';

const STATUS_MESSAGES = [
  'Simulating world growth...',
  'Processing faction activity...',
  'Resolving battles...',
  'Calculating offline events...',
  'Regenerating troops...',
  'Updating aggression states...',
];

interface LoadingSimulationProps {
  progress?: number;
}

/**
 * Loading screen displayed during NPC Brain simulation at app open.
 * Shows a progress bar and cycling status messages.
 */
export const LoadingSimulation = ({ progress = 0 }: LoadingSimulationProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-simulation">
      <div className="loading-simulation__content">
        <div className="loading-simulation__spinner" />
        <h2 className="loading-simulation__title">Loading Game Events...</h2>
        <p className="loading-simulation__message">
          {STATUS_MESSAGES[messageIndex]}
        </p>
        <div className="loading-simulation__progress-bar">
          <div
            className="loading-simulation__progress-fill"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
