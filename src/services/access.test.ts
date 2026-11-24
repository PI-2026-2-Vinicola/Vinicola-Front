import { describe, expect, it } from 'vitest';
import { canAccess } from './api';

const perms = (p: Record<string, string>) => ({ permissions: p });

describe('canAccess (permissões vindas da matriz RBAC da API)', () => {
  it('libera a área quando o perfil tem a operação exigida', () => {
    const gestor = perms({ sensores: 'CRUD', leituras: 'CRD', importacoes: 'CR', usuarios: '' });
    expect(canAccess(gestor, 'gerenciarSensores')).toBe(true);
    expect(canAccess(gestor, 'importacao')).toBe(true);
    expect(canAccess(gestor, 'excluirLeituras')).toBe(true);
    expect(canAccess(gestor, 'administracao')).toBe(false);
  });

  it('operador envia imagens, mas não cadastra sensores nem importa', () => {
    const operador = perms({ sensores: 'R', leituras: 'CR', importacoes: '' });
    expect(canAccess(operador, 'analises')).toBe(true);
    expect(canAccess(operador, 'sensores')).toBe(true);
    expect(canAccess(operador, 'gerenciarSensores')).toBe(false);
    expect(canAccess(operador, 'importacao')).toBe(false);
    expect(canAccess(operador, 'excluirLeituras')).toBe(false);
  });

  it('sem sessão ou sem permissões, nada é liberado', () => {
    expect(canAccess(null, 'dashboard')).toBe(false);
    expect(canAccess({}, 'dashboard')).toBe(false);
  });
});
