FROM adobecoldfusion/coldfusion:latest-2021 as cf21

COPY ./common/mysql-connector-j-8.0.33.jar /opt/coldfusion/cfusion/lib/mysql-connector-j-8.0.33.jar

FROM adobecoldfusion/coldfusion:latest-2023 as cf23

COPY ./common/mysql-connector-j-8.0.33.jar /opt/coldfusion/cfusion/lib/mysql-connector-j-8.0.33.jar

FROM adobecoldfusion/coldfusion:latest-2025 as cf25

COPY ./common/mysql-connector-j-8.0.33.jar /opt/coldfusion/cfusion/lib/mysql-connector-j-8.0.33.jar

FROM adobecoldfusion/coldfusion:latest as latest

COPY ./common/mysql-connector-j-8.0.33.jar /opt/coldfusion/cfusion/lib/mysql-connector-j-8.0.33.jar