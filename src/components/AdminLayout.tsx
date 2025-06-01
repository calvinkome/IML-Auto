import { Outlet } from 'react-router-dom';
import AdminNav from './AdminNav';

export default function AdminLayout() {
  return (
    <div className='pt-20 min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='flex gap-8'>
          <div className='w-64'>
            <AdminNav />
          </div>
          <div className='flex-1 p-5'>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
