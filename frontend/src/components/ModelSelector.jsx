/**
 * Music Splitter — Model Selector Component
 *
 * Toggle between 4-stem and 6-stem Demucs models.
 */

import { TargetIcon, SlidersIcon } from './icons';
import './ModelSelector.css';

const MODELS = [
  {
    id: 'htdemucs_ft',
    label: '4 Stems',
    sublabel: 'Fine-tuned',
    stems: ['Vocals', 'Drums', 'Bass', 'Other'],
    description: 'Best quality for standard separation',
    icon: <TargetIcon />,
  },
  {
    id: 'htdemucs_6s',
    label: '6 Stems',
    sublabel: 'Detailed',
    stems: ['Vocals', 'Drums', 'Bass', 'Guitar', 'Piano', 'Other'],
    description: 'Maximum instrument detail',
    icon: <SlidersIcon />,
  },
];

export default function ModelSelector({ selectedModel, onSelectModel }) {
  return (
    <div className="model-selector" id="model-selector">
      <p className="model-selector__label text-caption-uppercase">Select Model</p>
      
      <div className="model-selector__grid">
        {MODELS.map((model) => (
          <button
            key={model.id}
            id={`model-${model.id}`}
            className={`model-card ${selectedModel === model.id ? 'model-card--active' : ''}`}
            onClick={() => onSelectModel(model.id)}
            type="button"
          >
            <div className="model-card__header">
              <span className="model-card__icon">{model.icon}</span>
              <div>
                <span className="model-card__title">{model.label}</span>
                <span className="model-card__sublabel">{model.sublabel}</span>
              </div>
            </div>
            <p className="model-card__description">{model.description}</p>
            <div className="model-card__stems">
              {model.stems.map((stem) => (
                <span key={stem} className="model-card__stem-tag">{stem}</span>
              ))}
            </div>
            {selectedModel === model.id && (
              <div className="model-card__check">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
