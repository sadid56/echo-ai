import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomeScreen } from "./screens/HomeScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import Header from "./layouts/header";
import { HistoryDrawer } from "./features/history/HistoryDrawer";
import "./styles/global.css";

function App() {
  return (
    <BrowserRouter>
      <div 
        id='app-container' 
        className='flex flex-col h-[100dvh] bg-m3-surface text-m3-on-surface relative overflow-hidden rounded-[20px] sm:rounded-[24px] border border-m3-outline-variant shadow-2xl isolate'
        style={{
          WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        }}
      >

        <div className='relative z-20'>
          <Header />
        </div>

        {/* Main Content Router */}
        <div className='flex flex-1 overflow-hidden relative z-10'>
          <Routes>
            <Route path='/' element={<HomeScreen />} />
            <Route path='/settings' element={<SettingsScreen />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </div>

        <HistoryDrawer />
      </div>
    </BrowserRouter>
  );
}

export default App;
