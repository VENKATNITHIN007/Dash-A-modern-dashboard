import type { Config } from "tailwindcss"; // Imports the Type for better Autocomplete/IntelliSense

export default {
  // 1. WATCH LIST: Tells Tailwind which files to scan for class names.
  // It looks inside 'src', in any folder (**), for files ending in these extensions.
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], 

  theme: {
    // 2. THEME OVERRIDES: If you put things directly in 'theme', it deletes Tailwind's defaults.
    extend: {
      // 3. THEME EXTENSIONS: This is where you ADD to the defaults (Safe Zone).
      // Example: Adding a custom brand color without losing 'blue' or 'red'.
    },
  },

  // 4. ADD-ONS: Used for official or 3rd-party plugins (Forms, Typography, etc.)
  plugins: [],
} satisfies Config; // Ensures the object strictly follows the Tailwind Config structure