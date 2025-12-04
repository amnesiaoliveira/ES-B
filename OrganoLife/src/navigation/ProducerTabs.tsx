import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ProducerHomeScreen from '../screens/app/producer/ProducerHomeScreen';
import MyProductsScreen from '../screens/app/producer/MyProductsScreen';
import AddProductScreen from '../screens/app/producer/AddProductScreen';
import EditProductScreen from '../screens/app/producer/EditProductScreen';
import ProducerOrdersScreen from '../screens/app/producer/ProducerOrdersScreen';
import ProfileScreen from '../screens/app/client/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MyProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyProductsList" component={MyProductsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
    </Stack.Navigator>
  );
}

export default function ProducerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2E8B57',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { height: 60, paddingBottom: 8 },
        headerShown: false,
      }}
    >
      <Tab.Screen name="ProdHome" component={ProducerHomeScreen}
        options={{ tabBarLabel: 'Início', tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} /> }}
      />
      <Tab.Screen name="MyProducts" component={MyProductsStack}
        options={{ tabBarLabel: 'Meus Produtos', tabBarIcon: ({ color }) => <Ionicons name="leaf" size={30} color={color} /> }}
      />
      <Tab.Screen name="ProdOrders" component={ProducerOrdersScreen}
        options={{ tabBarLabel: 'Pedidos', tabBarIcon: ({ color }) => <Ionicons name="basket" size={28} color={color} /> }}
      />
      <Tab.Screen name="ProdProfile" component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil', tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} /> }}
      />
    </Tab.Navigator>
  );
}