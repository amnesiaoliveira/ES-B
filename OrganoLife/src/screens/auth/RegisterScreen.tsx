import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const { login } = useStore();
  const navigation = useNavigation<any>();

  const handleRegister = () => {
    if (!email) {
      Alert.alert('Erro', 'Digite um e-mail');
      return;
    }
    const role = email.toLowerCase().includes('produtor') ? 'produtor' : 'cliente';
    login(email, role);
    Alert.alert('Sucesso', `Conta criada como ${role === 'produtor' ? 'Produtor' : 'Consumidor'}!`);
  };

  return (
    <View className="flex-1 bg-background justify-center px-10">
      <Text className="text-4xl font-bold text-primary mb-10 text-center">
        Criar Conta
      </Text>
      <TextInput
        placeholder="seu@email.com (use 'produtor' para ser produtor)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        className="bg-white p-4 rounded-xl mb-6"
      />
      <TouchableOpacity onPress={handleRegister} className="bg-primary py-5 rounded-xl">
        <Text className="text-white text-center text-xl font-bold">Criar Conta</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6">
        <Text className="text-center text-primary">Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}