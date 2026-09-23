import { Link } from 'react-router-dom';
import { Brand } from '../ui/Logo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand />
            <p className="footer-about">
              Observação Agroambiental Sensorizada, Inteligente e Sustentável. IoT, Inteligência Artificial e visão computacional para transformar imagens do cultivo em
              informações sobre as uvas.
            </p>
          </div>
          <div>
            <h4>Plataforma</h4>
            <ul>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/sensores">Sensores IoT</Link></li>
              <li><Link to="/analises">Análises</Link></li>
              <li><Link to="/historico">Histórico</Link></li>
            </ul>
          </div>
          <div>
            <h4>Conhecimento</h4>
            <ul>
              <li><Link to="/uvas">Conheça nossas uvas</Link></li>
              <li><Link to="/sobre">Como a OSAIS funciona</Link></li>
              <li><Link to="/sobre#vale">Vale do São Francisco</Link></li>
              <li><Link to="/sobre#tecnologias">Tecnologias</Link></li>
            </ul>
          </div>
          <div>
            <h4>Projeto</h4>
            <ul>
              <li>Projeto Integrador</li>
              <li>Inteligência de Dados no Vale do São Francisco</li>
              <li><Link to="/login">Entrar na plataforma</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} OSAIS · Projeto Integrador — Inteligência de Dados no Vale do São Francisco</span>
          <span>Observar → Sensorizar → Analisar → Inteligir → Sustentar</span>
        </div>
      </div>
    </footer>
  );
}
