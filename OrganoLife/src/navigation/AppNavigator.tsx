import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ClientTabs from './ClientTabs';
import ProducerTabs from './ProducerTabs';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useStore();
  const insets = useSafeAreaInsets();

  if (user === undefined) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : user.role === 'cliente' ? (
            <Stack.Screen name="ClientMain" component={ClientTabs} />
          ) : (
            <Stack.Screen name="ProducerMain" component={ProducerTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}