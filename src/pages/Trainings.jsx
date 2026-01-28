import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Dumbbell,
  Clock,
  Activity,
  MoreVertical,
  Play,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { db } from '../services/db';

const TrainingModal = ({ isOpen, onClose, onSave, trainingToEdit }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Musculação',
    duration: '',
    difficulty: 'Iniciante',
    exercises: 1,
    days: []
  });

  const [isCustomType, setIsCustomType] = useState(false);
  const [selectedType, setSelectedType] = useState('Musculação');

  const defaultTypes = ['Musculação', 'Cardio', 'Flexibilidade', 'Funcional', 'Crossfit', 'Powerlifting', 'Calistenia'];

  useEffect(() => {
    if (isOpen) {
      if (trainingToEdit) {
        setFormData(trainingToEdit);
        if (defaultTypes.includes(trainingToEdit.type)) {
          setSelectedType(trainingToEdit.type);
          setIsCustomType(false);
        } else {
          setSelectedType('');
          setIsCustomType(true);
        }
      } else {
        setFormData({ title: '', type: 'Musculação', duration: '', difficulty: 'Iniciante', exercises: 1, days: [] });
        setSelectedType('Musculação');
        setIsCustomType(false);
      }
    }
  }, [isOpen, trainingToEdit]);

  const handleTypeSelect = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomType(true);
      setFormData({ ...formData, type: '' });
    } else {
      setIsCustomType(false);
      setSelectedType(val);
      setFormData({ ...formData, type: val });
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const currentDays = prev.days || [];
      const days = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
      return { ...prev, days };
    });
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
    // Reset
    setIsCustomType(false);
    setSelectedType('Musculação');
    setFormData({ title: '', type: 'Musculação', duration: '', difficulty: 'Iniciante', exercises: 1, days: [] });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3>{trainingToEdit ? 'Editar Treino' : 'Novo Plano de Treino'}</h3>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <form id="trainingForm" onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <label>Título do Treino</label>
              <input required type="text" className="input w-full" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>

            <div className="form-group mb-4">
              <label>Tipo de Treino</label>
              {!isCustomType ? (
                <select className="input w-full" value={selectedType} onChange={handleTypeSelect}>
                  {defaultTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="custom">+ Novo Tipo</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    required
                    autoFocus
                    className="input w-full"
                    placeholder="Ex: Treino Híbrido"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  />
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCustomType(false)}>Cancelar</button>
                </div>
              )}
            </div>

            <div className="grid-2 mb-4">
              <div className="form-group">
                <label>Duração (min/h)</label>
                <input required type="text" className="input w-full" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Nº Exercícios</label>
                <input required type="number" className="input w-full" value={formData.exercises} onChange={e => setFormData({ ...formData, exercises: e.target.value })} />
              </div>
            </div>

            <div className="form-group mb-4">
              <label>Dificuldade</label>
              <select className="input w-full" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                <option>Iniciante</option>
                <option>Intermédio</option>
                <option>Avançado</option>
              </select>
            </div>

            <div className="form-group mb-4">
              <label>Dias Sugeridos (Opcional)</label>
              <div className="days-grid">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                  <button
                    type="button"
                    key={day}
                    className={`day-btn ${formData.days && formData.days.includes(day) ? 'active' : ''}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button type="submit" form="trainingForm" className="btn btn-primary">Salvar Treino</button>
        </div>
      </div>
      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 1rem; }
        /* Fix para evitar corte em ecrãs pequenos: se o modal crescer muito, margin auto ajuda */
        .modal-content { background: var(--bg-card); border-radius: var(--radius); width: 100%; max-width: 500px; border: 1px solid var(--border); max-height: 90vh; display: flex; flex-direction: column; }
        .modal-body { overflow-y: auto; padding: 1.5rem; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .mb-4 { margin-bottom: 1rem; }
        .w-full { width: 100%; }
        .days-grid { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .day-btn { padding: 0.5rem 1rem; background: var(--bg-card-hover); border: 1px solid var(--border); color: var(--text-muted); border-radius: 4px; cursor: pointer; flex: 1; text-align: center; }
        .day-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
        .flex { display: flex; }
        .gap-2 { gap: 0.5rem; }
      `}</style>
    </div>
  );
};

