import React from "react";
import { ScrollView, ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = ScrollViewProps & { extraTop?: number };

export default function ScreenScroll({
  extraTop = 16,
  contentContainerStyle,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 60;

  return (
    <ScrollView
      {...rest}
      contentContainerStyle={[
        { paddingTop: headerHeight + extraTop },
        contentContainerStyle,
      ]}
    />
  );
}
