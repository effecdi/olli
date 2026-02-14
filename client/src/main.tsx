import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import logoUrl from "@assets/logo.png";

const ensureFavicon = () => {
  const head = document.head;
  let link = head.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    head.appendChild(link);
  }
  link.href = logoUrl;
};

ensureFavicon();

createRoot(document.getElementById("root")!).render(<App />);
