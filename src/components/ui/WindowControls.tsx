import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

export const WindowControls = () => {
  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  return (
    <div className='flex items-center gap-1.5 mr-2'>
      <button
        type='button'
        onClick={handleClose}
        className='w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors duration-150 cursor-default'
        title="Close"
      >
        <div className='w-4.5 h-4.5 rounded-full bg-[#757575] hover:bg-[#8e8e93] transition-colors' />
      </button>
      <button
        type='button'
        onClick={handleMinimize}
        className='w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors duration-150 cursor-default'
        title="Minimize"
      >
        <div className='w-4.5 h-4.5 rounded-full bg-[#757575] hover:bg-[#8e8e93] transition-colors' />
      </button>
      <button
        type='button'
        onClick={handleMaximize}
        className='w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors duration-150 cursor-default'
        title="Maximize"
      >
        <div className='w-4.5 h-4.5 rounded-full bg-[#757575] hover:bg-[#8e8e93] transition-colors' />
      </button>
    </div>
  );
};
