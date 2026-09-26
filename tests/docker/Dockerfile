# Local compatibility test only. Mirrors Windows XAMPP PHP/MariaDB generation; not a production image.
FROM php:8.2.12-apache
RUN docker-php-ext-install pdo_mysql
RUN printf '<Directory /var/www/html>\n    AllowOverride All\n    Require all granted\n</Directory>\n' > /etc/apache2/conf-available/idealight-test.conf \
    && a2enconf idealight-test
