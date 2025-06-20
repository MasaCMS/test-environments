FROM adobecoldfusion/coldfusion:latest-2021 as cf21

COPY ./common/mssql-jdbc-12.10.0.jre11.jar /opt/coldfusion/cfusion/lib/mssql-jdbc-12.10.0.jre11.jar

FROM adobecoldfusion/coldfusion:latest-2023 as cf23

COPY ./common/mssql-jdbc-12.10.0.jre11.jar /opt/coldfusion/cfusion/lib/mssql-jdbc-12.10.0.jre11.jar

FROM adobecoldfusion/coldfusion:latest-2025 as cf25

COPY ./common/mssql-jdbc-12.10.0.jre11.jar /opt/coldfusion/cfusion/lib/mssql-jdbc-12.10.0.jre11.jar

FROM adobecoldfusion/coldfusion:latest as latest

COPY ./common/mssql-jdbc-12.10.0.jre11.jar /opt/coldfusion/cfusion/lib/mssql-jdbc-12.10.0.jre11.jar