@anonymous
Feature: Admin login
  Administrators sign in to the Masa admin to manage content.

  Scenario: Signing in with valid credentials
    Given I am on the admin login page
    When I log in with valid administrator credentials
    Then I see the Site Manager

  Scenario: Signing in with a wrong password
    Given I am on the admin login page
    When I log in with a wrong password
    Then I am still on the admin login page
