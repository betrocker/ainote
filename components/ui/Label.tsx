import React from "react";
import {Text, TextProps} from "react-native";

type LabelProps = TextProps & {
    children: React.ReactNode;
    /**
     * Veličina teksta (default: md)
     */
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /**
     * Težina fonta (default: semibold) — radi lepo sa Mona Sans varijabilnim.
     */
    weight?: "regular" | "medium" | "semibold" | "bold";
    /**
     * Semantička boja (default: primary)
     */
    color?: "primary" | "secondary" | "tertiary" | "quaternary" | "blue";
    className?: string;
    numberOfLines?: number;
};

const sizeMap = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
};

const weightMap = {
    regular: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
};

const colorMap = {
    primary: "text-ios-label dark:text-iosd-label",
    secondary: "text-ios-label2 dark:text-iosd-label2",
    tertiary: "text-ios-label3 dark:text-iosd-label3",
    quaternary: "text-ios-label4 dark:text-iosd-label4",
    blue: "text-ios-blue dark:text-iosd-blue",
};

export default function Label({
                                  children,
                                  size = "md",
                                  weight = "semibold",
                                  color = "primary",
                                  className = "",
                                  numberOfLines,
                                  ...rest
                              }: LabelProps) {
    const cn = `${sizeMap[size]} ${weightMap[weight]} ${colorMap[color]} ${className}`;
    return (
        <Text className={cn} numberOfLines={numberOfLines} {...rest}>
            {children}
        </Text>
    );
}
