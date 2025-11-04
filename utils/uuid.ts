import * as Crypto from "expo-crypto";

export const generateId = () => Crypto.randomUUID();
