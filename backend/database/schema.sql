CREATE DATABASE IF NOT EXISTS ustaad_network CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ustaad_network;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(15) NOT NULL UNIQUE,
  role ENUM('mechanic','customer','dealer','regional_manager','super_admin') NOT NULL DEFAULT 'mechanic',
  status ENUM('active','inactive','suspended','pending') NOT NULL DEFAULT 'pending',
  preferred_language VARCHAR(10) DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- OTP Verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mobile_number VARCHAR(15) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose ENUM('login','registration','fitment_confirm') NOT NULL,
  attempts INT DEFAULT 0,
  is_used TINYINT(1) DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mobile_purpose (mobile_number, purpose)
);

-- Mechanic Profiles
CREATE TABLE IF NOT EXISTS mechanic_profiles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  ustaad_id VARCHAR(20) NOT NULL UNIQUE,
  shop_name VARCHAR(255),
  shop_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  shop_category ENUM('motorcycle_repair','puncture_shop','multi_service','other') DEFAULT 'motorcycle_repair',
  experience_years INT DEFAULT 0,
  stocking_status ENUM('stocks_eurogrip','does_not_stock','planning_to_stock') DEFAULT 'does_not_stock',
  verification_status ENUM('unverified','verified','rejected') DEFAULT 'unverified',
  profile_completion INT DEFAULT 0,
  total_credits INT DEFAULT 0,
  level ENUM('beginner','professional','champion') DEFAULT 'beginner',
  profile_photo_url VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Dealers
CREATE TABLE IF NOT EXISTS dealers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  dealer_name VARCHAR(255) NOT NULL,
  shop_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  assigned_region VARCHAR(100),
  verification_status ENUM('unverified','verified','rejected') DEFAULT 'unverified',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('product_knowledge','tyre_sizing','tyre_selection','tyre_maintenance','tyre_safety','tyre_technology','customer_handling','workshop_practices') NOT NULL,
  content_url TEXT,
  thumbnail_url VARCHAR(500),
  difficulty ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
  duration_minutes INT DEFAULT 30,
  credit_reward INT DEFAULT 10,
  status ENUM('draft','published','archived') DEFAULT 'draft',
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Course Questions
CREATE TABLE IF NOT EXISTS course_questions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(500) NOT NULL,
  option_b VARCHAR(500) NOT NULL,
  option_c VARCHAR(500),
  option_d VARCHAR(500),
  correct_option ENUM('a','b','c','d') NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Course Progress
CREATE TABLE IF NOT EXISTS course_progress (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mechanic_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  completion_status ENUM('enrolled','in_progress','completed','failed') DEFAULT 'enrolled',
  assessment_score DECIMAL(5,2) DEFAULT 0,
  attempts INT DEFAULT 0,
  completed_at DATETIME,
  certificate_url VARCHAR(500),
  credits_awarded TINYINT(1) DEFAULT 0,
  UNIQUE KEY unique_mechanic_course (mechanic_id, course_id),
  FOREIGN KEY (mechanic_id) REFERENCES mechanic_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Achievement Badges
CREATE TABLE IF NOT EXISTS achievement_badges (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  badge_name VARCHAR(100) NOT NULL,
  badge_description TEXT,
  badge_icon VARCHAR(500),
  badge_type ENUM('registration','training','fitment','toolbank','engagement') NOT NULL,
  criteria_description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mechanic Badges
CREATE TABLE IF NOT EXISTS mechanic_badges (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mechanic_id BIGINT NOT NULL,
  badge_id BIGINT NOT NULL,
  awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_mechanic_badge (mechanic_id, badge_id),
  FOREIGN KEY (mechanic_id) REFERENCES mechanic_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES achievement_badges(id)
);

-- ToolBank Items
CREATE TABLE IF NOT EXISTS toolbank_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  category ENUM('basic_tools','advanced_equipment','brand_visibility') NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  credit_requirement INT NOT NULL DEFAULT 0,
  total_quantity INT DEFAULT 1,
  available_quantity INT DEFAULT 1,
  access_type ENUM('individual','shared') DEFAULT 'individual',
  max_reservation_days INT DEFAULT 7,
  status ENUM('active','inactive','maintenance') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ToolBank Reservations
CREATE TABLE IF NOT EXISTS toolbank_reservations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mechanic_id BIGINT NOT NULL,
  dealer_id BIGINT,
  item_id BIGINT NOT NULL,
  reservation_status ENUM('pending','approved','rejected','collected','returned','overdue','cancelled') DEFAULT 'pending',
  collection_date DATETIME,
  expected_return_date DATETIME,
  actual_return_date DATETIME,
  equipment_condition_on_return ENUM('excellent','good','fair','damaged') DEFAULT NULL,
  mechanic_notes TEXT,
  dealer_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mechanic_id) REFERENCES mechanic_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL,
  FOREIGN KEY (item_id) REFERENCES toolbank_items(id) ON DELETE CASCADE
);

