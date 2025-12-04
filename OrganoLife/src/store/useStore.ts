import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  imagem: string;
  produtorId: string;
  produtorNome: string;
}

export interface ItemCarrinho {
  produto: Produto;
  qtd: number;
}

export interface Pedido {
  id: string;
  itens: ItemCarrinho[];
  total: number;
  status: 'aguardando' | 'preparo' | 'enviado' | 'entregue';
  clienteNome: string;
  data: string;
}

interface StoreState {
  user: { uid: string; nome: string; email: string; role: 'cliente' | 'produtor' } | null;
  produtos: Produto[];
  carrinho: ItemCarrinho[];
  pedidos: Pedido[];
  
  login: (email: string, role: 'cliente' | 'produtor') => void;
  logout: () => void;
  adicionarProduto: (p: Omit<Produto, 'id'>) => void;
  editarProduto: (id: string, novo: Produto) => void;
  excluirProduto: (id: string) => void;
  adicionarAoCarrinho: (produto: Produto) => void;
  removerDoCarrinho: (id: string) => void;
  aumentarQtd: (id: string) => void;
  diminuirQtd: (id: string) => void;
  limparCarrinho: () => void;
  finalizarPedido: (clienteNome: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      produtos: [],
      carrinho: [],
      pedidos: [],

      login: (email, role) => set({
        user: {
          uid: Date.now().toString(),
          nome: role === 'produtor' ? 'Produtor Local' : 'Cliente Local',
          email,
          role
        }
      }),

      logout: () => set({ user: null, carrinho: [] }),

      adicionarProduto: (produto) => set((state) => ({
        produtos: [...state.produtos, { ...produto, id: Date.now().toString() }]
      })),

      editarProduto: (id, novo) => set((state) => ({
        produtos: state.produtos.map(p => p.id === id ? novo : p)
      })),

      excluirProduto: (id) => set((state) => ({
        produtos: state.produtos.filter(p => p.id !== id)
      })),

      adicionarAoCarrinho: (produto) => set((state) => {
        const existe = state.carrinho.find(i => i.produto.id === produto.id);
        if (existe) {
          return {
            carrinho: state.carrinho.map(i =>
              i.produto.id === produto.id ? { ...i, qtd: i.qtd + 1 } : i
            )
          };
        }
        return { carrinho: [...state.carrinho, { produto, qtd: 1 }] };
      }),

      removerDoCarrinho: (id) => set((state) => ({
        carrinho: state.carrinho.filter(i => i.produto.id !== id)
      })),

      aumentarQtd: (id) => set((state) => ({
        carrinho: state.carrinho.map(i =>
          i.produto.id === id ? { ...i, qtd: i.qtd + 1 } : i
        )
      })),

      diminuirQtd: (id) => set((state) => {
        const item = state.carrinho.find(i => i.produto.id === id);
        if (item && item.qtd === 1) {
          return { carrinho: state.carrinho.filter(i => i.produto.id !== id) };
        }
        return {
          carrinho: state.carrinho.map(i =>
            i.produto.id === id ? { ...i, qtd: i.qtd - 1 } : i
          )
        };
      }),

      limparCarrinho: () => set({ carrinho: [] }),

      finalizarPedido: (clienteNome) => {
        const { carrinho } = get();
        const total = carrinho.reduce((s, i) => s + i.produto.preco * i.qtd, 0);
        const novoPedido: Pedido = {
          id: Date.now().toString(),
          itens: carrinho,
          total,
          status: 'aguardando',
          clienteNome,
          data: new Date().toLocaleDateString('pt-BR')
        };
        set((state) => ({
          pedidos: [...state.pedidos, novoPedido],
          carrinho: []
        }));
      }
    }),
    {
      name: 'organolife-local-storage',
    }
  )
);