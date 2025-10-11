import React from "react";
import {View, Text, TouchableOpacity, Pressable} from "react-native";
import {BlurView} from "expo-blur";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";

type Props = {
    visible: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onShare?: () => void;
    onDelete?: () => void;
};

export default function ContextMenu({visible, onClose, onEdit, onShare, onDelete}: Props) {
    const scale = useSharedValue(0.9);
    const opacity = useSharedValue(0);

    React.useEffect(() => {
        if (visible) {
            scale.value = withTiming(1, {duration: 200});
            opacity.value = withTiming(1, {duration: 200});
        } else {
            scale.value = withTiming(0.9, {duration: 200});
            opacity.value = withTiming(0, {duration: 200});
        }
    }, [visible]);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{scale: scale.value}],
        opacity: opacity.value,
    }));

    if (!visible) return null;

    return (
        <View className="absolute inset-0 z-50">
            {/* Overlay */}
            <Pressable onPress={onClose} className="absolute inset-0 bg-black/30"/>

            <Animated.View
                style={[animStyle, {position: "absolute", top: "40%", left: "10%", right: "10%"}]}
                className="rounded-2xl overflow-hidden shadow-lg"
            >
                <BlurView intensity={50} tint="dark" className="rounded-2xl p-2">
                    <TouchableOpacity className="px-4 py-3" onPress={onEdit}>
                        <Text className="text-white text-base">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-4 py-3" onPress={onShare}>
                        <Text className="text-white text-base">Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-4 py-3" onPress={onDelete}>
                        <Text className="text-red-400 text-base">Delete</Text>
                    </TouchableOpacity>
                </BlurView>
            </Animated.View>
        </View>
    );
}