-- Credit Transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mechanic_id BIGINT NOT NULL,
  transaction_type ENUM('earned','redeemed','expired','adjusted') NOT NULL,
  credit_amount INT NOT NULL,
  balance_after INT NOT NULL,
  activity_type ENUM('course_completion','assessment_pass','fitment_record','profile_complete','workshop_participation','admin_adjustment') NOT NULL,
  activity_reference VARCHAR(100),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mechanic_id) REFERENCES mechanic_profiles(id) ON DELETE CASCADE
);

-- Fitment Records
CREATE TABLE IF NOT EXISTS fitment_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  passport_id VARCHAR(50) NOT NULL UNIQUE,
  mechanic_id BIGINT NOT NULL,
  customer_mobile VARCHAR(15),
  customer_name VARCHAR(255),
  vehicle_category ENUM('motorcycle','scooter','moped','other') NOT NULL,
  vehicle_model VARCHAR(255),
  tyre_brand VARCHAR(100) NOT NULL,
  tyre_model VARCHAR(255),
  tyre_size VARCHAR(50),
  axle_position ENUM('front','rear','both') NOT NULL,
  installation_date DATE NOT NULL,
  dealer_invoice_ref VARCHAR(100),
  verification_status ENUM('submitted','customer_confirmed','evidence_submitted','verified','rejected') DEFAULT 'submitted',
  verification_level TINYINT DEFAULT 0,
  verification_otp VARCHAR(10),
  otp_expires_at DATETIME,
  otp_verified_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mechanic_id) REFERENCES mechanic_profiles(id) ON DELETE CASCADE,
  INDEX idx_mechanic (mechanic_id),
  INDEX idx_passport (passport_id),
  INDEX idx_customer_mobile (customer_mobile)
);

-- Fitment Evidence
CREATE TABLE IF NOT EXISTS fitment_evidence (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fitment_id BIGINT NOT NULL,
  evidence_type ENUM('invoice','photo','serial_number','dealer_confirmation') NOT NULL,
  evidence_reference VARCHAR(500),
  file_url VARCHAR(500),
  review_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  reviewed_by BIGINT,
  review_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fitment_id) REFERENCES fitment_records(id) ON DELETE CASCADE
);

