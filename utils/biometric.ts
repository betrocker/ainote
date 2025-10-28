import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export const checkBiometricSupport = async () => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();

  return { compatible, enrolled };
};

export const authenticateWithBiometric = async () => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Autentifikuj se za pristup privatnim belešakama",
      cancelLabel: "Otkaži",
      disableDeviceFallback: false, // Omogući PIN/password fallback
    });

    return result.success;
  } catch (error) {
    console.error("Biometric auth error:", error);
    return false;
  }
};

export const getBiometricType = async () => {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  ) {
    return "Face ID";
  } else if (
    types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
  ) {
    return "Touch ID";
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return "Iris";
  }
  return "Biometrics";
};

// Store whether private folder is enabled
export const setPrivateFolderEnabled = async (enabled: boolean) => {
  await SecureStore.setItemAsync("privateFolderEnabled", enabled.toString());
};

export const isPrivateFolderEnabled = async () => {
  const enabled = await SecureStore.getItemAsync("privateFolderEnabled");
  return enabled === "true";
};
