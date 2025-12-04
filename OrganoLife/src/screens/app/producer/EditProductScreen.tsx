import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../../store/useStore';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function EditProductScreen() {
  const route = useRoute<any>();
  const { produto } = route.params;
  const [nome, setNome] = useState(produto.nome);
  const [descricao, setDescricao] = useState(produto.descricao || '');
  const [preco, setPreco] = useState(produto.preco.toString());
  const [quantidade, setQuantidade] = useState(produto.quantidade.toString());
  const [imagem, setImagem] = useState<string>(produto.imagem);
  
  const { editarProduto } = useStore();
  const navigation = useNavigation<any>();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImagem(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = () => {
    if (!nome || !preco || !quantidade) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    editarProduto(produto.id, {
      ...produto,
      nome,
      descricao,
      preco: parseFloat(preco.replace(',', '.')),
      quantidade: parseInt(quantidade),
      imagem
    });

    Alert.alert('Sucesso!', 'Produto atualizado!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="px-6 pt-6">
        <Text className="text-3xl font-bold text-primary mb-6">Editar Produto</Text>

        <TouchableOpacity onPress={pickImage} className="mb-6">
          <Image source={{ uri: imagem }} className="w-full h-64 rounded-2xl" />
        </TouchableOpacity>

        <TextInput placeholder="Nome" value={nome} onChangeText={setNome} className="bg-white border border-gray-300 rounded-xl px-4 py-4 mb-4" />
        <TextInput placeholder="Descrição" value={descricao} onChangeText={setDescricao} className="bg-white border border-gray-300 rounded-xl px-4 py-4 mb-4" />
        <View className="flex-row gap-4 mb-6">
          <TextInput placeholder="Preço R$" value={preco} onChangeText={setPreco} keyboardType="numeric" className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-4" />
          <TextInput placeholder="Quantidade" value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-4" />
        </View>

        <TouchableOpacity onPress={handleSave} className="bg-primary py-5 rounded-2xl">
          <Text className="text-white text-center text-xl font-bold">Salvar Alterações</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}