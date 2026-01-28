import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Clock,
  User,
  Users,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { db } from '../services/db';

const ClassModal = ({ isOpen, onClose, onSave, classToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    instructor: '',
    time: '',
    days: [],
    capacity: 20
  });

  const [instructors, setInstructors] = useState([]);
  const defaultClassTypes = ['Musculação', 'Zumba', 'Pilates', 'Yoga', 'Spinning', 'Crossfit', 'Body Pump', 'Hidroginástica'];

  const [isCustomName, setIsCustomName] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    const loadInstructors = async () => {
      if (isOpen) {
        const data = await db.instructors.getAll() || [];
        setInstructors(Array.isArray(data) ? data : []);
      }
    };
    loadInstructors();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (classToEdit) {
        setFormData(classToEdit);
        if (defaultClassTypes.includes(classToEdit.name)) {
          setSelectedType(classToEdit.name);
          setIsCustomName(false);
        } else {
          setSelectedType('');
          setIsCustomName(true);
        }
      } else {
        setFormData({ name: '', instructor: '', time: '', days: [], capacity: 20 });
        setSelectedType('');
        setIsCustomName(false);
      }
    }
  }, [isOpen, classToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedInst = instructors.find(i => i.name === formData.instructor);
    onSave({ ...formData, instructor_id: selectedInst ? selectedInst.id : null });
    onClose();
    setIsCustomName(false);
    setSelectedType('');
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const days = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in">
        <div className="modal-header">
          <h3>{classToEdit ? 'Editar Aula' : 'Nova Aula de Grupo'}</h3>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} id="classForm">
            <div className="form-group mb-4">
              <label className="mb-2 block">Modalidade</label>
              <div className="class-types-grid mb-3">
                {defaultClassTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`type-chip ${!isCustomName && selectedType === type ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedType(type);
                      setIsCustomName(false);
                      setFormData({ ...formData, name: type });
                    }}
                  >
                    {type}
                  </button>
                ))}
                <button
                  type="button"
                  className={`type-chip dashed ${isCustomName ? 'active' : ''}`}
                  onClick={() => {
                    setIsCustomName(true);
                    setFormData({ ...formData, name: '' });
                  }}
                >
                  + Outro
                </button>
              </div>

              {isCustomName && (
                <div className="custom-input-wrapper animate-fade-in">
                  <input
                    required
                    autoFocus
                    type="text"
                    placeholder="Digite o nome da modalidade..."
                    className="input w-full"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="form-group mb-4">
              <label>Instrutor Responsável</label>
              <select
                required
                className="input w-full"
                value={formData.instructor}
                onChange={e => setFormData({ ...formData, instructor: e.target.value })}
              >
                <option value="">Selecione um instrutor...</option>
                {instructors.map(inst => (
                  <option key={inst.id} value={inst.name}>{inst.name}</option>
                ))}
              </select>
            </div>

            <div className="grid-2 mb-4">
              <div className="form-group">
                <label>Horário de Início</label>
                <input required type="time" className="input w-full" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Capacidade Máx.</label>
                <input required type="number" className="input w-full" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} />
              </div>
            </div>

            <div className="form-group mb-4">
              <label>Dias da Semana</label>
              <div className="days-grid">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                  <button
                    type="button"
                    key={day}
                    className={`day-btn ${(formData.days || []).includes(day) ? 'active' : ''}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button type="submit" form="classForm" className="btn btn-primary">Salvar Aula</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const EnrollmentModal = ({ isOpen, onClose, classData, onSave }) => {
  const [clients, setClients] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadEnrollmentData = async () => {
      if (isOpen && classData) {
        try {
          const allClients = await db.clients.getAll() || [];
          setClients(Array.isArray(allClients) ? allClients : []);

          const freshClasses = await db.classes.getAll();
          const freshClass = Array.isArray(freshClasses) ? freshClasses.find(c => String(c.id) === String(classData.id)) : null;

          const sourceData = freshClass || classData;
          const currentAttendees = Array.isArray(sourceData.attendees) ? sourceData.attendees : [];

          setEnrolled(currentAttendees);
        } catch (error) {
          console.error("Error loading clients or class data:", error);
          setClients([]);
        }
      }
    };
    loadEnrollmentData();
  }, [isOpen, classData]);

  const toggleEnrollment = (clientId) => {
    setEnrolled(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSave = async () => {
    if (enrolled.length > classData.capacity) {
      if (!confirm(`Atenção: Capacidade excedida (${enrolled.length}/${classData.capacity}). Continuar?`)) return;
    }

    try {
      // Usar update async e esperar resposta
      await db.classes.update(classData.id, {
        attendees: enrolled,
        enrolled: enrolled.length
      });

      if (onSave) onSave(); // Callback opcional para refresh sem reload total se possível
      window.location.reload(); // Manter reload por segurança de sync
    } catch (e) {
      alert('Erro ao salvar inscrições: ' + e.message);
    }
  };

  if (!isOpen || !classData) return null;

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>Gerir Inscrições - {classData.name}</h3>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="mb-4">
            <input
              type="text"
              className="input w-full"
              placeholder="Buscar utente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex justify-between mb-2 text-sm text-muted">
            <span>Utentes</span>
            <span>{enrolled.length} / {classData.capacity} Vagas preenchidas</span>
          </div>
          <div className="attendees-list" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
            {filteredClients.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {clients.length === 0 ? 'Nenhum utente registado.' : 'Nenhum utente encontrado.'}
              </div>
            ) : (
              filteredClients.map(client => {
                const isEnrolled = enrolled.includes(client.id);
                return (
                  <div key={client.id} className="attendee-item" onClick={() => toggleEnrollment(client.id)}>
                    <div className="flex items-center gap-2">
                      <div className={`avatar-mini ${isEnrolled ? 'active' : ''}`}>{client.name.charAt(0)}</div>
                      <span>{client.name}</span>
                    </div>
                    <div className={`checkbox-circle ${isEnrolled ? 'checked' : ''}`}>
                      {isEnrolled && <User size={12} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button onClick={handleSave} className="btn btn-primary">Salvar Alterações</button>
        </div>
      </div>
      <style>{`
        .attendee-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; }
        .attendee-item:hover { background: var(--bg-card-hover); }
        .avatar-mini { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-card-hover); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-muted); }
        .avatar-mini.active { background: var(--primary); color: white; }
        .checkbox-circle { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; color: white; }
        .checkbox-circle.checked { background: var(--success); border-color: var(--success); }
      `}</style>
    </div>,
    document.body
  );
};

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [instructors, setInstructors] = useState([]); // Add instructors state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [enrollmentModal, setEnrollmentModal] = useState({ open: false, classData: null });

  useEffect(() => {
    const loadData = async () => {
      try {
        await db.init();
        const [classesData, instructorsData] = await Promise.all([
          db.classes.getAll(),
          db.instructors.getAll()
        ]);
        setClasses(Array.isArray(classesData) ? classesData : []);
        setInstructors(Array.isArray(instructorsData) ? instructorsData : []);
      } catch (e) {
        console.error("Classes load error:", e);
        setClasses([]);
      }
    };
    loadData();
  }, []);

  const handleSaveClass = async (data) => {
    try {
      if (editingClass) {
        await db.classes.update(editingClass.id, data);
      } else {
        await db.classes.create({ ...data, attendees: [], enrolled: 0 });
      }
      window.location.reload();
    } catch (e) {
      alert("Erro ao salvar: " + e.message);
    }
  };

  // Helper para buscar nome do instrutor
  const getInstructorName = (cls) => {
    if (cls.instructor_name) return cls.instructor_name;
    if (cls.instructor_id) {
      const inst = instructors.find(i => String(i.id) === String(cls.instructor_id));
      if (inst) return inst.name;
    }
    return cls.instructor || 'Sem Instrutor';
  };

  const openNewClassModal = () => {
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const openEditClassModal = (cls) => {
    setEditingClass(cls);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza?')) {
      db.classes.delete(id);
      window.location.reload();
    }
  };

  const updateEnrollment = () => {
    // This is called by modal save, but we are using reload(), so this might not be reached before reload.
    setClasses(db.classes.getAll());
  }

  return (
    <div className="classes-page animate-fade-in">
      <div className="page-header">
        <div className="header-title">
          <h2>Sistema de Aulas</h2>
          <p>Horários e marcações de grupo</p>
        </div>
        <button className="btn btn-primary" onClick={openNewClassModal}>
          <Plus size={20} /> Nova Aula
        </button>
      </div>

      <div className="classes-grid">
        {classes.length === 0 ? <p className="text-muted p-4">Nenhuma aula registada.</p> : classes.map((cls) => (
          <div key={cls.id} className="card class-card">
            <div className="card-actions-top">
              <button className="icon-btn" onClick={() => openEditClassModal(cls)}><Edit2 size={16} /></button>
              <button className="icon-btn danger" onClick={() => handleDelete(cls.id)}><Trash2 size={16} /></button>
            </div>

            <div className="class-time-badge">
              <Clock size={16} />
              <span>{cls.time}</span>
            </div>

            <div className="class-content">
              <h3>{cls.name}</h3>
              <div className="instructor-row">
                <User size={16} />
                <span>Instrutor: {getInstructorName(cls)}</span>
              </div>

              <div className="schedule-days">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                  <span
                    key={day}
                    className={`day-pill ${cls.days && cls.days.includes(day) ? 'active' : ''}`}
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div className="capacity-bar-container">
                <div className="capacity-info">
                  <span className="label"><Users size={14} /> Inscritos</span>
                  <span className="value">{cls.attendees ? cls.attendees.length : (cls.enrolled || 0)} / {cls.capacity}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${((cls.attendees ? cls.attendees.length : (cls.enrolled || 0)) / cls.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="class-footer">
              <button
                className="btn btn-secondary full-width"
                onClick={() => setEnrollmentModal({ open: true, classData: cls })}
              >
                Gerir Inscrições
              </button>
            </div>
          </div>
        ))}
      </div>

      <ClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClass}
        classToEdit={editingClass}
      />

      <EnrollmentModal
        isOpen={enrollmentModal.open}
        classData={enrollmentModal.classData}
        onClose={() => setEnrollmentModal({ open: false, classData: null })}
        onSave={updateEnrollment}
      />

      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .class-card { position: relative; display: flex; flex-direction: column; height: 100%; }
        .class-time-badge { position: absolute; top: 1.5rem; right: 1.5rem; display: flex; align-items: center; gap: 0.5rem; background: rgba(249,115,22,0.1); color: var(--primary); padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: 600; font-size: 0.875rem; }
        .class-content { flex: 1; margin-bottom: 1.5rem; }
        .class-content h3 { font-size: 1.25rem; margin-bottom: 0.5rem; margin-right: 4rem; }
        .instructor-row { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
        .schedule-days { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
        .day-pill { font-size: 0.75rem; color: var(--text-muted); opacity: 0.5; padding: 2px 0; }
        .day-pill.active { color: var(--text-main); font-weight: 700; opacity: 1; border-bottom: 2px solid var(--primary); }
        .capacity-bar-container { background: var(--bg-dark); padding: 1rem; border-radius: 8px; }
        .capacity-info { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-muted); }
        .progress-bar { height: 6px; background: var(--bg-card); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--primary); border-radius: 3px; }
        .full-width { width: 100%; }
        .delete-badge { position: absolute; top: 1rem; left: 1rem; background: none; border: none; color: var(--text-muted); cursor: pointer; }
        .delete-badge:hover { color: var(--danger); }
        .card-actions-top { position: absolute; top: 1rem; left: 1rem; display: flex; gap: 0.5rem; }
        .icon-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s; }
        .icon-btn:hover { background: var(--bg-card-hover); color: var(--text-main); }
        .icon-btn.danger:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
        /* Modal tweaks */
        .modal-overlay { 
            position: fixed; inset: 0; background: rgba(0,0,0,0.8); 
            display: flex; align-items: center; justify-content: center; 
            z-index: 99999; backdrop-filter: blur(4px); padding: 1rem; 
        }
        .modal-content { 
            background: var(--bg-card); 
            border-radius: var(--radius); 
            width: 100%; 
            max-width: 500px; 
            border: 1px solid var(--border); 
            max-height: 90vh; /* Limit height */
            display: flex; 
            flex-direction: column; /* Organize header, body, footer */
        }
        .modal-header { 
            padding: 1.5rem; 
            border-bottom: 1px solid var(--border);
            display: flex; justify-content: space-between; align-items: center;
            flex-shrink: 0; /* Never shrink header */
        }
        .modal-body {
            padding: 1.5rem;
            overflow-y: auto; /* Scroll ONLY the body */
            flex-grow: 1;
        }
        .modal-footer { 
            padding: 1rem 1.5rem; 
            border-top: 1px solid var(--border);
            display: flex; justify-content: flex-end; gap: 1rem; 
            flex-shrink: 0; /* Never shrink footer */
        }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .mb-4 { margin-bottom: 1rem; }
        .w-full { width: 100%; }
        .days-grid { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .day-btn { padding: 0.5rem 1rem; background: var(--bg-card-hover); border: 1px solid var(--border); color: var(--text-muted); border-radius: 4px; cursor: pointer; flex: 1; text-align: center; }
        .day-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
        .custom-input-group { display: flex; gap: 0.5rem; align-items: center; }
        .close-btn { background: none; border: none; color: white; cursor: pointer; }
        .class-types-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; }
        .type-chip { padding: 0.5rem 0.25rem; font-size: 0.85rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card-hover); color: var(--text-muted); cursor: pointer; transition: all 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .type-chip:hover { border-color: var(--primary); color: var(--text-main); }
        .type-chip.active { background: var(--primary); color: white; border-color: var(--primary); font-weight: 600; }
        .type-chip.dashed { border-style: dashed; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .block { display: block; }
        .flex { display: flex; }
        .gap-2 { gap: 0.5rem; }
      `}</style>
    </div>
  );
};

export default Classes;