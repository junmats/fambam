-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 05, 2025 at 07:18 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fambam_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `family_members`
--

CREATE TABLE `family_members` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `maiden_name` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `birth_place` varchar(255) DEFAULT NULL,
  `death_date` date DEFAULT NULL,
  `death_place` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other','unknown') DEFAULT 'unknown',
  `bio` text DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `generation_level` int(11) DEFAULT 0,
  `is_living` tinyint(1) DEFAULT 1,
  `occupation` varchar(200) DEFAULT NULL,
  `education` varchar(200) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `facebook_url` varchar(500) DEFAULT NULL,
  `twitter_url` varchar(500) DEFAULT NULL,
  `instagram_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `family_members`
--

INSERT INTO `family_members` (`id`, `user_id`, `created_by`, `first_name`, `middle_name`, `last_name`, `maiden_name`, `birth_date`, `birth_place`, `death_date`, `death_place`, `gender`, `bio`, `photo_url`, `generation_level`, `is_living`, `occupation`, `education`, `notes`, `created_at`, `updated_at`, `facebook_url`, `twitter_url`, `instagram_url`) VALUES
(1, NULL, 2, 'Isko', NULL, 'Almagro', NULL, NULL, 'Dalaguete, Cebu', NULL, 'Dalaguete, Cebu', NULL, 'Updated bio - test for created_by permission', NULL, 0, 0, NULL, NULL, NULL, '2025-07-03 04:03:26', '2025-07-04 17:23:13', NULL, NULL, NULL),
(2, NULL, 2, 'Ilang', 'Legaspi', 'Almagro', 'Selerio', '1892-02-02', 'Dalaguete, Cebu', '1992-01-01', 'Dalaguete, Cebu', 'female', NULL, NULL, 0, 0, NULL, NULL, NULL, '2025-07-03 04:04:10', '2025-07-04 17:23:13', NULL, NULL, NULL),
(3, NULL, 2, 'Juanito', 'Legaspi', 'Almagro', NULL, '1921-03-03', 'Dalaguete, Cebu', '1996-04-04', 'Medina Misamis', 'male', NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-07-03 04:05:19', '2025-07-04 17:23:13', NULL, NULL, NULL),
(4, NULL, 2, 'Teresita', 'Legaspi', 'Almagro', NULL, '1925-06-06', 'Dalaguete, Cebu', NULL, NULL, 'female', NULL, NULL, 1, 1, NULL, NULL, NULL, '2025-07-03 04:06:08', '2025-07-04 17:23:13', NULL, NULL, NULL),
(5, NULL, 2, 'Serapio', 'Legaspi', 'Almagro', NULL, '1927-06-06', 'Dalaguete, Cebu', NULL, NULL, 'male', NULL, NULL, 1, 1, NULL, NULL, NULL, '2025-07-03 04:06:56', '2025-07-04 17:23:13', NULL, NULL, NULL),
(6, NULL, 2, 'Mateo', 'Legaspi', 'Almagro', NULL, '1928-07-06', 'Dalaguete, Cebu', NULL, NULL, 'male', NULL, NULL, 1, 1, NULL, NULL, NULL, '2025-07-03 04:07:54', '2025-07-04 17:23:13', NULL, NULL, NULL),
(7, NULL, 2, 'Fulton', 'Belcina', 'Almagro', NULL, '1971-06-06', 'Dalaguete, Cebu', NULL, NULL, 'male', NULL, NULL, 2, 1, 'Attorney', NULL, NULL, '2025-07-03 04:08:59', '2025-07-04 17:23:13', NULL, NULL, NULL),
(8, NULL, 2, 'Dolores', 'Belcina', 'Almagro', NULL, '1920-06-06', 'Dalaguete, Cebu', '2000-09-09', 'Dalaguete, Cebu', 'female', NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-07-03 04:09:34', '2025-07-04 17:23:13', NULL, NULL, NULL),
(9, NULL, 2, 'Theresa', 'Llanos', 'Almagro', NULL, '0073-12-15', 'Dalaguete, Cebu', NULL, NULL, 'female', NULL, NULL, 2, 1, 'Dentist', NULL, NULL, '2025-07-03 04:11:13', '2025-07-04 17:23:13', NULL, NULL, NULL),
(10, NULL, 2, 'Child 1', 'Llanos', 'Almagro', NULL, '2005-03-03', 'Dalaguete, Cebu', NULL, NULL, 'female', NULL, NULL, 3, 1, NULL, NULL, NULL, '2025-07-03 04:14:24', '2025-07-04 17:23:13', NULL, NULL, NULL),
(11, NULL, 2, 'Child 2', 'Lla', 'Almagro', NULL, '2010-06-06', 'Dalaguete, Cebu', NULL, NULL, 'female', NULL, NULL, 3, 1, NULL, NULL, NULL, '2025-07-03 04:15:04', '2025-07-04 17:23:13', NULL, NULL, NULL),
(12, NULL, 2, 'Dodong', NULL, 'Almagro', NULL, '1974-03-03', 'Medina Misamis', NULL, NULL, 'male', NULL, NULL, 2, 1, NULL, NULL, NULL, '2025-07-03 04:56:30', '2025-07-04 17:23:13', NULL, NULL, NULL),
(13, NULL, 2, 'Tata', 'Medina', 'Almagro', NULL, '1901-06-05', 'Medina Misamis', '1995-06-06', 'Medina Misamis', 'female', NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-07-03 04:57:54', '2025-07-04 17:23:13', NULL, NULL, NULL),
(14, NULL, 2, 'Asawa', 'Mo', 'Dodong', NULL, '1972-03-03', 'Medina Misamis', NULL, NULL, 'female', NULL, NULL, 2, 1, NULL, NULL, NULL, '2025-07-03 04:59:25', '2025-07-04 17:23:13', NULL, NULL, NULL),
(15, NULL, 2, 'JenJen', 'Almagro', 'Cortes', NULL, '1998-06-06', 'Medina Misamis', NULL, NULL, 'female', NULL, NULL, 3, 1, NULL, NULL, NULL, '2025-07-03 05:00:35', '2025-07-04 17:23:13', NULL, NULL, NULL),
(17, NULL, 2, 'Yuki', 'Wail', 'Almagro', NULL, '2015-06-06', 'Medina Misamis', NULL, NULL, 'female', NULL, NULL, 4, 1, NULL, NULL, NULL, '2025-07-03 05:02:52', '2025-07-04 17:23:13', NULL, NULL, NULL),
(18, NULL, 2, 'Crispin', 'Legaspi', 'Almagro', NULL, '1927-06-06', 'Dalaguete, Cebu', NULL, NULL, 'male', NULL, NULL, 1, 1, NULL, NULL, NULL, '2025-07-03 05:04:41', '2025-07-04 17:23:13', NULL, NULL, NULL),
(19, NULL, 2, 'Amy', 'Ilago', 'Almagro', NULL, '1969-03-02', 'Medina Misamis', NULL, NULL, 'female', NULL, NULL, 2, 1, NULL, NULL, NULL, '2025-07-03 05:06:21', '2025-07-04 17:23:13', 'https://facebook.com/amy.almagro', 'https://twitter.com/amy_almagro', 'https://instagram.com/amy.almagro'),
(20, 12, 2, 'Ilde', 'Belcina', 'Almagro', NULL, NULL, 'Dalaguete, Cebu', NULL, NULL, 'male', 'Final test - linked user edit working', 'http://localhost:5001/api/photos/6de98a09-4d4c-41b5-aec7-78f54fb738d4.jpg', 2, 1, NULL, NULL, NULL, '2025-07-03 05:08:30', '2025-07-04 17:23:13', NULL, NULL, NULL),
(21, NULL, 2, 'Mona', NULL, 'Almagro', NULL, '1977-03-03', 'Dalaguete, Cebu', NULL, NULL, 'female', NULL, NULL, 2, 1, NULL, NULL, NULL, '2025-07-03 05:08:56', '2025-07-04 17:23:13', NULL, NULL, NULL),
(22, 7, 2, 'Earl', NULL, 'Almagro', NULL, '1995-06-05', 'Dalaguete, Cebu', NULL, NULL, 'male', NULL, 'http://localhost:5001/api/photos/49928a95-b8dd-48a3-9ac3-36cf9b3069d9.jpg', 3, 1, NULL, NULL, NULL, '2025-07-03 05:11:48', '2025-07-04 17:23:13', NULL, NULL, NULL),
(28, NULL, 2, 'Ekon', NULL, 'Almagro', NULL, NULL, NULL, NULL, NULL, 'female', NULL, 'http://localhost:5001/api/photos/6766018f-4179-412e-b892-b0740554c57b.jpg', 2, 1, NULL, NULL, NULL, '2025-07-03 10:02:05', '2025-07-04 17:23:13', NULL, NULL, NULL),
(29, NULL, 2, 'Rosie', 'Cortes', 'Almagro', 'Romero', NULL, NULL, NULL, NULL, 'female', NULL, 'http://localhost:5001/api/photos/158f2de0-1e96-409f-9462-0cada5627e2f.jpg', 1, 1, NULL, NULL, NULL, '2025-07-03 10:12:40', '2025-07-04 17:23:13', NULL, NULL, NULL),
(32, NULL, 2, 'Dhana', NULL, 'Almagro', NULL, NULL, NULL, NULL, NULL, 'female', NULL, NULL, 3, 1, NULL, NULL, NULL, '2025-07-03 11:08:25', '2025-07-04 17:23:13', NULL, NULL, NULL),
(36, 11, 2, 'Junmat', NULL, 'Almagro', NULL, NULL, NULL, NULL, NULL, NULL, 'Updated via admin - testing user_id link functionality', NULL, 2, 1, NULL, NULL, NULL, '2025-07-04 03:13:49', '2025-07-04 17:23:13', 'https://www.facebook.com/matmat.almagro', NULL, NULL),
(40, NULL, 2, 'Sofia', 'Amaya', 'Almagro', 'Fajardo', NULL, NULL, NULL, NULL, 'female', NULL, 'http://localhost:5001/api/photos/102613e5-be94-4018-a090-5c0407ad0ec5.jpg', 2, 1, NULL, NULL, NULL, '2025-07-04 14:21:22', '2025-07-04 17:23:13', NULL, NULL, NULL),
(41, NULL, 2, 'Mateo Paul', NULL, 'Almagro', NULL, NULL, NULL, NULL, NULL, 'male', NULL, NULL, 3, 1, NULL, NULL, NULL, '2025-07-04 14:22:18', '2025-07-04 17:23:13', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `family_trees`
--

CREATE TABLE `family_trees` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tree_name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `root_person_id` int(11) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `family_tree_members`
--

CREATE TABLE `family_tree_members` (
  `id` int(11) NOT NULL,
  `tree_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `life_events`
