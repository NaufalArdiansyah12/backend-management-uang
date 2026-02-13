-- Migration: add 'weekly' to budgets.period ENUM
-- Safe to run on MySQL 5.7+ and MariaDB
USE management_uang;
ALTER TABLE budgets MODIFY period ENUM('weekly','monthly','yearly') NOT NULL;
