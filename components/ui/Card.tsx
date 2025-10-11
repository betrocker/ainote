import React from "react";
import {View, Pressable, ViewProps} from "react-native";

type CardProps = ViewProps & {
    children: React.ReactNode;
    /**
     * Ako dodaš onPress, Card postaje Pressable.
     */
    onPress?: () => void;
    /**
     * Podesi unutrašnji padding.
     * - "md" (default) = 16
     * - "lg" = 20
     * - "none" = 0
     */
    padding?: "none" | "md" | "lg";
    /**
     * Ako želiš jaču pozadinu za površine (npr. ploča),
     * koristi 'solid' (bg-ios-bg2 / bg-iosd-bg2). Inače 'soft' fill.
     */
    variant?: "soft" | "solid";
    /**
     * Dodaj tanku ivicu (separator).
     */
    withBorder?: boolean;
    className?: string;
};

export default function Card({
                                 children,
                                 onPress,
                                 padding = "md",
                                 variant = "soft",
                                 withBorder = false,
                                 className = "",
                                 ...rest
                             }: CardProps) {
    const Pad = padding === "lg" ? "p-5" : padding === "md" ? "p-4" : "p-0";
    const Surface =
        variant === "solid"
            ? "bg-ios-bg2 dark:bg-iosd-bg2"
            : "bg-ios-fill dark:bg-iosd-fill";
    const Border = withBorder ? "border border-ios-sepSoft dark:border-iosd-sepSoft" : "";

    const base =
        `rounded-2xl ${Pad} ${Surface} ${Border} ` +
        // iOS-ish senka (diskretno)
        "shadow-[0_1px_2px_rgba(0,0,0,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.40)] " +
        className;

    if (onPress) {
        return (
            <Pressable
                accessibilityRole="button"
                onPress={onPress}
                className={base + " active:opacity-90"}
                {...rest}
            >
                {children}
            </Pressable>
        );
    }

    return (
        <View className={base} {...rest}>
            {children}
        </View>
    );
}
