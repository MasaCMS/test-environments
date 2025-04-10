-- Create user
CREATE user c##masadb IDENTIFIED BY rootpassword;
DEFAULT TABLESPACE "USERS"
TEMPORARY TABLESPACE "TEMP";

-- Set user roles
ALTER USER "masadb" DEFAULT ROLE "DBA";
