import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { darkTheme } from "@rainbow-me/rainbowkit";
import { BrowserRouter } from "react-router-dom";

const anvilChain = {
  // ⭐ Removed type annotation
  id: 31337,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
};

const config = getDefaultConfig({
  appName: "Simple DEX",
  projectId: "8f3c7d2b4a1c9e6f123456789abcd123",

  chains: [anvilChain],

  transports: {
    [anvilChain.id]: http("http://127.0.0.1:8545"),
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#000000",
          accentColorForeground: "white",

          borderRadius: "medium",
          fontStack: "system",
        })}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>,
);
