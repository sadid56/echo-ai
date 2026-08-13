import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomeScreen } from "./screens/HomeScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import Header from "./layouts/header";
import "./styles/global.css";

function App() {
  return (
    <BrowserRouter>
      <div className='flex flex-col h-screen bg-[#08080a] text-text-main relative overflow-hidden rounded-2xl border border-white/10'>
        {/* Dynamic Ambient Background Grid & Glows */}
        <div className='absolute inset-0 z-0 pointer-events-none'>
          <div className='absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent-cyan/[0.02] blur-[220px] mix-blend-screen' />
          <div className='absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent-purple/[0.02] blur-[200px] mix-blend-screen' />
          <div className='absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20' />
        </div>

        {/* Global Header */}
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
      </div>
    </BrowserRouter>
  );
}

export default App;
