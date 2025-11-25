import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../../store/useStore';
import { useNavigation } from '@react-navigation/native';

export default function AddProductScreen() {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [imagem, setImagem] = useState<string | null>(null);
  const { user, adicionarProduto } = useStore();
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
    if (!nome || !preco || !quantidade || !imagem) {
      Alert.alert('Erro', 'Preencha todos os campos e adicione uma foto');
      return;
    }

    adicionarProduto({
      nome,
      descricao,
      preco: parseFloat(preco.replace(',', '.')),
      quantidade: parseInt(quantidade),
      imagem,
      produtorId: user?.uid || '1',
      produtorNome: user?.nome || 'Produtor',
    });

    Alert.alert('Sucesso!', 'Produto cadastrado!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="px-6 pt-6">
        <Text className="text-3xl font-bold text-primary mb-6">Novo Produto</Text>

        <TouchableOpacity onPress={pickImage} className="mb-6">
          {imagem ? (
            <Image source={{ uri: imagem }} className="w-full h-64 rounded-2xl" />
          ) : (
            <View className="w-full h-64 bg-gray-200 rounded-2xl items-center justify-center border-2 border-dashed">
              <Text className="text-gray-500">Toque para adicionar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput placeholder="Nome" value={nome} onChangeText={setNome} className="bg-white border border-gray-300 rounded-xl px-4 py-4 mb-4" />
        <TextInput placeholder="Descrição" value={descricao} onChangeText={setDescricao} className="bg-white border border-gray-300 rounded-xl px-4 py-4 mb-4" />
        <View className="flex-row gap-4">
          <TextInput placeholder="Preço R$" value={preco} onChangeText={setPreco} keyboardType="numeric" className="flex-1 bg-white border rounded-xl px-4 py-4" />
          <TextInput placeholder="Quantidade" value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" className="flex-1 bg-white border rounded-xl px-4 py-4" />
        </View>

        <TouchableOpacity onPress={handleSave} className="bg-primary py-5 rounded-2xl mt-8">
          <Text className="text-white text-center text-xl font-bold">Salvar Produto</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}