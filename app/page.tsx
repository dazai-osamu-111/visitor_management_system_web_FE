"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import styles from './page.module.css';

// --- INTERFACES ---

// 1. Interface hứng dữ liệu từ API Check (Thông tin khách + Lịch sử)
interface IVisitorCheckResponse {
  // Thông tin cá nhân
  hoTen: string;
  soDienThoai: string;
  cccdNumber: string;
  queQuan: string;

  // Thông tin Quân nhân đã thăm lần cuối (Backend cần trả về các trường này)
  lastHostHoTen?: string;
  lastHostDonVi?: string;
  
  // Thông tin chi tiết lượt thăm lần cuối (Để auto-fill)
  lastHostQuanHe?: string;
  lastHostPhuongTien?: string;
  lastHostBienSoXe?: string;
  lastHostSoLuongNguoi?: number;
}

// 2. Interface cho State của Form
interface IFormData {
  // Visitor Info
  hoTen: string;
  soDienThoai: string;
  cccdNumber: string;
  queQuan: string;

  // Host Info (Đã bỏ hostSoDienThoai theo yêu cầu)
  hostHoTen: string;
  hostDonVi: string;

  // Visit Details
  quanHe: string;
  soLuongNguoi: string;
  phuongTien: string;
  bienSoXe: string;
}

// --- CẤU HÌNH ---
// Cập nhật URL ngrok của bạn mỗi khi khởi động lại
const API_URL = 'https://7e9cf469a3f7.ngrok-free.app/api';

