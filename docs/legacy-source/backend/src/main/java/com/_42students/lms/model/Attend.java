package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;


@Data
@Entity(name = "attend")
@Table(name = "attend", uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "class_schedule_id"}))
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class Attend extends BaseModel {
    @Column(name = "student_id")
    private String studentId;
    // 4.2: no class_id column here by design -- the class association is reached transitively
    // via class_schedule_id (see AttendanceRepository.getAbsentCountByLearnerAndClass, which
    // joins through class_schedule for exactly this). A dead commented-out field used to sit
    // here implying an intended-but-abandoned direct column; removed rather than resurrected,
    // since adding it now would just be a second, easily-desynced way to reach the same class.
    @Column(name = "class_schedule_id")
    private int classScheduleId;
    @Column(name = "drop_class_reason")
    private String dropClassReason;

    /**
     * W2: "a student disputes an attendance record ... can't see who marked it". The row recorded
     * only that the student was absent, never who decided so. NULL for pre-existing rows, so
     * "unknown" stays distinguishable from "nobody".
     */
    @Column(name = "marked_by")
    private Integer markedBy;

    /**
     * W2: "... can't mark it excused". NULL means a plain unexplained absence — which is what every
     * pre-existing row is, so nothing needed backfilling and percentage maths is unaffected.
     * Values: EXCUSED, MEDICAL, LATE (see AttendanceStatus).
     */
    @Column(name = "attendance_status", length = 20)
    private String attendanceStatus;
}

