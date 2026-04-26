import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
