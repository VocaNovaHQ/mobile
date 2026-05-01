import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Platform, View } from "react-native";
import type { MainTabParamList } from "./types";
import { Icon, type IconName } from "../components/Icon";
import { colors } from "../theme/tokens";
import { HomeScreen } from "../screens/main/HomeScreen";
import { ListScreen } from "../screens/main/ListScreen";
import { ProfileScreen } from "../screens/main/ProfileScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_META: Record<keyof MainTabParamList, { icon: IconName; label: string }> = {
  Home: { icon: "home", label: "홈" },
  List: { icon: "cards", label: "단어장" },
  Profile: { icon: "user", label: "프로필" },
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.blue[500],
        tabBarInactiveTintColor: colors.ink[500],
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "500",
          letterSpacing: -0.1,
          marginBottom: 4,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor:
            Platform.OS === "ios" ? "transparent" : "rgba(255,255,255,0.95)",
          borderTopColor: "rgba(15,23,42,0.06)",
          borderTopWidth: 0.5,
          height: 84,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              tint="light"
              intensity={70}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255,255,255,0.6)",
              }}
            />
          ) : (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255,255,255,0.95)",
              }}
            />
          ),
        tabBarIcon: ({ color, focused }) => (
          <Icon
            name={TAB_META[route.name].icon}
            size={22}
            color={color}
            strokeWidth={focused ? 2.2 : 1.8}
          />
        ),
        tabBarLabel: TAB_META[route.name].label,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="List" component={ListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
