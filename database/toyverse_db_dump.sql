-- ============================================================================
-- ToyVerse E-Commerce Platform - Self-Contained Database Dump
-- Generated for MySQL Workbench Import
-- Target MySQL Version: 8.0+
-- Storage Engine: InnoDB
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Safe & Non-Destructive: Contains no DROP DATABASE, DROP TABLE, or TRUNCATE statements.
-- ============================================================================

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

-- ----------------------------------------------------------------------------
-- 1. Database Creation
-- ----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `toyverse_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `toyverse_db`;

-- ----------------------------------------------------------------------------
-- 2. Table Structure for `users`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `address` TEXT DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Table Structure for `products`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `old_price` DECIMAL(10,2) DEFAULT NULL,
  `discount` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `stock` INT UNSIGNED NOT NULL DEFAULT 0,
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `reviews_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `description` TEXT DEFAULT NULL,
  `main_image` VARCHAR(500) NOT NULL DEFAULT '',
  `section` ENUM('regular', 'trending', 'new', 'handmade', 'bestseller', 'coming-soon') NOT NULL DEFAULT 'regular',
  `badge` VARCHAR(50) NOT NULL DEFAULT '',
  `recommended_age` VARCHAR(50) DEFAULT NULL,
  `brand` VARCHAR(100) DEFAULT NULL,
  `material` VARCHAR(100) DEFAULT NULL,
  `safety` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_code` (`code`),
  KEY `idx_products_category` (`category`),
  KEY `idx_products_section` (`section`),
  KEY `idx_products_stock` (`stock`),
  KEY `idx_products_price` (`price`),
  KEY `idx_products_is_active` (`is_active`),
  KEY `idx_products_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Table Structure for `product_images`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `display_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_product_images_product_id` (`product_id`),
  CONSTRAINT `fk_product_images_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Table Structure for `orders`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(50) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `address` TEXT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `delivery_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('Pending', 'Dispatched', 'Delivered', 'Not Available', 'Cancelled', 'Returned') NOT NULL DEFAULT 'Pending',
  `stock_deducted` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_order_number` (`order_number`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created_at` (`created_at`),
  CONSTRAINT `fk_orders_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Table Structure for `order_items`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED DEFAULT NULL,
  `product_code` VARCHAR(50) NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `product_image` VARCHAR(500) DEFAULT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_product_id` (`product_id`),
  CONSTRAINT `fk_order_items_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Table Structure for `stock_movements`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED DEFAULT NULL,
  `product_code` VARCHAR(50) NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `type` ENUM('IN', 'OUT') NOT NULL,
  `previous_qty` INT NOT NULL,
  `changed_qty` INT NOT NULL,
  `new_qty` INT NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `order_id` BIGINT UNSIGNED DEFAULT NULL,
  `performed_by` BIGINT UNSIGNED DEFAULT NULL,
  `performed_by_name` VARCHAR(100) DEFAULT NULL,
  `performed_by_role` VARCHAR(20) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_stock_movements_product_created` (`product_id`, `created_at`),
  KEY `idx_stock_movements_type` (`type`),
  KEY `idx_stock_movements_created_at` (`created_at`),
  KEY `idx_stock_movements_order_id` (`order_id`),
  KEY `idx_stock_movements_performed_by` (`performed_by`),
  CONSTRAINT `fk_stock_movements_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_stock_movements_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_stock_movements_user`
    FOREIGN KEY (`performed_by`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. Safe Catalog Seed Data (17 Toy Products from Frontend Specification)
-- ----------------------------------------------------------------------------
INSERT INTO `products` (`id`, `code`, `name`, `category`, `price`, `old_price`, `discount`, `stock`, `rating`, `reviews_count`, `description`, `main_image`, `section`, `badge`, `recommended_age`, `brand`, `material`, `safety`, `is_active`)
VALUES
(1, 'TOY-101', 'Turbo Racing Car', 'Cars & RC', 1299.00, 1699.00, 24, 40, 4.80, 234, 'A high-speed remote-controlled racing car with durable tires and realistic engine sounds.', 'https://images.pexels.com/photos/29582802/pexels-photo-29582802.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'bestseller', 'BEST SELLER', '6+', 'SpeedX', 'ABS Plastic', 'Non-toxic, BPA-free', 1),
(2, 'TOY-102', 'Cute Teddy Bear', 'Soft Toys', 899.00, 1199.00, 25, 55, 4.70, 189, 'An irresistibly soft teddy bear with heart decorations. The perfect cuddle companion for kids and gifting.', 'https://images.pexels.com/photos/35579568/pexels-photo-35579568.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'trending', 'TRENDING', '0+', 'HuggyBuddy', 'Plush Cotton', 'Hypoallergenic filling', 1),
(3, 'TOY-103', 'Magnetic Puzzle Set', 'Puzzles', 699.00, 999.00, 30, 38, 4.60, 156, 'A colorful magnetic puzzle set that sparks creativity and problem-solving with vibrant patterns.', 'https://images.pexels.com/photos/1240988/pexels-photo-1240988.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'new', 'NEW ARRIVAL', '4+', 'BrainyKids', 'Wood & Magnet', 'Smooth edges, child-safe paint', 1),
(4, 'TOY-104', 'Rainbow Building Blocks', 'Creative Toys', 599.00, 899.00, 33, 60, 4.90, 312, 'Brightly colored interlocking building blocks that inspire architectural imagination and motor skills.', 'https://images.pexels.com/photos/207923/pexels-photo-207923.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'bestseller', 'BEST SELLER', '3+', 'BlockWorld', 'Eco-friendly Plastic', 'Choke-hazard tested', 1),
(5, 'TOY-105', 'Interactive Robot Friend', 'Robots', 1999.00, 2499.00, 20, 30, 4.70, 98, 'A smart companion robot with voice recognition, dancing modes, and LED expressions.', 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'trending', 'TRENDING', '5+', 'RoboTech', 'ABS Plastic', 'RoHS certified electronics', 1),
(6, 'TOY-106', 'Superhero Action Figure', 'Action Figures', 799.00, 1099.00, 27, 28, 4.50, 145, 'Poseable superhero figure with detailed armor, interchangeable accessories, and dynamic articulation.', 'https://images.pexels.com/photos/163036/mario-luigi-yoshi-figures-163036.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'regular', '', '4+', 'HeroForge', 'Durable PVC', 'Lead-free paints', 1),
(7, 'TOY-107', 'Wooden Abacus Counter', 'Educational', 499.00, 699.00, 29, 45, 4.80, 201, 'Classic wooden abacus with smooth sliding beads for early math learning and counting fun.', 'https://images.pexels.com/photos/1148998/pexels-photo-1148998.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'handmade', 'HANDMADE', '2+', 'PlayLearn', 'Natural Beech Wood', 'Non-toxic water varnish', 1),
(8, 'TOY-108', 'Flying Disco Drone', 'Cars & RC', 1499.00, 1899.00, 21, 35, 4.40, 87, 'An easy-to-fly indoor drone with multi-color LED disco lights, altitude hold, and propeller guards.', 'https://images.pexels.com/photos/1087180/pexels-photo-1087180.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'trending', 'TRENDING', '8+', 'AeroPlay', 'Lightweight Composite', 'Propeller safety guards', 1),
(9, 'TOY-109', 'Animal Stacking Rings', 'Educational', 449.00, 599.00, 25, 32, 4.70, 167, 'Graduated colorful rings with cheerful animal toppers to develop spatial awareness and hand-eye coordination.', 'https://images.pexels.com/photos/279470/pexels-photo-279470.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'regular', '', '0+', 'TinySteps', 'Soft Silicone & Wood', 'Food-grade silicone, BPA-free', 1),
(10, 'TOY-110', 'Solar System Model Kit', 'Educational', 899.00, 1199.00, 25, 26, 4.80, 178, 'An interactive 3D solar system planetarium kit with glowing sun light and rotating orbits.', 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'bestseller', 'BEST SELLER', '7+', 'ScienceGeek', 'Polystyrene & Acrylic', 'Child-safe paints included', 1),
(11, 'TOY-111', 'Giant Plush Panda', 'Soft Toys', 1599.00, 1999.00, 20, 50, 4.90, 245, 'An oversized plush panda made of cloud-soft microfleece. Ideal for reading corners and sleepy cuddles.', 'https://images.pexels.com/photos/1661535/pexels-photo-1661535.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'trending', 'TRENDING', '0+', 'HuggyBuddy', 'Organic Cotton Plush', 'Hypoallergenic, machine washable', 1),
(12, 'TOY-112', 'Wooden Kitchen Playset', 'Creative Toys', 2499.00, 2999.00, 17, 4, 4.80, 134, 'Delightful miniature wooden play kitchen with turning knobs, pots, pans, and realistic wooden utensils.', 'https://images.pexels.com/photos/3661264/pexels-photo-3661264.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'handmade', 'HANDMADE', '3+', 'CraftyKids', 'Solid Birchwood', 'Eco-certified water-based colors', 1),
(13, 'TOY-113', 'Glow-in-the-Dark Jigsaw', 'Puzzles', 799.00, 999.00, 20, 30, 4.60, 112, 'A 500-piece fantasy galaxy puzzle with phosphorescent ink that reveals a secret celestial map at night.', 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'new', 'NEW ARRIVAL', '8+', 'NightOwl', 'Recycled Cardstock', 'Non-toxic luminous pigments', 1),
(14, 'TOY-114', 'Electronic Drum Pad', 'Creative Toys', 1799.00, 2299.00, 22, 24, 4.50, 89, 'A flexible roll-up silicone electronic drum set with 7 drum pads, stereo speakers, and headphone jack.', 'https://images.pexels.com/photos/164743/pexels-photo-164743.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'regular', '', '5+', 'BeatsMini', 'Silicone & ABS', 'Safe low-voltage power', 1),
(15, 'TOY-115', 'Classic Train Engine', 'Cars & RC', 999.00, 1299.00, 23, 44, 4.70, 198, 'Vintage die-cast steam locomotive engine with magnetic couplers and smooth rolling metallic wheels.', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'bestseller', 'BEST SELLER', '3+', 'RailMaster', 'Die-cast Alloy & Wood', 'Non-toxic chip-resistant finish', 1),
(16, 'TOY-116', 'Handmade Rag Doll', 'Soft Toys', 699.00, 899.00, 22, 2, 4.60, 76, 'Artisan-crafted cloth rag doll with hand-embroidered facial features and changeable linen outfit.', 'https://images.pexels.com/photos/1648377/pexels-photo-1648377.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'handmade', 'HANDMADE', '1+', 'HeritageCraft', 'Pure Linen & Wool Yarn', 'No buttons, 100% infant-safe', 1),
(17, 'TOY-117', 'Space Explorer Rover', 'Robots', 2499.00, NULL, 0, 0, 0.00, 0, 'A programmable moon-rover robot with a camera arm and glow-in-the-dark wheels. Launching soon!', 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'coming-soon', 'COMING SOON', '8+', 'StarKids', 'ABS Plastic', 'Non-toxic, BPA-free', 1)
ON DUPLICATE KEY UPDATE `code`=`code`;

-- ----------------------------------------------------------------------------
-- 9. Product Images Mapping (1:N Gallery)
-- ----------------------------------------------------------------------------
INSERT INTO `product_images` (`product_id`, `image_url`, `display_order`)
SELECT `id`, `main_image`, 0 FROM `products`
ON DUPLICATE KEY UPDATE `image_url`=`image_url`;

-- ----------------------------------------------------------------------------
-- 10. Initial Inventory Stock Ledger Ingestion
-- ----------------------------------------------------------------------------
INSERT INTO `stock_movements` (`product_id`, `product_code`, `product_name`, `type`, `previous_qty`, `changed_qty`, `new_qty`, `reason`, `performed_by_name`, `performed_by_role`)
SELECT `id`, `code`, `name`, 'IN', 0, `stock`, `stock`, 'Initial inventory catalog ingestion', 'System Setup', 'ADMIN'
FROM `products`
WHERE `stock` > 0
ON DUPLICATE KEY UPDATE `reason`=`reason`;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- ============================================================================
-- End of Database Dump
-- ============================================================================
