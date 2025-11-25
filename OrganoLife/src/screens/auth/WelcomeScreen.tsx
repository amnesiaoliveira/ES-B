import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1 bg-primary justify-center items-center px-8">
      <View className="w-32 h-32 bg-white rounded-full items-center justify-center mb-10 shadow-lg">
      <Text className="text-6xl text-primary font-bold">OL</Text>
      </View>
      <Text className="text-white text-5xl font-bold text-center mb-4">
      OrganoLife
      </Text>
      <Text className="text-white text-5xl font-bold text-center mb-4">
        OrganoLife
      </Text>
      <Text className="text-white text-lg text-center mb-12">
        Produtos orgânicos direto do produtor para sua mesa
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        className="bg-white py-4 px-16 rounded-full mb-4"
      >
        <Text className="text-primary text-xl font-semibold">Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
        className="border-2 border-white py-4 px-16 rounded-full"
      >
        <Text className="text-white text-xl font-semibold">Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}