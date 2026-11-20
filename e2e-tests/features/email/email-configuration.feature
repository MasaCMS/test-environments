@email @admin
Feature: Email configuration
  Administrators tell the site which mail server to use and check that
  the settings work.

  Background:
    Given I am logged in as an administrator

  Scenario: The mail server settings are saved
    When I save the mail server "smtp.example.test" on port "2525" with the user name "mailer" and TLS switched on
    Then the email settings show the mail server "smtp.example.test" on port "2525" with the user name "mailer" and TLS switched on

  Scenario: A working mail server passes the test
    Given the mail catcher is running
    When I test the email settings of the mail server "host.docker.internal" on port "1025"
    Then the test of the email settings says "Your email settings are valid"

  Scenario: A mail server that cannot be reached fails the test
    When I test the email settings of the mail server "unreachable.invalid" on port "2525"
    Then the test of the email settings says "Couldn't connect to host"
