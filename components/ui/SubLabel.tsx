import React from "react";
import {TextProps} from "react-native";
import Label from "./Label";

/**
 * SubLabel — sekundarni/tercijarni tekst, idealno za opise, meta-info.
 * Po defaultu koristi secondary boju i sm veličinu.
 */
type SubLabelProps = TextProps & {
    children: React.ReactNode;
    /**
     * "secondary" (default) ili "tertiary" ako hoćeš slabiji kontrast.
     */
    tone?: "secondary" | "tertiary" | "quaternary";
    /**
     * Veličina (default: sm) — često je dobar i xs za captione.
     */
    size?: "xs" | "sm";
    className?: string;
    numberOfLines?: number;
};

export default function SubLabel({
                                     children,
                                     tone = "secondary",
                                     size = "sm",
                                     className = "",
                                     numberOfLines,
                                     ...rest
                                 }: SubLabelProps) {
    return (
        <Label
            size={size}
            weight="regular"
            color={tone}
            className={className}
            numberOfLines={numberOfLines}
            {...rest}
        >
            {children}
        </Label>
    );
}