const Trainings = () => {
  const [trainings, setTrainings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      await db.init();
      const data = await db.trainings.getAll();
      setTrainings(Array.isArray(data) ? data : []);
    };
    fetchData();
  }, []);

  const handleSaveTraining = (data) => {
    if (editingTraining) {
      db.trainings.update(editingTraining.id, data);
    } else {
      db.trainings.create(data);
    }
    setTrainings(db.trainings.getAll());
    setEditingTraining(null);
    setIsModalOpen(false);
  };

  const openNewTrainingModal = () => {
    setEditingTraining(null);
    setIsModalOpen(true);
  };

  const openEditTrainingModal = (training) => {
    setEditingTraining(training);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza?')) {
      db.trainings.delete(id);
      setTrainings(db.trainings.getAll());
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Iniciante': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Intermédio': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Avançado': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="trainings-page animate-fade-in">
      <div className="page-header">
        <div className="header-title">
          <h2>Gestão de Treinos</h2>
          <p>Planos de treino e exercícios</p>
        </div>
        <button className="btn btn-primary" onClick={openNewTrainingModal}>
          <Plus size={20} /> Novo Treino
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input type="text" placeholder="Pesquisar treinos..." className="input search-input" />
        </div>
      </div>

      <div className="trainings-grid">
        {trainings.length === 0 ? <p className="text-muted p-4">Sem treinos registados.</p> : trainings.map((training) => (
          <div key={training.id} className="card training-card">
            <div className="card-header">
              <div className="icon-bg">
                <Dumbbell size={24} />
              </div>
              <div className="card-actions-row">
                <button className="icon-btn" onClick={() => openEditTrainingModal(training)}>
                  <Edit2 size={20} />
                </button>
                <button className="icon-btn danger" onClick={() => handleDelete(training.id)}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="card-content">
              <h3>{training.title}</h3>
              <span className="type-badge">{training.type}</span>

              <div className="meta-info">
                <div className="meta-item">
                  <Clock size={16} />
                  <span>{training.duration}</span>
                </div>
                <div className="meta-item">
                  <Activity size={16} />
                  <span>{training.exercises} Exercícios</span>
                </div>
              </div>

              <div className="difficulty-row">
                <span className={`diff-badge \${getDifficultyColor(training.difficulty)}`}>
                  {training.difficulty}
                </span>
                {training.days && training.days.length > 0 && (
                  <div className="days-tag-list" style={{ marginTop: '0.5rem', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {training.days.map(d => (
                      <span key={d} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{d}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card-footer">
              <button
                className="btn btn-secondary full-width"
                onClick={() => openEditTrainingModal(training)}
              >
                <Play size={16} /> Ver Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      <TrainingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTraining}
        trainingToEdit={editingTraining}
      />

      <style>{`
        /* Reuse styles */
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .trainings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .training-card { display: flex; flex-direction: column; height: 100%; }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .icon-bg { width: 48px; height: 48px; border-radius: 12px; background-color: var(--bg-card-hover); color: var(--primary); display: flex; align-items: center; justify-content: center; }
        .card-content { flex: 1; }
        .card-content h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
        .type-badge { display: inline-block; font-size: 0.75rem; color: var(--text-muted); background-color: var(--bg-dark); padding: 0.25rem 0.5rem; border-radius: 4px; margin-bottom: 1rem; }
        .meta-info { display: flex; gap: 1rem; margin-bottom: 1rem; color: var(--text-muted); font-size: 0.875rem; }
        .meta-item { display: flex; align-items: center; gap: 0.5rem; }
        .diff-badge { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; border: 1px solid; }
        .text-green-500 { color: var(--success); }
        .bg-green-500\\/10 { background-color: rgba(16, 185, 129, 0.1); }
        .border-green-500\\/20 { border-color: rgba(16, 185, 129, 0.2); }
        .card-footer { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
        .full-width { width: 100%; }
        .card-actions-row { display: flex; gap: 0.5rem; }
        .icon-btn:hover { background: var(--bg-card-hover); color: var(--text-main); }
        .icon-btn.danger:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
      `}</style>
    </div>
  );
};

export default Trainings;
