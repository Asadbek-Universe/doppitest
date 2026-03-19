import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  uz: { translation: uz },
};

const storedLang = localStorage.getItem("language");
const initialLang = storedLang && ["en", "ru", "uz"].includes(storedLang) ? storedLang : "en";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

