// components/ScreenFlatList.tsx
import React from "react";
import { FlatList, FlatListProps, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props<ItemT> = FlatListProps<ItemT> & {
  extraTop?: number; // dodatni razmak ispod hedera (default 16)
};

export default function ScreenFlatList<ItemT>({
  extraTop = 16,
  contentContainerStyle,
  ListHeaderComponent,
  ...rest
}: Props<ItemT>) {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 60;

  return (
    <FlatList
      {...rest}
      // umesto paddingTop u contentContainerStyle, ubacimo prazan header view
      ListHeaderComponent={
        <>
          <View style={{ height: headerHeight + extraTop }} />
          {ListHeaderComponent as any}
        </>
      }
      contentContainerStyle={[contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    />
  );
}
