export default function QrModal({ bookingId, onClose }) {
  // ใช้ไลบรารี qrcode หรือ img src จาก backend ก็ได้
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ background: '#fff', margin: 'auto', padding: 32 }}>
        <h3>QR Code สำหรับเช็คอิน</h3>
        <canvas id="qrCanvas"></canvas>
        <button onClick={onClose}>ปิด</button>
      </div>
    </div>
  );
}
