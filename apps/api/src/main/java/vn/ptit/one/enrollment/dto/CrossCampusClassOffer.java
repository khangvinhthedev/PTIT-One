package vn.ptit.one.enrollment.dto;

import java.util.List;

import vn.ptit.one.course.model.ClassSection;
import vn.ptit.one.timetable.model.ScheduleSlot;

/**
 * Lớp của cơ sở đích mà sinh viên cơ sở khác được gửi yêu cầu, kèm lịch.
 *
 * <p>Read model của {@code GET /api/me/cross-campus/classes}: gộp {@code LopHocPhan}
 * ở Host với buổi học ở module {@code timetable} để màn hình không phải gọi
 * chéo cơ sở thêm lần nào.
 */
public record CrossCampusClassOffer(
        String maLopHP,
        String maMonHoc,
        String tenMonHoc,
        int soTinChi,
        String maHocKy,
        String maCoSoHost,
        String maGiangVien,
        String tenGiangVien,
        int soLuongToiDa,
        int soLuongDaDangKy,
        String trangThai,
        boolean choPhepLienCoSo,
        String hinhThucHoc,
        int phienBanLich,
        List<ScheduleSlot> lich) {

    public static CrossCampusClassOffer of(ClassSection lop, List<ScheduleSlot> lich) {
        return new CrossCampusClassOffer(lop.maLopHP(), lop.maMonHoc(), lop.tenMonHoc(),
                lop.soTinChi(), lop.maHocKy(), lop.maCoSoHost(), lop.maGiangVien(),
                lop.tenGiangVien(), lop.soLuongToiDa(), lop.soLuongDaDangKy(), lop.trangThai(),
                lop.choPhepLienCoSo(), lop.hinhThucHoc(), lop.phienBanLich(), lich);
    }
}
