import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import './services/supabase'
import { LevelUpProvider } from './context/LevelUpContext'


function Root() {
  return (
    <LevelUpProvider>
      <App />
    </LevelUpProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />,
)