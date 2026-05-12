import React from 'react'
import ReactDOM from 'react-dom/client'


import './index.css'

import App from './App.jsx'

// RainbowKit
import '@rainbow-me/rainbowkit/styles.css'

import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit'

import {
  WagmiProvider,
} from 'wagmi'

import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query'

// =====================================
// ARC TESTNET
// =====================================

const arcTestnet = {

  id: 5042002,

  name: 'Arc Testnet',

  nativeCurrency: {

    name: 'USDC',

    symbol: 'USDC',

    decimals: 6,
  },

  rpcUrls: {

    default: {

      http: [
        'https://rpc.testnet.arc.network',
      ],
    },
  },
}

// =====================================
// CONFIG
// =====================================

const config = getDefaultConfig({

  appName: 'Arc AI',

  projectId: 'arc-ai-demo',

  chains: [arcTestnet],

  ssr: false,
})

// =====================================

const queryClient =
  new QueryClient()

ReactDOM.createRoot(

  document.getElementById('root')

).render(

  <React.StrictMode>

    <WagmiProvider config={config}>

      <QueryClientProvider client={queryClient}>

        <RainbowKitProvider>

          <App />

        </RainbowKitProvider>

      </QueryClientProvider>

    </WagmiProvider>

  </React.StrictMode>
)