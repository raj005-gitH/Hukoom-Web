import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { COLORS } from "../theme";

// ── Screens ──────────────────────────────────────────────
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import PostQueryScreen from "../screens/PostQueryScreen";
import MyRequestsScreen from "../screens/MyRequestsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import HeroDashboardScreen from "../screens/HeroDashboardScreen";
import HeroJobsScreen from "../screens/HeroJobsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Icon helper (uses emoji, no extra lib needed) ────────
const TabIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

// ── Customer Bottom Tabs ─────────────────────────────────
function CustomerTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(10, 14, 39, 0.97)",
          borderTopColor: COLORS.surfaceBorder,
          borderTopWidth: 1,
          height: 65 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 5,
        },
        tabBarActiveTintColor: COLORS.accentLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="PostQuery"
        component={PostQueryScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="➕" focused={focused} />,
          tabBarLabel: "Post",
        }}
      />
      <Tab.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
          tabBarLabel: "My Requests",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

// ── Hero Bottom Tabs ─────────────────────────────────────
function HeroTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(10, 14, 39, 0.97)",
          borderTopColor: COLORS.surfaceBorder,
          borderTopWidth: 1,
          height: 65 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 5,
        },
        tabBarActiveTintColor: COLORS.goldLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HeroDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💼" focused={focused} />,
          tabBarLabel: "Dashboard",
        }}
      />
      <Tab.Screen
        name="MyJobs"
        component={HeroJobsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
          tabBarLabel: "My Jobs",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root Navigator ───────────────────────────────────────
export default function AppNavigator() {
  const { isLoggedIn, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : role === "hero" ? (
          <Stack.Screen name="HeroApp" component={HeroTabs} />
        ) : (
          <Stack.Screen name="CustomerApp" component={CustomerTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
