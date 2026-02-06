import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import ReadScreen from './src/screens/ReadScreen';
import StewardshipScreen from './src/screens/StewardshipScreen';
import { COLORS } from './src/constants/colors';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.bg,
              borderTopWidth: 0,
              elevation: 0,
              height: 70,
              paddingBottom: 10,
              paddingTop: 10,
            },
            tabBarActiveTintColor: COLORS.ink,
            tabBarInactiveTintColor: COLORS.inkFaint,
            tabBarLabelStyle: {
              fontSize: 10,
              letterSpacing: 1,
            },
            tabBarIconStyle: {
              marginTop: 4,
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="book-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Read"
            component={ReadScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="reader-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Stewardship"
            component={StewardshipScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="wallet-outline" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
