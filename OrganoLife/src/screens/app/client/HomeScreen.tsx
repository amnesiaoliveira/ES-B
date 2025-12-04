import { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../../store/useStore';

export default function HomeScreen() {
  const { produtos, adicionarAoCarrinho } = useStore();
  const [busca, setBusca] = useState('');
  const [filtroPreco, setFiltroPreco] = useState<'todos' | 'barato' | 'medio' | 'caro'>('todos');

  // Filtra produtos com base na busca e no filtro de preço
  const produtosFiltrados = produtos.filter(produto => {
    const nomeMatch = produto.nome.toLowerCase().includes(busca.toLowerCase());
    const descMatch = produto.descricao?.toLowerCase().includes(busca.toLowerCase()) || false;

    if (filtroPreco === 'todos') return nomeMatch || descMatch;
    if (filtroPreco === 'barato') return (nomeMatch || descMatch) && produto.preco <= 15;
    if (filtroPreco === 'medio') return (nomeMatch || descMatch) && produto.preco > 15 && produto.preco <= 40;
    if (filtroPreco === 'caro') return (nomeMatch || descMatch) && produto.preco > 40;

    return nomeMatch || descMatch;
  });

  const renderProduto = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl overflow-hidden mb-5 shadow-xl mx-1">
      <Image
        source={{ uri: item.imagem }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-800">{item.nome}</Text>
        <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
          {item.descricao || 'Produto orgânico fresco direto do produtor'}
        </Text>
        <View className="flex-row justify-between items-center mt-3">
          <View>
            <Text className="text-2xl font-bold text-primary">
              R$ {item.preco.toFixed(2)}
            </Text>
            <Text className="text-xs text-gray-500">
              Estoque: {item.quantidade} unid.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => adicionarAoCarrinho(item)}
            className="bg-primary px-6 py-3 rounded-full flex-row items-center gap-2"
          >
            <Ionicons name="cart" size={20} color="white" />
            <Text className="text-white font-bold">Adicionar</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-gray-500 mt-3">
          Por: {item.produtorNome}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4">
        {/* Header */}
        <Text className="text-3xl font-bold text-primary mb-2">OrganoLife</Text>
        <Text className="text-lg text-gray-700 mb-6">
          Produtos orgânicos direto do produtor
        </Text>

        {/* Barra de Busca */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-4 shadow">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            placeholder="Buscar produtos..."
            value={busca}
            onChangeText={setBusca}
            className="flex-1 ml-3"
          />
          {busca ? (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filtro por preço */}
        <View className="flex-row gap-3 mb-5">
          {(['todos', 'barato', 'medio', 'caro'] as const).map((tipo) => (
            <TouchableOpacity
              key={tipo}
              onPress={() => setFiltroPreco(tipo)}
              className={`px-5 py-2 rounded-full border-2 ${
                filtroPreco === tipo
                  ? 'bg-primary border-primary'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`font-semibold ${
                filtroPreco === tipo ? 'text-white' : 'text-gray-700'
              }`}>
                {tipo === 'todos' ? 'Todos' : 
                 tipo === 'barato' ? 'Até R$15' :
                 tipo === 'medio' ? 'R$15–40' : 'Acima R$40'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista de Produtos */}
        {produtosFiltrados.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <Ionicons name="leaf-outline" size={80} color="#ccc" />
            <Text className="text-xl text-gray-500 mt-6 text-center">
              Nenhum produto encontrado
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Tente mudar o filtro ou cadastrar produtos como produtor
            </Text>
          </View>
        ) : (
          <FlatList
            data={produtosFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={renderProduto}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}