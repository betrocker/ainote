// context/ModalContext.tsx
import AppModal from "@/components/ui/AppModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
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

type ConfirmAsyncOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type PromptOpts = {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  submitVariant?: ButtonVariant;
  cancelVariant?: ButtonVariant;
};

type ModalContextType = {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;

  // Overload 1: stari API (void)
  confirm(message: string, onConfirm: () => void, title?: string): void;
  // Overload 2: novi API (Promise<boolean>)
  confirm(opts: ConfirmAsyncOptions): Promise<boolean>;

  alert: (message: string, title?: string) => void;
  prompt: (opts: PromptOpts) => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ModalOptions>({});
  const latestInputRef = useRef<string>("");
  const confirmResolverRef = useRef<((v: boolean) => void) | undefined>(
    undefined
  );

  const openModal = useCallback((opts: ModalOptions) => {
    setOptions(opts);
    setVisible(true);
  }, []);

  const hardReset = useCallback(() => {
    setOptions({});
    confirmResolverRef.current = undefined;
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
    requestAnimationFrame(() => {
      hardReset();
    });
  }, [hardReset]);

  /** Promisified confirm (unutrašnja implementacija) */
  const confirmAsyncImpl = useCallback(
    (opts: ConfirmAsyncOptions) => {
      // ako postoji aktivan resolver – cancel
      if (confirmResolverRef.current) {
        try {
          confirmResolverRef.current(false);
        } catch {}
        confirmResolverRef.current = undefined;
      }

      const {
        title = "Potvrda",
        message = "Da li si siguran?",
        confirmText = "Potvrdi",
        cancelText = "Otkaži",
        destructive = false,
      } = opts || {};

      return new Promise<boolean>((resolve) => {
        confirmResolverRef.current = resolve;

        openModal({
          title,
          message,
          actions: [
            {
              label: cancelText,
              variant: "secondary",
              onPress: () => {
                resolve(false);
                confirmResolverRef.current = undefined;
                closeModal();
              },
            },
            {
              label: confirmText,
              variant: destructive ? "destructive" : "primary",
              onPress: () => {
                resolve(true);
                confirmResolverRef.current = undefined;
                closeModal();
              },
            },
          ],
        });
      });
    },
    [openModal, closeModal]
  );

  /** Public confirm sa overloadima */
  function confirm(
    messageOrOpts: string | ConfirmAsyncOptions,
    onConfirm?: () => void,
    title?: string
  ): void | Promise<boolean> {
    // Novi stil: confirm({ ... }): Promise<boolean>
    if (typeof messageOrOpts === "object") {
      return confirmAsyncImpl(messageOrOpts);
    }
    // Stari stil: confirm("msg", () => {}, "Title"): void
    const msg = messageOrOpts as string;
    const ttl = title ?? "Potvrda";
    const cb = onConfirm ?? (() => {});
    // koristimo promisified ispod haube
    void confirmAsyncImpl({
      title: ttl,
      message: msg,
      confirmText: "Potvrdi",
      cancelText: "Otkaži",
    })
      .then((ok) => {
        if (ok) cb();
      })
      .catch(() => {});
  }

  const alert = useCallback(
    (message: string, title = "Info") => {
      openModal({
        title,
        message,
        actions: [{ label: "OK", onPress: closeModal, variant: "primary" }],
      });
    },
    [openModal, closeModal]
  );

  const prompt = useCallback(
    ({
      title,
      message,
      placeholder = "Placeholder",
      defaultValue = "",
      submitLabel = "Continue",
      cancelLabel = "Cancel",
      onSubmit,
      submitVariant = "primary",
      cancelVariant = "secondary",
    }: PromptOpts) => {
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
    },
    [openModal, closeModal]
  );

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

  const value = useMemo<ModalContextType>(
    () => ({
      openModal,
      closeModal,
      confirm: confirm as ModalContextType["confirm"], // cast zbog overload tipa
      alert,
      prompt,
    }),
    [openModal, closeModal, alert, prompt]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <AppModal
        visible={visible}
        onClose={() => {
          // ako je aktivan confirmAsync i korisnik tapne overlay → Cancel
          if (confirmResolverRef.current) {
            try {
              confirmResolverRef.current(false);
            } catch {}
            confirmResolverRef.current = undefined;
          }
          closeModal();
        }}
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