--

CREATE TABLE `life_events` (
  `id` int(11) NOT NULL,
  `person_id` int(11) NOT NULL,
  `event_type` enum('birth','death','marriage','divorce','graduation','employment','military','immigration','other') NOT NULL,
  `event_date` date DEFAULT NULL,
  `event_place` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `marriages`
--

CREATE TABLE `marriages` (
  `id` int(11) NOT NULL,
  `spouse1_id` int(11) NOT NULL,
  `spouse2_id` int(11) NOT NULL,
  `marriage_date` date DEFAULT NULL,
  `marriage_place` varchar(255) DEFAULT NULL,
  `divorce_date` date DEFAULT NULL,
  `divorce_place` varchar(255) DEFAULT NULL,
  `marriage_type` enum('marriage','civil_union','domestic_partnership','common_law') DEFAULT 'marriage',
  `status` enum('married','divorced','separated','widowed','annulled') DEFAULT 'married',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `marriages`
--

INSERT INTO `marriages` (`id`, `spouse1_id`, `spouse2_id`, `marriage_date`, `marriage_place`, `divorce_date`, `divorce_place`, `marriage_type`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 2, '1920-06-06', 'Dalaguete, Cebu', NULL, NULL, 'marriage', 'married', NULL, '2025-07-03 04:04:35', '2025-07-03 04:04:35'),
(2, 5, 8, '1960-03-03', 'Dalaguete, Cebu', NULL, NULL, 'marriage', 'married', NULL, '2025-07-03 04:09:58', '2025-07-03 04:09:58'),
(3, 7, 9, '2000-03-03', 'Cebu City', NULL, NULL, 'marriage', 'married', NULL, '2025-07-03 04:11:42', '2025-07-03 04:11:42'),
(4, 3, 13, '1925-05-05', 'Medina Misamis', NULL, NULL, 'marriage', 'married', NULL, '2025-07-03 04:58:22', '2025-07-03 04:58:22'),
(5, 12, 14, '2005-06-06', 'Medina Misamis', NULL, NULL, 'marriage', 'married', NULL, '2025-07-03 04:59:54', '2025-07-03 04:59:54'),
(7, 21, 20, '2000-08-08', 'Cebu City', NULL, NULL, 'marriage', 'married', NULL, '2025-07-03 05:09:18', '2025-07-03 05:09:18'),
(8, 6, 29, '1950-12-15', 'Dalaguete, Cebu', NULL, NULL, 'marriage', 'married', NULL, '2025-07-03 10:13:10', '2025-07-03 10:13:10'),
(10, 36, 40, '2008-04-19', 'Cebu City', NULL, NULL, 'marriage', 'married', NULL, '2025-07-04 14:21:52', '2025-07-04 14:21:52');

-- --------------------------------------------------------

--
-- Table structure for table `parent_child_relationships`
--

CREATE TABLE `parent_child_relationships` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `child_id` int(11) NOT NULL,
  `relationship_type` enum('biological','adopted','step','foster','guardian') DEFAULT 'biological',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `parent_child_relationships`
--

INSERT INTO `parent_child_relationships` (`id`, `parent_id`, `child_id`, `relationship_type`, `created_at`) VALUES
(1, 1, 3, 'biological', '2025-07-03 04:05:29'),
(2, 2, 3, 'biological', '2025-07-03 04:05:38'),
(3, 1, 4, 'biological', '2025-07-03 04:06:17'),
(4, 2, 4, 'biological', '2025-07-03 04:06:23'),
(5, 1, 5, 'biological', '2025-07-03 04:07:07'),
(6, 2, 5, 'biological', '2025-07-03 04:07:16'),
(7, 1, 6, 'biological', '2025-07-03 04:08:04'),
(8, 2, 6, 'biological', '2025-07-03 04:08:10'),
(9, 8, 7, 'biological', '2025-07-03 04:10:07'),
(10, 5, 7, 'biological', '2025-07-03 04:10:14'),
(11, 7, 10, 'biological', '2025-07-03 04:15:22'),
(12, 9, 10, 'biological', '2025-07-03 04:15:36'),
(13, 7, 11, 'biological', '2025-07-03 04:15:45'),
(14, 9, 11, 'biological', '2025-07-03 04:15:53'),
(15, 13, 12, 'biological', '2025-07-03 04:58:35'),
(16, 3, 12, 'biological', '2025-07-03 04:58:44'),
(17, 12, 15, 'biological', '2025-07-03 05:00:49'),
(18, 14, 15, 'biological', '2025-07-03 05:00:59'),
(20, 15, 17, 'biological', '2025-07-03 05:03:06'),
(21, 2, 18, 'biological', '2025-07-03 05:04:52'),
(22, 1, 18, 'biological', '2025-07-03 05:04:59'),
(23, 3, 19, 'biological', '2025-07-03 05:06:39'),
(24, 13, 19, 'biological', '2025-07-03 05:06:49'),
(25, 5, 20, 'biological', '2025-07-03 05:09:56'),
(26, 8, 20, 'biological', '2025-07-03 05:10:18'),
(27, 20, 22, 'biological', '2025-07-03 05:12:00'),
(28, 21, 22, 'biological', '2025-07-03 05:12:11'),
(32, 6, 28, 'biological', '2025-07-03 10:11:55'),
(33, 29, 28, 'biological', '2025-07-03 10:13:31'),
(34, 20, 32, 'biological', '2025-07-03 11:08:43'),
(35, 21, 32, 'biological', '2025-07-03 11:08:50'),
(36, 6, 36, 'biological', '2025-07-04 03:14:09'),
(39, 36, 41, 'biological', '2025-07-04 14:22:32'),
(40, 40, 41, 'biological', '2025-07-04 14:22:44'),
(41, 29, 36, 'biological', '2025-07-04 16:57:22');

-- --------------------------------------------------------

--
-- Table structure for table `sibling_relationships`
--

CREATE TABLE `sibling_relationships` (
  `id` int(11) NOT NULL,
  `sibling1_id` int(11) NOT NULL,
  `sibling2_id` int(11) NOT NULL,
  `relationship_type` enum('full','half','step','adopted') DEFAULT 'full',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `is_admin`, `created_at`, `updated_at`, `reset_token`, `reset_token_expiry`) VALUES
(2, 'demo@fambam.com', '$2b$10$LX47c9EFoZQ3zTTx67B6AujKFf2DT.m8U9knwbEF43zZRZlCw.IZ6', 1, '2025-07-01 06:08:15', '2025-07-04 09:29:08', NULL, NULL),
(3, 'test@example.com', '$2b$10$6yIMMZEbAe2Iji.tCBWFTOZ6REhOgmX9brZ3hvxxb3UxOhBm140jG', 0, '2025-07-03 11:15:48', '2025-07-03 11:15:48', NULL, NULL),
(4, 'testuser@fambam.com', '$2b$10$LX47c9EFoZQ3zTTx67B6AujKFf2DT.m8U9knwbEF43zZRZlCw.IZ6', 0, '2025-07-04 04:50:07', '2025-07-04 09:39:05', NULL, NULL),
(6, 'test@email.com', '$2b$10$LoSuHc0JPfHC9MONHNsTdusiw58DweXOes0fG0IPvq8ZxX1NEqBaS', 0, '2025-07-04 10:03:55', '2025-07-04 10:03:55', NULL, NULL),
(7, 'test2@email.com', '$2b$10$WNHEhJAN6g5LXFKD3cfYuOyWQn1sJUmLbYXanYkUxeeYjQL8DGgry', 1, '2025-07-04 10:23:59', '2025-07-04 14:44:35', NULL, NULL),
(8, 'test3@user.email.com', '$2b$10$.X6aRdg/t5Gs6u9UmPxF.Ow3imBexBdWeLrUIwL88MVMaOa.WXTvO', 0, '2025-07-04 10:30:11', '2025-07-04 10:30:11', NULL, NULL),
(9, 'test3@email.com', '$2b$10$bZziQ1qUGCKdTTE0tZPez.9Zhe0DGHA2Oe3F.bRdMRUXeWdK1Af4O', 0, '2025-07-04 10:37:08', '2025-07-04 10:37:08', NULL, NULL),
(10, 'test4@email.com', '$2b$10$VAdgxBIDAxq2oM.Plii.KOJfj2pVWr8Uv.K1UXQxhcbxP8wLViEL6', 0, '2025-07-04 10:45:20', '2025-07-04 10:45:20', NULL, NULL),
(11, 'test5@email.com', '$2b$10$2jaaG2l2jpzjc99wQGeqfOuqh2sG6MqD7AIsYYDNmnY4EMIRYZBF.', 0, '2025-07-04 10:53:33', '2025-07-04 10:53:33', NULL, NULL),
(12, 'test6@email.com', '$2b$10$AdTblY8RDzpS4zKMoasWq.MV71emxeUpJg.Y3AEeNs3sii.zh4xbm', 0, '2025-07-04 14:49:32', '2025-07-04 14:49:32', NULL, NULL),
(13, 'testuser@example.com', '$2b$10$ao3evZzHAxgT4sSuvVeR7uJEl3XaPCbhJk5NGz5NRM3THzRUilyuW', 0, '2025-07-04 17:06:08', '2025-07-04 17:06:08', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `family_members`
--
ALTER TABLE `family_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_generation` (`user_id`,`generation_level`),
  ADD KEY `idx_birth_date` (`birth_date`),
  ADD KEY `idx_last_name` (`last_name`);

--
-- Indexes for table `family_trees`
--
ALTER TABLE `family_trees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `root_person_id` (`root_person_id`),
  ADD KEY `idx_user_tree` (`user_id`,`is_default`);

--
-- Indexes for table `family_tree_members`
--
ALTER TABLE `family_tree_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tree_member` (`tree_id`,`member_id`),
  ADD KEY `member_id` (`member_id`);

--
-- Indexes for table `life_events`
--
ALTER TABLE `life_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_person_event` (`person_id`,`event_type`),
  ADD KEY `idx_event_date` (`event_date`);

--
-- Indexes for table `marriages`
--
ALTER TABLE `marriages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_marriage` (`spouse1_id`,`spouse2_id`),
  ADD KEY `idx_spouse1` (`spouse1_id`),
  ADD KEY `idx_spouse2` (`spouse2_id`),
  ADD KEY `idx_marriage_date` (`marriage_date`);

--
-- Indexes for table `parent_child_relationships`
--
ALTER TABLE `parent_child_relationships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_parent_child` (`parent_id`,`child_id`),
  ADD KEY `idx_parent` (`parent_id`),
  ADD KEY `idx_child` (`child_id`);

--
-- Indexes for table `sibling_relationships`
--
ALTER TABLE `sibling_relationships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_siblings` (`sibling1_id`,`sibling2_id`),
  ADD KEY `idx_sibling1` (`sibling1_id`),
  ADD KEY `idx_sibling2` (`sibling2_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `family_members`
--
ALTER TABLE `family_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `family_trees`
--
ALTER TABLE `family_trees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `family_tree_members`
--
ALTER TABLE `family_tree_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `life_events`
--
ALTER TABLE `life_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `marriages`
--
ALTER TABLE `marriages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `parent_child_relationships`
--
ALTER TABLE `parent_child_relationships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `sibling_relationships`
--
ALTER TABLE `sibling_relationships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `family_members`
--
ALTER TABLE `family_members`
  ADD CONSTRAINT `family_members_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `family_trees`
--
ALTER TABLE `family_trees`
  ADD CONSTRAINT `family_trees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `family_trees_ibfk_2` FOREIGN KEY (`root_person_id`) REFERENCES `family_members` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `family_tree_members`
--
ALTER TABLE `family_tree_members`
  ADD CONSTRAINT `family_tree_members_ibfk_1` FOREIGN KEY (`tree_id`) REFERENCES `family_trees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `family_tree_members_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `family_members` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `life_events`
--
ALTER TABLE `life_events`
  ADD CONSTRAINT `life_events_ibfk_1` FOREIGN KEY (`person_id`) REFERENCES `family_members` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `marriages`
--
ALTER TABLE `marriages`
  ADD CONSTRAINT `marriages_ibfk_1` FOREIGN KEY (`spouse1_id`) REFERENCES `family_members` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `marriages_ibfk_2` FOREIGN KEY (`spouse2_id`) REFERENCES `family_members` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `parent_child_relationships`
--
ALTER TABLE `parent_child_relationships`
  ADD CONSTRAINT `parent_child_relationships_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `family_members` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `parent_child_relationships_ibfk_2` FOREIGN KEY (`child_id`) REFERENCES `family_members` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sibling_relationships`
--
ALTER TABLE `sibling_relationships`
  ADD CONSTRAINT `sibling_relationships_ibfk_1` FOREIGN KEY (`sibling1_id`) REFERENCES `family_members` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sibling_relationships_ibfk_2` FOREIGN KEY (`sibling2_id`) REFERENCES `family_members` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
