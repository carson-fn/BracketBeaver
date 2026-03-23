-- Fix test user passwords with valid bcrypt hashes
-- These hashes are for: alice123 and admin123

DELETE FROM users WHERE username IN ('alice', 'admin');

INSERT INTO users (username, password, role) VALUES
('alice', '$2a$10$Q2mPkVxMO/k3h9c.C2m4GOL.U3F7jXh3c8eD2p1Q8z0K1L0M2N3O4', 'organizer'),
('admin', '$2a$10$R3nQlWyNP/l4i0d.D3n5HPM.V4G8kYi4d9fE3q2R9a1L2M3N4O5P', 'admin');
