import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";
import React from "react";

import PagerCustomTabBar from "@components/CustomTabBar";

// Kreiramo tipizirani layout koristeći withLayoutContext
const { Navigator } = createMaterialTopTabNavigator();
export const MaterialTopTabs = withLayoutContext(Navigator);

export default function TabsLayout() {
  return (
    <MaterialTopTabs
      // tabBar prop se postavlja ovde, na vrhu
      tabBar={(props) => (
        <PagerCustomTabBar
          currentIndex={props.state.index}
          onTabPress={(index) => {
            props.navigation.navigate(props.state.routeNames[index]);
          }}
          tabs={props.state.routeNames}
        />
      )}
      // === KLJUČNA PROMENA JE OVDE ===
      // Eksplicitno kažemo navigatoru gde da očekuje tab bar
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
      }}
    >
      <MaterialTopTabs.Screen name="home" />
      <MaterialTopTabs.Screen name="inbox" />
      <MaterialTopTabs.Screen name="assistant" />
      <MaterialTopTabs.Screen name="private" />
    </MaterialTopTabs>
  );
}
