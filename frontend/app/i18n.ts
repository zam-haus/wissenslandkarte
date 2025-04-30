export default {
  supportedLngs: ["en", "de"],
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false }, // remix does XSS sanitization
  react: { useSuspense: false },
};
