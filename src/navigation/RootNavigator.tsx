import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { MainTabs } from "./MainTabs";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { DetailScreen } from "../screens/main/DetailScreen";
import { StudyScreen } from "../screens/main/StudyScreen";
import { ScheduleScreen } from "../screens/main/ScheduleScreen";
import { ReminderScreen } from "../screens/main/ReminderScreen";
import { useAuthStore } from "../store/auth";
import { colors } from "../theme/tokens";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { initialized, session, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color={colors.blue[500]} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Detail"
              component={DetailScreen}
              options={{ presentation: "card", animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="Study"
              component={StudyScreen}
              options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="Schedule"
              component={ScheduleScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="Reminder"
              component={ReminderScreen}
              options={{ animation: "slide_from_right" }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
