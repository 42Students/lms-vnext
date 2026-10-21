/** Explicit old NotificationService CRUD / fetch surface to vNext API map.
 * Legacy numeric class/course/recipient IDs must not be accepted without
 * current membership/tenant authorization or UUID migration mapping.
 * Absence of an endpoint is intentional, never implied by an own-inbox API.
 */
export const NOTIFICATION_LEGACY_API_PARITY=[
 {legacy:"findAll/findAllPaged",vNext:null,status:"ADMIN_ONLY_NOT_PORTED"},
 {legacy:"findAllPagedScoped",vNext:null,status:"ADMIN_SCOPED_NOT_PORTED"},
 {legacy:"findById",vNext:null,status:"ARBITRARY_ID_READ_NOT_EXPOSED"},
 {legacy:"fetch(classId,courseId[,learnerId])",vNext:null,status:"CLASS_COURSE_FEED_NEEDS_SCOPED_READER"},
 {legacy:"getNotificationsByClassId[AsDtos]",vNext:null,status:"CLASS_FEED_NEEDS_SCOPED_READER"},
 {legacy:"getNotificationsForRecipientAsDtos",vNext:"GET /api/notifications",status:"ADAPTED_SELF_ONLY"},
 {legacy:"save/createNotification/createFacultyNotification",vNext:null,status:"PRIVILEGED_EVENT_PRODUCER_ONLY"},
 {legacy:"updateNotification",vNext:null,status:"ADMIN_MUTATION_NOT_PORTED"},
 {legacy:"deleteNotification",vNext:null,status:"ADMIN_MUTATION_NOT_PORTED"},
 {legacy:"mark read",vNext:"POST /api/notifications/[notificationId]/read",status:"OWNER_SCOPED"},
 {legacy:"mark all read",vNext:"POST /api/tpo/notifications/read-all",status:"TPO_SELF_SCOPED"},
] as const;
export type NotificationLegacyApiParityItem=(typeof NOTIFICATION_LEGACY_API_PARITY)[number];