-- Mechanic Activity Log
CREATE TABLE IF NOT EXISTS mechanic_activities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mechanic_id BIGINT NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  reference_id BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mechanic_id) REFERENCES mechanic_profiles(id) ON DELETE CASCADE
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id BIGINT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_entity (entity_type, entity_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','success','warning','error') DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed: Default Super Admin
INSERT IGNORE INTO users (full_name, mobile_number, role, status) VALUES 
('Super Admin', '9999999999', 'super_admin', 'active'),
('Demo Dealer', '8888888888', 'dealer', 'active'),
('Demo Mechanic', '7777777777', 'mechanic', 'active');

-- Seed: Dealer Profile
INSERT IGNORE INTO dealers (user_id, dealer_name, shop_address, city, state, pincode, assigned_region, verification_status)
SELECT id, 'Eurogrip Auto Parts', 'Shop 12, MG Road', 'Pune', 'Maharashtra', '411001', 'West', 'verified'
FROM users WHERE mobile_number = '8888888888';

-- Seed: Mechanic Profile
INSERT IGNORE INTO mechanic_profiles (user_id, ustaad_id, shop_name, shop_address, city, state, pincode, shop_category, experience_years, stocking_status, verification_status, total_credits, profile_completion)
SELECT id, 'UE-MH-00001', 'Ramesh Auto Works', 'Near Bus Stand, Kothrud', 'Pune', 'Maharashtra', '411038', 'motorcycle_repair', 8, 'does_not_stock', 'verified', 150, 85
FROM users WHERE mobile_number = '7777777777';

-- Seed: Achievement Badges
INSERT IGNORE INTO achievement_badges (badge_name, badge_description, badge_type, criteria_description) VALUES
('Profile Pioneer', 'Completed your Ustaad profile', 'registration', 'Complete 100% of your profile'),
('First Steps', 'Completed your first training module', 'training', 'Complete any one course'),
('Tyre Expert', 'Completed 5 training modules', 'training', 'Complete 5 or more courses'),
('Fitment Star', 'Recorded first tyre fitment', 'fitment', 'Create first fitment passport'),
('ToolBank User', 'First equipment reservation', 'toolbank', 'Make first ToolBank reservation'),
('Eurogrip Champion', 'Reached Champion level', 'engagement', 'Achieve Champion level');

-- Seed: Courses
INSERT IGNORE INTO courses (title, description, category, content_url, difficulty, duration_minutes, credit_reward, status, sort_order) VALUES
('Introduction to Eurogrip Tyres', 'Learn about Eurogrip product range, quality standards and tyre technologies.', 'product_knowledge', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'beginner', 20, 15, 'published', 1),
('Tyre Size Reading and Selection', 'Understand tyre size markings, load index, speed ratings and correct size selection.', 'tyre_sizing', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'beginner', 25, 15, 'published', 2),
('Tubeless Tyre Repair Techniques', 'Step-by-step guide to professional tubeless tyre repair and maintenance.', 'tyre_maintenance', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'intermediate', 35, 20, 'published', 3),
('Tyre Safety and Inspection', 'Identifying tyre wear, damage and safety risks. Best practices for safe operation.', 'tyre_safety', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'beginner', 20, 15, 'published', 4),
('Advanced Tyre Technology', 'Deep dive into radial vs bias tyres, compounds, construction and performance factors.', 'tyre_technology', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'advanced', 45, 25, 'published', 5),
('Customer Communication Skills', 'How to advise customers on tyre selection, explain fitment benefits and build trust.', 'customer_handling', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'beginner', 30, 15, 'published', 6);

-- Seed: Course Questions
INSERT IGNORE INTO course_questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_option, sort_order) VALUES
(1, 'What does Eurogrip primarily manufacture?', 'Four-wheeler tyres', 'Two-wheeler tyres', 'Truck tyres', 'Aircraft tyres', 'b', 1),
(1, 'Which of the following is a key Eurogrip product advantage?', 'Low cost only', 'High grip and durability', 'Available only online', 'Only for racing', 'b', 2),
(2, 'In a tyre marking 90/90-10, what does 90/90 represent?', 'Load index and speed', 'Width and aspect ratio', 'Diameter and pressure', 'None of the above', 'b', 1),
(2, 'What does the speed rating "H" indicate?', 'Up to 150 km/h', 'Up to 180 km/h', 'Up to 210 km/h', 'Up to 240 km/h', 'c', 2),
(3, 'What is the first step in tubeless tyre repair?', 'Apply sealant directly', 'Locate and mark the puncture', 'Remove the tyre from rim', 'Inflate the tyre', 'b', 1),
(4, 'When should a tyre be replaced for safety?', 'Every 6 months', 'When tread depth is below 1.6mm', 'Only when it bursts', 'After 10,000 km', 'b', 1),
(5, 'What is the main advantage of radial tyres over bias tyres?', 'Cheaper cost', 'Better heat dissipation and fuel efficiency', 'Easier to manufacture', 'Heavier weight', 'b', 1),
(6, 'What is the best approach when a customer asks for a cheaper tyre?', 'Always agree and fit the cheapest', 'Explain safety and value differences before recommending', 'Ignore their budget', 'Refuse to help', 'b', 1);

