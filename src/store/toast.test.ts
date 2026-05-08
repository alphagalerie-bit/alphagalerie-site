import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from './toast';
import type { ItemCarrinho } from '../types';

const mockItem: ItemCarrinho = {
  id: 1,
  cartKey: '1',
  nome: 'Produto Teste',
  marca: 'Marca',
  categoria: 'Cat',
  preco: 100,
  imagem: null,
  estoque: 10,
  qtd: 1,
};

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.setState({ item: null, visible: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useToastStore', () => {
  it('sets item and visible on showToast', () => {
    useToastStore.getState().showToast(mockItem);

    expect(useToastStore.getState().item).toEqual(mockItem);
    expect(useToastStore.getState().visible).toBe(true);
  });

  it('hides after 2500ms', () => {
    useToastStore.getState().showToast(mockItem);

    vi.advanceTimersByTime(2500);

    expect(useToastStore.getState().visible).toBe(false);
  });

  it('clears item 300ms after hiding', () => {
    useToastStore.getState().showToast(mockItem);

    vi.advanceTimersByTime(2800);

    expect(useToastStore.getState().item).toBeNull();
  });

  it('hideToast sets visible false immediately', () => {
    useToastStore.getState().showToast(mockItem);
    useToastStore.getState().hideToast();

    expect(useToastStore.getState().visible).toBe(false);
    expect(useToastStore.getState().item).toEqual(mockItem);
  });
});