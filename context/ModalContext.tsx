// context/ModalContext.tsx
import AppModal from "@/components/ui/AppModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import React, {
  createContext,
  ReactNode,
  useContext,
  useRef,
  useState,
} from "react";
import { View } from "react-native";

type ButtonVariant = "primary" | "secondary" | "destructive" | "default";
type ButtonSize = "md" | "lg";

type Action = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

type ModalOptions = {
  title?: string;
  message?: string;
  content?: React.ReactNode;
  actions?: Action[];
  twoPlusOneForThree?: boolean;
};

type ModalContextType = {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
  confirm: (message: string, onConfirm: () => void, title?: string) => void;
  alert: (message: string, title?: string) => void;
  prompt: (opts: {
    title: string;
    message?: string;
    placeholder?: string;
    defaultValue?: string;
    submitLabel?: string;
    cancelLabel?: string;
    onSubmit: (value: string) => void;
    submitVariant?: ButtonVariant;
    cancelVariant?: ButtonVariant;
  }) => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ModalOptions>({});
  const latestInputRef = useRef<string>("");

  const openModal = (opts: ModalOptions) => {
    setOptions(opts);
    setVisible(true);
  };

  const closeModal = () => setVisible(false);

  const confirm = (
    message: string,
    onConfirm: () => void,
    title = "Potvrda"
  ) => {
    openModal({
      title,
      message,
      actions: [
        { label: "Otkaži", onPress: closeModal, variant: "secondary" },
        {
          label: "Potvrdi",
          onPress: () => {
            closeModal();
            onConfirm();
          },
          variant: "primary",
        },
      ],
    });
  };

  const alert = (message: string, title = "Info") => {
    openModal({
      title,
      message,
      actions: [{ label: "OK", onPress: closeModal, variant: "primary" }],
    });
  };

  const prompt: ModalContextType["prompt"] = ({
    title,
    message,
    placeholder = "Placeholder",
    defaultValue = "",
    submitLabel = "Continue",
    cancelLabel = "Cancel",
    onSubmit,
    submitVariant = "primary",
    cancelVariant = "secondary",
  }) => {
    latestInputRef.current = defaultValue;

    openModal({
      title,
      message,
      content: (
        <Input
          placeholder={placeholder}
          defaultValue={defaultValue}
          onChangeText={(t) => (latestInputRef.current = t)}
        />
      ),
      actions: [
        { label: cancelLabel, onPress: closeModal, variant: cancelVariant },
        {
          label: submitLabel,
          onPress: () => {
            const v = latestInputRef.current ?? "";
            closeModal();
            onSubmit(v);
          },
          variant: submitVariant,
        },
      ],
    });
  };

  const renderActions = (actions?: Action[], twoPlusOneForThree?: boolean) => {
    if (!actions?.length) return null;

    if (actions.length === 2) {
      return (
        <View className="w-full mt-3 flex-row">
          {[0, 1].map((i) => (
            <View
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                [i === 0 ? "marginRight" : "marginLeft"]: 6,
              }}
            >
              <Button
                title={actions[i].label}
                variant={actions[i].variant ?? "secondary"}
                onPress={actions[i].onPress}
                size={actions[i].size ?? "md"}
                fullWidth={actions[i].fullWidth ?? true}
              />
            </View>
          ))}
        </View>
      );
    }

    if (actions.length === 3 && twoPlusOneForThree) {
      return (
        <View className="w-full mt-3">
          <View className="flex-row">
            {[0, 1].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  minWidth: 0,
                  [i === 0 ? "marginRight" : "marginLeft"]: 6,
                }}
              >
                <Button
                  title={actions[i].label}
                  variant={actions[i].variant ?? "secondary"}
                  onPress={actions[i].onPress}
                  size={actions[i].size ?? "md"}
                  fullWidth={actions[i].fullWidth ?? true}
                />
              </View>
            ))}
          </View>
          <View style={{ marginTop: 8 }}>
            <Button
              title={actions[2].label}
              variant={actions[2].variant ?? "secondary"}
              onPress={actions[2].onPress}
              size={actions[2].size ?? "md"}
              fullWidth={actions[2].fullWidth ?? true}
            />
          </View>
        </View>
      );
    }

    return (
      <View className="w-full mt-3">
        {actions.map((a, i) => (
          <View key={`${a.label}-${i}`} style={{ marginTop: i === 0 ? 0 : 8 }}>
            <Button
              title={a.label}
              variant={a.variant ?? "secondary"}
              onPress={a.onPress}
              size={a.size ?? "md"}
              fullWidth={a.fullWidth ?? true}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <ModalContext.Provider
      value={{ openModal, closeModal, confirm, alert, prompt }}
    >
      {children}
      <AppModal
        visible={visible}
        onClose={closeModal}
        title={options.title}
        message={options.message}
      >
        {options.content}
        {renderActions(options.actions, options.twoPlusOneForThree)}
      </AppModal>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
}
