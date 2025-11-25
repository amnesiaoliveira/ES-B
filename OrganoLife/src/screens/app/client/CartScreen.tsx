// COLE ESSE MESMO CÓDIGO NOS 7 ARQUIVOS ACIMA (só muda o texto do título)

import { View, Text, SafeAreaView } from 'react-native';

export default function NomeDaTelaScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-24 h-24 bg-primary/20 rounded-3xl items-center justify-center mb-6">
          <Text className="text-5xl text-primary">Leaf Icon</Text>
        </View>
        <Text className="text-3xl font-bold text-primary text-center">
          TELA EM DESENVOLVIMENTO
        </Text>
        <Text className="text-lg text-gray-600 text-center mt-4">
          Tela do Carrinho
        </Text>
      </View>
    </SafeAreaView>
  );
}