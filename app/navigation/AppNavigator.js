import React, { useContext, useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Import screens
import LoginScreen from "../screens/LoginScreens";
import HomeScreen from "../screens/HomeScreen";
import SearchParkingScreen from "../screens/SearchParkingScreen";
// import ProfileScreen from "../screens/ProfileScreen";
// import ParkingHistoryScreen from "../screens/ParkingHistoryScreen";
// import ParkingDetailScreen from "../screens/ParkingDetailScreen";
import RegisterScreen from "../screens/RegisterScreen";
import * as SecureStore from "expo-secure-store";
import TopUpScreen from "../screens/TopUpScreen";
import OwnerNavigator from "./OwnerNavigator";
import { authContext } from "../context/authContext";
import ParkingDetailScreen from "../screens/ParkingDetailScreen";
import UserParkingDetailScreen from "../screens/UserParkingDetailScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#BE5B50",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          height: 65,
          paddingBottom: 5,
          paddingTop: 3,
        },
      }}
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchParkingScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen
        name="History"
        component={ParkingHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      /> */}
      {/* <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      /> */}
    </Tab.Navigator>
  );
}

const HomeNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TopUpScreen"
        component={TopUpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserParkingDetailScreen"
        component={UserParkingDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

function AppNavigator() {
  const { isSignIn, setIsSignIn, role, setRole } = useContext(authContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = await SecureStore.getItemAsync("access_token");
      const savedRole = await SecureStore.getItemAsync("user_role");
      if (token && savedRole) {
        setRole(savedRole);
        setIsSignIn(true);
      } else {
        setIsSignIn(false);
        setRole(null);
      }
      setLoading(false);
    };
    checkAuthStatus();
  }, []);

  if (loading) return null;

  if (!isSignIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  if (role === "user") return <BottomTabNavigator />;
  if (role === "landowner") return <OwnerNavigator />;

  return <LoginScreen />;
}

export default AppNavigator;
