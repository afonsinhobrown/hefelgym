import React, { useState, useEffect } from 'react';
import {
  Plus,
  Check,
  CreditCard
} from 'lucide-react';
import { db } from '../services/db';

const Plans = () => {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const loadPlans = async () => {
      await db.init();
      const data = await db.plans.getAll();
      setPlans(Array.isArray(data) ? data : []);
    };
    loadPlans();
  }, []);

  return (
    <div className="plans-page animate-fade-in">
      <div className="page-header">
        <div className="header-title">
          <h2>Planos de Subscrição</h2>
          <p>Gerir pacotes e preços</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={20} /> Novo Plano
        </button>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`card plan-card border-${plan.color}`}>
            <div className="card-header">
              <h3 className={`text-${plan.color}`}>{plan.name}</h3>
              <div className="price-tag">
                <span className="amount">{plan.price.toLocaleString('pt-MZ')} MT</span>
                <span className="period">/ {plan.duration}</span>
              </div>
            </div>


            <div className="card-body">
              <ul className="features-list">
                {(plan.features || []).map((feature, index) => (
                  <li key={index}>
                    <Check size={16} className={`check-icon text-${plan.color}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-footer">
              <button className={`btn btn-outline full-width btn-${plan.color}`}>
                Editar Plano
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .header-title h2 { font-size: 1.8rem; margin-bottom: 0.25rem; }
        .header-title p { color: var(--text-muted); }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .plan-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          border-top-width: 4px;
          padding: 2rem;
        }

        .plan-card.border-orange { border-top-color: #f97316; }
        .plan-card.border-blue { border-top-color: #3b82f6; }
        .plan-card.border-purple { border-top-color: #a855f7; }

        .text-orange { color: #f97316; }
        .text-blue { color: #3b82f6; }
        .text-purple { color: #a855f7; }

        .card-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border);
        }

        .card-header h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .price-tag {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.5rem;
        }

        .amount {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .period {
          color: var(--text-muted);
          font-size: 1rem;
        }

        .card-body { flex: 1; }

        .features-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .features-list li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-muted);
        }

        .check-icon { flex-shrink: 0; }

        .card-footer { margin-top: 2rem; }

        .full-width { width: 100%; }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-main);
        }
        
        .btn-outline:hover {
          border-color: currentColor;
          background: rgba(255,255,255,0.05);
        }

        .btn-orange:hover { color: #f97316; border-color: #f97316; background: rgba(249,115,22,0.1); }
        .btn-blue:hover { color: #3b82f6; border-color: #3b82f6; background: rgba(59,130,246,0.1); }
        .btn-purple:hover { color: #a855f7; border-color: #a855f7; background: rgba(168,85,247,0.1); }

      `}</style>
    </div>
  );
};

export default Plans;
