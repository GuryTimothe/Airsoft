import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        success: "var(--success)",
        "success-foreground": "var(--success-foreground)",
        info: "var(--info)",
        "info-foreground": "var(--info-foreground)",
        warning: "var(--warning)",
        "warning-foreground": "var(--warning-foreground)",
      },
    },
  },
};

export default config;
