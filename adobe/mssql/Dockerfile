FROM adobecoldfusion/coldfusion:latest-2021 as cf21

RUN wget --no-check-certificate -O /opt/coldfusion/cfusion/lib/mssql-jdbc-12.10.0.jre11.jar https://repo.maven.apache.org/maven2/com/microsoft/sqlserver/mssql-jdbc/12.10.0.jre11/mssql-jdbc-12.10.0.jre11.jar

FROM adobecoldfusion/coldfusion:latest-2023 as cf23

RUN wget --no-check-certificate -O /opt/coldfusion/cfusion/lib/mssql-jdbc-12.10.0.jre11.jar https://repo.maven.apache.org/maven2/com/microsoft/sqlserver/mssql-jdbc/12.10.0.jre11/mssql-jdbc-12.10.0.jre11.jar

FROM adobecoldfusion/coldfusion:latest-2025 as cf25

RUN wget --no-check-certificate -O /opt/coldfusion/cfusion/lib/mssql-jdbc-12.10.0.jre11.jar https://repo.maven.apache.org/maven2/com/microsoft/sqlserver/mssql-jdbc/12.10.0.jre11/mssql-jdbc-12.10.0.jre11.jar

FROM adobecoldfusion/coldfusion:latest as latest

RUN wget --no-check-certificate -O /opt/coldfusion/cfusion/lib/mssql-jdbc-12.10.0.jre11.jar https://repo.maven.apache.org/maven2/com/microsoft/sqlserver/mssql-jdbc/12.10.0.jre11/mssql-jdbc-12.10.0.jre11.jar