import { describe, expect, it } from 'vitest';
import { canAccess } from './api';

const perms = (p: Record<string, string>) => ({ permissions: p });

describe('canAccess (permissões vindas da matriz RBAC da API)', () => {
  it('libera a área quando o perfil tem a operação exigida', () => {
    const gestor = perms({ clientes: 'CRUD', leituras: 'CRD', usuarios: '' });
    expect(canAccess(gestor, 'clientes')).toBe(true);
    expect(canAccess(gestor, 'gerenciarClientes')).toBe(true);
    expect(canAccess(gestor, 'excluirLeituras')).toBe(true);
    expect(canAccess(gestor, 'administracao')).toBe(false);
  });

  it('cliente internacional só consulta, operador não vê clientes', () => {
    const cliente = perms({ clientes: 'R', leituras: 'R' });
    expect(canAccess(cliente, 'clientes')).toBe(true);
    expect(canAccess(cliente, 'gerenciarClientes')).toBe(false);
    expect(canAccess(cliente, 'analises')).toBe(false);
    expect(canAccess(perms({ clientes: '', leituras: 'CR' }), 'clientes')).toBe(false);
  });

  it('sem sessão ou sem permissões, nada é liberado', () => {
    expect(canAccess(null, 'dashboard')).toBe(false);
    expect(canAccess({}, 'dashboard')).toBe(false);
  });
});
