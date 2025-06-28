import { h } from 'preact';
import Router from 'preact-router';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import QrCheckin from './pages/QrCheckin';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

export default function App() {
  // สมมติอ่าน lineOAId จาก config/api
  const lineOAId = 'YOUR_LINE_OA_ID';
  const handleLogout = () => { /* ... */ };
  return (
    <Router>
      <Home path="/" />
      <Booking path="/booking" />
      <Profile path="/profile" lineOAId={lineOAId} onLogout={handleLogout} />
      <Admin path="/admin" />
      <QrCheckin path="/qr-checkin" />
      <Login path="/login" />
      <NotFound default />
    </Router>
  );
}
