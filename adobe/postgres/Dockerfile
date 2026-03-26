FROM adobecoldfusion/coldfusion:latest-2021 as cf21

RUN wget --no-check-certificate -O /opt/coldfusion/cfusion/lib/mysql-connector-j-8.0.33.jar https://repo.maven.apache.org/maven2/com/mysql/mysql-connector-j/8.0.33/mysql-connector-j-8.0.33.jar

FROM adobecoldfusion/coldfusion:latest-2023 as cf23

RUN wget --no-check-certificate -O /opt/coldfusion/cfusion/lib/mysql-connector-j-8.0.33.jar https://repo.maven.apache.org/maven2/com/mysql/mysql-connector-j/8.0.33/mysql-connector-j-8.0.33.jar

FROM adobecoldfusion/coldfusion:latest-2025 as cf25

RUN wget --no-check-certificate -O /opt/coldfusion/cfusion/lib/mysql-connector-j-8.0.33.jar https://repo.maven.apache.org/maven2/com/mysql/mysql-connector-j/8.0.33/mysql-connector-j-8.0.33.jar

FROM adobecoldfusion/coldfusion:latest as latest

RUN wget --no-check-certificate -O /opt/coldfusion/cfusion/lib/mysql-connector-j-8.0.33.jar https://repo.maven.apache.org/maven2/com/mysql/mysql-connector-j/8.0.33/mysql-connector-j-8.0.33.jar
