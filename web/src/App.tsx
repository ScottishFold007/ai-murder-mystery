import React from "react";
import { MantineProvider, createTheme } from "@mantine/core";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import ScriptEditor from "./pages/ScriptEditor";
import ScriptLibrary from "./pages/ScriptLibrary";
import PlayScript from "./pages/PlayScript";
import ScriptGenerator from "./pages/ScriptGenerator";
import { MysteryProvider } from "./providers/mysteryContext";
import { SessionProvider } from "./providers/sessionContext";
import { ScriptProvider } from "./providers/scriptContext";
import "./App.css";
import "./styles/auroraTheme.css";

const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1A2E',
      '#0c0d0e',
      '#121212'
    ],
    blue: [
      '#e7f5ff',
      '#d0ebff',
      '#a5d8ff',
      '#74c0fc',
      '#4dabf7',
      '#339af0',
      '#228be6',
      '#1c7ed6',
      '#1971c2',
      '#00C2FF'
    ]
  },
  defaultRadius: 'md',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
});

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <Router>
        <SessionProvider>
          <ScriptProvider>
            <MysteryProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/library" replace />} />
                <Route path="/editor" element={<ScriptEditor />} />
                <Route path="/editor/:id" element={<ScriptEditor />} />
                <Route path="/library" element={<ScriptLibrary />} />
                <Route path="/play/:id" element={<PlayScript />} />
                <Route path="/ai-generator" element={<ScriptGenerator />} />
              </Routes>
            </MysteryProvider>
          </ScriptProvider>
        </SessionProvider>
      </Router>
    </MantineProvider>
  );
}
