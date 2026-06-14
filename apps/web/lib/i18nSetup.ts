// First release is English-only on the web (desktop stays zh-TW).
// Imported for its side effect by client entry components so t() is English
// before first render.
import { setLocale } from "@warmdock/core/i18n";

setLocale("en");
