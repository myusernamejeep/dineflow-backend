app จองโต๊ะอาหาร และมีการจ่ายตังค่าจอง
 
จากระบบเราในไฟล์ feature.md อธิบายไว้เราจะกลับมาทำต่อ 

กลับมาที่หน้าเว็บหลักเรา ให้มีระบบ login line เพื่อเก็บเป็นข้อมูลคนที่จอง จะย้อนกลับมาดูรายการที่จองได้  

สามารถกดยกเลิกการจองได้ (คืนเต็มจำนวนหากยกเลิกก่อน 24 ชม. หลัง 24 คืนตามเวลาที่เหลือ)

สามารถนำโค้ดจองไปแสดงเป็น qr code ให้หน้าร้านที่จอง สแกนเช็คว่าคนจองมาแล้ว โดยหน้าสแกน qr จะอยู่ที่ admin  เมื่อสแกนแล้วก็จะอัพเดทสถานะการจองทั้งฝั่่ง ผู้จองและ admin ตรงกันว่ามา checkin แล้ว 



ตัว Qr กดจาก history การจอง แสดงเป็น modal ที่เป็น qr ขึ้นมา สามารถสแกน เช็คอินได้   
ทำ Booking model หรือปรับให้ดีขึ้น ทำ User model ให้ เพื้อจะแสดงข้อมูลคนที่ login ที่หน้า index ได้    
โดยหากยังไม่ได้ login line จะไม่แสดง history และ book ไม่ได้  จะพาไปป login line ก่อน  
แก้ไขไฟล์ในโปรเจกต์ทีละไฟล์จนครบ   
เพิ่มการแจ้งเตือนผ่าน เป็น LINE Messaging API หรือ email ในแต่ละจุด (หลังยกเลิก/เช็คอิน)