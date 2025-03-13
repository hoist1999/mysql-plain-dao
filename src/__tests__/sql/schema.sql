-- CREATE DATABASE IF NOT EXISTS test_db;
-- USE test_db;
-- test table: user which has uuid and id as primary key
-- User table: Stores user account information and profile details
CREATE TABLE IF NOT EXISTS user (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Primary key, auto-incrementing identifier',
    uuid VARCHAR(36) NOT NULL COMMENT 'Unique identifier (UUID format) for external reference',
    username VARCHAR(50) NOT NULL COMMENT 'Unique username for login',
    email VARCHAR(100) NOT NULL COMMENT 'User email address, must be unique',
    password_hash VARCHAR(100) NOT NULL COMMENT 'Hashed password for user authentication',
    first_name VARCHAR(50) COMMENT 'User first name',
    last_name VARCHAR(50) COMMENT 'User last name',
    phone VARCHAR(20) COMMENT 'Contact phone number',
    is_active BOOLEAN DEFAULT true COMMENT 'Flag indicating if the user account is active',
    role ENUM('admin', 'user', 'guest') DEFAULT 'user' COMMENT 'User role for access control',
    last_login DATETIME COMMENT 'Timestamp of the last successful login',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the record was created',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp when the record was last updated',
    UNIQUE KEY uk_email (email),
    UNIQUE KEY uk_username (username),
    UNIQUE KEY uk_uuid (uuid)
) COMMENT 'Stores user account information including authentication and profile details';

CREATE TABLE IF NOT EXISTS news (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    view_count INT DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES user(id),
    INDEX idx_status (status),
    INDEX idx_author (author_id)
);

CREATE TABLE IF NOT EXISTS user_permission (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT true,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    UNIQUE KEY uk_user_permission_resource (
        user_id,
        permission_name,
        resource_type,
        resource_id
    ),
    INDEX idx_user_id (user_id),
    INDEX idx_permission_name (permission_name),
    INDEX idx_resource (resource_type, resource_id)
);

-- test table: book which has only uuid as primary key
CREATE TABLE IF NOT EXISTS book (
    uuid VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    author_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_uuid (uuid)
);

-- test table: category
CREATE TABLE IF NOT EXISTS category (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);