export default function RegisterPage() {
  
  // --- STATE ---

  const [formData, setFormData] = useState<IFormData>({
    // Mặc định Visitor
    hoTen: '', soDienThoai: '', cccdNumber: '', queQuan: '',
    
    // Mặc định Host
    hostHoTen: '', hostDonVi: '', 
    
    // Mặc định Visit
    quanHe: '', soLuongNguoi: '1', phuongTien: '', bienSoXe: '',
  });

  const [isReturningVisitor, setIsReturningVisitor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- EFFECTS ---

  useEffect(() => {
    const initialize = async () => {
      // Kiểm tra Local Storage xem khách đã từng đến chưa
      const savedCccd = localStorage.getItem('visitorCccd');
      if (savedCccd) {
        await fetchVisitorData(savedCccd);
      } else {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  // --- API FUNCTIONS ---

  const fetchVisitorData = async (cccd: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/visitors/check?cccd=${cccd}`, {
        method: 'GET',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      if (res.ok) {
        const data: IVisitorCheckResponse = await res.json();
        console.log('Dữ liệu khách thăm trả về:', data);
        
        setFormData((prev) => ({
          ...prev,
          // 1. Auto-fill Thông tin cá nhân
          hoTen: data.hoTen,
          soDienThoai: data.soDienThoai,
          cccdNumber: data.cccdNumber,
          queQuan: data.queQuan,

          // 2. Auto-fill Thông tin Quân nhân (Nếu backend trả về)
          hostHoTen: data.lastHostHoTen || '',
          hostDonVi: data.lastHostDonVi || '',

          // 3. Auto-fill Chi tiết lượt thăm (Yêu cầu của bạn)
          quanHe: data.lastHostQuanHe || '',
          phuongTien: data.lastHostPhuongTien || '',
          bienSoXe: data.lastHostBienSoXe || '',
          // Chuyển đổi số sang chuỗi cho input
          soLuongNguoi: data.lastHostSoLuongNguoi ? data.lastHostSoLuongNguoi.toString() : '1',
        }));
        
        setIsReturningVisitor(true); // Khóa các trường thông tin cá nhân
      } else {
        // Nếu không tìm thấy (ví dụ DB bị xóa), xóa cache
        localStorage.removeItem('visitorCccd');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Chuẩn bị dữ liệu gửi đi (chuyển đổi kiểu số)
    const submissionData = {
      ...formData,
      soLuongNguoi: parseInt(formData.soLuongNguoi, 10),
    };

    try {
      const res = await fetch(`${API_URL}/visits/register`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify(submissionData),
      });

      if (res.ok) {
        // Lưu CCCD vào bộ nhớ máy để lần sau tự động điền
        localStorage.setItem('visitorCccd', formData.cccdNumber);
        setIsSuccess(true); 
      } else {
        alert('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error(error);
      alert('Không thể kết nối đến máy chủ.');
    }
  };

  // --- RENDER ---

  if (isLoading) return <main className={styles.main}><p>Đang tải dữ liệu...</p></main>;

  // Màn hình Thành công
  if (isSuccess) {
    return (
      <main className={styles.main}>
        <div className={styles.container} style={{textAlign: 'center'}}>
          <div style={{ fontSize: '60px', color: '#28a745', marginBottom: '10px' }}>
            ✓
          </div>
          <h1 style={{color: '#28a745', marginTop: 0}}>Đăng ký thành công!</h1>
          
          <div className={styles.fieldset} style={{ backgroundColor: '#e8f5e9', border: 'none', padding: '20px' }}>
            <p style={{margin: 0, fontSize: '18px'}}>Xin vui lòng xuất trình</p>
            <h2 style={{margin: '10px 0', color: '#2e7d32', fontSize: '28px'}}>THẺ CCCD</h2>
            <p style={{margin: 0, fontSize: '18px'}}>cho người gác cổng để xác nhận.</p>
          </div>

          <p style={{color: '#666', marginTop: '30px'}}>
            Họ tên: <strong>{formData.hoTen}</strong><br/>
            CCCD: <strong>{formData.cccdNumber}</strong>
          </p>

          <button 
            className={styles.btn} 
            style={{marginTop: '20px', backgroundColor: '#666'}}
            onClick={() => {
                // Quay lại form, giữ nguyên thông tin để khách có thể thấy
                setIsSuccess(false);
            }}
          >
            Quay lại trang chủ
          </button>
        </div>
      </main>
    );
  }

  // Form Đăng ký
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Đăng ký thăm</h1>
        <form onSubmit={handleSubmit}>
          
          {/* --- PHẦN 1: THÔNG TIN KHÁCH THĂM --- */}
          <fieldset className={styles.fieldset}>
            <legend>Thông tin khách thăm</legend>
            
            <div className={styles.formGroup}>
              <label htmlFor="cccdNumber">Số Căn cước công dân</label>
              <input 
                type="text" id="cccdNumber" name="cccdNumber" 
                value={formData.cccdNumber} onChange={handleChange} 
                placeholder="Nhập số CCCD" 
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="hoTen">Họ và tên</label>
              <input 
                type="text" id="hoTen" name="hoTen" 
                value={formData.hoTen} onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="soDienThoai">Số điện thoại</label>
              <input 
                type="text" id="soDienThoai" name="soDienThoai" 
                value={formData.soDienThoai} onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="queQuan">Quê quán</label>
              <input 
                type="text" id="queQuan" name="queQuan" 
                value={formData.queQuan} onChange={handleChange} 
              />
            </div>
          </fieldset>

          {/* --- PHẦN 2: THÔNG TIN LƯỢT THĂM --- */}
          <fieldset className={styles.fieldset}>
            <legend>Thông tin lượt thăm</legend>

            {/* Nhập Tên Quân Nhân (Thay vì chọn Dropdown) */}
            <div className={styles.formGroup}>
              <label htmlFor="hostHoTen">Thăm quân nhân (Họ tên)</label>
              <input 
                type="text" id="hostHoTen" name="hostHoTen" 
                value={formData.hostHoTen} onChange={handleChange} required 
                placeholder="Nhập tên người cần gặp"
              />
            </div>

            {/* Nhập Đơn Vị */}
            <div className={styles.formGroup}>
              <label htmlFor="hostDonVi">Đơn vị</label>
              <input 
                type="text" id="hostDonVi" name="hostDonVi" 
                value={formData.hostDonVi} onChange={handleChange} required 
                placeholder="VD: Đại đội 1, Ban Hậu cần..."
              />
            </div>
            
            {/* ĐÃ BỎ TRƯỜNG SỐ ĐIỆN THOẠI QUÂN NHÂN TẠI ĐÂY */}

            <div className={styles.formGroup}>
              <label htmlFor="quanHe">Quan hệ</label>
              <input 
                type="text" id="quanHe" name="quanHe" 
                value={formData.quanHe} onChange={handleChange} required 
                placeholder="VD: Bố, Mẹ, Bạn..."
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="soLuongNguoi">Số lượng người</label>
              <input 
                type="number" id="soLuongNguoi" name="soLuongNguoi" 
                value={formData.soLuongNguoi} onChange={handleChange} min="1" required 
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="phuongTien">Phương tiện</label>
              <input 
                type="text" id="phuongTien" name="phuongTien" 
                value={formData.phuongTien} onChange={handleChange} 
                placeholder="Xe máy, Ô tô (Để trống nếu đi bộ)" 
              />
            </div>

            {/* Hiển thị Biển số xe nếu có nhập phương tiện */}
            {formData.phuongTien && formData.phuongTien.trim() !== '' && (
              <div className={styles.formGroup}>
                <label htmlFor="bienSoXe">Biển số xe</label>
                <input 
                  type="text" id="bienSoXe" name="bienSoXe" 
                  value={formData.bienSoXe} onChange={handleChange} 
                />
              </div>
            )}
          </fieldset>

          <button type="submit" className={styles.btn}>Gửi đăng ký</button>
        </form>
      </div>
    </main>
  );
}