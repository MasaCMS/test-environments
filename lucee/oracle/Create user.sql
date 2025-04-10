-- -- Create user
-- CREATE USER c##masadb IDENTIFIED BY rootpassword
-- DEFAULT TABLESPACE "USERS"
-- TEMPORARY TABLESPACE "TEMP";

-- -- Set user roles
-- ALTER USER "c##masadb" DEFAULT ROLE "DBA";

-- DROP USER c##masadb CASCADE;

-- alter session set container = masaoracledb;

create pluggable database masaoracledb
admin user masadb identified by rootpassword
file_name_convert = ('/pdbseed/', '/masaoracledb/')
;

alter pluggable database masaoracledb open;

sys/rootpassword@localhost/masaoracledb as sysdba