-- Seed: ToolBank Items
INSERT IGNORE INTO toolbank_items (item_name, category, description, credit_requirement, total_quantity, available_quantity, access_type, max_reservation_days, status) VALUES
('Digital Air Pressure Gauge', 'basic_tools', 'Professional digital tyre pressure gauge with accurate readings up to 200 PSI.', 20, 5, 5, 'individual', 7, 'active'),
('Tubeless Tyre Repair Kit', 'basic_tools', 'Complete tubeless puncture repair kit with plugging tools, rubber strips and cement.', 25, 10, 10, 'individual', 7, 'active'),
('Tyre Lever Set (3-piece)', 'basic_tools', 'Heavy-duty steel tyre levers for professional tyre mounting and demounting.', 15, 8, 8, 'individual', 7, 'active'),
('Professional Tyre Changer', 'advanced_equipment', 'Shared professional tyre changing machine for motorcycle and scooter tyres.', 50, 2, 2, 'shared', 3, 'active'),
('Wheel Balancing Machine', 'advanced_equipment', 'Dynamic wheel balancing machine for precise two-wheeler wheel balancing.', 60, 1, 1, 'shared', 2, 'active'),
('Eurogrip Branded Uniform', 'brand_visibility', 'Professional Eurogrip branded mechanic uniform (shirt and cap) with Ustaad branding.', 30, 50, 50, 'individual', 0, 'active'),
('Workshop Signboard', 'brand_visibility', 'Eurogrip Ustaad Network authorized workshop display board (3ft x 2ft).', 40, 20, 20, 'individual', 0, 'active'),
('Nitrogen Inflation Kit', 'basic_tools', 'Nitrogen tyre inflation adapter kit for improved pressure retention.', 35, 6, 6, 'individual', 7, 'active');

-- Seed: Demo Fitment Records
INSERT IGNORE INTO fitment_records (passport_id, mechanic_id, customer_mobile, customer_name, vehicle_category, vehicle_model, tyre_brand, tyre_model, tyre_size, axle_position, installation_date, verification_status, verification_level)
SELECT 'FP-2024-001', mp.id, '9876543210', 'Suresh Kumar', 'motorcycle', 'Honda CB Shine', 'Eurogrip', 'Protorq EX', '90/90-17', 'rear', '2024-01-15', 'customer_confirmed', 1
FROM mechanic_profiles mp WHERE mp.ustaad_id = 'UE-MH-00001';

INSERT IGNORE INTO fitment_records (passport_id, mechanic_id, customer_mobile, customer_name, vehicle_category, vehicle_model, tyre_brand, tyre_model, tyre_size, axle_position, installation_date, verification_status, verification_level)
SELECT 'FP-2024-002', mp.id, '9876543211', 'Priya Sharma', 'scooter', 'Honda Activa 6G', 'Eurogrip', 'Blaze BA S2', '90/100-10', 'front', '2024-01-20', 'verified', 2
FROM mechanic_profiles mp WHERE mp.ustaad_id = 'UE-MH-00001';

INSERT IGNORE INTO fitment_records (passport_id, mechanic_id, customer_mobile, customer_name, vehicle_category, vehicle_model, tyre_brand, tyre_model, tyre_size, axle_position, installation_date, verification_status, verification_level)
SELECT 'FP-2024-003', mp.id, '9876543212', 'Ajay Verma', 'motorcycle', 'Bajaj Pulsar 150', 'MRF', 'Zapper', '100/90-17', 'rear', '2024-01-22', 'customer_confirmed', 1
FROM mechanic_profiles mp WHERE mp.ustaad_id = 'UE-MH-00001';

