import { View, Text, SafeAreaView, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../../store/useStore';
import { useNavigation } from '@react-navigation/native';

export default function MyProductsScreen() {
  const { produtos, excluirProduto, user } = useStore();
  const navigation = useNavigation<any>();

  // Filtra apenas os produtos do produtor logado
  const meusProdutos = produtos.filter(p => p.produtorId === user?.uid);

  const confirmarExclusao = (id: string, nome: string) => {
    Alert.alert(
      "Excluir Produto",
      `Tem certeza que deseja excluir "${nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: () => excluirProduto(id)
        }
      ]
    );
  };

  const renderProduto = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-lg flex-row">
      <Image 
        source={{ uri: item.imagem }} 
        className="w-24 h-24 rounded-xl"
        resizeMode="cover"
      />
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-800">{item.nome}</Text>
        <Text className="text-sm text-gray-600 mt-1">{item.descricao || 'Sem descrição'}</Text>
        <Text className="text-xl font-bold text-primary mt-2">
          R$ {item.preco.toFixed(2)}
        </Text>
        <Text className="text-sm text-gray-500">
          Estoque: {item.quantidade} unidades
        </Text>
      </View>

      <View className="justify-center gap-3">
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditProduct', { produto: item })}
          className="bg-blue-500 p-3 rounded-full"
        >
          <Ionicons name="pencil" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => confirmarExclusao(item.id, item.nome)}
          className="bg-red-500 p-3 rounded-full"
        >
          <Ionicons name="trash" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-bold text-primary">Meus Produtos</Text>
          <Text className="text-gray-600">{meusProdutos.length} itens</Text>
        </View>

        {meusProdutos.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="leaf-outline" size={80} color="#ccc" />
            <Text className="text-xl text-gray-500 mt-6 text-center">
              Nenhum produto cadastrado ainda
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Toque no botão + para começar
            </Text>
          </View>
        ) : (
          <FlatList
            data={meusProdutos}
            keyExtractor={(item) => item.id}
            renderItem={renderProduto}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Botão Flutuante */}
        <TouchableOpacity
          style={{ position: 'absolute', right: 24, bottom: 24 }}
          onPress={() => navigation.navigate('AddProduct')}
          className="bg-primary w-16 h-16 rounded-full items-center justify-center shadow-2xl"
        >
          <Ionicons name="add" size={36} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}