package com._42students.lms.dto.response;

import com._42students.lms.enums.AnnouncementType;
import com._42students.lms.model.Announcement;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class AnnouncementResponseDTO {

    private Long id;
    private AnnouncementType receiverType;
    private Long receiverValue;
    private String message; 
    private String title;
    private String senderName;
    private String senderType;
    private List<Integer> created_at;
    // Part B: schedule/expiry/pin. Surfaced so the admin list can show that an announcement is
    // scheduled/expired/pinned rather than looking identical to a live one.
    private LocalDateTime scheduledAt;
    private LocalDateTime expiresAt;
    private Boolean isPinned;

    public AnnouncementResponseDTO(Announcement announcement) {
        this.id = announcement.getId();
        this.receiverType = announcement.getReceiverType();
        this.receiverValue = announcement.getReceiverValue();
        this.message = announcement.getMessage();
        this.title = announcement.getTitle();
        this.senderName = null; // Initialize senderName as null
        this.senderType = announcement.getSenderType(); // Set the senderType
        this.scheduledAt = announcement.getScheduledAt();
        this.expiresAt = announcement.getExpiresAt();
        this.isPinned = announcement.getIsPinned();
        
        // Format createdAt as [year, month, day] array for frontend compatibility
        LocalDateTime createdAt = announcement.getCreatedAt();
        if (createdAt != null) {
            this.created_at = new ArrayList<>();
            this.created_at.add(createdAt.getYear());      // [0] = year
            this.created_at.add(createdAt.getMonthValue() - 1); // [1] = month (0-indexed: 0=Jan, 11=Dec)
            this.created_at.add(createdAt.getDayOfMonth()); // [2] = day
        }
    }


// Getter and setter for createdBy
    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }


}


 

