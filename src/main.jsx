import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0A0F1E; color: #F8FAFC;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.18); }

  a { text-decoration: none; color: inherit; }
  button { font-family: inherit; }
  input, select, textarea { font-family: inherit; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }

  ::selection { background: rgba(59,130,246,.3); color: #F8FAFC; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
