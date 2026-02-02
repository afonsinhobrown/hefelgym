import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/design_system.css'

import { db } from './services/db'

// Inicializar base de dados (Modo Local vs Cloud)
db.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
