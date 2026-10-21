
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `admin_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_audit_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_user_id` int DEFAULT NULL,
  `actor_user_type` varchar(20) DEFAULT NULL,
  `actor_contact_mobile` varchar(32) DEFAULT NULL,
  `action_key` varchar(100) NOT NULL,
  `entity_type` varchar(60) DEFAULT NULL,
  `entity_id` varchar(60) DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `payload_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_created_at` (`created_at`),
  KEY `idx_audit_actor` (`actor_user_id`,`actor_user_type`),
  KEY `idx_audit_scope` (`organization_id`,`college_id`),
  KEY `idx_audit_action` (`action_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `receiver_type` varchar(255) DEFAULT NULL,
  `receiver_value` bigint DEFAULT NULL,
  `sender_id` bigint DEFAULT NULL,
  `sender_type` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_announcements_visibility` (`scheduled_at`,`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `app_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_setting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `scope_type` varchar(32) NOT NULL,
  `scope_id` int DEFAULT NULL,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text,
  `scope_id_key` int GENERATED ALWAYS AS (ifnull(`scope_id`,-(1))) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_app_setting_scope_key` (`scope_type`,`scope_id`,`setting_key`),
  UNIQUE KEY `uq_app_setting_scope_key_v2` (`scope_type`,`scope_id_key`,`setting_key`),
  KEY `idx_app_setting_scope` (`scope_type`,`scope_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `application_screening`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_screening` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `education_score` double DEFAULT NULL,
  `excluded_attributes` json DEFAULT NULL,
  `explanation` text,
  `is_partial_score` bit(1) DEFAULT NULL,
  `matched_skills` json DEFAULT NULL,
  `missing_skills` json DEFAULT NULL,
  `overall_score` double DEFAULT NULL,
  `screened_at` datetime(6) DEFAULT NULL,
  `screened_by` varchar(255) DEFAULT NULL,
  `screening_metadata` json DEFAULT NULL,
  `screening_method` varchar(255) DEFAULT NULL,
  `screening_status` varchar(255) NOT NULL,
  `screening_version` varchar(255) DEFAULT NULL,
  `skill_score` double DEFAULT NULL,
  `application_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_lqo1ejq47euco9eoofyk8q93q` (`application_id`),
  UNIQUE KEY `UKlqo1ejq47euco9eoofyk8q93q` (`application_id`),
  CONSTRAINT `FKn69crjuo812p0v6s4rtu7t8p9` FOREIGN KEY (`application_id`) REFERENCES `job_application` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `approver_id_card`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approver_id_card` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `cloud_storage_object` varchar(255) DEFAULT NULL,
  `encoding` varchar(255) DEFAULT NULL,
  `media_code` varchar(255) DEFAULT NULL,
  `mimetype` varchar(255) DEFAULT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `assigned_exam_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK6p48d286t3u7om6880woukx2t` (`assigned_exam_id`),
  CONSTRAINT `FK6p48d286t3u7om6880woukx2t` FOREIGN KEY (`assigned_exam_id`) REFERENCES `assigned_exam` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `assigned_exam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assigned_exam` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `atempd_ques_count` int DEFAULT NULL,
  `chat` json DEFAULT NULL,
  `correct_attempt_count` int DEFAULT NULL,
  `earned_score` int DEFAULT NULL,
  `end_time` varchar(255) DEFAULT NULL,
  `evaluator_id` varchar(255) DEFAULT NULL,
  `result_status` varchar(255) DEFAULT NULL,
  `start_time` varchar(255) DEFAULT NULL,
  `started_screen_sharing` bit(1) DEFAULT NULL,
  `started_video_sharing` bit(1) DEFAULT NULL,
  `status` int DEFAULT NULL,
  `total_ques_count` int DEFAULT NULL,
  `warnings` json DEFAULT NULL,
  `examinee_id` int DEFAULT NULL,
  `version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `FKj4dgxoekt753s715tpbmessus` (`examinee_id`),
  CONSTRAINT `FKj4dgxoekt753s715tpbmessus` FOREIGN KEY (`examinee_id`) REFERENCES `examinee` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `assignment_upload_receipt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment_upload_receipt` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receipt_id` varchar(64) NOT NULL,
  `storage_key` varchar(1024) NOT NULL,
  `public_url` varchar(2048) DEFAULT NULL,
  `folder` varchar(80) DEFAULT NULL,
  `upload_type` varchar(80) DEFAULT NULL,
  `owner_user_id` int NOT NULL,
  `owner_user_type` varchar(40) DEFAULT NULL,
  `lesson_content_id` int DEFAULT NULL,
  `declared_content_type` varchar(255) DEFAULT NULL,
  `declared_content_length` bigint DEFAULT NULL,
  `actual_content_type` varchar(255) DEFAULT NULL,
  `actual_content_length` bigint DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `student_assignment_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_assignment_upload_receipt_id` (`receipt_id`),
  KEY `idx_assignment_upload_receipt_storage_key` (`storage_key`(255)),
  KEY `idx_assignment_upload_receipt_owner` (`owner_user_id`,`owner_user_type`),
  KEY `idx_assignment_upload_receipt_lesson` (`lesson_content_id`),
  KEY `idx_assignment_upload_receipt_consumed` (`consumed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `attempted_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attempted_question` (
  `attendee_answers` json DEFAULT NULL,
  `awarded_score` int DEFAULT NULL,
  `correct` bit(1) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT '0',
  `evaluation_completed` bit(1) DEFAULT NULL,
  `evaluator_id` varchar(255) DEFAULT NULL,
  `question_type` int DEFAULT NULL,
  `saved` bit(1) DEFAULT NULL,
  `submitted` bit(1) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `assgined_exam_id` int NOT NULL,
  `question_id` int NOT NULL,
  PRIMARY KEY (`assgined_exam_id`,`question_id`),
  KEY `FKd1j74nub5yu3hech5y9c900u0` (`question_id`),
  CONSTRAINT `FK29p3l4ls0bk54akk2pir546gc` FOREIGN KEY (`assgined_exam_id`) REFERENCES `assigned_exam` (`id`),
  CONSTRAINT `FKd1j74nub5yu3hech5y9c900u0` FOREIGN KEY (`question_id`) REFERENCES `question` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `attend`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attend` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `class_schedule_id` int DEFAULT NULL,
  `drop_class_reason` varchar(255) DEFAULT NULL,
  `student_id` varchar(255) DEFAULT NULL,
  `marked_by` int DEFAULT NULL,
  `attendance_status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_attend_student_schedule` (`student_id`,`class_schedule_id`),
  UNIQUE KEY `UKrqjvi89peay2rwa5a4udujjun` (`student_id`,`class_schedule_id`),
  KEY `idx_attend_is_deleted` (`is_deleted`),
  KEY `idx_attend_class_schedule_id` (`class_schedule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `auth_handoff_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_handoff_token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `token` varchar(128) NOT NULL,
  `access_token` text NOT NULL,
  `refresh_token` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_auth_handoff_token_token` (`token`),
  KEY `idx_auth_handoff_token_expires_used` (`expires_at`,`used`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `auth_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `backup_legacy_content_progress_quiz_20260501`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_legacy_content_progress_quiz_20260501` (
  `id` int NOT NULL DEFAULT '0',
  `learner_id` int NOT NULL,
  `lesson_content_id` int NOT NULL,
  `last_position_seconds` int NOT NULL DEFAULT '0',
  `duration_seconds` int NOT NULL DEFAULT '0',
  `completed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `backup_legacy_content_sequence_quiz_20260501`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_legacy_content_sequence_quiz_20260501` (
  `id` int NOT NULL DEFAULT '0',
  `lesson_content_id` int NOT NULL,
  `class_id` int NOT NULL,
  `sequence` bigint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `backup_legacy_discussions_quiz_20260501`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_legacy_discussions_quiz_20260501` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `content_text` varchar(255) DEFAULT NULL,
  `lesson_content_id` int DEFAULT NULL,
  `profile_name` varchar(255) DEFAULT NULL,
  `sequence` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `backup_legacy_lesson_contents_quiz_20260501`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_legacy_lesson_contents_quiz_20260501` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `active` bit(1) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `content_data` json DEFAULT NULL,
  `content_title` varchar(255) DEFAULT NULL,
  `content_type` varchar(255) DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `course_name` varchar(255) DEFAULT NULL,
  `enabled` bit(1) DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  `lesson_id` int DEFAULT NULL,
  `points` bigint DEFAULT NULL,
  `quiz_content_data` json DEFAULT NULL,
  `sequence` bigint DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `max_attempts` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `backup_legacy_quiz_attempt_20260501`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_legacy_quiz_attempt_20260501` (
  `id` bigint NOT NULL DEFAULT '0',
  `attempt_id` varchar(64) NOT NULL,
  `student_id` int NOT NULL,
  `lesson_content_id` int NOT NULL,
  `started_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `backup_legacy_quiz_draft_20260501`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_legacy_quiz_draft_20260501` (
  `id` bigint NOT NULL DEFAULT '0',
  `student_id` int NOT NULL,
  `lesson_content_id` int NOT NULL,
  `draft_data` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `backup_legacy_quiz_ids_20260501`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_legacy_quiz_ids_20260501` (
  `id` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `backup_legacy_student_assignment_quiz_20260501`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_legacy_student_assignment_quiz_20260501` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `assignment_name` varchar(255) DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  `assignment_contents` json DEFAULT NULL,
  `graded` int DEFAULT NULL,
  `grading_date` varchar(255) DEFAULT NULL,
  `html_content` varchar(255) DEFAULT NULL,
  `lesson_content_id` int DEFAULT NULL,
  `points` bigint DEFAULT NULL,
  `points_obtained` bigint DEFAULT NULL,
  `quiz_contents` json DEFAULT NULL,
  `student_first_name` varchar(255) DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `student_last_name` varchar(255) DEFAULT NULL,
  `version` int NOT NULL DEFAULT '0',
  `grading_status` varchar(20) DEFAULT 'NOT_GRADED',
  `graded_by` int DEFAULT NULL,
  `graded_at` datetime DEFAULT NULL,
  `previous_points` bigint DEFAULT '0',
  `attempt_number` int NOT NULL DEFAULT '1',
  `is_grade_published` tinyint(1) NOT NULL DEFAULT '0',
  `semester_number` tinyint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `batch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `academic_year` varchar(255) DEFAULT NULL,
  `batch_name` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `current_semester` int DEFAULT NULL,
  `current_students` int DEFAULT NULL,
  `end_date` datetime(6) DEFAULT NULL,
  `program_id` bigint DEFAULT NULL,
  `start_date` datetime(6) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `class`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `batch_id` int DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `lower_limit` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `upper_limit` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `class_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_schedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `end_time` varchar(255) DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  `lecture_hall_id` int DEFAULT NULL,
  `start_time` varchar(255) DEFAULT NULL,
  `title` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_class_schedule_class_start` (`class_id`,`start_time`),
  KEY `idx_class_schedule_faculty_start` (`faculty_id`,`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `classroom_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classroom_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `course_id` int NOT NULL,
  `class_id` int NOT NULL,
  `sender_id` int DEFAULT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `sender_role` varchar(64) DEFAULT NULL,
  `message_text` text NOT NULL,
  `is_pinned` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_classroom_messages_scope` (`course_id`,`class_id`,`is_deleted`,`is_pinned`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_faculty_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_faculty_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `suspended_at` datetime DEFAULT NULL,
  `suspension_reason` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `awards` json DEFAULT NULL,
  `blood_group` varchar(255) DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `contact_mail` varchar(255) DEFAULT NULL,
  `contact_mobile` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `current_address` text,
  `department` varchar(255) DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `description` text,
  `dob` varchar(255) DEFAULT NULL,
  `experiences` json DEFAULT NULL,
  `faculty_type` int DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `google_scholar` varchar(255) DEFAULT NULL,
  `identity` json DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `organizations` json DEFAULT NULL,
  `permanent_address` text,
  `pincode` varchar(255) DEFAULT NULL,
  `publications` json DEFAULT NULL,
  `qualifications` json DEFAULT NULL,
  `research_gate` varchar(255) DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `token_version` int NOT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `user_type` varchar(22) DEFAULT 'FACULTY',
  `website` varchar(255) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_odd_dob_faculty_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_odd_dob_faculty_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `suspended_at` datetime DEFAULT NULL,
  `suspension_reason` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `awards` json DEFAULT NULL,
  `blood_group` varchar(255) DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `contact_mail` varchar(255) DEFAULT NULL,
  `contact_mobile` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `current_address` text,
  `department` varchar(255) DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `description` text,
  `dob` varchar(255) DEFAULT NULL,
  `experiences` json DEFAULT NULL,
  `faculty_type` int DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `google_scholar` varchar(255) DEFAULT NULL,
  `identity` json DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `organizations` json DEFAULT NULL,
  `permanent_address` text,
  `pincode` varchar(255) DEFAULT NULL,
  `publications` json DEFAULT NULL,
  `qualifications` json DEFAULT NULL,
  `research_gate` varchar(255) DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `token_version` int NOT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `user_type` varchar(22) DEFAULT 'FACULTY',
  `website` varchar(255) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_odd_dob_learner_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_odd_dob_learner_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `suspended_at` datetime DEFAULT NULL,
  `suspension_reason` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `achievements` json DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `blood_group` varchar(255) DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `contact_mail` varchar(255) DEFAULT NULL,
  `contact_mobile` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `current_address` text,
  `department` varchar(255) DEFAULT NULL,
  `description` text,
  `dob` varchar(255) DEFAULT NULL,
  `experiences` json DEFAULT NULL,
  `extracurricular` json DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `github` varchar(255) DEFAULT NULL,
  `hobbies` json DEFAULT NULL,
  `identity` json DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `organizations` json DEFAULT NULL,
  `permanent_address` text,
  `pincode` varchar(255) DEFAULT NULL,
  `portfolio` varchar(255) DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `projects` json DEFAULT NULL,
  `resume_url` text,
  `roll_number` varchar(255) DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `token_version` int NOT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `user_type` varchar(22) DEFAULT 'LEARNER',
  `video_intro_uploaded_at` datetime(6) DEFAULT NULL,
  `video_intro_url` text,
  `website` varchar(255) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `bulk_import_batch_id` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_test_college_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_test_college_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `college_chair_id` int DEFAULT NULL,
  `college_vice_chair_id` int DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `org_id` int DEFAULT NULL,
  `pin_code` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `unique_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_test_department_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_test_department_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `dept_chair_id` int DEFAULT NULL,
  `dept_vice_chair_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_test_faculty_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_test_faculty_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `suspended_at` datetime DEFAULT NULL,
  `suspension_reason` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `awards` json DEFAULT NULL,
  `blood_group` varchar(255) DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `contact_mail` varchar(255) DEFAULT NULL,
  `contact_mobile` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `current_address` text,
  `department` varchar(255) DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `description` text,
  `dob` varchar(255) DEFAULT NULL,
  `experiences` json DEFAULT NULL,
  `faculty_type` int DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `google_scholar` varchar(255) DEFAULT NULL,
  `identity` json DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `organizations` json DEFAULT NULL,
  `permanent_address` text,
  `pincode` varchar(255) DEFAULT NULL,
  `publications` json DEFAULT NULL,
  `qualifications` json DEFAULT NULL,
  `research_gate` varchar(255) DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `token_version` int NOT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `user_type` varchar(22) DEFAULT 'FACULTY',
  `website` varchar(255) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_test_job_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_test_job_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `application_deadline` datetime(6) DEFAULT NULL,
  `candidate_preferences` json DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `company_logo` varchar(500) DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `company_name` varchar(100) NOT NULL,
  `created_by` int DEFAULT NULL,
  `ctc_range` varchar(255) DEFAULT NULL,
  `evaluation_config` json DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `job_description` text,
  `job_responsibilities` text,
  `job_slug` varchar(32) DEFAULT NULL,
  `job_title` varchar(100) NOT NULL,
  `job_type` varchar(50) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `organization_id` int NOT NULL,
  `posted_date` datetime(6) DEFAULT NULL,
  `screening_version` varchar(255) NOT NULL,
  `target_batch_id` int DEFAULT NULL,
  `target_class_id` int DEFAULT NULL,
  `target_department_id` int DEFAULT NULL,
  `target_program_id` int DEFAULT NULL,
  `visibility_type` varchar(255) NOT NULL,
  `important_dates` json DEFAULT NULL,
  `assessment_url` varchar(2048) DEFAULT NULL,
  `assessment_deadline` datetime DEFAULT NULL,
  `is_draft` tinyint(1) NOT NULL DEFAULT '0',
  `version` bigint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_test_learner_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_test_learner_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `suspended_at` datetime DEFAULT NULL,
  `suspension_reason` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `achievements` json DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `blood_group` varchar(255) DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `contact_mail` varchar(255) DEFAULT NULL,
  `contact_mobile` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `current_address` text,
  `department` varchar(255) DEFAULT NULL,
  `description` text,
  `dob` varchar(255) DEFAULT NULL,
  `experiences` json DEFAULT NULL,
  `extracurricular` json DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `github` varchar(255) DEFAULT NULL,
  `hobbies` json DEFAULT NULL,
  `identity` json DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `organizations` json DEFAULT NULL,
  `permanent_address` text,
  `pincode` varchar(255) DEFAULT NULL,
  `portfolio` varchar(255) DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `projects` json DEFAULT NULL,
  `resume_url` text,
  `roll_number` varchar(255) DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `token_version` int NOT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `user_type` varchar(22) DEFAULT 'LEARNER',
  `video_intro_uploaded_at` datetime(6) DEFAULT NULL,
  `video_intro_url` text,
  `website` varchar(255) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `bulk_import_batch_id` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_test_org_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_test_org_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_young_dob_faculty_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_young_dob_faculty_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `suspended_at` datetime DEFAULT NULL,
  `suspension_reason` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `awards` json DEFAULT NULL,
  `blood_group` varchar(255) DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `contact_mail` varchar(255) DEFAULT NULL,
  `contact_mobile` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `current_address` text,
  `department` varchar(255) DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `description` text,
  `dob` varchar(255) DEFAULT NULL,
  `experiences` json DEFAULT NULL,
  `faculty_type` int DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `google_scholar` varchar(255) DEFAULT NULL,
  `identity` json DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `organizations` json DEFAULT NULL,
  `permanent_address` text,
  `pincode` varchar(255) DEFAULT NULL,
  `publications` json DEFAULT NULL,
  `qualifications` json DEFAULT NULL,
  `research_gate` varchar(255) DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `token_version` int NOT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `user_type` varchar(22) DEFAULT 'FACULTY',
  `website` varchar(255) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_full_lms_young_dob_learner_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_full_lms_young_dob_learner_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `suspended_at` datetime DEFAULT NULL,
  `suspension_reason` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `achievements` json DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `blood_group` varchar(255) DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `contact_mail` varchar(255) DEFAULT NULL,
  `contact_mobile` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `current_address` text,
  `department` varchar(255) DEFAULT NULL,
  `description` text,
  `dob` varchar(255) DEFAULT NULL,
  `experiences` json DEFAULT NULL,
  `extracurricular` json DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `github` varchar(255) DEFAULT NULL,
  `hobbies` json DEFAULT NULL,
  `identity` json DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `organizations` json DEFAULT NULL,
  `permanent_address` text,
  `pincode` varchar(255) DEFAULT NULL,
  `portfolio` varchar(255) DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `projects` json DEFAULT NULL,
  `resume_url` text,
  `roll_number` varchar(255) DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `token_version` int NOT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `user_type` varchar(22) DEFAULT 'LEARNER',
  `video_intro_uploaded_at` datetime(6) DEFAULT NULL,
  `video_intro_url` text,
  `website` varchar(255) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `bulk_import_batch_id` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_placement_application_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_placement_application_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `application_status` varchar(255) DEFAULT NULL,
  `applied_at` datetime(6) DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `pap_requested` bit(1) NOT NULL,
  `resume_url` text,
  `resume_history` json DEFAULT NULL,
  `source` varchar(50) DEFAULT NULL,
  `status_updated_at` datetime(6) DEFAULT NULL,
  `status_updated_by` int DEFAULT NULL,
  `job_id` int NOT NULL,
  `learner_id` int NOT NULL,
  `internal_notes` text,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `offer_letter_url` text,
  `offer_letter_sent_at` datetime DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `status_before_withdrawal` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_placement_application_ids_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_placement_application_ids_20260918` (
  `id` int NOT NULL,
  `reason` varchar(80) NOT NULL,
  `captured_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_placement_company_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_placement_company_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `name` varchar(150) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `website` varchar(500) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `description` text,
  `contact_person_name` varchar(150) DEFAULT NULL,
  `contact_email` varchar(150) DEFAULT NULL,
  `contact_phone` varchar(30) DEFAULT NULL,
  `internal_notes` text,
  `college_id` int DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `dedup_key` varchar(200) DEFAULT NULL,
  `dedup_key_active` varchar(210) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_placement_company_ids_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_placement_company_ids_20260918` (
  `id` int NOT NULL,
  `reason` varchar(80) NOT NULL,
  `captured_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_placement_job_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_placement_job_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `application_deadline` datetime(6) DEFAULT NULL,
  `candidate_preferences` json DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `company_logo` varchar(500) DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `company_name` varchar(100) NOT NULL,
  `created_by` int DEFAULT NULL,
  `ctc_range` varchar(255) DEFAULT NULL,
  `evaluation_config` json DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `job_description` text,
  `job_responsibilities` text,
  `job_slug` varchar(32) DEFAULT NULL,
  `job_title` varchar(100) NOT NULL,
  `job_type` varchar(50) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `organization_id` int NOT NULL,
  `posted_date` datetime(6) DEFAULT NULL,
  `screening_version` varchar(255) NOT NULL,
  `target_batch_id` int DEFAULT NULL,
  `target_class_id` int DEFAULT NULL,
  `target_department_id` int DEFAULT NULL,
  `target_program_id` int DEFAULT NULL,
  `visibility_type` varchar(255) NOT NULL,
  `important_dates` json DEFAULT NULL,
  `assessment_url` varchar(2048) DEFAULT NULL,
  `assessment_deadline` datetime DEFAULT NULL,
  `is_draft` tinyint(1) NOT NULL DEFAULT '0',
  `version` bigint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_placement_job_ids_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_placement_job_ids_20260918` (
  `id` int NOT NULL,
  `reason` varchar(80) NOT NULL,
  `captured_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_placement_saved_job_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_placement_saved_job_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `learner_id` int NOT NULL,
  `job_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_project_template_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_project_template_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `slug` varchar(80) NOT NULL,
  `title` varchar(160) NOT NULL,
  `summary` text,
  `course_label` varchar(160) DEFAULT NULL,
  `status` varchar(40) DEFAULT 'IN_PROGRESS',
  `phase` varchar(80) DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `overview` json DEFAULT NULL,
  `sprints` json DEFAULT NULL,
  `tasks` json DEFAULT NULL,
  `resources` json DEFAULT NULL,
  `delivery` json DEFAULT NULL,
  `meetings` json DEFAULT NULL,
  `activity` json DEFAULT NULL,
  `template_version` int NOT NULL DEFAULT '1',
  `lifecycle_status` varchar(20) NOT NULL DEFAULT 'DRAFT',
  `published_at` datetime DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_project_template_ids_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_project_template_ids_20260918` (
  `id` int NOT NULL,
  `reason` varchar(64) NOT NULL,
  `captured_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_project_workspace_backup_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_project_workspace_backup_20260918` (
  `id` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `slug` varchar(80) NOT NULL,
  `title` varchar(160) NOT NULL,
  `summary` text,
  `course_label` varchar(160) DEFAULT NULL,
  `status` varchar(40) DEFAULT 'IN_PROGRESS',
  `phase` varchar(80) DEFAULT NULL,
  `progress` int DEFAULT '0',
  `blocker` text,
  `next_action` text,
  `due_label` varchar(80) DEFAULT NULL,
  `organization_id` int NOT NULL,
  `college_id` int NOT NULL,
  `class_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `overview` json DEFAULT NULL,
  `sprints` json DEFAULT NULL,
  `tasks` json DEFAULT NULL,
  `resources` json DEFAULT NULL,
  `delivery` json DEFAULT NULL,
  `meetings` json DEFAULT NULL,
  `activity` json DEFAULT NULL,
  `template_id` int DEFAULT NULL,
  `bulk_learner_id` int DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `readiness_override` tinyint(1) DEFAULT NULL,
  `readiness_override_note` text,
  `readiness_override_by` int DEFAULT NULL,
  `readiness_override_at` datetime DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `sprint_length_weeks` int DEFAULT '4',
  `estimation_unit` varchar(20) DEFAULT 'POINTS'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cleanup_legacy_project_workspace_ids_20260918`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanup_legacy_project_workspace_ids_20260918` (
  `id` int NOT NULL,
  `reason` varchar(64) NOT NULL,
  `captured_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `college`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `college` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `college_chair_id` int DEFAULT NULL,
  `college_vice_chair_id` int DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `org_id` int DEFAULT NULL,
  `pin_code` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_5ihdcun5fkjshhdmpdh1kudhg` (`unique_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `college_branding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `college_branding` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `college_id` int NOT NULL,
  `logo_url` varchar(1024) DEFAULT NULL,
  `favicon_url` varchar(1024) DEFAULT NULL,
  `login_background_url` varchar(1024) DEFAULT NULL,
  `login_background_url_mobile` varchar(1024) DEFAULT NULL,
  `primary_color` varchar(64) DEFAULT NULL,
  `secondary_color` varchar(64) DEFAULT NULL,
  `support_email` varchar(255) DEFAULT NULL,
  `support_phone` varchar(64) DEFAULT NULL,
  `terms_url` varchar(1024) DEFAULT NULL,
  `privacy_url` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_college_branding_college_id` (`college_id`),
  CONSTRAINT `fk_college_branding_college_id` FOREIGN KEY (`college_id`) REFERENCES `college` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `website` varchar(500) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `description` text,
  `contact_person_name` varchar(150) DEFAULT NULL,
  `contact_email` varchar(150) DEFAULT NULL,
  `contact_phone` varchar(30) DEFAULT NULL,
  `internal_notes` text,
  `college_id` int DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `dedup_key` varchar(200) GENERATED ALWAYS AS (if((`college_id` is null),concat(_utf8mb4'org:',coalesce(`organization_id`,0),_utf8mb4':',lower(`name`)),concat(_utf8mb4'college:',`college_id`,_utf8mb4':',lower(`name`)))) STORED,
  `dedup_key_active` varchar(210) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_company_dedup_key_active` (`dedup_key_active`),
  KEY `idx_company_college` (`college_id`),
  KEY `idx_company_org` (`organization_id`),
  KEY `idx_company_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `active` bit(1) DEFAULT NULL,
  `allowed_for_display` int DEFAULT NULL,
  `course_name` varchar(255) DEFAULT NULL,
  `created_by_org_id` int DEFAULT NULL,
  `default_subscription_days` int DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `enabled` bit(1) DEFAULT NULL,
  `formal_title` varchar(255) DEFAULT NULL,
  `contents` json DEFAULT NULL,
  `parent_course_id` int DEFAULT NULL,
  `short_title` varchar(255) DEFAULT NULL,
  `slug` varchar(64) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `course_name_key` varchar(255) GENERATED ALWAYS AS ((case when (((`is_deleted` is null) or (`is_deleted` = 0)) and (`course_name` is not null) and (trim(`course_name`) <> _utf8mb4'')) then lower(trim(`course_name`)) else NULL end)) STORED,
  `short_title_key` varchar(255) GENERATED ALWAYS AS ((case when (((`is_deleted` is null) or (`is_deleted` = 0)) and (`short_title` is not null) and (trim(`short_title`) <> _utf8mb4'')) then lower(trim(`short_title`)) else NULL end)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_dduji3l55k63yvfcxs7n07bba` (`slug`),
  UNIQUE KEY `ux_course_dept_name_active` (`dept_id`,`course_name_key`),
  UNIQUE KEY `ux_course_dept_short_title_active` (`dept_id`,`short_title_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `dept_chair_id` int DEFAULT NULL,
  `dept_vice_chair_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `discussions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discussions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `content_text` varchar(255) DEFAULT NULL,
  `lesson_content_id` int DEFAULT NULL,
  `profile_name` varchar(255) DEFAULT NULL,
  `sequence` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `parent_discussion_id` bigint DEFAULT NULL,
  `discussion_status` varchar(20) NOT NULL DEFAULT 'OPEN',
  `is_faculty_answer` bit(1) NOT NULL DEFAULT b'0',
  `resolved_at` datetime(6) DEFAULT NULL,
  `resolved_by` int DEFAULT NULL,
  `attachment_url` text,
  PRIMARY KEY (`id`),
  KEY `idx_discussions_lesson_parent_created` (`lesson_content_id`,`parent_discussion_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `email_verification_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verification_token` (
  `token` varchar(36) NOT NULL,
  `application_id` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(255) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `verified` bit(1) NOT NULL,
  `verified_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_email` (`email`),
  KEY `idx_application_id` (`application_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `course_code` varchar(255) DEFAULT NULL,
  `course_name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `end_time` datetime(6) DEFAULT NULL,
  `exam_code` varchar(255) DEFAULT NULL,
  `exam_date` varchar(255) DEFAULT NULL,
  `exam_title` varchar(255) DEFAULT NULL,
  `org_id` varchar(255) DEFAULT NULL,
  `pass_score` int DEFAULT NULL,
  `published` bit(1) NOT NULL,
  `result_option` int DEFAULT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `status` int NOT NULL,
  `teacher_id` varchar(255) DEFAULT NULL,
  `time_restriction_type` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_fky6l2md2785795smg7rpbvet` (`exam_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_faculty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_faculty` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `dept_name` varchar(255) NOT NULL,
  `added_by` varchar(255) NOT NULL,
  `mobile` varchar(255) NOT NULL,
  `staff_code` varchar(255) NOT NULL,
  `staff_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_jha7bf2vb30lxv95dcdkddu2u` (`staff_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_faculty_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_faculty_mapping` (
  `exam_id` int NOT NULL,
  `faculty_id` int NOT NULL,
  PRIMARY KEY (`exam_id`,`faculty_id`),
  KEY `FKhewd6627w1anwk1882dqn1dhp` (`faculty_id`),
  CONSTRAINT `FKgj8pu31bvujbr5ekbccm887eb` FOREIGN KEY (`exam_id`) REFERENCES `exam_faculty` (`id`),
  CONSTRAINT `FKhewd6627w1anwk1882dqn1dhp` FOREIGN KEY (`faculty_id`) REFERENCES `exam` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_monitoring`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_monitoring` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `cloud_storage_object` varchar(255) DEFAULT NULL,
  `encoding` varchar(255) DEFAULT NULL,
  `media_code` varchar(255) DEFAULT NULL,
  `mimetype` varchar(255) DEFAULT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `sequence` int NOT NULL,
  `assgined_exam_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKr8o1t7xawiub4c3bwq41sqfkm` (`assgined_exam_id`),
  CONSTRAINT `FKr8o1t7xawiub4c3bwq41sqfkm` FOREIGN KEY (`assgined_exam_id`) REFERENCES `assigned_exam` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `examinee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examinee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `exam_id` int NOT NULL,
  `invited_by` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `proctor_id` varchar(255) DEFAULT NULL,
  `reg_no` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_htl2r1i8cha0d7p1pnnctdpin` (`mobile`),
  UNIQUE KEY `UK_ditao76lli51nlmxsp61olejg` (`reg_no`),
  KEY `examinee_mobile_idx` (`mobile`),
  KEY `examinee_exam_idx` (`exam_id`),
  KEY `examinee_proctor_idx` (`proctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `facial_recognition_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facial_recognition_result` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `face_image_url` varchar(255) DEFAULT NULL,
  `original_url` varchar(255) DEFAULT NULL,
  `subject_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `faculty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculty` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `suspended_at` datetime DEFAULT NULL,
  `suspension_reason` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `awards` json DEFAULT NULL,
  `blood_group` varchar(255) DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `contact_mail` varchar(255) DEFAULT NULL,
  `contact_mobile` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `current_address` text,
  `department` varchar(255) DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `description` text,
  `dob` varchar(255) DEFAULT NULL,
  `experiences` json DEFAULT NULL,
  `faculty_type` int DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `google_scholar` varchar(255) DEFAULT NULL,
  `identity` json DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `organizations` json DEFAULT NULL,
  `permanent_address` text,
  `pincode` varchar(255) DEFAULT NULL,
  `publications` json DEFAULT NULL,
  `qualifications` json DEFAULT NULL,
  `research_gate` varchar(255) DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `token_version` int NOT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `user_type` varchar(22) DEFAULT 'FACULTY',
  `website` varchar(255) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `faculty_acct_verification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculty_acct_verification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `blocked_till_ts` varchar(255) DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  `incorrect_attempts` int DEFAULT NULL,
  `is_expired` int DEFAULT NULL,
  `max_resend_attempts` int DEFAULT NULL,
  `otp` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `verify_status` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `faculty_course_associations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculty_course_associations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` int DEFAULT '1',
  `course_id` int DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `faculty_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculty_course_mapping` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `active` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `faculty_teaching_assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculty_teaching_assignment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `academic_year` varchar(255) DEFAULT NULL,
  `batch_id` int DEFAULT NULL,
  `class_id` int NOT NULL,
  `course_id` int NOT NULL,
  `end_date` date DEFAULT NULL,
  `faculty_id` int NOT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `semester_number` int NOT NULL,
  `start_date` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `flyway_schema_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `script` varchar(1000) NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `grade_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grade_audit_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_assignment_id` int NOT NULL,
  `graded_by` int NOT NULL,
  `previous_points` bigint NOT NULL DEFAULT '0',
  `new_points` bigint NOT NULL DEFAULT '0',
  `previous_grading_status` varchar(20) DEFAULT NULL,
  `new_grading_status` varchar(20) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_grade_audit_assignment` (`student_assignment_id`),
  KEY `idx_grade_audit_graded_by` (`graded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `interview`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interview` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `interview_mode` varchar(255) DEFAULT NULL,
  `interview_status` varchar(255) DEFAULT NULL,
  `interview_type` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `interviewer_name` varchar(255) DEFAULT NULL,
  `notes` text,
  `round_description` text,
  `organization_id` int NOT NULL,
  `scheduled_date` datetime(6) NOT NULL,
  `job_id` int NOT NULL,
  `job_application_id` int NOT NULL,
  `learner_id` int NOT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `scheduled_date_hour` datetime DEFAULT NULL,
  `feedback_rating` int DEFAULT NULL,
  `feedback_comments` text,
  `feedback_recommend_action` varchar(30) DEFAULT NULL,
  `feedback_submitted_at` datetime DEFAULT NULL,
  `feedback_submitted_by` int DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `feedback_recommend` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKpla1hwb3ohjsi2owm08rn4cgk` (`job_id`),
  KEY `idx_interview_org_deleted_date` (`organization_id`,`is_deleted`,`scheduled_date`),
  KEY `idx_interview_learner_org_deleted` (`learner_id`,`organization_id`,`is_deleted`),
  KEY `idx_interview_app_deleted_date` (`job_application_id`,`is_deleted`,`scheduled_date`),
  KEY `idx_interview_overlap_learner` (`learner_id`,`interview_status`,`is_deleted`),
  KEY `idx_interview_scheduled_status` (`scheduled_date`,`interview_status`,`is_deleted`),
  CONSTRAINT `FK83wik8wdhya85kun5r4e1ic2q` FOREIGN KEY (`job_application_id`) REFERENCES `job_application` (`id`),
  CONSTRAINT `fk_interview_learner_cascade` FOREIGN KEY (`learner_id`) REFERENCES `learner` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FKpla1hwb3ohjsi2owm08rn4cgk` FOREIGN KEY (`job_id`) REFERENCES `job` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `application_deadline` datetime(6) DEFAULT NULL,
  `candidate_preferences` json DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `company_logo` varchar(500) DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `company_name` varchar(100) NOT NULL,
  `created_by` int DEFAULT NULL,
  `ctc_range` varchar(255) DEFAULT NULL,
  `evaluation_config` json DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `job_description` text,
  `job_responsibilities` text,
  `job_slug` varchar(32) DEFAULT NULL,
  `job_title` varchar(100) NOT NULL,
  `job_type` varchar(50) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `organization_id` int NOT NULL,
  `posted_date` datetime(6) DEFAULT NULL,
  `screening_version` varchar(255) NOT NULL,
  `target_batch_id` int DEFAULT NULL,
  `target_class_id` int DEFAULT NULL,
  `target_department_id` int DEFAULT NULL,
  `target_program_id` int DEFAULT NULL,
  `visibility_type` varchar(255) NOT NULL,
  `important_dates` json DEFAULT NULL,
  `assessment_url` varchar(2048) DEFAULT NULL,
  `assessment_deadline` datetime DEFAULT NULL,
  `is_draft` tinyint(1) NOT NULL DEFAULT '0',
  `version` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_dcaaf53ifr41unjkkwi5ck1p7` (`job_slug`),
  KEY `idx_job_college_deleted` (`college_id`,`is_deleted`),
  KEY `idx_job_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `job_application`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_application` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `application_status` varchar(255) DEFAULT NULL,
  `applied_at` datetime(6) DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `pap_requested` bit(1) NOT NULL,
  `resume_url` text,
  `resume_history` json DEFAULT NULL,
  `source` varchar(50) DEFAULT NULL,
  `status_updated_at` datetime(6) DEFAULT NULL,
  `status_updated_by` int DEFAULT NULL,
  `job_id` int NOT NULL,
  `learner_id` int NOT NULL,
  `internal_notes` text,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `offer_letter_url` text,
  `offer_letter_sent_at` datetime DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `status_before_withdrawal` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKombvsoqhepjepn5gqgsilm41c` (`learner_id`,`job_id`),
  KEY `FKdepcvxeq3gyb4438ws0qjycc7` (`job_id`),
  KEY `idx_job_application_job_status` (`job_id`,`application_status`),
  KEY `idx_job_application_job_applied_at` (`job_id`,`applied_at`),
  KEY `idx_job_application_status_updated_at` (`status_updated_at`),
  CONSTRAINT `fk_job_application_learner_cascade` FOREIGN KEY (`learner_id`) REFERENCES `learner` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FKdepcvxeq3gyb4438ws0qjycc7` FOREIGN KEY (`job_id`) REFERENCES `job` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `job_application_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_application_status_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `old_status` varchar(50) DEFAULT NULL COMMENT 'Null for initial APPLIED',
  `new_status` varchar(50) NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by` int DEFAULT NULL COMMENT 'User ID who made the change',
  `rejection_reason` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_jash_application_id` (`application_id`),
  KEY `idx_jash_changed_at` (`changed_at`),
  KEY `idx_jash_application_status` (`application_id`,`new_status`),
  CONSTRAINT `fk_jash_application` FOREIGN KEY (`application_id`) REFERENCES `job_application` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `job_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `exam_slot_preference` varchar(255) DEFAULT NULL,
  `pap_interest` varchar(255) DEFAULT NULL,
  `preferred_employment_city` varchar(255) DEFAULT NULL,
  `role_preference` varchar(255) DEFAULT NULL,
  `specific_role_preference` text,
  `work_shift_preference` varchar(255) DEFAULT NULL,
  `learner_id` int NOT NULL,
  `job_notifications_enabled` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_gu6hxps9uwk0qkhky6k171h4p` (`learner_id`),
  CONSTRAINT `FKr6h8buq7hv6in7f7dfpbhil39` FOREIGN KEY (`learner_id`) REFERENCES `learner` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `learner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learner` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `suspended_at` datetime DEFAULT NULL,
  `suspension_reason` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `achievements` json DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `blood_group` varchar(255) DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `contact_mail` varchar(255) DEFAULT NULL,
  `contact_mobile` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `current_address` text,
  `department` varchar(255) DEFAULT NULL,
  `description` text,
  `dob` varchar(255) DEFAULT NULL,
  `experiences` json DEFAULT NULL,
  `extracurricular` json DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `github` varchar(255) DEFAULT NULL,
  `hobbies` json DEFAULT NULL,
  `identity` json DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `organizations` json DEFAULT NULL,
  `permanent_address` text,
  `pincode` varchar(255) DEFAULT NULL,
  `portfolio` varchar(255) DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `projects` json DEFAULT NULL,
  `resume_url` text,
  `roll_number` varchar(255) DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `token_version` int NOT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `user_type` varchar(22) DEFAULT 'LEARNER',
  `video_intro_uploaded_at` datetime(6) DEFAULT NULL,
  `video_intro_url` text,
  `website` varchar(255) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `bulk_import_batch_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_learner_bulk_import_batch_id` (`bulk_import_batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `learner_acct_verification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learner_acct_verification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `blocked_till_ts` varchar(255) DEFAULT NULL,
  `incorrect_attempts` int DEFAULT NULL,
  `is_expired` int DEFAULT NULL,
  `learner_id` int DEFAULT NULL,
  `max_resend_attempts` int DEFAULT NULL,
  `otp` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `roll_number` varchar(255) DEFAULT NULL,
  `verify_status` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `learner_content_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learner_content_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `learner_id` int NOT NULL,
  `lesson_content_id` int NOT NULL,
  `last_position_seconds` int NOT NULL DEFAULT '0',
  `duration_seconds` int NOT NULL DEFAULT '0',
  `completed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `first_completed_at` timestamp NULL DEFAULT NULL,
  `attempt` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_learner_lesson_content_attempt` (`learner_id`,`lesson_content_id`,`attempt`),
  KEY `idx_learner_content_progress_learner` (`learner_id`),
  KEY `idx_learner_content_progress_lesson_content` (`lesson_content_id`),
  KEY `idx_learner_content_progress_current` (`learner_id`,`lesson_content_id`,`attempt` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `learner_saved_job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learner_saved_job` (
  `id` int NOT NULL AUTO_INCREMENT,
  `learner_id` int NOT NULL,
  `job_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_learner_job` (`learner_id`,`job_id`),
  UNIQUE KEY `UK8t00cr8uf4er8rlysctxj06nj` (`learner_id`,`job_id`),
  KEY `idx_learner` (`learner_id`),
  KEY `idx_job` (`job_id`),
  CONSTRAINT `FKhbvqowwcn5w28n507rr6ofsqs` FOREIGN KEY (`learner_id`) REFERENCES `learner` (`id`),
  CONSTRAINT `FKkskhd76ts1o3mcoxu04626wtr` FOREIGN KEY (`job_id`) REFERENCES `job` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lecture_hall`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lecture_hall` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `room_type` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lesson`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lesson` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `active` bit(1) DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `enabled` bit(1) DEFAULT NULL,
  `lesson_name` varchar(255) DEFAULT NULL,
  `sequence` bigint DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `lesson_name_key` varchar(255) GENERATED ALWAYS AS ((case when (((`is_deleted` is null) or (`is_deleted` = 0)) and (`lesson_name` is not null) and (trim(`lesson_name`) <> _utf8mb4'')) then lower(trim(`lesson_name`)) else NULL end)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_lesson_course_name_active` (`course_id`,`lesson_name_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lesson_content_class_sequence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lesson_content_class_sequence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lesson_content_id` int NOT NULL,
  `class_id` int NOT NULL,
  `sequence` bigint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_content_class` (`lesson_content_id`,`class_id`),
  UNIQUE KEY `UKeo3p6l8tlcynp3um9qfv6dbut` (`lesson_content_id`,`class_id`),
  KEY `idx_lccs_lesson_content` (`lesson_content_id`),
  KEY `idx_lccs_class` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lesson_contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lesson_contents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `active` bit(1) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `content_data` json DEFAULT NULL,
  `content_title` varchar(255) DEFAULT NULL,
  `content_type` varchar(255) DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `course_name` varchar(255) DEFAULT NULL,
  `enabled` bit(1) DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  `lesson_id` int DEFAULT NULL,
  `points` bigint DEFAULT NULL,
  `sequence` bigint DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_lesson_contents_class_id_positive` CHECK (((`class_id` is null) or (`class_id` > 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lms_notification_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lms_notification_template` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `body` text NOT NULL,
  `channel` varchar(20) NOT NULL,
  `created_by` int DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `dlt_entity_id` varchar(100) DEFAULT NULL,
  `dlt_template_id` varchar(100) DEFAULT NULL,
  `example_data` json DEFAULT NULL,
  `external_template_id` varchar(200) DEFAULT NULL,
  `html_body` text,
  `icon` varchar(50) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_default` bit(1) DEFAULT NULL,
  `is_dlt_compliant` bit(1) DEFAULT NULL,
  `is_sample` bit(1) DEFAULT NULL,
  `language` varchar(10) DEFAULT NULL,
  `merge_variable_mapping` json DEFAULT NULL,
  `notification_type` varchar(50) DEFAULT NULL,
  `sms_variable_format` varchar(50) DEFAULT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `template_key` varchar(100) NOT NULL,
  `updated_by` int DEFAULT NULL,
  `variable_schema` json DEFAULT NULL,
  `version` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lms_template` (`template_key`,`channel`,`language`,`version`),
  KEY `idx_lms_key_channel_active` (`template_key`,`channel`,`is_active`),
  KEY `idx_lms_language` (`language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `login_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mobile_login_attempt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobile_login_attempt` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `attempt_id` varchar(64) NOT NULL,
  `college_id` int DEFAULT NULL,
  `expires_at` datetime(6) NOT NULL,
  `email_otp_expires_at` datetime DEFAULT NULL,
  `email_otp_sent_at` datetime DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `otp` varchar(12) NOT NULL,
  `email_otp` varchar(12) DEFAULT NULL,
  `phone` varchar(32) NOT NULL,
  `used` bit(1) NOT NULL,
  `user_id` int NOT NULL,
  `user_type` varchar(16) NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verification_attempts` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_9wqn0qdumdtp5fycj3p760l2v` (`attempt_id`),
  KEY `idx_mobile_login_attempt_verified_at` (`verified_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `new_program`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_program` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `duration_years` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `new_program_structure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_program_structure` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `course_ids` json DEFAULT NULL,
  `end_date` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `start_date` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `learner_id` int DEFAULT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `context_label` varchar(255) DEFAULT NULL,
  `notification_type` varchar(20) DEFAULT NULL,
  `application_id` int DEFAULT NULL,
  `job_id` int DEFAULT NULL,
  `assessment_url` varchar(2048) DEFAULT NULL,
  `interview_id` int DEFAULT NULL,
  `creator_faculty_id` int DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `delivery_status` varchar(20) DEFAULT NULL,
  `delivery_error` varchar(500) DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notification_learner_id` (`learner_id`),
  KEY `idx_notification_class_course_learner` (`class_id`,`course_id`,`learner_id`),
  KEY `idx_notification_scheduled` (`delivery_status`,`scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notification_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_template` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `body` text NOT NULL,
  `channel` varchar(20) NOT NULL,
  `created_by` int DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `dlt_entity_id` varchar(100) DEFAULT NULL,
  `dlt_template_id` varchar(100) DEFAULT NULL,
  `example_data` json DEFAULT NULL,
  `external_template_id` varchar(200) DEFAULT NULL,
  `html_body` text,
  `icon` varchar(50) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_default` bit(1) DEFAULT NULL,
  `is_dlt_compliant` bit(1) DEFAULT NULL,
  `is_sample` bit(1) DEFAULT NULL,
  `language` varchar(10) DEFAULT NULL,
  `merge_variable_mapping` json DEFAULT NULL,
  `notification_type` varchar(50) DEFAULT NULL,
  `sms_variable_format` varchar(50) DEFAULT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `template_key` varchar(100) NOT NULL,
  `updated_by` int DEFAULT NULL,
  `variable_schema` json DEFAULT NULL,
  `version` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_key_channel_lang_version` (`template_key`,`channel`,`language`,`version`),
  KEY `idx_key_channel_active` (`template_key`,`channel`,`is_active`),
  KEY `idx_language` (`language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `program`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `end_year` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `start_year` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `program_structure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_structure` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `course_ids` json DEFAULT NULL,
  `end_date` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `start_date` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_activity_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_activity_event` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `project_slug` varchar(120) NOT NULL,
  `event_key` varchar(120) NOT NULL,
  `event_code` varchar(60) DEFAULT NULL,
  `event_type` varchar(60) NOT NULL,
  `title` varchar(200) NOT NULL,
  `summary` text,
  `source_tab` varchar(40) DEFAULT NULL,
  `entity_type` varchar(60) DEFAULT NULL,
  `entity_id` varchar(120) DEFAULT NULL,
  `actor_user_id` int DEFAULT NULL,
  `actor_user_type` varchar(20) DEFAULT NULL,
  `actor_name` varchar(160) DEFAULT NULL,
  `metadata_json` json DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` int DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_activity_project` (`project_id`),
  KEY `idx_project_activity_created_at` (`created_at`),
  KEY `idx_project_activity_event_key` (`event_key`),
  KEY `idx_project_activity_event_code` (`project_id`,`event_code`),
  KEY `idx_project_activity_project_created` (`project_id`,`created_at`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_delivery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_delivery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `project_id` int NOT NULL,
  `status` varchar(60) DEFAULT 'Draft',
  `snapshot` text,
  `notes` text,
  `feedback` text,
  `attachment_url` text,
  `revision_count` int DEFAULT '0',
  `draft_saved_at` datetime DEFAULT NULL,
  `draft_saved_by_id` int DEFAULT NULL,
  `draft_saved_by_name` varchar(160) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `submitted_by_id` int DEFAULT NULL,
  `submitted_by_name` varchar(160) DEFAULT NULL,
  `submitted_by_type` varchar(20) DEFAULT NULL,
  `review_status` varchar(60) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reviewed_by_id` int DEFAULT NULL,
  `reviewed_by_name` varchar(160) DEFAULT NULL,
  `reviewed_by_type` varchar(20) DEFAULT NULL,
  `last_updated_at` datetime DEFAULT NULL,
  `last_updated_by_id` int DEFAULT NULL,
  `last_updated_by_name` varchar(160) DEFAULT NULL,
  `last_updated_by_type` varchar(20) DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `locked_by_id` int DEFAULT NULL,
  `locked_by_name` varchar(160) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `file_mime_type` varchar(160) DEFAULT NULL,
  `storage_key` text,
  `source_url` text,
  `attachments` json DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_delivery_project` (`project_id`),
  KEY `idx_project_delivery_project` (`project_id`,`is_deleted`),
  CONSTRAINT `fk_project_delivery_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_delivery_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_delivery_event` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `project_id` int NOT NULL,
  `delivery_id` int NOT NULL,
  `action` varchar(60) DEFAULT NULL,
  `status` varchar(60) DEFAULT NULL,
  `actor_id` int DEFAULT NULL,
  `actor_name` varchar(160) DEFAULT NULL,
  `actor_type` varchar(20) DEFAULT NULL,
  `notes` text,
  `attachment_url` text,
  `feedback` text,
  `revision_count` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_project_delivery_event_delivery` (`project_id`,`delivery_id`,`is_deleted`,`id`),
  KEY `fk_project_delivery_event_delivery` (`delivery_id`),
  CONSTRAINT `fk_project_delivery_event_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `project_delivery` (`id`),
  CONSTRAINT `fk_project_delivery_event_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_meeting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_meeting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `project_id` int NOT NULL,
  `meeting_key` varchar(120) NOT NULL,
  `sort_order` int DEFAULT '0',
  `title` varchar(200) NOT NULL,
  `agenda` text,
  `notes` text,
  `outcome` text,
  `meeting_status` varchar(40) DEFAULT 'SCHEDULED',
  `meeting_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `timezone` varchar(80) DEFAULT NULL,
  `organizer_id` int DEFAULT NULL,
  `organizer_name` varchar(160) DEFAULT NULL,
  `attendees` json DEFAULT NULL,
  `action_items` json DEFAULT NULL,
  `linked_sprint_key` varchar(120) DEFAULT NULL,
  `linked_sprint_label` varchar(200) DEFAULT NULL,
  `linked_task_key` varchar(120) DEFAULT NULL,
  `linked_task_label` varchar(200) DEFAULT NULL,
  `reminder_at` datetime DEFAULT NULL,
  `reminder_channel` varchar(40) DEFAULT NULL,
  `follow_up_at` datetime DEFAULT NULL,
  `follow_up_status` varchar(40) DEFAULT NULL,
  `follow_up_notes` text,
  `calendar_event_id` varchar(160) DEFAULT NULL,
  `meet_link` varchar(500) DEFAULT NULL,
  `calendar_provider` varchar(60) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `calendar_sync_status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `calendar_sync_error` varchar(500) DEFAULT NULL,
  `meeting_type` varchar(20) DEFAULT 'GENERAL',
  `retro_went_well` text,
  `retro_didnt_go_well` text,
  `retro_actions` text,
  `deleted_by_workspace` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_meeting_key` (`project_id`,`meeting_key`),
  KEY `idx_project_meeting_project` (`project_id`,`is_deleted`,`meeting_date`,`start_time`,`sort_order`,`id`),
  KEY `idx_project_meeting_status` (`project_id`,`meeting_status`,`is_deleted`),
  KEY `idx_project_meeting_organizer_conflict` (`organizer_id`,`meeting_date`,`is_deleted`),
  CONSTRAINT `fk_project_meeting_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_meeting_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_meeting_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `project_id` int NOT NULL,
  `project_meeting_id` int DEFAULT NULL,
  `meeting_key` varchar(120) NOT NULL,
  `action_type` varchar(40) NOT NULL,
  `actor_user_id` int DEFAULT NULL,
  `actor_user_type` varchar(20) DEFAULT NULL,
  `actor_name` varchar(160) DEFAULT NULL,
  `before_json` json DEFAULT NULL,
  `after_json` json DEFAULT NULL,
  `changed_fields` json DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `idx_project_meeting_history_project` (`project_id`,`created_at`,`id`),
  KEY `idx_project_meeting_history_meeting` (`project_id`,`project_meeting_id`,`created_at`,`id`),
  KEY `fk_project_meeting_history_meeting` (`project_meeting_id`),
  KEY `idx_project_meeting_history_key` (`project_id`,`meeting_key`,`created_at`,`id`),
  CONSTRAINT `fk_project_meeting_history_meeting` FOREIGN KEY (`project_meeting_id`) REFERENCES `project_meeting` (`id`),
  CONSTRAINT `fk_project_meeting_history_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_member` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `user_type` varchar(20) NOT NULL,
  `display_name` varchar(160) DEFAULT NULL,
  `role_label` varchar(80) DEFAULT NULL,
  `member_status` varchar(40) DEFAULT 'ACTIVE',
  `version` bigint NOT NULL DEFAULT '0',
  `deleted_by_workspace` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_member_user` (`project_id`,`user_id`,`user_type`),
  KEY `idx_project_member_user_lookup` (`user_id`,`user_type`,`is_deleted`),
  CONSTRAINT `fk_project_member_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_release`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_release` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `release_key` varchar(64) NOT NULL,
  `title` varchar(220) NOT NULL,
  `target_date` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PLANNED',
  `sort_order` int DEFAULT '0',
  `notes` text,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_release_key` (`project_id`,`release_key`),
  KEY `idx_project_release_project_id` (`project_id`,`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_resource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_resource` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `project_id` int NOT NULL,
  `resource_key` varchar(120) NOT NULL,
  `resource_order` int DEFAULT '0',
  `title` varchar(200) NOT NULL,
  `resource_type` varchar(40) DEFAULT 'File',
  `resource_kind` varchar(40) DEFAULT 'File',
  `description` text,
  `access_notes` text,
  `visibility` varchar(40) DEFAULT 'Shared',
  `status` varchar(40) DEFAULT 'Active',
  `is_pinned` tinyint(1) DEFAULT '0',
  `is_required` tinyint(1) DEFAULT '0',
  `sprint_key` varchar(120) DEFAULT NULL,
  `sprint_label` varchar(200) DEFAULT NULL,
  `task_key` varchar(120) DEFAULT NULL,
  `task_label` varchar(200) DEFAULT NULL,
  `resource_url` text,
  `file_url` text,
  `attachment_url` text,
  `file_name` varchar(255) DEFAULT NULL,
  `uploaded_by_user_id` int DEFAULT NULL,
  `uploaded_by_name` varchar(160) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `download_url` text,
  `version` bigint NOT NULL DEFAULT '0',
  `deleted_by_workspace` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_resource_key` (`project_id`,`resource_key`),
  KEY `idx_project_resource_project` (`project_id`,`is_deleted`,`resource_order`),
  KEY `idx_project_resource_sprint` (`project_id`,`sprint_key`,`is_deleted`),
  KEY `idx_project_resource_task` (`project_id`,`task_key`,`is_deleted`),
  CONSTRAINT `fk_project_resource_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_resource_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_resource_audit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `project_id` int NOT NULL,
  `project_resource_id` int DEFAULT NULL,
  `resource_key` varchar(120) NOT NULL,
  `action_type` varchar(40) NOT NULL,
  `actor_user_id` int DEFAULT NULL,
  `actor_user_type` varchar(20) DEFAULT NULL,
  `actor_name` varchar(160) DEFAULT NULL,
  `resource_order` int DEFAULT NULL,
  `before_json` json DEFAULT NULL,
  `after_json` json DEFAULT NULL,
  `changed_fields` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_resource_audit_project` (`project_id`,`created_at`),
  KEY `idx_project_resource_audit_resource` (`project_id`,`project_resource_id`,`created_at`),
  CONSTRAINT `fk_project_resource_audit_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_sprint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_sprint` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `project_id` int NOT NULL,
  `sprint_key` varchar(120) NOT NULL,
  `sort_order` int DEFAULT '0',
  `title` varchar(220) NOT NULL,
  `description` text,
  `sprint_status` varchar(40) DEFAULT 'UPCOMING',
  `due_date` date DEFAULT NULL,
  `due_label` varchar(80) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `sprint_state` varchar(20) DEFAULT 'PLANNED',
  `sprint_number` int DEFAULT NULL,
  `goal` text,
  `release_label` varchar(160) DEFAULT NULL,
  `release_id` int DEFAULT NULL,
  `deleted_by_workspace` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_sprint_key` (`project_id`,`sprint_key`),
  KEY `idx_project_sprint_project` (`project_id`,`is_deleted`,`sort_order`,`id`),
  KEY `idx_project_sprint_status` (`project_id`,`sprint_status`,`is_deleted`),
  KEY `idx_project_sprint_state` (`project_id`,`sprint_state`,`is_deleted`),
  KEY `idx_project_sprint_release_id` (`release_id`),
  CONSTRAINT `fk_project_sprint_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_task` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `project_id` int NOT NULL,
  `task_key` varchar(120) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `task_status` varchar(40) DEFAULT 'TO_DO',
  `priority` varchar(40) DEFAULT 'MEDIUM',
  `due_date` date DEFAULT NULL,
  `due_label` varchar(80) DEFAULT NULL,
  `assignee_id` int DEFAULT NULL,
  `assignee_type` varchar(20) DEFAULT NULL,
  `assignee_name` varchar(160) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `blocker_reason` text,
  `sprint_key` varchar(120) DEFAULT NULL,
  `sprint_label` varchar(220) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `estimate_points` int DEFAULT NULL,
  `task_type` varchar(20) DEFAULT 'STORY',
  `acceptance_criteria` text,
  `carried_over_from_sprint_key` varchar(120) DEFAULT NULL,
  `approach` text,
  `created_by_type` varchar(20) DEFAULT NULL,
  `deleted_by_workspace` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_task_key` (`project_id`,`task_key`),
  KEY `idx_project_task_project` (`project_id`,`is_deleted`,`sort_order`),
  KEY `idx_project_task_assignee` (`assignee_id`,`assignee_type`,`is_deleted`),
  KEY `idx_project_task_sprint` (`project_id`,`sprint_key`,`is_deleted`),
  CONSTRAINT `fk_project_task_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_task_comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_task_comment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `project_id` int NOT NULL,
  `project_task_id` int NOT NULL,
  `commenter_id` int DEFAULT NULL,
  `commenter_type` varchar(20) DEFAULT NULL,
  `commenter_name` varchar(160) DEFAULT NULL,
  `message` text,
  `progress_value` int DEFAULT NULL,
  `comment_type` varchar(30) NOT NULL DEFAULT 'NOTE',
  `task_status_snapshot` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_task_comment_lookup` (`project_id`,`project_task_id`,`is_deleted`),
  KEY `fk_project_task_comment_task` (`project_task_id`),
  CONSTRAINT `fk_project_task_comment_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace` (`id`),
  CONSTRAINT `fk_project_task_comment_task` FOREIGN KEY (`project_task_id`) REFERENCES `project_task` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_template` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `slug` varchar(80) NOT NULL,
  `title` varchar(160) NOT NULL,
  `summary` text,
  `course_label` varchar(160) DEFAULT NULL,
  `status` varchar(40) DEFAULT 'IN_PROGRESS',
  `phase` varchar(80) DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `overview` json DEFAULT NULL,
  `sprints` json DEFAULT NULL,
  `tasks` json DEFAULT NULL,
  `resources` json DEFAULT NULL,
  `delivery` json DEFAULT NULL,
  `meetings` json DEFAULT NULL,
  `activity` json DEFAULT NULL,
  `template_version` int NOT NULL DEFAULT '1',
  `lifecycle_status` varchar(20) NOT NULL DEFAULT 'DRAFT',
  `published_at` datetime DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_template_slug` (`slug`),
  KEY `idx_project_template_scope` (`organization_id`,`college_id`),
  KEY `idx_project_template_deleted` (`is_deleted`),
  KEY `idx_project_template_college` (`college_id`,`is_deleted`,`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_template_college`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_template_college` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `template_id` int NOT NULL,
  `college_id` int NOT NULL,
  `assigned_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_template_college` (`template_id`,`college_id`),
  KEY `idx_project_template_college_college_id` (`college_id`),
  CONSTRAINT `fk_project_template_college_template` FOREIGN KEY (`template_id`) REFERENCES `project_template` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_template_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_template_version` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `template_id` int NOT NULL,
  `template_version` int NOT NULL,
  `action_type` varchar(40) NOT NULL,
  `lifecycle_status` varchar(20) DEFAULT NULL,
  `changed_by` int DEFAULT NULL,
  `changed_at` datetime DEFAULT NULL,
  `notes` text,
  `snapshot_json` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_template_version_template_id` (`template_id`),
  KEY `idx_project_template_version_version` (`template_id`,`template_version`),
  CONSTRAINT `fk_project_template_version_template` FOREIGN KEY (`template_id`) REFERENCES `project_template` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_workspace`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_workspace` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `slug` varchar(80) NOT NULL,
  `title` varchar(160) NOT NULL,
  `summary` text,
  `course_label` varchar(160) DEFAULT NULL,
  `status` varchar(40) DEFAULT 'IN_PROGRESS',
  `phase` varchar(80) DEFAULT NULL,
  `progress` int DEFAULT '0',
  `blocker` text,
  `next_action` text,
  `due_label` varchar(80) DEFAULT NULL,
  `organization_id` int NOT NULL,
  `college_id` int NOT NULL,
  `class_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `overview` json DEFAULT NULL,
  `sprints` json DEFAULT NULL,
  `tasks` json DEFAULT NULL,
  `resources` json DEFAULT NULL,
  `delivery` json DEFAULT NULL,
  `meetings` json DEFAULT NULL,
  `activity` json DEFAULT NULL,
  `template_id` int DEFAULT NULL,
  `template_snapshot` json DEFAULT NULL,
  `bulk_learner_id` int DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `readiness_override` tinyint(1) DEFAULT NULL,
  `readiness_override_note` text,
  `readiness_override_by` int DEFAULT NULL,
  `readiness_override_at` datetime DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `sprint_length_weeks` int DEFAULT '4',
  `estimation_unit` varchar(20) DEFAULT 'POINTS',
  `recoverable_content` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_workspace_slug` (`slug`),
  UNIQUE KEY `uk_project_workspace_bulk_learner` (`class_id`,`template_id`,`bulk_learner_id`),
  KEY `idx_project_workspace_scope` (`organization_id`,`college_id`,`class_id`),
  KEY `idx_project_workspace_deleted` (`is_deleted`),
  KEY `idx_project_workspace_template_id` (`template_id`),
  KEY `idx_project_workspace_college` (`college_id`,`is_deleted`,`updated_at`),
  KEY `idx_project_workspace_class` (`class_id`,`is_deleted`),
  CONSTRAINT `fk_project_workspace_template` FOREIGN KEY (`template_id`) REFERENCES `project_template` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `qualification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qualification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `certificate_upload` text,
  `degree` varchar(255) DEFAULT NULL,
  `description` text,
  `education_type` varchar(255) NOT NULL,
  `end_year` varchar(255) DEFAULT NULL,
  `exam_details` json DEFAULT NULL,
  `exam_rank` varchar(255) DEFAULT NULL,
  `field` varchar(255) DEFAULT NULL,
  `grade` varchar(255) DEFAULT NULL,
  `max_grade` varchar(20) DEFAULT NULL,
  `grading_type` varchar(255) DEFAULT NULL,
  `institution_name` varchar(255) NOT NULL,
  `is_currently_pursuing` tinyint(1) DEFAULT '0',
  `is_recent_education` tinyint(1) DEFAULT '0',
  `program` varchar(255) DEFAULT NULL,
  `qualifying_exam` varchar(255) DEFAULT NULL,
  `score` varchar(255) DEFAULT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `start_year` varchar(255) DEFAULT NULL,
  `learner_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5o8guph980nc5iiwhsfxjtd8w` (`learner_id`),
  CONSTRAINT `FK5o8guph980nc5iiwhsfxjtd8w` FOREIGN KEY (`learner_id`) REFERENCES `learner` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `correct_answer` varchar(255) DEFAULT NULL,
  `exam_id` int DEFAULT NULL,
  `points` int DEFAULT NULL,
  `question` varchar(255) DEFAULT NULL,
  `question_type` int DEFAULT NULL,
  `sequence` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `question_option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_option` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `an_image` bit(1) NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `content` varchar(255) DEFAULT NULL,
  `correct` bit(1) DEFAULT NULL,
  `sequence` int DEFAULT NULL,
  `question_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKmmdv54rmm5hkgxbn1008ix87n` (`question_id`),
  CONSTRAINT `FKmmdv54rmm5hkgxbn1008ix87n` FOREIGN KEY (`question_id`) REFERENCES `question` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quiz_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attempt_id` int NOT NULL,
  `question_id` int NOT NULL,
  `selected_option_ids` varchar(500) DEFAULT NULL,
  `correct` tinyint(1) NOT NULL DEFAULT '0',
  `points_awarded` bigint NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_quiz_answer_attempt_question` (`attempt_id`,`question_id`),
  KEY `fk_quiz_answers_question` (`question_id`),
  KEY `idx_quiz_answers_attempt` (`attempt_id`),
  CONSTRAINT `fk_quiz_answers_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quiz_answers_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quiz_attempt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_attempt` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attempt_id` varchar(64) NOT NULL,
  `student_id` int NOT NULL,
  `lesson_content_id` int NOT NULL,
  `started_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quiz_attempt_attempt_id` (`attempt_id`),
  KEY `idx_quiz_attempt_student_lc` (`student_id`,`lesson_content_id`),
  KEY `idx_quiz_attempt_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quiz_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quiz_id` int NOT NULL,
  `learner_id` int NOT NULL,
  `attempt_number` int NOT NULL DEFAULT '1',
  `status` varchar(20) NOT NULL DEFAULT 'SUBMITTED',
  `score` bigint NOT NULL DEFAULT '0',
  `max_score` bigint NOT NULL DEFAULT '0',
  `submitted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_quiz_attempt_learner_number` (`quiz_id`,`learner_id`,`attempt_number`),
  KEY `idx_quiz_attempts_quiz_learner` (`quiz_id`,`learner_id`),
  KEY `idx_quiz_attempts_learner` (`learner_id`),
  CONSTRAINT `fk_quiz_attempts_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quiz_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `option_text` text NOT NULL,
  `correct` tinyint(1) NOT NULL DEFAULT '0',
  `sequence` int NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quiz_options_question_sequence` (`question_id`,`sequence`),
  CONSTRAINT `fk_quiz_options_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quiz_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quiz_id` int NOT NULL,
  `question_type` varchar(30) NOT NULL,
  `prompt` text NOT NULL,
  `points` bigint NOT NULL DEFAULT '1',
  `sequence` int NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quiz_questions_quiz_sequence` (`quiz_id`,`sequence`),
  CONSTRAINT `fk_quiz_questions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lesson_id` int NOT NULL,
  `course_id` int NOT NULL,
  `class_id` int DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(20) NOT NULL DEFAULT 'DRAFT',
  `due_at` datetime DEFAULT NULL,
  `max_attempts` int NOT NULL DEFAULT '1',
  `total_points` bigint NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_grade_published` tinyint(1) NOT NULL DEFAULT '1',
  `shuffle_questions` tinyint(1) NOT NULL DEFAULT '0',
  `shuffle_options` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_quizzes_lesson_class` (`lesson_id`,`class_id`),
  KEY `idx_quizzes_course_class` (`course_id`,`class_id`),
  KEY `idx_quizzes_faculty` (`faculty_id`),
  KEY `idx_quizzes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `refresh_token_blocklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_token_blocklist` (
  `jti` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'JWT ID (unique identifier for the token)',
  `user_id` int NOT NULL COMMENT 'ID of the user who owned this token',
  `user_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'LEARNER or FACULTY',
  `blocked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the token was blocklisted',
  `expires_at` timestamp NOT NULL COMMENT 'Original token expiry (for cleanup)',
  PRIMARY KEY (`jti`),
  KEY `idx_blocklist_expires` (`expires_at`),
  KEY `idx_blocklist_user` (`user_id`,`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores revoked refresh tokens for logout and token rotation';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `scheduled_job_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_job_lock` (
  `job_name` varchar(120) NOT NULL,
  `locked_until` datetime(6) NOT NULL,
  `locked_by` varchar(120) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`job_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `selected_option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `selected_option` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `attendee_answer` varchar(255) DEFAULT NULL,
  `question_option_id` int DEFAULT NULL,
  `assgined_exam_id` int DEFAULT NULL,
  `question_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK3g0iuhyb3l9ugedy3y2s4j096` (`assgined_exam_id`,`question_id`),
  CONSTRAINT `FK3g0iuhyb3l9ugedy3y2s4j096` FOREIGN KEY (`assgined_exam_id`, `question_id`) REFERENCES `attempted_question` (`assgined_exam_id`, `question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `semester`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semester` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `program_id` int NOT NULL,
  `semester_number` int NOT NULL,
  `total_credits` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKq1s33gsegc8ogyraujsrvmeij` (`program_id`,`semester_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `semester_course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semester_course` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `course_id` int NOT NULL,
  `course_order` int DEFAULT NULL,
  `credits` int DEFAULT NULL,
  `is_mandatory` bit(1) DEFAULT NULL,
  `semester_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKfn2wvta2raqk48ycn6omjp9pl` (`semester_id`,`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `skill_synonyms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skill_synonyms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `synonym` varchar(100) NOT NULL,
  `skill_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_synonym` (`synonym`),
  KEY `idx_skill_id` (`skill_id`),
  CONSTRAINT `FKhj9c4vxe7abwmcdhq55gu9bbv` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `skill_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skill_usage` (
  `skill_name` varchar(200) NOT NULL,
  `usage_count` int DEFAULT '0',
  `last_used` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`skill_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `display_name` varchar(200) NOT NULL,
  `is_active` bit(1) NOT NULL,
  `name` varchar(200) NOT NULL,
  `search_priority` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `usage_count` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_85woe63nu9klkk9fa73vf0jd0` (`name`),
  KEY `idx_name` (`name`),
  KEY `idx_category` (`category`),
  KEY `idx_display_name` (`display_name`),
  KEY `idx_active_category` (`is_active`,`category`),
  KEY `idx_usage_count` (`usage_count`),
  KEY `idx_search_priority` (`search_priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `smrithi_application`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smrithi_application` (
  `id` int NOT NULL AUTO_INCREMENT,
  `academic_data` json DEFAULT NULL,
  `application_id` varchar(255) NOT NULL,
  `application_source` varchar(255) DEFAULT NULL,
  `application_stage` varchar(255) DEFAULT NULL,
  `application_status` varchar(255) DEFAULT NULL,
  `career_data` json DEFAULT NULL,
  `college` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `decision_reason` text,
  `email` varchar(255) DEFAULT NULL,
  `is_account_active` bit(1) DEFAULT NULL,
  `is_email_verified` bit(1) DEFAULT NULL,
  `is_phone_verified` bit(1) DEFAULT NULL,
  `job_application_source` varchar(50) DEFAULT NULL,
  `job_slug` varchar(32) DEFAULT NULL,
  `last_pap_reengagement_date` datetime(6) DEFAULT NULL,
  `learner_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `pap_reengagement_count` int DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `rejection_reason` text,
  `resubmission_count` int DEFAULT NULL,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_mhd9jj3u55fslpedkiivg7cgc` (`application_id`),
  UNIQUE KEY `uq_smrithi_email` (`email`),
  UNIQUE KEY `uq_smrithi_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `smrithi_college`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smrithi_college` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_javptp6b7tj2fc54shkeoef5b` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `smrithi_college_keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smrithi_college_keywords` (
  `college_id` int NOT NULL,
  `keyword` varchar(255) DEFAULT NULL,
  KEY `FKidhjh1kudpsrs1nked8i4ncte` (`college_id`),
  CONSTRAINT `FKidhjh1kudpsrs1nked8i4ncte` FOREIGN KEY (`college_id`) REFERENCES `smrithi_college` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `smrithi_education_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smrithi_education_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `label` varchar(100) NOT NULL,
  `name` varchar(50) NOT NULL,
  `requires_institution_autocomplete` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_fqaqluhs5p9ahvicpt716omyf` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `smrithi_notification_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smrithi_notification_template` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `body` text NOT NULL,
  `channel` varchar(20) NOT NULL,
  `created_by` int DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `dlt_entity_id` varchar(100) DEFAULT NULL,
  `dlt_template_id` varchar(100) DEFAULT NULL,
  `example_data` json DEFAULT NULL,
  `external_template_id` varchar(200) DEFAULT NULL,
  `html_body` text,
  `icon` varchar(50) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_default` bit(1) DEFAULT NULL,
  `is_dlt_compliant` bit(1) DEFAULT NULL,
  `is_sample` bit(1) DEFAULT NULL,
  `language` varchar(10) DEFAULT NULL,
  `merge_variable_mapping` json DEFAULT NULL,
  `notification_type` varchar(50) DEFAULT NULL,
  `sms_variable_format` varchar(50) DEFAULT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `template_key` varchar(100) NOT NULL,
  `updated_by` int DEFAULT NULL,
  `variable_schema` json DEFAULT NULL,
  `version` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_smrithi_template` (`template_key`,`channel`,`language`,`version`),
  KEY `idx_smrithi_key_channel_active` (`template_key`,`channel`,`is_active`),
  KEY `idx_smrithi_language` (`language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `smrithi_program`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smrithi_program` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `description` text,
  `education_type` varchar(255) NOT NULL,
  `education_type_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9x2g86f593h41faaxt1dd71qt` (`name`,`education_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `smrithi_specialization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smrithi_specialization` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `name` varchar(255) NOT NULL,
  `program_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sms_delivery_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_delivery_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purpose` varchar(64) NOT NULL,
  `recipient_suffix` varchar(8) DEFAULT NULL,
  `status` varchar(16) NOT NULL,
  `provider_message_id` varchar(64) DEFAULT NULL,
  `error_summary` varchar(500) DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_sms_log_created` (`created_at`),
  KEY `idx_sms_log_recipient` (`recipient_suffix`,`purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_assignment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `assignment_name` varchar(255) DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  `assignment_contents` json DEFAULT NULL,
  `graded` int DEFAULT NULL,
  `grading_date` varchar(255) DEFAULT NULL,
  `html_content` varchar(255) DEFAULT NULL,
  `submission_type` varchar(64) DEFAULT NULL,
  `submission_link` text,
  `submission_assets` json DEFAULT NULL,
  `lesson_content_id` int DEFAULT NULL,
  `points` bigint DEFAULT NULL,
  `points_obtained` bigint DEFAULT NULL,
  `student_first_name` varchar(255) DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `student_last_name` varchar(255) DEFAULT NULL,
  `version` int NOT NULL DEFAULT '0',
  `grading_status` varchar(20) DEFAULT 'NOT_GRADED',
  `graded_by` int DEFAULT NULL,
  `graded_at` datetime DEFAULT NULL,
  `previous_points` bigint DEFAULT '0',
  `attempt_number` int NOT NULL DEFAULT '1',
  `is_grade_published` tinyint(1) NOT NULL DEFAULT '0',
  `semester_number` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_lesson_content` (`student_id`,`lesson_content_id`),
  UNIQUE KEY `uk_student_content_attempt` (`student_id`,`lesson_content_id`,`attempt_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_image` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `image_data` mediumtext,
  `learner_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_registration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_registration` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `organization_id` int DEFAULT NULL,
  `college_id` int DEFAULT NULL,
  `learner_id` int DEFAULT NULL,
  `external_ref` varchar(255) DEFAULT NULL,
  `registration_number` varchar(120) DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `batch_year` int DEFAULT NULL,
  `semester_number` int DEFAULT NULL,
  `registration_status` varchar(40) NOT NULL DEFAULT 'ACTIVE',
  `source` varchar(60) NOT NULL DEFAULT 'crm_sync',
  `synced_at` datetime DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_registration_tenant_external_unique` (`tenant_id`,`external_ref`),
  UNIQUE KEY `student_registration_tenant_learner_unique` (`tenant_id`,`learner_id`),
  UNIQUE KEY `student_registration_tenant_registration_unique` (`tenant_id`,`registration_number`),
  KEY `student_registration_tenant_status_idx` (`tenant_id`,`registration_status`),
  KEY `student_registration_learner_idx` (`learner_id`),
  KEY `student_registration_org_college_idx` (`organization_id`,`college_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tenant_domain`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_domain` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `college_id` int NOT NULL,
  `host` varchar(255) NOT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `verification_token` varchar(64) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `last_checked_at` datetime DEFAULT NULL,
  `last_check_result` varchar(32) DEFAULT NULL,
  `last_found_values` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_domain_host` (`host`),
  KEY `idx_tenant_domain_college_id` (`college_id`),
  KEY `idx_tenant_domain_verified` (`is_verified`),
  CONSTRAINT `fk_tenant_domain_college_id` FOREIGN KEY (`college_id`) REFERENCES `college` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `business_title` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `user_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `FKrhfovtciq1l558cw6udg0h0d3` (`role_id`),
  CONSTRAINT `FK55itppkw3i07do3h7qoclqd4k` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `FKrhfovtciq1l558cw6udg0h0d3` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_session` (
  `jti` varchar(36) NOT NULL,
  `user_id` int NOT NULL,
  `user_type` varchar(20) NOT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`jti`),
  KEY `idx_user_session_user` (`user_id`,`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

INSERT INTO `flyway_schema_history` VALUES (1,'24','add auto increment to all tables','SQL','V24__add_auto_increment_to_all_tables.sql',263104959,'lms_app_uat','2026-02-05 14:23:51',1349,1),(2,'25','add jwt auth tables','SQL','V25__add_jwt_auth_tables.sql',189694845,'lms_app_uat','2026-02-05 19:19:38',95,1),(3,'26','add max grade to qualification','SQL','V26__add_max_grade_to_qualification.sql',-1473165128,'lms_app_uat','2026-02-10 13:24:39',112,1),(4,'27','add round description to interview','SQL','V27__add_round_description_to_interview.sql',-304955282,'lms_app_uat','2026-02-16 06:07:17',190,1),(5,'28','student assignment unique submission','SQL','V28__student_assignment_unique_submission.sql',-223256436,'lms_app_uat','2026-02-16 06:07:17',96,1),(6,'29','attend unique constraint and soft delete','SQL','V29__attend_unique_constraint_and_soft_delete.sql',-436473780,'lms_app_uat','2026-02-16 06:07:17',31,1),(7,'30','interview version and overlap support','SQL','V30__interview_version_and_overlap_support.sql',-1231520345,'lms_app_uat','2026-02-16 06:07:17',38,1),(8,'31','add version to learner and faculty','SQL','V31__add_version_to_learner_and_faculty.sql',1274401279,'lms_app_uat','2026-02-16 06:07:18',113,1),(9,'32','interview learner slot unique prevent double booking','SQL','V32__interview_learner_slot_unique_prevent_double_booking.sql',2038855257,'lms_app_uat','2026-02-17 03:38:11',717,1),(10,'33','job application internal notes and interview feedback','SQL','V33__job_application_internal_notes_and_interview_feedback.sql',1941073699,'lms_app_uat','2026-02-17 03:38:11',236,1),(11,'34','job important dates','SQL','V34__job_important_dates.sql',-1666930844,'lms_app_uat','2026-02-17 17:07:08',282,1),(12,'35','add title to class schedule','SQL','V35__add_title_to_class_schedule.sql',1095196259,'lms_app_uat','2026-02-19 18:31:01',161,1),(13,'36','learner content progress','SQL','V36__learner_content_progress.sql',614785115,'lms_app_uat','2026-02-23 20:02:38',345,1),(14,'37','lesson content class sequence','SQL','V37__lesson_content_class_sequence.sql',-751495485,'lms_app_uat','2026-02-24 10:53:21',264,1),(15,'38','job assessment url','SQL','V38__job_assessment_url.sql',-1868212213,'lms_app_uat','2026-02-27 20:51:36',444,1),(16,'38','job assessment url','DELETE','V38__job_assessment_url.sql',-1868212213,'lms_app_uat','2026-02-27 21:22:52',0,1),(17,'38','job assessment url','SQL','V38__job_assessment_url.sql',-1868212213,'lms_app_uat','2026-02-28 19:37:22',361,1),(18,'39','job rejection reason duration assessment deadline','SQL','V39__job_rejection_reason_duration_assessment_deadline.sql',-1425707108,'lms_app_uat','2026-02-28 19:37:24',870,1),(19,'40','job application status history','SQL','V40__job_application_status_history.sql',1311909884,'lms_app_uat','2026-02-28 19:37:25',280,1),(20,'41','notification application job deeplink','SQL','V41__notification_application_job_deeplink.sql',-35958911,'lms_app_uat','2026-02-28 19:37:26',594,1),(21,'42','notification assessment url','SQL','V42__notification_assessment_url.sql',-193995213,'lms_app_uat','2026-02-28 19:37:27',392,1),(22,'43','job draft state','SQL','V43__job_draft_state.sql',1135873454,'lms_app_uat','2026-02-28 19:37:28',384,1),(23,'44','learner saved jobs','SQL','V44__learner_saved_jobs.sql',-1228234414,'lms_app_uat','2026-02-28 19:37:29',271,1),(24,'45','notification interview id','SQL','V45__notification_interview_id.sql',-897969617,'lms_app_uat','2026-03-01 07:45:59',364,1),(25,'46','cleanup bad announcements','SQL','V46__cleanup_bad_announcements.sql',32120344,'lms_app_uat','2026-03-06 11:12:34',393,1),(26,'47','quiz backend hardening','SQL','V47__quiz_backend_hardening.sql',821922764,'lms_app_uat','2026-03-06 16:49:01',1564,1),(27,'47','quiz backend hardening','DELETE','V47__quiz_backend_hardening.sql',-1812865192,'lms_app_uat','2026-03-06 21:23:04',0,1),(28,'47','quiz backend hardening','SQL','V47__quiz_backend_hardening.sql',821922764,'lms_app_uat','2026-03-07 04:42:49',1751,1),(29,'47','quiz backend hardening','DELETE','V47__quiz_backend_hardening.sql',821922764,'lms_app_uat','2026-03-13 21:22:57',0,1),(30,'47','quiz backend hardening','SQL','V47__quiz_backend_hardening.sql',821922764,'lms_app_uat','2026-03-16 06:38:56',1378,1),(31,'47','quiz backend hardening','DELETE','V47__quiz_backend_hardening.sql',821922764,'lms_app_uat','2026-03-20 23:08:11',0,1),(32,'47','quiz backend hardening','SQL','V47__quiz_backend_hardening.sql',821922764,'lms_app_uat','2026-03-26 07:01:45',1676,1),(33,'48','interview feedback action and drop hour index','SQL','V48__interview_feedback_action_and_drop_hour_index.sql',135153858,'lms_app_uat','2026-03-26 07:06:04',1198,1),(34,'49','drop old feedback recommend column','SQL','V49__drop_old_feedback_recommend_column.sql',1630344376,'lms_app_uat','2026-03-26 07:06:58',355,1),(35,'50','drop fee and transaction tables','SQL','V50__drop_fee_and_transaction_tables.sql',1492570062,'lms_app_uat','2026-03-26 07:06:59',400,1),(36,'47','quiz backend hardening','DELETE','V47__quiz_backend_hardening.sql',821922764,'lms_app_uat','2026-03-28 21:25:16',0,1),(37,'48','interview feedback action and drop hour index','DELETE','V48__interview_feedback_action_and_drop_hour_index.sql',135153858,'lms_app_uat','2026-03-28 21:25:16',0,1),(38,'49','drop old feedback recommend column','DELETE','V49__drop_old_feedback_recommend_column.sql',1630344376,'lms_app_uat','2026-03-28 21:25:16',0,1),(39,'50','drop fee and transaction tables','DELETE','V50__drop_fee_and_transaction_tables.sql',1492570062,'lms_app_uat','2026-03-28 21:25:16',0,1),(40,'47','quiz backend hardening','SQL','V47__quiz_backend_hardening.sql',821922764,'lms_app_uat','2026-04-03 06:57:23',1430,1),(41,'48','interview feedback action and drop hour index','SQL','V48__interview_feedback_action_and_drop_hour_index.sql',135153858,'lms_app_uat','2026-04-03 06:57:25',1063,1),(42,'49','drop old feedback recommend column','SQL','V49__drop_old_feedback_recommend_column.sql',1630344376,'lms_app_uat','2026-04-03 06:57:26',349,1),(43,'50','drop fee and transaction tables','SQL','V50__drop_fee_and_transaction_tables.sql',1492570062,'lms_app_uat','2026-04-03 06:57:27',397,1),(44,'51','interview performance indexes','SQL','V51__interview_performance_indexes.sql',-1032100343,'lms_app_uat','2026-04-03 06:57:28',1223,1),(45,'52','attend is deleted index','SQL','V52__attend_is_deleted_index.sql',-1766810029,'lms_app_uat','2026-04-03 06:57:30',458,1),(46,'53','classroom messages','SQL','V53__smrithi_application_unique_email_phone.sql',-1107975047,'lms_app_uat','2026-04-03 06:57:31',542,1),(47,'54','smrithi application soft delete','SQL','V54__smrithi_application_soft_delete.sql',879600309,'lms_app_uat','2026-04-03 06:57:32',269,1),(48,'55','student assignment grade published','SQL','V55__student_assignment_grade_published.sql',1383295313,'lms_app_uat','2026-04-03 06:57:32',274,1),(49,'56','user session','SQL','V56__user_session.sql',1648954425,'lms_app_uat','2026-04-03 06:57:33',242,1),(50,'57','student assignment semester','SQL','V57__student_assignment_semester.sql',1541214272,'lms_app_uat','2026-04-03 06:57:34',232,1),(51,'58','notification creator faculty id','SQL','V58__notification_creator_faculty_id.sql',-2068549750,'lms_app_uat','2026-04-03 06:57:35',337,1),(52,'54','smrithi application soft delete','DELETE','V54__smrithi_application_soft_delete.sql',879600309,'snapshot','2026-04-23 18:50:30',0,1),(53,'59','tenant domains branding settings','SQL','V59__tenant_domains_branding_settings.sql',1805185120,'snapshot','2026-04-23 18:50:31',319,1),(54,'60','auth handoff token','SQL','V60__auth_handoff_token.sql',105697737,'snapshot','2026-04-23 18:50:31',153,1),(55,'61','admin audit log','SQL','V61__admin_audit_log.sql',-674767801,'snapshot','2026-04-23 18:50:32',94,1),(56,'62','tenant domain verification','SQL','V62__tenant_domain_verification.sql',-313824833,'snapshot','2026-04-23 18:50:32',325,1),(57,'63','app setting indexes','SQL','V63__app_setting_indexes.sql',361110338,'snapshot','2026-04-23 18:50:33',83,1),(58,'64','college branding mobile login bg','SQL','V64__college_branding_mobile_login_bg.sql',1763866809,'snapshot','2026-04-23 18:50:33',49,1),(59,'59','tenant domains branding settings','DELETE','V59__tenant_domains_branding_settings.sql',1805185120,'snapshot','2026-04-23 20:49:01',0,1),(60,'60','auth handoff token','DELETE','V60__auth_handoff_token.sql',105697737,'snapshot','2026-04-23 20:49:01',0,1),(61,'61','admin audit log','DELETE','V61__admin_audit_log.sql',-674767801,'snapshot','2026-04-23 20:49:01',0,1),(62,'62','tenant domain verification','DELETE','V62__tenant_domain_verification.sql',-313824833,'snapshot','2026-04-23 20:49:01',0,1),(63,'63','app setting indexes','DELETE','V63__app_setting_indexes.sql',361110338,'snapshot','2026-04-23 20:49:01',0,1),(64,'64','college branding mobile login bg','DELETE','V64__college_branding_mobile_login_bg.sql',-402349182,'snapshot','2026-04-23 20:49:01',0,1),(65,'59','tenant domains branding settings','SQL','V59__tenant_domains_branding_settings.sql',1805185120,'snapshot','2026-04-23 20:54:57',79,1),(66,'60','auth handoff token','SQL','V60__auth_handoff_token.sql',105697737,'snapshot','2026-04-23 20:54:57',22,1),(67,'61','admin audit log','SQL','V61__admin_audit_log.sql',-674767801,'snapshot','2026-04-23 20:54:57',26,1),(68,'62','tenant domain verification','SQL','V62__tenant_domain_verification.sql',-313824833,'snapshot','2026-04-23 20:54:57',86,1),(69,'63','app setting indexes','SQL','V63__app_setting_indexes.sql',361110338,'snapshot','2026-04-23 20:54:57',71,1),(70,'53','smrithi application unique email phone','DELETE','V53__smrithi_application_unique_email_phone.sql',-1576311175,'snapshot','2026-04-23 21:18:13',0,1),(71,'64','college branding mobile login bg','SQL','V64__college_branding_mobile_login_bg.sql',1763866809,'snapshot','2026-04-23 21:57:09',148,1),(72,'65','mobile login attempt verified at','SQL','V65__quiz_attempt_sessions.sql',1774885740,'snapshot','2026-04-27 20:28:32',107,1),(73,'65','quiz attempt sessions','DELETE','V65__quiz_attempt_sessions.sql',156682339,'snapshot','2026-04-28 09:04:29',0,1),(74,'65','mobile login attempt verified at','SQL','V65__mobile_login_attempt_verified_at.sql',1774885740,'snapshot','2026-04-30 02:19:48',214,1),(75,'66','first class quiz tables','SQL','V66__first_class_quiz_tables.sql',346236895,'snapshot','2026-05-01 09:18:48',325,1),(76,'67','notification learner scope','SQL','V67__notification_learner_scope.sql',-2013433099,'snapshot','2026-05-12 06:08:15',212,1),(77,'68','mobile login attempt email fallback','SQL','V68__mobile_login_attempt_email_fallback.sql',1741403108,'snapshot','2026-05-12 21:59:39',55,1),(78,'69','assignment submission types','SQL','V69__assignment_submission_types.sql',-374133634,'snapshot','2026-05-14 15:08:10',72,1),(79,'70','student assignment submission assets','SQL','V70__student_assignment_submission_assets.sql',789747347,'snapshot','2026-05-15 07:52:08',85,1),(80,'71','classroom messages','SQL','V71__student_registration_sync.sql',-1107975047,'snapshot','2026-07-08 14:48:04',165,1),(81,'71','student registration sync','DELETE','V71__student_registration_sync.sql',819778907,'snapshot','2026-07-08 15:52:48',0,1),(82,'71','classroom messages','SQL','V71__student_registration_sync.sql',-1107975047,'snapshot','2026-07-08 16:28:45',56,1),(83,'71','student registration sync','DELETE','V71__student_registration_sync.sql',-961208342,'snapshot','2026-07-08 18:18:58',0,1),(84,'71','classroom messages','SQL','V71__student_registration_sync.sql',-1107975047,'snapshot','2026-07-09 08:48:53',84,1),(85,'71','student registration sync','DELETE','V71__student_registration_sync.sql',-961208342,'snapshot','2026-07-10 05:51:39',0,1),(86,'71','classroom messages','SQL','V71__student_registration_sync.sql',-1107975047,'snapshot','2026-07-10 19:43:51',62,1),(87,'71','student registration sync','DELETE','V71__student_registration_sync.sql',-961208342,'snapshot','2026-07-13 19:46:33',0,1),(88,'73','classroom messages','SQL','V73__classroom_messages.sql',-1107975047,'snapshot','2026-07-13 19:46:34',169,1),(89,'71','classroom messages','SQL','V71__student_registration_sync.sql',-1107975047,'snapshot','2026-07-14 14:43:37',49,1),(90,'72','discussion threads and replies','SQL','V72__discussion_threads_and_replies.sql',-599445027,'snapshot','2026-07-14 14:46:14',188,1),(91,'73','classroom messages','DELETE','V73__classroom_messages.sql',-1107975047,'snapshot','2026-07-15 19:28:14',0,1),(92,'72','discussion threads and replies','DELETE','V72__discussion_threads_and_replies.sql',-599445027,'snapshot','2026-07-15 19:28:14',0,1),(93,'71','classroom messages','DELETE','V71__student_registration_sync.sql',-1107975047,'snapshot','2026-08-25 09:59:14',0,1),(94,'73','classroom messages','SQL','V73__classroom_messages.sql',-1107975047,'snapshot','2026-08-25 09:59:14',81,1),(95,'74','project workspaces','SQL','V74__project_workspaces.sql',961111513,'snapshot','2026-08-25 09:59:14',150,1),(96,'75','project tasks','SQL','V75__project_tasks.sql',1585947666,'snapshot','2026-08-25 09:59:15',120,1),(97,'76','project task comments','SQL','V76__project_task_comments.sql',-951385317,'snapshot','2026-08-25 09:59:15',49,1),(98,'77','project task comment actions','SQL','V77__project_task_comment_actions.sql',-742365566,'snapshot','2026-08-25 09:59:15',62,1),(99,'78','project task blocker reason','SQL','V78__project_task_blocker_reason.sql',1651211500,'snapshot','2026-08-25 09:59:15',42,1),(100,'79','project resources','SQL','V79__project_resources.sql',-959139063,'snapshot','2026-08-25 09:59:15',54,1),(101,'80','project resource audit','SQL','V80__project_resource_audit.sql',-804085938,'snapshot','2026-08-25 09:59:15',45,1),(102,'81','project delivery','SQL','V81__project_delivery.sql',-447822346,'snapshot','2026-08-25 09:59:15',49,1),(103,'82','project delivery event','SQL','V82__project_delivery_event.sql',1876304003,'snapshot','2026-08-25 09:59:15',58,1),(104,'83','project delivery file metadata','SQL','V83__project_delivery_file_metadata.sql',324154195,'snapshot','2026-08-25 09:59:16',188,1),(105,'84','project meetings','SQL','V84__project_meetings.sql',-2078061367,'snapshot','2026-08-25 09:59:16',89,1),(106,'85','project meeting followups','SQL','V85__project_meeting_followups.sql',857373998,'snapshot','2026-08-25 09:59:16',39,1),(107,'86','project activity events','SQL','V86__project_activity_events.sql',-1548219502,'snapshot','2026-08-25 09:59:16',56,1),(108,'87','project milestones and task links','SQL','V87__project_milestones_and_task_links.sql',-1452929045,'snapshot','2026-08-25 09:59:16',149,1),(109,'88','project templates','SQL','V88__project_templates.sql',1949543678,'snapshot','2026-08-25 09:59:16',323,1),(110,'89','project template lifecycle version','SQL','V89__project_template_lifecycle_version.sql',1012210208,'snapshot','2026-08-25 09:59:17',140,1),(111,'90','project template versions','SQL','V90__project_template_versions.sql',-44587913,'snapshot','2026-08-25 09:59:17',51,1),(112,'91','project entities optimistic locking','SQL','V91__project_entities_optimistic_locking.sql',-782812838,'snapshot','2026-08-25 09:59:17',225,1),(113,'92','project readiness override and settings','SQL','V92__project_readiness_override_and_settings.sql',138302154,'snapshot','2026-08-25 09:59:17',351,1),(114,'93','project delivery optimistic locking','SQL','V93__project_delivery_optimistic_locking.sql',-1855170903,'snapshot','2026-08-25 09:59:17',40,1),(115,'94','project activity event code','SQL','V94__project_activity_event_code.sql',-1094527973,'snapshot','2026-08-25 09:59:18',65,1),(116,'95','project member settings optimistic locking','SQL','V95__project_member_settings_optimistic_locking.sql',458088862,'snapshot','2026-08-25 09:59:18',59,1),(117,'96','project template optimistic locking','SQL','V96__project_template_optimistic_locking.sql',-860274205,'snapshot','2026-08-25 09:59:18',52,1),(118,'97','project performance indexes','SQL','V97__project_performance_indexes.sql',1339593820,'snapshot','2026-08-25 09:59:18',406,1),(119,'98','project workspace bulk create uniqueness','SQL','V98__project_workspace_bulk_create_uniqueness.sql',-714435235,'snapshot','2026-08-25 09:59:18',133,1),(120,'99','project template slug college scoped','SQL','V99__project_template_slug_college_scoped.sql',-501710522,'snapshot','2026-08-25 09:59:19',100,1),(121,'100','project meeting calendar sync status','SQL','V100__project_meeting_calendar_sync_status.sql',-811291378,'snapshot','2026-08-25 09:59:19',49,1),(122,'101','project meeting meet link','SQL','V101__project_meeting_meet_link.sql',-1501815030,'snapshot','2026-08-25 09:59:19',58,1),(123,'102','project delivery attachments','SQL','V102__project_delivery_attachments.sql',-242853726,'snapshot','2026-08-25 09:59:19',53,1),(124,'103','job and job application optimistic locking','SQL','V103__job_and_job_application_optimistic_locking.sql',-646027874,'snapshot','2026-08-25 09:59:19',114,1),(125,'104','placements cascade on learner delete','SQL','V104__placements_cascade_on_learner_delete.sql',546577191,'snapshot','2026-08-25 09:59:20',315,1),(126,'105','interview interviewer name','SQL','V105__interview_interviewer_name.sql',-754709380,'snapshot','2026-08-25 09:59:20',36,1),(127,'106','job notification opt out','SQL','V106__job_notification_opt_out.sql',963576841,'snapshot','2026-08-25 09:59:20',36,1),(128,'107','job application resume history','SQL','V107__job_application_resume_history.sql',-762912248,'snapshot','2026-08-25 09:59:20',38,1),(129,'108','job application offer letter','SQL','V108__job_application_offer_letter.sql',-1746349842,'snapshot','2026-08-25 09:59:20',84,1),(130,'109','job application scale indexes','SQL','V109__job_application_scale_indexes.sql',1851179323,'snapshot','2026-08-25 09:59:20',314,1),(131,'110','company entity','SQL','V110__company_entity.sql',1833463919,'snapshot','2026-08-25 09:59:21',140,1),(132,'111','company name unique constraint','SQL','V111__company_name_unique_constraint.sql',-447023984,'snapshot','2026-08-25 09:59:21',175,1),(133,'112','job application status before withdrawal','SQL','V112__job_application_status_before_withdrawal.sql',1888491632,'snapshot','2026-08-25 09:59:21',42,1),(134,'113','fix company dedup key insert trigger','SQL','V113__fix_company_dedup_key_insert_trigger.sql',1632326194,'snapshot','2026-08-25 09:59:21',32,1),(135,'114','job slug unique index','SQL','V114__job_slug_unique_index.sql',-1421596716,'snapshot','2026-08-25 09:59:21',15,1),(136,'115','drop google oauth and gmail validation tables','SQL','V115__drop_google_oauth_and_gmail_validation_tables.sql',-541171812,'snapshot','2026-08-28 06:07:06',103,1),(137,'116','learner faculty suspension','SQL','V116__learner_faculty_suspension.sql',85516631,'snapshot','2026-09-09 20:03:56',464,1),(138,'117','tenant domain verification diagnostics','SQL','V117__tenant_domain_verification_diagnostics.sql',-462501304,'snapshot','2026-09-09 20:03:56',154,1),(139,'118','project sprints','SQL','V118__project_sprints.sql',854983605,'snapshot','2026-09-09 20:03:58',1232,1),(140,'119','project releases','SQL','V119__project_releases.sql',55771559,'snapshot','2026-09-09 20:03:58',197,1),(141,'120','course lesson optimistic locking','SQL','V120__course_lesson_optimistic_locking.sql',1022799963,'snapshot','2026-09-09 20:03:58',64,1),(142,'121','lesson contents optimistic locking','SQL','V121__lesson_contents_optimistic_locking.sql',-1688670281,'snapshot','2026-09-09 20:03:58',46,1),(143,'122','quiz grade publish','SQL','V122__quiz_grade_publish.sql',1764567994,'snapshot','2026-09-09 20:03:58',57,1),(144,'123','learner content progress first completed','SQL','V123__learner_content_progress_first_completed.sql',583071462,'snapshot','2026-09-09 20:03:58',42,1),(145,'124','lesson contents class id normalize','SQL','V124__lesson_contents_class_id_normalize.sql',1762610473,'snapshot','2026-09-09 20:03:59',201,1),(146,'125','drop legacy quiz system','SQL','V125__drop_legacy_quiz_system.sql',1889598666,'snapshot','2026-09-09 20:03:59',243,1),(147,'126','learner bulk import batch id','SQL','V126__learner_bulk_import_batch_id.sql',-1746408636,'snapshot','2026-09-09 20:04:00',259,1),(148,'127','announcement schedule expiry pin','SQL','V127__announcement_schedule_expiry_pin.sql',1447359431,'snapshot','2026-09-09 20:04:00',176,1),(149,'128','attendance marked by and status','SQL','V128__attendance_marked_by_and_status.sql',342810849,'snapshot','2026-09-09 20:04:00',76,1),(150,'129','attendance schedule indexes','SQL','V129__attendance_schedule_indexes.sql',-1530960758,'snapshot','2026-09-09 20:04:01',233,1),(151,'130','notification schedule and delivery status','SQL','V130__notification_schedule_and_delivery_status.sql',-1537114625,'snapshot','2026-09-09 20:04:01',98,1),(152,'131','course lesson unique names','SQL','V131__course_lesson_unique_names.sql',1480499385,'snapshot','2026-09-09 20:04:01',369,1),(153,'132','learner content progress attempt','SQL','V132__learner_content_progress_attempt.sql',175232076,'snapshot','2026-09-09 20:04:02',179,1),(154,'133','quiz shuffle','SQL','V133__quiz_shuffle.sql',-2066027639,'snapshot','2026-09-09 20:04:02',54,1),(155,'134','sms delivery log','SQL','V134__sms_delivery_log.sql',751150391,'snapshot','2026-09-09 20:04:02',111,1),(156,'135','scheduled job lock','SQL','V135__scheduled_job_lock.sql',1477437048,'snapshot','2026-09-09 20:04:02',50,1),(157,'136','project template global','SQL','V136__project_template_global.sql',925384217,'snapshot','2026-09-09 20:04:03',365,1),(158,'137','drop project settings','SQL','V137__drop_project_settings.sql',-195537290,'snapshot','2026-09-09 20:04:03',32,1),(159,'138','app setting global uniqueness','SQL','V138__app_setting_global_uniqueness.sql',1384369738,'snapshot','2026-09-09 20:04:03',217,1),(160,'139','project task approach','SQL','V139__project_task_approach.sql',-862899256,'snapshot','2026-09-09 20:04:03',67,1),(161,'140','project template college assignment','SQL','V140__project_template_college_assignment.sql',1217964803,'snapshot','2026-09-09 20:04:03',59,1),(162,'141','rename milestones to sprints','SQL','V141__rename_milestones_to_sprints.sql',1749136498,'snapshot','2026-09-09 20:04:04',1141,1),(163,'142','rename milestones to sprints escaped json','SQL','V142__rename_milestones_to_sprints_escaped_json.sql',-1862644540,'snapshot','2026-09-09 20:04:05',88,1),(164,'143','rename milestones to sprints snapshot json','SQL','V143__rename_milestones_to_sprints_snapshot_json.sql',2102105622,'snapshot','2026-09-09 20:04:05',9,1),(165,'144','backfill project template college assignment','SQL','V144__backfill_project_template_college_assignment.sql',-2100496280,'snapshot','2026-09-09 20:21:44',47,1),(166,'145','retire course module toggles','SQL','V145__retire_course_module_toggles.sql',-764942636,'snapshot','2026-09-19 09:09:00',19,1),(167,'146','project restore and task ownership','SQL','V146__project_restore_and_task_ownership.sql',-634831769,'snapshot','2026-09-19 12:21:28',236,1),(168,'147','project reversible content restore','SQL','V147__project_reversible_content_restore.sql',602885175,'snapshot','2026-09-19 12:25:26',268,1),(169,'148','project template snapshot','SQL','V148__project_template_snapshot.sql',-1841189817,'snapshot','2026-09-19 12:57:55',125,1),(170,'148','project template snapshot','DELETE','V148__project_template_snapshot.sql',-397115340,'snapshot','2026-09-19 12:58:14',0,1),(171,'148','project template snapshot','SQL','V148__project_template_snapshot.sql',-1841189817,'snapshot','2026-09-20 21:14:48',41,1),(172,'149','mobile otp verification attempts','SQL','V149__mobile_otp_verification_attempts.sql',286565477,'snapshot','2026-09-20 21:14:48',59,1),(173,'150','assignment upload receipts','SQL','V150__assignment_upload_receipts.sql',-1074325393,'snapshot','2026-09-21 08:04:12',161,1);
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

