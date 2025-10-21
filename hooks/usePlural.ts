// hooks/usePlural.ts
import { getPlural } from "@/utils/plural";
import { useTranslation } from "react-i18next";

export function usePlural() {
  const { t, i18n } = useTranslation();

  return (count: number, key: string) => {
    return getPlural(
      count,
      {
        one: t(`${key}.one`),
        few: t(`${key}.few`),
        other: t(`${key}.other`),
      },
      i18n.language
    );
  };
}
