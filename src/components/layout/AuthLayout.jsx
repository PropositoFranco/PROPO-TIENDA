import { Outlet } from 'react-router-dom';
import RPGBackground from '../ui/RPGBackground';
import ToastLayer from '../ui/ToastLayer';

export default function AuthLayout() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <RPGBackground />
      <div className="relative z-10 w-full max-w-[480px] px-5 flex flex-col items-center">
        <Outlet />
      </div>
      <ToastLayer />
    </div>
  );
}