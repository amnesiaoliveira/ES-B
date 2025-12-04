import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const { login } = useStore();
  const navigation = useNavigation<any>();

  const handleLogin = () => {
    if (!email) {
      Alert.alert('Atenção', 'Digite um e-mail');
      return;
    }
    const role = email.toLowerCase().includes('produtor') ? 'produtor' : 'cliente';
    login(email, role);
  };

  return (
    <View className="flex-1 bg-background justify-center px-10">
      <Text className="text-4xl font-bold text-primary mb-10 text-center">
        Bem-vindo!
      </Text>
      <TextInput
        placeholder="email qualquer (use 'produtor' para ser produtor)"
        value={email}
        onChangeText={setEmail}
        className="bg-white p-4 rounded-xl mb-6"
      />
      <TouchableOpacity onPress={handleLogin} className="bg-primary py-5 rounded-xl">
        <Text className="text-white text-center text-xl font-bold">Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}