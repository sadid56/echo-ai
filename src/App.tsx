import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ChatProvider } from "./store/chatStore";
import { HomeScreen } from "./screens/HomeScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import "./App.css";

function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomeScreen />} />
          <Route path='/settings' element={<SettingsScreen />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;
