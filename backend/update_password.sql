USE tools_sharing;
UPDATE users SET password_hash = '$2a$10$uXRHjrdM6rZM1bKIfXxomemUb5GJN/5O7t9vxyvhg6oMRtUbReA16' WHERE username = 'admin';
SELECT username, password_hash FROM users WHERE username = 'admin';