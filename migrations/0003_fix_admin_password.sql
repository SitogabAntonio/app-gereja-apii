-- Fix admin password - replace plaintext with bcrypt hashed password
INSERT INTO users (username, password, role, is_active) 
VALUES ('admin3@gereja.com', '$2b$10$aw8vHzeiMjae4urRSPNe8.VpIPeUr43KsL1lUjHLVp9wYpD07A/qi', 'AdminGereja', 1);
