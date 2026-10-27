import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CurrencyProvider } from "./currency";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
